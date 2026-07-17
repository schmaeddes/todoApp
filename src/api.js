import { normalizeTask } from './dates';

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
