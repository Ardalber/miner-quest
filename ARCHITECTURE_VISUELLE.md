# Architecture Visuelle - Miner Quest

## 📦 Structure des Fichiers

```
MINER QUEST/
├── index.html              ← Page d'accueil + Jeu
├── editor.html             ← Éditeur de niveaux
├── tile_editor.html        ← Éditeur de tuiles personnalisées
│
├── css/
│   ├── game.css            ← Styles du jeu
│   ├── editor.css          ← Styles de l'éditeur
│   └── tile_editor.css     ← Styles de l'éditeur de tuiles
│
├── js/
│   ├── tiles.js            ← 🖼️ Rendu des tuiles
│   ├── level.js            ← 📊 Gestion des niveaux (BUG FIXÉ ICI)
│   ├── player.js           ← 🚶 Joueur + Physique
│   ├── game.js             ← 🎮 Boucle de jeu
│   └── editor.js           ← ✏️ Éditeur de niveaux
│
├── levels/                 ← Dossier des niveaux JSON
│   ├── level_1.json
│   ├── level_2.json
│   └── ...
│
└── Documentation/
    ├── SOLUTION_RAPIDE.md              ← 👈 LISEZ CECI D'ABORD
    ├── BUG_FIX_ANALYSIS.md             ← Analyse du bug
    ├── CODE_STRUCTURE_GUIDE.md         ← Guide complet du code
    ├── TEST_CHECKLIST.md               ← Tests à faire
    └── CHANGELOG_COMPLETE.md           ← Tous les changements
```

## 🔄 Flux de Données

### Création d'un Niveau (Éditeur)
```
┌─────────────────────────────────────────┐
│ HTML Modal: Dimensions (32x32)          │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ confirmCreateNewLevel()                 │
│  → levelManager.createEmptyLevel()      │
│    - Crée tiles[32][32]                 │
│    - Définit level.width = 32           │
│    - Définit level.height = 32          │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ levelManager.saveLevel()                │
│  → levels[name] = levelData             │
│  → localStorage['minerquest_level_list']│
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ loadEditorLevel(name)                   │
│  → levelManager.loadLevel(name)         │
│    - currentLevel.width = 32            │
│    - currentLevel.height = 32           │
│  → renderEditor()                       │
│    - canvas.width = 32 * 32 = 1024      │
│    - canvasScale = 1024 / rect.width    │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ ✅ Niveau 32x32 prêt à éditer           │
└─────────────────────────────────────────┘
```

### Click Souris pour Placer une Tuile
```
┌─────────────────────────────────────────┐
│ Utilisateur clique à (pixels: 1000,1000)│
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ handleCanvasMouseDown(e)                │
│  → rect = canvas.getBoundingClientRect()│
│  → canvasScale = 1024 / rect.width      │
│  → canvasX = (1000 - rect.left) * scale │
│  → x = floor(canvasX / 32)              │
│    ↓ ex: x = 31                         │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ ⚠️ VALIDATION (ANCIEN BUG ICI)          │
│ getTile(31, 31)                         │
│  ❌ AVANT: if (31 >= gridWidth[16])...  │
│  ✅ APRÈS: if (31 >= currentLevel.width │
│           [32])...  OK!                 │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ setTile(31, 31, STONE)                  │
│  ✅ currentLevel.tiles[31][31] = STONE  │
│  → commitCurrentLevel()                 │
│  → localStorage['minerquest_level_name']│
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ renderEditor()                          │
│  → Redessine le canvas                  │
│  → Affiche STONE à (31,31)              │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ ✅ Tuile visible à (31,31)              │
└─────────────────────────────────────────┘
```

### Gameplay Platformer
```
┌─────────────────────────────────────────┐
│ Utilisateur appuie sur Q                │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ gameLoop()                              │
│  → update(deltaTime)                    │
│    - keys['q'] = true                   │
│    - isPlatformer = true                │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ if (keys['q'])                          │
│   player.velocityX = -0.08              │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ newX = player.x + (-0.08)               │
│ newY = player.y (gravity appliquée)     │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ Vérification collision:                 │
│ levelManager.isSolid(floor(newX), footY)│
│  → getTile(floor(newX), footY)          │
│    ✅ Utilise currentLevel.width        │
│  → Retourne solid property              │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ if (!isSolid)                           │
│   player.x = newX  ✅ Mouvement OK      │
└──────────┬──────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ render()                                │
│  → player.draw()                        │
│  → Affiche joueur à nouvelle position   │
└─────────────────────────────────────────┘
```

## 🎲 Dépendances Entre Modules

```
tiles.js (🖼️ Indépendant)
  ↑
  │ utilise
  │
editor.js ←─────→ level.js (⚠️ CRITIQUE)
                   ↑
                   │ utilise
                   │
                  game.js ←─→ player.js
```

### Interactions Clés

| Module | Dépend De | Raison |
|--------|-----------|--------|
| editor.js | level.js | getTile, setTile, getTileMessage, etc. |
| game.js | level.js | isSolid, isWarp, getTile pour collisions |
| player.js | level.js | isSolid pour vérifier collisions |
| game.js | player.js | Contrôle mouvement/saut |

---

## 🔐 Endroits Critiques du Code

### 1️⃣ **getTile(x, y)** - `level.js:139`
```
Utilisé par:
  - editor.js → handleCanvasMouseDown, paintTile
  - game.js → Vérification collisions
  - player.js → Vérification collisions
Critique car: Détermine si une tuile existe
BUGUÉ si: Utilise gridWidth au lieu de currentLevel.width
```

### 2️⃣ **setTile(x, y, type)** - `level.js:147`
```
Utilisé par:
  - editor.js → paintTile, openChestEditModal, etc.
  - player.js → mineTile
Critique car: Modifie la grille
BUGUÉ si: Refuse de modifier au-delà de gridWidth
```

### 3️⃣ **canvasScale** - `editor.js:73, 783, 956`
```
Utilisé par:
  - handleCanvasMouseDown, paintTile
Critique car: Conversion souris → tuiles
BUGUÉ si: Pas recalculé après redimensionnement canvas
```

### 4️⃣ **level.width / level.height** - `level.js:34-35`
```
Utilisé par:
  - Partout pour dimensions du niveau
Critique car: Doit correspondre à tiles array
BUGUÉ si: Incohérent avec tiles[y].length
```

---

## 📏 Dimensions et Échelles

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Niveau 32x32 en pixels:    1024 × 1024
Affichage sur écran:       ~500 × 500 (ou autre)
Ratio de scaling:          2.048 (1024/500)

Quand utilisateur clique à pixel 500:
  → canvasX = 500 * 2.048 = 1024
  → tileX = 1024 / 32 = 32 (MAUVAIS!)
  → Doit être clipper à 31 max

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🐞 Flux du Bug Original

```
User crée niveau 32x32
  ↓
confirmCreateNewLevel(32, 32)
  ↓
level = {width: 32, height: 32, tiles[32][32]}  ✅
  ↓
getTile() utilisé pour valider
  ✅ Vérifie: x < 32
  ❌ AVANT: Vérifiait x < gridWidth (16)  ← BUG
  ✅ APRÈS: Vérifie x < currentLevel.width (32)
  ↓
Click à (25, 25):
  ✅ APRÈS: OK, dans les limites
  ❌ AVANT: REJETÉ, au-delà de gridWidth
```

---

## ✨ Résumé Visuel des Fixes

| Fichier | Avant | Après | Impact |
|---------|-------|-------|--------|
| **level.js** | gridWidth limité | currentLevel.width dynamique | 🔴→🟢 CRITIQUE |
| **editor.js** | scale statique | scale recalculé | 🟡→🟢 Important |
| **game.js** | délai fixe | vélocité continue | 🟡→🟢 UX |
| **player.js** | jumpSpeed -0.5 | jumpSpeed -0.33 | 🟡→🟢 Balance |

---

**Dernière mise à jour** : 2026-01-14
**Complexité** : 🟢 Simplifiée grâce à documentation
**Maintenabilité** : 🟢 Améliorée avec guides
