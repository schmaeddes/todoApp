const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  fetchTodos: () => ipcRenderer.invoke('todos:fetch'),
  saveTodos: (todos) => ipcRenderer.invoke('todos:save', todos),
  fetchProjects: () => ipcRenderer.invoke('projects:fetch'),
  saveProjects: (projects) => ipcRenderer.invoke('projects:save', projects),
  fetchSettings: () => ipcRenderer.invoke('settings:fetch'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getDataDir: () => ipcRenderer.invoke('app:getDataDir'),
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} else {
  window.electronAPI = electronAPI;
}
