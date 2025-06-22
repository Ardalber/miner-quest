let typeActif = "vide";
const taille = 16;
let salle = [];

const paletteDiv = document.getElementById("palette");
const grilleDiv = document.getElementById("grille");
const messageDiv = document.getElementById("message");
const nomInput = document.getElementById("nom-salle");
const listeSallesDiv = document.getElementById("liste-salles");

const TITRES_CATEGORIES = {
  minerai: "🪨 Minerai",
  pioche: "🪓 Pioche",
  decor: "🎨 Décor"
};

// 🔁 Palette dynamique par catégories
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
  salle = [];
  grilleDiv.innerHTML = "";

  for (let y = 0; y < taille; y++) {
    const ligne = [];
    for (let x = 0; x < taille; x++) {
      const cellule = document.createElement("div");
      cellule.className = "cellule";

      const img = document.createElement("img");
      img.src = `sprites/decor/vide.png`; // ❗ Attention : chemin corrigé si "vide.png" est dans decor/
      img.alt = "vide";
      cellule.appendChild(img);

      cellule.addEventListener("click", () => {
        // Cherche le chemin correct selon la palette chargée
        const allTuiles = document.querySelectorAll(".tuile");
        const tuile = [...allTuiles].find(img => img.alt === typeActif);
        if (tuile) {
          img.src = tuile.src;
          img.alt = typeActif;
        }
        ligne[x] = typeActif;
      });

      grilleDiv.appendChild(cellule);
      ligne[x] = "vide";
    }
    salle.push(ligne);
  }
}

function resetGrille() {
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

      // Créer une map tuile -> src
      const mapSrc = {};
      document.querySelectorAll(".tuile").forEach(t => {
        mapSrc[t.alt] = t.src;
      });

      for (const salle of salles) {
        const div = document.createElement("div");
        div.className = "salle-item";

        // Miniature en canvas
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");

        const tailleSalle = salle.data.length;
        const tailleTuile = 1; // 1 pixel par bloc

        // Créer une image pour chaque tuile et dessiner dans le canvas
        const promises = [];

        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const type = salle.data[y]?.[x] || "vide";
            const img = new Image();
            img.src = mapSrc[type] || mapSrc["vide"];
            const px = x * tailleTuile;
            const py = y * tailleTuile;

            const prom = new Promise(resolve => {
              img.onload = () => {
                ctx.drawImage(img, 0, 0, img.width, img.height, px, py, 1, 1);
                resolve();
              };
              img.onerror = () => resolve();
            });

            promises.push(prom);
          }
        }

        Promise.all(promises).then(() => {
          // Titre et boutons
          const titre = document.createElement("strong");
          titre.textContent = salle.nom;

          const btnCharger = document.createElement("button");
          btnCharger.textContent = "📂";
          btnCharger.onclick = () => charger(salle.nom);

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
    }, 3000); // délai avant retour au bouton normal
  } else {
    supprimer(salle.nom);
  }
};

          // Affichage
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
      grilleDiv.innerHTML = "";

      for (let y = 0; y < taille; y++) {
        for (let x = 0; x < taille; x++) {
          const cellule = document.createElement("div");
          cellule.className = "cellule";

          const type = salle[y][x];
          const tuile = document.querySelector(`.tuile[alt="${type}"]`);
          const chemin = tuile ? tuile.src : `sprites/decor/vide.png`;

          const img = document.createElement("img");
          img.src = chemin;
          img.alt = type;
          cellule.appendChild(img);

          cellule.addEventListener("click", () => {
            const tuile = document.querySelector(`.tuile[alt="${typeActif}"]`);
            if (tuile) {
              img.src = tuile.src;
              img.alt = typeActif;
            }
            salle[y][x] = typeActif;
          });

          grilleDiv.appendChild(cellule);
        }
      }
    });
}

function supprimer(nom) {
  fetch(`/api/supprimer-salle/${encodeURIComponent(nom)}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(() => chargerSalles());
}
