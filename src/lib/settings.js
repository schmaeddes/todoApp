export const DEFAULT_APP_COLOR_RGB = '35, 74, 122';

export const APP_COLOR_PRESETS = [
  { id: 'blue', label: 'Blue', rgb: '35, 74, 122' },
  { id: 'teal', label: 'Teal', rgb: '17, 94, 89' },
  { id: 'green', label: 'Green', rgb: '21, 128, 61' },
  { id: 'purple', label: 'Purple', rgb: '88, 28, 135' },
  { id: 'rose', label: 'Rose', rgb: '190, 18, 60' },
  { id: 'amber', label: 'Amber', rgb: '180, 83, 9' },
  { id: 'slate', label: 'Slate', rgb: '51, 65, 85' },
];

export const DEFAULT_SETTINGS = {
  darkMode: false,
  appColor: DEFAULT_APP_COLOR_RGB,
};

function parseRgbString(rgb) {
  const parts = String(rgb)
    .split(',')
    .map((part) => parseInt(part.trim(), 10));

  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return parseRgbString(DEFAULT_APP_COLOR_RGB);
  }

  return parts;
}

function formatRgb([r, g, b]) {
  return `${r}, ${g}, ${b}`;
}

function mixRgb([r, g, b], target, amount) {
  return [
    Math.round(r + (target[0] - r) * amount),
    Math.round(g + (target[1] - g) * amount),
    Math.round(b + (target[2] - b) * amount),
  ];
}

export function normalizeAppColor(value) {
  const rgb = String(value || DEFAULT_APP_COLOR_RGB).trim();
  const preset = APP_COLOR_PRESETS.find((item) => item.rgb === rgb);

  if (preset) {
    return preset.rgb;
  }

  const parts = rgb.split(',').map((part) => parseInt(part.trim(), 10));
  if (parts.length === 3 && parts.every((part) => part >= 0 && part <= 255)) {
    return formatRgb(parts);
  }

  return DEFAULT_APP_COLOR_RGB;
}

export function normalizeSettings(settings) {
  return {
    darkMode: Boolean(settings?.darkMode),
    appColor: normalizeAppColor(settings?.appColor),
  };
}

export function applyTheme(darkMode) {
  document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
}

export function applyAppColor(appColorRgb, darkMode = false) {
  const base = parseRgbString(appColorRgb);
  const hover = mixRgb(base, [255, 255, 255], darkMode ? 0.22 : 0.12);
  const sidebar = mixRgb(base, [0, 0, 0], darkMode ? 0.55 : 0.65);
  const baseStr = formatRgb(base);
  const root = document.documentElement.style;

  root.setProperty('--app-blue', `rgb(${baseStr})`);
  root.setProperty('--app-blue-hover', `rgb(${formatRgb(hover)})`);
  root.setProperty('--app-blue-ring', `rgba(${baseStr}, ${darkMode ? 0.2 : 0.15})`);
  root.setProperty('--sidebar-blue', `rgb(${formatRgb(sidebar)})`);
}

export function applySettings(settings) {
  const normalized = normalizeSettings(settings);
  applyTheme(normalized.darkMode);
  applyAppColor(normalized.appColor, normalized.darkMode);
}

export function getAppColorPreset(rgb) {
  return APP_COLOR_PRESETS.find((preset) => preset.rgb === rgb) ?? null;
}

export function isPresetAppColor(rgb) {
  return Boolean(getAppColorPreset(normalizeAppColor(rgb)));
}

export function rgbToHex(rgb) {
  const [r, g, b] = parseRgbString(rgb);
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '');

  if (value.length !== 6) {
    return DEFAULT_APP_COLOR_RGB;
  }

  const parts = [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];

  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return DEFAULT_APP_COLOR_RGB;
  }

  return formatRgb(parts);
}
