let typeActif = { nom: "vide", categorie: "decor" };
let nbLignes = 16;
let nbColonnes = 16;
let salle = [];
let salleModifiee = false;

const paletteDiv = document.getElementById("palette");
const grilleDiv = document.getElementById("grille");
const messageDiv = document.getElementById("message");
const nomInput = document.getElementById("nom-salle");
const listeSallesDiv = document.getElementById("liste-salles");
const tailleGrilleDiv = document.getElementById("taille-grille");

window.addEventListener("DOMContentLoaded", () => {
  chargerSprites();
  chargerSalles();
  genererGrille();
  setupFleches();
  document.getElementById("reset-grille").addEventListener("click", resetGrille);
  document.getElementById("sauvegarder").addEventListener("click", sauvegarderSalle);
});

function genererGrille() {
  grilleDiv.innerHTML = "";
  grilleDiv.style.gridTemplateColumns = `repeat(${nbColonnes}, 32px)`;
  grilleDiv.style.gridTemplateRows = `repeat(${nbLignes}, 32px)`;
  tailleGrilleDiv.textContent = `Grille : ${nbColonnes} × ${nbLignes}`;

  for (let y = 0; y < nbLignes; y++) {
    salle[y] = salle[y] || [];
    for (let x = 0; x < nbColonnes; x++) {
      salle[y][x] = salle[y][x] || { nom: "vide", categorie: "decor" };

      const cellule = document.createElement("div");
      cellule.className = "cellule";

      const img = document.createElement("img");
      img.src = `../sprites/${salle[y][x].categorie}/${salle[y][x].nom}.png`;
      cellule.appendChild(img);

      cellule.addEventListener("click", () => {
        salle[y][x] = { nom: typeActif.nom, categorie: typeActif.categorie };
        genererGrille();
        salleModifiee = true;
      });

      grilleDiv.appendChild(cellule);
    }
  }
}

function setupFleches() {
  document.getElementById("ajouter-ligne").addEventListener("click", () => {
    nbLignes++;
    genererGrille();
  });
  document.getElementById("retirer-ligne").addEventListener("click", () => {
    if (nbLignes > 1) nbLignes--;
    genererGrille();
  });
  document.getElementById("ajouter-colonne").addEventListener("click", () => {
    nbColonnes++;
    genererGrille();
  });
  document.getElementById("retirer-colonne").addEventListener("click", () => {
    if (nbColonnes > 1) nbColonnes--;
    genererGrille();
  });
}

function resetGrille() {
  salle = Array.from({ length: nbLignes }, () =>
    Array(nbColonnes).fill({ nom: "vide", categorie: "decor" })
  );
  genererGrille();
  salleModifiee = true;
}

function chargerSprites() {
  fetch("/api/sprites")
    .then(res => res.json())
    .then(sprites => {
      paletteDiv.innerHTML = "";
      const categories = ["decor", "minerai", "pioche"];
      categories.forEach(cat => {
        const catTitre = document.createElement("h3");
        catTitre.textContent = cat.toUpperCase();
        paletteDiv.appendChild(catTitre);

        sprites
          .filter(s => s.categorie === cat)
          .forEach(sprite => {
            const img = document.createElement("img");
            img.src = `../${sprite.chemin}`;
            img.alt = sprite.nom;
            img.className = "tuile";
            img.title = sprite.nom;

            img.addEventListener("click", () => {
              typeActif = { nom: sprite.nom, categorie: sprite.categorie };
              document.querySelectorAll(".tuile").forEach(i => i.classList.remove("active"));
              img.classList.add("active");
            });

            paletteDiv.appendChild(img);
          });
      });
    });
}

function sauvegarderSalle() {
  const nom = nomInput.value.trim();
  if (!nom) return alert("Nom de salle invalide");

  fetch("/api/ajouter-salle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, data: salle })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        salleModifiee = false;
        chargerSalles();
        alert("Salle sauvegardée !");
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    })
    .catch(err => {
      console.error("Erreur réseau :", err);
      alert("Erreur de réseau");
    });
}

function chargerSalles() {
  fetch("/api/salles")
    .then(res => res.json())
    .then(salles => {
      listeSallesDiv.innerHTML = "";
      salles.forEach(salle => {
        const div = document.createElement("div");
        div.className = "salle-item";

        const nomSpan = document.createElement("span");
        nomSpan.textContent = salle.nom;
        div.appendChild(nomSpan);

        const btnCharger = document.createElement("button");
        btnCharger.textContent = "📂";
        btnCharger.title = "Charger";
        btnCharger.addEventListener("click", () => chargerSalleDansGrille(salle));
        div.appendChild(btnCharger);

        const btnSupprimer = document.createElement("button");
        btnSupprimer.textContent = "🗑";
        btnSupprimer.title = "Supprimer";
        btnSupprimer.addEventListener("click", () => supprimerSalle(salle.nom));
        div.appendChild(btnSupprimer);

        listeSallesDiv.appendChild(div);
      });
    });
}

function chargerSalleDansGrille(salleData) {
  nbLignes = salleData.data.length;
  nbColonnes = salleData.data[0].length;
  salle = salleData.data.map(row => row.map(c => c || { nom: "vide", categorie: "decor" }));
  nomInput.value = salleData.nom;
  genererGrille();
}

function supprimerSalle(nomSalle) {
  if (!confirm(`Supprimer la salle "${nomSalle}" ?`)) return;

  fetch(`/api/salle/${encodeURIComponent(nomSalle)}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Salle supprimée !");
        chargerSalles();
      } else {
        alert("Erreur lors de la suppression.");
      }
    })
    .catch(err => {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur réseau.");
    });
}
