// Variables globales du jeu
let canvas, ctx;
let player;
let lastTime = 0;
let keys = {};
let playerName = '';
let isTestingMode = false;

// Afficher le modal de prénom au démarrage
function showNameModal() {
    const modal = document.getElementById('modal-name');
    const input = document.getElementById('player-name-input');
    const btnStart = document.getElementById('btn-start-game');
    
    // Vérifier si on est en mode test
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test');
    
    if (modal && input && btnStart) {
        // Vérifier si un nom est déjà sauvegardé
        const savedName = localStorage.getItem('minerquest_player_name');
        if (savedName) {
            playerName = savedName;
            modal.style.display = 'none';
            init();
        } else if (testMode) {
            // Mode test : utiliser un nom par défaut temporaire
            playerName = 'Testeur';
            localStorage.setItem('minerquest_player_name', playerName);
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

    // Restaurer les tuiles personnalisées dans TileConfig (si pas déjà fait)
    if (typeof restoreCustomTilesToConfig === 'function') {
        console.log('📦 Before restoreCustomTilesToConfig - TileConfig keys:', Object.keys(TileConfig).filter(k => !isNaN(k)).sort((a,b) => a-b).join(','));
        restoreCustomTilesToConfig();
        console.log('📦 After restoreCustomTilesToConfig - TileConfig keys:', Object.keys(TileConfig).filter(k => !isNaN(k)).sort((a,b) => a-b).join(','));
        // Log les propriétés minable de toutes les tuiles
        const minableTiles = Object.keys(TileConfig)
            .filter(k => !isNaN(k) && TileConfig[k].minable)
            .map(k => `${k}(${TileConfig[k].name})`)
            .join(', ');
        console.log('✅ Minable tiles in TileConfig:', minableTiles || 'none');
    }

    // Créer le joueur
    player = new Player();

    // Charger les niveaux
    await levelManager.loadLevelsFromStorage();
    
    // Vérifier si un niveau a été passé en paramètre URL et si on est en mode test
    const urlParams = new URLSearchParams(window.location.search);
    const levelFromURL = urlParams.get('level');
    const testMode = urlParams.get('test');
    isTestingMode = testMode === '1';
    
    // Afficher une notification et le badge si on est en mode test
    if (isTestingMode) {
        const testBadge = document.getElementById('test-badge');
        if (testBadge) {
            testBadge.style.display = 'block';
        }
        showToast('🧪 Mode test - Appuyez sur ESC pour revenir à l\'éditeur', 'info', 5000);
    }
    
    // Charger le niveau level_1 en priorité, sinon le premier disponible
    const levelList = levelManager.getLevelList();
    if (levelList.length > 0) {
        let defaultLevel = levelFromURL && levelList.includes(levelFromURL) ? levelFromURL : null;
        if (!defaultLevel) {
            defaultLevel = levelList.includes('level_1') ? 'level_1' : levelList[0];
        }
        levelManager.loadLevel(defaultLevel);
        console.log('🎮 Level Loaded:', defaultLevel);
        console.log('📊 Level Data:', {
            width: levelManager.currentLevel?.width,
            height: levelManager.currentLevel?.height,
            tilesLength: levelManager.currentLevel?.tiles?.length,
            backgroundTilesLength: levelManager.currentLevel?.backgroundTiles?.length,
            backgroundTilesSample: levelManager.currentLevel?.backgroundTiles?.slice(0, 3)
        });
        // Adapter la taille du canvas au niveau
        if (levelManager.currentLevel) {
            const tileSize = 32;
            canvas.width = levelManager.currentLevel.width * tileSize;
            canvas.height = levelManager.currentLevel.height * tileSize;
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
            // Adapter la taille du canvas au nouveau niveau
            const tileSize = 32;
            canvas.width = levelManager.currentLevel.width * tileSize;
            canvas.height = levelManager.currentLevel.height * tileSize;
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
            // Passer le niveau actuel à l'éditeur
            if (levelManager.currentLevel) {
                sessionStorage.setItem('gameEditorLevel', levelManager.currentLevel.name || 'level_1');
            }
            window.location.href = 'editor.html';
        });
    }

    // Bouton éditeur de tuiles
    const tilesBtn = document.getElementById('btn-tiles');
    if (tilesBtn) {
        tilesBtn.addEventListener('click', () => {
            sessionStorage.setItem('tileEditorSource', 'game');
            window.location.href = 'tile_editor.html';
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
    const btnTakeAllChest = document.getElementById('btn-take-all-chest');

    if (btnCloseChest && modalChest) {
        btnCloseChest.addEventListener('click', () => {
            modalChest.classList.remove('show');
        });
    }

    // Gestionnaire pour "Prendre tout"
    if (btnTakeAllChest && modalChest) {
        btnTakeAllChest.addEventListener('click', () => {
            const x = parseInt(modalChest.dataset.chestX);
            const y = parseInt(modalChest.dataset.chestY);
            player.takeAllFromChest(x, y, levelManager);
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

    // Modal du panneau
    const modalSign = document.getElementById('modal-sign');
    const btnCloseSign = document.getElementById('btn-close-sign');

    if (btnCloseSign && modalSign) {
        btnCloseSign.addEventListener('click', () => {
            modalSign.classList.remove('show');
        });
    }

    // Fermer le modal panneau en cliquant en dehors
    if (modalSign) {
        modalSign.addEventListener('click', (e) => {
            if (e.target === modalSign) {
                modalSign.classList.remove('show');
            }
        });
    }

    // Démarrer la boucle de jeu
    requestAnimationFrame(gameLoop);
}

// Gestion des touches enfoncées
function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    // Empêcher le défilement avec les flèches et la barre espace
    if (['z', 'q', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }

    // Interagir avec E
    if (e.key.toLowerCase() === 'e') {
        player.startMining(levelManager);
    }
    
    // Touche Échap en mode test pour retourner à l'éditeur
    if (e.key === 'Escape' && isTestingMode) {
        e.preventDefault();
        window.location.href = 'editor.html';
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
    const isPlatformer = levelManager.currentLevel?.type === 'platformer';
    
    if (isPlatformer) {
        // Mode platformer : physique et contrôles différents
        player.applyPlatformerPhysics(deltaTime, levelManager);
        
        // Mouvement fluide horizontal avec vélocité continue
        const isShiftPressed = keys['shift'];
        const speed = isShiftPressed ? 0.16 : 0.08; // 0.08 ≈ 2.56 cases/sec (≈ 4 avant), 0.16 ≈ 5.12 cases/sec (≈ 8 avant)
        
        // Accélération / Décélération de la vélocité horizontale
        if (keys['q']) {
            player.velocityX = -speed;
        } else if (keys['d']) {
            player.velocityX = speed;
        } else {
            // Décélération graduelle quand aucune touche n'est pressée
            player.velocityX *= 0.8; // Appliquer une friction
            if (Math.abs(player.velocityX) < 0.001) {
                player.velocityX = 0;
            }
        }
        
        // Appliquer la vélocité avec vérification de collision
        if (player.velocityX !== 0) {
            const newX = player.x + player.velocityX;
            const dx = Math.sign(player.velocityX);
            
            // Vérifier collision avec le système de bords
            if (!player.checkCollisionDirectional(newX, player.y, dx, 0, levelManager)) {
                player.x = newX;
                
                // Mettre à jour la direction
                if (player.velocityX > 0) player.direction = 'right';
                else if (player.velocityX < 0) player.direction = 'left';
                
                // Vérifier les warps
                if (levelManager.isWarp(Math.floor(newX), Math.floor(player.y))) {
                    const targetLevel = levelManager.getWarpDestination(Math.floor(newX), Math.floor(player.y));
                    if (targetLevel && window.onWarpActivated) {
                        window.onWarpActivated(targetLevel);
                    }
                }
            }
        }
        
        // Saut avec Espace
        if (keys[' ']) {
            player.jump(levelManager);
        }
    } else {
        // Mode top-down : mouvement dans 4 directions avec délai
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
    player.draw(ctx, levelManager);
}

// Dessiner le niveau
function drawLevel() {
    if (!levelManager.currentLevel) {
        console.warn('❌ currentLevel est null');
        return;
    }

    const level = levelManager.currentLevel;
    const tileSize = 32; // Taille fixe de 32x32 pixels
    
    // S'assurer que le canvas a la bonne taille
    if (canvas.width !== level.width * tileSize || canvas.height !== level.height * tileSize) {
        canvas.width = level.width * tileSize;
        canvas.height = level.height * tileSize;
    }
    
    // DEBUG: Log les info du niveau
    if (!window.drawLevelLogged) {
        console.log(`📊 DrawLevel - Niveau: ${level.name}, Size: ${level.width}x${level.height}`);
        console.log(`📊 tiles[0][0] = ${level.tiles[0][0]}, tiles[0][1] = ${level.tiles[0][1]}`);
        console.log(`📊 TileConfig keys available: ${Object.keys(TileConfig).filter(k => !isNaN(k)).sort((a,b)=>a-b).slice(0, 10).join(',')}`);
        window.drawLevelLogged = true;
    }
    
    // Dessiner d'abord la couche AVANT-PLAN (tiles) en dessous - PLEINE OPACITÉ
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            const tileType = level.tiles[y][x];
            if (tileType !== 0) { // Ne dessiner que si ce n'est pas EMPTY
                const tileImage = tileRenderer.getTile(tileType);
                ctx.drawImage(
                    tileImage,
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize
                );
            }
        }
    }
    
    // Dessiner ensuite l'ARRIÈRE-PLAN (backgroundTiles) PAR-DESSUS - PLEINE OPACITÉ
    if (level.backgroundTiles) {
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const bgTileType = level.backgroundTiles[y][x];
                if (bgTileType !== 0) { // Ne dessiner que si ce n'est pas EMPTY
                    const bgTileImage = tileRenderer.getTile(bgTileType);
                    ctx.drawImage(
                        bgTileImage,
                        x * tileSize,
                        y * tileSize,
                        tileSize,
                        tileSize
                    );
                }
            }
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
