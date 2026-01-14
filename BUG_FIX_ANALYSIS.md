# Analyse et Correction : Problème du Placement de Tuiles

## Problème Identifié
Impossible de placer des tuiles dans les zones étendues des niveaux (notamment à droite et en bas) après augmentation de la taille du niveau.

## Cause Racine
Dans `js/level.js`, la classe `LevelManager` avait une incohérence critique :

### Avant (BUG) :
```javascript
getTile(x, y) {
    if (!this.currentLevel) return 0;
    // BUG: utilise this.gridWidth et this.gridHeight au lieu de this.currentLevel.width/height
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
        return 0;
    }
    return this.currentLevel.tiles[y][x];
}

setTile(x, y, tileType) {
    if (!this.currentLevel) return;
    // BUG: limite à 16x16 même si le niveau fait 32x32
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    this.currentLevel.tiles[y][x] = tileType;
}
```

### Problème Concret :
- `this.gridWidth` = 16 (dimension par défaut)
- `this.gridHeight` = 16 (dimension par défaut)
- Quand l'utilisateur crée un niveau 32x32 :
  - `this.currentLevel.width` = 32
  - `this.currentLevel.height` = 32
  - Mais `getTile()` et `setTile()` vérifiaient toujours contre 16x16 !

### Impact :
1. `getTile(25, 25)` retournait 0 (EMPTY) même si une tuile existait
2. `setTile(25, 25, ...)` échouait silencieusement
3. Les validations de collision retournaient toujours false en dehors de 16x16
4. Impossible de placer/interagir avec les tuiles au-delà de 16x16

## Correction Appliquée
```javascript
getTile(x, y) {
    if (!this.currentLevel) return 0;
    // CORRECTED: utilise this.currentLevel.width et this.currentLevel.height
    if (x < 0 || x >= this.currentLevel.width || y < 0 || y >= this.currentLevel.height) {
        return 0;
    }
    return this.currentLevel.tiles[y][x];
}

setTile(x, y, tileType) {
    if (!this.currentLevel) return;
    // CORRECTED: utilise les dimensions réelles du niveau courant
    if (x < 0 || x >= this.currentLevel.width || y < 0 || y >= this.currentLevel.height) return;
    this.currentLevel.tiles[y][x] = tileType;
}
```

## Mécanisme de Flux Après Correction

### 1. Création d'un Niveau
```
confirmCreateNewLevel()
  → levelManager.createEmptyLevel(name, 32, 32)
    → crée level.width = 32, level.height = 32
  → loadEditorLevel(name)
    → levelManager.loadLevel(name)
    → currentLevel = {..., width: 32, height: 32}
    → renderEditor()
      → canvas.width = 32 * 32 = 1024
      → canvas.height = 32 * 32 = 1024
      → canvasScale = éditorCanvas.width / rect.width
```

### 2. Click sur une Tuile
```
handleCanvasMouseDown(e)
  → canvasX = (e.clientX - rect.left) * canvasScale
  → x = Math.floor(canvasX / 32)  // ex: 25
  → getTile(25, 25)
    → Vérifie: 25 >= 0 && 25 < this.currentLevel.width (32) ✓
    → Retourne la tuile correcte
  → setTile(25, 25, selectedTile)
    → Vérifie: 25 >= 0 && 25 < this.currentLevel.width (32) ✓
    → Modifie this.currentLevel.tiles[25][25]
```

## Validation
- ✅ getTile/setTile utilisent maintenant currentLevel.width/height
- ✅ Toutes les méthodes utilisant getTile() sont correctes
- ✅ Pas d'autres références à gridWidth/gridHeight dans les accès aux tuiles
- ✅ Les dimensions sont cohérentes à travers tout le flux

## Fichiers Modifiés
- `js/level.js` : Lignes 139-151 (getTile et setTile)
