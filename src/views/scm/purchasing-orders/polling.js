export const POLL_OPTIONS = [
  { id: 'approve', label: 'Setuju' },
  { id: 'reject', label: 'Tolak' },
  { id: 'request_revision', label: 'Perlu Revisi' }
];

export const DELIVERY_MODES = [
  { id: 'pdf', label: 'Kirim PDF', description: 'Dokumen PDF setiap PO, tanpa polling.' },
  { id: 'pdf_poll', label: 'Kirim PDF dan Polling', description: 'Dokumen PDF dan satu polling untuk seluruh PO.' },
  { id: 'text', label: 'Kirim Pesan Text Saja', description: 'Ringkasan PO dalam pesan teks, tanpa PDF atau polling.' }
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
  const documents = items.map((item, index) => [
    `${index + 1}. ${item.po_number}`,
    `PR: ${item.pr_number || '-'} | Tanggal: ${item.request_date || '-'}`,
    `Status: ${item.status || '-'} | Prioritas: ${item.priority || '-'}`,
    `Bisnis: ${item.business_unit.name || item.business_unit.initial || '-'}`,
    `Cabang: ${item.branch_name || '-'}`,
    `Pemasok: ${item.supplier_name || '-'}`,
    `Keterangan: ${item.description || '-'}`,
    ...item.line_items.map((line) => `- ${line.item_name}${line.item_code ? ` (${line.item_code})` : ''}: ${line.quantity} ${line.unit || ''}`.trim()),
    `Grand total: ${textAmount(item.grand_total, item.currency)}`
  ].join('\n'));
  return ['RINGKASAN PURCHASE ORDER', ...documents, `Total ${summary.purchase_order_count} PO:`,
    ...summary.totals_by_currency.map((total) => textAmount(total.amount, total.currency))].join('\n\n');
}

export function buildPollBody(rows, { sender_phone, recipient_phone }, mode = 'pdf_poll') {
  if (!DELIVERY_MODES.some((option) => option.id === mode)) throw new Error('Mode pengiriman tidak valid.');
  if (!rows.length) throw new Error('Pilih minimal satu PO.');
  const items = rows.map(toPollItem);
  if (new Set(items.map((item) => item.po_id)).size !== items.length) throw new Error('Terdapat PO duplikat.');
  const withPoll = deliveryHasPoll(mode);
  const summary = summarizePollItems(items);
  return {
    schema_version: '1.1',
    event: 'purchase_order_poll.requested',
    sender_phone: withPoll ? normalizeWhatsAppPhone(sender_phone) : null,
    recipient_phone: normalizeWhatsAppPhone(recipient_phone),
    delivery: {
      mode,
      pdf_documents: mode === 'text' ? [] : items.map((item) => ({
        po_id: item.po_id,
        file_name: `purchase-order-${item.po_id}.pdf`,
        mime_type: 'application/pdf',
         source: { method: 'GET', path: `/scm/purchase-orders/${item.po_id}/print` }
      })),
      text: mode === 'text' ? buildPurchaseOrderText(items, summary) : null
    },
    poll: withPoll ? {
      question: 'Bagaimana keputusan Anda untuk seluruh PO pada daftar berikut?',
      allow_multiple_answers: false,
      scope: 'all_selected_purchase_orders',
      options: POLL_OPTIONS.map((option) => ({ ...option }))
    } : null,
    items,
    summary,
    result_handling: { send_result_to: withPoll ? 'sender_phone' : null, include_recommendation: withPoll, update_purchase_orders: false }
  };
}

export async function preparePollPayload(rows, phones, previous, metadata, mode = 'pdf_poll') {
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
