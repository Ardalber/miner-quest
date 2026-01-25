# 🚀 Déploiement sur Hostinger

Ce dépôt est désormais prêt pour un hébergement statique sur Hostinger. Le script `npm run build:hostinger` prépare un paquet minimal (`dist/hostinger`) avec les pages, scripts, niveaux et une configuration `.htaccess` adaptée.

## Pré-requis
- Node.js 16+ installé en local
- Accès au gestionnaire de fichiers Hostinger **ou** FTP/SFTP pointant sur `public_html`

## Préparation du bundle
1. Dans le projet :
   ```bash
   npm install
   npm run build:hostinger
   ```
2. Vérifiez le contenu généré : `dist/hostinger/`
   - Toutes les pages `.html`
   - Dossiers `css/`, `js/`, `levels/`
   - Fichier `.htaccess` déjà configuré

## Déploiement via le gestionnaire de fichiers
1. Compressez le dossier `dist/hostinger` en `.zip` (optionnel mais plus rapide).
2. Dans Hostinger → Gestionnaire de fichiers → `public_html` :
   - Téléversez le `.zip` puis **Extraire**, ou
   - Glissez-déposez le contenu de `dist/hostinger` directement.
3. Vérifiez que `index.html` est bien à la racine de `public_html`.

## Déploiement via FTP/SFTP
1. Configurez FileZilla (ou équivalent) avec vos identifiants Hostinger.
2. Pointez la cible distante sur `public_html`.
3. Glissez-déposez tout le contenu de `dist/hostinger`.

## Vérifications après mise en ligne
- Ouvrez `https://votre-domaine/` → le jeu doit se charger.
- Si les assets ne se chargent pas, videz le cache : `Ctrl + F5` ou ajoutez `?cache-bust=1` à l’URL.
- Le fichier `.htaccess` applique :
  - Désactivation de l’indexation de dossiers
  - Cache long pour `js/css/images`, cache court pour `html/json`
  - Rewrite vers `index.html` pour les routes non trouvées (utile si vous ajoutez du routage côté client)

## Mises à jour
- Après modifications, relancez `npm run build:hostinger` puis republiez **uniquement** le contenu de `dist/hostinger`.

Bon déploiement !
