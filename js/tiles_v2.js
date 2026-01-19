// Tuiles de jeu - VERSION 2 COMPLÈTE ET SIMPLE
console.log('✓✓✓ LOADING TILES_V2.JS ✓✓✓');

// Définir TileConfig directement
window.TileConfig = {};

// Tuile 0: EMPTY
window.TileConfig[0] = { name: 'Vide', color: 'transparent', minable: false, resource: null };

// Tuile 1: EARTH
window.TileConfig[1] = { name: 'Terre', color: '#8B4513', minable: true, resource: 'stone', drawFunction: 'drawGrass' };

// Tuile 2: STONE
window.TileConfig[2] = { name: 'Pierre', color: '#808080', minable: true, resource: 'stone', drawFunction: 'drawStone' };

// Tuile 3: IRON
window.TileConfig[3] = { name: 'Fer', color: '#8b5a3c', minable: true, resource: 'iron', drawFunction: 'drawIron' };

// Tuile 4: GOLD
window.TileConfig[4] = { name: 'Or', color: '#daa520', minable: true, resource: 'gold', drawFunction: 'drawGold' };

// Tuile 5: WALL
window.TileConfig[5] = { name: 'Mur', color: '#2a2a2a', minable: false, resource: null, drawFunction: 'drawWall' };

// Tuile 10: CHEST
window.TileConfig[10] = { name: 'Coffre', color: '#8b5a2b', minable: false, resource: null, drawFunction: 'drawChest' };

// Tuile 11: SIGN
window.TileConfig[11] = { name: 'Panneau', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawSign' };

// Tuile 12: WARP
window.TileConfig[12] = { name: 'Portail', color: '#9370DB', minable: false, resource: null, drawFunction: 'drawWarp' };

// Tuile 20: BARRIER_H
window.TileConfig[20] = { name: 'Barrière H', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawBarrierH' };

// Tuile 21: BARRIER_V
window.TileConfig[21] = { name: 'Barrière V', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawBarrierV' };

// Tuile 30: TREE
window.TileConfig[30] = { name: 'Arbre', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawTree' };

// Tuile 40: BARRIER_L_NE
window.TileConfig[40] = { name: 'Barrière L NE', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawBarrierL_NE' };

// Tuile 41: BARRIER_L_SE
window.TileConfig[41] = { name: 'Barrière L SE', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawBarrierL_SE' };

// Tuile 42: BARRIER_L_SW
window.TileConfig[42] = { name: 'Barrière L SW', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawBarrierL_SW' };

// Tuile 43: BARRIER_L_NW
window.TileConfig[43] = { name: 'Barrière L NW', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawBarrierL_NW' };

// Tuile 111: GRASS (LA TUILE IMPORTANTE!)
window.TileConfig[111] = { name: 'Herbe', color: '#4a9d4e', minable: false, resource: null, drawFunction: 'drawGrass' };

console.log('✓✓✓ TileConfig[111] =', window.TileConfig[111]);
console.log('✓✓✓ All TileConfig keys:', Object.keys(window.TileConfig).filter(k => !isNaN(k)).sort((a,b)=>a-b).join(', '));
console.log('✓✓✓ TILES_V2.JS LOADED SUCCESSFULLY ✓✓✓');
