/**
 * Helper utilities for Material Request UOM and Stock calculations
 * PRD: PRD-BUGFIX-MR-001-v1.0.md
 * AC: AC-MR-01, AC-MR-02, AC-MR-03, AC-MR-04
 */

export function getSatuanOrder(item = {}) {
  return item?.satuan_order || item?.satuan || '-';
}

export function getSatuanPakai(item = {}) {
  return item?.satuan_pakai || item?.satuan_order || item?.satuan || '';
}

export function getStokOrderValue(item = {}) {
  if (item?.stok_order !== undefined && item?.stok_order !== null) {
    return item.stok_order;
  }
  return item?.stok ?? 0;
}

export function getStokPakaiValue(item = {}) {
  if (item?.stok_pakai !== undefined && item?.stok_pakai !== null) {
    return Number(item.stok_pakai);
  }
  const stokOrder = Number(getStokOrderValue(item) || 0);
  const pembagi = Number(item?.pembagi_pakai || 1);
  return stokOrder * (pembagi > 0 ? pembagi : 1);
}

export function hasConversionHelper(item = {}) {
  const pembagi = Number(item?.pembagi_pakai || 1);
  const stnPakai = item?.satuan_pakai || '';
  const stnOrder = item?.satuan_order || item?.satuan || '';
  return pembagi > 1 && Boolean(stnPakai) && Boolean(stnOrder) && stnPakai !== stnOrder;
}

export function formatConversionHelper(item = {}) {
  if (!hasConversionHelper(item)) return '';
  const stokOrder = Number(getStokOrderValue(item) || 0);
  const pembagi = Number(item?.pembagi_pakai || 1);
  const stokPakaiEquiv = stokOrder * pembagi;
  const formatted = stokPakaiEquiv.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  return `~ ${formatted} ${item.satuan_pakai}`;
}

export function formatCartStokLabel(cartItem = {}) {
  const stokOrder = getStokOrderValue(cartItem);
  const stnOrder = cartItem?.satuan_order ? ` ${cartItem.satuan_order}` : '';
  return `Stok: ${stokOrder}${stnOrder}`.trim();
}

export function isItemInsufficient(cartItem = {}) {
  if (cartItem?.isManual) return false;
  const stokPakai = getStokPakaiValue(cartItem);
  const qty = Number(cartItem?.qty || 0);
  return stokPakai < qty;
}

export function buildCartItem(barang = {}) {
  const satuanPakai = getSatuanPakai(barang);
  const satuanOrder = barang?.satuan_order || barang?.satuan || '';
  const pembagiPakai = Number(barang?.pembagi_pakai || 1);
  const stokOrder = getStokOrderValue(barang);
  const stokPakai = getStokPakaiValue(barang);

  return {
    uid: `b-${barang?.id}`,
    barang_id: barang?.id,
    kode: barang?.kode,
    nama: barang?.nama,
    num_part: barang?.num_part,
    satuan: satuanPakai,
    satuan_pakai: satuanPakai,
    satuan_order: satuanOrder,
    pembagi_pakai: pembagiPakai,
    stok: stokOrder,
    stok_order: stokOrder,
    stok_pakai: stokPakai,
    qty: 1,
    uom_used: satuanPakai,
    isManual: false
  };
}

export function buildManualCartItem(manualForm = {}, currentCartLength = 0) {
  const narasi = (manualForm?.narasi || '').trim();
  const uom = (manualForm?.uom_used || '').trim();
  const qty = Number(manualForm?.qty || 0);

  return {
    uid: `m-${Date.now()}-${currentCartLength}`,
    barang_id: '',
    kode: '',
    nama: narasi,
    num_part: '',
    satuan: uom,
    satuan_pakai: uom,
    satuan_order: uom,
    pembagi_pakai: 1,
    stok: 0,
    stok_order: 0,
    stok_pakai: 0,
    qty,
    uom_used: uom,
    narasi,
    aliaspart: (manualForm?.aliaspart || '').trim(),
    isManual: true
  };
}

export function buildSubmitPayload(selectedGudangId, cart = []) {
  return {
    gudang_id: selectedGudangId,
    items: cart.map((c) => ({
      barang_id: c.barang_id || null,
      qty: Number(c.qty),
      uom_used: c.uom_used || c.satuan || '',
      narasi: c.isManual ? c.narasi : '',
      aliaspart: c.isManual ? c.aliaspart : ''
    }))
  };
}
