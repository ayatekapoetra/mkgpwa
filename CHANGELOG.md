# Changelog

All notable changes to MKG Desktop will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-01-19

### Added

- Excel export functionality for Heavy Equipment (HE) timesheet with 19 columns
- Excel export functionality for Dumptruck (DT/LT/LV) timesheet with 15 columns
- Excel export functionality for All Equipment timesheet with 22 columns (combined)
- Dropdown menu for selecting export type (HE/DT/All)
- New utility module `excelExport.js` with XLSX library integration
- Three new API endpoints for timesheet exports:
  - `/api/operation/timesheet/alat-berat/export-excel`
  - `/api/operation/timesheet/dumptruck/export-excel`
  - `/api/operation/timesheet/all/export-excel`
- Conditional column logic based on equipment category
- Excel styling with headers, auto-width columns, and borders

### Changed

- Updated timesheet list page with export options
- Improved data filtering to separate HE and DT/LT/LV categories
- Enhanced error handling with detailed console logging
- Updated version badge in UI to v1.4.0

### Fixed

- Fixed `approvedby` field to use `karyawan_id` instead of `user_id`
- Fixed route ordering to prevent conflicts with dynamic parameters
- Fixed null handling for optional fields (lokasi_to, ritase)
- Improved error messages for export failures

### Technical

- Added `EXPORT_EXCEL_ALAT_BERAT` service method in backend
- Added `EXPORT_EXCEL_DUMPTRUCK` service method in backend
- Added `EXPORT_EXCEL_ALL` service method in backend
- Added `approvedByKaryawan` relation in DailyTimesheet model
- Added `lokasiTujuan` relation support in TimesheetItem
- Optimized queries with eager loading to prevent N+1 issues

## [1.0.9] - 2025-10-09

### Changed

- Updated badge to success color with larger size for v1.0.9
- Auto-update testing: v1.0.8 → v1.0.9

## [1.0.8] - 2025-10-09

### Fixed

- Fixed CI build by disabling electron-builder auto-publish
- CI now handles all uploads to GitHub Releases
- Successfully built and published DMG, EXE, and latest.yml files

## [1.0.5] - 2025-10-09

### Changed

- Updated badge style to filled secondary color with bold font
- Auto-update testing version

## [1.0.4] - 2025-10-09

### Infrastructure

- First successful CI/CD build with GitHub Actions
- macOS arm64 DMG and Windows x64 installer published

## [1.0.3] - 2025-10-09

### Changed

- Changed version badge color to success (green) for better visibility
- Ready for auto-update testing with GitHub Actions CI/CD

## [1.0.2] - 2025-10-09

### Changed

- Enhanced footer UI with version badge chip
- Updated footer text color to primary theme color
- Improved visual hierarchy in footer section

## [1.0.1] - 2025-10-09

### Changed

- Updated dashboard footer branding from "Able Pro" to "MakkuragaTama Dashboard Versi 1.0.1"
- Updated footer links to makkuragatama.id domain

## [1.0.0] - 2025-10-09

### Added

- Initial Electron desktop application release
- Next.js SSR integration with Electron
- NextAuth authentication support
- Auto-update functionality via electron-updater
- Native macOS (Apple Silicon) and Windows x64 builds
- Login and home page routing
- Menu item "Check for Updates..." in Help menu
- Automatic update check on app startup (packaged builds only)

### Fixed

- Resolved middleware/auth runtime issues in packaged builds
- Fixed initial load ERR_ABORTED with retry mechanism
- Removed conflicting next.config.mjs

### Infrastructure

- GitHub Releases as update distribution provider
- DMG installer for macOS (arm64)
- NSIS installer for Windows (x64)
- Build artifacts ignored in git (/dist)
