# Mise à jour : Support des niveaux Platformer

## Nouvelles fonctionnalités implémentées

### 1. Affichage du niveau actuel dans le dialogue de warp
- Lorsque vous définissez une destination de warp dans l'éditeur, le titre du modal affiche maintenant le niveau dans lequel vous vous trouvez
- Facilite la navigation entre les niveaux lors de la configuration des warps

### 2. Création de niveaux avec options avancées
- Un nouveau modal s'ouvre lors de la création d'un niveau
- **Options disponibles :**
  - **Type de niveau** : Top-Down (vue du dessus) ou Platformer (vue de côté)
  - **Largeur** : de 8 à 32 tuiles
  - **Hauteur** : de 8 à 32 tuiles

### 3. Mode Platformer - Physique et contrôles
- **Gravité** : Le personnage tombe automatiquement
- **Saut** : Touche Z pour sauter
- **Déplacement horizontal** : Q (gauche) et D (droite) uniquement
- **Action** : La touche Espace reste la touche d'action (miner, ouvrir coffres, etc.)

### 4. Personnage adaptatif
- **Mode Top-Down** : Le personnage fait 1 tuile de haut (comportement classique)
- **Mode Platformer** : Le personnage fait 2 tuiles de haut
- Le rendu s'adapte automatiquement selon la taille du niveau

## Modifications techniques

### Fichiers modifiés

#### `editor.html`
- Ajout d'un ID `warp-modal-title` pour afficher le niveau actuel
- Nouveau modal `modal-new-level` avec sélection du type, largeur et hauteur

#### `js/editor.js`
- Fonction `openWarpEditModal()` : affiche maintenant le niveau actuel
- Fonction `createNewLevel()` : ouvre un modal au lieu de créer directement
- Nouvelles fonctions `confirmCreateNewLevel()` et `closeNewLevelModal()`
- Adaptation du rendu pour supporter des tailles de niveau variables
- Fonctions adaptées : `handleCanvasMouseDown()`, `paintTile()`, `renderEditor()`, `loadEditorLevel()`

#### `js/level.js`
- Fonction `createEmptyLevel()` : accepte maintenant des paramètres de largeur et hauteur
- Ajout du champ `type` (topdown/platformer) dans la structure des niveaux
- Migration automatique : les anciens niveaux reçoivent le type 'topdown' par défaut

#### `js/player.js`
- Nouvelles propriétés : `velocityY`, `isJumping`, `isGrounded`, `jumpSpeed`, `gravity`, `height`
- Fonction `move()` : adaptée pour gérer les deux modes
- Nouvelle fonction `jump()` : pour le saut en mode platformer
- Nouvelle fonction `applyPlatformerPhysics()` : gère la gravité et les collisions
- Fonction `draw()` : adapte le rendu selon le mode (1 ou 2 tuiles de haut)
- Fonction `startMining()` : limite les directions en mode platformer
- Toutes les fonctions de rendu utilisent maintenant un `tileSize` dynamique

#### `js/game.js`
- Fonction `update()` : gère différemment les contrôles selon le mode
  - Mode Top-Down : mouvement avec délai dans 4 directions (Z, Q, S, D)
  - Mode Platformer : mouvement fluide horizontal (Q, D) et saut (Z)
- Fonction `drawLevel()` : utilise un `tileSize` dynamique
- Fonction `render()` : passe le `levelManager` au `player.draw()`

## Utilisation

### Créer un niveau platformer
1. Dans l'éditeur, cliquez sur "Nouveau"
2. Sélectionnez "Platformer (Vue de côté)"
3. Définissez la largeur et la hauteur souhaitées
4. Cliquez sur "Créer"

### Contrôles en mode Platformer
- **Q** : Déplacer à gauche
- **D** : Déplacer à droite
- **Z** : Sauter
- **Espace** : Action (miner, ouvrir coffres, lire panneaux, activer warps)

### Contrôles en mode Top-Down (classique)
- **Z** : Haut
- **S** : Bas
- **Q** : Gauche
- **D** : Droite
- **Espace** : Action

## Notes importantes

1. **Compatibilité** : Les niveaux existants sont automatiquement migrés en mode "topdown"
2. **Personnage platformer** : Occupe 2 tuiles de hauteur, assurez-vous de laisser assez d'espace vertical
3. **Collisions** : En mode platformer, le personnage vérifie les collisions pour ses 2 tuiles de hauteur
4. **Tailles variables** : Le rendu s'adapte automatiquement, que votre niveau fasse 8x8 ou 32x32 tuiles

## Exemples d'utilisation

### Niveau platformer simple
- Largeur : 20 tuiles
- Hauteur : 12 tuiles
- Placer des plateformes solides pour sauter dessus
- Le personnage spawn sur une plateforme solide

### Niveau top-down classique
- Largeur : 16 tuiles
- Hauteur : 16 tuiles
- Vue du dessus avec déplacement libre
- Idéal pour des labyrinthes et exploration

## Améliorations futures possibles
- Ajout d'ennemis avec comportements différents selon le mode
- Objets collectables spécifiques au mode platformer
- Vitesse de déplacement ajustable
- Paramètres de gravité et de saut personnalisables par niveau
