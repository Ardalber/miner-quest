// Définition des types de tuiles
const TileTypes = {
    EMPTY: 0,
    GRASS: 1,
    STONE: 2,
    IRON: 3,
    GOLD: 4,
    WALL: 5,
    CHEST: 6,
    SIGN: 7,
    WARP: 8,
    CHEST_GRASS: 9,
    SIGN_GRASS: 10
};

// Configuration de chaque type de tuile
const TileConfig = {
    [TileTypes.EMPTY]: {
        name: 'Vide',
        color: '#2a2a2a',
        solid: false,
        minable: false,
        resource: null
    },
    [TileTypes.GRASS]: {
        name: 'Herbe',
        color: '#4a9d4e',
        solid: false,
        minable: false,
        resource: null
    },
    [TileTypes.STONE]: {
        name: 'Pierre',
        color: '#7a7a7a',
        solid: true,
        minable: true,
        resource: 'stone',
        durability: 1
    },
    [TileTypes.IRON]: {
        name: 'Fer',
        color: '#b87333',
        solid: true,
        minable: true,
        resource: 'iron',
        durability: 2
    },
    [TileTypes.GOLD]: {
        name: 'Or',
        color: '#ffd700',
        solid: true,
        minable: true,
        resource: 'gold',
        durability: 3
    },
    [TileTypes.WALL]: {
        name: 'Mur',
        color: '#3a3a3a',
        solid: true,
        minable: false,
        resource: null
    },
    [TileTypes.CHEST]: {
        name: 'Coffre',
        color: '#8B4513',
        solid: true,
        minable: false,
        resource: null,
        interactive: true,
        openable: true
    },
    [TileTypes.SIGN]: {
        name: 'Panneau',
        color: '#D2691E',
        solid: true,
        minable: false,
        resource: null,
        interactive: true,
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.'
    },
    [TileTypes.WARP]: {
        name: 'Warp',
        color: '#9370DB',
        solid: false,
        minable: false,
        resource: null,
        interactive: true,
        warp: true,
        targetLevel: null
    },
    [TileTypes.CHEST_GRASS]: {
        name: 'Coffre (Herbe)',
        color: '#8B4513',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null,
        interactive: true,
        openable: true
    },
    [TileTypes.SIGN_GRASS]: {
        name: 'Panneau (Herbe)',
        color: '#D2691E',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null,
        interactive: true,
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.'
    }
};

// Classe pour gérer la génération des tuiles
class TileRenderer {
    constructor() {
        this.tileSize = 32;
        this.cache = {};
    }

    // Génère l'image d'une tuile
    generateTile(type) {
        if (this.cache[type]) {
            return this.cache[type];
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        const config = TileConfig[type];
        
        // Couleur de base
        ctx.fillStyle = config.color;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Ajouter des détails selon le type
        switch(type) {
            case TileTypes.GRASS:
                this.drawGrass(ctx);
                break;
            case TileTypes.STONE:
                this.drawStone(ctx);
                break;
            case TileTypes.IRON:
                this.drawIron(ctx);
                break;
            case TileTypes.GOLD:
                this.drawGold(ctx);
                break;
            case TileTypes.WALL:
                this.drawWall(ctx);
                break;
            case TileTypes.CHEST:
                this.drawChest(ctx);
                break;
            case TileTypes.SIGN:
                this.drawSign(ctx);
                break;
            case TileTypes.WARP:
                this.drawWarp(ctx);
                break;
            case TileTypes.CHEST_GRASS:
                this.drawChestGrass(ctx);
                break;
            case TileTypes.SIGN_GRASS:
                this.drawSignGrass(ctx);
                break;
        }

        // Bordure pour tous les types sauf vide
        if (type !== TileTypes.EMPTY) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, this.tileSize, this.tileSize);
        }

        this.cache[type] = canvas;
        return canvas;
    }

    drawGrass(ctx) {
        // Brins d'herbe
        ctx.fillStyle = '#3d8b40';
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * 28 + 2;
            const y = Math.random() * 28 + 2;
            ctx.fillRect(x, y, 2, 4);
        }
    }

    drawStone(ctx) {
        // Texture de pierre
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(4, 4, 8, 8);
        ctx.fillRect(20, 16, 6, 6);
        ctx.fillRect(12, 22, 10, 6);
        
        ctx.fillStyle = 'rgba(60, 60, 60, 0.4)';
        ctx.fillRect(16, 6, 12, 8);
        ctx.fillRect(6, 18, 8, 4);
    }

    drawIron(ctx) {
        // Veines de fer
        ctx.fillStyle = '#8b5a3c';
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(6, 6, 6, 6);
        ctx.fillRect(18, 14, 8, 8);
        ctx.fillRect(10, 22, 6, 4);
        
        ctx.fillStyle = '#cd853f';
        ctx.fillRect(8, 8, 2, 2);
        ctx.fillRect(20, 16, 4, 4);
    }

    drawGold(ctx) {
        // Veines d'or
        ctx.fillStyle = '#daa520';
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(6, 6, 8, 8);
        ctx.fillRect(18, 14, 10, 10);
        ctx.fillRect(8, 22, 8, 6);
        
        ctx.fillStyle = '#ffed4e';
        ctx.fillRect(10, 10, 4, 4);
        ctx.fillRect(22, 18, 4, 4);
    }

    drawWall(ctx) {
        // Texture de mur en briques
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        
        // Lignes horizontales
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(32, 10);
        ctx.moveTo(0, 20);
        ctx.lineTo(32, 20);
        ctx.stroke();
        
        // Lignes verticales décalées
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(16, 10);
        ctx.moveTo(8, 10);
        ctx.lineTo(8, 20);
        ctx.moveTo(24, 10);
        ctx.lineTo(24, 20);
        ctx.moveTo(16, 20);
        ctx.lineTo(16, 32);
        ctx.stroke();
    }

    drawChest(ctx) {
        // Coffre au trésor
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 32, 32);
        
        // Corps du coffre
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(4, 12, 24, 16);
        
        // Couvercle
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(4, 6, 24, 8);
        ctx.arc(16, 6, 12, Math.PI, 0, false);
        ctx.fill();
        
        // Serrure
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(14, 16, 4, 6);
        ctx.beginPath();
        ctx.arc(16, 16, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Détails
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 12, 24, 16);
    }

    drawSign(ctx) {
        // Panneau en bois
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(0, 0, 32, 32);
        
        // Poteau
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(14, 20, 4, 12);
        
        // Planche
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(4, 8, 24, 14);
        
        // Bordure de la planche
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 8, 24, 14);
        
        // Lignes de texte simulées
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, 12);
        ctx.lineTo(24, 12);
        ctx.moveTo(8, 15);
        ctx.lineTo(22, 15);
        ctx.moveTo(8, 18);
        ctx.lineTo(24, 18);
        ctx.stroke();
    }

    drawWarp(ctx) {
        // Effet de portail avec cercles concentriques
        const centerX = 16;
        const centerY = 16;
        
        // Cercles externes
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Cercle intermédiaire
        ctx.fillStyle = '#BA55D3';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Cercle central
        ctx.fillStyle = '#DDA0DD';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Point central brillant
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Étoiles autour
        ctx.fillStyle = '#FFF';
        const stars = [[8, 8], [24, 8], [8, 24], [24, 24]];
        stars.forEach(([x, y]) => {
            ctx.fillRect(x, y, 2, 2);
        });
    }

    drawChestGrass(ctx) {
        // Fond vert pelouse (même couleur que GRASS)
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Coffre par dessus
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(8, 12, 16, 12);
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(8, 18, 16, 2);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(14, 16, 4, 4);
    }

    drawSignGrass(ctx) {
        // Fond vert pelouse (même couleur que GRASS)
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Poteau
        ctx.fillStyle = '#654321';
        ctx.fillRect(14, 20, 4, 8);
        
        // Panneau
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(6, 8, 20, 12);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(6, 8, 20, 2);
        ctx.fillRect(6, 18, 20, 2);
        
        // Lignes de texte
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, 12);
        ctx.lineTo(24, 12);
        ctx.moveTo(8, 15);
        ctx.lineTo(22, 15);
        ctx.stroke();
    }

    // Récupère l'image d'une tuile
    getTile(type) {
        return this.generateTile(type);
    }
}

// Instance globale
const tileRenderer = new TileRenderer();
