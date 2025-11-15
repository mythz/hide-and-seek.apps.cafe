import React from 'react';
import type { PowerupSlot } from '../types/game.types';
import { formatTime } from '../utils/Helpers';

interface GameHUDProps {
  timeRemaining: number;
  powerups: PowerupSlot[];
  isDetected: boolean;
  fps?: number;
  showFPS: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  timeRemaining,
  powerups,
  isDetected,
  fps,
  showFPS,
}) => {
  return (
    <div className="game-hud">
      {/* Timer */}
      <div className="hud-timer">
        <div className="timer-label">TIME</div>
        <div className={`timer-value ${timeRemaining < 30 ? 'warning' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Detection Warning */}
      {isDetected && (
        <div className="detection-warning">
          WARNING: DETECTED!
        </div>
      )}

      {/* Powerup Slots */}
      <div className="powerup-slots">
        {powerups.map((slot, index) => (
          <div
            key={index}
            className={`powerup-slot ${!slot.powerup || slot.usesRemaining === 0 ? 'disabled' : ''}`}
          >
            <div className="slot-number">{index + 1}</div>
            {slot.powerup ? (
              <>
                <div className="powerup-icon">{slot.powerup.icon}</div>
                {slot.usesRemaining > 0 && (
                  <div className="uses-remaining">{slot.usesRemaining}</div>
                )}
                {slot.cooldownRemaining > 0 && (
                  <div className="cooldown-overlay">
                    {slot.cooldownRemaining.toFixed(1)}s
                  </div>
                )}
              </>
            ) : (
              <div className="empty-slot">—</div>
            )}
          </div>
        ))}
      </div>

      {/* FPS Counter */}
      {showFPS && fps !== undefined && (
        <div className="fps-counter">FPS: {fps}</div>
      )}
    </div>
  );
};
