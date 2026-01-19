// Classe pour gérer les niveaux
class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.levels = {};
        this.gridWidth = 16;
        this.gridHeight = 16;
    }
    
    // Synchroniser l'état courant vers la liste des niveaux et localStorage
    commitCurrentLevel() {
        if (!this.currentLevel || !this.currentLevel.name) return;
        this.pruneMetadata(this.currentLevel);
        this.levels[this.currentLevel.name] = JSON.parse(JSON.stringify(this.currentLevel));
        this.saveLevelToStorage(this.currentLevel.name);
    }

    // Créer un niveau vide
    createEmptyLevel(name = 'level_1', width = null, height = null) {
        const gridWidth = width || this.gridWidth;
        const gridHeight = height || this.gridHeight;
        
        const tiles = [];
        const backgroundTiles = [];
        for (let y = 0; y < gridHeight; y++) {
            const row = [];
            const bgRow = [];
            for (let x = 0; x < gridWidth; x++) {
                row.push(0); // EMPTY - Grille complètement éditable
                bgRow.push(0); // EMPTY pour la couche de fond
            }
            tiles.push(row);
            backgroundTiles.push(bgRow);
        }

        return {
            name: name,
            width: gridWidth,
            height: gridHeight,
            startX: Math.floor(gridWidth / 2),
            startY: Math.floor(gridHeight / 2),
            exits: [],
            tiles: tiles,
            backgroundTiles: backgroundTiles, // Couche de fond
            type: 'topdown', // Type par défaut
            chestData: {}, // Stocke le contenu des coffres {"x_y": {items: [...]}}
            signData: {}, // Stocke les messages des panneaux {"x_y": "message"}
            warpData: {} // Stocke les destinations des warps {"x_y": "level_name"}
        };
    }

    // Migrer les tuiles invalides vers EMPTY
    migrateTiles(level) {
        if (!level || !level.tiles) return;
        
        let migratedCount = 0;
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const tileType = level.tiles[y][x];
                // Si la tuile n'existe pas dans TileConfig ET qu'elle n'est pas EMPTY
                // NE PAS LA REMPLACER - laisser generateTile() la créer dynamiquement!
                if (tileType !== 0 && !TileConfig[tileType]) {
                    // CRÉER UNE TUILE PAR DÉFAUT au lieu de la supprimer
                    if (!TileConfig[tileType]) {
                        TileConfig[tileType] = {
                            name: `Tuile ${tileType}`,
                            color: '#4a9d4e',
                            minable: false,
                            resource: null
                        };
                        console.log(`✓ Tuile ${tileType} créée dynamiquement`);
                        migratedCount++;
                    }
                }
            }
        }
        
        if (migratedCount > 0) {
            console.log(`✓ Création dynamique: ${migratedCount} tuiles créées`);
        }
    }

    // Charger un niveau
    loadLevel(levelName) {
        if (this.levels[levelName]) {
            this.currentLevel = JSON.parse(JSON.stringify(this.levels[levelName]));
            // Migrer les tuiles invalides
            this.migrateTiles(this.currentLevel);
            // Migrer le type de niveau (par défaut topdown pour les anciens niveaux)
            if (!this.currentLevel.type) {
                this.currentLevel.type = 'topdown';
                console.log(`🔄 Migration: type 'topdown' ajouté au niveau ${levelName}`);
            }
            // Migrer les backgroundTiles si elles n'existent pas
            if (!this.currentLevel.backgroundTiles) {
                this.currentLevel.backgroundTiles = [];
                for (let y = 0; y < this.currentLevel.height; y++) {
                    const bgRow = [];
                    for (let x = 0; x < this.currentLevel.width; x++) {
                        bgRow.push(0); // EMPTY
                    }
                    this.currentLevel.backgroundTiles.push(bgRow);
                }
                console.log(`🔄 Migration: backgroundTiles ajoutées au niveau ${levelName}`);
            }
            
            // Vérifier que les tuiles utilisées dans backgroundTiles sont en TileConfig
            console.log('🔍 Checking if all backgroundTiles are defined in TileConfig...');
            const usedBgTileIds = new Set();
            for (let y = 0; y < this.currentLevel.backgroundTiles.length; y++) {
                for (let x = 0; x < this.currentLevel.backgroundTiles[y].length; x++) {
                    const tileId = this.currentLevel.backgroundTiles[y][x];
                    if (tileId > 0) {
                        usedBgTileIds.add(tileId);
                    }
                }
            }
            
            const missingTiles = Array.from(usedBgTileIds).filter(id => !TileConfig[id]);
            if (missingTiles.length > 0) {
                console.warn('⚠️ Missing TileConfig entries for backgroundTiles:', missingTiles);
                // Attempt to restore custom tiles
                if (typeof restoreCustomTilesToConfig === 'function') {
                    console.log('🔄 Attempting to restore custom tiles to TileConfig...');
                    restoreCustomTilesToConfig();
                    const stillMissing = missingTiles.filter(id => !TileConfig[id]);
                    if (stillMissing.length > 0) {
                        console.error('❌ Still missing after restore:', stillMissing);
                    } else {
                        console.log('✅ All tiles restored successfully');
                    }
                }
            }
            
            return this.currentLevel;
        }
        
        // Si le niveau n'existe pas, en créer un par défaut
        this.currentLevel = this.createEmptyLevel(levelName);
        this.levels[levelName] = this.currentLevel;
        return this.currentLevel;
    }

    // Forcer les murs sur le contour


    // Nettoyer les données orphelines (panneaux, coffres, warps) sans tuile correspondante
    pruneMetadata(level) {
        if (!level || !level.tiles) return;
        const tiles = level.tiles;

        const pruneMap = (data, keepPredicate) => {
            if (!data) return false;
            for (const key of Object.keys(data)) {
                const [sx, sy] = key.split('_').map(n => parseInt(n, 10));
                if (!keepPredicate(sx, sy, tiles)) {
                    delete data[key];
                }
            }
            return Object.keys(data).length > 0;
        };

        const hasSign = pruneMap(level.signData, (x, y, t) => {
            const tileType = t[y] && t[y][x];
            const config = TileConfig[tileType];
            return config && config.isSign;
        });
        
        const hasChest = pruneMap(level.chestData, (x, y, t) => {
            const tileType = t[y] && t[y][x];
            const config = TileConfig[tileType];
            return config && config.isChest;
        });
        
        const hasWarp = pruneMap(level.warpData, (x, y, t) => {
            const tileType = t[y] && t[y][x];
            const config = TileConfig[tileType];
            return config && (config.warp || config.isWarp);
        });

        if (!hasSign) level.signData = {};
        if (!hasChest) level.chestData = {};
        if (!hasWarp) level.warpData = {};
    }
    // Sauvegarder un niveau
    saveLevel(levelName, levelData) {
        this.pruneMetadata(levelData);
        this.levels[levelName] = JSON.parse(JSON.stringify(levelData));
        this.saveLevelToStorage(levelName);
        // Mettre à jour la liste des niveaux
        localStorage.setItem('minerquest_level_list', JSON.stringify(Object.keys(this.levels)));
    }

    // Obtenir une tuile à une position
    getTile(x, y) {
        if (!this.currentLevel) return 0; // EMPTY
        if (x < 0 || x >= this.currentLevel.width || y < 0 || y >= this.currentLevel.height) {
            return 0; // EMPTY - Hors limite
        }
        return this.currentLevel.tiles[y][x];
    }

    // Définir une tuile à une position
    setTile(x, y, tileType) {
        if (!this.currentLevel) return;
        if (x < 0 || x >= this.currentLevel.width || y < 0 || y >= this.currentLevel.height) return;
        this.currentLevel.tiles[y][x] = tileType;
        this.commitCurrentLevel();
    }

    // Obtenir une tuile de fond à une position
    getBackgroundTile(x, y) {
        if (!this.currentLevel || !this.currentLevel.backgroundTiles) return 0; // EMPTY
        if (x < 0 || x >= this.currentLevel.width || y < 0 || y >= this.currentLevel.height) {
            return 0; // EMPTY - Hors limite
        }
        return this.currentLevel.backgroundTiles[y][x];
    }

    // Définir une tuile de fond à une position
    setBackgroundTile(x, y, tileType) {
        if (!this.currentLevel || !this.currentLevel.backgroundTiles) return;
        if (x < 0 || x >= this.currentLevel.width || y < 0 || y >= this.currentLevel.height) return;
        this.currentLevel.backgroundTiles[y][x] = tileType;
        this.commitCurrentLevel();
    }

    // Vérifier si il y a une collision avec un bord d'une tuile solide à une position donnée
    // direction: 'top', 'bottom', 'left', 'right'
    // x, y: position en tuiles (peut être fractionnaire)
    // retourne true si il y a collision, false sinon
    hasCollisionEdge(x, y, direction) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        
        // Vérifier la couche BACKGROUND en priorité
        let tileType = this.getBackgroundTile(tileX, tileY);
        let config = TileConfig[tileType];
        
        // Si pas de tuile dans background, vérifier foreground
        if (!config || !config.solidEdges) {
            tileType = this.getTile(tileX, tileY);
            config = TileConfig[tileType];
        }
        
        // Vérifier si cette tuile a un bord solide dans la direction demandée
        if (config && config.solidEdges) {
            const isColliding = config.solidEdges[direction];
            
            // DEBUG: Log uniquement pour les collisions détectées
            if (isColliding) {
                console.log(`🚫 Collision détectée: tuile[${tileX},${tileY}] (id=${tileType}, nom=${config.name}) bord ${direction} solide`);
            }
            
            return isColliding;
        }
        
        return false;
    }

    // Alias pour compatibilité - vérifie si une tuile entière est solide
    // (tous les bords solides)
    isSolid(x, y) {
        const tileType = this.getBackgroundTile(Math.floor(x), Math.floor(y));
        let config = TileConfig[tileType];
        
        if (!config || !config.solidEdges) {
            const fgType = this.getTile(Math.floor(x), Math.floor(y));
            config = TileConfig[fgType];
        }
        
        if (config && config.solidEdges) {
            // Une tuile est "solide" si tous ses bords le sont
            return config.solidEdges.top && config.solidEdges.bottom && 
                   config.solidEdges.left && config.solidEdges.right;
        }
        
        return false;
    }

    // Vérifier si une tuile est minable
    isMinable(x, y) {
        const tileType = this.getTile(x, y);
        return TileConfig[tileType] && TileConfig[tileType].minable;
    }

    // Miner une tuile
    mineTile(x, y) {
        // PRIORITÉ 1: Vérifier si l'arrière-plan (par-dessus) est minable
        const bgTileType = this.getBackgroundTile(x, y);
        const bgConfig = TileConfig[bgTileType];
        
        console.log('⛏️ mineTile - Checking Background Layer:', {
            x, y,
            bgTileType,
            bgConfigExists: !!bgConfig,
            bgConfigName: bgConfig?.name,
            bgConfigMinable: bgConfig?.minable,
            bgTileTypeZero: bgTileType === 0
        });
        
        if (bgConfig && bgConfig.minable && bgTileType !== 0) {
            // Warp: ne pas faire disparaître, juste activer la téléportation
            if (bgConfig.warp || bgConfig.isWarp) {
                console.log('🌀 mineTile - Background Warp (not removing):', bgConfig.name);
                return null;
            }
            // Miner l'arrière-plan en premier (la couche visible)
            console.log('✅ mineTile - Mining Background Tile:', {
                bgTileType,
                bgName: bgConfig.name,
                resource: bgConfig.resource
            });
            this.setBackgroundTile(x, y, 0); // EMPTY - Révèle l'avant-plan en dessous
            this.commitCurrentLevel();
            return bgConfig.resource;
        }
        
        // PRIORITÉ 2: Si pas d'arrière-plan minable, vérifier l'avant-plan
        const tileType = this.getTile(x, y);
        const config = TileConfig[tileType];
        
        console.log('⛏️ mineTile - Checking Foreground Layer:', {
            x, y,
            tileType,
            configExists: !!config,
            configName: config?.name,
            configMinable: config?.minable
        });
        
        if (config && config.minable) {
            // Warp: ne pas faire disparaître, juste activer la téléportation côté joueur
            if (config.warp || config.isWarp) {
                console.log('🌀 mineTile - Foreground Warp (not removing):', config.name);
                return null;
            }
            // Miner l'avant-plan et nettoyer les métadonnées
            console.log('✅ mineTile - Mining Foreground Tile:', {
                tileType,
                name: config.name,
                resource: config.resource
            });
            this.setTile(x, y, 0); // EMPTY
            const key = `${x}_${y}`;
            if (config.isChest && this.currentLevel.chestData) {
                delete this.currentLevel.chestData[key];
            }
            if (config.isSign && this.currentLevel.signData) {
                delete this.currentLevel.signData[key];
            }
            this.commitCurrentLevel();
            return config.resource;
        }
        console.log('⛏️ mineTile - No minable tile found');
        return null;
    }

    // Vérifier si une tuile est interactive
    isInteractive(x, y) {
        const tileType = this.getTile(x, y);
        return TileConfig[tileType].interactive || false;
    }

    // Obtenir le message d'une tuile
    getTileMessage(x, y) {
        const tileType = this.getTile(x, y);
        const tileConfig = TileConfig[tileType];
        
        // Pour les panneaux, vérifier d'abord s'il y a un message personnalisé
        if (tileConfig && tileConfig.isSign) {
            if (this.currentLevel && this.currentLevel.signData) {
                const key = `${x}_${y}`;
                if (this.currentLevel.signData[key]) {
                    return this.currentLevel.signData[key];
                }
            }
        }
        
        return tileConfig?.message || '';
    }

    // Vérifier si une tuile est un coffre
    isChest(x, y) {
        const tileType = this.getTile(x, y);
        // Vérifier si c'est une tuile personnalisée avec isChest
        const tileConfig = TileConfig[tileType];
        return tileConfig && tileConfig.isChest;
    }

    // Obtenir le contenu d'un coffre
    getChestContent(x, y) {
        if (!this.currentLevel || !this.currentLevel.chestData) return null;
        const key = `${x}_${y}`;
        return this.currentLevel.chestData[key] || { items: [] };
    }

    // Définir le contenu d'un coffre
    setChestContent(x, y, content) {
        if (!this.currentLevel) return;
        if (!this.currentLevel.chestData) {
            this.currentLevel.chestData = {};
        }
        const key = `${x}_${y}`;
        this.currentLevel.chestData[key] = content;
        this.commitCurrentLevel();
    }

    // Retirer un item d'un coffre
    removeItemFromChest(x, y, itemIndex) {
        const content = this.getChestContent(x, y);
        if (content && content.items && content.items[itemIndex]) {
            const item = content.items[itemIndex];
            content.items.splice(itemIndex, 1);
            this.setChestContent(x, y, content);
            return item;
        }
        return null;
    }

    // Vérifier si une tuile est un warp
    isWarp(x, y) {
        const tileType = this.getTile(x, y);
        // Vérifier si c'est une tuile personnalisée avec isWarp
        const tileConfig = TileConfig[tileType];
        return tileConfig && (tileConfig.warp || tileConfig.isWarp);
    }

    // Obtenir la destination d'un warp
    getWarpDestination(x, y) {
        if (!this.currentLevel || !this.currentLevel.warpData) return null;
        const key = `${x}_${y}`;
        return this.currentLevel.warpData[key] || null;
    }

    // Définir la destination d'un warp
    setWarpDestination(x, y, targetLevel) {
        if (!this.currentLevel) return;
        if (!this.currentLevel.warpData) {
            this.currentLevel.warpData = {};
        }
        const key = `${x}_${y}`;
        this.currentLevel.warpData[key] = targetLevel;
        this.commitCurrentLevel();
    }

    // Obtenir le message d'un panneau
    getSignMessage(x, y) {
        if (!this.currentLevel || !this.currentLevel.signData) return '';
        const key = `${x}_${y}`;
        return this.currentLevel.signData[key] || '';
    }

    // Vérifier si une tuile est un panneau
    isSign(x, y) {
        const tileType = this.getTile(x, y);
        const tileConfig = TileConfig[tileType];
        
        // Vérifier si c'est une tuile personnalisée avec isSign
        return tileConfig && tileConfig.isSign;
    }

    // Définir le message d'un panneau
    setSignMessage(x, y, message) {
        if (!this.currentLevel) return;
        if (!this.currentLevel.signData) {
            this.currentLevel.signData = {};
        }
        const key = `${x}_${y}`;
        this.currentLevel.signData[key] = message;
        this.commitCurrentLevel();
    }

    // Sauvegarder un niveau individuel dans localStorage
    saveLevelToStorage(levelName) {
        try {
            const levelData = this.levels[levelName];
            if (levelData) {
                localStorage.setItem(`minerquest_level_${levelName}`, JSON.stringify(levelData));
            }
        } catch (e) {
            console.error('Erreur de sauvegarde:', e);
        }
    }

    // Sauvegarder tous les niveaux dans localStorage (pour compatibilité)
    saveLevelsToStorage() {
        try {
            // Sauvegarder chaque niveau individuellement
            Object.keys(this.levels).forEach(levelName => {
                this.saveLevelToStorage(levelName);
            });
            // Sauvegarder aussi la liste des niveaux
            localStorage.setItem('minerquest_level_list', JSON.stringify(Object.keys(this.levels)));
        } catch (e) {
            console.error('Erreur de sauvegarde:', e);
        }
    }

    // Charger un niveau individuel depuis localStorage ou fichier
    async loadLevelFromStorage(levelName) {
        // Essayer de charger depuis un fichier individuel
        try {
            const response = await fetch(`levels/${levelName}.json`);
            if (response.ok) {
                const data = await response.json();
                this.levels[levelName] = data;
                // Migrer les tuiles invalides si nécessaire
                this.migrateTiles(this.levels[levelName]);
                console.log(`Niveau ${levelName} chargé depuis fichier`);
                return true;
            }
        } catch (e) {
            // Fichier non trouvé, continuer
        }
        
        // Essayer depuis localStorage
        try {
            const data = localStorage.getItem(`minerquest_level_${levelName}`);
            if (data) {
                this.levels[levelName] = JSON.parse(data);
                // Migrer les tuiles invalides si nécessaire
                this.migrateTiles(this.levels[levelName]);
                console.log(`Niveau ${levelName} chargé depuis localStorage`);
                return true;
            }
        } catch (e) {
            console.error('Erreur de chargement:', e);
        }
        
        return false;
    }

    // Charger la liste des niveaux disponibles
    async loadLevelsFromStorage() {
        // D'abord, essayer de charger automatiquement les fichiers level_1.json, level_2.json, etc.
        let levelIndex = 1;
        let foundLevels = false;
        
        // Essayer de charger jusqu'à 20 niveaux (level_1 à level_20)
        while (levelIndex <= 20) {
            const levelName = `level_${levelIndex}`;
            const loaded = await this.loadLevelFromStorage(levelName);
            if (loaded) {
                foundLevels = true;
            }
            levelIndex++;
        }
        
        // Ensuite, charger les niveaux supplémentaires depuis localStorage
        try {
            const levelList = localStorage.getItem('minerquest_level_list');
            if (levelList) {
                const levels = JSON.parse(levelList);
                for (const levelName of levels) {
                    // Charger seulement s'il n'est pas déjà chargé
                    if (!this.levels[levelName]) {
                        await this.loadLevelFromStorage(levelName);
                        foundLevels = true;
                    }
                }
            }
        } catch (e) {
            console.error('Erreur de chargement de la liste:', e);
        }
        
        return foundLevels;
    }

    // Créer un niveau par défaut
    // Obtenir la liste des niveaux
    getLevelList() {
        return Object.keys(this.levels);
    }

    // Exporter un niveau individuel en JSON
    exportLevel(levelName) {
        if (this.levels[levelName]) {
            return JSON.stringify(this.levels[levelName], null, 2);
        }
        return null;
    }

    // Exporter tous les niveaux en JSON
    exportLevels() {
        return JSON.stringify(this.levels, null, 2);
    }

    // Importer des niveaux depuis JSON
    importLevels(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.levels = data;
            this.saveLevelsToStorage();
            return true;
        } catch (e) {
            console.error('Erreur d\'importation:', e);
            return false;
        }
    }
}

// Instance globale
const levelManager = new LevelManager();
