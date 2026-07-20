import { useRef } from 'react';
import {
  APP_COLOR_PRESETS,
  getAppColorPreset,
  hexToRgb,
  rgbToHex,
} from '../lib/settings';

export default function SettingsPage({
  darkMode,
  appColor,
  disabled,
  onDarkModeChange,
  onAppColorChange,
}) {
  const colorInputRef = useRef(null);
  const isCustomColor = !getAppColorPreset(appColor);

  function openColorPicker() {
    colorInputRef.current?.click();
  }

  function handleCustomColorChange(event) {
    onAppColorChange(hexToRgb(event.target.value));
  }

  return (
    <div className="settings-page">
      <section className="settings-section" aria-labelledby="settings-display-title">
        <h2 id="settings-display-title" className="settings-section-title">
          Display
        </h2>
        <div className="settings-section-body">
          <div className="settings-row">
            <div className="settings-row-text">
              <h3 className="settings-row-title">Dark mode</h3>
              <p className="settings-row-description">
                Switch between light and dark color schemes.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              aria-label="Dark mode"
              className={'settings-switch' + (darkMode ? ' is-on' : '')}
              disabled={disabled}
              onClick={() => onDarkModeChange(!darkMode)}
            >
              <span className="settings-switch-thumb" />
            </button>
          </div>

          <div className="settings-row settings-row--stacked">
            <div className="settings-row-text">
              <h3 className="settings-row-title">App color</h3>
              <p className="settings-row-description">
                Choose the accent color used across the app.
              </p>
            </div>
            <div
              className="settings-color-options"
              role="radiogroup"
              aria-label="App color"
            >
              {APP_COLOR_PRESETS.map((preset) => {
                const isSelected = appColor === preset.rgb;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={preset.label}
                    title={preset.label}
                    className={
                      'settings-color-option' + (isSelected ? ' is-selected' : '')
                    }
                    style={{ backgroundColor: `rgb(${preset.rgb})` }}
                    disabled={disabled}
                    onClick={() => onAppColorChange(preset.rgb)}
                  />
                );
              })}

              <button
                type="button"
                role="radio"
                aria-checked={isCustomColor}
                aria-label="Custom color"
                title="Custom color"
                className={
                  'settings-color-option settings-color-option--add' +
                  (isCustomColor ? ' is-selected' : '')
                }
                style={
                  isCustomColor
                    ? { backgroundColor: `rgb(${appColor})` }
                    : undefined
                }
                disabled={disabled}
                onClick={openColorPicker}
              >
                <span className="settings-color-add-icon">+</span>
              </button>

              <input
                ref={colorInputRef}
                type="color"
                className="settings-color-input"
                value={rgbToHex(appColor)}
                disabled={disabled}
                onChange={handleCustomColorChange}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
