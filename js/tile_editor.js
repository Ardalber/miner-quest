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
        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
            this.draw(); // Redraw sans la preview
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) {
                this.drawWithPreview(e);
            }
        });
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

    drawWithPreview(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixel = this.getPixelAt(x, y);
        
        // Redraw le canvas d'abord
        this.draw();
        
        // Puis afficher la preview si on est sur la grille
        if (pixel) {
            const brushSize = this.brushSize || 2;
            const color = document.getElementById('brush-color').value;
            
            // Afficher la zone d'effet avec transparence
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.5;
            
            for (let dx = 0; dx < brushSize; dx++) {
                for (let dy = 0; dy < brushSize; dy++) {
                    const px = pixel.x + dx;
                    const py = pixel.y + dy;
                    
                    if (px < this.pixelWidth && py < this.pixelHeight) {
                        const screenX = px * this.scale;
                        const screenY = py * this.scale;
                        this.ctx.fillRect(screenX, screenY, this.scale, this.scale);
                    }
                }
            }
            
            // Border autour de la zone
            this.ctx.globalAlpha = 1;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            const startX = pixel.x * this.scale;
            const startY = pixel.y * this.scale;
            const width = Math.min(brushSize, this.pixelWidth - pixel.x) * this.scale;
            const height = Math.min(brushSize, this.pixelHeight - pixel.y) * this.scale;
            this.ctx.strokeRect(startX, startY, width, height);
        }
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

    loadFromImage(imageFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Créer un canvas temporaire pour redimensionner l'image
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = this.pixelWidth;
                    tempCanvas.height = this.pixelHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Dessiner l'image redimensionnée sur le canvas temporaire
                    tempCtx.drawImage(img, 0, 0, this.pixelWidth, this.pixelHeight);
                    
                    // Extraire les pixels de l'image
                    const imageData = tempCtx.getImageData(0, 0, this.pixelWidth, this.pixelHeight);
                    const data = imageData.data;
                    
                    // Sauvegarder l'état actuel
                    this.saveHistory();
                    
                    // Convertir les pixels en couleurs hex
                    for (let i = 0; i < this.pixels.length; i++) {
                        const dataIndex = i * 4;
                        const r = data[dataIndex];
                        const g = data[dataIndex + 1];
                        const b = data[dataIndex + 2];
                        const a = data[dataIndex + 3];
                        
                        // Si le pixel est transparent, utiliser blanc
                        if (a < 128) {
                            this.pixels[i] = '#ffffff';
                        } else {
                            // Convertir RGB en hex
                            const hex = '#' + 
                                r.toString(16).padStart(2, '0') + 
                                g.toString(16).padStart(2, '0') + 
                                b.toString(16).padStart(2, '0');
                            this.pixels[i] = hex;
                            
                            // Ajouter la couleur aux récentes
                            addRecentColor(hex);
                        }
                    }
                    
                    // Redessiner le canvas
                    this.draw();
                    resolve();
                };
                
                img.onerror = () => {
                    reject(new Error('Erreur lors du chargement de l\'image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du fichier'));
            };
            
            reader.readAsDataURL(imageFile);
        });
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
        // IMPORTANT: Update the customTiles entry with the full tileConfig
        if (this.customTiles[id]) {
            this.customTiles[id] = {
                ...this.customTiles[id],
                ...tileConfig,
                id: id
            };
        } else {
            this.customTiles[id] = {
                ...tileConfig,
                id: id,
                isCustom: true
            };
        }
        this.saveCustomTiles();
    }
}

// ========== VARIABLES GLOBALES ==========

const customTileManager = new CustomTileManager();
let pixelCanvas = null;
let currentEditingTileId = null; // Tuile actuellement en cours d'édition
const recentColors = new Set(); // Tracker des couleurs récentes
const MAX_RECENT_COLORS = 8;
const savedColors = new Set(); // Couleurs sauvegardées par l'utilisateur
const SAVED_COLORS_KEY = 'tileEditorSavedColors';

// Restaurer les tuiles personnalisées dans TileConfig global au démarrage
function restoreCustomTilesToConfig() {
    try {
        const customTiles = customTileManager.getAllTiles();
        console.log('🔄 Restoring custom tiles from storage. Found', Object.keys(customTiles).length, 'tiles');
        for (const [id, config] of Object.entries(customTiles)) {
            const tileId = parseInt(id);
            if (!TileConfig[tileId]) {
                // Pour les Warps, forcer interactive à false (correction des anciennes tuiles)
                let interactive = config.interactive || config.isChest || config.isSign;
                if (config.isWarp) {
                    interactive = false;
                }
                
                const tileConfig = {
                    name: config.name,
                    color: config.color || config.backgroundColor || '#2a2a2a',
                    backgroundColor: config.backgroundColor,
                    solid: config.solid,
                    minable: config.minable || false,  // Explicitly default to false if missing
                    resource: config.resource,
                    durability: config.durability,
                    interactive: interactive,
                    isChest: config.isChest,
                    isSign: config.isSign,
                    isWarp: config.isWarp,
                    isCustom: true,
                    isDrawn: true,
                    imageData: config.imageData,
                    pixelData: config.pixelData
                };
                
                TileConfig[tileId] = tileConfig;
                console.log(`  ✓ Restored tile ${tileId} (${config.name}), minable=${config.minable}`);
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
    // Si la couleur existe déjà, ne rien faire (garder l'ordre actuel)
    if (recentColors.has(color)) {
        return;
    }
    
    // Ajouter la nouvelle couleur à la fin
    recentColors.add(color);
    
    // Si on dépasse la limite, supprimer la première (la plus ancienne)
    if (recentColors.size > MAX_RECENT_COLORS) {
        const colors = Array.from(recentColors);
        recentColors.delete(colors[0]);
    }
    
    saveRecentColors();
    renderRecentColors();
}

// Afficher les couleurs récentes
function renderRecentColors() {
    const container = document.getElementById('recent-colors');
    if (!container) return; // Élément n'existe pas (ex: sur la page du jeu)
    
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
    document.querySelectorAll('.saved-color-swatch').forEach(swatch => {
        if (swatch.style.background.toLowerCase() === current.toLowerCase()) {
            swatch.classList.add('active');
        } else {
            swatch.classList.remove('active');
        }
    });
}

// ========== GESTION DES COULEURS SAUVEGARDÉES ==========

// Charger les couleurs sauvegardées depuis localStorage
function loadSavedColors() {
    try {
        const stored = localStorage.getItem(SAVED_COLORS_KEY);
        if (stored) {
            const colors = JSON.parse(stored);
            colors.forEach(c => savedColors.add(c));
        }
    } catch (e) {
        // ignorer
    }
}

// Sauvegarder les couleurs sauvegardées dans localStorage
function saveSavedColors() {
    try {
        const colors = Array.from(savedColors);
        localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(colors));
    } catch (e) {
        // ignorer
    }
}

// Ajouter la couleur actuelle aux couleurs sauvegardées
function saveCurrentColor() {
    const currentColor = document.getElementById('brush-color').value;
    
    if (savedColors.has(currentColor)) {
        showNotification('⚠️ Cette couleur est déjà sauvegardée');
        return;
    }
    
    savedColors.add(currentColor);
    saveSavedColors();
    renderSavedColors();
    showNotification(`✅ Couleur ${currentColor} sauvegardée`);
}

// Afficher les couleurs sauvegardées
function renderSavedColors() {
    const container = document.getElementById('saved-colors');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (savedColors.size === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888; font-size: 12px;">Aucune couleur sauvegardée</p>';
        return;
    }
    
    Array.from(savedColors).forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'saved-color-swatch';
        swatch.style.background = color;
        swatch.title = color;
        
        // Bouton de suppression
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-color';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            savedColors.delete(color);
            saveSavedColors();
            renderSavedColors();
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

// ========== INITIALISATION ==========

document.addEventListener('DOMContentLoaded', () => {
    initTileEditor();
});

function initTileEditor() {
    // Charger les couleurs récentes
    loadRecentColors();
    renderRecentColors();
    
    // Charger les couleurs sauvegardées
    loadSavedColors();
    renderSavedColors();
    
    // Initialiser le canvas de dessin (scale auto depuis la taille du canvas)
    const canvasEl = document.getElementById('pixel-canvas');
    if (!canvasEl) return; // Pas sur la page de l'éditeur de tuiles
    
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

    // Bouton pour charger une image
    document.getElementById('btn-load-image').addEventListener('click', () => {
        document.getElementById('image-upload').click();
    });

    // Gestionnaire de fichier image
    document.getElementById('image-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await pixelCanvas.loadFromImage(file);
                showNotification('✅ Image chargée avec succès!');
            } catch (error) {
                console.error('Erreur lors du chargement de l\'image:', error);
                showNotification('❌ Erreur lors du chargement de l\'image', true);
            }
            // Réinitialiser l'input pour permettre de recharger la même image
            e.target.value = '';
        }
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

    // Bouton pour sauvegarder une couleur
    const btnSaveColor = document.getElementById('btn-save-color');
    if (btnSaveColor) {
        btnSaveColor.addEventListener('click', saveCurrentColor);
    }

    // Tracker les changements de couleur
    document.getElementById('brush-color').addEventListener('change', () => {
        updateActiveSwatch();
    });

    // Cocher automatiquement Interactive quand on coche Panneau, Coffre ou Warp
    document.getElementById('tile-is-chest').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('tile-interactive').checked = true;
        }
    });

    document.getElementById('tile-is-sign').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('tile-interactive').checked = true;
        }
    });

    document.getElementById('tile-is-warp').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('tile-interactive').checked = true;
        }
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
        isChest: document.getElementById('tile-is-chest').checked,
        isSign: document.getElementById('tile-is-sign').checked,
        isWarp: document.getElementById('tile-is-warp').checked,
        icon: generateTileIcon(name),
        imageData: imageData // Sauvegarde de l'image PNG
    };
    
    // Vérifier si on édite une tuile existante
    if (currentEditingTileId !== null) {
        updateExistingTile(currentEditingTileId, tileData, imageData);
    } else {
        // Créer une nouvelle tuile
        createNewTile(tileData, imageData);
    }
}

// Créer une nouvelle tuile
function createNewTile(tileData, imageData) {
    const tileId = customTileManager.addTile(tileData);
    
    // Ajouter au TileConfig global avec le rendu du canvas
    const tileConfig = {
        name: tileData.name,
        backgroundColor: tileData.backgroundColor,
        solid: tileData.solid,
        minable: tileData.minable,
        resource: tileData.resource,
        durability: tileData.durability,
        interactive: tileData.interactive || tileData.isChest || tileData.isSign || tileData.isWarp,
        isChest: tileData.isChest,
        isSign: tileData.isSign,
        isWarp: tileData.isWarp,
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
    showNotification(`✅ Tuile "${tileData.name}" créée et ajoutée!`);
    
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

// Mettre à jour une tuile existante
function updateExistingTile(tileId, tileData, imageData) {
    // Mettre à jour dans customTileManager
    const existingTile = customTileManager.getTile(tileId);
    if (!existingTile) {
        showNotification('❌ Tuile introuvable');
        return;
    }
    
    // Mettre à jour les données
    customTileManager.customTiles[tileId] = {
        ...existingTile,
        name: tileData.name,
        pixelData: tileData.pixelData,
        backgroundColor: tileData.backgroundColor,
        solid: tileData.solid,
        minable: tileData.minable,
        resource: tileData.resource,
        durability: tileData.durability,
        interactive: tileData.interactive,
        isChest: tileData.isChest,
        isSign: tileData.isSign,
        isWarp: tileData.isWarp,
        icon: tileData.icon,
        imageData: imageData,
        updatedAt: new Date().toISOString()
    };
    customTileManager.saveCustomTiles();
    
    // Mettre à jour TileConfig
    const tileConfig = {
        name: tileData.name,
        backgroundColor: tileData.backgroundColor,
        solid: tileData.solid,
        minable: tileData.minable,
        resource: tileData.resource,
        durability: tileData.durability,
        interactive: tileData.interactive || tileData.isChest || tileData.isSign || tileData.isWarp,
        isChest: tileData.isChest,
        isSign: tileData.isSign,
        isWarp: tileData.isWarp,
        isCustom: true,
        isDrawn: true,
        imageData: imageData,
        pixelData: tileData.pixelData
    };
    TileConfig[tileId] = tileConfig;
    
    // Mettre à jour le TileRenderer
    if (typeof tileRenderer !== 'undefined') {
        tileRenderer.invalidateCache(tileId);
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
    showNotification(`✅ Tuile "${tileData.name}" modifiée et sauvegardée!`);
    
    // Réinitialiser
    currentEditingTileId = null;
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
    document.getElementById('tile-is-chest').checked = false;
    document.getElementById('tile-is-sign').checked = false;
    document.getElementById('tile-is-warp').checked = false;
    document.getElementById('brush-color').value = '#ffffff';
    toggleMineableOptions();
    pixelCanvas.clear();
    
    // Réinitialiser l'édition
    currentEditingTileId = null;
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
        
        // Tracker la tuile en cours d'édition (seulement pour les tuiles personnalisées)
        if (isCustom) {
            currentEditingTileId = id;
        } else {
            currentEditingTileId = null;
        }
        
        // Charger les propriétés si c'est une tuile personnalisée
        if (isCustom) {
            document.getElementById('tile-name').value = config.name || '';
            document.getElementById('tile-solid').checked = config.solid || false;
            document.getElementById('tile-minable').checked = config.minable || false;
            document.getElementById('tile-resource').value = config.resource || '';
            document.getElementById('tile-durability').value = config.durability || 1;
            document.getElementById('tile-interactive').checked = config.interactive || false;
            document.getElementById('tile-is-chest').checked = config.isChest || false;
            document.getElementById('tile-is-sign').checked = config.isSign || false;
            document.getElementById('tile-is-warp').checked = config.isWarp || false;
            toggleMineableOptions();
        }
        
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
