const taille = 15; // Grille 15x15
let posX = Math.floor(taille / 2);
let posY = Math.floor(taille / 2);

const grille = document.getElementById("grille");
const inventaireDiv = document.getElementById("inventaire");
let inventaire = {};

const types = ["charbon", "cuivre", "fer", "or", "diamant"];
const ressources = {
  charbon: "sprites/charbon.png",
  cuivre: "sprites/cuivre.png",
  fer: "sprites/fer.png",
  or: "sprites/or.png",
  diamant: "sprites/diamant.png",
  vide: "sprites/sol-miné.png",
};

// Génère la grille de jeu
function genererGrille() {
  grille.style.gridTemplateColumns = `repeat(${taille}, 32px)`;
  grille.style.gridTemplateRows = `repeat(${taille}, 32px)`;

  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      const cellule = document.createElement("div");
      cellule.classList.add("cellule");

      const type = types[Math.floor(Math.random() * types.length)];
      cellule.dataset.ressource = type;

      const img = document.createElement("img");
      img.src = ressources[type];
      cellule.appendChild(img);

      grille.appendChild(cellule);
    }
  }
  majPerso();
}

// Met à jour la position du personnage
function majPerso() {
  document.querySelectorAll(".perso-img").forEach((el) => el.remove());

  const index = posY * taille + posX;
  const cellule = grille.children[index];

  const img = document.createElement("img");
  img.src = "sprites/perso-pioche-haut.png";
  img.classList.add("perso-img");

  cellule.appendChild(img);
}

// Gère les déplacements avec ZQSD
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "z" && posY > 0) posY--;
  if (key === "s" && posY < taille - 1) posY++;
  if (key === "q" && posX > 0) posX--;
  if (key === "d" && posX < taille - 1) posX++;

  if (["z", "q", "s", "d"].includes(key)) {
    majPerso();
  }

  if (key === "e") {
    miner();
  }
});

// Fonction de minage + animation sur 2 frames
function miner() {
  const index = posY * taille + posX;
  const current = grille.children[index];
  const ressource = current.dataset.ressource;

  const persoImg = current.querySelector(".perso-img");

  if (persoImg) {
    persoImg.src = "sprites/perso-pioche-bas.png";
    setTimeout(() => {
      persoImg.src = "sprites/perso-pioche-haut.png";
    }, 200);
  }

  if (ressource && ressource !== "vide") {
    inventaire[ressource] = (inventaire[ressource] || 0) + 1;
    current.dataset.ressource = "vide";
    current.querySelector("img").src = ressources["vide"];
    majInventaire();
  }
}

// Met à jour l'affichage de l'inventaire
function majInventaire() {
  const itemsList = document.getElementById("items");
  itemsList.innerHTML = "";

  for (const [type, quantite] of Object.entries(inventaire)) {
    const ligne = document.createElement("li");
    ligne.title = type; // ✅ Affiche le nom au survol

    const img = document.createElement("img");
    img.src = ressources[type];
    img.alt = type;
    img.width = 24;
    img.height = 24;

    const quantiteSpan = document.createElement("span");
    quantiteSpan.textContent = quantite;

    ligne.appendChild(img);
    ligne.appendChild(quantiteSpan);
    itemsList.appendChild(ligne);
  }

  // ✅ Mise à jour de la pioche affichée
  const piocheEl = document.getElementById("pioche-actuelle");
  if (piocheEl) {
    piocheEl.innerHTML = `
      <h3>Pioche</h3>
      <img src="sprites/pioche-bois.png" alt="pioche en bois" width="32" height="32">
      <p>Pioche en bois</p>
    `;
  }
}

genererGrille();
