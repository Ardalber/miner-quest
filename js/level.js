// Classe pour gérer les niveaux
class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.levels = {};
        this.gridWidth = 16;
        this.gridHeight = 16;
    }

    // Créer un niveau vide
    createEmptyLevel(name = 'level_1') {
        const tiles = [];
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                row.push(TileTypes.GRASS);
            }
            tiles.push(row);
        }

        return {
            name: name,
            width: this.gridWidth,
            height: this.gridHeight,
            startX: 8,
            startY: 8,
            exits: [],
            tiles: tiles,
            chestData: {}, // Stocke le contenu des coffres {"x_y": {items: [...]}}
            signData: {}, // Stocke les messages des panneaux {"x_y": "message"}
            warpData: {} // Stocke les destinations des warps {"x_y": "level_name"}
        };
    }

    // Charger un niveau
    loadLevel(levelName) {
        if (this.levels[levelName]) {
            this.currentLevel = JSON.parse(JSON.stringify(this.levels[levelName]));
            return this.currentLevel;
        }
        
        // Si le niveau n'existe pas, en créer un par défaut
        this.currentLevel = this.createEmptyLevel(levelName);
        this.levels[levelName] = this.currentLevel;
        return this.currentLevel;
    }

    // Sauvegarder un niveau
    saveLevel(levelName, levelData) {
        this.levels[levelName] = JSON.parse(JSON.stringify(levelData));
        this.saveLevelToStorage(levelName);
        // Mettre à jour la liste des niveaux
        localStorage.setItem('minerquest_level_list', JSON.stringify(Object.keys(this.levels)));
    }

    // Obtenir une tuile à une position
    getTile(x, y) {
        if (!this.currentLevel) return TileTypes.EMPTY;
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            return TileTypes.WALL; // Hors limite = mur
        }
        return this.currentLevel.tiles[y][x];
    }

    // Définir une tuile à une position
    setTile(x, y, tileType) {
        if (!this.currentLevel) return;
        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
        this.currentLevel.tiles[y][x] = tileType;
    }

    // Vérifier si une tuile est solide
    isSolid(x, y) {
        const tileType = this.getTile(x, y);
        return TileConfig[tileType].solid;
    }

    // Vérifier si une tuile est minable
    isMinable(x, y) {
        const tileType = this.getTile(x, y);
        return TileConfig[tileType].minable;
    }

    // Miner une tuile
    mineTile(x, y) {
        const tileType = this.getTile(x, y);
        const config = TileConfig[tileType];
        
        if (config.minable) {
            // Remplacer par de l'herbe
            this.setTile(x, y, TileTypes.GRASS);
            return config.resource;
        }
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
        
        // Pour les panneaux, vérifier d'abord s'il y a un message personnalisé
        if (tileType === TileTypes.SIGN) {
            if (this.currentLevel && this.currentLevel.signData) {
                const key = `${x}_${y}`;
                if (this.currentLevel.signData[key]) {
                    return this.currentLevel.signData[key];
                }
            }
        }
        
        return TileConfig[tileType].message || '';
    }

    // Vérifier si une tuile est un coffre
    isChest(x, y) {
        const tileType = this.getTile(x, y);
        return tileType === TileTypes.CHEST;
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
        return tileType === TileTypes.WARP;
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
        return tileType === TileTypes.SIGN;
    }

    // Définir le message d'un panneau
    setSignMessage(x, y, message) {
        if (!this.currentLevel) return;
        if (!this.currentLevel.signData) {
            this.currentLevel.signData = {};
        }
        const key = `${x}_${y}`;
        this.currentLevel.signData[key] = message;
    }

    // Obtenir le message d'un panneau
    getSignMessage(x, y) {
        if (!this.currentLevel || !this.currentLevel.signData) return '';
        const key = `${x}_${y}`;
        return this.currentLevel.signData[key] || '';
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
