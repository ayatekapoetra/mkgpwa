# Changelog

All notable changes to MKG Desktop will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
