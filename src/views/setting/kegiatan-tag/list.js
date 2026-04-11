"use client";

import React from "react";
import { useMediaQuery, useTheme } from "@mui/material";

import ListGroupTagKegiatanDesktop from "./list-desktop";
import ListGroupTagKegiatanMobile from "./list-mobile";

export default function ListGroupTagKegiatan({ data, setParams }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <ListGroupTagKegiatanMobile data={data} setParams={setParams} />;
  }

  return <ListGroupTagKegiatanDesktop data={data} setParams={setParams} />;
}
