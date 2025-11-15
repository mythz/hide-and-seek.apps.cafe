import React from 'react';
import { formatTime } from '../utils/Helpers';

interface GameOverProps {
  won: boolean;
  coinsEarned: number;
  timeElapsed: number;
  timeRemaining: number;
  wasDetectedCount: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  won,
  coinsEarned,
  timeElapsed,
  timeRemaining,
  wasDetectedCount,
  onPlayAgain,
  onMainMenu,
}) => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h1 className={won ? 'victory' : 'defeat'}>
          {won ? 'VICTORY!' : 'CAUGHT!'}
        </h1>

        {won && (
          <div className="victory-message">
            You survived the AI hunter!
          </div>
        )}

        <div className="game-stats">
          <div className="stat-row">
            <span>Time Survived:</span>
            <span>{formatTime(timeElapsed)}</span>
          </div>
          {won && (
            <div className="stat-row">
              <span>Time Remaining:</span>
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
          <div className="stat-row">
            <span>Times Detected:</span>
            <span>{wasDetectedCount}</span>
          </div>
          {won && (
            <div className="stat-row highlight">
              <span>Coins Earned:</span>
              <span className="coins">+{coinsEarned}</span>
            </div>
          )}
        </div>

        {wasDetectedCount === 0 && won && (
          <div className="perfect-run-badge">
            PERFECT STEALTH BONUS!
          </div>
        )}

        <div className="game-over-buttons">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
          <button className="btn btn-secondary" onClick={onMainMenu}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
