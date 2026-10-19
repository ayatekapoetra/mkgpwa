export const MAX_PROOF_SIZE = 5 * 1024 * 1024;
export const PROOF_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif';
export const paymentProofStorageKey = (id) => `order-payment-proofs:${id}`;

export function validateProofFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) return 'Pilih minimal satu gambar bukti pembayaran';
  if (list.length > 20) return 'Maksimal 20 gambar per unggahan';
  for (const file of list) {
    const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'].includes(file.type?.toLowerCase());
    if (!supported && (file.type || !/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name))) return `${file.name}: format gambar tidak didukung`;
    if (!file.size || file.size > MAX_PROOF_SIZE) return `${file.name}: gambar harus berisi data dan maksimal 5 MB`;
  }
  if (list.reduce((total, file) => total + file.size, 0) > 20 * 1024 * 1024) return 'Total unggahan maksimal 20 MB';
  return '';
}

export function legacyPaymentProofs(stored) {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return [];
  const candidates = [
    ...(Array.isArray(stored.__header) ? stored.__header : []),
    ...Object.entries(stored).filter(([key]) => key !== '__header').map(([, proof]) => proof)
  ];
  const seen = new Set();
  return candidates.filter((proof) => {
    if (typeof proof?.dataUrl !== 'string' || seen.has(proof.dataUrl)) return false;
    seen.add(proof.dataUrl);
    return true;
  });
}

export function legacyProofToFile(proof) {
  const match = /^data:(image\/(?:jpeg|png|gif|webp|heic|heif));base64,([a-zA-Z0-9+/=\s]+)$/.exec(proof?.dataUrl || '');
  if (!match || match[2].length > Math.ceil(MAX_PROOF_SIZE / 3) * 4 + 4) throw new Error('Draft bukti lokal tidak valid atau melebihi 5 MB');
  const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
  return new File([bytes], proof.name || `bukti.${match[1].split('/')[1]}`, { type: match[1] });
}

/** Update the bound SWR detail cache from authoritative mutation responses. */
export function applyPaymentAttachmentChange(payload, fallbackRow, change) {
  const field = payload?.data && !payload?.rows ? 'data' : 'rows';
  const row = payload?.[field] || fallbackRow;
  const existing = Array.isArray(row.payment_attachments) ? row.payment_attachments : [];
  const kept = existing.filter((file) => change.removedId === undefined || String(file.id) !== String(change.removedId));
  const added = change.files || [];
  const ids = new Set(added.map((file) => String(file.id)));
  return { ...payload, [field]: { ...row, payment_attachments: [...kept.filter((file) => !ids.has(String(file.id))), ...added] } };
}
