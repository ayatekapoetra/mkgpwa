"use client";

import { useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { DocumentText, Trash } from "iconsax-react";

const S3_BASE = "https://cdn.makkuragatama.id";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${S3_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function isImageAttachment(file) {
  const ext = String(
    file?.datatype || file?.url?.split(".").pop() || "",
  ).toLowerCase();
  return IMAGE_EXTS.includes(ext);
}

/** Card to list, upload, and soft-delete PO attachments (active when status open). */
export default function AttachmentCard({
  files = [],
  canUpload = false,
  canDelete = false,
  onUpload,
  onDelete,
  uploading = false,
}) {
  const inputRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleFileSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length && onUpload) onUpload(selected);
    event.target.value = "";
  };

  const handleDelete = async (fileId) => {
    if (deletingId !== null || !onDelete) return;
    setDeletingId(fileId);
    try {
      await onDelete(fileId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="h6">
          Lampiran {files.length > 0 ? `(${files.length})` : ""}
        </Typography>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<DocumentText />}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Mengunggah..." : "Upload Nota/Invoice"}
            </Button>
          </>
        )}
      </Stack>

      {uploading && (
        <Box sx={{ py: 1, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!files.length && !uploading && (
        <Typography variant="body2" color="text.secondary">
          Belum ada lampiran.
        </Typography>
      )}

      {files.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 1.5,
          }}
        >
          {files.map((file) => {
            const fullUrl = resolveUrl(file.url || file.full_url);
            const image = isImageAttachment(file);
            const label =
              file.url?.split("/").pop() ||
              (file.datatype ? `File .${file.datatype}` : `File #${file.id}`);

            return (
              <Box
                key={file.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  component={fullUrl ? "a" : "div"}
                  href={fullUrl || undefined}
                  target={fullUrl ? "_blank" : undefined}
                  rel={fullUrl ? "noopener noreferrer" : undefined}
                  sx={{
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: 140,
                    bgcolor: "action.hover",
                    textDecoration: "none",
                  }}
                >
                  {image && fullUrl ? (
                    <Box
                      component="img"
                      src={fullUrl}
                      alt={label}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{ height: "100%", color: "text.secondary" }}
                    >
                      <DocumentText size={36} />
                      <Typography variant="caption" sx={{ mt: 0.5 }}>
                        {(file.datatype || "file").toUpperCase()}
                      </Typography>
                    </Stack>
                  )}
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={0.5}
                  sx={{ p: 1 }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" fontWeight={700} noWrap display="block">
                      {label}
                    </Typography>
                    {fullUrl && (
                      <Link
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        underline="hover"
                      >
                        Lihat file
                      </Link>
                    )}
                  </Box>
                  {canDelete && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId !== null}
                    >
                      {deletingId === file.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Trash size={16} />
                      )}
                    </IconButton>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
