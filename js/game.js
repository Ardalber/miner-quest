// Variables globales du jeu
let canvas, ctx;
let player;
let lastTime = 0;
let keys = {};
let playerName = '';

// Afficher le modal de prénom au démarrage
function showNameModal() {
    const modal = document.getElementById('modal-name');
    const input = document.getElementById('player-name-input');
    const btnStart = document.getElementById('btn-start-game');
    
    if (modal && input && btnStart) {
        // Vérifier si un nom est déjà sauvegardé
        const savedName = localStorage.getItem('minerquest_player_name');
        if (savedName) {
            playerName = savedName;
            modal.style.display = 'none';
            init();
        } else {
            modal.style.display = 'flex';
            input.focus();
            
            // Gérer le bouton commencer
            btnStart.addEventListener('click', () => {
                const name = input.value.trim();
                if (name) {
                    playerName = name;
                    localStorage.setItem('minerquest_player_name', name);
                    modal.style.display = 'none';
                    init();
                } else {
                    input.style.borderColor = '#f44336';
                    setTimeout(() => {
                        input.style.borderColor = '#667eea';
                    }, 500);
                }
            });
            
            // Gérer la touche Entrée
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    btnStart.click();
                }
            });
        }
    }
}

// Initialisation du jeu
async function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Créer le joueur
    player = new Player();

    // Charger les niveaux
    await levelManager.loadLevelsFromStorage();
    
    // Charger le niveau level_1 en priorité, sinon le premier disponible
    const levelList = levelManager.getLevelList();
    if (levelList.length > 0) {
        const defaultLevel = levelList.includes('level_1') ? 'level_1' : levelList[0];
        levelManager.loadLevel(defaultLevel);
        // Positionner le joueur
        if (levelManager.currentLevel) {
            player.setPosition(
                levelManager.currentLevel.startX,
                levelManager.currentLevel.startY
            );
        }
    } else {
        // Aucun niveau disponible
        showToast('Aucun niveau disponible. Créez-en un dans l\'éditeur!', 'info', 5000);
    }

    // Initialiser l'inventaire UI
    player.updateInventoryUI();

    // Mettre à jour l'affichage du niveau au démarrage
    updateLevelDisplay();

    // Gestionnaire de warp
    window.onWarpActivated = function(targetLevel) {
        levelManager.loadLevel(targetLevel);
        if (levelManager.currentLevel) {
            player.setPosition(
                levelManager.currentLevel.startX,
                levelManager.currentLevel.startY
            );
            updateLevelDisplay();
        }
    };

    // Événements clavier
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Bouton éditeur
    const editorBtn = document.getElementById('btn-editor');
    if (editorBtn) {
        editorBtn.addEventListener('click', () => {
            window.location.href = 'editor.html';
        });
    }

    // Modal des commandes
    const modalCommands = document.getElementById('modal-commands');
    const btnCommands = document.getElementById('btn-commands');
    const btnCloseModal = document.getElementById('btn-close-modal');

    if (btnCommands && modalCommands) {
        btnCommands.addEventListener('click', () => {
            modalCommands.classList.add('show');
        });
    }

    if (btnCloseModal && modalCommands) {
        btnCloseModal.addEventListener('click', () => {
            modalCommands.classList.remove('show');
        });
    }

    // Fermer le modal en cliquant en dehors
    if (modalCommands) {
        modalCommands.addEventListener('click', (e) => {
            if (e.target === modalCommands) {
                modalCommands.classList.remove('show');
            }
        });
    }

    // Modal de l'inventaire
    const modalInventory = document.getElementById('modal-inventory');
    const btnInventory = document.getElementById('btn-inventory');
    const btnCloseInventory = document.getElementById('btn-close-inventory');

    if (btnInventory && modalInventory) {
        btnInventory.addEventListener('click', () => {
            player.updateInventoryUI();
            modalInventory.classList.add('show');
        });
    }

    if (btnCloseInventory && modalInventory) {
        btnCloseInventory.addEventListener('click', () => {
            modalInventory.classList.remove('show');
        });
    }

    // Fermer le modal inventaire en cliquant en dehors
    if (modalInventory) {
        modalInventory.addEventListener('click', (e) => {
            if (e.target === modalInventory) {
                modalInventory.classList.remove('show');
            }
        });
    }

    // Modal du coffre
    const modalChest = document.getElementById('modal-chest');
    const btnCloseChest = document.getElementById('btn-close-chest');

    if (btnCloseChest && modalChest) {
        btnCloseChest.addEventListener('click', () => {
            modalChest.classList.remove('show');
        });
    }

    // Fermer le modal coffre en cliquant en dehors
    if (modalChest) {
        modalChest.addEventListener('click', (e) => {
            if (e.target === modalChest) {
                modalChest.classList.remove('show');
            }
        });
    }

    // Démarrer la boucle de jeu
    requestAnimationFrame(gameLoop);
}

// Gestion des touches enfoncées
function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    // Empêcher le défilement avec les flèches
    if (['z', 'q', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }

    // Miner avec Espace
    if (e.key === ' ') {
        player.startMining(levelManager);
    }
}

// Gestion des touches relâchées
function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

// Boucle principale du jeu
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Mettre à jour
    update(deltaTime);

    // Dessiner
    render();

    // Continuer la boucle
    requestAnimationFrame(gameLoop);
}

// Mise à jour de la logique du jeu
function update(deltaTime) {
    // Déplacement du joueur (limiter à une fois toutes les 150ms pour éviter déplacement trop rapide)
    if (!player.moveDelay || player.moveDelay <= 0) {
        let moved = false;

        if (keys['z']) {
            moved = player.move(0, -1, levelManager);
        } else if (keys['s']) {
            moved = player.move(0, 1, levelManager);
        } else if (keys['q']) {
            moved = player.move(-1, 0, levelManager);
        } else if (keys['d']) {
            moved = player.move(1, 0, levelManager);
        }

        if (moved) {
            player.moveDelay = 0.15; // 150ms de délai
        }
    } else {
        player.moveDelay -= deltaTime;
    }

    // Mettre à jour l'animation de minage
    player.updateMining(deltaTime, levelManager);
}

// Rendu du jeu
function render() {
    // Effacer le canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner la grille de tuiles
    drawLevel();

    // Dessiner le joueur
    player.draw(ctx);
}

// Dessiner le niveau
function drawLevel() {
    if (!levelManager.currentLevel) return;

    const level = levelManager.currentLevel;
    
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            const tileType = level.tiles[y][x];
            const tileImage = tileRenderer.getTile(tileType);
            
            ctx.drawImage(
                tileImage,
                x * 32,
                y * 32,
                32,
                32
            );
        }
    }
}

// Mettre à jour l'affichage du niveau actuel
function updateLevelDisplay() {
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay && levelManager.currentLevel) {
        const levelName = levelManager.currentLevel.name;
        // Convertir level_1 en Level 1, level_2 en Level 2, etc.
        const formattedName = levelName.replace(/^level_?(\d+)$/i, 'Level $1');
        levelDisplay.textContent = formattedName;
    }
}

// Afficher une notification toast
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Retirer la notification après la durée
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Démarrer le jeu quand la page est chargée
window.addEventListener('DOMContentLoaded', showNameModal);
