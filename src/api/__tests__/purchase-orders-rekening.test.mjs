import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";

// Exercise the real API module with an injected transport, without a browser or session.
const loadApi = async (client) => {
  const source = await readFile(new URL("../purchase-orders.js", import.meta.url), "utf8");
  const api = new SourceTextModule(source);
  const unusedHook = () => { throw new Error("Hooks are not used in API contract tests"); };
  await api.link((specifier) => {
    if (specifier === "react") {
      const hooks = ["useEffect", "useMemo", "useRef", "useState"];
      return new SyntheticModule(hooks, function () {
        hooks.forEach((name) => this.setExport(name, unusedHook));
      });
    }
    if (specifier === "swr") {
      return new SyntheticModule(["default"], function () { this.setExport("default", unusedHook); });
    }
    assert.equal(specifier, "utils/axios");
    return new SyntheticModule(["default", "fetcher"], function () {
      this.setExport("default", client);
      this.setExport("fetcher", unusedHook);
    });
  });
  await api.evaluate();
  return api.namespace;
};

const success = (rows) => ({ data: { diagnostic: { error: false }, rows } });

const loadHeaderPayload = async () => {
  const source = await readFile(new URL("../../views/scm/purchasing-orders/headerPayload.js", import.meta.url), "utf8");
  const helperModule = new SourceTextModule(source);
  await helperModule.link(() => assert.fail("header payload helper must be dependency-free"));
  await helperModule.evaluate();
  return helperModule.namespace.buildPurchaseOrderHeaderPayload;
};

test("the functions imported by the bank dialog are exported", async () => {
  const api = await loadApi({});
  assert.equal(typeof api.getPurchaseOrderRekeningOptions, "function");
  assert.equal(typeof api.updatePurchaseOrderHeader, "function");
});

test("bank options use supplier ID and exclude foreign and inactive accounts", async () => {
  const signal = new AbortController().signal;
  const api = await loadApi({ get: async (url, config) => {
    assert.equal(url, "/master/pemasok/21/rekening");
    assert.equal(config.signal, signal);
    assert.equal(config.skipOfflineQueue, true);
    return success([
      { id: 8, pemasok_id: 21, aktif: "Y", no_rekening: "00123" },
      { id: 9, pemasok_id: 22, aktif: "Y" },
      { id: 10, pemasok_id: 21, aktif: "N" },
    ]);
  } });
  assert.deepEqual(await api.getPurchaseOrderRekeningOptions(21, { signal }), [
    { id: 8, pemasok_id: 21, aktif: "Y", no_rekening: "00123" },
  ]);
});

test("missing supplier IDs do not issue malformed requests", async () => {
  const api = await loadApi({ get: async () => assert.fail("must not request without supplier ID") });
  for (const id of [null, undefined, "", "  "]) {
    await assert.rejects(api.getPurchaseOrderRekeningOptions(id), /Pemasok PO tidak ditemukan/);
  }
});

test("header update uses the PO ID and preserves new account text", async () => {
  const payload = { nm_bank: "BCA", no_rekening: "0012345678901234567890", an: "PT Pemasok" };
  const api = await loadApi({ put: async (url, body, config) => {
    assert.equal(url, "/scm/purchase-orders/7/header");
    assert.deepEqual(body, payload);
    assert.equal(config.skipOfflineQueue, true);
    return success({ id: 7, rekening_id: 8 });
  } });
  assert.equal((await api.updatePurchaseOrderHeader(7, payload)).rows.rekening_id, 8);
});

test("HTTP 200 business errors reject bank loading and saving", async () => {
  const failed = async () => ({ data: { diagnostic: { error: true, message: "Rekening bukan milik pemasok" } } });
  const api = await loadApi({ get: failed, put: failed });
  await assert.rejects(api.getPurchaseOrderRekeningOptions(21), /bukan milik pemasok/);
  await assert.rejects(api.updatePurchaseOrderHeader(7, { rekening_id: 9 }), /bukan milik pemasok/);
});

test("decoded API errors remain available to the dialog", async () => {
  const error = { diagnostic: { error: true, message: "Anda tidak memiliki hak akses memperbarui PO." } };
  const api = await loadApi({ put: async () => { throw error; } });
  await assert.rejects(api.updatePurchaseOrderHeader(7, { rekening_id: 8 }), (received) => {
    assert.equal(api.getPurchaseOrderError(received).message, error.diagnostic.message);
    return true;
  });
});

test("an offline queued response is not treated as a successful save", async () => {
  const api = await loadApi({ put: async () => ({ status: 0 }) });
  await assert.rejects(api.updatePurchaseOrderHeader(7, {}), /Gagal menyimpan/);
});

test("changing a PO bank account never sends the normal priority that caused the SQL error", async () => {
  const build = await loadHeaderPayload();
  const payload = build({ initialMode: "rekening", selectedRekeningId: "1009", prioritas: "normal", narasi: "unchanged" });
  assert.deepEqual(payload, { rekening_id: 1009 });
  const api = await loadApi({ put: async (url, body) => {
    assert.equal(url, "/scm/purchase-orders/13469/header");
    assert.deepEqual(body, { rekening_id: 1009 });
    return success({ id: 13469, rekening_id: 1009 });
  } });
  await api.updatePurchaseOrderHeader(13469, payload);
});

test("adding a bank account sends only account fields and preserves leading zeros", async () => {
  const build = await loadHeaderPayload();
  assert.deepEqual(build({
    initialMode: "new_rekening", modeRekening: "new", nmBank: " BCA ",
    noRekening: " 0012345678901234567890 ", an: " PT Pemasok ", prioritas: "urgent", narasi: "unchanged",
  }), { nm_bank: "BCA", no_rekening: "0012345678901234567890", an: "PT Pemasok" });
});

test("narration edits do not alter the account or priority or require bank inputs", async () => {
  const build = await loadHeaderPayload();
  assert.deepEqual(build({ initialMode: "narasi", narasi: "Catatan baru", modeRekening: "new", prioritas: "normal" }), {
    narasi: "Catatan baru",
  });
});

test("full header edits accept P1-P4 and omit an unspecified priority", async () => {
  const build = await loadHeaderPayload();
  for (const prioritas of ["P1", "P2", "P3", "P4"]) {
    assert.equal(build({ initialMode: "all", prioritas }).prioritas, prioritas);
  }
  assert.deepEqual(build({ initialMode: "all", prioritas: "", selectedRekeningId: "1009" }), {
    narasi: "", rekening_id: 1009,
  });
  for (const prioritas of ["normal", "urgent", "P5"]) {
    assert.throws(() => build({ initialMode: "all", prioritas }), /Prioritas PO harus/);
  }
});
