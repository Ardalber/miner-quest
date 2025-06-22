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

// 🔁 Lire les salles
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

// 🖼️ Liste dynamique des sprites dans /sprites
app.get("/api/sprites", (req, res) => {
  const spritesDir = path.join(__dirname, "public", "sprites");

  if (!fs.existsSync(spritesDir)) return res.json([]);

  const fichiers = fs.readdirSync(spritesDir)
    .filter(f => f.endsWith(".png") || f.endsWith(".jpg"))
    .map(f => {
      const nom = f.replace(/\.[^.]+$/, ""); // enlève l'extension
      return { nom, chemin: `sprites/${f}` };
    });

  res.json(fichiers);
});

// 🚀 Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
