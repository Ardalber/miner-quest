let typeActif = "vide";
let nbLignes = 16;
let nbColonnes = 16;
let salle = [];
let salleModifiee = false;

const paletteDiv = document.getElementById("palette");
const grilleDiv = document.getElementById("grille");
const messageDiv = document.getElementById("message");
const nomInput = document.getElementById("nom-salle");
const listeSallesDiv = document.getElementById("liste-salles");

function mettreAJourLabelGrille() {
  const label = document.getElementById("taille-grille");
  if (label) {
    label.textContent = `Grille : ${nbLignes} × ${nbColonnes}`;
  }
}

const TITRES_CATEGORIES = {
  minerai: "🪨 Minerai",
  pioche: "🪓 Pioche",
  decor: "🎨 Décor"
};

fetch("/api/sprites")
  .then(res => res.json())
  .then(tuiles => {
    if (tuiles.length === 0) {
      messageDiv.textContent = "❌ Aucun sprite trouvé dans /sprites/";
      return;
    }

    const parCategorie = {};
    for (const tuile of tuiles) {
      if (!parCategorie[tuile.categorie]) {
        parCategorie[tuile.categorie] = [];
      }
      parCategorie[tuile.categorie].push(tuile);
    }

    for (const [categorie, tuilesCat] of Object.entries(parCategorie)) {
      const section = document.createElement("div");
      section.className = "palette-section";

      const titre = document.createElement("h3");
      titre.textContent = TITRES_CATEGORIES[categorie] || categorie;
      section.appendChild(titre);

      const ligne = document.createElement("div");
      ligne.className = "tuile-ligne";

      for (const tuile of tuilesCat) {
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

        ligne.appendChild(img);
      }

      section.appendChild(ligne);
      paletteDiv.appendChild(section);
    }

    initGrille();
    chargerSalles();
  });

function initGrille() {
  grilleDiv.innerHTML = "";

  // ✅ Fixer le nombre de colonnes dans la grille
  grilleDiv.style.gridTemplateColumns = `repeat(${nbColonnes}, 32px)`;

  for (let y = 0; y < nbLignes; y++) {
    if (!salle[y]) salle[y] = Array(nbColonnes).fill("vide");

    for (let x = 0; x < nbColonnes; x++) {
      if (!salle[y][x]) salle[y][x] = "vide";

      const cellule = document.createElement("div");
      cellule.className = "cellule";

      const img = document.createElement("img");
      const tuile = document.querySelector(`.tuile[alt="${salle[y][x]}"]`);
      img.src = tuile ? tuile.src : "sprites/decor/vide.png";
      img.alt = salle[y][x];

      cellule.appendChild(img);

      cellule.addEventListener("click", () => {
        const tuile = document.querySelector(`.tuile[alt="${typeActif}"]`);
        if (tuile) {
          img.src = tuile.src;
          img.alt = typeActif;
        }
        salle[y][x] = typeActif;
        salleModifiee = true;
      });

      grilleDiv.appendChild(cellule);
    }
  }

  mettreAJourLabelGrille();
}

function resetGrille() {
  salle = Array.from({ length: nbLignes }, () => Array(nbColonnes).fill("vide"));
  initGrille();
}

function sauvegarder() {
  const nom = nomInput.value.trim();
  if (!nom) {
    messageDiv.textContent = "❌ Entrez un nom de salle.";
    return;
  }

  fetch("/api/ajouter-salle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, data: salle })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        messageDiv.textContent = "✅ Salle sauvegardée.";
        nomInput.value = "";
        chargerSalles();
        salleModifiee = false;
      } else {
        messageDiv.textContent = "❌ Erreur lors de la sauvegarde.";
      }
    });
}

function chargerSalles() {
  fetch("/api/salles")
    .then(res => res.json())
    .then(salles => {
      listeSallesDiv.innerHTML = "";

      const mapSrc = {};
      document.querySelectorAll(".tuile").forEach(t => {
        mapSrc[t.alt] = t.src;
      });

      for (const salle of salles) {
        const div = document.createElement("div");
        div.className = "salle-item";

        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");

        const promises = [];

        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const type = salle.data[y]?.[x] || "vide";
            const img = new Image();
            img.src = mapSrc[type] || mapSrc["vide"];

            const prom = new Promise(resolve => {
              img.onload = () => {
                ctx.drawImage(img, 0, 0, img.width, img.height, x, y, 1, 1);
                resolve();
              };
              img.onerror = () => resolve();
            });

            promises.push(prom);
          }
        }

        Promise.all(promises).then(() => {
          const titre = document.createElement("strong");
          titre.textContent = salle.nom;

          const btnCharger = document.createElement("button");
          btnCharger.textContent = "📂";
          btnCharger.addEventListener("click", () => {
            if (salleModifiee) {
              const confirmation = confirm("Des modifications non sauvegardées seront perdues. Continuer ?");
              if (!confirmation) return;
            }
            salleModifiee = false;
            charger(salle.nom);
          });

          const btnSupprimer = document.createElement("button");
          btnSupprimer.textContent = "🗑️";
          let confirme = false;
          btnSupprimer.onclick = () => {
            if (!confirme) {
              btnSupprimer.textContent = "❗Confirmer ?";
              confirme = true;
              setTimeout(() => {
                btnSupprimer.textContent = "🗑️";
                confirme = false;
              }, 3000);
            } else {
              supprimer(salle.nom);
            }
          };

          div.appendChild(canvas);
          div.appendChild(titre);
          div.appendChild(btnCharger);
          div.appendChild(btnSupprimer);
        });

        listeSallesDiv.appendChild(div);
      }
    });
}

function charger(nom) {
  fetch("/api/salles")
    .then(res => res.json())
    .then(salles => {
      const cible = salles.find(s => s.nom === nom);
      if (!cible) return;

      salle = cible.data;
      nbLignes = salle.length;
      nbColonnes = salle[0]?.length || 0;
      initGrille();
    });
}

function supprimer(nom) {
  fetch(`/api/supprimer-salle/${encodeURIComponent(nom)}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(() => chargerSalles());
}

// 🔁 Redimension dynamique
document.getElementById("ajouter-ligne").addEventListener("click", () => {
  nbLignes++;
  salle.push(Array(nbColonnes).fill("vide"));
  initGrille();
});

document.getElementById("retirer-ligne").addEventListener("click", () => {
  if (nbLignes > 1) {
    nbLignes--;
    salle.pop();
    initGrille();
  }
});

document.getElementById("ajouter-colonne").addEventListener("click", () => {
  nbColonnes++;
  for (let ligne of salle) {
    ligne.push("vide");
  }
  initGrille();
});

document.getElementById("retirer-colonne").addEventListener("click", () => {
  if (nbColonnes > 1) {
    nbColonnes--;
    for (let ligne of salle) {
      ligne.pop();
    }
    initGrille();
  }
});
