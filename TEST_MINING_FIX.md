# Test: Mining Minerals on Visible (Background) Layer

## Bug Fixed
When a mineral (custom tile with `minable: true`) was placed on the visible "Dessus" (background) layer in the level editor and saved, the player could not mine it after reloading the game.

## Root Cause
In `js/tile_editor.js`, the `addToGlobalTileConfig()` method was updating the global `TileConfig` object but was NOT updating the `customTiles` localStorage entry. This meant:

1. In the editor, TileConfig had the minable property (session memory)
2. But customTiles localStorage only had the original data
3. When the game loaded and called `restoreCustomTilesToConfig()`, it read from the stale localStorage data
4. The restored tile did not have `minable: true`, so mining failed

## Solution Implemented
Modified `js/tile_editor.js`:

### 1. Fixed `addToGlobalTileConfig()` (line ~336)
Now properly merges the tileConfig back into customTiles before saving:
```javascript
addToGlobalTileConfig(id, tileConfig) {
    TileTypes[`CUSTOM_${id}`] = id;
    TileConfig[id] = tileConfig;
    // IMPORTANT: Update the customTiles entry with the full tileConfig
    if (this.customTiles[id]) {
        this.customTiles[id] = {
            ...this.customTiles[id],
            ...tileConfig,
            id: id
        };
    } else {
        this.customTiles[id] = {
            ...tileConfig,
            id: id,
            isCustom: true
        };
    }
    this.saveCustomTiles();
}
```

### 2. Enhanced `restoreCustomTilesToConfig()` (line ~354)
Added defensive default values and detailed logging:
```javascript
minable: config.minable || false,  // Explicitly default to false if missing
```

### 3. Added logging throughout
- In `js/game.js`: Log TileConfig state before/after restore, show which tiles are minable
- In `js/player.js`: Log background tile checks with detailed debug info
- In `js/level.js`: Log mineTile checks for both layers

## Test Procedure

### Step 1: Clear Old Data
1. Open browser DevTools (F12)
2. Console → Clear localStorage:
   ```javascript
   localStorage.clear(); location.reload();
   ```

### Step 2: Create Custom Mineral
1. Go to Tile Editor (editor.html)
2. Create a new mineral tile:
   - Name: "Gold Ore"
   - Mark as **Minable** ✓
   - Set Resource: "gold"
   - Set Durability: 2
   - Draw a design
   - **Save Tile**
3. Note the tile ID (should be 100)

### Step 3: Place Mineral on Visible Layer
1. Go to Level Editor (editor.html)
2. Select the mineral tile
3. **Click "Dessus (visible)" button** to select background layer
4. Paint the mineral on the canvas (several locations)
5. Save the level

### Step 4: Test Mining
1. Click **"Tester ce niveau"** button
2. Game should open with test badge
3. Click on a mineral and try to mine it

### Expected Results
✅ Mining should work!
- Player can stand next to mineral
- Clicking mineral or standing on it triggers mining animation
- After hits equal durability (2), mineral disappears
- Gold item added to inventory

### Verification in Console
When gaming starts, should see logs like:
```
📦 After restoreCustomTilesToConfig - TileConfig keys: 1,2,...,100,...
✅ Minable tiles in TileConfig: 100(Gold Ore)
🔍 START MINING - Background Layer Check: bgTileType: 100, bgTileName: "Gold Ore", bgTileConfigMinable: true
✅ Mining Background Layer! bgTileType: 100, durability: 2
⛏️ mineTile - Mining Background Tile: bgTileType: 100, bgName: "Gold Ore"
```

## Files Modified
1. `js/tile_editor.js` - addToGlobalTileConfig() and restoreCustomTilesToConfig()
2. `js/player.js` - Added debug logging
3. `js/level.js` - Added debug logging and tile validation
4. `js/game.js` - Added debug logging

## Related Code Paths
- Editor → Save Level → levelManager.saveLevel() → stores backgroundTiles array
- Game Load → restoreCustomTilesToConfig() → restores TileConfig from localStorage
- Player Mine → startMining() checks getBackgroundTile() → looks up TileConfig[id]
- Confirm → mineTile() checks minable property → removes tile

## Data Flow Summary
```
Tile Editor → customTileManager.addTile() + addToGlobalTileConfig()
    ↓
customTiles localStorage (NOW includes minable property ✓)
    ↓
Game Loads → restoreCustomTilesToConfig()
    ↓
TileConfig[100] has minable: true
    ↓
Mining Works!
```
