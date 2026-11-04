import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getSatuanOrder,
  getSatuanPakai,
  getStokOrderValue,
  getStokPakaiValue,
  hasConversionHelper,
  formatConversionHelper,
  formatCartStokLabel,
  isItemInsufficient,
  getStokBadgeStatus,
  buildCartItem,
  buildManualCartItem,
  buildSubmitPayload
} from '../materialRequestHelpers.js';

describe('Material Request UOM and Stock Helpers (PRD-BUGFIX-MR-001-v1.0)', () => {
  const sampleDrumItem = {
    id: 3317,
    kode: 'C01A0M00B000-01787',
    nama: 'MOB TRANS HD 50 (DR 208LT)',
    satuan_order: 'drum',
    satuan_pakai: 'liter',
    pembagi_pakai: 208.0,
    stok_order: 1.011808,
    stok_pakai: 210.455984
  };

  const sampleSimpleItem = {
    id: 100,
    kode: 'FLTR-001',
    nama: 'Oil Filter 100',
    satuan_order: 'pcs',
    satuan_pakai: 'pcs',
    pembagi_pakai: 1,
    stok_order: 15,
    stok_pakai: 15
  };

  describe('AC-MR-01: Satuan Order pada Kolom SAT', () => {
    it('returns satuan_order when available', () => {
      assert.equal(getSatuanOrder(sampleDrumItem), 'drum');
    });

    it('falls back to satuan if satuan_order is missing', () => {
      assert.equal(getSatuanOrder({ satuan: 'box' }), 'box');
    });

    it('returns "-" when neither is present', () => {
      assert.equal(getSatuanOrder({}), '-');
    });
  });

  describe('AC-MR-02: Stok Order pada Kolom STOK', () => {
    it('returns stok_order when available', () => {
      assert.equal(getStokOrderValue(sampleDrumItem), 1.011808);
    });

    it('preserves 0 value for stok_order', () => {
      assert.equal(getStokOrderValue({ stok_order: 0 }), 0);
    });

    it('falls back to stok when stok_order is null/undefined', () => {
      assert.equal(getStokOrderValue({ stok: 5 }), 5);
      assert.equal(getStokOrderValue({}), 0);
    });
  });

  describe('AC-MR-03: Helper Konversi Sekunder', () => {
    it('identifies item needing conversion helper (pembagi > 1 and different UOM)', () => {
      assert.equal(hasConversionHelper(sampleDrumItem), true);
    });

    it('does not show conversion if pembagi_pakai <= 1', () => {
      assert.equal(hasConversionHelper(sampleSimpleItem), false);
    });

    it('does not show conversion if satuan_pakai equals satuan_order', () => {
      assert.equal(hasConversionHelper({ pembagi_pakai: 10, satuan_order: 'drum', satuan_pakai: 'drum' }), false);
    });

    it('formats conversion helper accurately with id-ID locale', () => {
      const helper = formatConversionHelper(sampleDrumItem);
      // 1.011808 * 208 = 210.455984 -> '210,46 liter'
      assert.match(helper, /^~ 210,46 liter$/);
    });
  });

  describe('AC-MR-04: Panel Keranjang Satuan Pakai & Badge Stok', () => {
    it('builds cart item using satuan_pakai for qty/satuan/uom_used and keeps stok_order info', () => {
      const cartItem = buildCartItem(sampleDrumItem);
      assert.equal(cartItem.satuan, 'liter');
      assert.equal(cartItem.uom_used, 'liter');
      assert.equal(cartItem.qty, 1);
      assert.equal(cartItem.satuan_order, 'drum');
      assert.equal(cartItem.stok_order, 1.011808);
      assert.equal(cartItem.stok_pakai, 210.455984);
    });

    it('formats cart badge label with stok_order and satuan_order', () => {
      const cartItem = buildCartItem(sampleDrumItem);
      assert.equal(formatCartStokLabel(cartItem), 'Stok: 1.011808 drum');
    });

    it('checks insufficiency based on stok_pakai, not stok_order (prevents false insufficient warnings)', () => {
      const cartItem = buildCartItem(sampleDrumItem);
      // Requesting 50 liter:
      // In drum, 1.01 < 50, but in liter 210.46 >= 50. Must NOT be insufficient!
      cartItem.qty = 50;
      assert.equal(isItemInsufficient(cartItem), false);

      // Requesting 300 liter:
      // 210.46 < 300. Must be insufficient!
      cartItem.qty = 300;
      assert.equal(isItemInsufficient(cartItem), true);
    });

    it('builds manual cart item correctly', () => {
      const manual = buildManualCartItem({ narasi: 'Custom Seal', uom_used: 'pcs', qty: 2, aliaspart: 'SEAL-01' }, 0);
      assert.equal(manual.isManual, true);
      assert.equal(manual.nama, 'Custom Seal');
      assert.equal(manual.satuan, 'pcs');
      assert.equal(manual.uom_used, 'pcs');
      assert.equal(manual.qty, 2);
      assert.equal(isItemInsufficient(manual), false);
    });
  });

  describe('Payload Submit Integrity', () => {
    it('builds submit payload preserving uom_used and qty in satuan pakai', () => {
      const cart = [
        buildCartItem(sampleDrumItem),
        buildManualCartItem({ narasi: 'Baut 10mm', uom_used: 'pcs', qty: 5 }, 1)
      ];
      cart[0].qty = 25; // 25 liter

      const payload = buildSubmitPayload(1, cart);
      assert.equal(payload.gudang_id, 1);
      assert.equal(payload.items.length, 2);

      assert.deepEqual(payload.items[0], {
        barang_id: 3317,
        qty: 25,
        uom_used: 'liter',
        narasi: '',
        aliaspart: ''
      });

      assert.deepEqual(payload.items[1], {
        barang_id: null,
        qty: 5,
        uom_used: 'pcs',
        narasi: 'Baut 10mm',
        aliaspart: ''
      });
    });
  });

  describe('DEF-MR-001-01 / AC-QA-02: Evaluasi Kecukupan StokBadge Langkah 3', () => {
    it('evaluates sufficiency correctly when drum item (stok 1.011808 drum, 210.46 liter) requested 5 liter', () => {
      const cartItem = buildCartItem(sampleDrumItem);
      cartItem.qty = 5;
      assert.equal(isItemInsufficient(cartItem), false);
      const badgeStatus = getStokBadgeStatus({
        stokOrder: cartItem.stok_order,
        satuanOrder: cartItem.satuan_order,
        stokPakai: cartItem.stok_pakai,
        qty: cartItem.qty,
        kurang: isItemInsufficient(cartItem)
      });
      assert.equal(badgeStatus, 'cukup');
    });

    it('evaluates insufficiency correctly when drum item requested 250 liter (exceeding 210.46 liter)', () => {
      const cartItem = buildCartItem(sampleDrumItem);
      cartItem.qty = 250;
      assert.equal(isItemInsufficient(cartItem), true);
      const badgeStatus = getStokBadgeStatus({
        stokOrder: cartItem.stok_order,
        satuanOrder: cartItem.satuan_order,
        stokPakai: cartItem.stok_pakai,
        qty: cartItem.qty,
        kurang: isItemInsufficient(cartItem)
      });
      assert.equal(badgeStatus, 'kurang');
    });

    it('returns "habis" if stok_order is 0 or less', () => {
      assert.equal(
        getStokBadgeStatus({
          stokOrder: 0,
          satuanOrder: 'drum',
          stokPakai: 0,
          qty: 5,
          kurang: true
        }),
        'habis'
      );
    });

    it('supports evaluating directly from stokPakai when kurang boolean is not explicitly provided', () => {
      assert.equal(
        getStokBadgeStatus({
          stokOrder: 1.011808,
          satuanOrder: 'drum',
          stokPakai: 210.455984,
          qty: 5
        }),
        'cukup'
      );
      assert.equal(
        getStokBadgeStatus({
          stokOrder: 1.011808,
          satuanOrder: 'drum',
          stokPakai: 210.455984,
          qty: 250
        }),
        'kurang'
      );
    });
  });
});
