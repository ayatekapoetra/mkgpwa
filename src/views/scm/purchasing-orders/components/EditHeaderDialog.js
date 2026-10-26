"use client";

import { useEffect, useMemo, useState } from "react";
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
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
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
import {
  buildPurchaseOrderHeaderPayload,
  PURCHASE_ORDER_PRIORITIES,
  PURCHASE_ORDER_TOP_TYPES,
} from "../headerPayload";

const formatCurrency = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);

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

  // Payment terms (TOP) and metode state
  const [metode, setMetode] = useState("tunai");
  const [topType, setTopType] = useState("CASH");
  const [topDays, setTopDays] = useState(30);
  const [dpPercent, setDpPercent] = useState(30);

  const handleMetodeChange = (nextMetode) => {
    setMetode(nextMetode);
    if (nextMetode === "tunai") {
      setTopType("CASH");
      setTopDays(0);
      setDpPercent(0);
    } else {
      if (topType === "CASH") {
        setTopType("CREDIT");
        setTopDays(30);
      }
    }
  };

  const handleTopTypeChange = (nextType) => {
    setTopType(nextType);
    if (nextType === "CASH") {
      setMetode("tunai");
      setTopDays(0);
      setDpPercent(0);
    } else {
      setMetode("kredit");
      if (nextType === "CREDIT" && (!topDays || Number(topDays) <= 0)) {
        setTopDays(30);
      } else if (nextType === "INSTALLMENT") {
        if (!topDays || Number(topDays) <= 0) setTopDays(14);
        if (!dpPercent || Number(dpPercent) <= 0) setDpPercent(30);
      }
    }
  };

  const editingBank = initialMode !== "narasi";
  const editingHeader = initialMode === "all";
  const editingNarration = editingHeader || initialMode === "narasi";

  // Calculate PO total value for real-time installment simulation
  const poTotalValue = useMemo(() => {
    if (!row) return 0;
    if (row.total !== undefined && row.total !== null) return Number(row.total);
    if (row.grand_total !== undefined && row.grand_total !== null) return Number(row.grand_total);
    if (row.subtotal !== undefined && row.subtotal !== null) return Number(row.subtotal);
    if (Array.isArray(row.items)) {
      return row.items.reduce((sum, item) => {
        const itemVal = item.subtotal ?? item.total ?? (Number(item.qty || 0) * Number(item.harga || 0));
        return sum + (Number(itemVal) || 0);
      }, 0);
    }
    return 0;
  }, [row]);

  const dpAmount = useMemo(() => {
    const pct = parseFloat(dpPercent) || 0;
    return Math.round(poTotalValue * (pct / 100));
  }, [poTotalValue, dpPercent]);

  const sisaPelunasan = useMemo(() => {
    return Math.max(0, poTotalValue - dpAmount);
  }, [poTotalValue, dpAmount]);

  useEffect(() => {
    if (open && row) {
      const controller = new AbortController();
      setPrioritas(row.prioritas || "");
      setNarasi(row.narasi || "");
      setSelectedRekeningId(row.rekening_id ? String(row.rekening_id) : "");

      const currentTop = String(row.top_type || "CASH").toUpperCase();
      const currentMetode = row.metode
        ? String(row.metode).toLowerCase()
        : currentTop === "CASH"
        ? "tunai"
        : "kredit";
      setMetode(currentMetode);
      setTopType(["CASH", "CREDIT", "INSTALLMENT"].includes(currentTop) ? currentTop : "CASH");
      setTopDays(
        row.top_days !== undefined && row.top_days !== null && Number(row.top_days) > 0
          ? Number(row.top_days)
          : currentTop === "CREDIT"
          ? 30
          : currentTop === "INSTALLMENT"
          ? 14
          : 0
      );
      setDpPercent(
        row.dp_percent !== undefined && row.dp_percent !== null && Number(row.dp_percent) > 0
          ? Number(row.dp_percent)
          : 30
      );

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

    // Frontend validation for payment terms
    if (editingHeader) {
      if (topType === "CREDIT") {
        const days = parseInt(topDays, 10);
        if (isNaN(days) || days <= 0) {
          setErrorMsg("Masa kredit (top_days) harus berupa angka positif lebih dari 0 hari.");
          return;
        }
      } else if (topType === "INSTALLMENT") {
        const pct = parseFloat(dpPercent);
        if (isNaN(pct) || pct < 1 || pct > 99) {
          setErrorMsg("Persentase uang muka (DP) harus di antara 1% dan 99%.");
          return;
        }
        const days = parseInt(topDays, 10);
        if (isNaN(days) || days <= 0) {
          setErrorMsg("Masa kredit pelunasan harus berupa angka positif lebih dari 0 hari.");
          return;
        }
      }
    }

    setLoading(true);
    try {
      const payload = buildPurchaseOrderHeaderPayload({
        initialMode,
        modeRekening,
        selectedRekeningId,
        nmBank,
        noRekening,
        an,
        prioritas,
        narasi,
        top_type: editingHeader ? topType : undefined,
        top_days: editingHeader ? (topType === "CASH" ? 0 : Number(topDays)) : undefined,
        dp_percent: editingHeader ? (topType === "INSTALLMENT" ? Number(dpPercent) : 0) : undefined,
        metode: editingHeader ? metode : undefined,
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
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth={editingHeader ? "md" : "sm"}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {editingBank && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Rekening Pemasok
              </Typography>
              <RadioGroup
                row
                value={modeRekening}
                onChange={(e) => {
                  if (!loading) setModeRekening(e.target.value);
                }}
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
            </Box>
          )}

          {editingHeader && (
            <>
              <Divider />

              {/* Metode Pembayaran & Syarat Pembayaran (TOP) Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Metode Pembayaran (PO Grouping)
                </Typography>
                <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                  <RadioGroup
                    row
                    value={metode}
                    onChange={(e) => handleMetodeChange(e.target.value)}
                  >
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            height: "100%",
                            borderColor: metode === "tunai" ? "success.main" : "divider",
                            bgcolor: metode === "tunai" ? "action.hover" : "background.paper",
                            borderRadius: 1,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            if (!loading) handleMetodeChange("tunai");
                          }}
                        >
                          <FormControlLabel
                            value="tunai"
                            control={<Radio size="small" color="success" />}
                            label={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Tunai (Cash / Bayar di Muka)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Default TOP: CASH (0 Hari Jatuh Tempo)
                                </Typography>
                              </Box>
                            }
                            disabled={loading}
                            sx={{ m: 0, alignItems: "flex-start" }}
                          />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            height: "100%",
                            borderColor: metode === "kredit" ? "info.main" : "divider",
                            bgcolor: metode === "kredit" ? "action.hover" : "background.paper",
                            borderRadius: 1,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            if (!loading) handleMetodeChange("kredit");
                          }}
                        >
                          <FormControlLabel
                            value="kredit"
                            control={<Radio size="small" color="info" />}
                            label={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Kredit (Tempo / Bertahap)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Pilihan TOP: CREDIT (Net Hari) atau INSTALLMENT (DP)
                                </Typography>
                              </Box>
                            }
                            disabled={loading}
                            sx={{ m: 0, alignItems: "flex-start" }}
                          />
                        </Paper>
                      </Grid>
                    </Grid>
                  </RadioGroup>
                </FormControl>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Syarat Pembayaran (Terms of Payment / TOP)
                </Typography>
                <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                  <RadioGroup
                    value={topType}
                    onChange={(e) => handleTopTypeChange(e.target.value)}
                  >
                    <Grid container spacing={1.5}>
                      {PURCHASE_ORDER_TOP_TYPES.map((item) => (
                        <Grid item xs={12} sm={4} key={item.value}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              height: "100%",
                              borderColor: topType === item.value ? "primary.main" : "divider",
                              bgcolor: topType === item.value ? "action.hover" : "background.paper",
                              borderRadius: 1,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => {
                              if (!loading) {
                                handleTopTypeChange(item.value);
                              }
                            }}
                          >
                            <FormControlLabel
                              value={item.value}
                              control={<Radio size="small" />}
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.description}
                                  </Typography>
                                </Box>
                              }
                              disabled={loading}
                              sx={{ m: 0, alignItems: "flex-start" }}
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </RadioGroup>
                </FormControl>

                {topType === "CREDIT" && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Masa Kredit Jatuh Tempo (Hari)"
                        placeholder="Contoh: 30"
                        value={topDays}
                        onChange={(e) => setTopDays(e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">Hari</InputAdornment>,
                          inputProps: { min: 1 },
                        }}
                        helperText="Dihitung dari tanggal serah terima barang (GRN)"
                        required
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>
                )}

                {topType === "INSTALLMENT" && (
                  <Stack spacing={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Persentase Uang Muka DP (%)"
                          placeholder="Contoh: 30"
                          value={dpPercent}
                          onChange={(e) => setDpPercent(e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            inputProps: { min: 1, max: 99 },
                          }}
                          helperText="Termin 1 (DP dibayar sebelum pengiriman barang)"
                          required
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Masa Kredit Pelunasan (Hari)"
                          placeholder="Contoh: 14"
                          value={topDays}
                          onChange={(e) => setTopDays(e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">Hari</InputAdornment>,
                            inputProps: { min: 1 },
                          }}
                          helperText="Termin 2 (Jatuh tempo pelunasan setelah barang diterima/GRN)"
                          required
                          disabled={loading}
                        />
                      </Grid>
                    </Grid>

                    {/* Real-time installment simulation card */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: "grey.50",
                        borderColor: "info.light",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 1 }}>
                        SIMULASI KALKULASI TERMIN PEMBAYARAN REAL-TIME:
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Estimasi Total PO:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(poTotalValue)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                            Termin 1 - DP ({dpPercent}%):
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                            {formatCurrency(dpAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Jatuh tempo saat PO diterbitkan
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 600 }}>
                            Termin 2 - Pelunasan ({Math.max(0, 100 - (parseFloat(dpPercent) || 0))}%):
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.dark" }}>
                            {formatCurrency(sisaPelunasan)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Jatuh tempo {topDays || 0} hari pasca barang diterima (GRN)
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Stack>
                )}
              </Box>

              <Divider />

              <FormControl fullWidth size="small" disabled={loading}>
                <InputLabel id="select-prioritas-label">Prioritas</InputLabel>
                <Select
                  labelId="select-prioritas-label"
                  label="Prioritas"
                  value={prioritas}
                  onChange={(e) => setPrioritas(e.target.value)}
                >
                  <MenuItem value="" disabled>
                    <em>Belum ditentukan</em>
                  </MenuItem>
                  {PURCHASE_ORDER_PRIORITIES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {editingNarration && (
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
              disabled={loading}
            />
          )}
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
