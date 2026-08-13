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

  const handleDelete = (fileId) => {
    setDeletingId(fileId);
    if (onDelete) onDelete(fileId);
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
        <Stack spacing={1}>
          {files.map((file) => {
            const fullUrl = file.url
              ? file.url.startsWith("http")
                ? file.url
                : `${S3_BASE}${file.url}`
              : null;
            return (
              <Stack
                key={file.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">
                    {file.datatype ? `.${file.datatype}` : ""}
                  </Typography>
                  {fullUrl ? (
                    <Link
                      href={fullUrl}
                      target="_blank"
                      rel="noopener"
                      variant="body2"
                      underline="hover"
                    >
                      Lihat file
                    </Link>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      File #{file.id}
                    </Typography>
                  )}
                </Stack>
                {canDelete && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                  >
                    {deletingId === file.id ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Trash size={16} />
                    )}
                  </IconButton>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}