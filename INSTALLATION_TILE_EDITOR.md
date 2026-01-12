# 🎨 Éditeur de Tuiles - Installation et Test

## ✅ Fichiers créés

L'éditeur de tuiles comprend les fichiers suivants :

### Fichiers HTML
- **tile_editor.html** : Interface complète de l'éditeur de tuiles

### Fichiers JavaScript
- **js/tile_editor.js** : Logique principale de l'éditeur
  - Gestion des tuiles personnalisées
  - Sauvegarde/chargement depuis localStorage
  - Création et suppression de tuiles

### Fichiers CSS
- **css/tile_editor.css** : Styles complets de l'éditeur
  - Design sombre cohérent avec le jeu
  - Animations et interactions
  - Responsive design

## 🔧 Intégrations effectuées

### Dans editor.html
✅ Ajout du bouton "🎨 Tuiles" dans la barre d'outils

### Dans editor.js
✅ Événement pour ouvrir tile_editor.html
✅ Mise à jour de createTilePalette() pour afficher les tuiles personnalisées
✅ Styles CSS pour les tuiles personnalisées (border verte)

### Dans index.html (jeu)
✅ Ajout du bouton "🎨 Tuiles" à côté du bouton Éditeur
✅ CSS pour positionner les deux boutons

### Dans game.js
✅ Événement pour ouvrir tile_editor.html depuis le jeu
✅ sessionStorage pour tracker l'origine (jeu ou éditeur)

### Chargement dans tous les fichiers
✅ tile_editor.js chargé dans:
  - editor.html (avant editor.js)
  - index.html (avant game.js)
  - tile_editor.html

## 🚀 Comment utiliser

### 1. Accès à l'éditeur de tuiles

**Depuis le jeu:**
```
Cliquez sur 🎨 Tuiles en haut à droite
```

**Depuis l'éditeur de niveaux:**
```
Cliquez sur 🎨 Tuiles dans la barre d'outils
```

### 2. Créer une tuile

1. Remplissez le formulaire à gauche:
   - Nom (ex: "Marbre")
   - Couleur (sélecteur)
   - Propriétés (solide, mineable, interactive)

2. Cliquez sur "✅ Ajouter à la liste"

3. La tuile apparaîtra:
   - Dans la liste à droite avec le badge "PERSO"
   - Dans la palette de l'éditeur de niveaux
   - Disponible immédiatement

### 3. Utiliser dans l'éditeur

1. Ouvrez l'éditeur de niveaux
2. Votre tuile personnalisée apparaît dans la palette à gauche
3. Cliquez dessus pour la sélectionner
4. Placez-la sur le canvas

### 4. Gérer les tuiles

- **Aperçu** : Cliquez sur une tuile pour voir ses détails
- **Supprimer** : Survolez une tuile "PERSO" et cliquez le ✕
- **Filtrer** : Utilisez les onglets (Toutes/Défaut/Personnalisées)

## 🎨 Exemple de tuile à créer

```
Nom: Marbre blanc
Couleur: #E0E0E0
Fond: #A0A0A0
Solide: ✓ Oui
Mineable: ✓ Oui
Ressource: stone
Durabilité: 2
Interactive: ✗ Non
```

## 💾 Stockage des données

Les tuiles sont sauvegardées dans **localStorage** sous la clé `customTiles`:

```javascript
// Structure stockée
{
  "100": {
    "id": 100,
    "name": "Marbre blanc",
    "color": "#E0E0E0",
    "backgroundColor": "#A0A0A0",
    "solid": true,
    "minable": true,
    "resource": "stone",
    "durability": 2,
    "isCustom": true,
    "createdAt": "2024-01-12T10:30:00.000Z"
  }
}
```

## 🔍 Vérification de l'installation

Ouvrez la console du navigateur (F12) et testez:

```javascript
// Voir les tuiles personnalisées
console.log(customTileManager.getAllTiles());

// Ajouter une tuile manuellement (test)
customTileManager.addTile({
  name: "Test",
  color: "#FF0000",
  solid: true
});

// Voir le TileConfig mis à jour
console.log(TileConfig);
```

## 📝 Notes importantes

### Sauvegarde
- ✅ Automatique dans localStorage
- ⚠️ Les données persistent jusqu'à vidage du cache

### Compatibilité
- Chrome/Edge/Firefox (localStorage requis)
- Pas de serveur nécessaire
- Fonctionne hors ligne

### Limitations actuelles
- ❌ Pas d'export/import de tuiles (yet)
- ❌ Pas d'édition de tuiles existantes
- ⚠️ Les tuiles supprimées ne reviennent pas automatiquement dans les niveaux

## 🐛 Troubleshooting

**Les tuiles ne s'affichent pas dans la palette?**
→ Vérifiez que tile_editor.js est chargé avant editor.js

**Les tuiles disparaissent après fermeture?**
→ Vérifiez que localStorage est activé et pas plein

**Le bouton "Tuiles" ne fonctionne pas?**
→ Assurez-vous que tile_editor.html existe et est au bon endroit

---

Bon développement! 🎨
