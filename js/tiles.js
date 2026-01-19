// Définition des types de tuiles
const TileTypes = {
    EMPTY: 0,
    EARTH: 1,
    STONE: 2,
    IRON: 3,
    GOLD: 4,
    WALL: 5,
    GRASS: 111,
    CHEST: 10,
    SIGN: 11,
    WARP: 12,
    BARRIER_H: 20,
    BARRIER_V: 21,
    TREE: 30,
    BARRIER_L_NE: 40,
    BARRIER_L_SE: 41,
    BARRIER_L_SW: 42,
    BARRIER_L_NW: 43
};

// Configuration de chaque type de tuile
const TileConfig = {
    [TileTypes.EMPTY]: {
        name: 'Vide',
        color: 'transparent',
        minable: false,
        resource: null
    },
    [TileTypes.EARTH]: {
        name: 'Terre',
        color: '#8B4513',
        minable: true,
        resource: 'stone',
        drawFunction: 'drawGrass'
    },
    [TileTypes.STONE]: {
        name: 'Pierre',
        color: '#808080',
        minable: true,
        resource: 'stone',
        drawFunction: 'drawStone'
    },
    [TileTypes.IRON]: {
        name: 'Fer',
        color: '#8b5a3c',
        minable: true,
        resource: 'iron',
        drawFunction: 'drawIron'
    },
    [TileTypes.GOLD]: {
        name: 'Or',
        color: '#daa520',
        minable: true,
        resource: 'gold',
        drawFunction: 'drawGold'
    },
    [TileTypes.WALL]: {
        name: 'Mur',
        color: '#2a2a2a',
        minable: false,
        resource: null,
        drawFunction: 'drawWall'
    },
    [TileTypes.GRASS]: {
        name: 'Herbe',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawGrass'
    },
    [TileTypes.CHEST]: {
        name: 'Coffre',
        color: '#8b5a2b',
        minable: false,
        resource: null,
        drawFunction: 'drawChest'
    },
    [TileTypes.SIGN]: {
        name: 'Panneau',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawSign'
    },
    [TileTypes.WARP]: {
        name: 'Portail',
        color: '#9370DB',
        minable: false,
        resource: null,
        drawFunction: 'drawWarp'
    },
    [TileTypes.BARRIER_H]: {
        name: 'Barrière H',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawBarrierH'
    },
    [TileTypes.BARRIER_V]: {
        name: 'Barrière V',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawBarrierV'
    },
    [TileTypes.TREE]: {
        name: 'Arbre',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawTree'
    },
    [TileTypes.BARRIER_L_NE]: {
        name: 'Barrière L NE',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawBarrierL_NE'
    },
    [TileTypes.BARRIER_L_SE]: {
        name: 'Barrière L SE',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawBarrierL_SE'
    },
    [TileTypes.BARRIER_L_SW]: {
        name: 'Barrière L SW',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawBarrierL_SW'
    },
    [TileTypes.BARRIER_L_NW]: {
        name: 'Barrière L NW',
        color: '#4a9d4e',
        minable: false,
        resource: null,
        drawFunction: 'drawBarrierL_NW'
    }
};

// Classe pour gérer la génération des tuiles
class TileRenderer {
    constructor() {
        this.tileSize = 32;
        this.cache = {};
    }

    // Vider le cache pour forcer le rechargement des tuiles
    clearCache() {
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

        // DEBUG: Log chaque génération de tuile (max 5 fois)
        if (!window.tileGenerationLogged) window.tileGenerationLogged = {};
        if (!window.tileGenerationLogged[type]) {
            console.log(`🎨 Génération tuile ${type}: config=${config ? config.name : 'UNDEFINED'}`);
            window.tileGenerationLogged[type] = true;
        }

        // Si la tuile est inconnue ou mal définie, retourner un placeholder
        if (!config) {
            console.warn(`⚠️ Tuile ${type} non définie dans TileConfig!`);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, this.tileSize, this.tileSize);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, this.tileSize - 4, this.tileSize - 4);
            // Ajouter un "?" au centre
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', this.tileSize / 2, this.tileSize / 2);
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
                // Mettre à jour le cache une fois chargé
                this.cache[type] = canvas;
                // Appeler le callback de redraw
                if (typeof onTileImageLoaded === 'function') {
                    onTileImageLoaded(type);
                }
            };
            img.onerror = () => {
                console.warn('Erreur chargement image pour tuile:', type);
                ctx.fillStyle = '#888';
                ctx.fillRect(0, 0, this.tileSize, this.tileSize);
                this.cache[type] = canvas;
            };
            img.src = config.imageData;
            // Retourner un canvas blanc en attendant le chargement
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, this.tileSize, this.tileSize);
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
                            this.cache[type] = canvas;
                            // Appeler le callback de redraw
                            if (typeof onTileImageLoaded === 'function') {
                                onTileImageLoaded(type);
                            }
                        };
                        img.onerror = () => {
                            ctx.fillStyle = '#888';
                            ctx.fillRect(0, 0, this.tileSize, this.tileSize);
                            this.cache[type] = canvas;
                        };
                        img.src = t.imageData;
                        // Retourner un canvas blanc en attendant le chargement
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
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
        if (config.color && config.color !== 'transparent') {
            ctx.fillStyle = config.color;
            ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        } else {
            // Pour les tuiles transparentes, ne rien dessiner
            // (laisser le canvas transparent)
        }

        // Appeler la fonction de dessin personnalisée si elle existe
        if (config.drawFunction && typeof this[config.drawFunction] === 'function') {
            this[config.drawFunction](ctx);
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
        ctx.imageSmoothingEnabled = false;
        
        // Contour noir du coffre
        ctx.fillStyle = '#000000';
        // Contour supérieur
        ctx.fillRect(4, 3, 24, 1);
        // Contours latéraux
        ctx.fillRect(3, 4, 1, 17);
        ctx.fillRect(28, 4, 1, 17);
        // Contour inférieur
        ctx.fillRect(4, 21, 24, 1);
        
        // Bois marron foncé (planches horizontales)
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(4, 4, 24, 3);
        ctx.fillRect(4, 8, 24, 3);
        ctx.fillRect(4, 12, 24, 3);
        ctx.fillRect(4, 16, 24, 3);
        
        // Bois marron moyen
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(4, 7, 24, 1);
        ctx.fillRect(4, 11, 24, 1);
        ctx.fillRect(4, 15, 24, 1);
        ctx.fillRect(4, 19, 24, 1);
        
        // Bandes dorées verticales (gauche)
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(6, 4, 2, 17);
        ctx.fillRect(8, 3, 1, 1);
        ctx.fillRect(8, 21, 1, 1);
        
        // Bandes dorées verticales (droite)
        ctx.fillRect(24, 4, 2, 17);
        ctx.fillRect(23, 3, 1, 1);
        ctx.fillRect(23, 21, 1, 1);
        
        // Highlights dorés clairs
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(7, 5, 1, 15);
        ctx.fillRect(25, 5, 1, 15);
        
        // Serrure centrale dorée (fond)
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(13, 10, 6, 6);
        
        // Serrure centrale (highlight)
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(13, 10, 5, 5);
        
        // Trou de serrure noir
        ctx.fillStyle = '#000000';
        ctx.fillRect(15, 11, 2, 2);
        ctx.fillRect(15, 13, 2, 1);
        
        // Bande horizontale dorée centrale
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(4, 10, 9, 2);
        ctx.fillRect(19, 10, 9, 2);
        
        // Highlights bande horizontale
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(4, 10, 9, 1);
        ctx.fillRect(19, 10, 9, 1);
        
        // Ombres pour profondeur
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(4, 20, 24, 1);
        ctx.fillRect(27, 5, 1, 15);
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

// Callback global pour redraw après chargement d'images
let onTileImageLoaded = null;
