# Configuration pour déploiement Netlify + GitHub Actions

## 1. Configuration Netlify (automatique)

Le fichier `netlify.toml` à la racine configure automatiquement:
- ✅ Répertoire de publication: `.` (racine)
- ✅ Commande de build: Aucune (site statique)
- ✅ Cache des fichiers statiques
- ✅ Redirection SPA pour les routes HTML

**Rien à faire!** Netlify lira le fichier `netlify.toml` automatiquement.

## 2. Configuration GitHub (optionnel)

Pour déployer automatiquement depuis GitHub Actions vers Netlify:

### Étape 1: Créer les secrets GitHub

1. Allez sur votre repo GitHub
2. Settings → Secrets and variables → Actions
3. Créez deux secrets:

#### `NETLIFY_AUTH_TOKEN`
- Allez sur [Netlify](https://app.netlify.com)
- User settings → Applications → Personal access tokens
- Créez un nouveau token
- Collez-le comme `NETLIFY_AUTH_TOKEN`

#### `NETLIFY_SITE_ID`
- Dans Netlify, allez sur Site settings → General
- Copiez le "Site ID"
- Collez-le comme `NETLIFY_SITE_ID`

### Étape 2: Activer GitHub Actions

Les workflows sont déjà dans `.github/workflows/validate.yml`:
- Valide les fichiers HTML/JS/CSS
- Vérifie la configuration Netlify
- Déploie automatiquement sur Netlify (si secrets configurés)

## 3. Déploiement sans GitHub Actions (recommandé pour débuter)

**Méthode la plus simple:**

1. Connectez votre repo GitHub directement à Netlify
2. Cliquez "New site from Git"
3. Sélectionnez GitHub et le repo
4. Netlify lira automatiquement `netlify.toml`
5. À chaque push sur `main`, déploiement automatique!

✅ **C'est tout ce qu'il faut!**

## 4. Domaine personnalisé

Dans Netlify Dashboard:
- Site settings → Domain management
- Ajoutez votre domaine (ex: miner-quest.com)
- SSL/TLS gratuit avec Let's Encrypt

## 5. Variables d'environnement (pour plus tard)

Si vous avez besoin de variables d'environnement:

**Sur Netlify:**
1. Site settings → Build & deploy → Environment
2. Ajoutez les variables
3. Elles seront disponibles pendant le build

**Sur GitHub Actions:**
1. Settings → Secrets and variables → Actions
2. Ajoutez les secrets
3. Référencez-les dans le workflow: `${{ secrets.MA_VARIABLE }}`

## 6. Surveillance du déploiement

**Netlify Dashboard:**
- Deploys → Voir l'historique et les logs
- Cliquez sur un déploiement pour les détails

**GitHub:**
- Actions → Voir les workflows
- Cliquez sur un workflow pour les logs

## 7. Rollback (revert à une version antérieure)

**Dans Netlify:**
1. Deploys → Cliquez sur un ancien déploiement
2. "Publish deploy" pour le réactiver

**Ou via Git:**
```bash
git log --oneline  # Voir l'historique
git revert [commit-hash]  # Revert un commit spécifique
git push  # Redéployer automatiquement
```

---

**Configuration complète!** 🚀 Vous pouvez maintenant:
- ✅ Coder localement
- ✅ Pusher sur GitHub
- ✅ Netlify déploiera automatiquement
- ✅ Voir votre site en direct dans quelques secondes
