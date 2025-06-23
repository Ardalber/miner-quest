// server.js

import express from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

// ──────────────── COMPTES ────────────────

app.get("/comptes.json", async (req, res) => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, "data", "comptes.json"), "utf-8");
    return res.json(JSON.parse(data));
  } catch {
    return res.json([]);
  }
});

app.post("/api/compte", async (req, res) => {
  const { nom, motDePasse } = req.body;
  if (!nom || !motDePasse) return res.status(400).send("Nom ou mot de passe manquant");

  try {
    const pathFichier = path.join(__dirname, "data", "comptes.json");
    const data = await fsPromises.readFile(pathFichier, "utf-8");
    const comptes = JSON.parse(data);

    if (comptes.some(c => c.nom === nom)) return res.status(409).send("Ce nom existe déjà");

    comptes.push({ nom, motDePasse });
    await fsPromises.writeFile(pathFichier, JSON.stringify(comptes, null, 2));
    return res.sendStatus(201);
  } catch (err) {
    console.error("POST /api/compte", err);
    res.status(500).json({ erreur: err.message });
  }
});

app.delete("/api/compte/:nom", async (req, res) => {
  const nom = decodeURIComponent(req.params.nom);
  try {
    const pathFichier = path.join(__dirname, "data", "comptes.json");
    const data = await fsPromises.readFile(pathFichier, "utf-8");
    let comptes = JSON.parse(data);
    comptes = comptes.filter(c => c.nom !== nom);
    await fsPromises.writeFile(pathFichier, JSON.stringify(comptes, null, 2));
    res.sendStatus(200);
  } catch (err) {
    console.error("DELETE /api/compte", err);
    res.status(500).json({ erreur: err.message });
  }
});

// ──────────────── SALLES ────────────────

app.get("/api/salles", async (req, res) => {
  const file = path.join(__dirname, "data", "salles.json");
  try {
    if (!fs.existsSync(file)) return res.json([]);
    const contenu = await fsPromises.readFile(file, "utf8");
    res.json(JSON.parse(contenu));
  } catch (err) {
    console.error("GET /api/salles", err);
    res.status(500).json({ erreur: err.message });
  }
});

app.post("/api/ajouter-salle", async (req, res) => {
  const file = path.join(__dirname, "data", "salles.json");
  try {
    let salles = [];
    if (fs.existsSync(file)) {
      const contenu = await fsPromises.readFile(file, "utf8");
      salles = JSON.parse(contenu);
    }

    const { nom, data } = req.body;
    if (!nom || !data) return res.status(400).json({ success: false });

    const idx = salles.findIndex(s => s.nom === nom);
    if (idx >= 0) salles[idx].data = data;
    else salles.push({ nom, data });

    await fsPromises.writeFile(file, JSON.stringify(salles, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/ajouter-salle", err);
    res.status(500).json({ erreur: err.message });
  }
});

app.delete("/api/salle/:nom", async (req, res) => {
  const nom = decodeURIComponent(req.params.nom);
  const file = path.join(__dirname, "data", "salles.json");

  try {
    if (!fs.existsSync(file)) return res.status(404).json({ success: false });

    const contenu = await fsPromises.readFile(file, "utf8");
    let salles = JSON.parse(contenu);
    salles = salles.filter(s => s.nom !== nom);

    await fsPromises.writeFile(file, JSON.stringify(salles, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/salle", err);
    res.status(500).json({ erreur: err.message });
  }
});

// ──────────────── SPRITES ────────────────

app.get("/api/sprites", async (req, res) => {
  const base = path.join(__dirname, "public", "sprites");
  const categories = ["decor", "minerai", "pioche"];
  const allSprites = [];

  try {
    for (const cat of categories) {
      const dir = path.join(base, cat);
      if (!fs.existsSync(dir)) continue;
      const files = await fsPromises.readdir(dir);
      for (const f of files) {
        if (f.endsWith(".png")) {
          allSprites.push({
            nom: f.replace(".png", ""),
            chemin: `sprites/${cat}/${f}`,
            categorie: cat
          });
        }
      }
    }
    res.json(allSprites);
  } catch (err) {
    console.error("GET /api/sprites", err);
    res.status(500).json({ erreur: err.message });
  }
});

// ──────────────── STATIC ────────────────

app.use(express.static(path.join(__dirname, "public", "HTML")));
app.use(express.static(path.join(__dirname, "public")));

// ──────────────── START ────────────────

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
