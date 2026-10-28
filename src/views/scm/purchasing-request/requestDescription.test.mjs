import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  hasDescriptionContent,
  getRequestDescription,
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const listJsPath = path.resolve(__dirname, "./list.js");
const listJsSource = fs.readFileSync(listJsPath, "utf8");

test("AC-SCM004-04: hasDescriptionContent identifies empty, whitespace, and valid descriptions", () => {
  assert.equal(hasDescriptionContent(null), false);
  assert.equal(hasDescriptionContent(undefined), false);
  assert.equal(hasDescriptionContent(""), false);
  assert.equal(hasDescriptionContent("   "), false);
  assert.equal(hasDescriptionContent("\n\t  "), false);

  assert.equal(hasDescriptionContent("Orderan Site Kodal"), true);
  assert.equal(hasDescriptionContent("CAT 96 Replace Track Shoe by Habibi"), true);
  assert.equal(hasDescriptionContent("  LV 04 & LV 05 Orderan Ban  "), true);
  assert.equal(hasDescriptionContent(12345), true);
});

test("AC-SCM004-04: getRequestDescription provides appropriate fallbacks", () => {
  // Default desktop fallback is '-'
  assert.equal(getRequestDescription(null), "-");
  assert.equal(getRequestDescription(undefined), "-");
  assert.equal(getRequestDescription(""), "-");
  assert.equal(getRequestDescription("   "), "-");

  // Custom mobile fallback 'Tanpa deskripsi'
  assert.equal(getRequestDescription(null, "Tanpa deskripsi"), "Tanpa deskripsi");
  assert.equal(getRequestDescription("", "Tanpa deskripsi"), "Tanpa deskripsi");
  assert.equal(getRequestDescription("   ", "Tanpa deskripsi"), "Tanpa deskripsi");

  // Valid descriptions are preserved and trimmed
  assert.equal(
    getRequestDescription("  Orderan Site Kodal  "),
    "Orderan Site Kodal",
  );
  assert.equal(
    getRequestDescription("CAT 96 Replace Track Shoe by Habibi"),
    "CAT 96 Replace Track Shoe by Habibi",
  );
});

test("AC-SCM004-01 & AC-SCM004-03: list.js imports Tooltip and wraps desktop row.description", () => {
  assert.ok(
    listJsSource.includes("Tooltip,"),
    "Tooltip should be imported from @mui/material in list.js",
  );

  // Desktop table cell should have 3 lines: Bisnis, Cabang/Gudang, Narasi/Deskripsi
  assert.ok(
    listJsSource.includes("{row.bisnis?.name || row.bisnis?.initial || \"-\"}"),
    "Desktop list must render Baris 1: Bisnis Unit",
  );
  assert.ok(
    listJsSource.includes("{row.cabang?.nama || \"-\"}"),
    "Desktop list must render Baris 2: Cabang",
  );
  assert.ok(
    listJsSource.includes("{row.gudang?.nama || row.gudang?.name || \"-\"}"),
    "Desktop list must render Baris 2: Gudang",
  );
  assert.ok(
    listJsSource.includes("hasDescriptionContent(row.description)"),
    "Desktop list must check for non-empty description content",
  );
  assert.ok(
    listJsSource.includes("<Tooltip title={row.description} arrow placement=\"top\">"),
    "Desktop list must wrap description in MUI Tooltip with arrow and top placement",
  );
});

test("AC-SCM004-02: list.js enforces ellipsis styling constraints on desktop row.description", () => {
  const desktopEllipsisMatch = listJsSource.match(
    /sx=\{\{\s*maxWidth:\s*220,\s*whiteSpace:\s*"nowrap",\s*overflow:\s*"hidden",\s*textOverflow:\s*"ellipsis",\s*cursor:\s*"pointer",\s*\}\}/,
  );
  assert.ok(
    desktopEllipsisMatch,
    "Desktop description must enforce maxWidth 220, nowrap, overflow hidden, ellipsis, and pointer cursor",
  );
});

test("AC-SCM004-04: list.js renders '-' fallback without tooltip for empty description in desktop table", () => {
  assert.ok(
    listJsSource.includes(
      `<Typography\n                      variant="caption"\n                      color="text.secondary"\n                      display="block"\n                    >\n                      -\n                    </Typography>`,
    ),
    "Desktop list must render '-' in secondary caption without tooltip when description is empty",
  );
});

test("AC-SCM004-05: list.js displays description on mobile cards with tooltip and fallback", () => {
  assert.ok(
    listJsSource.includes("MobileRequestList"),
    "MobileRequestList must exist in list.js",
  );
  assert.ok(
    listJsSource.includes(
      `<Typography variant="body2" color="text.secondary">\n                    Tanpa deskripsi\n                  </Typography>`,
    ),
    "Mobile list must render 'Tanpa deskripsi' with secondary color when description is empty",
  );
});
