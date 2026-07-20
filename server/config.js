import fs from 'fs/promises';
import { CONFIG_FILE } from './paths.js';

const DEFAULT_APP_COLOR_RGB = '35, 74, 122';

const DEFAULT_SETTINGS = {
  darkMode: false,
  appColor: DEFAULT_APP_COLOR_RGB,
};

function normalizeAppColor(value) {
  const rgb = String(value || DEFAULT_APP_COLOR_RGB).trim();
  const parts = rgb.split(',').map((part) => parseInt(part.trim(), 10));

  if (parts.length === 3 && parts.every((part) => part >= 0 && part <= 255)) {
    return parts.join(', ');
  }

  return DEFAULT_APP_COLOR_RGB;
}

export function normalizeSettings(settings) {
  return {
    darkMode: Boolean(settings?.darkMode),
    appColor: normalizeAppColor(settings?.appColor),
  };
}

function parseConfigYaml(content) {
  const settings = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();

    if (rawValue === 'true') {
      settings[key] = true;
    } else if (rawValue === 'false') {
      settings[key] = false;
    } else {
      settings[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }

  return settings;
}

function stringifyConfigYaml(settings) {
  const normalized = normalizeSettings(settings);
  return `darkMode: ${normalized.darkMode}\nappColor: "${normalized.appColor}"\n`;
}

export async function readSettings() {
  let content;

  try {
    content = await fs.readFile(CONFIG_FILE, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return writeSettings(DEFAULT_SETTINGS);
    }
    throw err;
  }

  return normalizeSettings(parseConfigYaml(content));
}

export async function writeSettings(settings) {
  const normalized = normalizeSettings(settings);
  await fs.writeFile(CONFIG_FILE, stringifyConfigYaml(normalized), 'utf-8');
  return normalized;
}
