// public/JS/editeur.js

let typeActif   = "vide";
let salle       = [];
let nbLignes    = 16;
let nbColonnes  = 16;

const paletteDiv     = document.getElementById("palette");
const grilleDiv      = document.getElementById("grille");
const messageDiv     = document.getElementById("message");
const nomInput       = document.getElementById("nom-salle");
const listeSallesDiv = document.getElementById("liste-salles");

window.addEventListener("DOMContentLoaded", () => {
  synchroniserDonnees();
  chargerPalette();
  chargerSalles();
  renderGrille();
  setupFleches();
  document.getElementById("reset-grille")
    .addEventListener("click", resetGrille);
  document.getElementById("sauvegarder")
    .addEventListener("click", sauvegarder);
});

function synchroniserDonnees() {
  if (!salle.length) {
    salle = Array.from({ length: nbLignes },
      () => Array(nbColonnes).fill("vide"));
  } else {
    while (salle.length < nbLignes) salle.push(Array(nbColonnes).fill("vide"));
    while (salle.length > nbLignes) salle.pop();
    salle.forEach(row => {
      while (row.length < nbColonnes) row.push("vide");
      while (row.length > nbColonnes) row.pop();
    });
  }
}

function renderGrille() {
  grilleDiv.innerHTML = "";
  grilleDiv.style.gridTemplateColumns = `repeat(${nbColonnes}, 32px)`;
  grilleDiv.style.gridTemplateRows    = `repeat(${nbLignes},    32px)`;
  for (let y = 0; y < nbLignes; y++) {
    for (let x = 0; x < nbColonnes; x++) {
      const cell = document.createElement("div");
      cell.className = "cellule";
      const img    = document.createElement("img");
      const type   = salle[y][x];
      const spr    = document.querySelector(`.tuile[alt="${type}"]`);
      img.src = (type && type !== "vide" && spr)
        ? spr.src
        : "/sprites/decor/vide.png";
      cell.appendChild(img);
      cell.addEventListener("click", () => {
        salle[y][x] = typeActif;
        renderGrille();
      });
      grilleDiv.appendChild(cell);
    }
  }
  document.getElementById("taille-grille").textContent =
    `Grille : ${nbLignes} × ${nbColonnes}`;
}

async function chargerPalette() {
  try {
    const res = await fetch("/api/sprites");
    const sprites = await res.json();
    paletteDiv.innerHTML = "";
    const sections = sprites.reduce((acc, sp) => {
      (acc[sp.categorie] = acc[sp.categorie]||[]).push(sp);
      return acc;
    }, {});
    for (const [cat, list] of Object.entries(sections)) {
      const sec = document.createElement("div");
      sec.className = "palette-section";
      const h3 = document.createElement("h3");
      h3.textContent = cat;
      sec.appendChild(h3);
      const row = document.createElement("div");
      row.className = "tuile-ligne";
      list.forEach(sp => {
        const img = document.createElement("img");
        img.src = `/${sp.chemin}`;
        img.alt = sp.nom;
        img.className = "tuile";
        if (sp.nom === "vide") img.classList.add("selected");
        img.addEventListener("click", () => {
          document.querySelectorAll(".tuile.selected")
            .forEach(t => t.classList.remove("selected"));
          img.classList.add("selected");
          typeActif = sp.nom;
        });
        row.appendChild(img);
      });
      sec.appendChild(row);
      paletteDiv.appendChild(sec);
    }
  } catch (err) {
    console.error("Erreur chargement palette :", err);
    messageDiv.textContent = "❌ Erreur chargement palette";
  }
}

async function chargerSalles() {
  try {
    const res = await fetch("/api/salles");
    const salles = await res.json();
    listeSallesDiv.innerHTML = "";
    const mapSrc = {};
    document.querySelectorAll(".tuile")
      .forEach(t => mapSrc[t.alt] = t.src);
    for (const s of salles) {
      const div = document.createElement("div");
      div.className = "salle-item";
      const canvas = document.createElement("canvas");
      canvas.width  = s.data[0]?.length || 16;
      canvas.height = s.data.length;
      const ctx = canvas.getContext("2d");
      const prom = [];
      for (let y = 0; y < s.data.length; y++) {
        for (let x = 0; x < (s.data[0]||[]).length; x++) {
          const img = new Image();
          img.src = mapSrc[s.data[y][x]] || mapSrc["vide"];
          prom.push(new Promise(r => {
            img.onload  = () => { 
              ctx.drawImage(img, 0, 0, img.width, img.height, x, y, 1, 1);
              r();
            };
            img.onerror = r;
          }));
        }
      }
      await Promise.all(prom);
      const titre = document.createElement("strong");
      titre.textContent = s.nom;
      const btnCh = document.createElement("button");
      btnCh.textContent = "📂";
      btnCh.addEventListener("click", () => {
        if (confirm("Charger cette salle ?")) {
          salle       = JSON.parse(JSON.stringify(s.data));
          nbLignes    = salle.length;
          nbColonnes  = salle[0]?.length || nbColonnes;
          synchroniserDonnees();
          renderGrille();
          nomInput.value = s.nom;
        }
      });
      const btnDel = document.createElement("button");
      btnDel.textContent = "🗑️";
      btnDel.addEventListener("click", () => {
        if (confirm(`Supprimer "${s.nom}" ?`)) {
          fetch(`/api/supprimer-salle/${encodeURIComponent(s.nom)}`, { method: "DELETE" })
            .then(() => chargerSalles());
        }
      });
      div.append(canvas, titre, btnCh, btnDel);
      listeSallesDiv.appendChild(div);
    }
  } catch (err) {
    console.error("Erreur chargement salles :", err);
    messageDiv.textContent = "❌ Erreur chargement salles";
  }
}

function setupFleches() {
  document.getElementById("ajouter-ligne")
    .addEventListener("click", () => {
      nbLignes++; synchroniserDonnees(); renderGrille();
    });
  document.getElementById("retirer-ligne")
    .addEventListener("click", () => {
      if (nbLignes > 1) { nbLignes--; synchroniserDonnees(); renderGrille(); }
    });
  document.getElementById("ajouter-colonne")
    .addEventListener("click", () => {
      nbColonnes++; synchroniserDonnees(); renderGrille();
    });
  document.getElementById("retirer-colonne")
    .addEventListener("click", () => {
      if (nbColonnes > 1) { nbColonnes--; synchroniserDonnees(); renderGrille(); }
    });
}

function resetGrille() {
  salle = Array.from({ length: nbLignes }, () => Array(nbColonnes).fill("vide"));
  renderGrille();
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
    messageDiv.textContent = data.success
      ? "✅ Salle sauvegardée."
      : "❌ Erreur lors de la sauvegarde.";
    chargerSalles();
  })
  .catch(() => {
    messageDiv.textContent = "❌ Erreur réseau.";
  });
}
