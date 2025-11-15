# Comprehensive Game Development Plan: "Hide & Seek AI"

## Project Overview
A stealth-based survival game where players must evade an AI hunter for 3 minutes in a maze-like environment with corridors and portals. Victory rewards coins for purchasing powerups, cosmetic skins, and companion pets.

---

## 1. Technical Stack & Project Setup

### 1.1 Core Technologies
- **React 18+** with TypeScript
- **Vite** for build tooling
- **HTML5 Canvas** for game rendering
- **IndexedDB** for persistent game data (saves, unlocks, coins)
- **localStorage** for settings and quick access data

### 1.2 Project Structure
```
/src
  /components
    - Game.tsx (main game component)
    - MainMenu.tsx
    - Shop.tsx
    - GameHUD.tsx
    - GameOver.tsx
    - Settings.tsx
  /game
    /entities
      - Player.ts
      - AIBot.ts
      - Portal.ts
    /systems
      - CollisionSystem.ts
      - AIPathfinding.ts
      - RenderSystem.ts
      - InputSystem.ts
    /world
      - MapGenerator.ts
      - Room.ts
      - Corridor.ts
    /managers
      - GameStateManager.ts
      - StorageManager.ts
      - AudioManager.ts
  /store
    - useGameStore.ts (Zustand for state management)
  /utils
    - Vector2D.ts
    - Constants.ts
    - Helpers.ts
  /types
    - game.types.ts
    - storage.types.ts
  /assets
    - (placeholder for future sprite sheets)
  App.tsx
  main.tsx
```

### 1.3 Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

---

## 2. Data Models & Storage Architecture

### 2.1 IndexedDB Schema

#### Database: "HideAndSeekDB"
**Stores:**

1. **gameProgress**
   ```typescript
   interface GameProgress {
     id: 'main';
     coins: number;
     totalGamesPlayed: number;
     totalWins: number;
     totalLosses: number;
     bestTime: number;
     createdAt: Date;
     lastPlayed: Date;
   }
   ```

2. **unlockedItems**
   ```typescript
   interface UnlockedItem {
     id: string; // unique item ID
     type: 'skin' | 'powerup' | 'pet';
     unlockedAt: Date;
   }
   ```

3. **activeLoadout**
   ```typescript
   interface ActiveLoadout {
     id: 'current';
     skinId: string;
     petId: string | null;
     powerups: string[]; // array of powerup IDs
   }
   ```

### 2.2 localStorage Schema
```typescript
interface LocalSettings {
  musicVolume: number; // 0-1
  sfxVolume: number; // 0-1
  showFPS: boolean;
  showMinimap: boolean;
  controlScheme: 'wasd' | 'arrows';
}
```

### 2.3 Storage Manager Implementation
```typescript
class StorageManager {
  // Initialize IndexedDB connection
  async init(): Promise<void>
  
  // Coin operations
  async getCoins(): Promise<number>
  async addCoins(amount: number): Promise<void>
  async spendCoins(amount: number): Promise<boolean>
  
  // Progress tracking
  async recordWin(): Promise<void>
  async recordLoss(): Promise<void>
  async getStats(): Promise<GameProgress>
  
  // Item management
  async unlockItem(itemId: string, type: string): Promise<void>
  async isItemUnlocked(itemId: string): Promise<boolean>
  async getUnlockedItems(type?: string): Promise<UnlockedItem[]>
  
  // Loadout management
  async setActiveLoadout(loadout: Partial<ActiveLoadout>): Promise<void>
  async getActiveLoadout(): Promise<ActiveLoadout>
  
  // Settings
  saveSettings(settings: LocalSettings): void
  loadSettings(): LocalSettings
}
```

---

## 3. Game World Design

### 3.1 Map Structure

**Map Configuration:**
```typescript
interface MapConfig {
  width: 3000; // pixels
  height: 3000; // pixels
  roomCount: 8-12; // random range
  corridorWidth: 80;
  minRoomSize: 200;
  maxRoomSize: 400;
  portalCount: 6-10;
}
```

**Room Types:**
- **Open Room**: Large open space, dangerous but offers visibility
- **Maze Room**: Internal walls creating mini-corridors
- **Safe Room**: Smaller room with multiple exits

### 3.2 Map Generation Algorithm

```typescript
class MapGenerator {
  generateMap(): GameMap {
    1. Generate random room positions (avoid overlap)
    2. Connect rooms with corridors using BSP or minimum spanning tree
    3. Add branching corridors for complexity
    4. Place portals in strategic locations:
       - At least one portal per major area
       - Ensure no portal is in a dead-end
    5. Define spawn points:
       - Player spawn: Far from center
       - Bot spawn: Center or random safe location
    6. Create collision grid for pathfinding
  }
}
```

**Portal Mechanics:**
```typescript
interface Portal {
  id: string;
  position: Vector2D;
  linkedPortalId: string;
  radius: 40;
  cooldown: number; // prevents instant re-teleport
  visualEffect: 'swirl' | 'shimmer';
}
```

### 3.3 Collision System
```typescript
interface CollisionGrid {
  cellSize: 50; // pixels
  grid: boolean[][]; // true = walkable, false = wall
  
  isWalkable(x: number, y: number): boolean;
  getNeighbors(x: number, y: number): Vector2D[];
  raycast(from: Vector2D, to: Vector2D): boolean; // line of sight
}
```

---

## 4. Game Entities

### 4.1 Player Entity

```typescript
class Player {
  position: Vector2D;
  velocity: Vector2D;
  speed: number = 200; // base pixels per second
  radius: number = 20;
  
  // State
  isHidden: boolean = false;
  lastSoundTime: number = 0;
  
  // Powerup effects
  activeEffects: PowerupEffect[] = [];
  
  // Visual
  skinId: string;
  petId: string | null;
  rotation: number; // for directional sprite
  
  update(deltaTime: number, input: InputState): void {
    // Apply movement based on input
    // Apply powerup effects
    // Check collision with walls
    // Emit sound events if moving fast
  }
  
  usePowerup(powerupId: string): void;
  checkPortalCollision(portals: Portal[]): Portal | null;
  
  // Hiding mechanic
  attemptHide(hideSpots: HideSpot[]): void {
    // Check proximity to hiding spots
    // Enter hidden state with detection resistance
  }
}
```

### 4.2 AI Bot Entity

```typescript
class AIBot {
  position: Vector2D;
  velocity: Vector2D;
  speed: number = 180; // slightly slower than player
  radius: number = 25;
  
  // AI State Machine
  state: 'patrol' | 'chase' | 'search' | 'investigate';
  target: Vector2D | null;
  lastSeenPlayerPos: Vector2D | null;
  lastSeenPlayerTime: number = 0;
  
  // Detection
  visionRange: number = 300;
  visionAngle: number = 90; // degrees cone
  hearingRange: number = 200; // detects player sounds
  
  // Pathfinding
  path: Vector2D[] = [];
  patrolPoints: Vector2D[] = [];
  currentPatrolIndex: number = 0;
  
  update(deltaTime: number, player: Player, map: GameMap): void {
    switch(this.state) {
      case 'patrol':
        this.updatePatrol(deltaTime);
        break;
      case 'chase':
        this.updateChase(deltaTime, player, map);
        break;
      case 'search':
        this.updateSearch(deltaTime);
        break;
      case 'investigate':
        this.updateInvestigate(deltaTime);
        break;
    }
    
    this.checkPlayerDetection(player);
  }
  
  checkPlayerDetection(player: Player): boolean {
    // Vision cone check
    // Hearing check (if player moving fast)
    // Line of sight raycast
    // Hiding spot detection resistance
  }
  
  findPath(from: Vector2D, to: Vector2D, grid: CollisionGrid): Vector2D[] {
    // A* pathfinding implementation
  }
}
```

**AI Behavior Details:**

1. **Patrol State:**
   - Follows predefined patrol route
   - Periodically changes direction randomly
   - Checks for player detection

2. **Chase State:**
   - Direct pursuit with pathfinding
   - Updates path every 0.5 seconds
   - Can use portals intelligently
   - If player lost for 3 seconds → Search state

3. **Search State:**
   - Investigates last known position
   - Checks nearby hiding spots
   - Gradually expands search radius
   - After 10 seconds → return to Patrol

4. **Investigate State:**
   - Responds to sound events
   - Moves toward sound location
   - Brief investigation period
   - Returns to previous state

### 4.3 Pet System

```typescript
interface Pet {
  id: string;
  name: string;
  spriteId: string;
  ability: 'distraction' | 'early_warning' | 'speed_boost' | 'none';
  cooldown: number;
  
  // Visual following behavior
  followOffset: Vector2D;
  followSpeed: number;
}

class PetController {
  pet: Pet | null;
  position: Vector2D;
  
  update(deltaTime: number, playerPos: Vector2D): void {
    // Smooth following with lag
  }
  
  activateAbility(bot: AIBot): void {
    switch(this.pet.ability) {
      case 'distraction':
        // Pet runs away from player, bot may chase pet briefly
        break;
      case 'early_warning':
        // Alert player when bot is near (visual indicator)
        break;
      case 'speed_boost':
        // Temporary speed increase
        break;
    }
  }
}
```

---

## 5. Powerup System

### 5.1 Powerup Types

```typescript
interface Powerup {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration?: number; // seconds, if temporary
  effect: PowerupEffect;
  icon: string;
  maxUses?: number; // per game
}

interface PowerupEffect {
  type: 'speed_boost' | 'invisibility' | 'decoy' | 'time_slow' | 'wall_phase';
  magnitude?: number;
  duration?: number;
}
```

**Powerup Catalog:**

1. **Speed Surge** (50 coins)
   - +50% movement speed for 5 seconds
   - 2 uses per game
   
2. **Smoke Bomb** (75 coins)
   - Creates vision-blocking cloud
   - Bot cannot detect player in cloud
   - Lasts 8 seconds

3. **Decoy** (100 coins)
   - Spawns fake player that runs in random direction
   - Bot chases decoy for up to 10 seconds
   - 1 use per game

4. **Time Warp** (150 coins)
   - Slows bot movement by 50% for 6 seconds
   - Player speed unaffected
   - 1 use per game

5. **Ghost Walk** (200 coins)
   - Walk through walls for 3 seconds
   - Cannot be detected during effect
   - 1 use per game

### 5.2 Powerup Activation System

```typescript
class PowerupManager {
  activeEffects: Map<string, PowerupEffect>;
  usesRemaining: Map<string, number>;
  
  activatePowerup(powerupId: string, player: Player, bot: AIBot): void {
    // Check uses remaining
    // Apply effect based on type
    // Start duration timer
    // Update HUD display
  }
  
  update(deltaTime: number): void {
    // Update active effect timers
    // Remove expired effects
  }
  
  canActivate(powerupId: string): boolean {
    // Check cooldown and uses
  }
}
```

---

## 6. Shop & Progression System

### 6.1 Shop Structure

```typescript
interface ShopItem {
  id: string;
  name: string;
  type: 'skin' | 'powerup' | 'pet';
  description: string;
  cost: number;
  preview: string; // visual representation
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isUnlocked: boolean;
}

const SHOP_CATALOG: ShopItem[] = [
  // Skins (cosmetic only)
  {
    id: 'skin_ninja',
    name: 'Ninja',
    type: 'skin',
    description: 'Silent and swift',
    cost: 100,
    rarity: 'common'
  },
  {
    id: 'skin_robot',
    name: 'Cyber Runner',
    type: 'skin',
    description: 'Futuristic style',
    cost: 150,
    rarity: 'rare'
  },
  // ... 10-15 total skins
  
  // Pets
  {
    id: 'pet_dog',
    name: 'Loyal Pup',
    type: 'pet',
    description: 'Early warning ability',
    cost: 200,
    rarity: 'rare'
  },
  // ... 5-8 total pets
  
  // Powerups (listed above)
];
```

### 6.2 Shop Component Design

```typescript
// Shop.tsx structure
- ShopHeader: Displays total coins
- ShopTabs: Skins | Powerups | Pets
- ShopGrid: Displays items in grid layout
  - ShopCard for each item:
    - Preview image/icon
    - Name and description
    - Price in coins
    - "Owned" badge or "Purchase" button
    - Rarity indicator (border color)
- LoadoutSection: 
  - Currently equipped skin/pet/powerups
  - Quick equip/unequip buttons
```

### 6.3 Reward System

```typescript
interface GameRewards {
  baseReward: 50; // coins for winning
  timeBonus: number; // extra coins for fast wins
  perfectRun: 100; // never detected bonus
}

function calculateRewards(gameResult: GameResult): number {
  let coins = 50; // base
  
  if (gameResult.won) {
    if (gameResult.timeRemaining > 120) {
      coins += 25; // finished with 2+ min remaining
    }
    if (gameResult.wasDetectedCount === 0) {
      coins += 100; // perfect stealth
    }
  }
  
  return coins;
}
```

---

## 7. Game Loop & State Management

### 7.1 Game States

```typescript
type GameState = 
  | 'main_menu'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'game_over'
  | 'shop'
  | 'settings';

interface GameStateManager {
  currentState: GameState;
  previousState: GameState;
  
  setState(newState: GameState): void;
  returnToPrevious(): void;
}
```

### 7.2 Main Game Loop

```typescript
class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
  // Entities
  player: Player;
  bot: AIBot;
  map: GameMap;
  
  // Systems
  collisionSystem: CollisionSystem;
  renderSystem: RenderSystem;
  inputSystem: InputSystem;
  powerupManager: PowerupManager;
  
  // Game state
  gameTime: number = 180; // 3 minutes in seconds
  elapsedTime: number = 0;
  isPaused: boolean = false;
  
  // Frame timing
  lastFrameTime: number = 0;
  fps: number = 0;
  
  init(): void {
    // Load map
    // Initialize player at spawn
    // Initialize bot at spawn
    // Load active powerups and loadout
    // Start game loop
  }
  
  gameLoop(currentTime: number): void {
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    if (!this.isPaused) {
      this.update(deltaTime);
    }
    
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  update(deltaTime: number): void {
    // Update game timer
    this.elapsedTime += deltaTime;
    
    // Check win condition
    if (this.elapsedTime >= this.gameTime) {
      this.handleWin();
      return;
    }
    
    // Update input
    const input = this.inputSystem.getInput();
    
    // Update player
    this.player.update(deltaTime, input);
    
    // Check portal collisions
    const portal = this.player.checkPortalCollision(this.map.portals);
    if (portal) {
      this.handlePortalTeleport(portal);
    }
    
    // Update bot AI
    this.bot.update(deltaTime, this.player, this.map);
    
    // Check bot collision with player
    if (this.checkBotCaughtPlayer()) {
      this.handleLoss();
      return;
    }
    
    // Update powerups
    this.powerupManager.update(deltaTime);
    
    // Update camera to follow player
    this.camera.follow(this.player.position);
  }
  
  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Transform for camera
    this.ctx.save();
    this.camera.apply(this.ctx);
    
    // Render map
    this.renderSystem.renderMap(this.map);
    
    // Render portals
    this.renderSystem.renderPortals(this.map.portals);
    
    // Render player and pet
    this.renderSystem.renderPlayer(this.player);
    
    // Render bot
    this.renderSystem.renderBot(this.bot);
    
    // Render bot vision cone (debug mode)
    if (this.debug) {
      this.renderSystem.renderVisionCone(this.bot);
    }
    
    this.ctx.restore();
    
    // Render HUD (not affected by camera)
    this.renderHUD();
  }
  
  renderHUD(): void {
    // Timer display
    // Minimap (optional based on settings)
    // Active powerup slots
    // FPS counter (if enabled)
    // Warning indicator when bot is near
  }
}
```

### 7.3 Input System

```typescript
class InputSystem {
  keys: Set<string> = new Set();
  
  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
  }
  
  getInput(): InputState {
    return {
      moveX: this.getMoveX(),
      moveY: this.getMoveY(),
      powerup1: this.keys.has('1'),
      powerup2: this.keys.has('2'),
      powerup3: this.keys.has('3'),
      pause: this.keys.has('Escape')
    };
  }
  
  getMoveX(): number {
    // Based on control scheme from settings
  }
  
  getMoveY(): number {
    // Based on control scheme from settings
  }
}
```

---

## 8. Rendering System

### 8.1 Camera System

```typescript
class Camera {
  position: Vector2D;
  width: number;
  height: number;
  zoom: number = 1;
  smoothness: number = 0.1; // for smooth following
  
  follow(targetPos: Vector2D): void {
    // Smooth interpolation toward target
    this.position.x += (targetPos.x - this.position.x) * this.smoothness;
    this.position.y += (targetPos.y - this.position.y) * this.smoothness;
  }
  
  apply(ctx: CanvasRenderingContext2D): void {
    ctx.translate(
      -this.position.x + this.width / 2,
      -this.position.y + this.height / 2
    );
    ctx.scale(this.zoom, this.zoom);
  }
  
  worldToScreen(worldPos: Vector2D): Vector2D {
    // Convert world coordinates to screen coordinates
  }
}
```

### 8.2 Render System Implementation

```typescript
class RenderSystem {
  ctx: CanvasRenderingContext2D;
  
  renderMap(map: GameMap): void {
    // Draw background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, map.width, map.height);
    
    // Draw rooms
    for (const room of map.rooms) {
      this.ctx.fillStyle = '#2a2a2a';
      this.ctx.fillRect(room.x, room.y, room.width, room.height);
      
      // Room outline
      this.ctx.strokeStyle = '#404040';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(room.x, room.y, room.width, room.height);
    }
    
    // Draw corridors
    for (const corridor of map.corridors) {
      this.ctx.fillStyle = '#252525';
      this.ctx.fillRect(corridor.x, corridor.y, corridor.width, corridor.height);
    }
    
    // Draw walls (collision boundaries)
    this.ctx.fillStyle = '#1a1a1a';
    for (const wall of map.walls) {
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }
  }
  
  renderPortals(portals: Portal[]): void {
    for (const portal of portals) {
      // Animated swirl effect
      const time = Date.now() / 1000;
      
      // Outer glow
      const gradient = this.ctx.createRadialGradient(
        portal.position.x, portal.position.y, 10,
        portal.position.x, portal.position.y, portal.radius
      );
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(portal.position.x, portal.position.y, portal.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Inner circle
      this.ctx.fillStyle = '#64c8ff';
      this.ctx.beginPath();
      this.ctx.arc(portal.position.x, portal.position.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Rotating particles
      for (let i = 0; i < 8; i++) {
        const angle = (time + i / 8) * Math.PI * 2;
        const x = portal.position.x + Math.cos(angle) * 25;
        const y = portal.position.y + Math.sin(angle) * 25;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
  
  renderPlayer(player: Player): void {
    // Pet render (behind player)
    if (player.petId) {
      this.renderPet(player.petController);
    }
    
    // Apply powerup visual effects
    if (player.hasActiveEffect('invisibility')) {
      this.ctx.globalAlpha = 0.3;
    }
    
    // Player body (circle for now, sprite later)
    this.ctx.fillStyle = this.getSkinColor(player.skinId);
    this.ctx.beginPath();
    this.ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Direction indicator
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(player.position.x, player.position.y);
    const dirX = player.position.x + Math.cos(player.rotation) * player.radius;
    const dirY = player.position.y + Math.sin(player.rotation) * player.radius;
    this.ctx.lineTo(dirX, dirY);
    this.ctx.stroke();
    
    this.ctx.globalAlpha = 1;
  }
  
  renderBot(bot: AIBot): void {
    // Bot body (different color from player)
    this.ctx.fillStyle = '#ff4444';
    this.ctx.beginPath();
    this.ctx.arc(bot.position.x, bot.position.y, bot.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Direction indicator
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(bot.position.x, bot.position.y);
    const dirX = bot.position.x + Math.cos(bot.rotation) * bot.radius;
    const dirY = bot.position.y + Math.sin(bot.rotation) * bot.radius;
    this.ctx.lineTo(dirX, dirY);
    this.ctx.stroke();
    
    // State indicator above bot
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(bot.state.toUpperCase(), bot.position.x - 20, bot.position.y - 35);
  }
  
  renderVisionCone(bot: AIBot): void {
    // Debug visualization
    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(bot.position.x, bot.position.y);
    this.ctx.arc(
      bot.position.x,
      bot.position.y,
      bot.visionRange,
      bot.rotation - (bot.visionAngle / 2) * Math.PI / 180,
      bot.rotation + (bot.visionAngle / 2) * Math.PI / 180
    );
    this.ctx.closePath();
    this.ctx.fill();
  }
}
```

---

## 9. UI Components

### 9.1 Main Menu Component

```typescript
// MainMenu.tsx
interface MainMenuProps {
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  stats: GameProgress;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenShop,
  onOpenSettings,
  stats
}) => {
  return (
    <div className="main-menu">
      <h1 className="game-title">HIDE & SEEK AI</h1>
      
      <div className="stats-summary">
        <div className="stat">
          <span className="stat-label">Coins</span>
          <span className="stat-value">{stats.coins}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Wins</span>
          <span className="stat-value">{stats.totalWins}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Best Time</span>
          <span className="stat-value">{formatTime(stats.bestTime)}</span>
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
```

### 9.2 Game HUD Component

```typescript
// GameHUD.tsx
interface GameHUDProps {
  timeRemaining: number;
  powerups: PowerupSlot[];
  isDetected: boolean;
  fps?: number;
  showMinimap: boolean;
}

const GameHUD: React.FC<GameHUDProps> = ({
  timeRemaining,
  powerups,
  isDetected,
  fps,
  showMinimap
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
          ⚠️ DETECTED!
        </div>
      )}
      
      {/* Powerup Slots */}
      <div className="powerup-slots">
        {powerups.map((slot, index) => (
          <div key={index} className="powerup-slot">
            <div className="slot-number">{index + 1}</div>
            {slot.powerup ? (
              <>
                <img src={slot.powerup.icon} alt={slot.powerup.name} />
                {slot.usesRemaining && (
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
      {fps !== undefined && (
        <div className="fps-counter">FPS: {fps}</div>
      )}
      
      {/* Minimap */}
      {showMinimap && (
        <div className="minimap">
          <Minimap />
        </div>
      )}
    </div>
  );
};
```

### 9.3 Game Over Component

```typescript
// GameOver.tsx
interface GameOverProps {
  won: boolean;
  coinsEarned: number;
  timeElapsed: number;
  wasDetectedCount: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
  won,
  coinsEarned,
  timeElapsed,
  wasDetectedCount,
  onPlayAgain,
  onMainMenu
}) => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h1 className={won ? 'victory' : 'defeat'}>
          {won ? '🎉 VICTORY!' : '💀 CAUGHT!'}
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
          <div className="stat-row">
            <span>Times Detected:</span>
            <span>{wasDetectedCount}</span>
          </div>
          <div className="stat-row highlight">
            <span>Coins Earned:</span>
            <span className="coins">+{coinsEarned}</span>
          </div>
        </div>
        
        {wasDetectedCount === 0 && won && (
          <div className="perfect-run-badge">
            ⭐ PERFECT STEALTH BONUS!
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
```

### 9.4 Shop Component

```typescript
// Shop.tsx
const Shop: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'skins' | 'powerups' | 'pets'>('skins');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const { coins, unlockedItems, purchaseItem, equipItem } = useGameStore();
  
  const filteredItems = SHOP_CATALOG.filter(item => item.type === activeTab);
  
  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1>SHOP</h1>
        <div className="coin-display">
          <span className="coin-icon">🪙</span>
          <span className="coin-amount">{coins}</span>
        </div>
      </div>
      
      <div className="shop-tabs">
        <button 
          className={activeTab === 'skins' ? 'active' : ''}
          onClick={() => setActiveTab('skins')}
        >
          SKINS
        </button>
        <button 
          className={activeTab === 'powerups' ? 'active' : ''}
          onClick={() => setActiveTab('powerups')}
        >
          POWERUPS
        </button>
        <button 
          className={activeTab === 'pets' ? 'active' : ''}
          onClick={() => setActiveTab('pets')}
        >
          PETS
        </button>
      </div>
      
      <div className="shop-grid">
        {filteredItems.map(item => (
          <ShopCard
            key={item.id}
            item={item}
            isUnlocked={unlockedItems.includes(item.id)}
            onSelect={() => setSelectedItem(item)}
            onPurchase={() => purchaseItem(item)}
            onEquip={() => equipItem(item)}
          />
        ))}
      </div>
      
      {selectedItem && (
        <ItemPreviewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};
```

---

## 10. Audio System (Optional Enhancement)

```typescript
class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private music: HTMLAudioElement | null = null;
  
  musicVolume: number = 0.5;
  sfxVolume: number = 0.7;
  
  loadSound(id: string, path: string): void {
    const audio = new Audio(path);
    audio.volume = this.sfxVolume;
    this.sounds.set(id, audio);
  }
  
  playSound(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }
  
  playMusic(path: string, loop: boolean = true): void {
    if (this.music) {
      this.music.pause();
    }
    
    this.music = new Audio(path);
    this.music.volume = this.musicVolume;
    this.music.loop = loop;
    this.music.play();
  }
  
  stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }
}

// Sound effects to implement:
// - footsteps.mp3 (player movement)
// - portal.mp3 (teleport sound)
// - detected.mp3 (bot spots player)
// - powerup_activate.mp3
// - victory.mp3
// - defeat.mp3
// - ambient_music.mp3 (game background)
// - menu_music.mp3
```

---

## 11. Performance Optimizations

### 11.1 Spatial Partitioning
```typescript
class QuadTree {
  // Divide map into quadrants for efficient collision detection
  // Only check entities in nearby quadrants
}
```

### 11.2 Render Culling
```typescript
// Only render entities within camera view + small margin
function isInView(entity: Vector2D, camera: Camera): boolean {
  const margin = 100;
  return (
    entity.x > camera.position.x - camera.width / 2 - margin &&
    entity.x < camera.position.x + camera.width / 2 + margin &&
    entity.y > camera.position.y - camera.height / 2 - margin &&
    entity.y < camera.position.y + camera.height / 2 + margin
  );
}
```

### 11.3 Pathfinding Optimization
```typescript
// Cache bot pathfinding results
// Only recalculate path every 0.5 seconds
// Use simplified grid for pathfinding (50x50 cells instead of pixel-perfect)
```

---

## 12. Styling Guide (CSS)

### 12.1 Design System

```css
:root {
  /* Colors */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --bg-card: #252525;
  --accent-primary: #64c8ff;
  --accent-secondary: #ff6b6b;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);
}

/* Button styles */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), #4aa8dd);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Card styles */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* Game canvas */
#game-canvas {
  display: block;
  background: #0a0a0a;
  image-rendering: pixelated; /* For crisp pixel art if used */
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

---

## 13. Build Configuration

### 13.1 Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // For static hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
```

### 13.2 TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 14. Implementation Phases

### Phase 1: Core Foundation (Days 1-2)
1. Project setup with Vite + React + TypeScript
2. Basic canvas rendering system
3. Player entity with WASD movement
4. Simple map with walls and collision detection
5. Camera system following player

### Phase 2: AI & Game Loop (Days 3-4)
6. AI bot entity with patrol behavior
7. Basic A* pathfinding
8. Detection system (vision cone)
9. Game timer and win/loss conditions
10. Game state management

### Phase 3: World Features (Days 5-6)
11. Map generation algorithm
12. Portal system with teleportation
13. Multiple room types and corridors
14. Hiding spots (optional enhancement)

### Phase 4: Storage & Progression (Days 7-8)
15. IndexedDB setup with StorageManager
16. Coin reward system
17. Stats tracking (wins, losses, best time)
18. Main menu with stats display

### Phase 5: Shop System (Days 9-10)
19. Shop UI with tabs and grid
20. Item catalog (skins, powerups, pets)
21. Purchase and unlock logic
22. Loadout system and equipping

### Phase 6: Powerups (Days 11-12)
23. Powerup activation system
24. Implement 5 core powerups
25. Powerup UI and cooldowns
26. Visual effects for powerups

### Phase 7: Pets (Day 13)
27. Pet following behavior
28. Pet abilities implementation
29. Pet rendering

### Phase 8: Polish & UI (Days 14-15)
30. Game HUD improvements
31. Game over screen with rewards
32. Settings menu
33. Visual polish (animations, effects)
34. Responsive design

### Phase 9: Audio & Final Polish (Days 16-17)
35. Audio manager implementation
36. Sound effects integration
37. Background music
38. Performance optimizations
39. Bug fixes and playtesting

### Phase 10: Deployment (Day 18)
40. Build optimization
41. Testing on different browsers
42. Deploy to static hosting
43. Documentation

---

## 15. Testing Checklist

### Gameplay Testing
- [ ] Player movement feels smooth and responsive
- [ ] Bot AI provides appropriate challenge
- [ ] Detection system works correctly
- [ ] Portals teleport player to correct locations
- [ ] Game timer counts down accurately
- [ ] Win condition triggers at 3:00
- [ ] Loss condition triggers on bot collision

### Progression Testing
- [ ] Coins award correctly on win (50 base + bonuses)
- [ ] Stats persist across sessions
- [ ] Shop items can be purchased
- [ ] Purchased items appear as owned
- [ ] Equipped items appear in game
- [ ] Powerups activate correctly in game

### Storage Testing
- [ ] IndexedDB initializes without errors
- [ ] Data persists after browser refresh
- [ ] Data persists after browser close/reopen
- [ ] Settings save and load correctly
- [ ] Multiple game sessions don't corrupt data

### Performance Testing
- [ ] Game maintains 60 FPS on target hardware
- [ ] No memory leaks over extended play
- [ ] Canvas rendering is efficient
- [ ] Pathfinding doesn't cause frame drops

### Browser Compatibility
- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Responsive on different screen sizes

---

## 16. Future Enhancements (Post-MVP)

1. **Multiplayer Mode**: Hide from friends or AI together
2. **Level Progression**: Unlock new maps with different layouts
3. **Achievement System**: Badges for special accomplishments
4. **Daily Challenges**: Special objectives for bonus coins
5. **Leaderboards**: Compare times with other players (requires backend)
6. **More AI Behaviors**: Different bot types with unique abilities
7. **Customizable Maps**: Let players design their own levels
8. **Mobile Support**: Touch controls and mobile optimization
9. **Sprite-based Graphics**: Replace circles with actual character sprites
10. **Particle Effects**: Enhanced visual feedback

---

## 17. Key Constants Reference

```typescript
// src/utils/Constants.ts
export const GAME_CONFIG = {
  GAME_DURATION: 180, // 3 minutes
  BASE_COIN_REWARD: 50,
  PERFECT_RUN_BONUS: 100,
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,
  
  PLAYER: {
    SPEED: 200,
    RADIUS: 20,
    SPRINT_MULTIPLIER: 1.5
  },
  
  BOT: {
    SPEED: 180,
    RADIUS: 25,
    VISION_RANGE: 300,
    VISION_ANGLE: 90,
    HEARING_RANGE: 200,
    CHASE_DURATION: 15,
    SEARCH_DURATION: 10
  },
  
  MAP: {
    WIDTH: 3000,
    HEIGHT: 3000,
    MIN_ROOMS: 8,
    MAX_ROOMS: 12,
    MIN_ROOM_SIZE: 200,
    MAX_ROOM_SIZE: 400,
    CORRIDOR_WIDTH: 80,
    MIN_PORTALS: 6,
    MAX_PORTALS: 10
  },
  
  PORTAL: {
    RADIUS: 40,
    COOLDOWN: 2
  }
};
```

---

This comprehensive plan provides all the necessary details for an LLM to implement the complete game. The structure is modular, allowing for incremental development and testing. Each system is clearly defined with implementation details, making it straightforward to code each component independently while maintaining cohesion across the entire project.