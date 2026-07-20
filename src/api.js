import { normalizeTask } from './dates';
import { normalizeProject } from './projects';

export async function fetchTodos() {
  const response = await fetch('/api/todos');
  if (!response.ok) {
    throw new Error('Failed to load todos');
  }

  const todos = await response.json();
  return todos.map(normalizeTask);
}

export async function saveTodos(todos) {
  const payload = todos.map(normalizeTask);
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
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to load projects');
  }

  const projects = await response.json();
  return projects.map(normalizeProject);
}

export async function saveProjects(projects) {
  const payload = projects.map(normalizeProject);
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
