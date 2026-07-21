import { normalizeTask } from './lib/tasks';
import { normalizeProject } from './projects';
import { normalizeSettings } from './lib/settings';

function isElectron() {
  return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

function isElectronRuntime() {
  return (
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')
  );
}

function assertElectronApi() {
  if (isElectronRuntime() && !isElectron()) {
    throw new Error(
      'Electron preload failed: window.electronAPI is not available',
    );
  }
}

export async function fetchTodos() {
  if (isElectron()) {
    const todos = await window.electronAPI.fetchTodos();
    return todos.map(normalizeTask);
  }

  assertElectronApi();

  const response = await fetch('/api/todos');
  if (!response.ok) {
    throw new Error('Failed to load todos');
  }

  const todos = await response.json();
  return todos.map(normalizeTask);
}

export async function saveTodos(todos) {
  const payload = todos.map(normalizeTask);

  if (isElectron()) {
    return window.electronAPI.saveTodos(payload);
  }

  assertElectronApi();

  const response = await fetch('/api/todos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save todos');
  }

  return response.json();
}

export async function fetchProjects() {
  if (isElectron()) {
    const projects = await window.electronAPI.fetchProjects();
    return projects.map(normalizeProject);
  }

  assertElectronApi();

  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to load projects');
  }

  const projects = await response.json();
  return projects.map(normalizeProject);
}

export async function saveProjects(projects) {
  const payload = projects.map(normalizeProject);

  if (isElectron()) {
    return window.electronAPI.saveProjects(payload);
  }

  assertElectronApi();

  const response = await fetch('/api/projects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save projects');
  }

  return response.json();
}

export async function fetchSettings() {
  if (isElectron()) {
    const settings = await window.electronAPI.fetchSettings();
    return normalizeSettings(settings);
  }

  assertElectronApi();

  const response = await fetch('/api/settings');
  if (!response.ok) {
    throw new Error('Failed to load settings');
  }

  const settings = await response.json();
  return normalizeSettings(settings);
}

export async function saveSettings(settings) {
  const payload = normalizeSettings(settings);

  if (isElectron()) {
    return window.electronAPI.saveSettings(payload);
  }

  assertElectronApi();

  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save settings');
  }

  return response.json();
}

export async function getDataDir() {
  if (isElectron()) {
    return window.electronAPI.getDataDir();
  }

  return null;
}
