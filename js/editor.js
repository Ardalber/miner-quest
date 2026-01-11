// Formater le nom du niveau pour l'affichage (level_1 -> Level 1)
function formatLevelName(levelName) {
    return levelName.replace(/^level_?(\d+)$/i, 'Level $1');
}

// Demander l'accès au dossier levels
async function requestLevelsFolderAccess() {
    try {
        if ('showDirectoryPicker' in window) {
            levelsFolderHandle = await window.showDirectoryPicker({
                id: 'miner-quest-levels',
                mode: 'readwrite',
                startIn: 'downloads'
            });
            showEditorToast('✓ Accès au dossier levels autorisé', 'success', 2000);
            return true;
        } else {
            showEditorToast('✗ Votre navigateur ne supporte pas cette fonctionnalité. Utilisez Chrome/Edge récent.', 'error', 5000);
            return false;
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            showEditorToast('✗ Accès au dossier refusé', 'error', 3000);
        }
        return false;
    }
}

// Sauvegarder directement dans le dossier levels
async function saveToLevelsFolder(levelName, jsonContent) {
    if (!levelsFolderHandle) {
        const granted = await requestLevelsFolderAccess();
        if (!granted) return false;
    }
    
    try {
        const fileName = `${levelName}.json`;
        const fileHandle = await levelsFolderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        return true;
    } catch (err) {
        console.error('Erreur d\'écriture:', err);
        showEditorToast('✗ Erreur d\'écriture du fichier', 'error', 3000);
        return false;
    }
}

// Afficher une notification dans la barre d'actions
function showEditorToast(message, type = 'info', duration = 3000) {
    const statusElement = document.getElementById('editor-status');
    if (!statusElement) return;
    
    // Supprimer les classes précédentes
    statusElement.className = 'editor-status';
    
    // Ajouter le message et le type
    statusElement.textContent = message;
    statusElement.classList.add('show', type);
    
    // Masquer après la durée
    setTimeout(() => {
        statusElement.classList.remove('show');
    }, duration);
}

function createEditorToastContainer() {
    // Fonction vide pour compatibilité
    return document.getElementById('editor-status');
}

// Variables de l'éditeur
let editorCanvas, editorCtx;
let selectedTile = TileTypes.GRASS;
let currentLevelName = 'level_1';
let isDrawing = false;
let isSettingPlayerPos = false;
let undoStack = [];
const MAX_UNDO = 20;
let chestItemCounts = { stone: 0, iron: 0, gold: 0 };
let initialLevelState = null; // Pour détecter les changements
let levelsFolderHandle = null; // Handle du dossier levels pour l'API File System Access

// Initialisation de l'éditeur
async function initEditor() {
    editorCanvas = document.getElementById('editorCanvas');
    editorCtx = editorCanvas.getContext('2d');

    // Charger les niveaux depuis les fichiers et localStorage
    await levelManager.loadLevelsFromStorage();

    // Créer la palette de tuiles
    createTilePalette();

    // Charger la liste des niveaux
    updateLevelList();

    // Charger le niveau par défaut ou créer un nouveau
    const levelList = levelManager.getLevelList();
    if (levelList.length > 0) {
        const defaultLevel = levelList.includes('level_1') ? 'level_1' : levelList[0];
        loadEditorLevel(defaultLevel);
    } else {
        // Créer un premier niveau si aucun n'existe
        const level = levelManager.createEmptyLevel('level_1');
        levelManager.saveLevel('level_1', level);
        updateLevelList();
        loadEditorLevel('level_1');
    }

    // Événements du canvas
    editorCanvas.addEventListener('mousedown', handleCanvasMouseDown);
    editorCanvas.addEventListener('mousemove', handleCanvasMouseMove);
    editorCanvas.addEventListener('mouseup', handleCanvasMouseUp);
    editorCanvas.addEventListener('mouseleave', handleCanvasMouseUp);

    // Événements des boutons
    document.getElementById('btn-undo').addEventListener('click', undoLastAction);
    document.getElementById('btn-new').addEventListener('click', createNewLevel);
    document.getElementById('btn-load').addEventListener('click', loadFromFile);
    document.getElementById('file-input').addEventListener('change', handleFileLoad);
    document.getElementById('btn-save').addEventListener('click', saveCurrentLevel);
    document.getElementById('btn-test').addEventListener('click', testLevel);
    document.getElementById('btn-set-player-pos').addEventListener('click', togglePlayerPosMode);
    document.getElementById('btn-delete-level').addEventListener('click', deleteCurrentLevel);
    document.getElementById('btn-back').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Événements du modal coffre
    document.getElementById('btn-save-chest').addEventListener('click', saveChestContent);
    document.getElementById('btn-cancel-chest').addEventListener('click', closeChestModal);
    
    // Événements du modal panneau
    document.getElementById('btn-save-sign').addEventListener('click', saveSignMessage);
    document.getElementById('btn-cancel-sign').addEventListener('click', closeSignModal);
    
    // Événements du modal warp
    document.getElementById('btn-save-warp').addEventListener('click', saveWarpDestination);
    document.getElementById('btn-cancel-warp').addEventListener('click', closeWarpModal);
    
    // Événements des boutons +/-
    document.querySelectorAll('.btn-increment').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            chestItemCounts[type]++;
            updateChestDisplay();
        });
    });
    
    document.querySelectorAll('.btn-decrement').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (chestItemCounts[type] > 0) {
                chestItemCounts[type]--;
                updateChestDisplay();
            }
        });
    });

    // Événement de la liste des niveaux
    document.getElementById('level-select').addEventListener('change', (e) => {
        if (e.target.value) {
            loadEditorLevel(e.target.value);
        }
    });

    // Dessiner le niveau initial
    renderEditor();
}

// Créer la palette de tuiles
function createTilePalette() {
    const palette = document.getElementById('tile-palette');
    palette.innerHTML = '';

    const tileTypes = [
        TileTypes.GRASS,
        TileTypes.STONE,
        TileTypes.IRON,
        TileTypes.GOLD,
        TileTypes.WALL,
        TileTypes.CHEST,
        TileTypes.SIGN,
        TileTypes.WARP,
        TileTypes.BARRIER_H,
        TileTypes.BARRIER_V,
        TileTypes.BARRIER_L_NE,
        TileTypes.TREE,
        TileTypes.EMPTY
    ];

    tileTypes.forEach(tileType => {
        const tileItem = document.createElement('div');
        tileItem.className = 'tile-item';
        tileItem.dataset.type = String(tileType);
        if (tileType === selectedTile) {
            tileItem.classList.add('selected');
        }

        // Créer un mini canvas pour la tuile
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 32;
        miniCanvas.height = 32;
        const miniCtx = miniCanvas.getContext('2d');
        
        const tileImage = tileRenderer.getTile(tileType);
        miniCtx.imageSmoothingEnabled = false;
        miniCtx.drawImage(tileImage, 0, 0, 32, 32);

        tileItem.appendChild(miniCanvas);

        // Ajouter le nom
        const nameSpan = document.createElement('span');
        nameSpan.textContent = TileConfig[tileType].name;
        tileItem.appendChild(nameSpan);

        tileItem.addEventListener('click', () => {
            selectedTile = tileType;
            updatePaletteSelection();
        });

        palette.appendChild(tileItem);
    });
}

// Mettre à jour la sélection de la palette
function updatePaletteSelection() {
    const items = document.querySelectorAll('.tile-item');
    items.forEach(item => {
        if (item.dataset.type === String(selectedTile)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Mettre à jour la liste des niveaux
function updateLevelList() {
    const levelSelect = document.getElementById('level-select');
    levelSelect.innerHTML = '';

    const levels = levelManager.getLevelList();
    levels.forEach(levelName => {
        const option = document.createElement('option');
        option.value = levelName;
        option.textContent = formatLevelName(levelName);
        if (levelName === currentLevelName) {
            option.selected = true;
        }
        levelSelect.appendChild(option);
    });
}

// Charger un niveau dans l'éditeur
function loadEditorLevel(levelName) {
    levelManager.loadLevel(levelName);
    currentLevelName = levelName;
    
    if (levelManager.currentLevel) {
        document.getElementById('level-name').value = levelName;
        document.getElementById('start-x').value = levelManager.currentLevel.startX;
        document.getElementById('start-y').value = levelManager.currentLevel.startY;
        
        // Sauvegarder l'état initial pour détecter les changements
        initialLevelState = JSON.stringify(levelManager.currentLevel);
    }
    
    // Réinitialiser l'undo stack
    undoStack = [];
    
    renderEditor();
}

// Sauvegarder l'état actuel pour l'undo
function saveUndoState() {
    if (!levelManager.currentLevel) return;
    
    // Sauvegarder une copie profonde du niveau
    const state = JSON.parse(JSON.stringify(levelManager.currentLevel));
    undoStack.push(state);
    
    // Limiter la taille de la pile
    if (undoStack.length > MAX_UNDO) {
        undoStack.shift();
    }
}

// Annuler la dernière action
function undoLastAction() {
    if (undoStack.length === 0) {
        showEditorToast('Aucune action à annuler', 'info', 2000);
        return;
    }
    
    // Récupérer l'état précédent
    const previousState = undoStack.pop();
    levelManager.currentLevel = JSON.parse(JSON.stringify(previousState));
    
    renderEditor();
}

// Créer un nouveau niveau
function createNewLevel() {
    const name = 'level_' + (levelManager.getLevelList().length + 1);
    const level = levelManager.createEmptyLevel(name);
    levelManager.saveLevel(name, level);
    currentLevelName = name;
    updateLevelList();
    loadEditorLevel(name);
    showEditorToast('✓ Nouveau niveau créé: ' + formatLevelName(name), 'success', 2000);
}

// Charger un fichier depuis l'ordinateur
function loadFromFile() {
    const fileInput = document.getElementById('file-input');
    fileInput.click();
}

// Gérer le chargement du fichier sélectionné
function handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const levelData = JSON.parse(e.target.result);
            
            // Vérifier que c'est un niveau valide
            if (!levelData.name || !levelData.tiles) {
                showEditorToast('✗ Fichier invalide: format de niveau incorrect', 'error', 3000);
                return;
            }
            
            // Sauvegarder et charger le niveau
            const levelName = levelData.name;
            levelManager.saveLevel(levelName, levelData);
            updateLevelList();
            loadEditorLevel(levelName);
            showEditorToast('✓ Niveau chargé: ' + formatLevelName(levelName), 'success', 2000);
        } catch (error) {
            showEditorToast('✗ Erreur de lecture du fichier: ' + error.message, 'error', 3000);
        }
    };
    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de recharger le même fichier
    event.target.value = '';
}

// Sauvegarder le niveau actuel
async function saveCurrentLevel() {
    if (!levelManager.currentLevel) return;

    const name = document.getElementById('level-name').value;
    const startX = parseInt(document.getElementById('start-x').value);
    const startY = parseInt(document.getElementById('start-y').value);

    levelManager.currentLevel.name = name;
    levelManager.currentLevel.startX = startX;
    levelManager.currentLevel.startY = startY;

    // Vérifier s'il y a des changements
    const currentState = JSON.stringify(levelManager.currentLevel);
    if (currentState === initialLevelState && name === currentLevelName) {
        showEditorToast('ℹ️ Aucun changement à sauvegarder', 'info', 2000);
        return;
    }

    // Si le nom a changé, supprimer l'ancien et créer le nouveau
    if (name !== currentLevelName) {
        delete levelManager.levels[currentLevelName];
        currentLevelName = name;
    }

    levelManager.saveLevel(name, levelManager.currentLevel);
    updateLevelList();
    
    // Mettre à jour l'état initial
    initialLevelState = JSON.stringify(levelManager.currentLevel);

    // Sauvegarder dans le dossier levels
    const json = levelManager.exportLevel(name);
    if (json) {
        const success = await saveToLevelsFolder(name, json);
        if (success) {
            showEditorToast(`✓ Sauvegardé dans ${name}.json`, 'success', 2000);
        }
    }
}

// Tester le niveau
function testLevel() {
    saveCurrentLevel();
    window.location.href = 'index.html';
}


// Activer/désactiver le mode placement de position du joueur
function togglePlayerPosMode() {
    isSettingPlayerPos = !isSettingPlayerPos;
    const btn = document.getElementById('btn-set-player-pos');
    
    if (isSettingPlayerPos) {
        btn.classList.add('active');
        btn.textContent = '✓ Cliquez sur la grille';
    } else {
        btn.classList.remove('active');
        btn.textContent = '📍 Définir position du joueur';
    }
}

// Supprimer le niveau actuel
function deleteCurrentLevel() {
    const levelList = levelManager.getLevelList();
    
    if (levelList.length <= 1) {
        showEditorToast('Impossible de supprimer le dernier niveau!', 'error', 3000);
        return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le niveau "${currentLevelName}" ?\n\nN'oubliez pas de supprimer manuellement le fichier ${currentLevelName}.json du dossier levels/`)) {
        return;
    }
    
    // Supprimer du localStorage
    localStorage.removeItem(`minerquest_level_${currentLevelName}`);
    delete levelManager.levels[currentLevelName];
    levelManager.saveLevelsToStorage();
    
    // Charger le premier niveau disponible
    const remainingLevels = levelManager.getLevelList();
    if (remainingLevels.length > 0) {
        updateLevelList();
        loadEditorLevel(remainingLevels[0]);
        showEditorToast(`✓ Niveau supprimé. Supprimez ${currentLevelName}.json manuellement`, 'info', 4000);
    }
}

let currentEditingChestPos = null;

// Mettre à jour l'affichage des quantités dans le modal
function updateChestDisplay() {
    document.getElementById('chest-stone-value').textContent = chestItemCounts.stone;
    document.getElementById('chest-iron-value').textContent = chestItemCounts.iron;
    document.getElementById('chest-gold-value').textContent = chestItemCounts.gold;
}

// Ouvrir le modal d'édition de coffre
function openChestEditModal(x, y) {
    currentEditingChestPos = { x, y };
    const content = levelManager.getChestContent(x, y);
    
    // Réinitialiser les valeurs
    chestItemCounts = { stone: 0, iron: 0, gold: 0 };
    
    // Remplir avec les valeurs existantes
    if (content && content.items) {
        content.items.forEach(item => {
            if (item.type === 'stone') {
                chestItemCounts.stone = item.count;
            } else if (item.type === 'iron') {
                chestItemCounts.iron = item.count;
            } else if (item.type === 'gold') {
                chestItemCounts.gold = item.count;
            }
        });
    }
    
    updateChestDisplay();
    document.getElementById('modal-edit-chest').classList.add('show');
}

// Sauvegarder le contenu du coffre
function saveChestContent() {
    if (!currentEditingChestPos) return;
    
    const stone = chestItemCounts.stone;
    const iron = chestItemCounts.iron;
    const gold = chestItemCounts.gold;
    
    const items = [];
    if (stone > 0) items.push({ type: 'stone', name: 'Pierre', count: stone });
    if (iron > 0) items.push({ type: 'iron', name: 'Fer', count: iron });
    if (gold > 0) items.push({ type: 'gold', name: 'Or', count: gold });
    
    levelManager.setChestContent(currentEditingChestPos.x, currentEditingChestPos.y, { items });
    levelManager.saveLevelsToStorage();
    
    closeChestModal();
    renderEditor();
}

// Fermer le modal de coffre
function closeChestModal() {
    document.getElementById('modal-edit-chest').classList.remove('show');
    currentEditingChestPos = null;
}

let currentEditingSignPos = null;

// Ouvrir le modal d'édition de panneau
function openSignEditModal(x, y) {
    currentEditingSignPos = { x, y };
    const message = levelManager.getSignMessage(x, y);
    
    document.getElementById('sign-message-input').value = message || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    document.getElementById('modal-edit-sign').classList.add('show');
}

// Sauvegarder le message du panneau
function saveSignMessage() {
    if (!currentEditingSignPos) return;
    
    const message = document.getElementById('sign-message-input').value.trim();
    
    if (message) {
        levelManager.setSignMessage(currentEditingSignPos.x, currentEditingSignPos.y, message);
        levelManager.saveLevelsToStorage();
    }
    
    closeSignModal();
    renderEditor();
}

// Fermer le modal de panneau
function closeSignModal() {
    document.getElementById('modal-edit-sign').classList.remove('show');
    currentEditingSignPos = null;
}

let currentEditingWarpPos = null;

// Ouvrir le modal d'édition de warp
function openWarpEditModal(x, y) {
    currentEditingWarpPos = { x, y };
    const targetLevel = levelManager.getWarpDestination(x, y);
    
    const levelList = levelManager.getLevelList();
    let options = '<option value="">-- Aucune destination --</option>';
    levelList.forEach(levelName => {
        const selected = targetLevel === levelName ? 'selected' : '';
        options += `<option value="${levelName}" ${selected}>${levelName}</option>`;
    });
    
    document.getElementById('warp-level-select').innerHTML = options;
    document.getElementById('modal-edit-warp').classList.add('show');
}

// Sauvegarder la destination du warp
function saveWarpDestination() {
    if (!currentEditingWarpPos) return;
    
    const targetLevel = document.getElementById('warp-level-select').value;
    
    if (targetLevel) {
        levelManager.setWarpDestination(currentEditingWarpPos.x, currentEditingWarpPos.y, targetLevel);
        levelManager.saveLevelsToStorage();
    }
    
    closeWarpModal();
    renderEditor();
}

// Fermer le modal de warp
function closeWarpModal() {
    document.getElementById('modal-edit-warp').classList.remove('show');
    currentEditingWarpPos = null;
}

// Gestion de la souris sur le canvas
function handleCanvasMouseDown(e) {
    const rect = editorCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / 16));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / 16));
    
    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
        // Mode placement de la position du joueur
        if (isSettingPlayerPos) {
            levelManager.currentLevel.startX = x;
            levelManager.currentLevel.startY = y;
            document.getElementById('start-x').value = x;
            document.getElementById('start-y').value = y;
            togglePlayerPosMode(); // Désactiver le mode
            renderEditor();
            return;
        }
        
        const tileType = levelManager.getTile(x, y);
        
        // Rotation de barrière L: si on clique sur une barrière L avec une barrière L sélectionnée
        const lBarriers = [TileTypes.BARRIER_L_NE, TileTypes.BARRIER_L_SE, TileTypes.BARRIER_L_SW, TileTypes.BARRIER_L_NW];
        if (lBarriers.includes(tileType) && lBarriers.includes(selectedTile)) {
            saveUndoState();
            // Rotation 90° sens horaire: NE -> SE -> SW -> NW -> NE
            let newTile;
            if (tileType === TileTypes.BARRIER_L_NE) newTile = TileTypes.BARRIER_L_SE;
            else if (tileType === TileTypes.BARRIER_L_SE) newTile = TileTypes.BARRIER_L_SW;
            else if (tileType === TileTypes.BARRIER_L_SW) newTile = TileTypes.BARRIER_L_NW;
            else if (tileType === TileTypes.BARRIER_L_NW) newTile = TileTypes.BARRIER_L_NE;
            levelManager.setTile(x, y, newTile);
            renderEditor();
            return;
        }
        
        // Vérifier si on clique sur un coffre déjà placé
        if (tileType === TileTypes.CHEST) {
            // Si la tuile sélectionnée est aussi un coffre, ouvrir le modal d'édition
            if (selectedTile === TileTypes.CHEST) {
                openChestEditModal(x, y);
                return;
            }
            // Sinon, on remplace le coffre (suppression du contenu)
        }
        
        // Vérifier si on clique sur un panneau déjà placé
        if (tileType === TileTypes.SIGN) {
            // Si la tuile sélectionnée est aussi un panneau, ouvrir le modal d'édition
            if (selectedTile === TileTypes.SIGN) {
                openSignEditModal(x, y);
                return;
            }
            // Sinon, on remplace le panneau (suppression du message)
        }
        
        // Vérifier si on clique sur un warp déjà placé
        if (tileType === TileTypes.WARP) {
            // Si la tuile sélectionnée est aussi un warp, ouvrir le sélecteur de niveau
            if (selectedTile === TileTypes.WARP) {
                openWarpEditModal(x, y);
                return;
            }
            // Sinon, on remplace le warp (suppression de la destination)
        }
        
        // Mode dessin normal - vérifier si c'est sur les bords
        if (x === 0 || x === 15 || y === 0 || y === 15) {
            // Ne rien faire sur les bords
            return;
        }
        
        saveUndoState();
        
        // Si on remplace un coffre, supprimer son contenu
        if (tileType === TileTypes.CHEST && selectedTile !== TileTypes.CHEST) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.chestData && levelManager.currentLevel.chestData[key]) {
                delete levelManager.currentLevel.chestData[key];
            }
        }
        
        // Si on remplace un panneau, supprimer son message
        if (tileType === TileTypes.SIGN && selectedTile !== TileTypes.SIGN) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.signData && levelManager.currentLevel.signData[key]) {
                delete levelManager.currentLevel.signData[key];
            }
        }
        
        isDrawing = true;
        paintTile(e);
    }
}

function handleCanvasMouseMove(e) {
    if (isDrawing) {
        paintTile(e);
    }
}

function handleCanvasMouseUp() {
    isDrawing = false;
}

// Peindre une tuile
function paintTile(e) {
    if (isSettingPlayerPos) return;
    
    const rect = editorCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / 16));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / 16));

    // Vérifier que les coordonnées sont dans la grille valide
    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
        // Empêcher la modification des contours (murs extérieurs)
        if (x === 0 || x === 15 || y === 0 || y === 15) {
            return; // Ne rien faire sur les bords
        }
        // Si on remplace un coffre, supprimer son contenu associé
        const existingTile = levelManager.getTile(x, y);
        if (existingTile === TileTypes.CHEST && selectedTile !== TileTypes.CHEST) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.chestData && levelManager.currentLevel.chestData[key]) {
                delete levelManager.currentLevel.chestData[key];
            }
        }

        // Si on remplace un panneau, supprimer son message associé
        if (existingTile === TileTypes.SIGN && selectedTile !== TileTypes.SIGN) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.signData && levelManager.currentLevel.signData[key]) {
                delete levelManager.currentLevel.signData[key];
            }
        }

        // Si on remplace un warp, supprimer sa destination associée
        if (existingTile === TileTypes.WARP && selectedTile !== TileTypes.WARP) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.warpData && levelManager.currentLevel.warpData[key]) {
                delete levelManager.currentLevel.warpData[key];
            }
        }

        levelManager.setTile(x, y, selectedTile);
        renderEditor();
    }
}

// Rendu de l'éditeur
function renderEditor() {
    if (!levelManager.currentLevel) return;

    // Effacer le canvas
    editorCtx.fillStyle = '#1a1a1a';
    editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

    // Dessiner les tuiles
    const level = levelManager.currentLevel;
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            const tileType = level.tiles[y][x];
            const tileImage = tileRenderer.getTile(tileType);
            
            editorCtx.drawImage(
                tileImage,
                x * 32,
                y * 32,
                32,
                32
            );
        }
    }

    // Dessiner la grille
    editorCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    editorCtx.lineWidth = 1;
    for (let x = 0; x <= 16; x++) {
        editorCtx.beginPath();
        editorCtx.moveTo(x * 32, 0);
        editorCtx.lineTo(x * 32, 512);
        editorCtx.stroke();
    }
    for (let y = 0; y <= 16; y++) {
        editorCtx.beginPath();
        editorCtx.moveTo(0, y * 32);
        editorCtx.lineTo(512, y * 32);
        editorCtx.stroke();
    }

    // Dessiner la position de départ du joueur
    if (level.startX !== undefined && level.startY !== undefined) {
        editorCtx.fillStyle = 'rgba(255, 107, 107, 0.5)';
        editorCtx.fillRect(level.startX * 32, level.startY * 32, 32, 32);
        
        editorCtx.strokeStyle = '#ff6b6b';
        editorCtx.lineWidth = 3;
        editorCtx.strokeRect(level.startX * 32, level.startY * 32, 32, 32);
        
        // Ajouter un icône de joueur
        editorCtx.fillStyle = '#ff6b6b';
        editorCtx.font = 'bold 20px Arial';
        editorCtx.textAlign = 'center';
        editorCtx.textBaseline = 'middle';
        editorCtx.fillText('👤', level.startX * 32 + 16, level.startY * 32 + 16);
    }
    
    // Indicateur de mode placement joueur
    if (isSettingPlayerPos) {
        editorCtx.fillStyle = 'rgba(255, 107, 107, 0.3)';
        editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
        
        editorCtx.fillStyle = '#ffffff';
        editorCtx.font = 'bold 24px Arial';
        editorCtx.textAlign = 'center';
        editorCtx.fillText('Cliquez pour placer le joueur', editorCanvas.width / 2, 30);
    }
    
    // Overlay pour les zones non modifiables (contours)
    if (!isSettingPlayerPos) {
        editorCtx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        // Bord haut
        editorCtx.fillRect(0, 0, 512, 32);
        // Bord bas
        editorCtx.fillRect(0, 480, 512, 32);
        // Bord gauche
        editorCtx.fillRect(0, 0, 32, 512);
        // Bord droit
        editorCtx.fillRect(480, 0, 32, 512);
    }
}

// Démarrer l'éditeur quand la page est chargée
window.addEventListener('DOMContentLoaded', initEditor);
