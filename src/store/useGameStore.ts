import { create } from 'zustand';
import type { GameState, GameProgress, ShopItem, LocalSettings } from '../types/game.types';
import { storageManager } from '../game/managers/StorageManager';
import { SHOP_CATALOG } from '../utils/ShopCatalog';

interface GameStore {
  // Game state
  gameState: GameState;
  setGameState: (state: GameState) => void;

  // Player data
  coins: number;
  stats: GameProgress | null;
  unlockedItems: string[];
  activeLoadout: {
    skinId: string;
    petId: string | null;
    powerups: string[];
  };

  // Settings
  settings: LocalSettings;

  // Actions
  loadData: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  purchaseItem: (item: ShopItem) => Promise<boolean>;
  equipSkin: (skinId: string) => Promise<void>;
  equipPet: (petId: string | null) => Promise<void>;
  equipPowerup: (powerupId: string, slot: number) => Promise<void>;
  recordGameResult: (won: boolean, timeRemaining: number, coinsEarned: number) => Promise<void>;
  updateSettings: (settings: Partial<LocalSettings>) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: 'main_menu',
  coins: 0,
  stats: null,
  unlockedItems: ['default'],
  activeLoadout: {
    skinId: 'default',
    petId: null,
    powerups: [],
  },
  settings: {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    showFPS: false,
    showMinimap: true,
    controlScheme: 'wasd',
  },

  setGameState: (gameState: GameState) => set({ gameState }),

  loadData: async () => {
    try {
      await storageManager.init();

      const stats = await storageManager.getStats();
      const coins = await storageManager.getCoins();
      const loadout = await storageManager.getActiveLoadout();
      const unlockedItems = await storageManager.getUnlockedItems();
      const settings = storageManager.loadSettings();

      set({
        stats,
        coins,
        activeLoadout: loadout || {
          skinId: 'default',
          petId: null,
          powerups: [],
        },
        unlockedItems: ['default', ...unlockedItems.map(item => item.id)],
        settings,
      });
    } catch (error) {
      console.error('Failed to load game data:', error);
    }
  },

  addCoins: async (amount: number) => {
    await storageManager.addCoins(amount);
    const coins = await storageManager.getCoins();
    set({ coins });
  },

  purchaseItem: async (item: ShopItem) => {
    const { coins, unlockedItems } = get();

    // Check if already unlocked
    if (unlockedItems.includes(item.id)) {
      return false;
    }

    // Check if enough coins
    if (coins < item.cost) {
      return false;
    }

    // Spend coins and unlock item
    const success = await storageManager.spendCoins(item.cost);
    if (success) {
      await storageManager.unlockItem(item.id, item.type);
      const newCoins = await storageManager.getCoins();
      set({
        coins: newCoins,
        unlockedItems: [...unlockedItems, item.id],
      });

      // Auto-equip if it's the first of its type
      if (item.type === 'skin' && unlockedItems.filter(id => {
        const shopItem = SHOP_CATALOG.find(si => si.id === id);
        return shopItem?.type === 'skin';
      }).length === 1) {
        await get().equipSkin(item.id);
      }

      return true;
    }

    return false;
  },

  equipSkin: async (skinId: string) => {
    const { unlockedItems } = get();
    if (!unlockedItems.includes(skinId)) return;

    await storageManager.setActiveLoadout({ skinId });
    set(state => ({
      activeLoadout: { ...state.activeLoadout, skinId },
    }));
  },

  equipPet: async (petId: string | null) => {
    const { unlockedItems } = get();
    if (petId && !unlockedItems.includes(petId)) return;

    await storageManager.setActiveLoadout({ petId });
    set(state => ({
      activeLoadout: { ...state.activeLoadout, petId },
    }));
  },

  equipPowerup: async (powerupId: string, slot: number) => {
    const { unlockedItems, activeLoadout } = get();
    if (!unlockedItems.includes(powerupId)) return;
    if (slot < 0 || slot > 2) return;

    const newPowerups = [...activeLoadout.powerups];
    newPowerups[slot] = powerupId;

    await storageManager.setActiveLoadout({ powerups: newPowerups });
    set(state => ({
      activeLoadout: { ...state.activeLoadout, powerups: newPowerups },
    }));
  },

  recordGameResult: async (won: boolean, timeRemaining: number, coinsEarned: number) => {
    if (won) {
      await storageManager.recordWin(timeRemaining);
    } else {
      await storageManager.recordLoss();
    }

    if (coinsEarned > 0) {
      await get().addCoins(coinsEarned);
    }

    const stats = await storageManager.getStats();
    set({ stats });
  },

  updateSettings: (newSettings: Partial<LocalSettings>) => {
    const { settings } = get();
    const updated = { ...settings, ...newSettings };
    storageManager.saveSettings(updated);
    set({ settings: updated });
  },
}));
