# Guide Rapide : Nouveaux Niveaux Platformer

## 🎮 Qu'est-ce qui a changé ?

Vous pouvez maintenant créer deux types de niveaux dans Miner Quest :

### 🔝 Top-Down (Vue du dessus)
Le mode classique où vous vous déplacez dans toutes les directions

### ➡️ Platformer (Vue de côté)  
Un nouveau mode avec gravité, sauts et déplacements horizontaux uniquement !

---

## 📋 Comment créer un niveau Platformer

1. Ouvrez l'**Éditeur de niveaux**
2. Cliquez sur **"Nouveau"**
3. Dans le modal qui s'ouvre :
   - Sélectionnez **"Platformer (Vue de côté)"**
   - Choisissez la **largeur** (ex: 20 tuiles)
   - Choisissez la **hauteur** (ex: 12 tuiles)
4. Cliquez sur **"Créer"**

---

## 🎯 Conseils pour créer un bon niveau Platformer

### ✅ À faire
- Créer des **plateformes** sur lesquelles sauter
- Placer le **point de départ** sur une plateforme solide (pas en l'air !)
- Laisser **2 tuiles de hauteur** libre pour le passage du personnage
- Créer des **escaliers** avec des blocs solides

### ❌ À éviter
- Ne pas laisser le personnage spawner dans le vide
- Éviter les plafonds trop bas (minimum 2 tuiles)
- Ne pas créer de zones sans sol (sauf si c'est voulu !)

---

## 🕹️ Contrôles du mode Platformer

| Touche | Action |
|--------|--------|
| **Q** | Se déplacer à gauche |
| **D** | Se déplacer à droite |
| **Z** | Sauter |
| **Espace** | Action (miner, ouvrir coffres, etc.) |

> **Note :** En mode Platformer, vous ne pouvez pas vous déplacer vers le haut ou le bas avec les touches. Utilisez **Z** pour sauter !

---

## 🔧 Fonctionnalités avancées

### Warps en mode Platformer
- Placez un warp comme d'habitude
- Le warp s'active quand le personnage marche dessus
- **Nouveau :** Le modal de warp affiche maintenant le niveau actuel !

### Tailles personnalisées
- Largeur min : **8 tuiles**
- Largeur max : **32 tuiles**
- Hauteur min : **8 tuiles**
- Hauteur max : **32 tuiles**

### Personnage
- **Mode Top-Down :** 1 tuile de haut
- **Mode Platformer :** 2 tuiles de haut (plus réaliste !)

---

## 💡 Exemple de niveau Platformer

```
Largeur : 20 tuiles
Hauteur : 12 tuiles

    [   ] [   ] [   ]         [COFFRE]
    [   ] [   ] [   ]         [=====]
    [   ] [   ] [   ] 
[=] [   ] [   ]                 [=]
[=] [   ] [WARP]              [===]
[=] [👤] [=====]            [=====]
[===================] [====] [=====]
```

- `👤` = Position de départ (sur une plateforme)
- `[=]` = Blocs solides
- `[COFFRE]` = Coffre avec des ressources
- `[WARP]` = Téléporteur vers un autre niveau
- `[  ]` = Espace vide

---

## 🐛 Résolution de problèmes

### Le personnage tombe dans le vide au démarrage
➜ Placez le point de départ sur une plateforme solide

### Le personnage ne peut pas passer
➜ Vérifiez qu'il y a au moins 2 tuiles de hauteur libre

### Les contrôles ne fonctionnent pas
➜ Vérifiez que le niveau est bien de type "Platformer"

### Le personnage ne saute pas
➜ Assurez-vous d'être au sol avant de sauter

---

## 🎨 Idées de niveaux

1. **Parcours d'obstacles** : Série de plateformes à franchir
2. **Tour ascendante** : Monter en sautant de plateforme en plateforme
3. **Labyrinthe vertical** : Chemins multiples avec sauts complexes
4. **Niveau classique** : Combinaison de plateformes et d'exploration horizontale

---

Amusez-vous bien à créer vos niveaux ! 🎮✨
