import type { GameMap, Room, Corridor, Wall, Portal } from '../../types/game.types';
import { GAME_CONFIG } from '../../utils/Constants';
import { randomInt } from '../../utils/Helpers';

export class MapGenerator {
  private width: number;
  private height: number;

  constructor(width: number = GAME_CONFIG.MAP.WIDTH, height: number = GAME_CONFIG.MAP.HEIGHT) {
    this.width = width;
    this.height = height;
  }

  generateMap(): GameMap {
    const roomCount = randomInt(GAME_CONFIG.MAP.MIN_ROOMS, GAME_CONFIG.MAP.MAX_ROOMS);
    const rooms = this.generateRooms(roomCount);
    const corridors = this.connectRooms(rooms);
    const walls = this.generateWalls(rooms, corridors);
    const portals = this.generatePortals(rooms, corridors);
    const spawns = this.generateSpawnPoints(rooms);

    return {
      width: this.width,
      height: this.height,
      rooms,
      corridors,
      walls,
      portals,
      playerSpawn: spawns.player,
      botSpawn: spawns.bot,
    };
  }

  private generateRooms(count: number): Room[] {
    const rooms: Room[] = [];
    const maxAttempts = count * 10;
    let attempts = 0;

    while (rooms.length < count && attempts < maxAttempts) {
      attempts++;

      const width = randomInt(GAME_CONFIG.MAP.MIN_ROOM_SIZE, GAME_CONFIG.MAP.MAX_ROOM_SIZE);
      const height = randomInt(GAME_CONFIG.MAP.MIN_ROOM_SIZE, GAME_CONFIG.MAP.MAX_ROOM_SIZE);
      const x = randomInt(100, this.width - width - 100);
      const y = randomInt(100, this.height - height - 100);

      const newRoom: Room = { x, y, width, height, type: 'open' };

      // Check if overlaps with existing rooms
      let overlaps = false;
      for (const room of rooms) {
        if (this.roomsOverlap(newRoom, room)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        rooms.push(newRoom);
      }
    }

    return rooms;
  }

  private roomsOverlap(room1: Room, room2: Room, margin: number = 100): boolean {
    return (
      room1.x - margin < room2.x + room2.width &&
      room1.x + room1.width + margin > room2.x &&
      room1.y - margin < room2.y + room2.height &&
      room1.y + room1.height + margin > room2.y
    );
  }

  private connectRooms(rooms: Room[]): Corridor[] {
    const corridors: Corridor[] = [];

    // Connect each room to the next one
    for (let i = 0; i < rooms.length - 1; i++) {
      const room1 = rooms[i];
      const room2 = rooms[i + 1];

      const center1 = {
        x: room1.x + room1.width / 2,
        y: room1.y + room1.height / 2,
      };
      const center2 = {
        x: room2.x + room2.width / 2,
        y: room2.y + room2.height / 2,
      };

      // Create L-shaped corridor
      if (Math.random() > 0.5) {
        // Horizontal then vertical
        corridors.push({
          x: Math.min(center1.x, center2.x),
          y: center1.y - GAME_CONFIG.MAP.CORRIDOR_WIDTH / 2,
          width: Math.abs(center2.x - center1.x),
          height: GAME_CONFIG.MAP.CORRIDOR_WIDTH,
        });
        corridors.push({
          x: center2.x - GAME_CONFIG.MAP.CORRIDOR_WIDTH / 2,
          y: Math.min(center1.y, center2.y),
          width: GAME_CONFIG.MAP.CORRIDOR_WIDTH,
          height: Math.abs(center2.y - center1.y),
        });
      } else {
        // Vertical then horizontal
        corridors.push({
          x: center1.x - GAME_CONFIG.MAP.CORRIDOR_WIDTH / 2,
          y: Math.min(center1.y, center2.y),
          width: GAME_CONFIG.MAP.CORRIDOR_WIDTH,
          height: Math.abs(center2.y - center1.y),
        });
        corridors.push({
          x: Math.min(center1.x, center2.x),
          y: center2.y - GAME_CONFIG.MAP.CORRIDOR_WIDTH / 2,
          width: Math.abs(center2.x - center1.x),
          height: GAME_CONFIG.MAP.CORRIDOR_WIDTH,
        });
      }
    }

    // Add some random branching corridors
    for (let i = 0; i < Math.floor(rooms.length / 2); i++) {
      const idx1 = randomInt(0, rooms.length - 1);
      const idx2 = randomInt(0, rooms.length - 1);
      if (idx1 !== idx2) {
        const room1 = rooms[idx1];
        const room2 = rooms[idx2];
        const center1 = {
          x: room1.x + room1.width / 2,
          y: room1.y + room1.height / 2,
        };
        const center2 = {
          x: room2.x + room2.width / 2,
          y: room2.y + room2.height / 2,
        };

        corridors.push({
          x: Math.min(center1.x, center2.x),
          y: center1.y - GAME_CONFIG.MAP.CORRIDOR_WIDTH / 2,
          width: Math.abs(center2.x - center1.x),
          height: GAME_CONFIG.MAP.CORRIDOR_WIDTH,
        });
      }
    }

    return corridors;
  }

  private generateWalls(rooms: Room[], corridors: Corridor[]): Wall[] {
    const walls: Wall[] = [];
    const occupied = new Set<string>();

    // Mark rooms and corridors as occupied
    for (const room of rooms) {
      for (let x = room.x; x < room.x + room.width; x += 10) {
        for (let y = room.y; y < room.y + room.height; y += 10) {
          occupied.add(`${Math.floor(x / 10)},${Math.floor(y / 10)}`);
        }
      }
    }

    for (const corridor of corridors) {
      for (let x = corridor.x; x < corridor.x + corridor.width; x += 10) {
        for (let y = corridor.y; y < corridor.y + corridor.height; y += 10) {
          occupied.add(`${Math.floor(x / 10)},${Math.floor(y / 10)}`);
        }
      }
    }

    // Create walls around the borders
    walls.push({ x: 0, y: 0, width: this.width, height: 50 }); // Top
    walls.push({ x: 0, y: this.height - 50, width: this.width, height: 50 }); // Bottom
    walls.push({ x: 0, y: 0, width: 50, height: this.height }); // Left
    walls.push({ x: this.width - 50, y: 0, width: 50, height: this.height }); // Right

    return walls;
  }

  private generatePortals(rooms: Room[], _corridors: Corridor[]): Portal[] {
    const portals: Portal[] = [];
    const portalCount = randomInt(GAME_CONFIG.MAP.MIN_PORTALS, GAME_CONFIG.MAP.MAX_PORTALS);

    // Ensure even number of portals (pairs)
    const pairCount = Math.floor(portalCount / 2);

    for (let i = 0; i < pairCount; i++) {
      const room1 = rooms[randomInt(0, rooms.length - 1)];
      const room2 = rooms[randomInt(0, rooms.length - 1)];

      const portal1 = {
        id: `portal_${i * 2}`,
        position: {
          x: room1.x + randomInt(GAME_CONFIG.PORTAL.RADIUS, room1.width - GAME_CONFIG.PORTAL.RADIUS),
          y: room1.y + randomInt(GAME_CONFIG.PORTAL.RADIUS, room1.height - GAME_CONFIG.PORTAL.RADIUS),
        },
        linkedPortalId: `portal_${i * 2 + 1}`,
        radius: GAME_CONFIG.PORTAL.RADIUS,
        cooldown: GAME_CONFIG.PORTAL.COOLDOWN,
        lastUsed: 0,
      };

      const portal2 = {
        id: `portal_${i * 2 + 1}`,
        position: {
          x: room2.x + randomInt(GAME_CONFIG.PORTAL.RADIUS, room2.width - GAME_CONFIG.PORTAL.RADIUS),
          y: room2.y + randomInt(GAME_CONFIG.PORTAL.RADIUS, room2.height - GAME_CONFIG.PORTAL.RADIUS),
        },
        linkedPortalId: `portal_${i * 2}`,
        radius: GAME_CONFIG.PORTAL.RADIUS,
        cooldown: GAME_CONFIG.PORTAL.COOLDOWN,
        lastUsed: 0,
      };

      portals.push(portal1, portal2);
    }

    return portals;
  }

  private generateSpawnPoints(rooms: Room[]): { player: { x: number; y: number }; bot: { x: number; y: number } } {
    // Player spawns in first room
    const playerRoom = rooms[0];
    const player = {
      x: playerRoom.x + playerRoom.width / 2,
      y: playerRoom.y + playerRoom.height / 2,
    };

    // Bot spawns in last room (or middle room)
    const botRoom = rooms[Math.floor(rooms.length / 2)];
    const bot = {
      x: botRoom.x + botRoom.width / 2,
      y: botRoom.y + botRoom.height / 2,
    };

    return { player, bot };
  }
}
