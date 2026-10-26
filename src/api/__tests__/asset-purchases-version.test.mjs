import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SourceTextModule, SyntheticModule } from "node:vm";

const loadApi = async ({ client = {}, mutateFn = () => {} } = {}) => {
  const source = await readFile(new URL("../asset-purchases.js", import.meta.url), "utf8");
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
      return new SyntheticModule(["default", "mutate"], function () {
        this.setExport("default", unusedHook);
        this.setExport("mutate", mutateFn);
      });
    }
    if (specifier === "utils/axios") {
      return new SyntheticModule(["default", "fetcher"], function () {
        this.setExport("default", client);
        this.setExport("fetcher", unusedHook);
      });
    }
    if (specifier === "utils/idempotency") {
      return new SyntheticModule(["generateIdempotencyKey"], function () {
        this.setExport("generateIdempotencyKey", () => "mock-idempotency-key-12345");
      });
    }
    assert.fail(`Unexpected import: ${specifier}`);
  });

  await api.evaluate();
  return api.namespace;
};

test("isVersionConflict correctly detects 409 VERSION_CONFLICT and stale version errors", async () => {
  const api = await loadApi();
  assert.equal(typeof api.isVersionConflict, "function");

  // Direct diagnostic code
  assert.equal(api.isVersionConflict({ diagnostic: { code: 'VERSION_CONFLICT', message: 'Data telah diubah' } }), true);

  // Axios error rejection shape
  assert.equal(api.isVersionConflict({
    response: {
      status: 409,
      data: {
        diagnostic: { code: 'VERSION_CONFLICT', message: 'Versi data sudah berubah' }
      }
    }
  }), true);

  // HTTP 409 with version string in code
  assert.equal(api.isVersionConflict({
    status: 409,
    code: 'STALE_VERSION'
  }), true);

  // Non-conflict errors
  assert.equal(api.isVersionConflict({
    diagnostic: { code: 'VALIDATION_ERROR', message: 'Bidang wajib diisi' }
  }), false);

  assert.equal(api.isVersionConflict({
    response: {
      status: 400,
      data: { diagnostic: { code: 'BAD_REQUEST' } }
    }
  }), false);

  assert.equal(api.isVersionConflict(null), false);
  assert.equal(api.isVersionConflict(undefined), false);
});

test("assetMutation includes If-Match header and triggers cache invalidation", async () => {
  let requestedConfig = null;
  let invalidatedFilter = null;

  const mockClient = {
    request: async (config) => {
      requestedConfig = config;
      return { data: { diagnostic: { error: false }, rows: { id: 10, version: 2 } } };
    }
  };

  const mockMutate = async (matcher, data, opts) => {
    invalidatedFilter = { matcher, data, opts };
    return [];
  };

  const api = await loadApi({ client: mockClient, mutateFn: mockMutate });

  const result = await api.assetMutation('put', '/asset-purchases/10', { purpose: 'Update tujuan' }, 1);

  // Assert return data
  assert.equal(result.diagnostic.error, false);
  assert.equal(result.rows.version, 2);

  // Assert headers: If-Match should be passed
  assert.equal(requestedConfig.headers['If-Match'], '1');
  assert.equal(typeof requestedConfig.headers['Idempotency-Key'], 'string');

  // Assert cache invalidation was triggered
  assert.ok(invalidatedFilter);
  assert.equal(typeof invalidatedFilter.matcher, 'function');
  assert.equal(invalidatedFilter.opts?.revalidate, true);

  // Test that matcher invalidates both /asset-* and /financing-* keys
  assert.equal(invalidatedFilter.matcher('/asset-purchases/10'), true);
  assert.equal(invalidatedFilter.matcher('/financing-contracts'), true);
  assert.equal(invalidatedFilter.matcher('/master/suppliers'), false);
});
