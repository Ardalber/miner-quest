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
let selectedTile = 0; // EMPTY par défaut
let currentLevelName = 'level_1';
let isDrawing = false;
let isSettingPlayerPos = false;
let undoStack = [];
const MAX_UNDO = 20;
let chestItemCounts = { stone: 0, iron: 0, gold: 0 };
let initialLevelState = null; // Pour détecter les changements
let levelsFolderHandle = null; // Handle du dossier levels pour l'API File System Access
let canvasScale = 1; // Scale du canvas pour les calculs de souris
let currentLayer = 'foreground'; // 'foreground' ou 'background'

// Initialisation de l'éditeur
async function initEditor() {
    editorCanvas = document.getElementById('editorCanvas');
    editorCtx = editorCanvas.getContext('2d');

    // IMPORTANT: Restaurer les tuiles personnalisées AVANT de charger les niveaux
    if (typeof restoreCustomTilesToConfig === 'function') {
        restoreCustomTilesToConfig();
        // Vider le cache du renderer pour forcer le rechargement
        if (tileRenderer && typeof tileRenderer.clearCache === 'function') {
            tileRenderer.clearCache();
        }
    }

    // Mettre en place un callback pour redraw quand les images se chargent
    onTileImageLoaded = (tileId) => {
        console.log('Image chargée pour tuile:', tileId);
        if (typeof renderEditor === 'function') {
            renderEditor();
        }
    };

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
    // Système d'annulation amélioré avec maintien du clic
    let undoInterval = null;
    const btnUndo = document.getElementById('btn-undo');
    
    btnUndo.addEventListener('mousedown', () => {
        undoLastAction(); // Première annulation immédiate
        // Démarrer l'annulation continue après 500ms
        undoInterval = setTimeout(() => {
            undoInterval = setInterval(() => {
                if (undoStack.length > 0) {
                    undoLastAction();
                }
            }, 100); // Annuler toutes les 100ms
        }, 500);
    });
    
    btnUndo.addEventListener('mouseup', () => {
        if (undoInterval) {
            clearTimeout(undoInterval);
            clearInterval(undoInterval);
            undoInterval = null;
        }
    });
    
    btnUndo.addEventListener('mouseleave', () => {
        if (undoInterval) {
            clearTimeout(undoInterval);
            clearInterval(undoInterval);
            undoInterval = null;
        }
    });
    
    // Raccourci clavier Ctrl+Z
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undoLastAction();
        }
    });
    document.getElementById('btn-new').addEventListener('click', createNewLevel);
    document.getElementById('btn-load').addEventListener('click', loadFromFile);
    document.getElementById('file-input').addEventListener('change', handleFileLoad);
    document.getElementById('btn-save').addEventListener('click', saveCurrentLevel);
    
    // Boutons de sélection de couche
    document.getElementById('btn-layer-foreground').addEventListener('click', () => {
        currentLayer = 'foreground';
        document.getElementById('btn-layer-foreground').classList.add('active');
        document.getElementById('btn-layer-background').classList.remove('active');
        document.getElementById('layer-indicator').textContent = 'Couche active: Dessous (sera caché par le dessus)';
        showEditorToast('Mode: Dessous - Placez ce qui sera caché (minerais, coffres...)', 'info', 2500);
        renderEditor(); // Rerender pour appliquer les effets visuels
    });
    
    document.getElementById('btn-layer-background').addEventListener('click', () => {
        currentLayer = 'background';
        document.getElementById('btn-layer-background').classList.add('active');
        document.getElementById('btn-layer-foreground').classList.remove('active');
        document.getElementById('layer-indicator').textContent = 'Couche active: Dessus (visible et minable)';
        showEditorToast('Mode: Dessus - Placez ce qui sera visible (herbe, terre...)', 'info', 2500);
        renderEditor(); // Rerender pour appliquer les effets visuels
    });
    document.getElementById('btn-test').addEventListener('click', testLevel);
    document.getElementById('btn-set-player-pos').addEventListener('click', togglePlayerPosMode);
    document.getElementById('btn-delete-level').addEventListener('click', deleteCurrentLevel);
    document.getElementById('btn-tiles').addEventListener('click', () => {
        sessionStorage.setItem('tileEditorSource', 'editor');
        window.location.href = 'tile_editor.html';
    });
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
    
    // Événements du modal de création de niveau
    document.getElementById('btn-create-new-level').addEventListener('click', confirmCreateNewLevel);
    document.getElementById('btn-cancel-new-level').addEventListener('click', closeNewLevelModal);
    
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

    // Commencer avec la tuile EMPTY seulement
    const tileTypes = [TileTypes.EMPTY];
    
    // Ajouter les tuiles personnalisées depuis TileConfig
    for (const typeId in TileConfig) {
        const id = parseInt(typeId);
        // Ajouter seulement les tuiles personnalisées (ID >= 100)
        if (id >= 100) {
            tileTypes.push(id);
        }
    }

    tileTypes.forEach(tileType => {
        const tileItem = document.createElement('div');
        tileItem.className = 'tile-item';
        tileItem.dataset.type = String(tileType);
        if (tileType === selectedTile) {
            tileItem.classList.add('selected');
        }
        
        // Créer un mini canvas pour cette tuile
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 32;
        miniCanvas.height = 32;
        miniCanvas.className = 'tile-preview-canvas';
        const miniCtx = miniCanvas.getContext('2d');
        
        const tileImage = tileRenderer.getTile(tileType);
        miniCtx.imageSmoothingEnabled = false;
        miniCtx.drawImage(tileImage, 0, 0, 32, 32);

        tileItem.appendChild(miniCanvas);

        // Ajouter le nom
        const nameSpan = document.createElement('span');
        nameSpan.textContent = TileConfig[tileType]?.name || '?';
        tileItem.appendChild(nameSpan);

        tileItem.addEventListener('click', () => {
            selectedTile = tileType;
            updatePaletteSelection();
        });

        palette.appendChild(tileItem);
    });
    
    // Mettre en place un callback pour redraw les miniatures quand les images se chargent
    onTileImageLoaded = (tileId) => {
        const tileItem = document.querySelector(`[data-type="${tileId}"]`);
        if (tileItem) {
            const canvas = tileItem.querySelector('canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const tileImage = tileRenderer.getTile(tileId);
                ctx.clearRect(0, 0, 32, 32);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(tileImage, 0, 0, 32, 32);
            }
        }
        // Repeindre l'éditeur si une image se charge après un reload
        if (typeof renderEditor === 'function') {
            renderEditor();
        }
    };
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
        
        // Mettre à jour les limites des inputs selon la taille du niveau
        document.getElementById('start-x').max = levelManager.currentLevel.width - 1;
        document.getElementById('start-y').max = levelManager.currentLevel.height - 1;
        
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
function undoLastAction(showToast = true) {
    if (undoStack.length === 0) {
        if (showToast) {
            showEditorToast('Aucune action à annuler', 'info', 2000);
        }
        return false;
    }
    
    // Récupérer l'état précédent
    const previousState = undoStack.pop();
    levelManager.currentLevel = JSON.parse(JSON.stringify(previousState));
    
    renderEditor();
    return true;
}

// Créer un nouveau niveau
function createNewLevel() {
    // Ouvrir le modal de création de niveau
    document.getElementById('modal-new-level').classList.add('show');
}

// Fermer le modal de création de niveau
function closeNewLevelModal() {
    document.getElementById('modal-new-level').classList.remove('show');
}

// Confirmer la création d'un nouveau niveau
function confirmCreateNewLevel() {
    const levelType = document.getElementById('new-level-type').value;
    const width = parseInt(document.getElementById('new-level-width').value);
    const height = parseInt(document.getElementById('new-level-height').value);
    
    // Validation
    if (width < 8 || width > 32 || height < 8 || height > 32) {
        showEditorToast('✗ Les dimensions doivent être entre 8 et 32', 'error', 3000);
        return;
    }
    
    const name = 'level_' + (levelManager.getLevelList().length + 1);
    const level = levelManager.createEmptyLevel(name, width, height);
    level.type = levelType; // Ajouter le type de niveau (topdown ou platformer)
    
    levelManager.saveLevel(name, level);
    currentLevelName = name;
    updateLevelList();
    loadEditorLevel(name);
    closeNewLevelModal();
    showEditorToast(`✓ Nouveau niveau ${levelType} créé: ${formatLevelName(name)} (${width}x${height})`, 'success', 2000);
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

    // Si le nom a changé, supprimer l'ancien et créer le nouveau
    if (name !== currentLevelName) {
        delete levelManager.levels[currentLevelName];
    }

    levelManager.saveLevel(name, levelManager.currentLevel);
    
    // Mettre à jour currentLevelName AVANT updateLevelList
    currentLevelName = name;
    
    // Mettre à jour la liste pour que la sélection soit correcte
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
    
    // Ne PAS recharger le niveau - l'affichage reste inchangé
}

// Tester le niveau
async function testLevel() {
    try {
        // Sauvegarder le niveau actuel
        await saveCurrentLevel();
        showEditorToast(`✓ Niveau "${currentLevelName}" sauvegardé - Lancement du test...`, 'success', 1500);
        
        // Attendre un peu avant de rediriger
        setTimeout(() => {
            // Passer le niveau en cours comme paramètre et le mode test
            window.location.href = `index.html?level=${encodeURIComponent(currentLevelName)}&test=1`;
        }, 500);
    } catch (err) {
        console.error('Erreur lors du test du niveau:', err);
        showEditorToast('✗ Erreur lors de la sauvegarde du niveau', 'error', 3000);
    }
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
async function deleteCurrentLevel() {
    const levelList = levelManager.getLevelList();
    
    if (levelList.length <= 1) {
        showEditorToast('Impossible de supprimer le dernier niveau!', 'error', 3000);
        return;
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le niveau "${currentLevelName}" ?`)) {
        return;
    }
    
    const levelToDelete = currentLevelName;
    
    // Supprimer du localStorage
    localStorage.removeItem(`minerquest_level_${levelToDelete}`);
    delete levelManager.levels[levelToDelete];
    levelManager.saveLevelsToStorage();
    
    // Obtenir la nouvelle liste APRÈS suppression
    const remainingLevels = levelManager.getLevelList();
    
    // Tenter de supprimer le fichier du dossier levels
    let fileDeleted = false;
    if (!levelsFolderHandle) {
        // Demander l'accès au dossier si pas encore fait
        const granted = await requestLevelsFolderAccess();
        if (granted && levelsFolderHandle) {
            try {
                await levelsFolderHandle.removeEntry(`${levelToDelete}.json`);
                fileDeleted = true;
            } catch (err) {
                console.warn('Impossible de supprimer le fichier:', err);
            }
        }
    } else {
        try {
            await levelsFolderHandle.removeEntry(`${levelToDelete}.json`);
            fileDeleted = true;
        } catch (err) {
            console.warn('Impossible de supprimer le fichier:', err);
        }
    }
    
    if (fileDeleted) {
        showEditorToast(`✓ Niveau ${levelToDelete} et fichier JSON supprimés`, 'success', 3000);
    } else {
        showEditorToast(`✓ Niveau supprimé de la mémoire (fichier non supprimé)`, 'info', 3000);
    }
    
    // Charger le premier niveau disponible
    if (remainingLevels.length > 0) {
        loadEditorLevel(remainingLevels[0]);
    }
    
    // Mettre à jour la liste des niveaux APRÈS le chargement
    updateLevelList();
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
    
    // Si aucun item n'est présent, supprimer les données du coffre
    const key = `${currentEditingChestPos.x}_${currentEditingChestPos.y}`;
    if (items.length === 0) {
        if (levelManager.currentLevel.chestData && levelManager.currentLevel.chestData[key]) {
            delete levelManager.currentLevel.chestData[key];
        }
    } else {
        levelManager.setChestContent(currentEditingChestPos.x, currentEditingChestPos.y, { items });
    }
    
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
    const key = `${currentEditingSignPos.x}_${currentEditingSignPos.y}`;
    
    if (message) {
        levelManager.setSignMessage(currentEditingSignPos.x, currentEditingSignPos.y, message);
    } else {
        // Si le message est vide, supprimer les données du panneau
        if (levelManager.currentLevel.signData && levelManager.currentLevel.signData[key]) {
            delete levelManager.currentLevel.signData[key];
        }
    }
    
    levelManager.saveLevelsToStorage();
    
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
    console.log('🌀 openWarpEditModal CALLED with x=' + x + ', y=' + y);
    currentEditingWarpPos = { x, y };
    console.log('🌀 currentEditingWarpPos SET to:', currentEditingWarpPos);
    const targetLevel = levelManager.getWarpDestination(x, y);
    
    console.log('🌀 DEBUG Open Warp Modal:', {
        position: { x, y },
        currentDest: targetLevel,
        levelName: levelManager.currentLevel?.name
    });
    
    // Afficher le niveau actuel dans le titre du modal
    const modalTitle = document.getElementById('warp-modal-title');
    if (modalTitle && levelManager.currentLevel) {
        modalTitle.textContent = `🌀 Destination du warp (Niveau actuel: ${levelManager.currentLevel.name})`;
    }
    
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
    console.log('💾 SAVE WARP CALLED with currentEditingWarpPos:', currentEditingWarpPos);
    
    if (!currentEditingWarpPos) {
        console.log('⚠️ currentEditingWarpPos is null!');
        return;
    }
    
    const targetLevel = document.getElementById('warp-level-select').value;
    
    console.log('💾 DEBUG Save Warp:', {
        position: currentEditingWarpPos,
        selectedLevel: targetLevel,
        currentLevelName: levelManager.currentLevel?.name
    });
    
    if (targetLevel) {
        levelManager.setWarpDestination(currentEditingWarpPos.x, currentEditingWarpPos.y, targetLevel);
        const key = `${currentEditingWarpPos.x}_${currentEditingWarpPos.y}`;
        const dest = levelManager.getWarpDestination(currentEditingWarpPos.x, currentEditingWarpPos.y);
        const warpData = levelManager.currentLevel?.warpData || {};
        
        console.log('🔍 WARP DATA CHECK:');
        console.log('  Key we just set: "' + key + '"');
        console.log('  Value retrieved: "' + dest + '"');
        console.log('  All warp data:', warpData);
        console.log('  Key exists in warpData: ' + (key in warpData));
        console.log('  Value at key: "' + warpData[key] + '"');
        
        levelManager.saveLevelsToStorage();
        console.log('💾 Levels saved to storage');
    } else {
        console.log('⚠️ No level selected');
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
    if (!levelManager.currentLevel) return;
    const level = levelManager.currentLevel;
    const rect = editorCanvas.getBoundingClientRect();
    const tileSize = 32;
    
    // S'assurer que canvasScale est correct (recalculer si nécessaire)
    if (canvasScale <= 0 || Math.abs(canvasScale - (editorCanvas.width / rect.width)) > 0.001) {
        canvasScale = editorCanvas.width / rect.width;
    }
    
    // Calculer les coordonnées en pixels du canvas
    const canvasX = (e.clientX - rect.left) * canvasScale;
    const canvasY = (e.clientY - rect.top) * canvasScale;
    
    // Convertir en coordonnées de tuiles (arrondir vers le bas)
    let x = Math.floor(canvasX / tileSize);
    let y = Math.floor(canvasY / tileSize);
    
    // Clipper aux limites du niveau
    x = Math.max(0, Math.min(x, level.width - 1));
    y = Math.max(0, Math.min(y, level.height - 1));
    
    if (x >= 0 && x < level.width && y >= 0 && y < level.height) {
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
        
        // Vérifier la tuile existante SELON LA COUCHE ACTIVE
        const tileType = currentLayer === 'background' 
            ? levelManager.getBackgroundTile(x, y) 
            : levelManager.getTile(x, y);
        
        // Vérifier si on clique sur un coffre déjà placé (seulement sur couche Dessous)
        if (currentLayer === 'foreground' && TileConfig[tileType] && TileConfig[tileType].isChest) {
            // Si la tuile sélectionnée est aussi un coffre, ouvrir le modal d'édition
            console.log('Coffre détecté:', { tileType, selectedTile, 
                tileConfig: TileConfig[tileType], 
                selectedConfig: TileConfig[selectedTile] });
            if (TileConfig[selectedTile] && TileConfig[selectedTile].isChest) {
                openChestEditModal(x, y);
                return;
            }
            // Sinon, on remplace le coffre (suppression du contenu)
        }
        
        // Vérifier si on clique sur un panneau déjà placé (seulement sur couche Dessous)
        if (currentLayer === 'foreground' && TileConfig[tileType] && TileConfig[tileType].isSign) {
            // Si la tuile sélectionnée est aussi un panneau, ouvrir le modal d'édition
            if (TileConfig[selectedTile] && TileConfig[selectedTile].isSign) {
                openSignEditModal(x, y);
                return;
            }
            // Sinon, on remplace le panneau (suppression du message)
        }
        
        // Vérifier si on clique sur un warp déjà placé (seulement sur couche Dessous)
        if (currentLayer === 'foreground' && TileConfig[tileType] && TileConfig[tileType].isWarp) {
            // Toujours ouvrir le modal de warp, peu importe la tuile sélectionnée
            openWarpEditModal(x, y);
            return;
            // Sinon, on remplace le warp (suppression de la destination)
        }
        
        saveUndoState();
        
        // Si on remplace un coffre, supprimer son contenu (seulement sur couche Dessous)
        if (currentLayer === 'foreground' && (TileConfig[tileType] && TileConfig[tileType].isChest) && 
            (!TileConfig[selectedTile] || !TileConfig[selectedTile].isChest)) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.chestData && levelManager.currentLevel.chestData[key]) {
                delete levelManager.currentLevel.chestData[key];
            }
        }
        
        // Si on remplace un panneau, supprimer son message (seulement sur couche Dessous)
        if (currentLayer === 'foreground' && (TileConfig[tileType] && TileConfig[tileType].isSign) && 
            (!TileConfig[selectedTile] || !TileConfig[selectedTile].isSign)) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.signData && levelManager.currentLevel.signData[key]) {
                delete levelManager.currentLevel.signData[key];
            }
        }
        
        // Si on remplace un warp, supprimer sa destination (seulement sur couche Dessous)
        if (currentLayer === 'foreground' && (TileConfig[tileType] && TileConfig[tileType].isWarp) && 
            (!TileConfig[selectedTile] || !TileConfig[selectedTile].isWarp)) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.warpData && levelManager.currentLevel.warpData[key]) {
                delete levelManager.currentLevel.warpData[key];
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
    if (isSettingPlayerPos || !levelManager.currentLevel) return;
    
    const level = levelManager.currentLevel;
    const rect = editorCanvas.getBoundingClientRect();
    const tileSize = 32;
    
    // S'assurer que canvasScale est correct (recalculer si nécessaire)
    if (canvasScale <= 0 || Math.abs(canvasScale - (editorCanvas.width / rect.width)) > 0.001) {
        canvasScale = editorCanvas.width / rect.width;
    }
    
    // Calculer les coordonnées en pixels du canvas
    const canvasX = (e.clientX - rect.left) * canvasScale;
    const canvasY = (e.clientY - rect.top) * canvasScale;
    
    // Convertir en coordonnées de tuiles (arrondir vers le bas)
    let x = Math.floor(canvasX / tileSize);
    let y = Math.floor(canvasY / tileSize);
    
    // Clipper aux limites du niveau
    x = Math.max(0, Math.min(x, level.width - 1));
    y = Math.max(0, Math.min(y, level.height - 1));

    // Vérifier que les coordonnées sont dans la grille valide
    if (x >= 0 && x < level.width && y >= 0 && y < level.height) {
        // Vérifier la tuile existante SELON LA COUCHE ACTIVE
        const existingTile = currentLayer === 'background' 
            ? levelManager.getBackgroundTile(x, y) 
            : levelManager.getTile(x, y);
        const existingConfig = TileConfig[existingTile];
        
        // Sauvegarder l'état pour l'undo
        saveUndoState();
        
        // Si on remplace un coffre, supprimer son contenu associé (seulement sur la couche Dessous)
        if (currentLayer === 'foreground' && (existingConfig && existingConfig.isChest) && 
            (!TileConfig[selectedTile] || !TileConfig[selectedTile].isChest)) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.chestData && levelManager.currentLevel.chestData[key]) {
                delete levelManager.currentLevel.chestData[key];
            }
        }

        // Si on remplace un panneau, supprimer son message associé (seulement sur la couche Dessous)
        if (currentLayer === 'foreground' && (TileConfig[existingTile] && TileConfig[existingTile].isSign) && 
            (!TileConfig[selectedTile] || !TileConfig[selectedTile].isSign)) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.signData && levelManager.currentLevel.signData[key]) {
                delete levelManager.currentLevel.signData[key];
            }
        }

        // Si on remplace un warp, supprimer sa destination associée (seulement sur la couche Dessous)
        if (currentLayer === 'foreground' && (TileConfig[existingTile] && TileConfig[existingTile].isWarp) && 
            (!TileConfig[selectedTile] || !TileConfig[selectedTile].isWarp)) {
            const key = `${x}_${y}`;
            if (levelManager.currentLevel.warpData && levelManager.currentLevel.warpData[key]) {
                delete levelManager.currentLevel.warpData[key];
            }
        }

        // Placer la tuile sur la couche appropriée
        if (currentLayer === 'background') {
            levelManager.setBackgroundTile(x, y, selectedTile);
        } else {
            levelManager.setTile(x, y, selectedTile);
        }
        renderEditor();
    }
}

// Rendu de l'éditeur
function renderEditor() {
    if (!levelManager.currentLevel) return;

    const level = levelManager.currentLevel;
    const tileSize = 32; // Taille fixe de 32x32 pixels
    
    // Adapter la taille du canvas à la taille du niveau
    editorCanvas.width = level.width * tileSize;
    editorCanvas.height = level.height * tileSize;
    
    // Calculer et stocker le scale du canvas (ratio affichage/interne)
    const rect = editorCanvas.getBoundingClientRect();
    canvasScale = editorCanvas.width / rect.width;

    // Effacer le canvas
    editorCtx.fillStyle = '#1a1a1a';
    editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

    // Dessiner d'abord l'AVANT-PLAN (tiles) en dessous
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            const tileType = level.tiles[y][x];
            
            if (tileType !== 0) { // Ne dessiner que si ce n'est pas EMPTY
                const tileImage = tileRenderer.getTile(tileType);
                
                // Si on est en mode arrière-plan, atténuer l'avant-plan pour mieux voir où placer
                if (currentLayer === 'background') {
                    editorCtx.globalAlpha = 0.3;
                }
                
                editorCtx.drawImage(
                    tileImage,
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize
                );
                editorCtx.globalAlpha = 1.0; // Restaurer l'opacité
            }
        }
    }

    // Dessiner ensuite l'ARRIÈRE-PLAN (backgroundTiles) PAR-DESSUS
    if (level.backgroundTiles) {
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const bgTileType = level.backgroundTiles[y][x];
                if (bgTileType !== 0) { // Ne dessiner que si ce n'est pas EMPTY
                    const bgTileImage = tileRenderer.getTile(bgTileType);
                    // Si on est en mode avant-plan, atténuer l'arrière-plan pour voir ce qu'il y a dessous
                    if (currentLayer === 'foreground') {
                        editorCtx.globalAlpha = 0.4;
                    }
                    editorCtx.drawImage(
                        bgTileImage,
                        x * tileSize,
                        y * tileSize,
                        tileSize,
                        tileSize
                    );
                    editorCtx.globalAlpha = 1.0;
                }
            }
        }
    }

    // Dessiner la grille
    editorCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    editorCtx.lineWidth = 1;
    for (let x = 0; x <= level.width; x++) {
        editorCtx.beginPath();
        editorCtx.moveTo(x * tileSize, 0);
        editorCtx.lineTo(x * tileSize, level.height * tileSize);
        editorCtx.stroke();
    }
    for (let y = 0; y <= level.height; y++) {
        editorCtx.beginPath();
        editorCtx.moveTo(0, y * tileSize);
        editorCtx.lineTo(level.width * tileSize, y * tileSize);
        editorCtx.stroke();
    }

    // Dessiner la position de départ du joueur
    if (level.startX !== undefined && level.startY !== undefined) {
        editorCtx.fillStyle = 'rgba(255, 107, 107, 0.5)';
        editorCtx.fillRect(level.startX * tileSize, level.startY * tileSize, tileSize, tileSize);
        
        editorCtx.strokeStyle = '#ff6b6b';
        editorCtx.lineWidth = 3;
        editorCtx.strokeRect(level.startX * tileSize, level.startY * tileSize, tileSize, tileSize);
        
        // Ajouter un icône de joueur
        editorCtx.fillStyle = '#ff6b6b';
        editorCtx.font = 'bold 20px Arial';
        editorCtx.textAlign = 'center';
        editorCtx.textBaseline = 'middle';
        editorCtx.fillText('👤', level.startX * tileSize + tileSize/2, level.startY * tileSize + tileSize/2);
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
}

// Démarrer l'éditeur quand la page est chargée
window.addEventListener('DOMContentLoaded', initEditor);
