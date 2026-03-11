import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  gateway: {
    health: () => ipcRenderer.invoke('gateway:health'),
    start: () => ipcRenderer.invoke('gateway:start'),
    restart: () => ipcRenderer.invoke('gateway:restart'),
    getConfig: () => ipcRenderer.invoke('gateway:getConfig'),
    updateConfig: (config: { url?: string; token?: string }) =>
      ipcRenderer.invoke('gateway:updateConfig', config),
  },
  startup: {
    get: () => ipcRenderer.invoke('startup:get'),
    set: (enabled: boolean) => ipcRenderer.invoke('startup:set', enabled),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },
  dialog: {
    openImage: () => ipcRenderer.invoke('dialog:openImage'),
  },
});
