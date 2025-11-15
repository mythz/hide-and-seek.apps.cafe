import React, { useEffect, useRef, useState } from 'react';
import { Game as GameEngine } from '../game/Game';
import { GameHUD } from './GameHUD';
import { GameOver } from './GameOver';
import { useGameStore } from '../store/useGameStore';
import type { GameResult, Pet, PowerupSlot } from '../types/game.types';
import { GAME_CONFIG } from '../utils/Constants';

interface GameComponentProps {
  onReturnToMenu: () => void;
}

export const Game: React.FC<GameComponentProps> = ({ onReturnToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(GAME_CONFIG.GAME_DURATION);
  const [powerupSlots, setPowerupSlots] = useState<PowerupSlot[]>([]);
  const [isDetected, setIsDetected] = useState(false);
  const [fps, setFPS] = useState(0);

  const { activeLoadout, settings, recordGameResult } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize game
    const game = new GameEngine(canvasRef.current, settings.controlScheme);

    // Get pet data if equipped
    let petData: Pet | null = null;
    if (activeLoadout.petId) {
      // Create pet data from loadout
      petData = {
        id: activeLoadout.petId,
        name: 'Pet',
        spriteId: activeLoadout.petId,
        ability: 'early_warning',
        cooldown: 10,
        followOffset: { x: -30, y: 0 },
        followSpeed: 150,
      };
    }

    // Initialize and start game
    game.init(activeLoadout.skinId, petData, activeLoadout.powerups);
    game.setOnGameOver(handleGameOver);
    game.start();

    gameRef.current = game;

    // Update game state periodically
    const interval = setInterval(() => {
      if (game) {
        setTimeRemaining(game.getTimeRemaining());
        setPowerupSlots(game.getPowerupSlots());
        setIsDetected(game.isBotDetecting());
        setFPS(game.getFPS());
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, []);

  const handleGameOver = async (result: GameResult) => {
    setGameResult(result);
    await recordGameResult(result.won, result.timeRemaining, result.coinsEarned);
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    window.location.reload(); // Simple way to restart
  };

  const handleMainMenu = () => {
    onReturnToMenu();
  };

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.CANVAS_WIDTH}
        height={GAME_CONFIG.CANVAS_HEIGHT}
        id="game-canvas"
      />

      <GameHUD
        timeRemaining={timeRemaining}
        powerups={powerupSlots}
        isDetected={isDetected}
        fps={fps}
        showFPS={settings.showFPS}
      />

      {gameResult && (
        <GameOver
          won={gameResult.won}
          coinsEarned={gameResult.coinsEarned}
          timeElapsed={gameResult.timeElapsed}
          timeRemaining={gameResult.timeRemaining}
          wasDetectedCount={gameResult.wasDetectedCount}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
};
