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
  updatePurchaseOrderHeader,
} from "api/purchase-orders";

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
  const [errorMsg, setErrorMsg] = useState("");

  const [modeRekening, setModeRekening] = useState("existing"); // 'existing' | 'new'
  const [selectedRekeningId, setSelectedRekeningId] = useState("");
  const [nmBank, setNmBank] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [an, setAn] = useState("");
  const [prioritas, setPrioritas] = useState("normal");
  const [narasi, setNarasi] = useState("");

  useEffect(() => {
    if (open && row) {
      setPrioritas(row.prioritas || "normal");
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

      setLoadingOptions(true);
      getPurchaseOrderRekeningOptions(row.id)
        .then((options) => {
          setRekeningOptions(options || []);
          if ((!options || options.length === 0) && !row.rekening_id) {
            setModeRekening("new");
          }
        })
        .catch((err) => {
          console.error("Failed to load rekening options", err);
        })
        .finally(() => {
          setLoadingOptions(false);
        });
    }
  }, [open, row, initialMode]);

  const handleSubmit = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const payload = {
        prioritas,
        narasi,
      };

      if (modeRekening === "new") {
        if (!nmBank.trim() || !noRekening.trim()) {
          throw new Error("Nama bank dan nomor rekening baru wajib diisi");
        }
        payload.nm_bank = nmBank.trim();
        payload.no_rekening = noRekening.trim();
        payload.an = an.trim() || null;
      } else {
        payload.rekening_id = selectedRekeningId ? Number(selectedRekeningId) : null;
      }

      await updatePurchaseOrderHeader(row.id, payload);
      if (onUpdated) {
        await onUpdated();
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.diagnostic?.message ||
          err.response?.data?.message ||
          err.message ||
          "Gagal menyimpan data header PO"
      );
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

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Rekening Pemasok
            </Typography>
            <RadioGroup
              row
              value={modeRekening}
              onChange={(e) => setModeRekening(e.target.value)}
              sx={{ mb: 1.5 }}
            >
              <FormControlLabel
                value="existing"
                control={<Radio size="small" />}
                label="Pilih Rekening Terdaftar"
              />
              <FormControlLabel
                value="new"
                control={<Radio size="small" />}
                label="Tambah Rekening Baru"
              />
            </RadioGroup>

            {modeRekening === "existing" ? (
              <FormControl fullWidth size="small" disabled={loadingOptions}>
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
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Nomor Rekening"
                  value={noRekening}
                  onChange={(e) => setNoRekening(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Atas Nama (A/N)"
                  value={an}
                  onChange={(e) => setAn(e.target.value)}
                />
              </Stack>
            )}
          </Box>

          <Divider />

          <FormControl fullWidth size="small">
            <InputLabel id="select-prioritas-label">Prioritas</InputLabel>
            <Select
              labelId="select-prioritas-label"
              label="Prioritas"
              value={prioritas}
              onChange={(e) => setPrioritas(e.target.value)}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            size="small"
            label="Narasi / Catatan"
            value={narasi}
            onChange={(e) => setNarasi(e.target.value)}
            placeholder="Catatan tambahan untuk Purchase Order ini"
          />
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
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          Simpan Header
        </Button>
      </DialogActions>
    </Dialog>
  );
}
