# 🎨 Éditeur de Tuiles - Guide Complet

## 📋 Vue d'ensemble

L'éditeur de tuiles vous permet de créer et gérer vos tuiles personnalisées pour le jeu Miner Quest. Vous pouvez :

- ✨ Créer de nouvelles tuiles avec des propriétés personnalisées
- 🎨 Choisir les couleurs et les détails visuels
- ⛏️ Configurer si la tuile est mineable ou solide
- 📦 Ajouter des ressources et des durabilités
- 🗑️ Supprimer les tuiles que vous n'aimez plus
- 🔄 Utiliser vos tuiles dans l'éditeur de niveaux et le jeu

---

## 🚀 Comment accéder à l'éditeur de tuiles

### Depuis le jeu principal (index.html)
1. Cliquez sur le bouton **🎨 Tuiles** en haut à droite (à côté du bouton Éditeur)
2. L'éditeur de tuiles s'ouvrira dans une nouvelle page

### Depuis l'éditeur de niveaux (editor.html)
1. Dans la barre d'outils supérieure, cliquez sur **🎨 Tuiles**
2. Vous serez dirigé vers l'éditeur de tuiles

---

## ✏️ Créer une nouvelle tuile

### Étape 1 : Remplir les informations de base

1. **Nom de la tuile** : Entrez un nom unique (Ex: Marbre, Granit, Diamant)
   - Maximum 20 caractères
   - Sera utilisé pour identifier la tuile

2. **Couleur** : Cliquez sur le sélecteur de couleur pour choisir la teinte principale
   - La couleur s'affiche instantanément dans l'aperçu

3. **Couleur de fond (optionnel)** : Choisissez une deuxième couleur pour créer un dégradé
   - Si la même que la couleur principale, aucun dégradé ne sera appliqué

### Étape 2 : Configurer les propriétés

**Tuile solide** ✅
- Cochez cette case si la tuile bloque le joueur
- Exemples : Mur, Pierre, Arbre

**Tuile mineable** ⛏️
- Cochez cette case si le joueur peut miner cette tuile
- Déverrouille les options suivantes :
  - **Type de ressource** : Choisissez ce que le joueur obtient en minant
    - Pierre, Fer, Or (pré-configurés)
    - Personnalisée (pour créer une nouvelle ressource)
  - **Durabilité** : Nombre de coups nécessaires pour miner (1-10)

**Tuile interactive** 🖱️
- Cochez cette case si la tuile peut être interagie (Ex: Coffre, Panneau)

### Étape 3 : Aperçu et ajout

1. **Cliquez sur "👁️ Aperçu"** pour voir un rendu plus grand de votre tuile
2. Vérifiez que tout vous plaît
3. **Cliquez sur "✅ Ajouter à la liste"** pour sauvegarder votre tuile

✅ La tuile sera automatiquement :
- Sauvegardée dans le localStorage
- Ajoutée à votre liste de tuiles personnalisées
- Disponible dans la palette de l'éditeur de niveaux

---

## 📋 Gérer vos tuiles

### Voir toutes vos tuiles

La section de droite affiche toutes les tuiles disponibles :

**Filtres** 🔍
- **Toutes** : Affiche les tuiles par défaut + personnalisées
- **Défaut** : Affiche uniquement les tuiles de base du jeu
- **Personnalisées** : Affiche uniquement vos tuiles créées

### Informations sur une tuile

Cliquez sur une tuile pour voir ses propriétés dans un aperçu :
- Nom et couleur
- Type (solide, mineable, interactive)
- Ressource associée et durabilité

### Supprimer une tuile

1. Survolez une tuile personnalisée (avec le badge "PERSO")
2. Cliquez sur le bouton ✕ qui apparaît
3. Confirmez la suppression

⚠️ **Attention** : Suppression permanente ! Cette action ne peut pas être annulée.

---

## 🎮 Utiliser vos tuiles

Une fois que vous avez créé une tuile :

### Dans l'éditeur de niveaux
1. La tuile apparaît automatiquement dans la **Palette de Tuiles** à gauche
2. Elle est identifiée par un cadre **vert** (couleur personnalisée)
3. Sélectionnez-la et cliquez sur le canvas pour la placer

### Dans les niveaux sauvegardés
1. Vos tuiles sont sauvegardées dans `localStorage`
2. Elles seront disponibles dans tous vos niveaux
3. Lors du chargement d'un niveau, vos tuiles personnalisées se chargeront automatiquement

---

## 💾 Sauvegarde et synchronisation

### Où sont stockées vos tuiles?
- **Stockage local** : Dans le localStorage de votre navigateur
- **Persistent** : Vos tuiles restent même si vous fermez le navigateur
- **Synchronisation** : Changements instantanés entre le jeu et l'éditeur

### Backup recommandé
- Exportez régulièrement vos niveaux (qui contiennent vos tuiles)
- Si vous changez de navigateur/ordinateur, vous devrez recréer vos tuiles personnalisées

---

## 🎨 Conseils de design

### Bonnes pratiques

1. **Noms clairs** : Utilisez des noms descriptifs (Marbre blanc, Obsidienne noire)
2. **Couleurs contrastées** : Utilisez des dégradés pour plus de détails
3. **Cohérence** : Essayez de rester dans la même palette que le jeu
4. **Tests** : Testez vos tuiles dans l'éditeur avant de créer un niveau complet

### Exemples de couleurs recommandées

| Matériau | Couleur | Dégradé |
|----------|---------|--------|
| Marbre | #E0E0E0 | #A0A0A0 |
| Granite | #404040 | #202020 |
| Diamant | #00BFFF | #0080FF |
| Émeraude | #50C878 | #228B22 |
| Rubis | #E0115F | #8B0000 |

---

## ❓ FAQ

**Q: Puis-je modifier une tuile existante?**
A: Actuellement non, mais vous pouvez en créer une nouvelle version et supprimer l'ancienne.

**Q: Que se passe-t-il si je supprime une tuile utilisée dans un niveau?**
A: La tuile apparaîtra comme "vide" dans le niveau. Vous devez recréer la tuile ou remplacer manuellement les tuiles.

**Q: Combien de tuiles personnalisées puis-je créer?**
A: Théoriquement illimité! Limité seulement par la capacité du localStorage (~5-10MB).

**Q: Comment partager mes tuiles avec un ami?**
A: Exportez votre niveau (qui contient les tuiles) ou copiez les données du localStorage.

**Q: Mes tuiles personnalisées disparaissent!**
A: Cela peut arriver si vous videz le cache/localStorage du navigateur. Utilisez l'option "Ne pas effacer les données de site" lors du nettoyage.

---

## 🔧 Spécifications techniques

### Propriétés des tuiles

```javascript
{
    id: 100,                      // ID unique (>= 100 pour personnalisées)
    name: "Marbre",               // Nom affiché
    color: "#E0E0E0",             // Couleur principale (hex)
    backgroundColor: "#A0A0A0",   // Couleur de fond (hex)
    solid: true,                  // Bloque le joueur
    minable: true,                // Peut être miné
    resource: "stone",            // Type de ressource
    durability: 2,                // Coups pour miner
    interactive: false,           // Peut être interagi
    isCustom: true,               // Est une tuile personnalisée
    createdAt: "2024-01-12..."    // Date de création (ISO)
}
```

---

Bon design de tuiles! 🎨✨
