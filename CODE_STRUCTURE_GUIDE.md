# Guide de Structure du Code - Miner Quest

## 📋 Vue d'Ensemble de l'Architecture

### Fichiers Principaux

#### 1. **js/tiles.js** - Configuration des Tuiles
- Classe : `TileRenderer`
- Rôle : Gère le rendu graphique des tuiles et leur cache
- Fonctions clés :
  - `getTile(tileType)` : Retourne l'image d'une tuile
  - `clearCache()` : Vide le cache des images
  - `loadCustomTile(id, img)` : Charge une tuile personnalisée

#### 2. **js/level.js** - Gestion des Niveaux
- Classe : `LevelManager`
- Rôle : Gère les données des niveaux, la grille, les collisions
- **VARIABLES CRITIQUES** :
  - `this.currentLevel` : Niveau actuellement chargé
  - `this.gridWidth` : Largeur par défaut pour NOUVEAUX niveaux (16)
  - `this.gridHeight` : Hauteur par défaut pour NOUVEAUX niveaux (16)
  - `this.levels` : Dict de tous les niveaux chargés
- **MÉTHODES CRITIQUES** :
  - `getTile(x, y)` : ⚠️ ACCÈS DIRECT - Vérifie currentLevel.width/height
  - `setTile(x, y, type)` : ⚠️ ACCÈS DIRECT - Vérifie currentLevel.width/height
  - `createEmptyLevel(name, width, height)` : Crée une nouvelle grille
  - `loadLevel(name)` : Charge un niveau dans currentLevel
  - `isSolid(x, y)` : Vérifie si c'est un bloc solide
  - `isWarp(x, y)` : Vérifie si c'est un warp
  - `migrateTiles(level)` : Convertit les tuiles invalides en EMPTY

#### 3. **js/player.js** - Physique et Animations du Joueur
- Classe : `Player`
- Rôle : Gère position, mouvement, saut, minage
- **MODES** :
  - Top-down : Mouvement dans 4 directions avec délai
  - Platformer : Mouvement horizontal fluide + gravité
- **PROPRIÉTÉS CRITIQUES** :
  - `this.velocityX`, `this.velocityY` : Pour mouvement fluide platformer
  - `this.isGrounded`, `this.isJumping` : État du saut
  - `this.direction` : Direction pour les animations
- **MÉTHODES** :
  - `move(dx, dy, levelManager)` : Déplace avec collision
  - `jump(levelManager)` : Effectue un saut (platformer)
  - `applyPlatformerPhysics(deltaTime, levelManager)` : Applique gravité

#### 4. **js/game.js** - Boucle Principale du Jeu
- Rôle : Gère gameLoop, update, render
- **FONCTION PRINCIPALE** :
  - `gameLoop()` : Boucle requestAnimationFrame
  - `update(deltaTime)` : Logique du jeu
  - `render()` : Affichage graphique
- **LOGIQUE IMPORTANTE** :
  - Détecte `isPlatformer` pour changer le comportement
  - Gère touches clavier (Q, D, Z, Maj)
  - Applique physique Platformer

#### 5. **js/editor.js** - Éditeur de Niveaux
- Rôle : Interface pour créer/modifier les niveaux
- **VARIABLES CRITIQUES** :
  - `canvasScale` : Ratio entre taille réelle et affichée du canvas
  - `editorCanvas` : Element canvas HTML
  - `selectedTile` : ID de la tuile actuellement sélectionnée
  - `currentLevelName` : Nom du niveau en cours d'édition
- **FLUX DE CLICK** :
  1. `handleCanvasMouseDown()` → calcule coordonnées souris
  2. Valide position avec `getTile()`
  3. `setTile()` pour modifier
  4. `renderEditor()` pour afficher

#### 6. **js/index.html + css/** - Interface
- Canvas pour le jeu et l'éditeur
- Modaux pour création de niveaux, coffres, panneaux, warps
- Contrôles d'inventaire, minimap

## 🔄 Flux de Données Courant

### Flux de Création de Niveau
```
HTML (modal input)
  ↓
confirmCreateNewLevel()
  ↓
levelManager.createEmptyLevel(name, width, height)
  → crée tiles[height][width] rempli de 0 (EMPTY)
  → level.width = width, level.height = height
  ↓
levelManager.saveLevel(name, levelData)
  → levels[name] = levelData
  → localStorage['minerquest_level_list'] = [noms]
  ↓
loadEditorLevel(name)
  → levelManager.loadLevel(name)
  → currentLevel = copy of levels[name]
  → renderEditor()
    → canvas.width = level.width * 32
    → canvas.height = level.height * 32
    → canvasScale = canvas.width / rect.width
    → dessine toutes les tuiles
```

### Flux de Click sur le Canvas
```
User Click
  ↓
handleCanvasMouseDown(e)
  → rect = canvas.getBoundingClientRect()
  → canvasScale = canvas.width / rect.width
  → canvasX = (e.clientX - rect.left) * canvasScale
  → x = Math.floor(canvasX / 32)
  → getTile(x, y)  // ⚠️ Vérifie x < currentLevel.width
  ↓
setTile(x, y, selectedTile)
  → Vérifie x < currentLevel.width  // ⚠️ CRITIQUE
  → currentLevel.tiles[y][x] = selectedTile
  ↓
renderEditor()
  → redessine le canvas
```

### Flux de Collision (Platformer)
```
Game Update
  ↓
player.applyPlatformerPhysics()
  → newX = player.x + player.velocityX
  ↓
levelManager.isSolid(Math.floor(newX), footY)
  → getTile(floor(newX), footY)
  → Vérifie si TileConfig[tileType].solid
  ↓
If collision: player.x stays same
Else: player.x = newX
```

## ⚠️ Pièges Communs

### 1. **GridWidth vs CurrentLevel.width**
```javascript
// ❌ MAUVAIS
if (x >= this.gridWidth) return;  // Limité à 16

// ✅ BON
if (x >= this.currentLevel.width) return;  // Utilise taille réelle
```

### 2. **Canvas Scaling**
```javascript
// ❌ MAUVAIS
const x = (e.clientX - rect.left) / 32;  // Ignore le scaling

// ✅ BON
const canvasX = (e.clientX - rect.left) * canvasScale;
const x = Math.floor(canvasX / 32);
```

### 3. **Mode Platformer vs Top-down**
```javascript
// Vérifier TOUJOURS le type
const isPlatformer = levelManager.currentLevel?.type === 'platformer';
if (isPlatformer) {
    // Utiliser velocityX, gravité, etc.
} else {
    // Utiliser move() avec délai
}
```

### 4. **Persistance des Données**
```javascript
// Après chaque modification de tuiles
this.commitCurrentLevel();  // Sauvegarde dans localStorage
// Ou explicitement
levelManager.saveLevel(name, levelData);
```

## 📐 Dimensions et Coordonnées

### Espaces de Coordonnées
```
Tuiles:     x ∈ [0, level.width[,  y ∈ [0, level.height[
Pixels:     x ∈ [0, level.width*32[, y ∈ [0, level.height*32[
Canvas DOM: x ∈ [0, rect.width[,   y ∈ [0, rect.height[
```

### Conversion
```javascript
// Souris DOM → Pixels Canvas
canvasX = (mouseX - rect.left) * (canvas.width / rect.width)
canvasY = (mouseY - rect.top) * (canvas.height / rect.height)

// Pixels Canvas → Tuiles
tileX = Math.floor(canvasX / 32)
tileY = Math.floor(canvasY / 32)

// Tuiles → Pixels Canvas
pixelX = tileX * 32
pixelY = tileY * 32
```

## 🐛 Checklist de Débogage

Quand quelque chose ne marche pas :

- [ ] Vérifier que `currentLevel.width` et `currentLevel.height` sont corrects
- [ ] Vérifier que `getTile()` utilise `currentLevel.width/height`
- [ ] Vérifier que `canvasScale` est calculé après `renderEditor()`
- [ ] Vérifier que le type de niveau est défini ('topdown' ou 'platformer')
- [ ] Vérifier que les tuiles sont dans l'array `level.tiles[y][x]`
- [ ] Vérifier que les métadonnées (warpData, chestData) ne sont pas orphelines
- [ ] Utiliser `console.log()` pour afficher les valeurs réelles

## 🔧 Points d'Extension

### Ajouter une Nouvelle Propriété de Tuile
1. Ajouter à `TileConfig` dans editor.html
2. Ajouter logique de gestion dans `getTileXxx()` dans level.js
3. Ajouter UI dans l'éditeur si nécessaire

### Ajouter un Nouveau Mode de Jeu
1. Ajouter `level.gameMode` à `createEmptyLevel()`
2. Ajouter branche `if (gameMode === 'newMode')` dans game.js update
3. Implémenter logique spécifique

### Ajouter Persistance Réseau
1. Remplacer les appels `localStorage` par des appels API
2. Garder la même structure de données
3. Ajouter gestion des erreurs de réseau

---

**Dernière mise à jour** : 2026-01-14
**Version stable** : ✅ Avec correction getTile/setTile
