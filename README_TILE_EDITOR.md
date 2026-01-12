# 🎨 Éditeur de Tuiles - README

## 🎯 Vue d'ensemble

Bienvenue dans l'éditeur de tuiles de **Miner Quest**! 

Ce système complet vous permet de créer, gérer et utiliser des tuiles personnalisées dans votre jeu. Les tuiles créées sont automatiquement intégrées dans l'éditeur de niveaux et disponibles pour construire vos propres mondes.

---

## 🚀 Démarrage rapide

### Accéder à l'éditeur

**Depuis le jeu :**
1. Lancez `index.html`
2. Cliquez sur le bouton **🎨 Tuiles** (en haut à droite)
3. L'éditeur de tuiles s'ouvre

**Depuis l'éditeur de niveaux :**
1. Lancez `editor.html`
2. Cliquez sur le bouton **🎨 Tuiles** (dans la barre d'outils)
3. L'éditeur de tuiles s'ouvre

### Créer votre première tuile

1. **Entrez un nom** (ex: "Marbre blanc")
2. **Choisissez une couleur** (sélecteur couleur)
3. **Configurez les propriétés** :
   - Solide ? (bloque le joueur)
   - Mineable ? (peut être mié)
   - Interactive ? (peut être activée)
4. **Cliquez "✅ Ajouter à la liste"**

✨ Votre tuile est créée et prête à l'emploi!

---

## 📂 Structure des fichiers

```
MINER QUEST/
├── tile_editor.html          # Interface de l'éditeur
├── css/
│   └── tile_editor.css       # Styles de l'éditeur
├── js/
│   └── tile_editor.js        # Logique JavaScript
├── GUIDE_TILE_EDITOR.md      # Guide complet utilisateur
├── INSTALLATION_TILE_EDITOR.md
├── MODIFICATIONS_TILE_EDITOR.md
└── TEST_TILE_EDITOR.html     # Fichier de test
```

---

## 🎨 Création de tuiles

### Propriétés disponibles

| Propriété | Description | Exemple |
|-----------|-------------|---------|
| **Nom** | Identifiant unique | "Granit noir" |
| **Couleur** | Teinte principale | #404040 |
| **Fond** | Teinte secondaire (optionnel) | #202020 |
| **Solide** | Bloque le joueur | ✓ Oui |
| **Mineable** | Peut être mié | ✓ Oui |
| **Ressource** | Type collecté en minant | "stone" |
| **Durabilité** | Coups pour miner (1-10) | 3 |
| **Interactive** | Peut être activée | ✗ Non |

### Icônes automatiques

Le système génère automatiquement une icône basée sur le nom :
- "Marbre" → 🔷
- "Diamant" → 💎
- "Emeraude" → 💚
- "Cristal" → ✨
- Et bien d'autres...

---

## 💾 Sauvegarde et synchronisation

### Où sont stockées les tuiles?
- **localStorage** du navigateur
- **Persistent** après fermeture
- **Synchronisée** entre jeu et éditeur

### Structure de données
```javascript
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
    "interactive": false,
    "isCustom": true,
    "createdAt": "2024-01-12T10:30:00Z"
  }
}
```

---

## 🎮 Utilisation dans l'éditeur de niveaux

Après avoir créé une tuile :

1. **Ouvrez l'éditeur** (`editor.html`)
2. **Regardez la palette à gauche** - votre tuile y est!
3. **Elle a un cadre vert** pour la distinguer des tuiles de base
4. **Cliquez dessus** pour la sélectionner
5. **Cliquez sur la grille** pour la placer

---

## 🔧 Gestion des tuiles

### Afficher les détails
- Cliquez sur une tuile dans la liste
- Un aperçu modal s'affiche avec toutes les propriétés

### Filtrer les tuiles
- **Toutes** : Tuiles de base + personnalisées
- **Défaut** : Tuiles du jeu original
- **Personnalisées** : Vos créations uniquement

### Supprimer une tuile
1. Survolez une tuile "PERSO"
2. Cliquez le bouton ✕
3. Confirmez la suppression

⚠️ **Attention** : La suppression est définitive!

---

## 🎨 Bonnes pratiques

### Design cohérent
- Restez dans la palette de couleurs du jeu
- Utilisez des dégradés pour plus de détails
- Testez les tuiles dans l'éditeur

### Organisation
- Donnez des noms descriptifs
- Groupez les tuiles similaires
- Documentez vos créations

### Performance
- Limitez-vous à 100-200 tuiles personnalisées
- Supprimez les tuiles inutilisées
- Exportez régulièrement vos niveaux

---

## ❓ FAQ

**Q: Je ne vois pas le bouton "Tuiles"?**
A: Assurez-vous que tile_editor.js est chargé. Vérifiez la console (F12) pour les erreurs.

**Q: Mes tuiles disparaissent!**
A: Elles sont stockées dans localStorage. Si le cache est vidé, les données sont perdues.

**Q: Puis-je modifier une tuile?**
A: Actuellement non. Créez une nouvelle version et supprimez l'ancienne.

**Q: Combien de tuiles puis-je créer?**
A: Théoriquement illimité (limité par localStorage ~5-10MB).

**Q: Comment partager mes tuiles?**
A: Exportez vos niveaux (qui contiennent les tuiles) ou copiez les données localStorage.

---

## 🐛 Dépannage

### Tuiles ne s'affichent pas
```javascript
// Dans la console (F12), testez:
console.log(customTileManager.getAllTiles());
```

### Erreur de chargement
1. Vérifiez que tous les fichiers existent
2. Vérifiez l'ordre de chargement (tiles.js → tile_editor.js → autres)
3. Videz le cache du navigateur (Ctrl+Shift+Suppr)

### localStorage plein
1. Supprimez les tuiles inutilisées
2. Videz les niveaux non utilisés
3. Changez de navigateur si nécessaire

---

## 📚 Documentation complète

- [GUIDE_TILE_EDITOR.md](GUIDE_TILE_EDITOR.md) - Guide détaillé
- [INSTALLATION_TILE_EDITOR.md](INSTALLATION_TILE_EDITOR.md) - Instructions techniques
- [MODIFICATIONS_TILE_EDITOR.md](MODIFICATIONS_TILE_EDITOR.md) - Détail des changes
- [TEST_TILE_EDITOR.html](TEST_TILE_EDITOR.html) - Page de test

---

## 🔄 Workflow complet

```
┌─────────────────────┐
│   Démarrer le jeu   │
└──────────┬──────────┘
           ↓
    ┌─────────────┐
    │ 🎨 Tuiles   │
    └──────┬──────┘
           ↓
  ┌──────────────────┐
  │  Créer tuile     │
  │ - Nom            │
  │ - Couleurs       │
  │ - Propriétés     │
  └────────┬─────────┘
           ↓
    ┌─────────────┐
    │ ✅ Ajouter  │
    └──────┬──────┘
           ↓
  ┌──────────────────┐
  │ Tuile créée!     │
  │ - localStorage   │
  │ - TileConfig     │
  │ - Palette éditeur│
  └────────┬─────────┘
           ↓
  ┌──────────────────┐
  │ Ouvrir éditeur   │
  │ Utiliser tuile   │
  │ Placer sur canvas│
  └──────────────────┘
```

---

## ✨ Fonctionnalités

- ✅ Création intuitive de tuiles
- ✅ Gestion complète (créer, voir, supprimer)
- ✅ Sauvegarde automatique
- ✅ Intégration transparente dans l'éditeur
- ✅ Navigation intelligente
- ✅ Interface responsive
- ✅ Icônes générées automatiquement
- ✅ Filtrage et recherche
- ✅ Aperçu détaillé
- ✅ Validation des données

---

## 🚀 Prochaines étapes

1. **Créez votre première tuile** - "Marbre blanc"
2. **Testez dans l'éditeur** - Placez-la sur une grille
3. **Expérimentez** - Créez d'autres tuiles
4. **Construisez un niveau** - Utilisez vos tuiles personnalisées
5. **Partagez** - Exportez votre création

---

## 📞 Support

Consultez les fichiers de documentation :
- **Questions** → GUIDE_TILE_EDITOR.md
- **Problèmes techniques** → INSTALLATION_TILE_EDITOR.md
- **Détails d'implémentation** → MODIFICATIONS_TILE_EDITOR.md

---

**Bon design de tuiles! 🎨✨**

Créé le: 12 janvier 2026
