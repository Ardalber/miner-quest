# Checklist de Test - Miner Quest

## ✅ Test de Correction du Bug de Placement de Tuiles

### Étape 1: Créer un Niveau Platformer 32x32
- [ ] Cliquer sur "Créer Niveau"
- [ ] Sélectionner "platformer"
- [ ] Définir largeur : 32
- [ ] Définir hauteur : 32
- [ ] Cliquer "Créer"

### Étape 2: Tester le Placement de Tuiles

#### Zone Centrale (doit fonctionner)
- [ ] Cliquer sur une tuile dans la palette
- [ ] Cliquer au centre du canvas
- [ ] Vérifier que la tuile est placée

#### Zone Droite (BUG si échoue)
- [ ] Cliquer sur tuile STONE dans la palette
- [ ] Cliquer sur le bord DROIT du canvas (x ≈ 30)
- [ ] Vérifier que STONE est placée
- [ ] Cliquer à x=31 (dernière colonne)
- [ ] Vérifier que STONE est placée

#### Zone Bas (BUG si échoue)
- [ ] Cliquer sur tuile STONE
- [ ] Cliquer en BAS du canvas (y ≈ 30)
- [ ] Vérifier que STONE est placée
- [ ] Cliquer à y=31 (dernière ligne)
- [ ] Vérifier que STONE est placée

#### Coin Bas-Droit (BUG si échoue)
- [ ] Cliquer sur tuile STONE
- [ ] Cliquer au coin BAS-DROIT (x≈31, y≈31)
- [ ] Vérifier que STONE est placée

### Étape 3: Tester le Mode Top-Down 32x32
- [ ] Créer nouveau niveau "topdown" 32x32
- [ ] Répéter Étape 2 pour top-down
- [ ] Vérifier que le placement marche partout

### Étape 4: Tester le Déplacement du Joueur
- [ ] Créer niveau 32x32 platformer
- [ ] Placer des tuiles un peu partout
- [ ] Cliquer "Tester"
- [ ] Vérifier que le personnage avance fluide avec Q/D
- [ ] Vérifier que Maj accélère
- [ ] Vérifier que Z saute
- [ ] Tester collision (marcher contre un bloc)

### Étape 5: Tester les Warps
- [ ] Créer 2 niveaux platformer
- [ ] Placer un warp dans le premier
- [ ] Définir destination vers le deuxième
- [ ] Tester (vérifier que ça téléporte)

### Étape 6: Tester la Sauvegarde/Chargement
- [ ] Modifier un niveau (placer des tuiles)
- [ ] Cliquer "Sauvegarder"
- [ ] Recharger la page (F5)
- [ ] Vérifier que les tuiles sont toujours là
- [ ] Charger un autre niveau
- [ ] Charger le premier niveau
- [ ] Vérifier que tout est sauvegardé

---

## 🔍 Points de Vérification du Code

### GetTile/SetTile
```javascript
// ✅ DOIT UTILISER currentLevel.width/height
getTile(x, y) {
    if (x < 0 || x >= this.currentLevel.width || ...) return 0;
    return this.currentLevel.tiles[y][x];
}
```

### Canvas Scaling
```javascript
// ✅ DOIT RECALCULER après renderEditor
canvasScale = editorCanvas.width / rect.width;

// ✅ DOIT UTILISER dans handleCanvasMouseDown
const canvasX = (e.clientX - rect.left) * canvasScale;
```

### Création de Niveau
```javascript
// ✅ DOIT créer les bonnes dimensions
const level = levelManager.createEmptyLevel(name, 32, 32);
// level.width === 32
// level.height === 32
// level.tiles.length === 32
// level.tiles[0].length === 32
```

### Platformer Physics
```javascript
// ✅ DOIT utiliser currentLevel.width dans les collisions
if (!levelManager.isSolid(Math.floor(newX), footY)) {
    player.x = newX;  // OK
}
```

---

## 📊 Cas de Test Spécifiques

| Cas | Entrée | Attendu | Statut |
|-----|--------|---------|--------|
| Niveau 16x16 | Créer 16x16 | Peut placer partout | ✅ |
| Niveau 32x32 | Créer 32x32 | Peut placer à (31,31) | ❓ TESTER |
| Clic (0,0) | Click coin haut-gauche | Tuile (0,0) | ✅ |
| Clic (31,31) | Click coin bas-droit 32x32 | Tuile (31,31) | ❓ TESTER |
| Canvas rescale | Redimensionner fenêtre | Placement toujours OK | ❓ TESTER |
| Platformer saut | Z en platformer | Saute 2.2 cases | ✅ |
| Platformer vitesse | Q/D en platformer | Glisse fluide | ✅ |
| Top-down délai | Q/D en top-down | Mouvement carré | ✅ |

---

## 🚨 Erreurs Connues Fixées

### ✅ GetTile utilisait gridWidth au lieu de currentLevel.width
- **Avant** : Impossible de placer au-delà de 16x16
- **Après** : Peut placer n'importe où jusqu'à currentLevel.width
- **Ligne** : js/level.js 139-151

### ✅ SetTile utilisait gridWidth au lieu de currentLevel.width
- **Avant** : Modification échouait silencieusement
- **Après** : Fonctionne avec les vraies dimensions
- **Ligne** : js/level.js 139-151

---

## 🎯 Commandes de Débogage Console

```javascript
// Vérifier les dimensions du niveau
console.log(levelManager.currentLevel.width);
console.log(levelManager.currentLevel.height);

// Vérifier une tuile
console.log(levelManager.getTile(31, 31));

// Vérifier le scale du canvas
console.log('canvasScale:', canvasScale);
console.log('canvas.width:', editorCanvas.width);
console.log('rect.width:', editorCanvas.getBoundingClientRect().width);

// Vérifier si c'est platformer
console.log(levelManager.currentLevel.type);

// Vérifier les tuiles d'une ligne
for (let x = 0; x < 32; x++) {
    console.log(`(${x},31):`, levelManager.getTile(x, 31));
}
```

---

## 📋 Checklist de Maintenance

- [ ] Aucune référence à `gridWidth` dans les vérifications de limites
- [ ] Toutes les méthodes d'accès aux tuiles utilisent `currentLevel.width/height`
- [ ] Le canvas est redessiné après chaque changement de niveau
- [ ] `canvasScale` est recalculé dans `renderEditor()`
- [ ] Les limites des inputs sont mises à jour lors du chargement de niveau
- [ ] Les métadonnées (warp/chest/sign) sont nettoyées régulièrement
- [ ] Les données sont sauvegardées dans localStorage après chaque modification

---

## ✨ Comportement Attendu Final

### ✅ Éditeur de Niveaux
- Peut créer niveaux de 8x8 à 32x32
- Peut placer des tuiles n'importe où
- Sauvegarde automatique
- Undo/Redo avec Ctrl+Z
- Vue live du niveau avec grille

### ✅ Jeu Platformer
- Mouvement fluide en Q/D (2.56 tiles/sec)
- Accélération Maj (5.12 tiles/sec)
- Saut Z (2.2 tiles de haut)
- Gravité réaliste
- Collisions avec tuiles solides

### ✅ Jeu Top-Down
- Mouvement par pas Q/Z/S/D
- Délai de 150ms entre chaque pas
- Collisions

---

**Date** : 2026-01-14
**Responsable** : Vérification complète du flux
**Status** : 🟢 Prêt pour test utilisateur
