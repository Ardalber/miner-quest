import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));

const sallesPath = path.join(__dirname, "public", "salles.json");

// 🧠 Lire les salles
function lireSalles() {
  if (!fs.existsSync(sallesPath)) return [];
  const contenu = fs.readFileSync(sallesPath, "utf8");
  try {
    return JSON.parse(contenu);
  } catch {
    return [];
  }
}

// 💾 Écrire les salles
function ecrireSalles(salles) {
  fs.writeFileSync(sallesPath, JSON.stringify(salles, null, 2));
}

// ✅ Ajouter une nouvelle salle
app.post("/api/ajouter-salle", (req, res) => {
  const { nom = "Nouvelle salle", data } = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ success: false });

  const salles = lireSalles();
  salles.push({ nom, data });
  ecrireSalles(salles);
  res.json({ success: true });
});

// 🔁 Lire toutes les salles
app.get("/api/salles", (req, res) => {
  res.json(lireSalles());
});

// ❌ Supprimer une salle
app.delete("/api/supprimer-salle/:nom", (req, res) => {
  const nom = decodeURIComponent(req.params.nom);
  let salles = lireSalles();
  salles = salles.filter(s => s.nom !== nom);
  ecrireSalles(salles);
  res.json({ success: true });
});

// ✏️ Modifier une salle
app.put("/api/modifier-salle/:nom", (req, res) => {
  const nom = decodeURIComponent(req.params.nom);
  const { nouveauNom, data } = req.body;

  let salles = lireSalles();
  const index = salles.findIndex(s => s.nom === nom);
  if (index === -1) return res.status(404).json({ success: false });

  salles[index] = { nom: nouveauNom || nom, data: data || salles[index].data };
  ecrireSalles(salles);
  res.json({ success: true });
});

// 🖼️ Liste dynamique des sprites par sous-dossier (minerai, pioche, decor)
app.get("/api/sprites", (req, res) => {
  const spritesRoot = path.join(__dirname, "public", "sprites");
  if (!fs.existsSync(spritesRoot)) return res.json([]);

  const categories = fs.readdirSync(spritesRoot).filter(dir => {
    const fullPath = path.join(spritesRoot, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  let resultat = [];

  for (const categorie of categories) {
    const dossier = path.join(spritesRoot, categorie);
    const fichiers = fs.readdirSync(dossier).filter(f => f.endsWith(".png") || f.endsWith(".jpg"));

    for (const fichier of fichiers) {
      const nom = fichier.replace(/\.[^.]+$/, ""); // sans extension
      const chemin = `sprites/${categorie}/${fichier}`;
      resultat.push({ nom, chemin, categorie });
    }
  }

  res.json(resultat);
});

// 🚀 Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
