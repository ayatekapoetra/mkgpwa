"use client";

import { Paper, Typography } from "@mui/material";

/** Lists downloadable files attached to the purchasing request. */
export default function AttachmentsCard({ files }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="h5">Lampiran</Typography>
      {files.map((file) => (
        <Typography
          key={file.id}
          component="a"
          href={file.url || file.path}
          target="_blank"
          display="block"
        >
          {file.filename || file.name || file.path}
        </Typography>
      ))}
    </Paper>
  );
}
