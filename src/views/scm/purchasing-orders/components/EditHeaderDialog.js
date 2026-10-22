"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  getPurchaseOrderRekeningOptions,
  getPurchaseOrderError,
  updatePurchaseOrderHeader,
} from "api/purchase-orders";
import { buildPurchaseOrderHeaderPayload, PURCHASE_ORDER_PRIORITIES } from "../headerPayload";

export default function EditHeaderDialog({
  open,
  onClose,
  row,
  onUpdated,
  initialMode = "all",
}) {
  const [loading, setLoading] = useState(false);
  const [rekeningOptions, setRekeningOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [modeRekening, setModeRekening] = useState("existing"); // 'existing' | 'new'
  const [selectedRekeningId, setSelectedRekeningId] = useState("");
  const [nmBank, setNmBank] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [an, setAn] = useState("");
  const [prioritas, setPrioritas] = useState("");
  const [narasi, setNarasi] = useState("");
  const editingBank = initialMode !== "narasi";
  const editingHeader = initialMode === "all";
  const editingNarration = editingHeader || initialMode === "narasi";

  useEffect(() => {
    if (open && row) {
      const controller = new AbortController();
      setPrioritas(row.prioritas || "");
      setNarasi(row.narasi || "");
      setSelectedRekeningId(row.rekening_id ? String(row.rekening_id) : "");
      if (initialMode === "new_rekening") {
        setModeRekening("new");
      } else {
        setModeRekening("existing");
      }
      setNmBank("");
      setNoRekening("");
      setAn("");
      setErrorMsg("");
      setOptionsError("");
      setRekeningOptions([]);
      setLoadingOptions(false);

      if (initialMode === "narasi") return () => controller.abort();

      setLoadingOptions(true);
      getPurchaseOrderRekeningOptions(row.pemasok_id ?? row.pemasok?.id, { signal: controller.signal })
        .then((options) => {
          if (controller.signal.aborted) return;
          setRekeningOptions(options || []);
          if ((!options || options.length === 0) && !row.rekening_id) {
            setModeRekening("new");
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setOptionsError(getPurchaseOrderError(err, "Gagal memuat rekening pemasok").message);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingOptions(false);
        });
      return () => controller.abort();
    }
  }, [open, row, initialMode]);

  const handleSubmit = async () => {
    if (loading || (editingBank && modeRekening === "existing" && (loadingOptions || optionsError))) return;
    setErrorMsg("");
    setLoading(true);
    try {
      const payload = buildPurchaseOrderHeaderPayload({
        initialMode, modeRekening, selectedRekeningId,
        nmBank, noRekening, an, prioritas, narasi,
      });

      await updatePurchaseOrderHeader(row.id, payload);
      if (onUpdated) {
        await onUpdated();
      }
      onClose();
    } catch (err) {
      setErrorMsg(getPurchaseOrderError(err, "Gagal menyimpan data header PO").message);
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle =
    initialMode === "rekening" || initialMode === "new_rekening"
      ? "Kelola Rekening Pemasok PO"
      : initialMode === "narasi"
      ? "Edit Narasi PO"
      : "Edit Header Purchase Order";

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {editingBank && <Box>
            <Typography variant="subtitle2" gutterBottom>
              Rekening Pemasok
            </Typography>
            <RadioGroup
              row
              value={modeRekening}
              onChange={(e) => { if (!loading) setModeRekening(e.target.value); }}
              sx={{ mb: 1.5 }}
            >
              <FormControlLabel
                value="existing"
                control={<Radio size="small" />}
                label="Pilih Rekening Terdaftar"
                disabled={loading}
              />
              <FormControlLabel
                value="new"
                control={<Radio size="small" />}
                label="Tambah Rekening Baru"
                disabled={loading}
              />
            </RadioGroup>

            {optionsError && modeRekening === "existing" && <Alert severity="error">{optionsError}</Alert>}
            {modeRekening === "existing" ? (
              <FormControl fullWidth size="small" disabled={loading || loadingOptions || Boolean(optionsError)}>
                <InputLabel id="select-rekening-label">Rekening Pemasok</InputLabel>
                <Select
                  labelId="select-rekening-label"
                  label="Rekening Pemasok"
                  value={selectedRekeningId}
                  onChange={(e) => setSelectedRekeningId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Tanpa Rekening</em>
                  </MenuItem>
                  {rekeningOptions.map((opt) => (
                    <MenuItem key={opt.id} value={String(opt.id)}>
                      {opt.nm_bank} - {opt.no_rekening} {opt.an ? `(${opt.an})` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nama Bank"
                  placeholder="Contoh: BCA / Mandiri / BRI"
                  value={nmBank}
                  onChange={(e) => setNmBank(e.target.value)}
                  required
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Nomor Rekening"
                  value={noRekening}
                  onChange={(e) => setNoRekening(e.target.value)}
                  required
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Atas Nama (A/N)"
                  value={an}
                  onChange={(e) => setAn(e.target.value)}
                  disabled={loading}
                />
              </Stack>
            )}
          </Box>}

          {editingHeader && <>
            <Divider />

          <FormControl fullWidth size="small" disabled={loading}>
            <InputLabel id="select-prioritas-label">Prioritas</InputLabel>
            <Select
              labelId="select-prioritas-label"
              label="Prioritas"
              value={prioritas}
              onChange={(e) => setPrioritas(e.target.value)}
            >
              <MenuItem value="" disabled><em>Belum ditentukan</em></MenuItem>
              {PURCHASE_ORDER_PRIORITIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          </>}

          {editingNarration && <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            size="small"
            label="Narasi / Catatan"
            value={narasi}
            onChange={(e) => setNarasi(e.target.value)}
            placeholder="Catatan tambahan untuk Purchase Order ini"
            disabled={loading}
          />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || (editingBank && modeRekening === "existing" && (loadingOptions || Boolean(optionsError)))}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {editingHeader ? "Simpan Header" : editingNarration ? "Simpan Narasi" : "Simpan Rekening"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
