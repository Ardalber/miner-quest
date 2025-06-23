import express from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public', 'HTML')));
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));

const sallesPath = path.join(__dirname, "public", "salles.json");
const dataDir = path.join(__dirname, "data");
const comptesPath = path.join(dataDir, "comptes.json");

// ✅ Création du dossier data/ et fichier comptes.json si absent
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
if (!fs.existsSync(comptesPath)) {
  fs.writeFileSync(comptesPath, "[]", "utf-8");
}

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

// 🖼️ Liste des sprites
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
      const nom = fichier.replace(/\.[^.]+$/, "");
      const chemin = `sprites/${categorie}/${fichier}`;
      resultat.push({ nom, chemin, categorie });
    }
  }

  res.json(resultat);
});

// 📋 Renvoyer tous les comptes
app.get("/comptes.json", async (req, res) => {
  try {
    const contenu = await fsPromises.readFile(comptesPath, "utf-8");
    res.json(JSON.parse(contenu));
  } catch {
    res.status(500).json({ erreur: "Impossible de lire les comptes." });
  }
});

// ➕ Ajouter un compte (avec mot de passe)
app.post("/api/compte", async (req, res) => {
  const { nom, motDePasse } = req.body;

  if (!nom || typeof nom !== 'string' || !motDePasse || typeof motDePasse !== 'string') {
    return res.status(400).send("Nom ou mot de passe invalide");
  }

  try {
    const data = await fsPromises.readFile(comptesPath, 'utf-8');
    const comptes = JSON.parse(data);

    if (comptes.some(c => c.nom === nom)) {
      return res.status(409).send("Ce nom existe déjà");
    }

    comptes.push({ nom, motDePasse });
    await fsPromises.writeFile(comptesPath, JSON.stringify(comptes, null, 2));
    res.status(201).send("Compte créé");
  } catch (err) {
    console.error("Erreur lors de la création du compte :", err);
    res.status(500).json({ erreur: "Erreur lors de la création du compte" });
  }
});

// ❌ Supprimer un compte (sauf admin)
app.delete("/api/compte/:nom", async (req, res) => {
  const nom = decodeURIComponent(req.params.nom);
  if (nom === 'Ardalber') return res.status(403).send("Impossible de supprimer l'admin");

  try {
    const data = await fsPromises.readFile(comptesPath, 'utf-8');
    let comptes = JSON.parse(data);
    comptes = comptes.filter(c => c.nom !== nom);
    await fsPromises.writeFile(comptesPath, JSON.stringify(comptes, null, 2));
    res.sendStatus(200);
  } catch {
    res.status(500).json({ erreur: "Erreur lors de la suppression du compte" });
  }
});

// 🚀 Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
