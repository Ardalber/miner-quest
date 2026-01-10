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
        
        // Inventaire
        this.inventory = {
            stone: 0,
            iron: 0,
            gold: 0
        };
        
        // Direction pour l'animation
        this.direction = 'down'; // up, down, left, right
    }

    // Déplacer le joueur
    move(dx, dy, levelManager) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Mettre à jour la direction TOUJOURS, même si bloqué
        if (dx > 0) this.direction = 'right';
        else if (dx < 0) this.direction = 'left';
        else if (dy > 0) this.direction = 'down';
        else if (dy < 0) this.direction = 'up';

        // Vérifier si la position est valide
        if (!levelManager.isSolid(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true;
        }
        return false;
    }

    // Commencer à miner
    startMining(levelManager) {
        if (this.isMining) return;

        // Déterminer la case ciblée selon la direction
        let targetX = this.x;
        let targetY = this.y;

        switch (this.direction) {
            case 'up': targetY--; break;
            case 'down': targetY++; break;
            case 'left': targetX--; break;
            case 'right': targetX++; break;
        }

        // Vérifier si c'est un coffre
        if (levelManager.isChest(targetX, targetY)) {
            this.openChest(targetX, targetY, levelManager);
            return;
        }

        // Vérifier si la case est interactive (panneau...)
        if (levelManager.isInteractive(targetX, targetY)) {
            const message = levelManager.getTileMessage(targetX, targetY);
            if (message) {
                this.showDialogBubble(message);
            }
            return;
        }

        // Vérifier si la case est minable
        if (levelManager.isMinable(targetX, targetY)) {
            this.isMining = true;
            this.miningProgress = 0;
            this.miningTarget = { x: targetX, y: targetY };
            this.pickaxeAngle = 0;
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

        // Vider et remplir la grille
        chestGrid.innerHTML = '';

        if (content.items && content.items.length > 0) {
            content.items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'chest-item';
                itemDiv.dataset.itemIndex = index;

                let icon = '';
                let color = '';
                switch(item.type) {
                    case 'stone': icon = '🪨'; color = '#7a7a7a'; break;
                    case 'iron': icon = '⚙️'; color = '#b87333'; break;
                    case 'gold': icon = '⭐'; color = '#ffd700'; break;
                }

                itemDiv.innerHTML = `
                    <div class="chest-item-icon" style="background: ${color};">${icon}</div>
                    <span class="chest-item-name">${item.name}</span>
                    <span class="chest-item-value">${item.count}</span>
                    <button class="chest-btn-take" data-index="${index}">Prendre</button>
                `;

                const btnTake = itemDiv.querySelector('.chest-btn-take');
                btnTake.addEventListener('click', () => {
                    this.takeOneItemFromChest(index, levelManager);
                });

                chestGrid.appendChild(itemDiv);
            });
        } else {
            chestGrid.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Le coffre est vide</p>';
        }

        modal.classList.add('show');
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

        // Réduire de 1 dans le coffre
        item.count -= 1;
        
        // Supprimer l'item s'il n'y en a plus
        if (item.count <= 0) {
            content.items.splice(itemIndex, 1);
        }

        levelManager.setChestContent(x, y, content);
        levelManager.saveLevelsToStorage();

        // Rafraîchir l'affichage du coffre
        this.openChest(x, y, levelManager);
    }

    // Mettre à jour l'animation de minage
    updateMining(deltaTime, levelManager) {
        if (!this.isMining) return;

        // Progression du minage (plus rapide pour tester)
        this.miningProgress += deltaTime * 2; // 0.5 seconde par bloc
        this.pickaxeAngle = Math.sin(this.miningProgress * 10) * 30;

        // Minage terminé
        if (this.miningProgress >= 1) {
            const resource = levelManager.mineTile(this.miningTarget.x, this.miningTarget.y);
            if (resource) {
                this.inventory[resource]++;
                this.updateInventoryUI();
                this.playMiningSound();
            }
            this.isMining = false;
            this.miningProgress = 0;
            this.pickaxeAngle = 0;
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

    // Dessiner le joueur
    draw(ctx) {
        const pixelX = this.x * this.tileSize;
        const pixelY = this.y * this.tileSize;

        // Corps du joueur (carré avec contour)
        ctx.fillStyle = this.color;
        ctx.fillRect(pixelX + 6, pixelY + 6, 20, 20);
        
        ctx.strokeStyle = '#cc5555';
        ctx.lineWidth = 3;
        ctx.strokeRect(pixelX + 6, pixelY + 6, 20, 20);

        // Yeux selon la direction
        ctx.fillStyle = '#ffffff';
        if (this.direction === 'right') {
            ctx.fillRect(pixelX + 18, pixelY + 10, 4, 4);
            ctx.fillRect(pixelX + 18, pixelY + 18, 4, 4);
        } else if (this.direction === 'left') {
            ctx.fillRect(pixelX + 10, pixelY + 10, 4, 4);
            ctx.fillRect(pixelX + 10, pixelY + 18, 4, 4);
        } else if (this.direction === 'up') {
            ctx.fillRect(pixelX + 10, pixelY + 10, 4, 4);
            ctx.fillRect(pixelX + 18, pixelY + 10, 4, 4);
        } else { // down
            ctx.fillRect(pixelX + 10, pixelY + 18, 4, 4);
            ctx.fillRect(pixelX + 18, pixelY + 18, 4, 4);
        }

        // Dessiner la pioche si en train de miner
        if (this.isMining) {
            this.drawPickaxe(ctx, pixelX, pixelY);
        }
    }

    // Dessiner l'animation de la pioche
    drawPickaxe(ctx, pixelX, pixelY) {
        ctx.save();

        // Position de départ de la pioche selon la direction
        let startX = pixelX + 16;
        let startY = pixelY + 16;
        let angleOffset = 0;

        switch (this.direction) {
            case 'up':
                startY = pixelY;
                angleOffset = -90;
                break;
            case 'down':
                startY = pixelY + 32;
                angleOffset = 90;
                break;
            case 'left':
                startX = pixelX;
                angleOffset = 180;
                break;
            case 'right':
                startX = pixelX + 32;
                angleOffset = 0;
                break;
        }

        ctx.translate(startX, startY);
        ctx.rotate((angleOffset + this.pickaxeAngle) * Math.PI / 180);

        // Manche de la pioche
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(24, 0);
        ctx.stroke();

        // Tête de la pioche
        ctx.fillStyle = '#A9A9A9';
        ctx.beginPath();
        ctx.moveTo(24, -4);
        ctx.lineTo(32, 0);
        ctx.lineTo(24, 4);
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
