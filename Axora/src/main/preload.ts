// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';


const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

const axoraHandler = {
  setMode: (mode: 'compact' | 'hub' | 'hidden' | 'phivision') =>
    ipcRenderer.invoke('axora:set-mode', mode),
  getMode: () => ipcRenderer.invoke('axora:get-mode'),
  onModeChanged: (callback: (mode: 'compact' | 'hub' | 'hidden' | 'phivision') => void) => {
    const subscription = (_event: IpcRendererEvent, mode: 'compact' | 'hub' | 'hidden' | 'phivision') => callback(mode);
    ipcRenderer.on('axora:mode-changed', subscription);
    return () => ipcRenderer.removeListener('axora:mode-changed', subscription);
  },
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.invoke('axora:set-ignore-mouse', ignore),
  onTriggerPhiVision: (callback: () => void) => {
    const subscription = (_event: IpcRendererEvent) => callback();
    ipcRenderer.on('axora:trigger-phivision', subscription);
    return () => ipcRenderer.removeListener('axora:trigger-phivision', subscription);
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('axora', axoraHandler);

export type ElectronHandler = typeof electronHandler;
export type AxoraHandler = typeof axoraHandler;
