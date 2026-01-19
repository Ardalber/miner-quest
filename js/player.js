// Classe pour gérer le joueur
class Player {
    constructor() {
        this.x = 8;
        this.y = 8;
        this.tileSize = 32;
        this.color = '#ff6b6b';
        
        // Animation de pioche
        this.isMining = false;
        this.miningProgress = 0;
        this.miningTarget = { x: 0, y: 0 };
        this.pickaxeAngle = 0;
        this.miningHits = 0; // Nombre de coups donnés
        this.requiredHits = 1; // Nombre de coups nécessaires
        this.miningLayer = 'foreground'; // Quelle couche on est en train de miner ('foreground' ou 'background')
        
        // Inventaire
        this.inventory = {
            stone: 0,
            iron: 0,
            gold: 0
        };
        
        // Direction pour l'animation
        this.direction = 'down'; // up, down, left, right
        
        // Proprietés platformer
        this.velocityY = 0;        this.velocityX = 0; // Vitesse horizontale pour mouvement fluide        this.isJumping = false;
        this.isGrounded = false;
        this.jumpSpeed = -0.33; // Vitesse de saut pour 2.2 cases de haut (V = -sqrt(2*g*h))
        this.gravity = 0.025; // Force de gravité
        this.height = 1; // Hauteur en tuiles
    }

    // Déplacer le joueur
    move(dx, dy, levelManager) {
        // Vérifier le type de niveau
        const isPlatformer = levelManager.currentLevel?.type === 'platformer';
        
        if (isPlatformer) {
            // Mode platformer : seulement mouvement horizontal
            const newX = this.x + dx;
            
            // Mettre à jour la direction
            if (dx > 0) this.direction = 'right';
            else if (dx < 0) this.direction = 'left';
            
            // Tester la collision avec la vraie position Y (pas une position entière)
            // checkCollisionDirectional() calculera les bonnes tuiles occupées
            const canMove = !this.checkCollisionDirectional(newX, this.y, dx, 0, levelManager);
            
            if (canMove) {
                this.x = newX;
                
                // Vérifier si on marche sur un warp
                if (levelManager.isWarp(newX, Math.floor(this.y))) {
                    const targetLevel = levelManager.getWarpDestination(newX, Math.floor(this.y));
                    if (targetLevel && window.onWarpActivated) {
                        window.onWarpActivated(targetLevel);
                    }
                }
                
                return true;
            }
            return false;
        } else {
            // Mode top-down : mouvement dans toutes les directions
            const newX = this.x + dx;
            const newY = this.y + dy;

            // Mettre à jour la direction TOUJOURS, même si bloqué
            if (dx > 0) this.direction = 'right';
            else if (dx < 0) this.direction = 'left';
            else if (dy > 0) this.direction = 'down';
            else if (dy < 0) this.direction = 'up';

            // Vérifier si la position est valide en testant la collision dans la direction du mouvement
            if (!this.checkCollisionDirectional(newX, newY, dx, dy, levelManager)) {
                this.x = newX;
                this.y = newY;
                
                // Vérifier si on marche sur un warp
                if (levelManager.isWarp(newX, newY)) {
                    const targetLevel = levelManager.getWarpDestination(newX, newY);
                    if (targetLevel && window.onWarpActivated) {
                        window.onWarpActivated(targetLevel);
                    }
                }
                
                return true;
            }
            return false;
        }
    }
    
    // Vérifier la collision selon la direction du mouvement
    // x, y sont la NOUVELLE position après mouvement
    // dx, dy indiquent la direction du mouvement
    checkCollisionDirectional(x, y, dx, dy, levelManager) {
        // Le joueur occupe [x, x+1) x [y, y+1) à la nouvelle position
        
        // Calculer les tuiles que le joueur va occuper
        const minTileX = Math.floor(x);
        const maxTileX = Math.floor(x + 0.999);
        const minTileY = Math.floor(y);
        const maxTileY = Math.floor(y + 0.999);
        
        // console.log(`🔍 Check collision: newPos=(${x.toFixed(2)}, ${y.toFixed(2)}), dir=(${dx},${dy}), tiles X:[${minTileX},${maxTileX}], Y:[${minTileY},${maxTileY}]`);
        
        if (dx > 0) {
            // Mouvement à droite : tester le bord GAUCHE des tuiles qu'on occupe
            for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
                if (levelManager.hasCollisionEdge(maxTileX, tileY, 'left')) {
                    console.log(`🚫 Collision DROITE bloquée: tuile[${maxTileX},${tileY}] bord left`);
                    return true;
                }
            }
        }
        
        if (dx < 0) {
            // Mouvement à gauche : tester le bord DROIT des tuiles qu'on occupe
            for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
                if (levelManager.hasCollisionEdge(minTileX, tileY, 'right')) {
                    console.log(`🚫 Collision GAUCHE bloquée: tuile[${minTileX},${tileY}] bord right`);
                    return true;
                }
            }
        }
        
        if (dy > 0) {
            // Mouvement en bas : tester le bord HAUT des tuiles qu'on occupe
            for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
                if (levelManager.hasCollisionEdge(tileX, maxTileY, 'top')) {
                    console.log(`🚫 Collision BAS bloquée: tuile[${tileX},${maxTileY}] bord top`);
                    return true;
                }
            }
        }
        
        if (dy < 0) {
            // Mouvement en haut : tester le bord BAS des tuiles qu'on occupe
            for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
                if (levelManager.hasCollisionEdge(tileX, minTileY, 'bottom')) {
                    console.log(`🚫 Collision HAUT bloquée: tuile[${tileX},${minTileY}] bord bottom`);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Sauter (mode platformer uniquement)
    jump(levelManager) {
        const isPlatformer = levelManager.currentLevel?.type === 'platformer';
        if (isPlatformer && this.isGrounded && !this.isJumping) {
            this.velocityY = this.jumpSpeed;
            this.isJumping = true;
            this.isGrounded = false;
        }
    }
    
    // Appliquer la physique platformer
    applyPlatformerPhysics(deltaTime, levelManager) {
        const isPlatformer = levelManager.currentLevel?.type === 'platformer';
        if (!isPlatformer) return;
        
        // Appliquer la gravité
        this.velocityY += this.gravity;
        
        // Limiter la vitesse de chute
        if (this.velocityY > 1) this.velocityY = 1;
        
        // Calculer la nouvelle position Y
        const newY = this.y + this.velocityY;
        
        // Vérifier collision vers le bas (pied du personnage)
        const footY = Math.floor(newY);
        const headY = Math.floor(newY) - 1;
        
        if (this.velocityY > 0) {
            // Descente : vérifier collision au sol
            if (this.checkCollisionDirectional(this.x, newY, 0, 1, levelManager)) {
                // Il y a un sol sous les pieds
                this.y = footY;
                this.velocityY = 0;
                this.isGrounded = true;
                this.isJumping = false;
            } else {
                // Pas de sol : continuer à tomber
                this.y = newY;
                this.isGrounded = false;
            }
        } else if (this.velocityY < 0) {
            // Montée : vérifier collision avec le plafond
            if (this.checkCollisionDirectional(this.x, newY, 0, -1, levelManager)) {
                // Il y a un plafond
                this.velocityY = 0;
                this.y = Math.ceil(this.y);
            } else {
                // Pas de plafond : continuer à monter
                this.y = newY;
            }
        }
    }

    // Commencer à miner
    startMining(levelManager) {
        if (this.isMining) return;

        const isPlatformer = levelManager.currentLevel?.type === 'platformer';
        
        // Déterminer la case ciblée selon la direction
        let targetX = Math.floor(this.x);
        let targetY = Math.floor(this.y);

        if (isPlatformer) {
            // En mode platformer : seulement gauche, droite ou bas
            switch (this.direction) {
                case 'left': targetX--; break;
                case 'right': targetX++; break;
                case 'down': targetY++; break; // Vers le bas
                default: 
                    // Par défaut, miner devant selon la direction actuelle
                    if (this.direction === 'left') targetX--;
                    else targetX++; // right par défaut
            }
        } else {
            // En mode top-down : toutes les directions
            switch (this.direction) {
                case 'up': targetY--; break;
                case 'down': targetY++; break;
                case 'left': targetX--; break;
                case 'right': targetX++; break;
            }
        }

        // PRIORITÉ 1: Vérifier la couche DESSUS (backgroundTiles) - VISIBLE ET MINABLE
        const bgTileType = levelManager.getBackgroundTile(targetX, targetY);
        const bgTileConfig = TileConfig[bgTileType];
        
        console.log('🔍 START MINING - Background Layer Check:', {
            targetX, targetY,
            bgTileType,
            bgTileConfigExists: !!bgTileConfig,
            bgTileConfigName: bgTileConfig?.name,
            bgTileConfigMinable: bgTileConfig?.minable,
            TileConfigKeys: Object.keys(TileConfig).filter(k => !isNaN(k)).sort((a,b) => a-b).join(',')
        });
        
        // Si la couche Dessus est mineable, on l'utilise
        if (bgTileConfig && bgTileConfig.minable && bgTileType !== 0) {
            const durability = bgTileConfig.durability || 1;
            
            console.log('✅ Mining Background Layer!', {
                bgTileType,
                bgTileName: bgTileConfig.name,
                durability
            });
            
            this.isMining = true;
            this.miningProgress = 0;
            this.miningTarget = { x: targetX, y: targetY };
            this.pickaxeAngle = 0;
            this.miningHits = 0;
            this.requiredHits = durability;
            this.miningTileType = bgTileType;
            this.miningLayer = 'background'; // Mémoriser quelle couche on mine
            return;
        }
        
        // PRIORITÉ 2: Sinon, vérifier la couche DESSOUS (tiles - foreground)
        const tileType = levelManager.getTile(targetX, targetY);
        const tileConfig = TileConfig[tileType];
        
        // DEBUG: Log pour comprendre ce qui se passe
        console.log('🔍 DEBUG Mining:', {
            targetPos: { x: targetX, y: targetY },
            bgTileType: bgTileType,
            bgTileName: bgTileConfig?.name,
            tileType: tileType,
            tileName: tileConfig?.name,
            isChest: levelManager.isChest(targetX, targetY),
            isInteractive: levelManager.isInteractive(targetX, targetY),
            isMinable: levelManager.isMinable(targetX, targetY),
            isWarp: levelManager.isWarp(targetX, targetY)
        });

        // Vérifier si c'est un coffre (couche Dessous)
        if (levelManager.isChest(targetX, targetY)) {
            this.openChest(targetX, targetY, levelManager);
            return;
        }

        // Vérifier si c'est un panneau (couche Dessous)
        if (levelManager.isSign(targetX, targetY)) {
            this.openSign(targetX, targetY, levelManager);
            return;
        }

        // Vérifier si c'est un warp (couche Dessous)
        if (levelManager.isWarp(targetX, targetY)) {
            this.triggerWarp(targetX, targetY, levelManager);
            return;
        }

        // Vérifier si la case est interactive (couche Dessous)
        if (levelManager.isInteractive(targetX, targetY)) {
            const message = levelManager.getTileMessage(targetX, targetY);
            if (message) {
                this.showDialogBubble(message);
            }
            return;
        }

        // Vérifier si la couche Dessous est minable
        if (levelManager.isMinable(targetX, targetY)) {
            const durability = tileConfig.durability || 1;
            
            this.isMining = true;
            this.miningProgress = 0;
            this.miningTarget = { x: targetX, y: targetY };
            this.pickaxeAngle = 0;
            this.miningHits = 0;
            this.requiredHits = durability;
            // Mémoriser le type pour actions spéciales (warp)
            this.miningTileType = tileType;
            this.miningLayer = 'foreground'; // Mémoriser quelle couche on mine
        }
    }

    // Afficher une bulle de dialogue
    showDialogBubble(message) {
        // Créer ou mettre à jour la bulle
        let bubble = document.getElementById('dialog-bubble');
        if (!bubble) {
            bubble = document.createElement('div');
            bubble.id = 'dialog-bubble';
            bubble.className = 'dialog-bubble';
            document.body.appendChild(bubble);
        }

        bubble.textContent = message;
        bubble.classList.add('show');

        // Masquer après 4 secondes
        setTimeout(() => {
            bubble.classList.remove('show');
        }, 4000);
    }

    // Ouvrir un coffre
    openChest(x, y, levelManager) {
        const content = levelManager.getChestContent(x, y);
        const modal = document.getElementById('modal-chest');
        const chestGrid = document.getElementById('chest-grid');
        
        if (!modal || !chestGrid) return;

        // Stocker la position du coffre pour les interactions
        modal.dataset.chestX = x;
        modal.dataset.chestY = y;

        // Mettre à jour l'affichage de l'inventaire du joueur dans le modal
        this.updateChestInventoryDisplay();

        // Vider la grille
        chestGrid.innerHTML = '';

        if (content.items && content.items.length > 0) {
            // Afficher une icône par ressource (une icône par item)
            content.items.forEach((item, itemIndex) => {
                // Pour chaque unité de la ressource, créer une icône
                for (let count = 0; count < item.count; count++) {
                    const iconItem = document.createElement('div');
                    iconItem.className = 'chest-icon-item';
                    iconItem.dataset.itemIndex = itemIndex;
                    iconItem.title = `Cliquer pour prendre 1x ${item.name}`;

                    // Créer une miniature de la tuile
                    if (item.tileId !== undefined && typeof tileRenderer !== 'undefined') {
                        // Obtenir l'image de la tuile
                        const tileImage = tileRenderer.getTile(item.tileId);
                        
                        // Créer un petit canvas pour la miniature (16x16 pixels)
                        const miniCanvas = document.createElement('canvas');
                        miniCanvas.width = 40;
                        miniCanvas.height = 40;
                        const miniCtx = miniCanvas.getContext('2d');
                        
                        // Dessiner la tuile en petit
                        miniCtx.imageSmoothingEnabled = false;
                        miniCtx.drawImage(tileImage, 0, 0, 40, 40);
                        
                        // Créer une image à partir du canvas
                        const miniImage = miniCanvas.toDataURL();
                        
                        iconItem.innerHTML = `
                            <img src="${miniImage}" alt="${item.name}" style="width: 40px; height: 40px; image-rendering: pixelated;" />
                        `;
                    } else {
                        // Fallback: afficher juste un emoji si pas de tileId
                        let icon = '';
                        let color = '';
                        switch(item.type) {
                            case 'stone': icon = '🪨'; color = '#7a7a7a'; break;
                            case 'iron': icon = '⚙️'; color = '#b87333'; break;
                            case 'gold': icon = '⭐'; color = '#ffd700'; break;
                            default: icon = '❓'; color = '#666'; break;
                        }
                        
                        iconItem.innerHTML = `
                            <div class="chest-icon-resource" style="color: ${color};">${icon}</div>
                        `;
                    }

                    // Ajouter l'événement de clic
                    iconItem.addEventListener('click', () => {
                        this.takeOneItemFromChest(itemIndex, levelManager);
                    });

                    chestGrid.appendChild(iconItem);
                }
            });
        } else {
            chestGrid.innerHTML = '';
        }

        modal.classList.add('show');
    }

    // Ouvrir un panneau (lecture seule)
    openSign(x, y, levelManager) {
        const message = levelManager.getTileMessage(x, y);
        const modal = document.getElementById('modal-sign');
        const signContent = document.getElementById('sign-content');
        
        if (!modal || !signContent) return;

        // Afficher le message du panneau
        signContent.textContent = message || '(Panneau vide)';
        modal.classList.add('show');
    }

    // Déclencher un warp
    triggerWarp(x, y, levelManager) {
        const dest = levelManager.getWarpDestination(x, y);
        if (dest && window.onWarpActivated) {
            window.onWarpActivated(dest);
        }
    }

    // Prendre 1 item du coffre
    takeOneItemFromChest(itemIndex, levelManager) {
        const modal = document.getElementById('modal-chest');
        const x = parseInt(modal.dataset.chestX);
        const y = parseInt(modal.dataset.chestY);

        const content = levelManager.getChestContent(x, y);
        if (!content.items || !content.items[itemIndex]) return;

        const item = content.items[itemIndex];

        // Ajouter 1 à l'inventaire du joueur
        this.inventory[item.type] += 1;
        this.updateInventoryUI();
        this.updateChestInventoryDisplay();

        // Réduire de 1 dans le coffre
        item.count -= 1;
        
        // Supprimer l'item s'il n'y en a plus
        if (item.count <= 0) {
            content.items.splice(itemIndex, 1);
        }

        levelManager.setChestContent(x, y, content);
        levelManager.saveLevelsToStorage();

        // Jouer un son de prise d'item
        this.playPickupSound();

        // Rafraîchir l'affichage du coffre
        this.openChest(x, y, levelManager);
    }

    // Prendre tous les items du coffre
    takeAllFromChest(x, y, levelManager) {
        const content = levelManager.getChestContent(x, y);
        if (!content.items || content.items.length === 0) return;

        // Boucler pour prendre tous les items
        while (content.items.length > 0) {
            const item = content.items[0];
            
            // Ajouter toute la quantité à l'inventaire
            this.inventory[item.type] += item.count;
            
            // Retirer l'item du coffre
            content.items.splice(0, 1);
        }

        // Mettre à jour l'inventaire
        this.updateInventoryUI();
        this.updateChestInventoryDisplay();

        // Sauvegarder le coffre vide
        levelManager.setChestContent(x, y, content);
        levelManager.saveLevelsToStorage();

        // Jouer le son de prise d'item
        this.playPickupSound();

        // Rafraîchir l'affichage du coffre
        this.openChest(x, y, levelManager);
    }

    // Mettre à jour l'animation de minage
    updateMining(deltaTime, levelManager) {
        if (!this.isMining) return;

        // Progression du minage (animation rapide pour chaque coup)
        this.miningProgress += deltaTime * 3; // 0.33 seconde par coup
        this.pickaxeAngle = Math.sin(this.miningProgress * 10) * 30;

        // Coup terminé
        if (this.miningProgress >= 1) {
            this.miningHits++;
            this.playMiningSound();
            
            // Vérifier si le bloc est détruit
            if (this.miningHits >= this.requiredHits) {
                const resource = levelManager.mineTile(this.miningTarget.x, this.miningTarget.y);
                if (resource) {
                    this.inventory[resource]++;
                    this.updateInventoryUI();
                }
                // Si on vient de miner un warp, activer la téléportation
                const tileConfig = TileConfig[this.miningTileType];
                console.log('⛏️ DEBUG Mining Complete:', {
                    miningTileType: this.miningTileType,
                    tileName: tileConfig?.name,
                    tileWarp: tileConfig?.warp,
                    tileIsWarp: tileConfig?.isWarp,
                    isWarp: tileConfig && (tileConfig.warp || tileConfig.isWarp),
                    miningTarget: this.miningTarget,
                    warpDest: levelManager.getWarpDestination(this.miningTarget.x, this.miningTarget.y)
                });
                
                if (tileConfig && (tileConfig.warp || tileConfig.isWarp)) {
                    const dest = levelManager.getWarpDestination(this.miningTarget.x, this.miningTarget.y);
                    console.log('🌀 WARP ACTIVATION:', { dest, hasCallback: !!window.onWarpActivated });
                    if (dest && window.onWarpActivated) {
                        window.onWarpActivated(dest);
                    }
                }
                this.isMining = false;
                this.miningProgress = 0;
                this.pickaxeAngle = 0;
                this.miningHits = 0;
                this.miningTileType = null;
            } else {
                // Réinitialiser la progression pour le prochain coup
                this.miningProgress = 0;
            }
        }
    }

    // Jouer un son de prise d'item
    playPickupSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.15);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
            // Ignorer les erreurs audio
        }
    }

    // Jouer un son de minage
    playMiningSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Pas de son si erreur
        }
    }

    // Mettre à jour l'affichage de l'inventaire
    updateInventoryUI() {
        // Mettre à jour le modal inventaire
        const invStoneElement = document.getElementById('inv-stone-count');
        const invIronElement = document.getElementById('inv-iron-count');
        const invGoldElement = document.getElementById('inv-gold-count');

        if (invStoneElement) invStoneElement.textContent = this.inventory.stone;
        if (invIronElement) invIronElement.textContent = this.inventory.iron;
        if (invGoldElement) invGoldElement.textContent = this.inventory.gold;
    }

    // Mettre à jour l'affichage de l'inventaire dans le modal du coffre
    updateChestInventoryDisplay() {
        const playerStoneElement = document.getElementById('player-stone-count');
        const playerIronElement = document.getElementById('player-iron-count');
        const playerGoldElement = document.getElementById('player-gold-count');

        if (playerStoneElement) playerStoneElement.textContent = this.inventory.stone;
        if (playerIronElement) playerIronElement.textContent = this.inventory.iron;
        if (playerGoldElement) playerGoldElement.textContent = this.inventory.gold;
    }

    // Dessiner le joueur
    draw(ctx, levelManager) {
        const isPlatformer = levelManager?.currentLevel?.type === 'platformer';
        
        // Utiliser une taille fixe de 32x32 pixels
        const tileSize = 32;
        
        const pixelX = this.x * tileSize;
        const pixelY = this.y * tileSize;

        // Personnage de 1 tuile de haut dans tous les modes
        const padding = tileSize * 0.1875;
        const bodySize = tileSize * 0.625;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(pixelX + padding, pixelY + padding, bodySize, bodySize);
        
        ctx.strokeStyle = '#cc5555';
        ctx.lineWidth = 3;
        ctx.strokeRect(pixelX + padding, pixelY + padding, bodySize, bodySize);

        // Yeux selon la direction
        const eyeSize = tileSize * 0.125;
        const eyeOffsetNear = tileSize * 0.3125;
        const eyeOffsetFar = tileSize * 0.5625;
        
        ctx.fillStyle = '#ffffff';
        
        if (isPlatformer) {
            // En mode platformer : yeux gauche/droite seulement
            if (this.direction === 'right' || this.direction === 'down') {
                ctx.fillRect(pixelX + eyeOffsetFar, pixelY + eyeOffsetNear, eyeSize, eyeSize);
                ctx.fillRect(pixelX + eyeOffsetFar, pixelY + eyeOffsetFar, eyeSize, eyeSize);
            } else { // left ou up
                ctx.fillRect(pixelX + eyeOffsetNear, pixelY + eyeOffsetNear, eyeSize, eyeSize);
                ctx.fillRect(pixelX + eyeOffsetNear, pixelY + eyeOffsetFar, eyeSize, eyeSize);
            }
        } else {
            // En mode top-down : yeux dans toutes les directions
            if (this.direction === 'right') {
                ctx.fillRect(pixelX + eyeOffsetFar, pixelY + eyeOffsetNear, eyeSize, eyeSize);
                ctx.fillRect(pixelX + eyeOffsetFar, pixelY + eyeOffsetFar, eyeSize, eyeSize);
            } else if (this.direction === 'left') {
                ctx.fillRect(pixelX + eyeOffsetNear, pixelY + eyeOffsetNear, eyeSize, eyeSize);
                ctx.fillRect(pixelX + eyeOffsetNear, pixelY + eyeOffsetFar, eyeSize, eyeSize);
            } else if (this.direction === 'up') {
                ctx.fillRect(pixelX + eyeOffsetNear, pixelY + eyeOffsetNear, eyeSize, eyeSize);
                ctx.fillRect(pixelX + eyeOffsetFar, pixelY + eyeOffsetNear, eyeSize, eyeSize);
            } else { // down
                ctx.fillRect(pixelX + eyeOffsetNear, pixelY + eyeOffsetFar, eyeSize, eyeSize);
                ctx.fillRect(pixelX + eyeOffsetFar, pixelY + eyeOffsetFar, eyeSize, eyeSize);
            }
        }

        // Dessiner la pioche si en train de miner
        if (this.isMining) {
            this.drawPickaxe(ctx, pixelX, pixelY, tileSize);
        }
    }

    // Dessiner l'animation de la pioche
    drawPickaxe(ctx, pixelX, pixelY, tileSize) {
        ctx.save();

        // Position de départ de la pioche selon la direction
        let startX = pixelX + tileSize / 2;
        let startY = pixelY + tileSize / 2;
        let angleOffset = 0;

        switch (this.direction) {
            case 'up':
                startY = pixelY;
                angleOffset = -90;
                break;
            case 'down':
                startY = pixelY + tileSize;
                angleOffset = 90;
                break;
            case 'left':
                startX = pixelX;
                angleOffset = 180;
                break;
            case 'right':
                startX = pixelX + tileSize;
                angleOffset = 0;
                break;
        }

        ctx.translate(startX, startY);
        ctx.rotate((angleOffset + this.pickaxeAngle) * Math.PI / 180);

        // Manche de la pioche
        const handleLength = tileSize * 0.75;
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(handleLength, 0);
        ctx.stroke();

        // Tête de la pioche
        const headSize = tileSize * 0.25;
        ctx.fillStyle = '#A9A9A9';
        ctx.beginPath();
        ctx.moveTo(handleLength, -headSize * 0.5);
        ctx.lineTo(handleLength + headSize, 0);
        ctx.lineTo(handleLength, headSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // Réinitialiser la position
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
}
