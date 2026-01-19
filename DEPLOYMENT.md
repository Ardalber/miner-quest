# 🚀 Guide de déploiement sur Netlify

## Configuration automatique via GitHub

### Étapes pour déployer sur Netlify :

1. **Poussez votre code sur GitHub**
   ```bash
   git add .
   git commit -m "Préparation pour Netlify"
   git push origin main
   ```

2. **Connectez votre repo GitHub à Netlify**
   - Allez sur [Netlify](https://app.netlify.com)
   - Cliquez sur "New site from Git"
   - Sélectionnez GitHub et autorisez l'accès
   - Sélectionnez le repo `MINER QUEST`

3. **Configuration automatique**
   - **Build command** : `echo 'No build required'` (ou laissez vide)
   - **Publish directory** : `.` (racine du projet)
   - **Netlify.toml** : Déjà configuré dans le projet ✅

4. **Déploiement automatique**
   - À chaque push sur `main`, Netlify déploiera automatiquement
   - Consultez l'onglet "Deploys" pour voir le statut

## Structure du projet

```
MINER QUEST/
├── index.html                 ← Point d'entrée principal
├── css/                       ← Feuilles de style
│   ├── game.css
│   ├── editor.css
│   └── tile_editor.css
├── js/                        ← Scripts JavaScript
│   ├── game.js
│   ├── player.js
│   ├── level.js
│   ├── tiles.js
│   ├── editor.js
│   └── tile_editor.js
├── levels/                    ← Niveaux JSON
│   ├── level_1.json
│   └── level_2.json
├── html/                      ← Pages supplémentaires
│   ├── editor.html
│   ├── tile_editor.html
│   └── DEBUG.html
├── netlify.toml               ← Configuration Netlify
├── .gitignore                 ← Fichiers à ignorer
└── docs/                      ← Documentation
```

## Points importants

✅ **Statique** : Ce projet est un site statique (pas de serveur Node.js nécessaire)
✅ **Pas de build** : Les fichiers sont servis directement
✅ **Cache optimisé** : Les fichiers statiques sont cachés 7 jours
✅ **HTML réécrit** : Les URLs rewritten vers index.html (pour SPA si besoin)

## Dépannage

### Le site ne charge pas correctement
- Vérifiez les chemins relatifs (doivent commencer par `/` ou être relatifs)
- Vérifiez les logs dans Netlify → Deploys → Logs

### Les niveaux ne se chargent pas
- Les fichiers JSON doivent être dans le dossier `/levels/`
- Vérifiez que les appels AJAX utilisent des chemins relatifs corrects

### Problèmes de cache
- Visitez : `https://votre-site.netlify.app/?cache=bust`
- Ou attendez 1h que le cache expire

## Domaine personnalisé

1. Dans Netlify, allez dans **Domain settings**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour les enregistrements DNS
4. Le SSL/TLS est automatique avec Let's Encrypt

## Variables d'environnement (si nécessaire dans le futur)

1. Dans Netlify → Site settings → Build & deploy → Environment
2. Ajoutez vos variables (ex : API_URL, etc.)
3. Accédez-les via `process.env` ou locales de Netlify

---

**Votre site sera en direct dans quelques secondes après le push!** 🎉
