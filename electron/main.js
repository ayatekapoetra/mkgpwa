const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

function checkServerReady(url) {
  return new Promise((resolve) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            setTimeout(check, 500);
          }
        })
        .on("error", () => {
          setTimeout(check, 500);
        });
    };
    check();
  });
}

let nextServer = null;

autoUpdater.logger = console;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let checkingDialog = null;

function openMarkdownFile(filePath, fileName) {
  const viewerPath = path.join(__dirname, "markdown-viewer.html");

  if (!fs.existsSync(filePath)) {
    dialog.showErrorBox(
      "File Not Found",
      `The documentation file could not be found:\n${filePath}`,
    );
    return;
  }

  const docWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    title: `${fileName} - MKG Desktop`,
    backgroundColor: "#ffffff",
  });

  const viewerUrl = `file://${viewerPath}?file=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`;
  docWindow.loadURL(viewerUrl);

  docWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function openDocumentationDialog() {
  const docsDir = path.join(__dirname, "..", "docs");
  const rootDir = path.join(__dirname, "..");

  dialog
    .showOpenDialog({
      title: "Select Documentation File",
      defaultPath: fs.existsSync(docsDir) ? docsDir : rootDir,
      properties: ["openFile"],
      filters: [
        { name: "Markdown Files", extensions: ["md"] },
        { name: "All Files", extensions: ["*"] },
      ],
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileName = path.basename(filePath, ".md");
        openMarkdownFile(filePath, fileName);
      }
    });
}

autoUpdater.on("checking-for-update", () => {
  console.log("Checking for update...");
  checkingDialog = dialog.showMessageBox({
    type: "info",
    title: "Checking for Updates",
    message: "Checking for updates...",
    buttons: [],
  });
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
  dialog
    .showMessageBox({
      type: "info",
      title: "Update Available",
      message: `Version ${info.version} is available. Download now?`,
      buttons: ["Download", "Later"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available. Current version:", info.version);
  dialog.showMessageBox({
    type: "info",
    title: "No Updates",
    message: `You are already running the latest version (${info.version}).`,
    buttons: ["OK"],
  });
});

autoUpdater.on("error", (err) => {
  console.error("Update error:", err);
  dialog.showMessageBox({
    type: "error",
    title: "Update Error",
    message: `Error checking for updates: ${err.message}`,
    buttons: ["OK"],
  });
});

autoUpdater.on("download-progress", (progress) => {
  console.log(
    `Download: ${progress.percent.toFixed(2)}% (${progress.transferred}/${progress.total})`,
  );
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded:", info.version);
  dialog
    .showMessageBox({
      type: "info",
      title: "Update Ready",
      message: `Version ${info.version} has been downloaded. Restart now?`,
      buttons: ["Restart", "Later"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

// Create application menu with developer tools
function createAppMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.reload();
            }
          },
        },
        {
          label: "Force Reload",
          accelerator: "CmdOrCtrl+Shift+R",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.reloadIgnoringCache();
            }
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        { role: "selectall", label: "Select All" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Developer Tools",
          accelerator: "F12",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          },
        },
        {
          label: "Open Developer Tools",
          accelerator:
            process.platform === "darwin" ? "Cmd+Option+I" : "Ctrl+Shift+I",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.openDevTools();
            }
          },
        },
        {
          label: "Close Developer Tools",
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.closeDevTools();
            }
          },
        },
        { type: "separator" },
        { role: "resetZoom", label: "Reset Zoom" },
        { role: "zoomIn", label: "Zoom In" },
        { role: "zoomOut", label: "Zoom Out" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Toggle Full Screen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize", label: "Minimize" },
        { role: "close", label: "Close" },
      ],
    },
    {
      label: "Documentation",
      submenu: [
        {
          label: "User Guide",
          accelerator: "CmdOrCtrl+Shift+H",
          click: () => {
            const userGuidePath = path.join(
              __dirname,
              "..",
              "docs",
              "USER_GUIDE.md",
            );
            openMarkdownFile(userGuidePath, "User Guide");
          },
        },
        {
          label: "README",
          click: () => {
            const readmePath = path.join(__dirname, "..", "README.md");
            openMarkdownFile(readmePath, "README");
          },
        },
        {
          label: "Troubleshooting",
          click: () => {
            const troubleshootPath = path.join(
              __dirname,
              "..",
              "docs",
              "TROUBLESHOOTING.md",
            );
            openMarkdownFile(troubleshootPath, "Troubleshooting");
          },
        },
        {
          label: "Changelog",
          click: () => {
            const changelogPath = path.join(__dirname, "..", "CHANGELOG.md");
            openMarkdownFile(changelogPath, "Changelog");
          },
        },
        { type: "separator" },
        {
          label: "Browse Documentation...",
          accelerator: "CmdOrCtrl+Shift+D",
          click: () => {
            openDocumentationDialog();
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Check for Updates...",
          click: () => {
            autoUpdater.checkForUpdates();
          },
        },
        { type: "separator" },
        {
          label: "Developer Tools Info",
          click: () => {
            const message = `
Developer Tools Shortcuts:
• F12: Toggle Developer Tools
• ${process.platform === "darwin" ? "Cmd+Option+I" : "Ctrl+Shift+I"}: Open Developer Tools
• Right-click: Context menu with Inspect Element
• ${process.platform === "darwin" ? "Cmd+R" : "Ctrl+R"}: Reload page
• ${process.platform === "darwin" ? "Cmd+Shift+R" : "Ctrl+Shift+R"}: Force reload
            `;
            console.log(message);
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create context menu with developer tools
function createContextMenu(win) {
  const contextMenuTemplate = [
    {
      label: "Inspect Element",
      click: () => {
        win.webContents.inspectElement(0, 0);
      },
    },
    {
      label: "Developer Tools",
      submenu: [
        {
          label: "Toggle Developer Tools",
          click: () => {
            win.webContents.toggleDevTools();
          },
        },
        {
          label: "Open Developer Tools",
          click: () => {
            win.webContents.openDevTools();
          },
        },
        {
          label: "Close Developer Tools",
          click: () => {
            win.webContents.closeDevTools();
          },
        },
      ],
    },
    { type: "separator" },
    {
      label: "Reload",
      click: () => {
        win.webContents.reload();
      },
    },
    {
      label: "Force Reload",
      click: () => {
        win.webContents.reloadIgnoringCache();
      },
    },
    { type: "separator" },
    {
      label: "Copy",
      role: "copy",
    },
    {
      label: "Paste",
      role: "paste",
    },
    {
      label: "Cut",
      role: "cut",
    },
    {
      label: "Select All",
      role: "selectAll",
    },
  ];

  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

  // Show context menu on right-click
  win.webContents.on("context-menu", (event, params) => {
    contextMenu.popup({ window: win, x: params.x, y: params.y });
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Enable context menu
      contextMenu: true,
    },
    show: false,
    backgroundColor: "#ffffff",
    title: "MKG Desktop",
    icon: path.join(__dirname, "../public/icons/logo.png"),
  });

  // Create context menu
  createContextMenu(win);

  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3005";
  let shouldAutoLoad = true;

  // Set environment variables for NextAuth in Electron
  if (!process.env.ELECTRON_START_URL) {
    process.env.NEXTAUTH_URL = "http://localhost:3005";
    process.env.NEXTAUTH_TRUST_HOST = "true";
    try {
      const nextCfg = require("../next.config.js");
      const envs = (nextCfg && nextCfg.env) || {};
      Object.keys(envs).forEach((k) => {
        if (process.env[k] == null) process.env[k] = String(envs[k]);
      });
    } catch (_) {}
  }

  // In production, load the Next.js app directly
  if (!process.env.ELECTRON_START_URL) {
    console.log("Loading Next.js app in production mode...");
    try {
      // Check if we're running from the packaged app
      const isPackaged = app.isPackaged;

      if (isPackaged) {
        const appPath = app.getAppPath();
        const next = require("next");
        const http = require("http");

        process.env.PORT = process.env.PORT || "3005";
        process.env.HOSTNAME = process.env.HOSTNAME || "localhost";

        const nextApp = next({ dev: false, dir: appPath });
        const handle = nextApp.getRequestHandler();

        await nextApp.prepare();

        const server = http.createServer((req, res) => {
          handle(req, res);
        });

        server.listen(Number(process.env.PORT), "localhost", () => {
          console.log(
            "Production Next.js server started on port",
            process.env.PORT,
          );
          setTimeout(() => {
            win.loadURL(`http://localhost:${process.env.PORT}`);
            win.show();
          }, 200);
        });

        nextServer = server;
      } else {
        // In development/unpackaged, rely on external Next.js server (npm start)
        console.log("Waiting for external Next.js server...");
        await checkServerReady(startUrl);
        console.log("Server is ready, loading application...");
      }
    } catch (error) {
      console.error("Failed to start production server:", error);
      // Show error window
      const errorWin = new BrowserWindow({
        width: 600,
        height: 400,
        parent: win,
        modal: true,
        show: false,
      });

      errorWin.loadURL(
        `data:text/html,<html><body style="font-family: Arial, sans-serif; padding: 20px;"><h2>Error Loading Application</h2><p>Failed to start the application server.</p><p><strong>Error:</strong> ${error.message}</p><button onclick="window.close()">Close</button></body></html>`,
      );
      errorWin.show();
      return;
    }
  } else if (process.env.ELECTRON_START_URL) {
    // Wait for server to be ready in development
    console.log("Waiting for Next.js server to be ready...");
    await checkServerReady(startUrl);
    console.log("Server is ready, loading application...");
  }

  try {
    await win.loadURL(startUrl);
    win.show();
  } catch (error) {
    console.error("Failed to load URL:", error);
    // Retry once after small delay (server warming)
    try {
      await new Promise((r) => setTimeout(r, 800));
      await checkServerReady(startUrl);
      await win.loadURL(startUrl);
      win.show();
    } catch (e2) {
      const errorWin = new BrowserWindow({
        width: 600,
        height: 400,
        parent: win,
        modal: true,
        show: false,
      });
      errorWin.loadURL(
        `data:text/html,<html><body style="font-family: Arial, sans-serif; padding: 20px;"><h2>Error Loading Application</h2><p>Failed to load the application. Please try again.</p><p><strong>Error:</strong> ${e2.message}</p><button onclick="window.close()">Close</button></body></html>`,
      );
      errorWin.show();
    }
  }

  win.webContents.on(
    "did-fail-load",
    async (_e, code, desc, _url, isMainFrame) => {
      if (isMainFrame) {
        console.warn("did-fail-load", code, desc);
        await new Promise((r) => setTimeout(r, 500));
        try {
          await checkServerReady(startUrl);
          await win.loadURL(startUrl);
        } catch (e3) {
          console.error("Retry after did-fail-load failed:", e3);
        }
      }
    },
  );

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  console.log("App is ready, creating window...");

  // Create application menu
  createAppMenu();

  try {
    await createWindow();
    console.log("Window created successfully");

    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
      }, 5000);
    }
  } catch (error) {
    console.error("Failed to create window:", error);
  }

  // Add global shortcuts for developer tools
  app.on("browser-window-created", (event, window) => {
    // F12 or Cmd+Option+I to toggle developer tools
    window.webContents.on("before-input-event", (event, input) => {
      if (input.key === "F12") {
        window.webContents.toggleDevTools();
        event.preventDefault();
      }
      // Cmd+Option+I on macOS, Ctrl+Shift+I on Windows/Linux
      if (
        (input.meta && input.alt && input.key === "i") ||
        (input.control && input.shift && input.key === "I")
      ) {
        window.webContents.toggleDevTools();
        event.preventDefault();
      }
      // Cmd+R on macOS, Ctrl+R on Windows/Linux to reload
      if (
        (input.meta && input.key === "r") ||
        (input.control && input.key === "r")
      ) {
        window.webContents.reload();
        event.preventDefault();
      }
      // Cmd+Shift+R on macOS, Ctrl+Shift+R on Windows/Linux to force reload
      if (
        (input.meta && input.shift && input.key === "r") ||
        (input.control && input.shift && input.key === "R")
      ) {
        window.webContents.reloadIgnoringCache();
        event.preventDefault();
      }
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
  // Kill Next.js server when all windows are closed
  if (nextServer) {
    console.log("Killing Next.js server...");
    if (typeof nextServer.kill === "function") {
      nextServer.kill();
    } else if (typeof nextServer.close === "function") {
      nextServer.close();
    }
    nextServer = null;
  }
  if (process.platform !== "darwin") {
    console.log("Quitting app...");
    app.quit();
  }
});

app.on("before-quit", () => {
  console.log("App is about to quit");
  // Kill Next.js server before quitting
  if (nextServer) {
    console.log("Killing Next.js server before quit...");
    if (typeof nextServer.kill === "function") {
      nextServer.kill();
    } else if (typeof nextServer.close === "function") {
      nextServer.close();
    }
    nextServer = null;
  }
});
