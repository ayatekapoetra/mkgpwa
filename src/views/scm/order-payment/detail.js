"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Gallery, Receipt2, AddCircle, Trash, Printer, CalendarEdit } from "iconsax-react";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import {
  fetchWallets,
  postOrderPayment,
  removeOrderPayment,
  deleteOrderPaymentItem,
  fetchPrintDefinition,
  useOrderPaymentAccess,
  useOrderPaymentDetail,
} from "api/order-payments";
import { openNotification } from "api/notification";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import MainCard from "components/MainCard";
import BtnBack from "components/BtnBack";
import { APP_DEFAULT_PATH } from "config";
import PaymentProofManager from './PaymentProofManager';
import AddItemDialog from './AddItemDialog';
import { paymentProofStorageKey, applyPaymentAttachmentChange } from './payment-proofs';
import { canRescheduleDueDate } from "./rescheduleDueDateHelpers";
import RescheduleDueDateModal from "./RescheduleDueDateModal";

const money = (v) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const HURUF = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
function pembilang(n) {
  n = Math.abs(Math.round(n));
  if (n < 12) return ` ${HURUF[n]}`;
  if (n < 20) return `${pembilang(n - 10)} Belas`;
  if (n < 100) return `${pembilang(Math.floor(n / 10))} Puluh${pembilang(n % 10)}`;
  if (n < 200) return ` Seratus${pembilang(n - 100)}`;
  if (n < 1000) return `${pembilang(Math.floor(n / 100))} Ratus${pembilang(n % 100)}`;
  if (n < 2000) return ` Seribu${pembilang(n - 1000)}`;
  if (n < 1000000) return `${pembilang(Math.floor(n / 1000))} Ribu${pembilang(n % 1000)}`;
  if (n < 1000000000) return `${pembilang(Math.floor(n / 1000000))} Juta${pembilang(n % 1000000)}`;
  if (n < 1000000000000) return `${pembilang(Math.floor(n / 1000000000))} Miliar${pembilang(n % 1000000000)}`;
  return '';
}
function terbilangText(n) { return `${pembilang(n).trim()} Rupiah`; }

const dateId = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
};

const attachmentUrl = (attachment) =>
  attachment?.url ||
  attachment?.file_url ||
  attachment?.download_url ||
  attachment?.path ||
  "";

const attachmentName = (attachment, index) =>
  attachment?.name ||
  attachment?.filename ||
  attachment?.original_name ||
  attachment?.file_name ||
  `Berkas ${index + 1}`;

const isImageAttachment = (attachment) => {
  const type = String(attachment?.datatype || attachment?.mime_type || attachment?.type || "").toLowerCase();
  const url = attachmentUrl(attachment).toLowerCase();
  return type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic)(\?|$)/i.test(url);
};

function Field({ label, value, inverse = false, children }) {
  return (
    <Box
      sx={{
        minHeight: 64,
        p: 1.25,
        borderRadius: 1.75,
        bgcolor: inverse ? "rgba(255,255,255,.09)" : "secondary.lighter",
        border: "1px solid",
        borderColor: inverse ? "rgba(255,255,255,.12)" : "divider",
      }}
    >
      <Typography
        variant="caption"
        color={inverse ? "inherit" : "text.secondary"}
        display="block"
        sx={{
          mb: 0.45,
          opacity: inverse ? 0.68 : 1,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.7,
          lineHeight: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      {children || (
        <Typography
          variant="body2"
          fontWeight={700}
          color={inverse ? "inherit" : "text.primary"}
          sx={{ lineHeight: 1.45, overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          {value ?? "—"}
        </Typography>
      )}
    </Box>
  );
}

function ReferenceLink({ href, children, inverse = false }) {
  return (
    <MuiLink
      component={NextLink}
      href={href}
      variant="body1"
      color={inverse ? "inherit" : "primary"}
      fontWeight={600}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        textDecoration: "none",
        "&:hover": { textDecoration: "underline" },
      }}
    >
      <LinkOutlinedIcon sx={{ fontSize: 17 }} />
      {children}
    </MuiLink>
  );
}

function AttachmentGallery({ attachments = [], empty = "Belum ada dokumen", accent = "divider" }) {
  const visible = attachments.filter((attachment) => attachmentUrl(attachment));
  if (!visible.length) {
    return <Typography variant="caption" color="text.secondary">{empty}</Typography>;
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {visible.map((attachment, index) => {
        const url = attachmentUrl(attachment);
        const name = attachmentName(attachment, index);
        return isImageAttachment(attachment) ? (
          <Tooltip key={`${url}-${index}`} title={`${name} · Buka berkas`}>
            <Box
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "block",
                width: 86,
                height: 64,
                borderRadius: 1.5,
                overflow: "hidden",
                border: "1px solid",
                borderColor: accent,
                "&:hover img": { transform: "scale(1.05)" },
              }}
            >
              <Box component="img" src={url} alt={name} sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .2s ease" }} />
            </Box>
          </Tooltip>
        ) : (
          <Box
            key={`${url}-${index}`}
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", gap: 0.75, p: 0.85, border: "1px solid", borderColor: accent, borderRadius: 1.5, color: "text.primary", textDecoration: "none", maxWidth: "100%" }}
          >
            <Gallery size={17} />
            <Typography variant="caption" noWrap>{name}</Typography>
            <OpenInNewOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          </Box>
        );
      })}
    </Stack>
  );
}

export default function OrderPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { permissions } = useOrderPaymentAccess();
  const { row, loading, error, refresh } = useOrderPaymentDetail(
    id,
    Boolean(id),
  );

  const [walletType, setWalletType] = useState("bank");
  const [walletId, setWalletId] = useState("");
  const [wallets, setWallets] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [trxDate, setTrxDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [narasi, setNarasi] = useState("");
  const [posting, setPosting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [removeItemTarget, setRemoveItemTarget] = useState(null);
  const [removingItem, setRemovingItem] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [automaticPrint, setAutomaticPrint] = useState(false);
  const automaticPrintId = useRef(null);
  const mutationLock = useRef(false);
  const busy = posting || removing || attachmentBusy;

  const canReschedule = canRescheduleDueDate(permissions);
  const pending = row?.status === "pending";

  useEffect(() => {
    if (!row?.bisnis_id) {
      setWallets([]);
      setWalletId("");
      return;
    }
    let alive = true;
    setLoadingWallet(true);
    fetchWallets(row.bisnis_id, walletType)
      .then((rows) => {
        if (!alive) return;
        setWallets(Array.isArray(rows) ? rows : []);
        setWalletId("");
      })
      .catch(() => {
        if (alive) {
          setWallets([]);
          setWalletId("");
        }
      })
      .finally(() => {
        if (alive) setLoadingWallet(false);
      });
    return () => {
      alive = false;
    };
  }, [row?.bisnis_id, walletType]);

  useEffect(() => {
    setNarasi(row?.narasi || "");
    if (row?.trx_date) {
      const d = new Date(row.trx_date);
      if (!Number.isNaN(d.getTime())) setTrxDate(d.toISOString().slice(0, 10));
    }
  }, [id, row?.narasi, row?.trx_date]);

  const updatePaymentAttachments = (change) => refresh(
    (current) => applyPaymentAttachmentChange(current, row, change),
    { revalidate: false },
  );

  const existingInvoices = useMemo(() => {
    const seen = new Set();
    return (row?.items || [])
      .filter((it) => it.trx_beli)
      .filter((it) => {
        const key = String(it.trx_beli);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((it) => ({ trx_beli: it.trx_beli, faktur_kode: it.faktur_kode }));
  }, [row?.items]);

  const previousAttachments = useMemo(() => {
    const seen = new Set();
    return (row?.items || []).flatMap((item) => item.attachments || []).filter((attachment) => {
      const key = attachmentUrl(attachment);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [row?.items]);

  const itemSummary = useMemo(() => {
    const items = Array.isArray(row?.items) ? row.items : [];

    // `faktur_grandtotal`, `faktur_potongan`, `faktur_ppn_rp` adalah nilai level faktur
    // (dari trx_faktur_belis). Satu faktur bisa punya beberapa baris item (beda barang),
    // jadi nilai faktur harus dijumlahkan per faktur unik agar tidak dobel.
    const invoices = [];
    const seenInvoice = new Set();
    items.forEach((item) => {
      const key = String(item.trx_beli ?? item.faktur_kode ?? '');
      if (key && seenInvoice.has(key)) return;
      if (key) seenInvoice.add(key);
      invoices.push(item);
    });

    const totalAfterPpn = invoices.reduce((total, item) => total + (Number(item.faktur_grandtotal) || Number(item.subtotal) || 0), 0);
    const ppn = invoices.reduce((total, item) => total + (Number(item.faktur_ppn_rp) || Number(item.ppn_rp) || 0), 0);
    const discount = invoices.reduce((total, item) => total + (Number(item.faktur_potongan) || Number(item.potongan) || 0), 0);

    return {
      invoices: items.length,
      discount,
      ppn,
      beforePpn: totalAfterPpn - ppn,
      afterPpn: totalAfterPpn,
    };
  }, [row?.items]);

  const selectedWallet = useMemo(
    () => wallets.find((w) => String(w.id) === String(walletId)),
    [wallets, walletId],
  );

  const handleRemoveItem = async () => {
    if (mutationLock.current || !removeItemTarget) return;
    mutationLock.current = true;
    setRemovingItem(true);
    try {
      await deleteOrderPaymentItem(id, removeItemTarget.id);
      setRemoveItemTarget(null);
      openNotification({ open: true, title: "Berhasil", message: "Item pembayaran berhasil dihapus", alert: { color: "success" } });
      await refresh();
    } catch (err) {
      openNotification({ open: true, title: "Gagal", message: err?.message || "Gagal menghapus item pembayaran", alert: { color: "error" } });
    } finally {
      mutationLock.current = false;
      setRemovingItem(false);
    }
  };

  const handlePrint = useCallback(async ({ replaceCurrentWindow = false } = {}) => {
    if (printing) return;
    setPrinting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // Fetch logo + all attachments as base64 from backend
      const printData = await fetchPrintDefinition(id);

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = 210, H = 297, M = 15;
      let y = M;

      // === 1. Title ===
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Pembayaran', M, y);
      y += 12;

      // === 2. Header — 3 columns: left info, middle business, right logo ===
      const leftX = M;
      const midX = M + 70;
      const logoX = W - M - 25;
      const logoW = 25;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Tanggal Bayar', leftX, y);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(dateId(row.trx_date), leftX, y + 5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Kode Pembayaran', leftX, y + 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(row.kdbayar || '-', leftX, y + 17);
      doc.setFont('helvetica', 'bold');
      doc.text(row.no_po ? `PO : ${row.no_po}` : `Pengajuan : ${row.no_pd || '-'}`, leftX, y + 22);

      // Middle: match the legacy business identity block (name, address, city, NPWP).
      const business = printData?.bisnis || { name: row.bisnis_nama };
      const businessWidth = logoX - midX - 5;
      let businessY = y;
      const writeBusinessLine = (value, fontSize, fontStyle) => {
        if (!value || !String(value).trim()) return;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const lines = doc.splitTextToSize(String(value).trim(), businessWidth);
        doc.text(lines, midX, businessY, { lineHeightFactor: 1.2 });
        businessY += lines.length * (fontSize / doc.internal.scaleFactor) * 1.2 + 1;
      };
      writeBusinessLine(business.name || row.bisnis_nama || '-', 11, 'bold');
      writeBusinessLine(business.alamat, 9, 'normal');
      writeBusinessLine(business.kota, 9, 'normal');
      writeBusinessLine(business.npwp, 9, 'normal');

      // Right: logo
      if (printData?.logo) {
        try {
          doc.addImage(printData.logo, 'JPEG', logoX, y - 5, logoW, logoW);
        } catch (_) { /* skip logo */ }
      }

      // Divider line
      y = Math.max(y + 28, businessY + 3);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      y += 5;

      // === 3. Items table ===
      const items = row.items || [];
      const grandTotal = items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0);

      const body = items.map((it, i) => [
        String(i + 1),
        `${it.debit_kode || '-'}\n${it.debit_name || '-'}`,
        `${it.faktur_kode || it.description || '-'}\n${it.barang_nama || it.description || '-'}`,
        `${row.pemasok_kode || '-'}\n${row.pemasok_nama || '-'}`,
        String(it.qty),
        money(it.harga_stn),
        money(it.subtotal),
      ]);
      body.push([
        { content: 'Grand Total', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [221, 221, 221], fontSize: 9 } },
        { content: money(grandTotal), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [221, 221, 221], fontSize: 9 } },
      ]);

      autoTable(doc, {
        startY: y,
        head: [['No', 'Account Code', 'Descriptions', 'Pemasok', 'Qty', 'Harga', 'Total']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [238, 238, 255], textColor: 0, fontSize: 8, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 7, lineColor: [200, 200, 200], lineWidth: 0.1 },
        alternateRowStyles: { fillColor: [234, 244, 244] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 28 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30 },
          4: { cellWidth: 12, halign: 'right' },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 20, halign: 'right' },
        },
        margin: { left: M, right: M },
      });
      y = doc.lastAutoTable.finalY + 10;

      // === 4. Terbilang (left) + Signatures (right) ===
      const terbilangW = 80;
      const sigX = M + terbilangW + 10;
      const sigW = W - M - sigX;

      // Terbilang
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Terbilang :', M, y);
      doc.setFont('helvetica', 'italic');
      const terbilangLines = doc.splitTextToSize(terbilangText(grandTotal), terbilangW);
      doc.text(terbilangLines, M, y + 5);

      // Signature table — compact autotable matching legacy layout
      const sig = printData?.signatures || {};
      const isPD = Boolean(printData?.no_pd || row?.no_pd || row?.reff_pd || !row?.no_po);
      const sigRows = [
        { label: 'Diajukan Oleh :\nPart Manager', ...sig.diajukan },
        { label: isPD ? 'Diketahui Oleh :\nOperational Manager' : 'Diketahui Oleh :\nKeuangan', ...sig.diketahui },
        { label: isPD ? 'Disetujui Oleh :\nKeuangan' : 'Disetujui Oleh :\nOperational Manager', ...sig.disetujui },
        { label: 'Dibayar oleh :\nFinance/Kasir', ...sig.dibayar },
      ];

      autoTable(doc, {
        startY: y,
        body: sigRows.map((s) => [
          { content: s.label, styles: { fontSize: 8 } },
          { content: `${s.name || '-'}\n${s.date || ''}${s.time ? `\n${s.time}` : ''}`, styles: { fontSize: 7.5, fontStyle: 'bold', lineHeight: 1.15 } },
        ]),
        theme: 'grid',
        styles: { cellPadding: 2, minCellHeight: 12, valign: 'top', overflow: 'linebreak', lineColor: [180, 180, 180], lineWidth: 0.15 },
        columnStyles: {
          0: { cellWidth: 38, textColor: [60, 60, 60] },
          1: { cellWidth: 'auto', textColor: [20, 20, 20] },
        },
        margin: { left: sigX, right: M },
      });

      // === 5. Attachment pages ===
      const allAttachments = [
        ...(printData?.paymentAttachments || []),
        ...(printData?.poAttachments || []),
        ...(printData?.pdAttachments || []),
      ];

      if (allAttachments.length) {
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Lampiran Pembayaran ${row.kdbayar || ''}`, M, M);
        let imgY = M + 10;
        for (const att of allAttachments) {
          if (!att.base64) continue;
          try {
            const format = (att.datatype || 'jpeg').toUpperCase().replace('JPG', 'JPEG').replace('PNG', 'PNG').replace('GIF', 'GIF');
            const imgW = W - M * 2;
            doc.addImage(att.base64, format, M, imgY, imgW, 120);
            imgY += 130;
            if (imgY > H - 30) { doc.addPage(); imgY = M; }
          } catch (_) { /* skip failed image */ }
        }
      }

      // === 6. Footer page numbers ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} of ${pageCount}`, W - 30, H - 8, { align: 'right' });
      }

      doc.autoPrint();
      const pdfUrl = doc.output('bloburl');
      if (replaceCurrentWindow) window.location.replace(pdfUrl);
      else window.open(pdfUrl, '_blank');
    } catch (err) {
      openNotification({ open: true, title: "Gagal Print", message: err?.message || "Gagal mencetak dokumen pembayaran", alert: { color: "error" } });
    } finally {
      setPrinting(false);
    }
  }, [printing, row, id]);

  useEffect(() => {
    if (loading || error || !row || row.status !== 'paid' || automaticPrintId.current === id) return;
    if (typeof window === "undefined" || new URLSearchParams(window?.location?.search || "").get("print") !== "1") return;
    automaticPrintId.current = id;
    setAutomaticPrint(true);
    void handlePrint({ replaceCurrentWindow: true });
  }, [loading, error, row, id, handlePrint]);

  const handlePost = async () => {
    if (mutationLock.current) return;
    if (!walletId) {
      openNotification({
        open: true,
        title: "Validasi",
        message: "Pilih bank/kas terlebih dahulu",
        alert: { color: "warning" },
      });
      return;
    }
    if (!selectedWallet?.coa_id) {
      openNotification({
        open: true,
        title: "Validasi",
        message: "Wallet belum punya COA di master bank/kas",
        alert: { color: "warning" },
      });
      return;
    }
    if (
      !window.confirm(
        "Posting pembayaran ini? Status akan menjadi Sudah Bayar dan jurnal kas/bank akan dicatat.",
      )
    ) {
      return;
    }
    mutationLock.current = true;
    setPosting(true);
    try {
      const body = { trx_date: trxDate, narasi };
      if (walletType === "bank") body.bank_id = Number(walletId);
      else body.kas_id = Number(walletId);
      await postOrderPayment(id, body);
      openNotification({
        open: true,
        title: "Berhasil",
        message: "Pembayaran berhasil diposting",
        alert: { color: "success" },
      });
      await refresh();
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal posting",
        message: err?.message || "Gagal memposting pembayaran",
        alert: { color: "error" },
      });
    } finally {
      mutationLock.current = false;
      setPosting(false);
    }
  };

  const handleRollback = async () => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setRemoving(true);
    try {
      await removeOrderPayment(id);
      setRollbackOpen(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(paymentProofStorageKey(id));
      }
      openNotification({
        open: true,
        title: "Berhasil",
        message: "Pembayaran berhasil di-rollback",
        alert: { color: "success" },
      });
      router.push("/orders-payments");
    } catch (err) {
      openNotification({
        open: true,
        title: "Gagal rollback",
        message: err?.message || "Gagal melakukan rollback pembayaran",
        alert: { color: "error" },
      });
    } finally {
      mutationLock.current = false;
      setRemoving(false);
    }
  };

  if (loading || (automaticPrint && printing)) {
    return (
      <Box py={8} display="flex" justifyContent="center">
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          {automaticPrint ? <Typography color="text.secondary">Menyiapkan dokumen pembayaran…</Typography> : null}
        </Stack>
      </Box>
    );
  }

  if (error || !row) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Gagal memuat Orders Payments. {error?.message}
      </Alert>
    );
  }

  const sourceIsPo = Boolean(row.no_po || row.reff);
  const sourceLabel = sourceIsPo ? "Purchase Order" : "Pengajuan Dana";
  const sourceValue = sourceIsPo
    ? row.no_po && row.reff
      ? <ReferenceLink inverse href={`/purchasing-orders/${row.reff}`}>{row.no_po}</ReferenceLink>
      : row.no_po || "—"
    : row.no_pd && row.reff_pd
      ? <ReferenceLink inverse href={`/pengajuan-dana/${row.reff_pd}`}>{row.no_pd}</ReferenceLink>
      : row.no_pd || "—";
  const canPost = permissions.can_post && pending;
  const canRemove = permissions.can_delete && pending;
  const canAddItem = (permissions.can_update || permissions.can_create) && pending;
  const canRemoveItem = (permissions.can_update || permissions.can_delete) && pending;

  return (
    <>
      <Breadcrumbs
        custom
        heading={row.kdbayar || "Orders Payments"}
        links={[
          { title: "Home", to: APP_DEFAULT_PATH },
          { title: "Purchasing" },
          { title: "Orders Payments", to: "/orders-payments" },
          { title: row.kdbayar || String(id) },
        ]}
      />

      <MainCard
        title={<BtnBack href="/orders-payments" />}
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              startIcon={printing ? <CircularProgress size={16} /> : <Printer size={18} />}
              onClick={handlePrint}
              disabled={printing || busy}
            >
              {printing ? "Menyiapkan..." : "Print"}
            </Button>
            <Chip
              label={row.status_label || row.status}
              color={row.status === "paid" ? "success" : "warning"}
            />
          </Stack>
        }
        content
      >
        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            color: "common.white",
            background: "linear-gradient(135deg, #19324d 0%, #285f78 58%, #2b8b87 100%)",
            boxShadow: "0 16px 36px rgba(25, 50, 77, .18)",
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,.16)" }}>
                <Receipt2 size={26} />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.72, letterSpacing: 1.2 }}>Order Payment</Typography>
                <Typography variant="h4" fontWeight={800}>{row.kdbayar || `Pembayaran #${id}`}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.78, mt: 0.25 }}>{row.party_name || "Pihak pembayaran belum tersedia"}</Typography>
              </Box>
            </Stack>
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography variant="caption" sx={{ opacity: 0.72 }}>Total pembayaran</Typography>
              <Typography variant="h3" fontWeight={900}>Rp {money(row.roundtotal || row.total)}</Typography>
              <Chip size="small" label={row.status_label || row.status} sx={{ mt: 0.75, color: "common.white", bgcolor: row.status === "paid" ? "rgba(46, 190, 125, .82)" : "rgba(245, 177, 66, .9)", fontWeight: 800 }} />
            </Box>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 1.5 }}>
            <Grid item xs={6} sm={6} md={3}><Field inverse label={sourceLabel} value={sourceValue} /></Grid>
            <Grid item xs={6} sm={6} md={3}><Field inverse label="Faktur" value={row.faktur_kode || "—"} /></Grid>
            <Grid item xs={12} sm={6} md={3}><Field inverse label="Tanggal transaksi" value={dateId(row.trx_date)} /></Grid>
            <Grid item xs={6} sm={6} md={3}><Field inverse label="Cabang" value={`${row.cabang_kode || ""}${row.cabang_kode && row.cabang_nama ? " · " : ""}${row.cabang_nama || "—"}`} /></Grid>
            <Grid item xs={6} sm={6} md={4}><Field inverse label="Unit Bisnis" value={`${row.bisnis_nama || "—"}`} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field inverse label="Rekening tujuan" value={row.nm_bank ? `${row.nm_bank} · ${row.no_rekening || ""} · ${row.an_rekening || row.penerima || ""}` : row.penerima || "—"} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Field inverse label="Akun kas / bank" value={row.coa_kode ? `${row.coa_kode} — ${row.coa_name || ""}` : "Belum dipilih"} /></Grid>
          </Grid>
        </Box>

        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <Gallery size={21} />
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Dokumen Pembayaran</Typography>
                <Typography variant="caption" color="text.secondary">Semua berkas pendukung pembayaran dalam satu header dokumen</Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={1}>Berkas dari proses sebelumnya</Typography>
                <AttachmentGallery attachments={previousAttachments} empty="Tidak ada berkas sebelumnya" />
              </Grid>
              <PaymentProofManager key={id} paymentId={id} attachments={row.payment_attachments || []} permissions={permissions}
                busy={busy} mutationLock={mutationLock} onBusyChange={setAttachmentBusy} onChanged={updatePaymentAttachments} />
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Alokasi Faktur</Typography>
                <Typography variant="caption" color="text.secondary">Rincian nilai yang dialokasikan ke setiap faktur</Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {canAddItem ? (
                  <Button size="small" variant="contained" startIcon={<AddCircle size={18} />} onClick={() => setAddItemOpen(true)} disabled={busy}>
                    Add Items
                  </Button>
                ) : null}
                <Chip size="small" label={`${(row.items || []).length} Items`} variant="outlined" />
              </Stack>
            </Stack>
            <Stack spacing={1.5}>
              {(row.items || []).map((it) => (
                <Card key={it.id} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                  <Box sx={{ px: 2, py: 1.25, bgcolor: "primary.lighter", borderBottom: "1px solid", borderColor: "divider" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                        <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", flexShrink: 0 }}><Receipt2 size={18} /></Box>
                        <Box minWidth={0}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2" fontWeight={800} noWrap>
                              {it.faktur_kode || (!it.trx_beli ? (it.description || "Biaya Operasional / Admin Bank") : `Faktur #${it.trx_beli}`)}
                            </Typography>
                            {!it.trx_beli && (
                              <Chip size="small" label="Non-Faktur / Beban" color="secondary" sx={{ height: 20, fontSize: 11 }} />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {it.barang_nama || it.description || it.barang_kode || "Alokasi pembayaran"}
                            {it.no_po ? ` · PO: ${it.no_po}` : ""}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Typography variant="subtitle1" fontWeight={800} color="primary.main">Rp {money(it.subtotal)}</Typography>
                        {canReschedule ? (
                          <Tooltip title="Ubah Jatuh Tempo Faktur" arrow>
                            <IconButton
                              size="small"
                              color="warning"
                              disabled={busy}
                              aria-label="Ubah Jatuh Tempo"
                              onClick={() =>
                                setRescheduleTarget({
                                  id: it.trx_beli || it.faktur_id,
                                  kdfb: it.faktur_kode,
                                  date_faktur: it.date_faktur || it.created_at,
                                  due_date: it.due_date,
                                  termin_id: it.termin_id,
                                })
                              }
                            >
                              <CalendarEdit size={16} />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        {canRemoveItem ? (
                          <IconButton size="small" color="error" disabled={busy} aria-label="Hapus item" onClick={() => setRemoveItemTarget(it)}>
                            <Trash size={16} />
                          </IconButton>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6} md={(it.no_po || it.po_narasi) ? 3 : 4}>
                        <Field label="Barang / deskripsi" value={it.barang_nama || it.description || it.barang_kode || "—"} />
                      </Grid>
                      {(it.no_po || it.po_narasi) ? (
                        <Grid item xs={12} sm={6} md={3}>
                          <Field label="PO & Keterangan">
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={800} color="text.primary">
                                {it.no_po || "—"}
                              </Typography>
                              {it.po_narasi ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontStyle: "italic",
                                    lineHeight: 1.25,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {it.po_narasi}
                                </Typography>
                              ) : null}
                            </Stack>
                          </Field>
                        </Grid>
                      ) : null}
                      <Grid item xs={12} sm={6} md={(it.no_po || it.po_narasi) ? 2 : 3}>
                        <Field label="Akun debit">
                          {it.debit_kode ? (
                            <Stack spacing={0}>
                              <Typography variant="caption" color="error.main" fontWeight={700} sx={{ lineHeight: 1.2, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                {it.debit_kode}
                              </Typography>
                              <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ lineHeight: 1, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                {it.debit_name || ""}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" fontWeight={700} color="text.primary">—</Typography>
                          )}
                        </Field>
                      </Grid>
                      <Grid item xs={6} sm={3} md={1}><Field label="Qty" value={it.qty} /></Grid>
                      <Grid item xs={6} sm={3} md={(it.no_po || it.po_narasi) ? 1.5 : 2}><Field label="Harga satuan" value={`Rp ${money(it.harga_stn)}`} /></Grid>
                      <Grid item xs={12} md={(it.no_po || it.po_narasi) ? 1.5 : 2}><Field label="Subtotal" value={`Rp ${money(it.subtotal)}`} /></Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              {!(row.items || []).length ? <Alert severity="info">Tidak ada alokasi faktur pada pembayaran ini.</Alert> : null}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2.5, bgcolor: "secondary.lighter" }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Summary Items</Typography>
                <Typography variant="caption" color="text.secondary">Ringkasan nilai faktur sebelum pembayaran diposting</Typography>
              </Box>
              <Chip size="small" color="primary" variant="outlined" label={`${itemSummary.invoices} alokasi`} />
            </Stack>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Total potongan</Typography>
                  <Typography variant="h5" fontWeight={800}>Rp {money(itemSummary.discount)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Total PPN</Typography>
                  <Typography variant="h5" fontWeight={800}>Rp {money(itemSummary.ppn)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Nilai sebelum PPN</Typography>
                  <Typography variant="h5" fontWeight={800} color="primary.main">Rp {money(itemSummary.beforePpn)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 1.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Nilai setelah PPN</Typography>
                  <Typography variant="h5" fontWeight={800} color="success.main">Rp {money(itemSummary.afterPpn)}</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

         {canPost ? (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Posting pembayaran
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal bayar"
                  InputLabelProps={{ shrink: true }}
                  value={trxDate}
                  onChange={(e) => setTrxDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Tipe sumber dana"
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                >
                  <MenuItem value="bank">Bank</MenuItem>
                  <MenuItem value="kas">Kas</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  loading={loadingWallet}
                  options={wallets}
                  value={
                    wallets.find((w) => String(w.id) === String(walletId)) ||
                    null
                  }
                  getOptionLabel={(o) => o.label || o.name || ""}
                  isOptionEqualToValue={(a, b) =>
                    String(a.id) === String(b.id)
                  }
                  onChange={(_, o) => setWalletId(o?.id || "")}
                  renderInput={(p) => (
                    <TextField
                      {...p}
                      label={walletType === "bank" ? "Rekening bank *" : "Kas *"}
                      required
                      helperText={
                        selectedWallet
                          ? selectedWallet.coa_id
                            ? `COA: ${selectedWallet.coa_kode || ""} — ${selectedWallet.coa_name || ""}`
                            : "Wallet belum punya COA"
                          : wallets.length
                            ? "Pilih rekening/kas"
                            : `Tidak ada ${walletType === "bank" ? "bank" : "kas"} untuk unit ini`
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6} />
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Narasi"
                  value={narasi}
                  onChange={(e) => setNarasi(e.target.value)}
                />
              </Grid>
             </Grid>
           </>
         ) : null}

         <Stack direction="row" justifyContent="space-between" spacing={1.5} sx={{ mt: 3 }}>
           <Stack direction="row" spacing={1.5}>
             {canPost ? (
               <Button
                 variant="contained"
                  disabled={busy || !walletId || !selectedWallet?.coa_id}
                 onClick={handlePost}
               >
                 {posting ? "Memposting…" : "Posting Bayar"}
               </Button>
             ) : null}
           </Stack>
           <Stack direction="row" spacing={1.5}>
             <Button
               variant="outlined"
               onClick={() => router.push("/orders-payments")}
             >
               Kembali
             </Button>
             {canRemove ? (
               <Button
               variant="outlined"
               color="error"
                disabled={busy}
                onClick={() => setRollbackOpen(true)}
               >
                 {removing ? "Rollback..." : "Rollback Pembayaran"}
               </Button>
             ) : null}
           </Stack>
         </Stack>

         {!pending ? (
           <Alert severity="success" sx={{ mt: 3 }}>
             Pembayaran sudah diposting
             {row.coa_kode ? ` ke ${row.coa_kode} — ${row.coa_name || ""}` : ""}.
           </Alert>
         ) : null}

         <Dialog
           open={rollbackOpen}
           onClose={() => (removing ? null : setRollbackOpen(false))}
           fullWidth
           maxWidth="sm"
           PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
         >
           <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, pb: 1 }}>
             <Box
               sx={{
                 width: 42,
                 height: 42,
                 borderRadius: "50%",
                 display: "grid",
                 placeItems: "center",
                 bgcolor: "error.lighter",
                 color: "error.main",
               }}
             >
               <WarningAmberRoundedIcon />
             </Box>
             <Box>
               <Typography variant="h5">Rollback pembayaran?</Typography>
               <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                 {row.kdbayar || `Pembayaran #${id}`}
               </Typography>
             </Box>
           </DialogTitle>
           <DialogContent>
             <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
               Tindakan ini tidak dapat dibatalkan setelah berhasil diproses.
             </Alert>
             <Typography variant="body2" color="text.secondary">
               Sistem akan menghapus pembayaran pending beserta data alokasinya dan mengembalikan dokumen sumber ke tahap sebelumnya.
             </Typography>
             <List dense disablePadding sx={{ mt: 1.25 }}>
               <ListItem disableGutters>
                 <ListItemIcon sx={{ minWidth: 34, color: "error.main" }}>
                   <DeleteSweepOutlinedIcon fontSize="small" />
                 </ListItemIcon>
                 <ListItemText primary="Data pembayaran dan alokasi faktur akan dihapus." />
               </ListItem>
               <ListItem disableGutters>
                 <ListItemIcon sx={{ minWidth: 34, color: "primary.main" }}>
                   <RestoreOutlinedIcon fontSize="small" />
                 </ListItemIcon>
                 <ListItemText primary="PO dikembalikan ke status verify dan PD ke approval." />
               </ListItem>
             </List>
           </DialogContent>
           <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
             <Button
               variant="text"
               onClick={() => setRollbackOpen(false)}
                disabled={busy}
             >
               Batal
             </Button>
             <Button
               variant="contained"
               color="error"
               onClick={handleRollback}
                disabled={busy}
               startIcon={removing ? <CircularProgress size={16} color="inherit" /> : <RestoreOutlinedIcon />}
             >
               {removing ? "Memproses..." : "Ya, Rollback Pembayaran"}
             </Button>
           </DialogActions>
          </Dialog>

          <AddItemDialog
            open={addItemOpen}
            onClose={() => setAddItemOpen(false)}
            paymentId={id}
            bisnisId={row?.bisnis_id}
            existingInvoices={existingInvoices}
            onAdded={() => refresh()}
          />

          <Dialog
            open={Boolean(removeItemTarget)}
            onClose={() => removingItem ? null : setRemoveItemTarget(null)}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
          >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, pb: 1 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "error.lighter", color: "error.main" }}>
                <WarningAmberRoundedIcon />
              </Box>
              <Typography variant="h6">Hapus item pembayaran?</Typography>
            </DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                Total pembayaran akan dihitung ulang setelah item dihapus.
              </Alert>
              {removeItemTarget ? (
                <Stack spacing={0.5} sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={600}>{removeItemTarget.faktur_kode || `Faktur #${removeItemTarget.trx_beli}` || "Item tambahan"}</Typography>
                  <Typography variant="caption" color="text.secondary">{removeItemTarget.barang_nama || removeItemTarget.description || removeItemTarget.barang_kode || "Alokasi pembayaran"}</Typography>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mt: 0.5 }}>Rp {money(removeItemTarget.subtotal)}</Typography>
                </Stack>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="text" onClick={() => setRemoveItemTarget(null)} disabled={removingItem}>Batal</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRemoveItem}
                disabled={removingItem}
                startIcon={removingItem ? <CircularProgress size={16} color="inherit" /> : <Trash size={18} />}
              >
                {removingItem ? "Menghapus..." : "Ya, Hapus Item"}
              </Button>
            </DialogActions>
          </Dialog>

          <RescheduleDueDateModal
            open={Boolean(rescheduleTarget)}
            onClose={() => setRescheduleTarget(null)}
            faktur={rescheduleTarget}
            permissions={permissions}
            onSuccess={() => {
              refresh();
            }}
          />

      </MainCard>
    </>
  );
}
