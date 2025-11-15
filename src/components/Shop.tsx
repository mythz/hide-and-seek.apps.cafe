import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { SHOP_CATALOG } from '../utils/ShopCatalog';
import type { ShopItem } from '../types/game.types';

export const Shop: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'skin' | 'powerup' | 'pet'>('skin');
  const { coins, unlockedItems, activeLoadout, purchaseItem, equipSkin, equipPet, equipPowerup } = useGameStore();

  const filteredItems = SHOP_CATALOG.filter(item => item.type === activeTab);

  const handlePurchase = async (item: ShopItem) => {
    const success = await purchaseItem(item);
    if (!success) {
      alert('Not enough coins or item already owned!');
    }
  };

  const handleEquip = async (item: ShopItem) => {
    if (item.type === 'skin') {
      await equipSkin(item.id);
    } else if (item.type === 'pet') {
      await equipPet(item.id);
    } else if (item.type === 'powerup') {
      // For powerups, ask which slot
      const slot = prompt('Which slot (1-3)?');
      if (slot) {
        const slotNum = parseInt(slot) - 1;
        if (slotNum >= 0 && slotNum < 3) {
          await equipPowerup(item.id, slotNum);
        }
      }
    }
  };

  const getRarityClass = (rarity: string) => {
    return `rarity-${rarity}`;
  };

  const isEquipped = (itemId: string, type: string) => {
    if (type === 'skin') return activeLoadout.skinId === itemId;
    if (type === 'pet') return activeLoadout.petId === itemId;
    if (type === 'powerup') return activeLoadout.powerups.includes(itemId);
    return false;
  };

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
          className={`tab ${activeTab === 'skin' ? 'active' : ''}`}
          onClick={() => setActiveTab('skin')}
        >
          SKINS
        </button>
        <button
          className={`tab ${activeTab === 'powerup' ? 'active' : ''}`}
          onClick={() => setActiveTab('powerup')}
        >
          POWERUPS
        </button>
        <button
          className={`tab ${activeTab === 'pet' ? 'active' : ''}`}
          onClick={() => setActiveTab('pet')}
        >
          PETS
        </button>
      </div>

      <div className="shop-grid">
        {filteredItems.map(item => {
          const isUnlocked = unlockedItems.includes(item.id);
          const equipped = isEquipped(item.id, item.type);

          return (
            <div key={item.id} className={`shop-card ${getRarityClass(item.rarity)}`}>
              <div className="card-preview">{item.preview}</div>
              <div className="card-name">{item.name}</div>
              <div className="card-description">{item.description}</div>
              <div className="card-cost">
                {item.cost > 0 ? `${item.cost} coins` : 'FREE'}
              </div>
              {isUnlocked ? (
                equipped ? (
                  <div className="equipped-badge">EQUIPPED</div>
                ) : (
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => handleEquip(item)}
                  >
                    EQUIP
                  </button>
                )
              ) : (
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handlePurchase(item)}
                  disabled={coins < item.cost}
                >
                  BUY
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
