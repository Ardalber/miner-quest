// ========== ÉDITEUR DE TUILES AVEC DESSIN ==========

// ========== GESTIONNAIRE DE PIXELS ==========

class PixelCanvas {
    constructor(canvasId, width = 32, height = 32, scale = 10) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.pixelWidth = width;  // 32
        this.pixelHeight = height; // 32
        this.scale = scale;       // 10x
        this.pixels = [];
        this.history = [];
        this.brushSize = 2;       // Taille par défaut
        
        // Initialiser la grille
        this.initPixels();
        this.setupEvents();
        this.draw();
    }

    initPixels() {
        this.pixels = Array(this.pixelWidth * this.pixelHeight).fill('#ffffff');
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
        this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);
    }

    getPixelAt(x, y) {
        const pixelX = Math.floor(x / this.scale);
        const pixelY = Math.floor(y / this.scale);
        
        if (pixelX < 0 || pixelX >= this.pixelWidth || 
            pixelY < 0 || pixelY >= this.pixelHeight) {
            return null;
        }
        
        return { x: pixelX, y: pixelY };
    }

    handleMouseDown(e) {
        this.isDrawing = true;
        this.saveHistory();
        this.drawPixel(e);
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        this.drawPixel(e);
    }

    drawPixel(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixel = this.getPixelAt(x, y);
        if (!pixel) return;

        const brushSize = this.brushSize || 2;
        const color = document.getElementById('brush-color').value;

        // Dessiner avec la taille du pinceau
        for (let dx = 0; dx < brushSize; dx++) {
            for (let dy = 0; dy < brushSize; dy++) {
                const px = pixel.x + dx;
                const py = pixel.y + dy;
                
                if (px < this.pixelWidth && py < this.pixelHeight) {
                    const index = py * this.pixelWidth + px;
                    this.pixels[index] = color;
                }
            }
        }

        // Ajouter la couleur aux récentes
        addRecentColor(color);

        this.draw();
    }

    draw() {
        this.ctx.fillStyle = '#1e1e1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner les pixels
        for (let i = 0; i < this.pixels.length; i++) {
            const x = (i % this.pixelWidth) * this.scale;
            const y = Math.floor(i / this.pixelWidth) * this.scale;
            
            this.ctx.fillStyle = this.pixels[i];
            this.ctx.fillRect(x, y, this.scale, this.scale);
        }

        // Grille
        this.ctx.strokeStyle = '#3e3e42';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.pixelWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.scale, 0);
            this.ctx.lineTo(x * this.scale, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.pixelHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.scale);
            this.ctx.lineTo(this.canvas.width, y * this.scale);
            this.ctx.stroke();
        }
    }

    saveHistory() {
        this.history.push([...this.pixels]);
    }

    clear() {
        this.saveHistory();
        this.initPixels();
        this.draw();
    }

    fill(color) {
        this.saveHistory();
        this.pixels = this.pixels.fill(color);
        this.draw();
    }

    undo() {
        if (this.history.length > 0) {
            this.pixels = this.history.pop();
            this.draw();
        }
    }

    getPixelData() {
        return [...this.pixels];
    }

    getCanvasAsImage() {
        // Générer une image 32x32 directement à partir des pixels (sans grille/fond)
        const out = document.createElement('canvas');
        out.width = 32;
        out.height = 32;
        const octx = out.getContext('2d');

        for (let i = 0; i < this.pixels.length; i++) {
            const x = i % this.pixelWidth;
            const y = Math.floor(i / this.pixelWidth);
            octx.fillStyle = this.pixels[i];
            octx.fillRect(x, y, 1, 1);
        }

        return out;
    }
}

// ========== GESTIONNAIRE DE TUILES ==========

class CustomTileManager {
    constructor() {
        this.customTiles = this.loadCustomTiles();
        this.nextCustomId = this.getNextCustomId();
    }

    loadCustomTiles() {
        const stored = localStorage.getItem('customTiles');
        return stored ? JSON.parse(stored) : {};
    }

    saveCustomTiles() {
        localStorage.setItem('customTiles', JSON.stringify(this.customTiles));
    }

    getNextCustomId() {
        const ids = Object.keys(this.customTiles)
            .filter(key => !isNaN(key))
            .map(Number);
        return ids.length > 0 ? Math.max(...ids) + 1 : 100;
    }

    addTile(tileData) {
        const id = this.nextCustomId;
        this.customTiles[id] = {
            ...tileData,
            id: id,
            isCustom: true,
            createdAt: new Date().toISOString()
        };
        this.nextCustomId++;
        this.saveCustomTiles();
        return id;
    }

    deleteTile(id) {
        delete this.customTiles[id];
        this.saveCustomTiles();
    }

    getTile(id) {
        return this.customTiles[id] || null;
    }

    getAllTiles() {
        return this.customTiles;
    }

    addToGlobalTileConfig(id, tileConfig) {
        TileTypes[`CUSTOM_${id}`] = id;
        TileConfig[id] = tileConfig;
        this.saveCustomTiles();
    }
}

// ========== VARIABLES GLOBALES ==========

const customTileManager = new CustomTileManager();
let pixelCanvas = null;
const recentColors = new Set(); // Tracker des couleurs récentes
const MAX_RECENT_COLORS = 8;

// Restaurer les tuiles personnalisées dans TileConfig global au démarrage
function restoreCustomTilesToConfig() {
    try {
        const customTiles = customTileManager.getAllTiles();
        for (const [id, config] of Object.entries(customTiles)) {
            const tileId = parseInt(id);
            if (!TileConfig[tileId]) {
                TileConfig[tileId] = {
                    name: config.name,
                    backgroundColor: config.backgroundColor,
                    solid: config.solid,
                    minable: config.minable,
                    resource: config.resource,
                    durability: config.durability,
                    interactive: config.interactive,
                    isCustom: true,
                    isDrawn: true,
                    imageData: config.imageData,
                    pixelData: config.pixelData
                };
                // Mettre aussi dans TileTypes
                TileTypes[`CUSTOM_${tileId}`] = tileId;
            }
        }
    } catch (e) {
        console.error('Erreur restauration tuiles personnalisées:', e);
    }
}

// Restaurer immédiatement au chargement du script
restoreCustomTilesToConfig();

// Charger les couleurs récentes depuis localStorage
function loadRecentColors() {
    try {
        const stored = localStorage.getItem('tileEditorRecentColors');
        if (stored) {
            const colors = JSON.parse(stored);
            colors.forEach(c => recentColors.add(c));
        }
    } catch (e) {
        // ignorer
    }
}

// Sauvegarder les couleurs récentes dans localStorage
function saveRecentColors() {
    try {
        const colors = Array.from(recentColors);
        localStorage.setItem('tileEditorRecentColors', JSON.stringify(colors));
    } catch (e) {
        // ignorer
    }
}

// Ajouter une couleur aux récentes et mettre à jour l'affichage
function addRecentColor(color) {
    recentColors.delete(color); // Retirer si déjà présente (pour la remettre au début)
    const colors = [color, ...Array.from(recentColors)];
    recentColors.clear();
    colors.slice(0, MAX_RECENT_COLORS).forEach(c => recentColors.add(c));
    saveRecentColors();
    renderRecentColors();
}

// Afficher les couleurs récentes
function renderRecentColors() {
    const container = document.getElementById('recent-colors');
    container.innerHTML = '';
    
    Array.from(recentColors).forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'recent-color-swatch';
        swatch.style.background = color;
        swatch.title = color;
        
        // Bouton de suppression
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-color';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            recentColors.delete(color);
            saveRecentColors();
            renderRecentColors();
            showNotification(`🗑️ Couleur supprimée`);
        });
        
        swatch.appendChild(removeBtn);
        swatch.addEventListener('click', () => {
            document.getElementById('brush-color').value = color;
            updateActiveSwatch();
            showNotification(`🎨 Couleur sélectionnée: ${color}`);
        });
        container.appendChild(swatch);
    });
    updateActiveSwatch();
}

// Mettre à jour l'indicateur de couleur active
function updateActiveSwatch() {
    const current = document.getElementById('brush-color').value;
    document.querySelectorAll('.recent-color-swatch').forEach(swatch => {
        if (swatch.style.background.toLowerCase() === current.toLowerCase()) {
            swatch.classList.add('active');
        } else {
            swatch.classList.remove('active');
        }
    });
}

// ========== INITIALISATION ==========

document.addEventListener('DOMContentLoaded', () => {
    initTileEditor();
});

function initTileEditor() {
    // Charger les couleurs récentes
    loadRecentColors();
    renderRecentColors();
    
    // Initialiser le canvas de dessin (scale auto depuis la taille du canvas)
    const canvasEl = document.getElementById('pixel-canvas');
    const scale = Math.floor(canvasEl.width / 32) || 16;
    pixelCanvas = new PixelCanvas('pixel-canvas', 32, 32, scale);
    
    // Initialiser les événements
    setupEventListeners();
    
    // Charger et afficher les tuiles
    renderTilesList();

    // Migration légère: régénérer les PNG des tuiles perso à partir des pixels
    try {
        const all = customTileManager.getAllTiles();
        for (const [id, tile] of Object.entries(all)) {
            if (tile.pixelData && Array.isArray(tile.pixelData) && tile.pixelData.length === 1024) {
                const canvas = document.createElement('canvas');
                canvas.width = 32; canvas.height = 32;
                const cctx = canvas.getContext('2d');
                for (let i = 0; i < tile.pixelData.length; i++) {
                    const x = i % 32, y = Math.floor(i / 32);
                    cctx.fillStyle = tile.pixelData[i];
                    cctx.fillRect(x, y, 1, 1);
                }
                const dataUrl = canvas.toDataURL('image/png');
                tile.imageData = dataUrl;
                // Mettre à jour TileConfig
                if (TileConfig[id]) {
                    TileConfig[id].imageData = dataUrl;
                    TileConfig[id].isDrawn = true;
                }
                // Mettre en cache dans le renderer
                if (typeof tileRenderer !== 'undefined') {
                    const img = new Image();
                    img.onload = function() {
                        const cacheCanvas = document.createElement('canvas');
                        cacheCanvas.width = 32; cacheCanvas.height = 32;
                        const cacheCtx = cacheCanvas.getContext('2d');
                        cacheCtx.imageSmoothingEnabled = false;
                        cacheCtx.drawImage(img, 0, 0, 32, 32);
                        tileRenderer.cache[parseInt(id, 10)] = cacheCanvas;
                    };
                    img.src = dataUrl;
                }
            }
        }
        customTileManager.saveCustomTiles();
    } catch (e) {
        // ignorer silencieusement
    }
}

// ========== GESTION DES ÉVÉNEMENTS ==========

function setupEventListeners() {
    // Outils de dessin
    const btnClearCanvas = document.getElementById('btn-clear-canvas');
    if (btnClearCanvas) {
        btnClearCanvas.addEventListener('click', () => {
            pixelCanvas.clear();
            showNotification('🗑️ Canvas effacé');
        });
    }

    document.getElementById('btn-undo-draw').addEventListener('click', () => {
        pixelCanvas.undo();
        showNotification('↶ Action annulée');
    });

    // Sélecteur de taille de pinceau (carrés visuels)
    document.querySelectorAll('.brush-size-box').forEach(box => {
        box.addEventListener('click', () => {
            // Retirer l'état actif de tous les carrés
            document.querySelectorAll('.brush-size-box').forEach(b => b.classList.remove('active'));
            // Activer le carré cliqué
            box.classList.add('active');
            // Mettre à jour la taille du pinceau
            const size = parseInt(box.dataset.size);
            pixelCanvas.brushSize = size;
            showNotification(`🖌️ Taille du pinceau: ${size}x${size}`);
        });
    });

    // Bouton pour créer une nouvelle tuile (réinitialiser)
    const btnNewTile = document.getElementById('btn-new-tile');
    if (btnNewTile) {
        btnNewTile.addEventListener('click', () => {
            resetTileForm();
            showNotification('🆕 Nouvelle tuile: grille réinitialisée');
        });
    }

    // Bouton pour supprimer les couleurs récentes
    const btnClearColors = document.getElementById('btn-clear-recent-colors');
    if (btnClearColors) {
        btnClearColors.addEventListener('click', () => {
            recentColors.clear();
            saveRecentColors();
            renderRecentColors();
            showNotification('🎨 Historique des couleurs vidé');
        });
    }

    // Tracker les changements de couleur
    document.getElementById('brush-color').addEventListener('change', () => {
        updateActiveSwatch();
    });

    // Création de tuile
    document.getElementById('tile-minable').addEventListener('change', toggleMineableOptions);
    
    const btnPreviewTile = document.getElementById('btn-preview-tile');
    if (btnPreviewTile) {
        btnPreviewTile.addEventListener('click', showTilePreview);
    }
    
    document.getElementById('btn-add-tile').addEventListener('click', addNewTile);
    
    // Aperçu
    document.getElementById('btn-close-preview').addEventListener('click', closeTilePreview);
    document.getElementById('modal-tile-preview').addEventListener('click', (e) => {
        if (e.target.id === 'modal-tile-preview') {
            closeTilePreview();
        }
    });
    
    // Filtres
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTilesList(e.target.dataset.filter);
        });
    });
    
    // Retour
    document.getElementById('btn-back-from-tile').addEventListener('click', () => {
        // Vérifier d'où on revient et retourner au bon endroit
        const previousPage = sessionStorage.getItem('tileEditorSource') || 'game';
        if (previousPage === 'editor') {
            window.location.href = 'editor.html';
        } else {
            window.location.href = 'index.html';
        }
    });
}

function toggleMineableOptions() {
    const isMineable = document.getElementById('tile-minable').checked;
    document.getElementById('resource-group').style.display = isMineable ? 'block' : 'none';
    document.getElementById('durability-group').style.display = isMineable ? 'block' : 'none';
}

// ========== AJOUTER UNE TUILE ==========

function addNewTile() {
    const name = document.getElementById('tile-name').value.trim();
    
    if (!name) {
        alert('❌ Veuillez entrer un nom pour la tuile');
        return;
    }

    // Obtenir l'image du canvas dessiné
    const canvasImage = pixelCanvas.getCanvasAsImage();
    const imageData = canvasImage.toDataURL('image/png');
    
    const tileData = {
        name: name,
        pixelData: pixelCanvas.getPixelData(), // Les pixels en hex
        backgroundColor: '#2a2a2a',
        solid: document.getElementById('tile-solid').checked,
        minable: document.getElementById('tile-minable').checked,
        resource: document.getElementById('tile-minable').checked ? 
                  document.getElementById('tile-resource').value : null,
        durability: document.getElementById('tile-minable').checked ? 
                   parseInt(document.getElementById('tile-durability').value) : 1,
        interactive: document.getElementById('tile-interactive').checked,
        icon: generateTileIcon(name),
        imageData: imageData // Sauvegarde de l'image PNG
    };
    
    const tileId = customTileManager.addTile(tileData);
    
    // Ajouter au TileConfig global avec le rendu du canvas
    const tileConfig = {
        name: tileData.name,
        backgroundColor: tileData.backgroundColor,
        solid: tileData.solid,
        minable: tileData.minable,
        resource: tileData.resource,
        durability: tileData.durability,
        interactive: tileData.interactive,
        isCustom: true,
        isDrawn: true,
        imageData: imageData // Image PNG
    };
    
    customTileManager.addToGlobalTileConfig(tileId, tileConfig);
    
    // Mettre à jour le TileRenderer si disponible
    if (typeof tileRenderer !== 'undefined') {
        // Invalider le cache pour cette tuile pour forcer un rerendu
        tileRenderer.invalidateCache(tileId);
        // Générer la nouvelle image en cache
        const cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = 32; cacheCanvas.height = 32;
        const cctx = cacheCanvas.getContext('2d');
        const img = new Image();
        img.onload = function() {
            cctx.imageSmoothingEnabled = false;
            cctx.drawImage(img, 0, 0, 32, 32);
            tileRenderer.cache[tileId] = cacheCanvas;
        };
        img.src = imageData;
    }
    
    // Message de succès
    showNotification(`✅ Tuile "${name}" créée et ajoutée!`);
    
    // Réinitialiser le formulaire
    resetTileForm();
    
    // Rafraîchir la liste des tuiles
    renderTilesList();
    
    // Si on est dans l'éditeur de niveau, rafraîchir aussi la palette là-bas
    if (typeof createTilePalette === 'function') {
        try {
            createTilePalette();
        } catch (e) {
            console.log('Éditeur de niveau non chargé');
        }
    }
}

function resetTileForm() {
    document.getElementById('tile-name').value = '';
    document.getElementById('tile-solid').checked = true;
    document.getElementById('tile-minable').checked = false;
    document.getElementById('tile-resource').value = '';
    document.getElementById('tile-durability').value = '1';
    document.getElementById('tile-interactive').checked = false;
    document.getElementById('brush-color').value = '#ffffff';
    toggleMineableOptions();
    pixelCanvas.clear();
}

// ========== AFFICHAGE DE LA LISTE DES TUILES ==========

function renderTilesList(filter = 'all') {
    const container = document.getElementById('tiles-list');
    container.innerHTML = '';
    
    // Ajouter les tuiles par défaut
    if (filter === 'all' || filter === 'default') {
        for (const [id, config] of Object.entries(TileConfig)) {
            if (!config.isCustom && id != TileTypes.EMPTY) {
                const tileId = parseInt(id);
                const element = createTileItemElement(tileId, config, false);
                container.appendChild(element);
            }
        }
    }
    
    // Ajouter les tuiles personnalisées
    if (filter === 'all' || filter === 'custom') {
        const customTiles = customTileManager.getAllTiles();
        for (const [id, tileData] of Object.entries(customTiles)) {
            const element = createTileItemElement(parseInt(id), tileData, true);
            container.appendChild(element);
        }
    }
    
    if (container.children.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Aucune tuile disponible</p>';
    }
}

function createTileItemElement(id, config, isCustom) {
    const div = document.createElement('div');
    div.className = `tile-item ${isCustom ? 'custom' : ''}`;
    
    const display = document.createElement('div');
    display.className = 'tile-item-display';
    
    // Si c'est une tuile dessinée, afficher l'image
    if (config.imageData) {
        display.style.backgroundImage = `url('${config.imageData}')`;
        display.style.backgroundSize = 'cover';
        display.style.backgroundPosition = 'center';
    } else if (config.color) {
        // Sinon afficher la couleur
        display.style.background = config.color;
        if (config.backgroundColor && config.backgroundColor !== config.color) {
            display.style.backgroundImage = `
                linear-gradient(135deg, ${config.color} 0%, ${config.backgroundColor} 100%)
            `;
        }
        if (config.icon) {
            display.textContent = config.icon;
        }
    }
    
    const name = document.createElement('div');
    name.className = 'tile-item-name';
    name.textContent = config.name;
    
    div.appendChild(display);
    div.appendChild(name);
    
    if (isCustom) {
        const badge = document.createElement('div');
        badge.className = 'tile-item-badge';
        badge.textContent = 'PERSO';
        div.appendChild(badge);
        
        const actions = document.createElement('div');
        actions.className = 'tile-item-actions';
        
        const previewBtn = document.createElement('button');
        previewBtn.className = 'tile-item-action-btn preview';
        previewBtn.textContent = '👁️';
        previewBtn.title = 'Aperçu';
        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showTileInfo(id, config, isCustom);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'tile-item-action-btn delete';
        deleteBtn.textContent = '✕';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`❌ Êtes-vous sûr de vouloir supprimer la tuile "${config.name}"?`)) {
                customTileManager.deleteTile(parseInt(id));
                delete TileConfig[id];
                renderTilesList();
                showNotification(`Tuile "${config.name}" supprimée`);
            }
        });
        
        actions.appendChild(previewBtn);
        actions.appendChild(deleteBtn);
        div.appendChild(actions);
    } else {
        // Bouton aperçu pour les tuiles par défaut aussi
        const actions = document.createElement('div');
        actions.className = 'tile-item-actions';
        
        const previewBtn = document.createElement('button');
        previewBtn.className = 'tile-item-action-btn preview';
        previewBtn.textContent = '👁️';
        previewBtn.title = 'Aperçu';
        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showTileInfo(id, config, isCustom);
        });
        
        actions.appendChild(previewBtn);
        div.appendChild(actions);
    }
    
    div.addEventListener('click', () => {
        loadTileIntoCanvas(id, config, isCustom);
        showNotification(`Tuile "${config.name}" chargée dans le canevas`);
    });
    
    return div;
}

// ========== APERÇU DE TUILE ==========

function showTilePreview() {
    const name = document.getElementById('tile-name').value.trim();
    
    if (!name) {
        alert('❌ Veuillez entrer un nom pour voir l\'aperçu');
        return;
    }
    
    const display = document.getElementById('preview-tile-display');
    const canvas = pixelCanvas.canvas;
    const scale = 2.5; // Agrandir pour l'aperçu
    
    // Créer un canvas 80x80 pour l'aperçu
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 80;
    previewCanvas.height = 80;
    const ctx = previewCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 320, 320, 0, 0, 80, 80);
    
    display.style.backgroundImage = `url('${previewCanvas.toDataURL()}')`;
    display.style.backgroundSize = 'cover';
    display.style.backgroundPosition = 'center';
    
    document.getElementById('preview-name').textContent = `🎨 ${name}`;
    
    const solid = document.getElementById('tile-solid').checked;
    const minable = document.getElementById('tile-minable').checked;
    
    const properties = [
        solid ? '🔒 Solide' : '🔓 Non solide',
        minable ? '⛏️ Mineable' : '❌ Non mineable'
    ].join(' | ');
    
    document.getElementById('preview-properties').textContent = properties;
    
    const modal = document.getElementById('modal-tile-preview');
    modal.classList.add('show');
}

function closeTilePreview() {
    document.getElementById('modal-tile-preview').classList.remove('show');
}

function showTileInfo(id, config, isCustom) {
    const display = document.getElementById('preview-tile-display');
    
    // Si c'est une tuile dessinée, afficher l'image
    if (config.imageData) {
        display.style.backgroundImage = `url('${config.imageData}')`;
        display.style.backgroundSize = 'cover';
        display.style.backgroundPosition = 'center';
    } else if (config.color) {
        display.style.background = config.color;
        if (config.backgroundColor && config.backgroundColor !== config.color) {
            display.style.backgroundImage = `
                linear-gradient(135deg, ${config.color} 0%, ${config.backgroundColor} 100%)
            `;
        }
    }
    
    document.getElementById('preview-name').textContent = `📋 ${config.name}`;
    
    const properties = [];
    properties.push(config.solid ? '🔒 Solide' : '🔓 Non solide');
    properties.push(config.minable ? '⛏️ Mineable' : '❌ Non mineable');
    if (config.interactive) properties.push('🖱️ Interactive');
    if (config.resource) properties.push(`💎 Ressource: ${config.resource}`);
    if (config.durability) properties.push(`💪 Durabilité: ${config.durability}`);
    if (config.isDrawn) properties.push('🎨 Dessinée');
    
    document.getElementById('preview-properties').textContent = properties.join(' | ');
    
    const modal = document.getElementById('modal-tile-preview');
    modal.classList.add('show');
}

// Charger une tuile dans la grille de dessin
function loadTileIntoCanvas(id, config, isCustom) {
    // Priorité: données brutes de pixels si disponibles
    if (config.pixelData && Array.isArray(config.pixelData) && config.pixelData.length === 32 * 32) {
        pixelCanvas.pixels = [...config.pixelData];
        pixelCanvas.draw();
        return;
    }

    const importFromImageData = (imageData) => {
        const tmp = document.createElement('canvas');
        tmp.width = 32; tmp.height = 32;
        const tctx = tmp.getContext('2d');
        const img = new Image();
        img.onload = () => {
            tctx.imageSmoothingEnabled = false;
            tctx.clearRect(0, 0, 32, 32);
            tctx.drawImage(img, 0, 0, 32, 32);
            const data = tctx.getImageData(0, 0, 32, 32).data;
            const pixels = new Array(32 * 32);
            for (let i = 0, p = 0; i < data.length; i += 4, p++) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Ignorer alpha: si transparent, mettre blanc
                const a = data[i + 3];
                const toHex = (v) => v.toString(16).padStart(2, '0');
                pixels[p] = a === 0 ? '#ffffff' : `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            }
            pixelCanvas.pixels = pixels;
            pixelCanvas.draw();
        };
        img.src = imageData;
    };

    if (isCustom && config.imageData) {
        importFromImageData(config.imageData);
        return;
    }

    // Par défaut, utiliser le rendu du TileRenderer
    if (typeof tileRenderer !== 'undefined') {
        const sourceCanvas = tileRenderer.getTile(id);
        const tctx = sourceCanvas.getContext('2d');
        const data = tctx.getImageData(0, 0, 32, 32).data;
        const pixels = new Array(32 * 32);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const toHex = (v) => v.toString(16).padStart(2, '0');
            pixels[p] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }
        pixelCanvas.pixels = pixels;
        pixelCanvas.draw();
    }
}

// ========== UTILITAIRES ==========

function generateTileIcon(name) {
    const lowerName = name.toLowerCase();
    
    const iconMap = {
        'marbre': '🔷',
        'granit': '🪨',
        'diamant': '💎',
        'émeraude': '💚',
        'rubis': '❤️',
        'saphir': '💙',
        'cristal': '✨',
        'obsidienne': '🖤',
        'jade': '💚',
        'quartz': '⚪',
        'sel': '🧂',
        'charbon': '⚫',
        'cuivre': '🟡',
        'étain': '⚫',
        'bronze': '🟤',
        'platine': '⭐'
    };
    
    for (const [keyword, icon] of Object.entries(iconMap)) {
        if (lowerName.includes(keyword)) {
            return icon;
        }
    }
    
    return '🪨'; // Par défaut
}

function showNotification(message) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4a9d4e;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(74, 157, 78, 0.4);
        z-index: 2000;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Ajouter les animations au CSS dynamiquement
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
