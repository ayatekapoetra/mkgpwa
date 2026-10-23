export const POLL_OPTIONS = [
  { id: 'approve', label: 'Setuju' },
  { id: 'reject', label: 'Tolak' },
  { id: 'request_revision', label: 'Perlu Revisi' }
];

export const DELIVERY_MODES = [
  { id: 'pdf_poll', label: 'Kirim PDF dan Polling', description: 'Dokumen PDF dan satu polling WhatsApp untuk seluruh pengajuan dana.' },
  { id: 'pdf', label: 'Kirim PDF Saja', description: 'Dokumen PDF setiap pengajuan dana, tanpa polling.' },
  { id: 'text', label: 'Kirim Teks Saja', description: 'Ringkasan pengajuan dana dalam pesan teks WhatsApp, tanpa PDF atau polling.' }
];

export const deliveryHasPoll = (mode) => mode === 'pdf_poll';

export const STORAGE_KEY = 'mkg_pengajuan_dana_poll_selection';
export const pollStorageKey = () => STORAGE_KEY;
export const validPengajuanDanaId = (id) => /^[1-9]\d*$/.test(String(id ?? ''));
export const selectionSignature = (items) => JSON.stringify(items.map((item) => String(item.id)));

export function emptyPollSelection() {
  return { version: 1, items: [], sender_phone: '', recipient_phone: '', prepared: null };
}

export function normalizePollSelection(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.items)) {
    throw new Error('Format pilihan Pengajuan Dana tidak valid. Gunakan Reset untuk menghapus pilihan.');
  }
  const unique = new Map();
  value.items.forEach((item) => {
    if (validPengajuanDanaId(item?.id)) {
      unique.set(String(item.id), { id: String(item.id), kode: String(item.kode || item.id) });
    }
  });
  return {
    version: 1,
    items: [...unique.values()],
    sender_phone: typeof value.sender_phone === 'string' ? value.sender_phone : '',
    recipient_phone: typeof value.recipient_phone === 'string' ? value.recipient_phone : '',
    prepared: value.prepared || null
  };
}

export function readPollSelection(storage, key = STORAGE_KEY) {
  const raw = storage.getItem(key);
  return raw === null ? emptyPollSelection() : normalizePollSelection(JSON.parse(raw));
}

export function selectPollRows(document, rows, checked) {
  const selected = new Map(document.items.map((item) => [String(item.id), item]));
  rows.forEach((row) => {
    if (!validPengajuanDanaId(row?.id)) return;
    const id = String(row.id);
    if (checked) selected.set(id, { id, kode: String(row.kode || id) });
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

export function decimal(value, label = 'Nilai', scale) {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error(`${label} tidak valid.`);
  let [whole, fraction = ''] = text.split('.');
  whole = whole.replace(/^0+(?=\d)/, '');
  if (scale === undefined) return fraction ? `${whole || '0'}.${fraction}` : (whole || '0');
  if (fraction.slice(scale).replace(/0/g, '')) throw new Error(`${label} memiliki lebih dari ${scale} desimal.`);
  return `${whole || '0'}.${fraction.slice(0, scale).padEnd(scale, '0')}`;
}

export const relationName = (value) => typeof value === 'string' ? value : value?.nama || value?.name || null;

export function pollDate(value) {
  if (!value) return null;
  const date = String(value).slice(0, 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Tanggal Pengajuan Dana tidak valid. Muat ulang data.');
  }
  return date;
}

export function toPollItem(row) {
  if (!validPengajuanDanaId(row?.id) || !row.kode) {
    throw new Error('Identitas Pengajuan Dana tidak lengkap. Muat ulang data.');
  }
  if (!Array.isArray(row.items)) {
    throw new Error(`Rincian ${row.kode} belum tersedia. Muat ulang data.`);
  }
  const currency = 'IDR';
  return {
    id: String(row.id),
    pengajuan_dana_id: String(row.id),
    kode: String(row.kode),
    trx_date: pollDate(row.trx_date),
    status: row.status || null,
    business_unit: {
      initial: row.bisnis?.initial || null,
      name: relationName(row.bisnis)
    },
    branch_name: relationName(row.cabang),
    creator_name: row.creator?.nama_lengkap || row.creator?.username || null,
    description: row.narasi || '',
    currency,
    grand_total: decimal(row.total || 0, `Grand total ${row.kode}`, 2),
    line_items: row.items.filter((item) => item.aktif !== 'N').map((item) => ({
      item_id: item.id == null ? null : String(item.id),
      item_code: item.barang?.kode || item.kode_faktur || null,
      item_name: item.barang?.nama || item.narasi || 'Non-part item',
      priority: item.prioritas || null,
      category: item.kategori || null,
      method: item.metode || null,
      quantity: decimal(item.qty || 1, `Qty item ${row.kode}`),
      unit: item.satuan || item.barang?.satuan || null,
      unit_price: decimal(item.harga || item.harga_satuan || 0, `Harga item ${row.kode}`, 2),
      grand_total: decimal(item.grandtotal || item.total || 0, `Total item ${row.kode}`, 2),
      coa_code: item.biaya_coa?.kode || null,
      coa_name: item.biaya_coa?.nama || null,
      supplier_name: relationName(item.pemasok),
      employee_name: relationName(item.karyawan)
    }))
  };
}

export function summarizePollItems(items) {
  let totalCents = BigInt(0);
  items.forEach((item) => {
    const [whole, cents] = decimal(item.grand_total, 'Grand total', 2).split('.');
    totalCents += BigInt(whole) * BigInt(100) + BigInt(cents);
  });
  return {
    pengajuan_dana_count: items.length,
    totals_by_currency: [
      {
        currency: 'IDR',
        amount: `${totalCents / BigInt(100)}.${String(totalCents % BigInt(100)).padStart(2, '0')}`
      }
    ]
  };
}

function textAmount(amount, currency = 'IDR') {
  const [whole, cents] = amount.split('.');
  return `${currency} ${BigInt(whole).toLocaleString('id-ID')},${cents}`;
}

export function buildPengajuanDanaText(items, summary) {
  const now = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const header = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '📋 *RINGKASAN PENGAJUAN DANA*',
    `🕐 ${now} WITA`,
    `📦 ${summary.pengajuan_dana_count} dokumen terpilih`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');

  const documents = items.map((item, index) => {
    const org = [item.business_unit.name || item.business_unit.initial, item.branch_name].filter(Boolean).join(' · ');
    const itemLines = item.line_items.length
      ? item.line_items.slice(0, 5).map((line) => {
          const extra = [line.priority ? `[${line.priority}]` : null, line.unit ? `${line.quantity} ${line.unit}` : `${line.quantity}x`].filter(Boolean).join(' · ');
          return `   • ${line.item_name} (${extra}) — ${textAmount(line.grand_total, item.currency)}`;
        }).join('\n')
        + (item.line_items.length > 5 ? `\n   • _...dan ${item.line_items.length - 5} item lainnya_` : '')
      : '   • _(tidak ada item aktif)_';

    return [
      `*${index + 1}. ${item.kode}*`,
      `🏢 ${org || '-'}`,
      item.creator_name ? `👤 Pemohon: ${item.creator_name}` : null,
      `📅 ${item.trx_date || '-'}  |  🔖 Status: ${item.status || '-'}`,
      item.description ? `📝 _${item.description}_` : null,
      `📦 Rincian item:`,
      itemLines,
      `💰 *Total Pengajuan: ${textAmount(item.grand_total, item.currency)}*`
    ].filter(Boolean).join('\n');
  });

  const totals = summary.totals_by_currency.map((t) => `   *${textAmount(t.amount, t.currency)}*`).join('\n');
  const footer = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `💼 *Total ${summary.pengajuan_dana_count} Pengajuan Dana:*`,
    totals,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');

  return [header, ...documents, footer].join('\n\n');
}

export function buildPollBody(rows, { sender_phone, recipient_phone }, mode = 'pdf_poll') {
  if (!DELIVERY_MODES.some((option) => option.id === mode)) throw new Error('Mode pengiriman tidak valid.');
  if (!rows || !rows.length) throw new Error('Pilih minimal satu Pengajuan Dana.');
  const items = rows.map(toPollItem);
  if (new Set(items.map((item) => item.id)).size !== items.length) throw new Error('Terdapat Pengajuan Dana duplikat.');
  const withPoll = deliveryHasPoll(mode);
  const summary = summarizePollItems(items);
  return {
    schema_version: '1.1',
    event: 'pengajuan_dana_poll.requested',
    sender_phone: withPoll ? normalizeWhatsAppPhone(sender_phone) : null,
    recipient_phone: normalizeWhatsAppPhone(recipient_phone),
    delivery: {
      mode,
      pdf_documents: mode === 'text' ? [] : [{
        id: items[0].id,
        pengajuan_dana_id: items[0].id,
        file_name: `pengajuan-dana-${items[0].id}.pdf`,
        mime_type: 'application/pdf',
        source: { method: 'GET', path: `/pengajuan-dana/${items[0].id}/print` }
      }],
      text: mode === 'text' ? buildPengajuanDanaText(items, summary) : null
    },
    poll: withPoll ? {
      question: 'Bagaimana keputusan Anda untuk seluruh Pengajuan Dana pada daftar berikut?',
      allow_multiple_answers: false,
      scope: 'all_selected_pengajuan_dana',
      options: POLL_OPTIONS.map((option) => ({ ...option }))
    } : null,
    items,
    summary,
    result_handling: {
      send_result_to: withPoll ? 'sender_phone' : null,
      include_recommendation: withPoll,
      update_status: false
    }
  };
}

export async function preparePollPayload(rows, phones, previous, metadata, mode = 'pdf_poll') {
  const body = buildPollBody(rows, phones, mode);
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Pembuatan JSON memerlukan browser dengan Web Crypto melalui HTTPS atau localhost.');
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const canReuse = previous?.fingerprint === fingerprint &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(previous.request_id || '') &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(previous.created_at || '') &&
    Number.isFinite(Date.parse(previous.created_at));
  const prepared = canReuse ? previous : { ...metadata, fingerprint };
  return {
    payload: { ...body, request_id: prepared.request_id, created_at: prepared.created_at },
    prepared
  };
}

export async function loadSelectedPollDocuments(ids, fetchDetail, signal, concurrency = 4) {
  const rows = new Array(ids.length);
  const errors = {};
  let next = 0;
  const worker = async () => {
    while (!signal?.aborted && next < ids.length) {
      const index = next++;
      const id = String(ids[index]);
      try {
        const row = await fetchDetail(id, { signal });
        if (String(row?.id) !== id) throw new Error('Identitas data Pengajuan Dana tidak sesuai.');
        toPollItem(row);
        rows[index] = row;
      } catch (error) {
        if (!signal?.aborted) errors[id] = error?.message || 'Gagal memuat Pengajuan Dana.';
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
  return { rows: rows.filter(Boolean), errors };
}

export const loadSelectedPollOrders = loadSelectedPollDocuments;
