import { useEffect, useRef, useState } from 'react';
import { fetchSettings, saveSettings } from '../api';
import { applySettings, DEFAULT_SETTINGS, normalizeSettings } from '../lib/settings';

export default function useSettings({ setError }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const readyToSave = useRef(false);
  const skipSave = useRef(true);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        const normalized = normalizeSettings(data);
        setSettings(normalized);
        applySettings(normalized);
        readyToSave.current = true;
        skipSave.current = true;
      })
      .catch(() => setError('Could not load settings.'))
      .finally(() => setSettingsLoading(false));
  }, [setError]);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  function commitSettings(updater) {
    setSettings((prev) => {
      const next = normalizeSettings(
        typeof updater === 'function' ? updater(prev) : updater,
      );

      if (readyToSave.current) {
        if (skipSave.current) {
          skipSave.current = false;
        } else {
          saveQueue.current = saveQueue.current
            .then(() => saveSettings(next))
            .catch(() => setError('Could not save settings.'));
        }
      }

      return next;
    });
  }

  function setDarkMode(darkMode) {
    commitSettings((prev) => ({ ...prev, darkMode }));
  }

  function setAppColor(appColor) {
    commitSettings((prev) => ({ ...prev, appColor }));
  }

  return {
    settings,
    settingsLoading,
    setDarkMode,
    setAppColor,
  };
}
