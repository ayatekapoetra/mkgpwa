"use client";

import React from "react";
import { useMediaQuery, useTheme } from "@mui/material";

import ListEquipmentProjectWaDesktop from "./list-desktop";
import ListEquipmentProjectWaMobile from "./list-mobile";

export default function ListEquipmentProjectWa({ data, setParams }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <ListEquipmentProjectWaMobile data={data} setParams={setParams} />;
  }

  return <ListEquipmentProjectWaDesktop data={data} setParams={setParams} />;
}