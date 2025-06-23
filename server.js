// server.js

import express from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const app         = express();
const PORT        = process.env.PORT || 3000;

// 1) JSON middleware en premier
app.use(express.json({ limit: "1mb" }));

// 2) Routes API (définies avant le static pour éviter tout conflit)

// Récupérer tous les comptes
app.get("/comptes.json", async (req, res) => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, "data", "comptes.json"), "utf-8");
    return res.json(JSON.parse(data));
  } catch (err) {
    console.error("GET /comptes.json error:", err);
    return res.status(500).json({ erreur: err.message });
  }
});

// Créer un compte
app.post("/api/compte", async (req, res) => {
  const { nom, motDePasse } = req.body;
  if (!nom || typeof nom !== "string" || !motDePasse || typeof motDePasse !== "string") {
    return res.status(400).send("Nom ou mot de passe invalide");
  }
  try {
    const comptesPath = path.join(__dirname, "data", "comptes.json");
    const data = await fsPromises.readFile(comptesPath, "utf-8");
    const comptes = JSON.parse(data);
    if (comptes.some(c => c.nom === nom)) {
      return res.status(409).send("Ce nom existe déjà");
    }
    comptes.push({ nom, motDePasse });
    await fsPromises.writeFile(comptesPath, JSON.stringify(comptes, null, 2));
    return res.status(201).send("Compte créé");
  } catch (err) {
    console.error("POST /api/compte error:", err);
    return res.status(500).json({ erreur: err.message });
  }
});

// Supprimer un compte (tout le monde, y compris Ardalber)
app.delete("/api/compte/:nom", async (req, res) => {
  const nom = decodeURIComponent(req.params.nom);
  console.log("Suppression demandée pour :", nom);
  try {
    const comptesPath = path.join(__dirname, "data", "comptes.json");
    const data = await fsPromises.readFile(comptesPath, "utf-8");
    let comptes = JSON.parse(data);
    comptes = comptes.filter(c => c.nom !== nom);
    await fsPromises.writeFile(comptesPath, JSON.stringify(comptes, null, 2));
    console.log(`✅ Compte "${nom}" supprimé avec succès`);
    return res.sendStatus(200);
  } catch (err) {
    console.error("DELETE /api/compte error:", err);
    return res.status(500).json({ erreur: err.message });
  }
});

// 3) Static files et pages HTML
app.use(express.static(path.join(__dirname, "public", "HTML")));
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
