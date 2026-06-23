const path = require("path");
const fs = require("fs");
const http = require("http");
const { app, BrowserWindow, ipcMain } = require("electron");

let mainWindow = null;
let staticServer = null;
let staticServerPort = null;

// Use a writable Electron user-data folder
const userDataPath = path.join(app.getPath("appData"), "Werewaak");

app.setPath("userData", userDataPath);
// Also force Chromium to use the same user-data directory (prevents using project tmp)
try {
  app.commandLine.appendSwitch('user-data-dir', userDataPath);
} catch (e) {
  // ignore if appendSwitch is not available at this time
}

// Start a local server for the Vite dist folder.
// This avoids file:// routing and asset-loading issues.
function startStaticServer() {
  return new Promise((resolve, reject) => {
    const distDir = path.join(__dirname, "..", "dist");

    staticServer = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split("?")[0]);

        if (urlPath === "/") {
          urlPath = "/index.html";
        }

        const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
        const filePath = path.join(distDir, safePath);

        if (!filePath.startsWith(distDir)) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        fs.stat(filePath, (error, stat) => {
          if (error || !stat) {
            // React Router fallback
            streamFile(path.join(distDir, "index.html"), res);
            return;
          }

          if (stat.isDirectory()) {
            streamFile(path.join(filePath, "index.html"), res);
            return;
          }

          streamFile(filePath, res);
        });
      } catch (error) {
        res.statusCode = 500;
        res.end("Server error");
      }
    });

    staticServer.on("error", reject);

    staticServer.listen(0, "127.0.0.1", () => {
      staticServerPort = staticServer.address().port;
      resolve(staticServerPort);
    });
  });
}

function streamFile(filePath, res) {
  const extension = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
  };

  res.setHeader(
    "Content-Type",
    mimeTypes[extension] || "application/octet-stream"
  );

  const stream = fs.createReadStream(filePath);

  stream.on("error", () => {
    res.statusCode = 404;
    res.end("File not found");
  });

  stream.pipe(res);
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    show: false,

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    fs.mkdirSync(userDataPath, { recursive: true });

    const startUrl =
      process.env.ELECTRON_START_URL ||
      `http://127.0.0.1:${await startStaticServer()}`;

    createWindow(startUrl);
  } catch (error) {
    console.error("Could not start Electron application:", error);

    createWindow(
      `file://${path.join(__dirname, "..", "dist", "index.html")}`
    );
  }

  ipcMain.handle("get-app-version", () => app.getVersion());

  ipcMain.on("window-minimize", () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on("window-maximize", () => {
    if (!mainWindow) return;

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on("window-close", () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const startUrl =
        process.env.ELECTRON_START_URL ||
        `http://127.0.0.1:${staticServerPort}`;

      createWindow(startUrl);
    }
  });
});

app.on("before-quit", () => {
  if (staticServer) {
    staticServer.close();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});