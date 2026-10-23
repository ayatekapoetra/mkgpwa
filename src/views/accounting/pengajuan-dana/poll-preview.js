'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import {
  getPengajuanDanaHermesStatus,
  submitPengajuanDanaHermes,
  usePengajuanDanaAccess
} from 'api/pengajuan-dana';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import { APP_DEFAULT_PATH } from 'config';
import usePengajuanDanaPollSelection from './usePengajuanDanaPollSelection';
import usePengajuanDanaPollDetails from './usePengajuanDanaPollDetails';
import {
  buildPollBody,
  DELIVERY_MODES,
  deliveryHasPoll,
  normalizeWhatsAppPhone,
  preparePollPayload,
  selectionSignature,
  summarizePollItems,
  toPollItem
} from './polling';
import PollPreviewView from './poll-preview-view';

function phoneError(value) {
  try {
    normalizeWhatsAppPhone(value);
    return '';
  } catch (error) {
    return error.message;
  }
}

export default function PengajuanDanaPollPreview() {
  const router = useRouter();
  const selection = usePengajuanDanaPollSelection();
  const { permissions, loading: accessLoading, error: accessError } = usePengajuanDanaAccess();
  const canRead = !accessLoading && !accessError && permissions.can_read;
  const details = usePengajuanDanaPollDetails(selection, canRead && !selection.error);

  const [contacts, setContacts] = useState({ key: null, sender_phone: '', recipient_phone: '' });
  const [touched, setTouched] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('pdf_poll');
  const [artifact, setArtifact] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  const submitting = useRef(false);
  const lifetime = useRef(0);

  useEffect(() => {
    lifetime.current += 1;
    return () => {
      lifetime.current += 1;
    };
  }, []);

  const phones = useMemo(() => {
    if (contacts.key === selection.key) return contacts;
    return {
      key: selection.key,
      sender_phone: selection.data.sender_phone || '',
      recipient_phone: selection.data.recipient_phone || ''
    };
  }, [contacts, selection.key, selection.data.sender_phone, selection.data.recipient_phone]);

  const ids = useMemo(() => selectionSignature(selection.data.items), [selection.data.items]);
  const latest = useRef({ key: selection.key, ids, rows: details.rows, phones });
  latest.current = { key: selection.key, ids, rows: details.rows, phones };

  const senderError = deliveryHasPoll(deliveryMode) ? phoneError(phones.sender_phone) : '';
  const recipientError = phoneError(phones.recipient_phone);
  const complete =
    canRead &&
    selection.ready &&
    !selection.error &&
    !details.loading &&
    selection.data.items.length > 0 &&
    details.rows.length === selection.data.items.length &&
    Object.keys(details.errors).length === 0;

  const preview = useMemo(() => {
    if (!complete || senderError || recipientError) return null;
    try {
      return buildPollBody(details.rows, phones, deliveryMode);
    } catch {
      return null;
    }
  }, [complete, senderError, recipientError, details.rows, phones, deliveryMode]);

  const summary = useMemo(() => {
    return complete ? summarizePollItems(details.rows.map(toPollItem)) : null;
  }, [complete, details.rows]);

  const currentArtifact =
    artifact &&
    artifact.key === selection.key &&
    artifact.ids === ids &&
    artifact.rows === details.rows &&
    artifact.sender === phones.sender_phone &&
    artifact.recipient === phones.recipient_phone &&
    artifact.mode === deliveryMode
      ? artifact
      : null;

  useEffect(() => {
    const requestId = currentArtifact?.payload?.request_id;
    if (!requestId || !deliveryStatus || ['completed', 'failed'].includes(deliveryStatus.status)) return undefined;

    let cancelled = false;
    const refresh = async () => {
      try {
        const result = await getPengajuanDanaHermesStatus(requestId);
        if (!cancelled) setDeliveryStatus(result);
      } catch (failure) {
        if (!cancelled) {
          setDeliveryStatus((current) => ({
            ...current,
            status: current?.status || 'queued',
            error: failure?.diagnostic?.message || failure?.message || 'Status Hermes belum dapat dimuat.'
          }));
        }
      }
    };

    const timer = setTimeout(refresh, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentArtifact, deliveryStatus]);

  const editPhone = (name, value) => {
    setContacts((current) => ({ ...current, key: selection.key, [name]: value }));
    setError('');
    setMessage('');
  };

  const savePhones = () => {
    if (contacts.key === selection.key) {
      selection.savePhones({ sender_phone: phones.sender_phone, recipient_phone: phones.recipient_phone });
    }
  };

  const handlePrepare = async (mode) => {
    if (!DELIVERY_MODES.some((option) => option.id === mode)) return;
    if (!complete || submitting.current) return;

    setDeliveryMode(mode);
    setTouched(true);
    setError('');
    setMessage('');
    setDeliveryStatus(null);

    const needsSender = deliveryHasPoll(mode) && phoneError(phones.sender_phone);
    if (needsSender || recipientError) {
      document.getElementById?.(recipientError ? 'pd-poll-recipient' : 'pd-poll-sender')?.focus();
      return;
    }

    submitting.current = true;
    setPreparing(true);
    const started = { ...latest.current, lifetime: lifetime.current };

    try {
      const { payload, prepared } = await preparePollPayload(
        details.rows,
        phones,
        selection.data.prepared,
        {
          request_id: uuidv4(),
          created_at: new Date().toISOString()
        },
        mode
      );

      const current = latest.current;
      if (lifetime.current !== started.lifetime) return;
      if (
        current.key !== started.key ||
        current.ids !== started.ids ||
        current.rows !== started.rows ||
        current.phones.sender_phone !== phones.sender_phone ||
        current.phones.recipient_phone !== phones.recipient_phone
      ) {
        throw new Error('Pilihan atau nomor berubah. Periksa preview lalu coba lagi.');
      }

      const submitted = await submitPengajuanDanaHermes(payload);
      if (!selection.savePrepared(prepared, { sender_phone: phones.sender_phone, recipient_phone: phones.recipient_phone }, ids)) {
        return;
      }

      setArtifact({
        key: selection.key,
        ids,
        rows: details.rows,
        sender: phones.sender_phone,
        recipient: phones.recipient_phone,
        mode,
        payload
      });
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
    if (selection.reset()) router.push('/pengajuan-dana');
  };

  return (
    <>
      <Breadcrumbs
        custom
        heading="Preview Pengiriman Pengajuan Dana"
        links={[
          { title: 'Home', to: APP_DEFAULT_PATH },
          { title: 'Pengajuan Dana', to: '/pengajuan-dana' },
          { title: 'Preview Pengiriman' }
        ]}
      />
      <PollPreviewView
        selection={selection}
        details={details}
        canRead={canRead}
        accessLoading={accessLoading}
        accessError={accessError}
        phones={phones}
        touched={touched}
        senderError={senderError}
        recipientError={recipientError}
        complete={complete}
        summary={summary}
        preview={preview}
        currentArtifact={currentArtifact}
        preparing={preparing}
        error={error}
        message={message}
        deliveryMode={deliveryMode}
        deliveryStatus={deliveryStatus}
        onEditPhone={editPhone}
        onSavePhones={savePhones}
        onPrepare={handlePrepare}
        onReset={handleReset}
      />
    </>
  );
}
