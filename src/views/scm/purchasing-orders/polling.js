export const POLL_OPTIONS = [
  { id: 'approve', label: 'Setuju' },
  { id: 'reject', label: 'Tolak' },
  { id: 'request_revision', label: 'Perlu Revisi' }
];

export const DELIVERY_MODES = [
  { id: 'pdf_text', label: 'Kirim PDF dan Text', description: 'Dokumen PDF ringkasan dan pesan teks WhatsApp lengkap dengan narasi tiap item.' },
  { id: 'pdf', label: 'Kirim PDF', description: 'Dokumen PDF setiap PO, tanpa pesan teks.' },
  { id: 'text', label: 'Kirim Pesan Text Saja', description: 'Ringkasan PO dalam pesan teks, tanpa PDF.' }
];

export const deliveryHasPoll = (mode) => mode === 'pdf_poll';

export const pollStorageKey = (userId) => `purchase-order-poll:v1:${encodeURIComponent(String(userId))}`;
export const validPoId = (id) => /^[1-9]\d*$/.test(String(id ?? ''));
export const selectionSignature = (items) => JSON.stringify(items.map((item) => String(item.id)));

export function emptyPollSelection() {
  return { version: 1, items: [], sender_phone: '', recipient_phone: '', prepared: null };
}

export function normalizePollSelection(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.items)) throw new Error('Format pilihan PO tidak valid. Gunakan Reset untuk menghapus pilihan.');
  const unique = new Map();
  value.items.forEach((item) => {
    if (validPoId(item?.id)) unique.set(String(item.id), { id: String(item.id), kdpo: String(item.kdpo || item.id) });
  });
  return {
    version: 1,
    items: [...unique.values()],
    sender_phone: typeof value.sender_phone === 'string' ? value.sender_phone : '',
    recipient_phone: typeof value.recipient_phone === 'string' ? value.recipient_phone : '',
    prepared: value.prepared || null
  };
}

export function readPollSelection(storage, key) {
  const raw = storage.getItem(key);
  return raw === null ? emptyPollSelection() : normalizePollSelection(JSON.parse(raw));
}

// A page-level select-all never removes selections from other pages/filters.
export function selectPollRows(document, rows, checked) {
  const selected = new Map(document.items.map((item) => [String(item.id), item]));
  rows.forEach((row) => {
    if (!validPoId(row?.id)) return;
    const id = String(row.id);
    if (checked) selected.set(id, { id, kdpo: String(row.kdpo || id) });
    else selected.delete(id);
  });
  return { ...document, items: [...selected.values()] };
}

export function normalizeWhatsAppPhone(input) {
  const raw = String(input || '').trim();
  if (!raw || /[^\d+\s().-]/.test(raw)) throw new Error('Masukkan nomor WhatsApp yang valid.');
  let phone = raw.replace(/[\s().-]/g, '');
  if (phone.startsWith('08')) phone = `+62${phone.slice(1)}`;
  else if (phone.startsWith('62')) phone = `+${phone}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error('Gunakan format 08…, 628…, atau +kode negara (8–15 digit).');
  return phone;
}

function decimal(value, label, scale) {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error(`${label} tidak valid. Muat ulang data PO.`);
  let [whole, fraction = ''] = text.split('.');
  whole = whole.replace(/^0+(?=\d)/, '');
  if (scale === undefined) return fraction ? `${whole}.${fraction}` : whole;
  if (fraction.slice(scale).replace(/0/g, '')) throw new Error(`${label} memiliki lebih dari ${scale} desimal.`);
  return `${whole}.${fraction.slice(0, scale).padEnd(scale, '0')}`;
}

export function summarizePollItems(items) {
  const totals = new Map();
  items.forEach((item) => {
    const [whole, cents] = decimal(item.grand_total, 'Grand total', 2).split('.');
    totals.set(item.currency, (totals.get(item.currency) || BigInt(0)) + BigInt(whole) * BigInt(100) + BigInt(cents));
  });
  return {
    purchase_order_count: items.length,
    totals_by_currency: [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([currency, cents]) => ({
      currency,
      amount: `${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, '0')}`
    }))
  };
}

const relationName = (value) => typeof value === 'string' ? value : value?.nama || value?.name || null;

function pollDate(value) {
  if (!value) return null;
  const date = String(value).slice(0, 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Tanggal PO tidak valid. Muat ulang data.');
  }
  return date;
}

export function toPollItem(row) {
  if (!validPoId(row?.id) || !row.kdpo) throw new Error('Identitas PO tidak lengkap. Muat ulang data.');
  if (!Array.isArray(row.items)) throw new Error(`Rincian ${row.kdpo} belum tersedia. Muat ulang data.`);
  const currency = String(row.currency || 'IDR').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error(`Mata uang ${row.kdpo} tidak valid.`);
  return {
    po_id: String(row.id),
    po_number: String(row.kdpo),
    pr_number: row.kode_pr ? String(row.kode_pr) : null,
    request_date: pollDate(row.request_date),
    status: row.status || null,
    priority: row.prioritas || null,
    business_unit: { initial: row.bisnis?.initial || null, name: relationName(row.bisnis) },
    branch_name: relationName(row.cabang),
    supplier_name: relationName(row.pemasok),
    description: row.narasi || '',
    currency,
    grand_total: decimal(row.grandtotal, `Grand total ${row.kdpo}`, 2),
    line_items: row.items.filter((item) => item.aktif !== 'N').map((item) => ({
      item_id: item.id == null ? null : String(item.id),
      item_code: item.barang?.kode || null,
      item_name: item.barang?.nama || item.narasi || 'Non-part item',
      item_narasi: item.narasi || null,
      quantity: decimal(item.qty, `Qty item ${row.kdpo}`),
      unit: item.stn || item.satuan || item.barang?.satuan || item.barang?.satuan_order || null
    }))
  };
}

function textAmount(amount, currency) {
  const [whole, cents] = amount.split('.');
  return `${currency} ${BigInt(whole).toLocaleString('id-ID')},${cents}`;
}

export function buildPurchaseOrderText(items, summary) {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const header = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '📋 *RINGKASAN PURCHASE ORDER*',
    `🕐 ${now} WITA`,
    `📦 ${summary.purchase_order_count} dokumen terpilih`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');

  const documents = items.map((item, index) => {
    const org = [item.business_unit.name || item.business_unit.initial, item.branch_name].filter(Boolean).join(' · ');
    const itemLines = item.line_items.length
      ? item.line_items.slice(0, 5).map((line) => {
          const mainLine = `   • ${line.item_name}${line.item_code ? ` _(${line.item_code})_` : ''} — ${line.quantity}${line.unit ? ' ' + line.unit : ''}`;
          const narasi = line.item_narasi ? String(line.item_narasi).trim() : '';
          const hasCustomNarasi = narasi && narasi !== String(line.item_name).trim();
          if (hasCustomNarasi) {
            return `${mainLine}\n     ↳ _Catatan/Narasi: ${narasi}_`;
          }
          return mainLine;
        }).join('\n')
        + (item.line_items.length > 5 ? `\n   • _...dan ${item.line_items.length - 5} item lainnya_` : '')
      : '   • _(tidak ada item aktif)_';
    return [
      `*${index + 1}. ${item.po_number}*`,
      `🏢 ${org || '-'}`,
      `🏭 ${item.supplier_name || '-'}`,
      `📅 ${item.request_date || '-'}  |  🔖 ${item.priority || '-'}`,
      item.description ? `📝 _${item.description}_` : null,
      `📦 Rincian item:`,
      itemLines,
      `💰 *Grand Total: ${textAmount(item.grand_total, item.currency)}*`
    ].filter((line) => line !== null).join('\n');
  });

  const totals = summary.totals_by_currency.map((t) => `   *${textAmount(t.amount, t.currency)}*`).join('\n');
  const footer = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `💼 *Total ${summary.purchase_order_count} PO:*`,
    totals,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');

  return [header, ...documents, footer].join('\n\n');
}

export function buildPollBody(rows, { sender_phone, recipient_phone } = {}, mode = 'pdf_text') {
  let effectiveMode = mode;
  if (effectiveMode === 'pdf_poll') {
    effectiveMode = 'pdf_text';
  }
  if (!DELIVERY_MODES.some((option) => option.id === effectiveMode)) throw new Error('Mode pengiriman tidak valid.');
  if (!rows.length) throw new Error('Pilih minimal satu PO.');
  const items = rows.map(toPollItem);
  if (new Set(items.map((item) => item.po_id)).size !== items.length) throw new Error('Terdapat PO duplikat.');
  const summary = summarizePollItems(items);
  const hasPdf = effectiveMode === 'pdf' || effectiveMode === 'pdf_text';
  const hasText = effectiveMode === 'text' || effectiveMode === 'pdf_text';
  return {
    schema_version: '1.1',
    event: 'purchase_order_poll.requested',
    sender_phone: null,
    recipient_phone: normalizeWhatsAppPhone(recipient_phone),
    delivery: {
      mode: effectiveMode,
      pdf_documents: hasPdf ? [{
        po_id: items[0].po_id,
        file_name: `purchase-order-${items[0].po_id}.pdf`,
        mime_type: 'application/pdf',
        source: { method: 'GET', path: `/scm/purchase-orders/${items[0].po_id}/print` }
      }] : [],
      text: hasText ? buildPurchaseOrderText(items, summary) : null
    },
    poll: null,
    items,
    summary,
    result_handling: { send_result_to: null, include_recommendation: false, update_purchase_orders: false }
  };
}

export async function preparePollPayload(rows, phones, previous, metadata, mode = 'pdf_text') {
  const body = buildPollBody(rows, phones, mode);
  if (typeof crypto === 'undefined' || !crypto.subtle) throw new Error('Pembuatan JSON memerlukan browser dengan Web Crypto melalui HTTPS atau localhost.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const canReuse = previous?.fingerprint === fingerprint &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(previous.request_id || '') &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(previous.created_at || '') &&
    Number.isFinite(Date.parse(previous.created_at));
  const prepared = canReuse ? previous : { ...metadata, fingerprint };
  return { payload: { ...body, request_id: prepared.request_id, created_at: prepared.created_at }, prepared };
}

export async function loadSelectedPollOrders(ids, fetchOrder, signal, concurrency = 4) {
  const rows = new Array(ids.length);
  const errors = {};
  let next = 0;
  const worker = async () => {
    while (!signal.aborted && next < ids.length) {
      const index = next++;
      const id = String(ids[index]);
      try {
        const row = await fetchOrder(id, { signal });
        if (String(row?.id) !== id) throw new Error('Identitas data PO tidak sesuai.');
        toPollItem(row);
        rows[index] = row;
      } catch (error) {
        if (!signal.aborted) errors[id] = error?.message || 'Gagal memuat PO.';
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
  return { rows: rows.filter(Boolean), errors };
}
