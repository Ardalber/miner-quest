# Guide visuel - Système de collision par bords solides

## 🎨 Visualisation des bords

### Bloc plein (tous les bords solides)
```
    ▒▒▒▒▒▒▒▒
    ▒[top ]▒  (haut solide)
    ▒▒▒▒▒▒▒▒
  L ▒      ▒ R  (gauche et droite solides)
  e ▒      ▒ i
  f ▒      ▒ g
  t ▒▒▒▒▒▒▒▒ ht
    ▒[bot ]▒  (bas solide)
    ▒▒▒▒▒▒▒▒
```
**Configuration:**
```javascript
solidEdges: {
    top: true,
    bottom: true,
    left: true,
    right: true
}
```

### Demi-bloc (collision haute uniquement)
```
    ▒▒▒▒▒▒▒▒
    ▒[SOLIDE]▒  ✓ Collision au-dessus
    ▒▒▒▒▒▒▒▒
    
    (aucune bordure latérale ou basse)
```
**Configuration:**
```javascript
solidEdges: {
    top: true,      // ✓ Joueur marche dessus
    bottom: false,  // ✗ Aucune collision en bas
    left: false,    // ✗ Traverse par la gauche
    right: false    // ✗ Traverse par la droite
}
```

**Illustration de mouvement:**
```
    Joueur peut passer par le bas ↓
         ↙     ↓     ↘
    [Player]
         ↙     ▒▒▒▒▒▒  ↘
    Marche dessus ↑
```

### Escalier (haut + droite)
```
    ▒▒▒▒▒▒▒▒
    ▒[SOLIDE]▒▒  ✓ Top-right corner
    ▒ ▒▒▒▒▒▒▒
    ▒
```
**Configuration:**
```javascript
solidEdges: {
    top: true,      // ✓ Peut marcher dessus
    bottom: false,
    left: false,
    right: true     // ✓ Collision à droite
}
```

**Utilisation en niveau:**
```
  Étage 2    ▒[3]
    ┌─────┘  
    │        ▒[2]
    │      ┌─┘
  Étage 1  │   ▒[1]
    └──────┘─┘
    
[1], [2], [3] = escalier montant
```

### Pente gauche (droite uniquement)
```
    ▒▒▒▒▒▒▒▒
    ▒▒▒▒▒ ▒  ✓ Collision à droite uniquement
    ▒▒▒▒▒▒▒▒
```
**Configuration:**
```javascript
solidEdges: {
    top: false,
    bottom: false,
    left: false,
    right: true     // ✓ Bord droit solide
}
```

**Mouvement:**
```
      ↙ Joueur peut entrer par le haut
      
    ▒[pente]▒
    
      ↘ Joueur peut sortir par le bas
```

## 🎮 Exemples dans un niveau

### Level simple avec tuiles mixtes
```
     X=0  1    2    3    4    5
  Y=0 [W ] [W ] [W ] [W ] [W ] [W ]    W = Wall (bloc plein)
  Y=1 [W ] [ ] [ ] [ ] [ ] [W ]        H = Demi-bloc (collision haute)
  Y=2 [W ] [H] [H] [H] [H] [W ]        P = Joueur
  Y=3 [W ] [P] [ ] [ ] [ ] [W ]        
  Y=4 [W ] [W ] [W ] [W ] [W ] [W ]
```

### Configuration des tuiles
```javascript
TileConfig[1] = { // Wall
    name: 'Mur',
    solidEdges: { top: true, bottom: true, left: true, right: true }
}

TileConfig[2] = { // Demi-bloc
    name: 'Plateforme',
    solidEdges: { top: true, bottom: false, left: false, right: false }
}
```

### Mouvements possibles du joueur
```
[P] peut marcher sur [H] → ↓ peut passer par le bas
[P] ne peut pas entrer dans [W]
[P] peut se déplacer librement sur [ ] (vide)
```

## 🔄 Détection de collision

### Mouvement à droite
```javascript
Joueur à (x, y) se déplace vers (x+1, y)

↓ Teste:
1. Bord gauche de la tuile [x+1]  (tuile adjacente)
2. Bord droit de la tuile [x]     (tuile actuelle)

    [x, y] → [x+1, y]
    ┌──┐ ┌──┐
    │▒▒│ │  │
    └──┘ └──┘
       └─Test du bord droit
            └─Test du bord gauche
```

### Mouvement en bas
```javascript
Joueur à (x, y) se déplace vers (x, y+1)

↓ Teste:
1. Bord supérieur de la tuile [y+1]  (tuile en bas)
2. Bord inférieur de la tuile [y]    (tuile actuelle)

    [x, y]     ┌─Test du bord bas
    ┌──┐       │
    │  │ ──────┘
    └──┘
    [x, y+1]   │
    ┌──┐       │─Test du bord haut
    │▒▒│ ──────┘
    └──┘
```

## 📊 Matrice des 16 combinaisons possibles

```
ID | Top | Bot | Left | Right | Nom/Utilisation
----|-----|-----|------|-------|------------------
 0  |  F  |  F  |  F   |   F   | Vide (traversable)
 1  |  T  |  F  |  F   |   F   | Demi-bloc haut
 2  |  F  |  T  |  F   |   F   | Demi-bloc bas
 3  |  T  |  T  |  F   |   F   | Bloc horizontal
 4  |  F  |  F  |  T   |   F   | Demi-bloc gauche
 5  |  T  |  F  |  T   |   F   | Coin haut-gauche
 6  |  F  |  T  |  T   |   F   | Coin bas-gauche
 7  |  T  |  T  |  T   |   F   | Bloc 3-côtés (droite ouverte)
 8  |  F  |  F  |  F   |   T   | Demi-bloc droite
 9  |  T  |  F  |  F   |   T   | Escalier haut-droite
10  |  F  |  T  |  F   |   T   | Coin bas-droit
11  |  T  |  T  |  F   |   T   | Bloc 3-côtés (gauche ouverte)
12  |  F  |  F  |  T   |   T   | Bloc vertical
13  |  T  |  F  |  T   |   T   | Bloc 3-côtés (bas ouvert)
14  |  F  |  T  |  T   |   T   | Bloc 3-côtés (haut ouvert)
15  |  T  |  T  |  T   |   T   | Bloc plein (solid=true ancien)

T = True (solide)    F = False (vide)
```

## 🎛️ Interface de l'éditeur

### Section Propriétés - Avant
```
⚙️ Propriétés
☑️ Solide              ← Un seul bouton binaire
☑️ Mineable
  Ressource: [Pierre]
  Durabilité: 1
```

### Section Propriétés - Après
```
⚙️ Propriétés
  Bords solides:
  ☐ ⬆️ Haut          ☐ ⬇️ Bas
  ☐ ⬅️ Gauche        ☐ ➡️ Droite
  
☑️ Mineable
  Ressource: [Pierre]
  Durabilité: 1
```

**Grille interactive:**
```
┌─────────┬─────────┐
│ ⬆️ Haut │ ⬇️ Bas  │
├─────────┼─────────┤
│⬅️ Gauche│➡️ Droite│
└─────────┴─────────┘
```

## 🧮 Calcul de collision

```javascript
// Pseudocode simplifié
function movePlayer(dx, dy) {
    newX = player.x + dx;
    newY = player.y + dy;
    
    if (dx > 0) {
        // Mouvement à droite
        if (hasCollisionEdge(floor(newX)+1, floor(newY), 'left') ||
            hasCollisionEdge(floor(newX), floor(newY), 'right')) {
            return false;  // Collision!
        }
    }
    
    // Même logique pour les autres directions...
    
    player.x = newX;
    player.y = newY;
    return true;  // Succès
}
```

## 💡 Conseils de conception

### Pour créer des escaliers
```
[Escalier]
├─ solidEdges: { top: true, right: true }
│
[Escalier]
├─ solidEdges: { top: true, right: true }
│
[Plateforme]
└─ solidEdges: { top: true }
```

### Pour créer des pentes
```
Pente montante vers la droite:
[Pente] [Pente] [Pente]
├─ right: true
├─ left: true (sauf la première)
└─ top: true (optionnel)
```

### Pour des plateformes suspendues
```
[Plateforme]
└─ solidEdges: { top: true }
   (pas de collision bas, gauche, droite)
```

---

**Astuce:** Expérimentez avec différentes combinaisons pour créer des niveaux intéressants!
