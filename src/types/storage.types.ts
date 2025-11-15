// Storage-related types
export interface DBSchema {
  gameProgress: {
    key: string;
    value: {
      id: 'main';
      coins: number;
      totalGamesPlayed: number;
      totalWins: number;
      totalLosses: number;
      bestTime: number;
      createdAt: Date;
      lastPlayed: Date;
    };
  };
  unlockedItems: {
    key: string;
    value: {
      id: string;
      type: 'skin' | 'powerup' | 'pet';
      unlockedAt: Date;
    };
  };
  activeLoadout: {
    key: string;
    value: {
      id: 'current';
      skinId: string;
      petId: string | null;
      powerups: string[];
    };
  };
}
