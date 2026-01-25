# 🎮 Miner Quest

Une aventure de minage en HTML5, CSS3 et JavaScript pur. Explorez des mines, collectez des ressources et créez vos propres niveaux!

## ✨ Caractéristiques

- **Gameplay addictif** : Minez des blocs, collectez des ressources et remplissez des quêtes
- **Éditeur de niveaux intégré** : Créez vos propres niveaux facilement
- **Système de coffres** : Stockez vos ressources collectées
- **Panneaux interactifs** : Laissez des messages dans les niveaux
- **Pas de dépendances** : Pur HTML5, CSS3 et JavaScript
- **Responsive** : Adapté aux différentes résolutions

## 🚀 Déploiement

### Hostinger (recommandé pour ce repo)

1. Préparer le bundle :
   ```bash
   npm install
   npm run build:hostinger
   ```
2. Uploadez le contenu de `dist/hostinger/` dans `public_html` (gestionnaire de fichiers ou FTP).
3. Le fichier `.htaccess` généré gère le cache et la réécriture vers `index.html`.

Consultez [DEPLOYMENT_HOSTINGER.md](./DEPLOYMENT_HOSTINGER.md) pour le pas-à-pas détaillé.

### Netlify

1. Fork/clone ce repository puis poussez sur GitHub :
   ```bash
   git clone https://github.com/votre-username/MINER-QUEST.git
   cd "MINER QUEST"
   git add . && git commit -m "Initial commit" && git push origin main
   ```
2. Sur [Netlify](https://app.netlify.com), créez "New site from Git" et sélectionnez le dépôt.
3. La configuration est automatique via `netlify.toml`.

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour plus de détails Netlify.

## 📁 Structure du projet

```
MINER QUEST/
├── index.html              ← Point d'entrée du jeu
├── editor.html             ← Éditeur de niveaux
├── tile_editor.html        ← Éditeur de tuiles
│
├── css/                    ← Feuilles de style
│   ├── game.css           ← Styles du jeu
│   ├── editor.css         ← Styles de l'éditeur
│   └── tile_editor.css    ← Styles de l'éditeur de tuiles
│
├── js/                     ← Scripts JavaScript
│   ├── game.js            ← Boucle de jeu principale
│   ├── player.js          ← Logique du joueur
│   ├── level.js           ← Gestion des niveaux
│   ├── tiles.js           ← Système de tuiles
│   ├── editor.js          ← Éditeur de niveaux
│   └── tile_editor.js     ← Éditeur de tuiles
│
├── levels/                 ← Niveaux JSON
│   ├── level_1.json       ← Niveau 1
│   └── level_2.json       ← Niveau 2
│
├── html/                   ← Pages HTML supplémentaires
│   └── DEBUG.html         ← Outils de débogage
│
├── docs/                   ← Documentation
│   ├── DEPLOYMENT.md      ← Guide de déploiement
│   └── ...
│
├── netlify.toml           ← Configuration Netlify
├── .gitignore             ← Fichiers à ignorer Git
└── package.json           ← Métadonnées du projet
```

## 🎮 Comment jouer

### Contrôles
- **Z** : Aller vers le haut
- **S** : Aller vers le bas
- **Q** : Aller vers la gauche
- **D** : Aller vers la droite
- **ESPACE** : Miner un bloc

### Objectifs
1. Explorez les mines
2. Collectez des ressources (pierre, fer, or)
3. Remplissez votre inventaire
4. Déposez les ressources dans les coffres

## 🛠️ Développement local

### Lancer le serveur de développement

**Avec Python :**
```bash
python -m http.server 8000
```
Puis visitez `http://localhost:8000`

**Avec Node.js :**
```bash
npx http-server
```

**Bundle Hostinger localement :**
```bash
npm run build:hostinger
# Résultat dans dist/hostinger
```

**Avec PHP :**
```bash
php -S localhost:8000
```

### Utiliser l'éditeur de niveaux

1. Lancez le jeu
2. Cliquez sur le bouton "✏️ Éditeur" en haut à droite
3. Créez votre niveau
4. Sauvegardez-le en JSON
5. Chargez-le dans le jeu

## 📦 Format des niveaux

Les niveaux sont stockés en JSON avec la structure suivante:

```json
{
  "width": 16,
  "height": 16,
  "foreground": [...],
  "background": [...],
  "entities": [...]
}
```

- **width/height** : Dimensions de la grille
- **foreground** : Tuiles du dessus (visibles, minables)
- **background** : Tuiles du dessous (minables après le dessus)
- **entities** : Coffres, panneaux, spawn du joueur

## 🎨 Tuiles disponibles

| ID | Nom | Minnable | Description |
|----|-----|----------|-------------|
| 0 | Vide | Non | Espace vide |
| 1 | Terre | Oui | Bloc de terre |
| 2 | Pierre | Oui | Bloc de pierre (ressource) |
| 3 | Fer | Oui | Minerai de fer (ressource) |
| 4 | Or | Oui | Minerai d'or (ressource) |
| 5+ | Autres | Voir éditeur | Nouveaux types |

## 🐛 Débogage

Outils disponibles:
- Console navigateur (F12) pour les logs JavaScript
- Badge "🧪 TEST" affichable pour voir les infos de débogage
- Fichier [DEBUG.html](./html/DEBUG.html) pour les tests

## 🤝 Contribution

Les contributions sont bienvenues!

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 License

Ce projet est sous license MIT. Voir [LICENSE](./LICENSE) pour plus de détails.

## 📞 Support

Des questions? Des bugs? Ouvrez une [Issue](https://github.com/votre-username/MINER-QUEST/issues)!

---

**Amusez-vous bien à explorer les mines!** ⛏️
