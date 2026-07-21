export const EISENHOWER_PRIORITIES = [
  { value: 1, label: 'Urgent & Important' },
  { value: 2, label: 'Important, Not Urgent' },
  { value: 3, label: 'Urgent, Not Important' },
];

const LEGACY_TAG_VALUES = {
  'urgent-important': 1,
  'important-not-urgent': 2,
  'urgent-not-important': 3,
};

const VALID_TAGS = new Set([1, 2, 3]);

export function parseTagValue(tag) {
  if (typeof tag === 'number' && VALID_TAGS.has(tag)) {
    return tag;
  }

  if (typeof tag === 'string') {
    const trimmed = tag.trim();
    const asNumber = Number.parseInt(trimmed, 10);
    if (VALID_TAGS.has(asNumber) && String(asNumber) === trimmed) {
      return asNumber;
    }

    const legacy = LEGACY_TAG_VALUES[trimmed];
    if (legacy) {
      return legacy;
    }
  }

  return null;
}

export function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.map(parseTagValue).filter((tag) => tag !== null);
}

export function getTagLabel(value) {
  const normalized = parseTagValue(value);
  if (normalized === null) {
    return String(value);
  }

  return (
    EISENHOWER_PRIORITIES.find((tag) => tag.value === normalized)?.label ??
    String(value)
  );
}

export function getTaskPriority(tags) {
  const normalized = normalizeTags(tags);
  if (normalized.length === 0) {
    return null;
  }

  return Math.min(...normalized);
}

export function isHighestPriority(tags) {
  return getTaskPriority(tags) === 1;
}
