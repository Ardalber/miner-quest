let typeActif = "vide";
const taille = 16; // 🔁 CHANGÉ à 16
let salle = [];

const paletteDiv = document.getElementById("palette");
const grilleDiv = document.getElementById("grille");
const messageDiv = document.getElementById("message");
const nomInput = document.getElementById("nom-salle");
const listeSallesDiv = document.getElementById("liste-salles");

// 🔁 Palette dynamique
fetch("/api/sprites")
  .then(res => res.json())
  .then(tuiles => {
    if (tuiles.length === 0) {
      messageDiv.textContent = "❌ Aucun sprite trouvé dans /sprites/";
      return;
    }

    for (const tuile of tuiles) {
      const img = document.createElement("img");
      img.src = tuile.chemin;
      img.alt = tuile.nom;
      img.title = tuile.nom;
      img.className = "tuile";
      if (tuile.nom === "vide") img.classList.add("selected");

      img.addEventListener("click", () => {
        document.querySelectorAll(".tuile").forEach(t => t.classList.remove("selected"));
        img.classList.add("selected");
        typeActif = tuile.nom;
      });

      paletteDiv.appendChild(img);
    }

    initGrille();      // ✅ ici seulement si tuiles valides
    chargerSalles();   // pour avoir la liste
  });

function initGrille() {
  salle = [];
  grilleDiv.innerHTML = "";

  for (let y = 0; y < taille; y++) {
    const ligne = [];
    for (let x = 0; x < taille; x++) {
      const cellule = document.createElement("div");
      cellule.className = "cellule";

      const img = document.createElement("img");
      img.src = `sprites/vide.png`;
      img.alt = "vide";
      cellule.appendChild(img);

      cellule.addEventListener("click", () => {
        img.src = `sprites/${typeActif}.png`;
        img.alt = typeActif;
        ligne[x] = typeActif;
      });

      grilleDiv.appendChild(cellule);
      ligne[x] = "vide";
    }
    salle.push(ligne);
  }
}
