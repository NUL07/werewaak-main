const { contextBridge, ipcRenderer } = require('electron');

// Forward renderer console calls to the main process for debugging packaged builds
const forward = (level, args) => {
  try {
    const safe = args.map(a => {
      try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
    });
    ipcRenderer.send('renderer-console', { level, args: safe });
  } catch (e) {
    // ignore
  }
};

['log', 'info', 'warn', 'error'].forEach(level => {
  const orig = console[level].bind(console);
  console[level] = (...args) => {
    forward(level, args);
    orig(...args);
  };
});

contextBridge.exposeInMainWorld('electron', {
  // placeholder API
});

// Intercept global fetch to forward network errors for debugging
try {
  const _fetch = globalThis.fetch;
  if (_fetch) {
    globalThis.fetch = async (...args) => {
      try { ipcRenderer.send('renderer-request', { url: args[0]?.toString?.() ?? String(args[0]) }); } catch (e) {}
      try {
        const res = await _fetch.apply(this, args);
        try { ipcRenderer.send('renderer-response', { url: args[0]?.toString?.() ?? String(args[0]), status: res.status }); } catch (e) {}
        return res;
      } catch (err) {
        try { ipcRenderer.send('renderer-error', { url: args[0]?.toString?.() ?? String(args[0]), message: err?.message }); } catch (e) {}
        throw err;
      }
    };
  }
} catch (e) {}
