# Système de Collision par Bords Solides

## 📋 Résumé des changements

L'ancien système de collision basé sur des hitbox entières a été remplacé par un système **basé sur les pixels des bords des tuiles**. Chaque tuile peut maintenant avoir ses bords indépendamment solides (haut, bas, gauche, droite).

## 🎯 Objectif

Au lieu de déclarer une tuile entière comme "solide", vous pouvez maintenant définir précisément quels bords de la tuile sont solides. Cela permet :
- Des collisions plus précises
- Des designs de tuiles plus complexes (demi-blocs, escaliers, etc.)
- Une meilleure granularité du placement des obstacles

## 🔧 Système Technique

### Structure TileConfig

Ancienne structure :
```javascript
{
    name: 'Mon tuile',
    color: '#ffffff',
    solid: true,  // ❌ SUPPRIMÉ
    minable: false,
    resource: null
}
```

Nouvelle structure :
```javascript
{
    name: 'Mon tuile',
    color: '#ffffff',
    solidEdges: {
        top: true,      // Bord supérieur solide
        bottom: true,   // Bord inférieur solide
        left: true,     // Bord gauche solide
        right: true     // Bord droit solide
    },
    minable: false,
    resource: null
}
```

### Méthodes de collision

#### `levelManager.hasCollisionEdge(x, y, direction)`
Vérifie si il y a une collision avec un bord spécifique d'une tuile.

**Paramètres:**
- `x, y` : Position en tuiles (peut être fractionnaire)
- `direction` : `'top'`, `'bottom'`, `'left'`, ou `'right'`

**Retour:** `true` si collision, `false` sinon

**Exemple:**
```javascript
if (levelManager.hasCollisionEdge(5, 3, 'right')) {
    console.log('Collision avec le bord droit de la tuile [5,3]');
}
```

#### `levelManager.isSolid(x, y)` (compatible)
Conservée pour la compatibilité. Retourne `true` si **tous les bords** de la tuile sont solides.

### Détection de collision dans Player

La méthode `checkCollisionDirectional` a été mise à jour pour :
1. Tester les bords dans la direction du mouvement
2. Utiliser `hasCollisionEdge` au lieu de `isSolid`
3. Vérifier à la fois la tuile occupée et les tuiles adjacentes

**Exemple de logique :**
```javascript
// Mouvement à droite (dx > 0)
for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
    // Tester le bord gauche de la tuile à droite
    if (levelManager.hasCollisionEdge(tileX + 1, tileY, 'left')) {
        return true; // Collision!
    }
    // Tester le bord droit de la tuile actuelle
    if (levelManager.hasCollisionEdge(tileX, tileY, 'right')) {
        return true;
    }
}
```

## 🎨 Interface de l'Éditeur de Tuiles

### Avant
- ☑️ Solide (un seul checkbox)

### Après
- ☑️ Haut (⬆️)
- ☑️ Bas (⬇️)
- ☑️ Gauche (⬅️)
- ☑️ Droite (➡️)

**Utilisation :** 
Cochez les bords que vous souhaitez rendre solides pour chaque tuile.

## 📚 Exemples d'utilisation

### Bloc plein (ancien "solid: true")
```javascript
solidEdges: {
    top: true,
    bottom: true,
    left: true,
    right: true
}
```

### Bloc de sol (demi-bloc)
```javascript
solidEdges: {
    top: true,      // Le joueur peut marcher dessus
    bottom: false,
    left: false,
    right: false
}
```

### Pente gauche (collision à droite uniquement)
```javascript
solidEdges: {
    top: false,
    bottom: false,
    left: false,
    right: true     // Collision seulement à droite
}
```

### Escalier (collision sur le haut et la droite)
```javascript
solidEdges: {
    top: true,
    bottom: false,
    left: false,
    right: true
}
```

## 🔄 Migration des anciennes tuiles

Les anciennes tuiles avec `solid: true` seront automatiquement converties :
```javascript
// Ancien
solid: true

// Nouveau
solidEdges: {
    top: true,
    bottom: true,
    left: true,
    right: true
}
```

Les tuiles sans `solidEdges` définis auront les valeurs par défaut (tous les bords non solides).

## ⚙️ Code pertinent

### level.js
- `hasCollisionEdge(x, y, direction)` - Nouvelle méthode
- `isSolid(x, y)` - Mise à jour pour compatibilité

### player.js
- `checkCollisionDirectional(x, y, dx, dy, levelManager)` - Entièrement refactorisée

### tiles.js
- `TileConfig` - Structure mise à jour avec `solidEdges` au lieu de `solid`

### tile_editor.html / tile_editor.js
- Interface utilisateur mise à jour avec 4 checkboxes pour les bords
- Logique de sauvegarde/chargement adaptée

## 🧪 Tests recommandés

1. **Bloc plein** - Tester qu'on ne peut pas passer à travers
2. **Demi-bloc** - Tester qu'on peut marcher dessus mais pas passer à travers le haut
3. **Pente** - Tester la collision directionnelle
4. **Mode Platformer** - Vérifier la physique et les sauts
5. **Mode Top-down** - Vérifier le mouvement en 4 directions

## 📝 Notes importantes

- Le système teste les bords des tuiles adjacentes pour une détection plus précise
- La collision prend en compte la position fractionnaire du joueur
- Les deux couches de tuiles (foreground et background) sont vérifiées
- Le système est rétro-compatible avec `isSolid()` pour les vérifications simples

## 🐛 Dépannage

**Le joueur passe à travers les tuiles solides :**
- Vérifiez que `solidEdges` est correctement défini
- Vérifiez que la direction correspondante est cochée

**Le joueur ne peut pas bouger :**
- Vérifiez qu'il n'y a pas de bord solide en face du joueur
- Testez avec le nouvel éditeur de tuiles

**Erreurs de console :**
- Vérifiez que `hasCollisionEdge` et `solidEdges` sont bien définis
- Assurez-vous que TileConfig est chargé avant d'utiliser les tuiles
