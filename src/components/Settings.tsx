import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useGameStore();

  return (
    <div className="settings-container">
      <h1>SETTINGS</h1>

      <div className="settings-section">
        <h2>Audio</h2>

        <div className="setting-item">
          <label htmlFor="music-volume">Music Volume</label>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.musicVolume}
            onChange={(e) => updateSettings({ musicVolume: parseFloat(e.target.value) })}
          />
          <span>{Math.round(settings.musicVolume * 100)}%</span>
        </div>

        <div className="setting-item">
          <label htmlFor="sfx-volume">SFX Volume</label>
          <input
            id="sfx-volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.sfxVolume}
            onChange={(e) => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
          />
          <span>{Math.round(settings.sfxVolume * 100)}%</span>
        </div>
      </div>

      <div className="settings-section">
        <h2>Display</h2>

        <div className="setting-item">
          <label htmlFor="show-fps">Show FPS</label>
          <input
            id="show-fps"
            type="checkbox"
            checked={settings.showFPS}
            onChange={(e) => updateSettings({ showFPS: e.target.checked })}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="show-minimap">Show Minimap</label>
          <input
            id="show-minimap"
            type="checkbox"
            checked={settings.showMinimap}
            onChange={(e) => updateSettings({ showMinimap: e.target.checked })}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>Controls</h2>

        <div className="setting-item">
          <label htmlFor="control-scheme">Control Scheme</label>
          <select
            id="control-scheme"
            value={settings.controlScheme}
            onChange={(e) =>
              updateSettings({ controlScheme: e.target.value as 'wasd' | 'arrows' })
            }
          >
            <option value="wasd">WASD</option>
            <option value="arrows">Arrow Keys</option>
          </select>
        </div>
      </div>
    </div>
  );
};
