const { contextBridge } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getLocalIP: () => {
    try {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          // Check for IPv4 and non-internal loopbacks
          if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
            return iface.address;
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch local IP:", e);
    }
    return '127.0.0.1';
  }
});
