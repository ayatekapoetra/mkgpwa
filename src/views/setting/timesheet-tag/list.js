"use client";

import React from "react";
import { useMediaQuery, useTheme } from "@mui/material";

import ListGroupTagDesktop from "./list-desktop";
import ListGroupTagMobile from "./list-mobile";

export default function ListGroupTagTimesheet({ data, setParams }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <ListGroupTagMobile data={data} setParams={setParams} />;
  }

  return <ListGroupTagDesktop data={data} setParams={setParams} />;
}
