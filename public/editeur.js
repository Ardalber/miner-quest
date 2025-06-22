const tuiles = {
  charbon: "sprites/charbon.png",
  cuivre: "sprites/cuivre.png",
  fer: "sprites/fer.png",
  or: "sprites/or.png",
  diamant: "sprites/diamant.png",
  vide: "sprites/sol-miné.png"
};

let typeActif = "vide";
const taille = 15;
let salle = [];

// Création de la palette
const paletteDiv = document.getElementById("palette");
for (const [nom, chemin] of Object.entries(tuiles)) {
  const img = document.createElement("img");
  img.src = chemin;
  img.alt = nom;
  img.title = nom;
  img.className = "tuile";
  if (nom === "vide") img.classList.add("selected");

  img.addEventListener("click", () => {
    document.querySelectorAll(".tuile").forEach(t => t.classList.remove("selected"));
    img.classList.add("selected");
    typeActif = nom;
  });

  paletteDiv.appendChild(img);
}

// Initialiser la grille vide
const grilleDiv = document.getElementById("grille");
function initGrille() {
  salle = [];
  grilleDiv.innerHTML = "";
  for (let y = 0; y < taille; y++) {
    const ligne = [];
    for (let x = 0; x < taille; x++) {
      const cell = document.createElement("div");
      cell.className = "cellule";
      const img = document.createElement("img");
      img.src = tuiles.vide;
      cell.appendChild(img);

      cell.addEventListener("click", () => {
        img.src = tuiles[typeActif];
        ligne[x] = typeActif;
      });

      grilleDiv.appendChild(cell);
      ligne.push("vide");
    }
    salle.push(ligne);
  }
}

function remplirGrille(data) {
  salle = data.map(row => [...row]);
  grilleDiv.innerHTML = "";
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      const cell = document.createElement("div");
      cell.className = "cellule";
      const img = document.createElement("img");
      img.src = tuiles[salle[y][x]];
      cell.appendChild(img);

      cell.addEventListener("click", () => {
        img.src = tuiles[typeActif];
        salle[y][x] = typeActif;
      });

      grilleDiv.appendChild(cell);
    }
  }
}

function resetGrille() {
  initGrille();
  document.getElementById("nom-salle").value = "";
}

// 🔃 Charger les salles existantes
function chargerSalles() {
  fetch("salles.json")
    .then(res => res.json())
    .then(data => {
      const liste = document.getElementById("liste-salles");
      liste.innerHTML = "";

      data.forEach((salleItem, index) => {
        const div = document.createElement("div");
        div.className = "salle";

        const input = document.createElement("input");
        input.value = salleItem.nom;
        input.addEventListener("change", () => renommerSalle(index, input.value));
        div.appendChild(input);

        const canvas = document.createElement("canvas");
        canvas.width = taille;
        canvas.height = taille;
        canvas.style.width = "64px";
        canvas.style.height = "64px";
        const ctx = canvas.getContext("2d");

        salleItem.data.forEach((ligne, y) => {
          ligne.forEach((type, x) => {
            const img = new Image();
            img.src = tuiles[type] || tuiles["vide"];
            img.onload = () => ctx.drawImage(img, x, y, 1, 1);
          });
        });

        div.appendChild(canvas);

        const btnModif = document.createElement("button");
        btnModif.textContent = "🖊 Modifier";
        btnModif.onclick = () => {
          document.getElementById("nom-salle").value = salleItem.nom;
          remplirGrille(salleItem.data);
          selectedIndex = index;
        };
        div.appendChild(btnModif);

        const btnSuppr = document.createElement("button");
        btnSuppr.textContent = "🗑 Supprimer";
        btnSuppr.onclick = () => supprimerSalle(index);
        div.appendChild(btnSuppr);

        liste.appendChild(div);
      });
    });
}

// 💾 Sauvegarder (ajout ou modification)
let selectedIndex = null;
function sauvegarder() {
  const nom = document.getElementById("nom-salle").value.trim() || "Salle sans nom";

  if (selectedIndex !== null) {
    // Modification
    fetch(`/api/modifier-salle/${selectedIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: salle })
    });

    fetch(`/api/renommer-salle/${selectedIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom })
    });

    alert("✅ Salle modifiée !");
    selectedIndex = null;
    resetGrille();
    chargerSalles();
  } else {
    // Nouvelle salle
    fetch("/api/ajouter-salle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, data: salle })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("✅ Salle ajoutée !");
        resetGrille();
        chargerSalles();
      }
    });
  }
}

// 🔤 Renommer une salle
function renommerSalle(index, nom) {
  fetch(`/api/renommer-salle/${index}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom })
  });
}

// ❌ Supprimer une salle
function supprimerSalle(index) {
  if (!confirm("Supprimer cette salle ?")) return;

  fetch(`/api/supprimer-salle/${index}`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("🗑 Supprimée !");
        chargerSalles();
      }
    });
}

// ▶️ Initialiser
initGrille();
chargerSalles();
