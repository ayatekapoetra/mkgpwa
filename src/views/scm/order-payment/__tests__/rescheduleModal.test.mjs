import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";

import {
  canRescheduleDueDate,
  normalizeDateString,
  validateRescheduleInput,
  shouldDisableSubmit,
  buildReschedulePayload,
  getRescheduleButtonState,
  shouldRenderRescheduleButton,
} from "../rescheduleDueDateHelpers.js";

test("Reschedule Due Date - Validation: Alasan < 10 karakter -> invalid", () => {
  // Empty reason
  const emptyRes = validateRescheduleInput({
    new_due_date: "2026-11-20",
    reason: "",
  });
  assert.equal(emptyRes.isValid, false);
  assert.match(emptyRes.errors.reason, /minimal 10 karakter/);
  assert.equal(
    shouldDisableSubmit({
      new_due_date: "2026-11-20",
      reason: "",
    }),
    true
  );

  // 9 characters string
  const shortRes = validateRescheduleInput({
    new_due_date: "2026-11-20",
    reason: "123456789",
  });
  assert.equal(shortRes.isValid, false);
  assert.match(shortRes.errors.reason, /minimal 10 karakter/);
  assert.equal(
    shouldDisableSubmit({
      new_due_date: "2026-11-20",
      reason: "123456789",
    }),
    true
  );

  // Whitespace only or trimmed to < 10 characters
  const whitespaceRes = validateRescheduleInput({
    new_due_date: "2026-11-20",
    reason: "   abc   ",
  });
  assert.equal(whitespaceRes.isValid, false);
  assert.match(whitespaceRes.errors.reason, /minimal 10 karakter/);
  assert.equal(
    shouldDisableSubmit({
      new_due_date: "2026-11-20",
      reason: "   abc   ",
    }),
    true
  );
});

test("Reschedule Due Date - Validation: Alasan >= 10 karakter & tanggal valid -> valid", () => {
  // Exactly 10 characters
  const exactTenRes = validateRescheduleInput({
    new_due_date: "2026-11-20",
    reason: "1234567890",
  });
  assert.equal(exactTenRes.isValid, true);
  assert.deepEqual(exactTenRes.errors, {});
  assert.equal(
    shouldDisableSubmit({
      new_due_date: "2026-11-20",
      reason: "1234567890",
    }),
    false
  );

  // Realistic explanation > 10 characters
  const validRes = validateRescheduleInput({
    new_due_date: "2026-11-30",
    invoice_date: "2026-10-15",
    reason: "Penundaan disepakati bersama supplier karena kendala pengiriman.",
  });
  assert.equal(validRes.isValid, true);
  assert.deepEqual(validRes.errors, {});
  assert.equal(
    shouldDisableSubmit({
      new_due_date: "2026-11-30",
      invoice_date: "2026-10-15",
      reason: "Penundaan disepakati bersama supplier karena kendala pengiriman.",
    }),
    false
  );
});

test("Reschedule Due Date - Validation: Tanggal baru wajib dan tidak boleh sebelum tanggal faktur", () => {
  // Missing due date
  const missingDate = validateRescheduleInput({
    new_due_date: "",
    reason: "Alasan perubahan valid lebih dari sepuluh karakter",
  });
  assert.equal(missingDate.isValid, false);
  assert.match(missingDate.errors.new_due_date, /wajib dipilih/);
  assert.equal(
    shouldDisableSubmit({
      new_due_date: "",
      reason: "Alasan perubahan valid lebih dari sepuluh karakter",
    }),
    true
  );

  // Due date earlier than invoice date
  const earlierDate = validateRescheduleInput({
    new_due_date: "2026-10-10",
    invoice_date: "2026-10-15",
    reason: "Alasan penundaan minimal 10 karakter...",
  });
  assert.equal(earlierDate.isValid, false);
  assert.match(earlierDate.errors.new_due_date, /tidak boleh sebelum tanggal faktur/);
  assert.equal(
    shouldDisableSubmit({
      new_due_date: "2026-10-10",
      invoice_date: "2026-10-15",
      reason: "Alasan penundaan minimal 10 karakter...",
    }),
    true
  );

  // Due date same as invoice date -> valid
  const sameDate = validateRescheduleInput({
    new_due_date: "2026-10-15",
    invoice_date: "2026-10-15",
    reason: "Alasan penundaan minimal 10 karakter...",
  });
  assert.equal(sameDate.isValid, true);

  // Due date after invoice date -> valid
  const afterDate = validateRescheduleInput({
    new_due_date: "2026-10-25",
    invoice_date: "2026-10-15",
    reason: "Alasan penundaan minimal 10 karakter...",
  });
  assert.equal(afterDate.isValid, true);
});

test("Reschedule Due Date - Permission Check: Approval === 'Y' / can_reschedule_due_date", () => {
  // Allowed permissions
  assert.equal(canRescheduleDueDate({ approval: "Y" }), true);
  assert.equal(canRescheduleDueDate({ approval: "y" }), true);
  assert.equal(canRescheduleDueDate({ approval: "1" }), true);
  assert.equal(canRescheduleDueDate({ approval: true }), true);
  assert.equal(canRescheduleDueDate({ approve: true }), true);
  assert.equal(canRescheduleDueDate({ approve: "Y" }), true);
  assert.equal(canRescheduleDueDate({ can_reschedule_due_date: true }), true);
  assert.equal(canRescheduleDueDate({ permissions: { approval: "Y" } }), true);
  assert.equal(canRescheduleDueDate({ permissions: { approve: true } }), true);
  assert.equal(canRescheduleDueDate({ permissions: { can_reschedule_due_date: true } }), true);

  // Denied permissions (no approval flag)
  assert.equal(canRescheduleDueDate(null), false);
  assert.equal(canRescheduleDueDate(undefined), false);
  assert.equal(canRescheduleDueDate({}), false);
  assert.equal(canRescheduleDueDate({ approval: "N" }), false);
  assert.equal(canRescheduleDueDate({ approval: false }), false);
  assert.equal(canRescheduleDueDate({ permissions: { update: true, approval: "N" } }), false);
  assert.equal(canRescheduleDueDate({ permissions: { update: true, validate: true } }), false);
  assert.equal(canRescheduleDueDate({ permissions: { read: true, insert: true } }), false);
});

test("Reschedule Due Date - Button Render: Rendered only when user has approval permission", () => {
  // getRescheduleButtonState
  const allowedState = getRescheduleButtonState({ approval: "Y" });
  assert.equal(allowedState.canRender, true);
  assert.equal(allowedState.disabled, false);
  assert.equal(allowedState.visible, true);

  const deniedState = getRescheduleButtonState({ update: true, approval: "N" });
  assert.equal(deniedState.canRender, false);
  assert.equal(deniedState.disabled, true);
  assert.equal(deniedState.visible, false);

  // shouldRenderRescheduleButton check
  assert.equal(shouldRenderRescheduleButton({ approval: "Y" }), true);
  assert.equal(shouldRenderRescheduleButton({ can_reschedule_due_date: true }), true);
  assert.equal(shouldRenderRescheduleButton({ permissions: { approval: "Y" } }), true);
  assert.equal(shouldRenderRescheduleButton({ permissions: { update: true, approval: "N" } }), false);
  assert.equal(shouldRenderRescheduleButton(null), false);
});

test("Reschedule Due Date - Payload Builder: matches POST /api/faktur-beli/:id/reschedule-due-date", () => {
  const payloadWithNullTermin = buildReschedulePayload({
    new_due_date: "2026-11-25",
    reason: "Alasan penundaan minimal 10 karakter...",
    termin_id: null,
  });
  assert.deepEqual(payloadWithNullTermin, {
    new_due_date: "2026-11-25",
    reason: "Alasan penundaan minimal 10 karakter...",
    termin_id: null,
  });

  const payloadWithTermin = buildReschedulePayload({
    new_due_date: "2026-12-01",
    reason: "Jadwal termin kedua diundur",
    termin_id: 42,
  });
  assert.deepEqual(payloadWithTermin, {
    new_due_date: "2026-12-01",
    reason: "Jadwal termin kedua diundur",
    termin_id: 42,
  });
});

test("Reschedule Due Date - API Integration: POST /api/faktur-beli/:id/reschedule-due-date handling", async () => {
  const source = await readFile(new URL("../../../../api/order-payments.js", import.meta.url), "utf8");
  const api = new SourceTextModule(source);
  const unusedHook = () => { throw new Error("Hooks are not used in API contract tests"); };

  let capturedRequest = null;
  const mockClient = {
    post: async (url, body, config) => {
      capturedRequest = { url, body, config };
      if (body?.reason === "FORBIDDEN_USER") {
        const error = new Error("Anda tidak memiliki hak persetujuan untuk mengubah tanggal jatuh tempo");
        error.status = 403;
        error.response = {
          status: 403,
          data: {
            diagnostic: {
              error: "Anda tidak memiliki hak persetujuan untuk mengubah tanggal jatuh tempo",
            },
          },
        };
        throw error;
      }
      return {
        data: {
          diagnostic: { error: false },
          rows: { id: 101, due_date: body.new_due_date, rescheduled: true },
        },
      };
    },
  };

  await api.link((specifier) => {
    if (specifier === "react") {
      const hooks = ["useMemo", "useEffect", "useCallback", "useState", "useRef"];
      return new SyntheticModule(hooks, function () {
        hooks.forEach((name) => this.setExport(name, unusedHook));
      });
    }
    if (specifier === "swr") {
      return new SyntheticModule(["default"], function () {
        this.setExport("default", unusedHook);
      });
    }
    assert.equal(specifier, "utils/axios");
    return new SyntheticModule(["default", "fetcher"], function () {
      this.setExport("default", mockClient);
      this.setExport("fetcher", unusedHook);
    });
  });

  await api.evaluate();
  const { rescheduleDueDate } = api.namespace;

  // 1. Success case: HTTP 200
  const payload = {
    new_due_date: "2026-11-30",
    reason: "Alasan penundaan minimal 10 karakter...",
    termin_id: null,
  };
  const result = await rescheduleDueDate(101, payload);
  assert.equal(capturedRequest.url, "/api/faktur-beli/101/reschedule-due-date");
  assert.deepEqual(capturedRequest.body, payload);
  assert.equal(result.rescheduled, true);
  assert.equal(result.due_date, "2026-11-30");

  // 2. Authorization Failure case: HTTP 403
  await assert.rejects(
    rescheduleDueDate(101, {
      new_due_date: "2026-11-30",
      reason: "FORBIDDEN_USER",
      termin_id: null,
    }),
    (err) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /Anda tidak memiliki hak persetujuan untuk mengubah tanggal jatuh tempo/);
      return true;
    }
  );
});
