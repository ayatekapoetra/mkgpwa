'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { getPurchaseOrderHermesStatus, submitPurchaseOrderHermes, usePurchaseOrderAccess } from 'api/purchase-orders';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import usePollSelection from './use-poll-selection';
import usePollDetails from './use-poll-details';
import { buildPollBody, DELIVERY_MODES, deliveryHasPoll, normalizeWhatsAppPhone, preparePollPayload, selectionSignature, summarizePollItems, toPollItem } from './polling';
import PollPreviewView from './poll-preview-view';

function phoneError(value) {
  try { normalizeWhatsAppPhone(value); return ''; } catch (error) { return error.message; }
}

export default function PurchaseOrderPollPreview() {
  const router = useRouter();
  const selection = usePollSelection();
  const { permissions, loading: accessLoading, error: accessError } = usePurchaseOrderAccess();
  const canRead = !accessLoading && !accessError && permissions.can_read;
  const details = usePollDetails(selection, canRead && !selection.error);
  const [contacts, setContacts] = useState({ key: null, sender_phone: '', recipient_phone: '' });
  const [touched, setTouched] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('pdf_text');
  const [artifact, setArtifact] = useState(null);
  const [message, setMessage] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const lifetime = useRef(0);
  const latest = useRef(null);
  const ids = selectionSignature(selection.data.items);
  const phones = useMemo(() => contacts.key === selection.key ? contacts : { sender_phone: '', recipient_phone: '' }, [contacts, selection.key]);
  latest.current = { key: selection.key, ids, phones, rows: details.rows };

  useEffect(() => {
    if (!selection.ready) return;
    setContacts((current) => current.key === selection.key ? current : {
      key: selection.key,
      sender_phone: selection.data.sender_phone,
      recipient_phone: selection.data.recipient_phone
    });
  }, [selection.ready, selection.key, selection.data.sender_phone, selection.data.recipient_phone]);

  useEffect(() => () => { lifetime.current += 1; }, []);

  const senderError = '';
  const recipientError = phoneError(phones.recipient_phone);
  const complete = canRead && selection.ready && !selection.error && !details.loading &&
    selection.data.items.length > 0 && details.rows.length === selection.data.items.length && Object.keys(details.errors).length === 0;
  const preview = useMemo(() => {
    if (!complete || recipientError) return null;
    try { return buildPollBody(details.rows, phones, deliveryMode); } catch { return null; }
  }, [complete, recipientError, details.rows, phones, deliveryMode]);
  const summary = useMemo(() => complete ? summarizePollItems(details.rows.map(toPollItem)) : null, [complete, details.rows]);
  const currentArtifact = artifact && artifact.key === selection.key && artifact.ids === ids &&
    artifact.rows === details.rows && artifact.sender === phones.sender_phone && artifact.recipient === phones.recipient_phone && artifact.mode === deliveryMode ? artifact : null;

  useEffect(() => {
    const requestId = currentArtifact?.payload?.request_id;
    if (!requestId || !deliveryStatus || ['completed', 'failed'].includes(deliveryStatus.status)) return undefined;
    let cancelled = false;
    const refresh = async () => {
      try {
        const result = await getPurchaseOrderHermesStatus(requestId);
        if (!cancelled) setDeliveryStatus(result);
      } catch (failure) {
        if (!cancelled) setDeliveryStatus((current) => ({ ...current, status: current?.status || 'queued', error: failure?.diagnostic?.message || failure?.message || 'Status Hermes belum dapat dimuat.' }));
      }
    };
    const timer = setTimeout(refresh, 3000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [currentArtifact, deliveryStatus]);

  const editPhone = (name, value) => {
    setContacts((current) => ({ ...current, key: selection.key, [name]: value }));
    setError('');
    setMessage('');
  };
  const savePhones = () => {
    if (contacts.key === selection.key) selection.savePhones({ sender_phone: phones.sender_phone, recipient_phone: phones.recipient_phone });
  };

  const handlePrepare = async (mode) => {
    if (!DELIVERY_MODES.some((option) => option.id === mode)) return;
    if (!complete || submitting.current) return;
    setDeliveryMode(mode);
    setTouched(true);
    setError('');
    setMessage('');
    setDeliveryStatus(null);
    if (recipientError) {
      document.getElementById?.('po-poll-recipient')?.focus();
      return;
    }
    submitting.current = true;
    setPreparing(true);
    const started = { ...latest.current, lifetime: lifetime.current };
    try {
      const { payload, prepared } = await preparePollPayload(details.rows, phones, selection.data.prepared, {
        request_id: uuidv4(), created_at: new Date().toISOString()
      }, mode);
      const current = latest.current;
      if (lifetime.current !== started.lifetime) return;
      if (current.key !== started.key || current.ids !== started.ids || current.rows !== started.rows ||
        current.phones.sender_phone !== phones.sender_phone || current.phones.recipient_phone !== phones.recipient_phone) {
        throw new Error('Pilihan atau nomor berubah. Periksa preview lalu coba lagi.');
      }
       const submitted = await submitPurchaseOrderHermes(payload);
       if (!selection.savePrepared(prepared, { sender_phone: phones.sender_phone, recipient_phone: phones.recipient_phone }, ids)) return;
       setArtifact({ key: selection.key, ids, rows: details.rows, sender: phones.sender_phone, recipient: phones.recipient_phone, mode, payload });
       setDeliveryStatus(submitted);
       setMessage(`${DELIVERY_MODES.find((option) => option.id === mode).label}: request diterima Hermes. Status pengiriman sedang dipantau.`);
    } catch (failure) {
      if (lifetime.current === started.lifetime) {
        const diagnostic = failure?.diagnostic || {};
        const fieldMessage = Array.isArray(failure?.errors)
          ? failure.errors.map((item) => item?.message).filter(Boolean).join(' ')
          : '';
        setError(diagnostic.message || fieldMessage || failure?.message || 'Gagal mengirim paket Hermes.');
      }
    } finally {
      submitting.current = false;
      if (lifetime.current === started.lifetime) setPreparing(false);
    }
  };

  const handleReset = () => {
    if (selection.reset()) router.push('/purchasing-orders');
  };

  return (
    <>
      <Breadcrumbs custom heading="Preview Pengiriman Purchase Order" links={[
        { title: 'Home', to: APP_DEFAULT_PATH },
        { title: 'Purchase Order', to: '/purchasing-orders' },
        { title: 'Preview Pengiriman' }
      ]} />
      <PollPreviewView
        selection={selection} details={details} canRead={canRead} accessLoading={accessLoading} accessError={accessError}
        phones={phones} touched={touched} senderError={senderError} recipientError={recipientError} complete={complete}
        summary={summary} preview={preview} currentArtifact={currentArtifact} preparing={preparing} error={error} message={message}
        deliveryMode={deliveryMode} deliveryStatus={deliveryStatus}
        onEditPhone={editPhone} onSavePhones={savePhones} onPrepare={handlePrepare} onReset={handleReset}
      />
    </>
  );
}
