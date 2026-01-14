# 🛡️ Prévention des Bugs - Bonnes Pratiques

## 🎯 Erreur Fondamentale Qui a Causé le Bug

### Le Bug Original
```javascript
class LevelManager {
    constructor() {
        this.gridWidth = 16;   // Variable d'instance
        this.gridHeight = 16;  // Variable d'instance
    }
    
    getTile(x, y) {
        // ❌ ERREUR: Utiliser this.gridWidth au lieu de currentLevel.width
        if (x >= this.gridWidth) return 0;
        return this.currentLevel.tiles[y][x];
    }
}
```

### Le Problème
1. `this.gridWidth` = valeur par défaut **fixée à 16**
2. `this.currentLevel.width` = dimensions **réelles du niveau** (8-32)
3. Mélanger les deux causait des bugs silencieux
4. Aucune erreur console (les valeurs existent toutes deux)

### La Règle D'Or
> **Ne JAMAIS mélanger des variables d'état différentes pour la même chose**

---

## 🔍 Patterns à Éviter

### ❌ Anti-Pattern 1 : Variables Parallèles Inconsistantes
```javascript
// MAUVAIS
class Game {
    constructor() {
        this.defaultWidth = 16;    // Valeur par défaut
        this.currentWidth = 0;     // Valeur actuelle
    }
    
    isInBounds(x) {
        // BUG: lequel utiliser?
        return x < this.defaultWidth;  // Utilise la mauvaise!
    }
}
```

**Solution** :
```javascript
// BON
class Game {
    constructor() {
        this.level = null;  // Une seule source de vérité
    }
    
    isInBounds(x) {
        return x < this.level.width;  // Toujours la même source
    }
}
```

### ❌ Anti-Pattern 2 : Paramètres Oubliés
```javascript
// MAUVAIS
function getTile(x, y) {
    // Supposons que levelManager et currentLevel existent
    // = variables globales implicites = difficulté à tester
    return levelManager.currentLevel.tiles[y][x];
}

// BON
function getTile(level, x, y) {
    // Explicite, facile à tester
    return level.tiles[y][x];
}
```

### ❌ Anti-Pattern 3 : Magie Numérique
```javascript
// MAUVAIS
if (x > 16 || x < 0) return;  // Magique: d'où vient 16?

// BON
const GRID_WIDTH = 16;  // Ou mieux encore:
if (x >= this.level.width || x < 0) return;
```

### ❌ Anti-Pattern 4 : Validation Oubliée
```javascript
// MAUVAIS
setTile(x, y, type) {
    this.tiles[y][x] = type;  // Et si x/y sont hors limites?
}

// BON
setTile(x, y, type) {
    if (x < 0 || x >= this.width) return false;
    if (y < 0 || y >= this.height) return false;
    this.tiles[y][x] = type;
    return true;  // Indique le succès
}
```

---

## ✅ Bonnes Pratiques Appliquées

### 1️⃣ Source de Vérité Unique (Single Source of Truth)
```javascript
// ✅ BON: Une seule place où chercher les dimensions
getTile(x, y) {
    const limit = this.currentLevel.width;  // Une seule source
    if (x >= limit) return EMPTY;
    return this.currentLevel.tiles[y][x];
}
```

### 2️⃣ Validation Systématique
```javascript
// ✅ BON: Toujours vérifier les limites
getTile(x, y) {
    if (!this.currentLevel) return EMPTY;
    if (x < 0 || x >= this.currentLevel.width) return EMPTY;
    if (y < 0 || y >= this.currentLevel.height) return EMPTY;
    return this.currentLevel.tiles[y][x];
}
```

### 3️⃣ Assertions et Vérifications
```javascript
// ✅ BON: Vérifier la cohérence au chargement
loadLevel(name) {
    const level = this.levels[name];
    
    // Assertions
    console.assert(level.width > 0, 'Width doit être > 0');
    console.assert(level.tiles.length === level.height, 'Height mismatch');
    console.assert(level.tiles[0].length === level.width, 'Width mismatch');
    
    return level;
}
```

### 4️⃣ Types Explicites (JSDoc)
```javascript
// ✅ BON: Documenter ce qui est attendu
/**
 * Obtenir une tuile à une position
 * @param {number} x - Coordonnée X (0 à level.width-1)
 * @param {number} y - Coordonnée Y (0 à level.height-1)
 * @returns {number} ID de la tuile (0 pour EMPTY)
 */
getTile(x, y) {
    if (x < 0 || x >= this.currentLevel.width) return 0;
    if (y < 0 || y >= this.currentLevel.height) return 0;
    return this.currentLevel.tiles[y][x];
}
```

---

## 🧪 Testing Patterns

### Test de Régression pour le Bug
```javascript
// ✅ TEST: Vérifier que la correction tient
test('getTile respects actual level dimensions', () => {
    const level = levelManager.createEmptyLevel('test', 32, 32);
    levelManager.loadLevel('test');
    
    // Avant le fix, ceci aurait échoué silencieusement
    levelManager.setTile(31, 31, STONE);
    
    // Après le fix, ceci doit fonctionner
    const result = levelManager.getTile(31, 31);
    assert(result === STONE, 'Tile at (31,31) should be STONE');
});
```

### Edge Cases à Tester
```javascript
test('getTile edge cases', () => {
    // Coins
    assert(getTile(-1, -1) === EMPTY);
    assert(getTile(0, 0) !== undefined);
    assert(getTile(31, 31) !== undefined);  // Avant c'était undefined!
    assert(getTile(32, 32) === EMPTY);      // Juste au-delà
    
    // Axes
    assert(getTile(0, 15) !== undefined);
    assert(getTile(15, 0) !== undefined);
    assert(getTile(31, 15) !== undefined);  // Avant c'était undefined!
});
```

---

## 📋 Checklist de Code Review

Avant de merger du code, demander:

- [ ] **Source Unique de Vérité** : Les données sont-elles stockées à un seul endroit?
- [ ] **Validation** : Tous les inputs sont-ils validés?
- [ ] **Limites** : Les limites sont-elles vérifiées avant accès?
- [ ] **Cohérence** : Les variables liées sont-elles mises à jour ensemble?
- [ ] **Documentation** : Y a-t-il des commentaires sur les valeurs magiques?
- [ ] **Tests** : Y a-t-il des tests pour les edge cases?
- [ ] **Erreurs** : Les erreurs sont-elles loggées ou gérées?
- [ ] **Performance** : Le code ne fait-il pas d'appels inutiles en boucle?

---

## 🚨 Signes d'Alerte (Red Flags)

### ⚠️ Suspicion 1 : Deux Variables Liées
```javascript
// 🚩 Peut-être un problème
this.gridWidth = 16;           // Variable 1
this.level.width = 32;         // Variable 2
// Si elles ne sont pas synchronisées = BUG potentiel!
```

### ⚠️ Suspicion 2 : Valeurs Magiques
```javascript
// 🚩 D'où vient ce 16?
if (x > 16) return;
// Si c'est une constante, le nommer
// Si c'est une dimension, utiliser level.width
```

### ⚠️ Suspicion 3 : Pas de Validation
```javascript
// 🚩 Aucune vérification
return tiles[y][x];  // Et si y est négatif? Crash!
```

### ⚠️ Suspicion 4 : Variables Globales
```javascript
// 🚩 Différentes parties du code modifient la même variable
window.currentLevel = ...
// Dans editor.js
// Dans game.js
// Dans player.js
// = risque de divergence
```

---

## 💡 Leçons Apprises

### Leçon 1 : La Simplicité Gagne
Le bug a persisté longtemps **parce que le code était trop complexe**.
- Trop de variables d'instance
- Trop de lieux différents où chercher la "vérité"
- Pas assez de commentaires

**Solution** : Utiliser `currentLevel.width` au lieu de `gridWidth`.

### Leçon 2 : Tests = Confiance
Si le bug avait été couvert par des tests, il aurait été trouvé en 30 secondes.

```javascript
// Un simple test aurait trouvé le bug
test('can place tiles at (31,31) in 32x32 level', () => {
    createLevel(32, 32);
    setTile(31, 31, STONE);  // ÉCHOUE avant le fix
    assert(getTile(31, 31) === STONE);
});
```

### Leçon 3 : Documentation Peut Prévenir
Un commentaire simple aurait aidé :

```javascript
// Ces variables définissent les DIMENSIONS PAR DÉFAUT des nouveaux niveaux
// PAS les dimensions du niveau courant!
this.gridWidth = 16;
this.gridHeight = 16;

// TOUJOURS utiliser this.currentLevel.width/height pour les vérifications!
```

### Leçon 4 : Code Review Sauve
Un review qui pose "pourquoi on utilise gridWidth ici et pas currentLevel.width?" aurait trouvé le bug avant qu'il ne cause des dégâts.

---

## 🎓 Résumé pour Éviter des Bugs Similaires

1. **Une Source de Vérité** : Pas deux variables pour la même chose
2. **Toujours Valider** : Vérifier les limites avant d'accéder
3. **Écrire des Tests** : Surtout pour les edge cases
4. **Documenter les "Pourquoi"** : Pas juste les "quoi"
5. **Code Review Sérieuse** : Poser des questions sur les choix
6. **Assertions** : Vérifier la cohérence au runtime en dev
7. **Noms Explicites** : Pas de variables ambigües

---

**Application** : Cette leçon s'applique à **TOUS** les projets logiciels.
Le bug de Miner Quest est un exemple classique du manque de clarté dans la gestion d'état.
