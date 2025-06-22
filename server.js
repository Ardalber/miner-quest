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

  res.json({ success: true, index: salles.length - 1 });
});

// ❌ Supprimer une salle
app.delete("/api/supprimer-salle/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const salles = lireSalles();
  if (index < 0 || index >= salles.length) return res.json({ success: false });

  salles.splice(index, 1);
  ecrireSalles(salles);
  res.json({ success: true });
});

// ✏️ Modifier une salle existante
app.put("/api/modifier-salle/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { data } = req.body;
  const salles = lireSalles();
  if (!Array.isArray(data) || index < 0 || index >= salles.length)
    return res.json({ success: false });

  salles[index].data = data;
  ecrireSalles(salles);
  res.json({ success: true });
});

// 📝 Renommer une salle
app.put("/api/renommer-salle/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { nom } = req.body;
  const salles = lireSalles();
  if (typeof nom !== "string" || index < 0 || index >= salles.length)
    return res.json({ success: false });

  salles[index].nom = nom;
  ecrireSalles(salles);
  res.json({ success: true });
});

// 🚀 Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur prêt : http://localhost:${PORT}`);
});
