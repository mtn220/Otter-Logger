const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onChangeVideo: (callback) => ipcRenderer.on('change-video', callback),
    onClearVideoSrc: (callback) => ipcRenderer.on('clear-video-src', callback),
    openDevTools: () => ipcRenderer.send('open-dev-tools'),
});
