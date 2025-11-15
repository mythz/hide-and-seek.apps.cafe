import { useEffect, useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { Shop } from './components/Shop';
import { Settings } from './components/Settings';
import { useGameStore } from './store/useGameStore';
import type { GameState } from './types/game.types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<GameState>('main_menu');
  const { loadData, coins, stats } = useGameStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'main_menu':
        return (
          <MainMenu
            onStartGame={() => setCurrentScreen('playing')}
            onOpenShop={() => setCurrentScreen('shop')}
            onOpenSettings={() => setCurrentScreen('settings')}
            stats={stats}
            coins={coins}
          />
        );

      case 'playing':
        return <Game onReturnToMenu={() => setCurrentScreen('main_menu')} />;

      case 'shop':
        return (
          <div className="screen-container">
            <Shop />
            <button
              className="btn btn-secondary back-button"
              onClick={() => setCurrentScreen('main_menu')}
            >
              BACK
            </button>
          </div>
        );

      case 'settings':
        return (
          <div className="screen-container">
            <Settings />
            <button
              className="btn btn-secondary back-button"
              onClick={() => setCurrentScreen('main_menu')}
            >
              BACK
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
}

export default App;
