export const EISENHOWER_PRIORITIES = [
  { value: 'urgent-important', label: 'Urgent & Important' },
  { value: 'important-not-urgent', label: 'Important, Not Urgent' },
  { value: 'urgent-not-important', label: 'Urgent, Not Important' },
  { value: 'neither', label: 'Not Urgent, Not Important' },
];

export function getTagLabel(value) {
  return EISENHOWER_PRIORITIES.find((tag) => tag.value === value)?.label ?? value;
}

export function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag) =>
    EISENHOWER_PRIORITIES.some((priority) => priority.value === tag),
  );
}
