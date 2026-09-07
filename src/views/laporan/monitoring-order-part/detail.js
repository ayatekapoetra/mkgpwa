"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

import {
  useMonitoringOrderPartDetail,
  useMonitoringOrderPartStageDetail,
} from "api/monitoring-order-part";
import {
  displayValue,
  errorMessage,
  formatDate,
  formatQuantity,
  stageColor,
  stageLabel,
} from "./presentation";

function Field({ label, children }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {displayValue(children)}
      </Typography>
    </Grid>
  );
}

function NativeLink({ href, children = "Buka dokumen native" }) {
  if (!href) return null;
  return (
    <Button
      component={Link}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="outlined"
      size="small"
      endIcon={<OpenInNewOutlinedIcon />}
    >
      {children}
    </Button>
  );
}

function LifecycleDetail({ data }) {
  const tracking = data?.tracking || {};
  const quantity = tracking.quantities || {};
  const documents = data?.documents || [];
  const timeline = data?.timeline || [];
  const anomalies = data?.anomalies || [];
  const timelineDotColor = (eventType) => {
    const color = stageColor(eventType);
    return color === "default" ? "grey.400" : `${color}.main`;
  };
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip
          label={stageLabel(tracking.current_stage)}
          color={stageColor(tracking.current_stage)}
        />
        <Chip
          variant="outlined"
          label={`Procurement: ${stageLabel(tracking.procurement_stage)}`}
          color={stageColor(tracking.procurement_stage)}
        />
        <Chip
          variant="outlined"
          label={`Finance: ${stageLabel(tracking.finance_stage)}`}
          color={stageColor(tracking.finance_stage)}
        />
        <Chip
          variant="outlined"
          label={`Fulfillment: ${stageLabel(tracking.fulfillment_stage)}`}
          color={stageColor(tracking.fulfillment_stage)}
        />
      </Stack>
      <Grid container spacing={2}>
        <Field label="Tracking ID">
          {tracking.tracking_key || tracking.tracking_id}
        </Field>
        <Field label="Requested">
          {formatQuantity(quantity.requested)} {quantity.uom}
        </Field>
        <Field label="Approved">
          {formatQuantity(quantity.approved)} {quantity.uom}
        </Field>
        <Field label="Ordered">
          {formatQuantity(quantity.ordered)} {quantity.uom}
        </Field>
        <Field label="Shipped">
          {formatQuantity(quantity.shipped)} {quantity.uom}
        </Field>
        <Field label="Received / Outstanding">
          {formatQuantity(quantity.received)} /{" "}
          {formatQuantity(quantity.outstanding)} {quantity.uom}
        </Field>
      </Grid>
      <Divider />
      <Typography variant="h6">Dokumen</Typography>
      <Stack spacing={1}>
        {documents.map((document, index) => (
          <PaperRow key={`${document.type}-${document.id || index}`}>
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {displayValue(document.type)} | {displayValue(document.code)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stageLabel(document.status)} |{" "}
                {formatDate(document.date, true)}
              </Typography>
            </Box>
            <NativeLink href={document.native_url}>Buka</NativeLink>
          </PaperRow>
        ))}
        {!documents.length ? (
          <Typography color="text.secondary">
            Belum ada dokumen terkait.
          </Typography>
        ) : null}
      </Stack>
      <Divider />
      <Typography variant="h6">Timeline</Typography>
      <Stack spacing={0}>
        {timeline.map((event, index) => (
          <Stack
            key={`${event.stage}-${event.event_at}-${index}`}
            direction="row"
            spacing={1.5}
            sx={{
              position: "relative",
              pb: 2,
              "&:not(:last-child)::before": {
                content: '""',
                position: "absolute",
                left: 7,
                top: 18,
                bottom: 0,
                borderLeft: "2px solid",
                borderColor: "divider",
              },
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: timelineDotColor(event.event_type),
                mt: 0.4,
                zIndex: 1,
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {stageLabel(event.stage)} | {stageLabel(event.event_type)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(event.event_at, true)}
                {event.actor_name ? ` | ${event.actor_name}` : ""}
                {event.qty !== null && event.qty !== undefined
                  ? ` | Qty ${formatQuantity(event.qty)}`
                  : ""}
              </Typography>
            </Box>
          </Stack>
        ))}
        {!timeline.length ? (
          <Typography color="text.secondary">
            Timeline belum tersedia.
          </Typography>
        ) : null}
      </Stack>
      {anomalies.length ? (
        <>
          <Divider />
          <Alert severity="warning">
            <Typography variant="subtitle2">Anomaly aktif</Typography>
            {anomalies.map((anomaly, index) => (
              <Typography key={anomaly.id || index} variant="body2">
                {displayValue(anomaly.anomaly_code || anomaly.code)}:{" "}
                {displayValue(anomaly.description, "")}
              </Typography>
            ))}
          </Alert>
        </>
      ) : null}
    </Stack>
  );
}

function PaperRow({ children }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      gap={1}
      sx={{
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      {children}
    </Stack>
  );
}

function StageDetail({ data }) {
  const header = data?.header || {};
  const monitored = data?.monitored_item || {};
  const items = data?.items || [];
  const actors = data?.actors || [];
  const attachments = data?.attachments || [];
  return (
    <Stack spacing={2.5}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        <Chip
          label={stageLabel(data?.stage)}
          color={stageColor(header.status)}
        />
        <NativeLink href={data?.native_url} />
      </Stack>
      <Grid container spacing={2}>
        <Field label="Kode Dokumen">{header.document_code}</Field>
        <Field label="Tanggal Dokumen">
          {formatDate(header.document_date, true)}
        </Field>
        <Field label="Status">{stageLabel(header.status)}</Field>
        <Field label="Tracking ID">{data?.tracking_id}</Field>
        <Field label="Barang">
          {[monitored.item_code, monitored.item_name]
            .filter(Boolean)
            .join(" - ")}
        </Field>
        <Field label="Quantity">
          {formatQuantity(monitored.qty)} {monitored.uom}
        </Field>
      </Grid>
      <Divider />
      <Typography variant="h6">Item Dokumen</Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>Kode</TableCell>
              <TableCell>Barang</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>UOM</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id || item.item_id || index}>
                <TableCell>
                  {displayValue(item.item_code || item.code)}
                </TableCell>
                <TableCell>
                  {displayValue(item.item_name || item.name)}
                </TableCell>
                <TableCell align="right">
                  {formatQuantity(item.qty ?? item.quantity)}
                </TableCell>
                <TableCell>{displayValue(item.uom)}</TableCell>
              </TableRow>
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Tidak ada sibling item.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Box>
      {actors.length ? (
        <>
          <Typography variant="h6">Aktor</Typography>
          <Stack spacing={1}>
            {actors.map((actor, index) => (
              <PaperRow key={actor.id || index}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {displayValue(actor.name || actor.actor_name)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {displayValue(actor.role || actor.action, "")}
                  </Typography>
                </Box>
                <Typography variant="caption">
                  {formatDate(actor.date || actor.event_at, true)}
                </Typography>
              </PaperRow>
            ))}
          </Stack>
        </>
      ) : null}
      {attachments.length ? (
        <>
          <Typography variant="h6">Lampiran</Typography>
          <Stack spacing={1}>
            {attachments.map((attachment, index) => (
              <PaperRow key={attachment.id || index}>
                <Typography variant="body2">
                  {displayValue(attachment.name || attachment.filename)}
                </Typography>
                <NativeLink href={attachment.url}>Buka</NativeLink>
              </PaperRow>
            ))}
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}

export default function MonitoringOrderPartDetail({ context, onClose }) {
  const trackingId = context?.trackingId;
  const detail = useMonitoringOrderPartDetail(
    context?.stage ? null : trackingId,
  );
  const stageDetail = useMonitoringOrderPartStageDetail(
    trackingId,
    context?.stage,
  );
  const result = context?.stage ? stageDetail : detail;
  return (
    <Drawer
      anchor="right"
      open={Boolean(context)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100vw", md: 760 },
          maxWidth: "100%",
          height: "100%",
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Stack>
            <Typography variant="h5">
              {context?.stage
                ? `Detail ${stageLabel(context.stage)}`
                : "Detail Lifecycle Order Part"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Read-only
            </Typography>
          </Stack>
          <IconButton aria-label="Tutup detail" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />
        {result.refreshing ? <LinearProgress /> : null}
        <Box sx={{ p: 2, overflowY: "auto", flex: 1 }}>
          {result.loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
              sx={{ minHeight: 240 }}
            >
              <CircularProgress />
              <Typography color="text.secondary">Memuat detail...</Typography>
            </Stack>
          ) : null}
          {!result.loading && result.error ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => result.retry()}
                >
                  Retry
                </Button>
              }
            >
              {errorMessage(result.error, "Gagal memuat detail order part.")}
            </Alert>
          ) : null}
          {!result.loading && !result.error && result.data ? (
            context?.stage ? (
              <StageDetail data={result.data} />
            ) : (
              <LifecycleDetail data={result.data} />
            )
          ) : null}
        </Box>
      </Stack>
    </Drawer>
  );
}
