# Frontend Documentation Index

## 📱 Frontend (Next.js + Tauri) Documentation

Documentation for the Next.js web application and Tauri desktop wrapper.

---

## 📚 Table of Contents

### 🔨 Build & Deployment

1. [BUILD_GUIDE.md](./BUILD_GUIDE.md)
   - Build instructions for production
   - Environment setup
   - Deployment process
   - Build optimization

### 🗑️ Maintenance

2. [README_UNINSTALL.md](./README_UNINSTALL.md)
   - Uninstall instructions
   - Cleanup procedures
   - Remove dependencies

---

## 📂 Project Structure

```
fe/
├── doc/
│   ├── INDEX.md              # This file
│   ├── BUILD_GUIDE.md        # Build & deployment
│   └── README_UNINSTALL.md   # Uninstall guide
├── src/
│   ├── app/                  # Next.js app directory
│   ├── components/           # React components
│   ├── api/                  # API calls
│   ├── lib/                  # Utilities
│   └── views/                # Page views
├── src-tauri/                # Tauri desktop wrapper
├── public/                   # Static assets
└── README.md                 # Main README
```

---

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Tauri desktop app
npm run tauri dev
```

### Production Build

See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for detailed instructions.

```bash
# Build Next.js
npm run build

# Build Tauri app
npm run tauri build
```

---

## 📖 Related Documentation

### Project Documentation
📁 [Root Documentation](../../doc/INDEX.md)
- [SETUP_TAURI.md](../../doc/SETUP_TAURI.md) - Tauri setup guide
- [CARA_BUKA_DEVTOOLS.md](../../doc/CARA_BUKA_DEVTOOLS.md) - DevTools guide
- [DISTRIBUTION_PACKAGE.md](../../doc/DISTRIBUTION_PACKAGE.md) - Packaging guide

### Backend Documentation
📁 [Backend Documentation](../../be/doc/)

### Mobile Documentation
📁 [Mobile Documentation](../../mobile/doc/INDEX.md)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **UI Library**: Material-UI (MUI)
- **Desktop**: Tauri
- **State Management**: React Context
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Forms**: Formik + Yup
- **Icons**: Iconsax React

---

## 📝 Document Status

| Document | Status | Category | Last Updated |
|----------|--------|----------|--------------|
| BUILD_GUIDE.md | ✅ Complete | Build | - |
| README_UNINSTALL.md | ✅ Complete | Maintenance | - |

---

## 🔍 Common Tasks

### Build for Production
See: [BUILD_GUIDE.md](./BUILD_GUIDE.md)

### Uninstall Application
See: [README_UNINSTALL.md](./README_UNINSTALL.md)

### Setup Tauri
See: [../../doc/SETUP_TAURI.md](../../doc/SETUP_TAURI.md)

### Open DevTools
See: [../../doc/CARA_BUKA_DEVTOOLS.md](../../doc/CARA_BUKA_DEVTOOLS.md)

---

## 📞 Support

For frontend-specific issues:
1. Check documentation in this folder
2. Review main [README.md](../README.md)
3. Check Tauri docs: [../../doc/SETUP_TAURI.md](../../doc/SETUP_TAURI.md)

---

**Last Updated:** October 2, 2025  
**Maintained By:** Frontend Team
