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
    BARRIER_H: 11,
    BARRIER_V: 12,
    TREE: 13,
    BARRIER_L_NE: 14,
    BARRIER_L_SE: 15,
    BARRIER_L_SW: 16,
    BARRIER_L_NW: 17
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
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null,
        interactive: true,
        openable: true
    },
    [TileTypes.SIGN]: {
        name: 'Panneau',
        color: '#D2691E',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null,
        interactive: true,
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.'
    },
    [TileTypes.WARP]: {
        name: 'Warp',
        color: '#9370DB',
        solid: true,
        minable: true,
        resource: null,
        interactive: false,
        warp: true,
        targetLevel: null,
        durability: 1
    },
    [TileTypes.BARRIER_H]: {
        name: 'Barrière (H)',
        color: '#8B4513',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null
    },
    [TileTypes.BARRIER_V]: {
        name: 'Barrière (V)',
        color: '#8B4513',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null
    },
    [TileTypes.TREE]: {
        name: 'Arbre',
        color: '#2e8b57',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null
    },
    [TileTypes.BARRIER_L_NE]: {
        name: 'Barrière (L)',
        color: '#8B4513',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null
    },
    [TileTypes.BARRIER_L_SE]: {
        name: 'Barrière (L)',
        color: '#8B4513',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null
    },
    [TileTypes.BARRIER_L_SW]: {
        name: 'Barrière (L)',
        color: '#8B4513',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null
    },
    [TileTypes.BARRIER_L_NW]: {
        name: 'Barrière (L)',
        color: '#8B4513',
        backgroundColor: '#4a9d4e',
        solid: true,
        minable: false,
        resource: null
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

        // Si la tuile est inconnue ou mal définie, retourner un placeholder
        if (!config) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.tileSize, this.tileSize);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, this.tileSize, this.tileSize);
            this.cache[type] = canvas;
            return canvas;
        }

        // Support des tuiles personnalisées dessinées (PNG base64)
        if (config.imageData) {
            const img = new Image();
            img.onload = () => {
                ctx.imageSmoothingEnabled = false;
                ctx.clearRect(0, 0, this.tileSize, this.tileSize);
                ctx.drawImage(img, 0, 0, this.tileSize, this.tileSize);
                // Bordure légère pour rester cohérent visuellement
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, this.tileSize, this.tileSize);
            };
            img.src = config.imageData;
            this.cache[type] = canvas;
            return canvas;
        }

        // Fallback: essayer de récupérer depuis localStorage (anciennes tuiles sans imageData)
        try {
            const stored = localStorage.getItem('customTiles');
            if (stored) {
                const all = JSON.parse(stored);
                const t = all[type];
                if (t) {
                    if (t.imageData) {
                        const img = new Image();
                        img.onload = () => {
                            ctx.imageSmoothingEnabled = false;
                            ctx.clearRect(0, 0, this.tileSize, this.tileSize);
                            ctx.drawImage(img, 0, 0, this.tileSize, this.tileSize);
                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(0, 0, this.tileSize, this.tileSize);
                        };
                        img.src = t.imageData;
                        this.cache[type] = canvas;
                        return canvas;
                    } else if (Array.isArray(t.pixelData) && t.pixelData.length === 32*32) {
                        for (let i = 0; i < t.pixelData.length; i++) {
                            const x = i % 32, y = Math.floor(i / 32);
                            ctx.fillStyle = t.pixelData[i] || '#ffffff';
                            ctx.fillRect(x, y, 1, 1);
                        }
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(0, 0, this.tileSize, this.tileSize);
                        this.cache[type] = canvas;
                        return canvas;
                    }
                }
            }
        } catch (e) {
            // ignorer silencieusement
        }
        
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
            case TileTypes.BARRIER_H:
                this.drawBarrierH(ctx);
                break;
            case TileTypes.BARRIER_V:
                this.drawBarrierV(ctx);
                break;
            case TileTypes.TREE:
                this.drawTree(ctx);
                break;
            case TileTypes.BARRIER_L_NE:
                this.drawBarrierL_NE(ctx);
                break;
            case TileTypes.BARRIER_L_SE:
                this.drawBarrierL_SE(ctx);
                break;
            case TileTypes.BARRIER_L_SW:
                this.drawBarrierL_SW(ctx);
                break;
            case TileTypes.BARRIER_L_NW:
                this.drawBarrierL_NW(ctx);
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
        // Fond herbe
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Coffre simplifié
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(8, 12, 16, 12);
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(8, 18, 16, 2);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(14, 16, 4, 4);
    }

    drawSign(ctx) {
        // Fond herbe
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

    drawBarrierH(ctx) {
        // Fond herbe
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Deux lattes horizontales qui vont jusqu'aux bords pour connecter
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(0, 11, 32, 4);
        ctx.fillRect(0, 17, 32, 4);

        // Montants à gauche et droite (touchent les bords)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 8, 3, 16);
        ctx.fillRect(29, 8, 3, 16);

        // Détails d'ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 21, 32, 1);
    }

    drawBarrierV(ctx) {
        // Fond herbe
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Deux lattes verticales qui vont jusqu'aux bords pour connecter
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(11, 0, 4, 32);
        ctx.fillRect(17, 0, 4, 32);

        // Montants haut et bas (touchent les bords)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(8, 0, 16, 3);
        ctx.fillRect(8, 29, 16, 3);

        // Détails d'ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(21, 0, 1, 32);
    }

    drawTree(ctx) {
        // Fond herbe
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Tronc
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(14, 18, 4, 10);

        // Feuillage (vert différent de l'herbe)
        ctx.fillStyle = '#2e8b57';
        ctx.beginPath();
        ctx.arc(16, 14, 10, 0, Math.PI * 2);
        ctx.fill();

        // Légères nuances
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(12, 10, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBarrierL_NE(ctx) {
        // Coin haut-droit: barre horizontale à gauche + barre verticale en bas
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Barre horizontale (va de gauche vers centre-droit)
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(0, 11, 21, 4);
        ctx.fillRect(0, 17, 21, 4);

        // Barre verticale (va du centre vers bas)
        ctx.fillRect(11, 11, 4, 21);
        ctx.fillRect(17, 11, 4, 21);

        // Montants
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 8, 3, 16);
        ctx.fillRect(17, 8, 3, 16);
        ctx.fillRect(8, 17, 16, 3);
        ctx.fillRect(8, 29, 16, 3);

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 21, 21, 1);
        ctx.fillRect(21, 11, 1, 21);
    }

    drawBarrierL_SE(ctx) {
        // Coin bas-droit: barre horizontale à gauche + barre verticale en haut
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Barre horizontale (va de gauche vers centre-droit)
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(0, 11, 21, 4);
        ctx.fillRect(0, 17, 21, 4);

        // Barre verticale (va du haut vers centre)
        ctx.fillRect(11, 0, 4, 21);
        ctx.fillRect(17, 0, 4, 21);

        // Montants
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 8, 3, 16);
        ctx.fillRect(17, 8, 3, 16);
        ctx.fillRect(8, 0, 16, 3);
        ctx.fillRect(8, 17, 16, 3);

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 21, 21, 1);
        ctx.fillRect(21, 0, 1, 21);
    }

    drawBarrierL_SW(ctx) {
        // Coin bas-gauche: barre horizontale à droite + barre verticale en haut
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Barre horizontale (va du centre vers droite)
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(11, 11, 21, 4);
        ctx.fillRect(11, 17, 21, 4);

        // Barre verticale (va du haut vers centre)
        ctx.fillRect(11, 0, 4, 21);
        ctx.fillRect(17, 0, 4, 21);

        // Montants
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(11, 8, 3, 16);
        ctx.fillRect(29, 8, 3, 16);
        ctx.fillRect(8, 0, 16, 3);
        ctx.fillRect(8, 17, 16, 3);

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(11, 21, 21, 1);
        ctx.fillRect(11, 0, 1, 21);
    }

    drawBarrierL_NW(ctx) {
        // Coin haut-gauche: barre horizontale à droite + barre verticale en bas
        ctx.fillStyle = '#4a9d4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Barre horizontale (va du centre vers droite)
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(11, 11, 21, 4);
        ctx.fillRect(11, 17, 21, 4);

        // Barre verticale (va du centre vers bas)
        ctx.fillRect(11, 11, 4, 21);
        ctx.fillRect(17, 11, 4, 21);

        // Montants
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(11, 8, 3, 16);
        ctx.fillRect(29, 8, 3, 16);
        ctx.fillRect(8, 17, 16, 3);
        ctx.fillRect(8, 29, 16, 3);

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(11, 21, 21, 1);
        ctx.fillRect(21, 11, 1, 21);
    }

    // Récupère l'image d'une tuile
    getTile(type) {
        return this.generateTile(type);
    }

    // Invalider le cache pour forcer un rerendu
    invalidateCache(type) {
        if (type !== undefined) {
            delete this.cache[type];
        } else {
            this.cache = {};
        }
    }
}

// Instance globale
const tileRenderer = new TileRenderer();
