import React from 'react';
import type { GameProgress } from '../types/game.types';
import { formatTime } from '../utils/Helpers';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  stats: GameProgress | null;
  coins: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenShop,
  onOpenSettings,
  stats,
  coins,
}) => {
  return (
    <div className="main-menu">
      <h1 className="game-title">HIDE & SEEK AI</h1>

      <div className="stats-summary">
        <div className="stat">
          <span className="stat-label">Coins</span>
          <span className="stat-value">{coins}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Wins</span>
          <span className="stat-value">{stats?.totalWins || 0}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Best Time</span>
          <span className="stat-value">{formatTime(stats?.bestTime || 0)}</span>
        </div>
      </div>

      <div className="menu-buttons">
        <button className="btn btn-primary" onClick={onStartGame}>
          PLAY
        </button>
        <button className="btn btn-secondary" onClick={onOpenShop}>
          SHOP
        </button>
        <button className="btn btn-secondary" onClick={onOpenSettings}>
          SETTINGS
        </button>
      </div>

      <div className="quick-tips">
        <h3>How to Play:</h3>
        <ul>
          <li>Hide from the AI bot for 3 minutes</li>
          <li>Use portals to escape quickly</li>
          <li>Activate powerups with number keys 1-3</li>
          <li>Stay quiet to avoid detection</li>
        </ul>
      </div>
    </div>
  );
};
