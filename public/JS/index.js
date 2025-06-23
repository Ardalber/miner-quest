// public/JS/index.js

// Charge et affiche la liste des comptes
async function chargerComptes() {
  try {
    const res = await fetch('/comptes.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const comptes = await res.json();

    const select = document.getElementById('compte');
    select.innerHTML = '';  // Vide l'ancienne liste

    // Option placeholder
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Choisir un compte --';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    // On ajoute chaque compte
    comptes.forEach(c => {
      const option = document.createElement('option');
      option.value = c.nom;
      option.textContent = c.nom;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Impossible de charger les comptes :', err);
  }
}

// Fonction lancée quand on clique sur "Lancer la partie"
function lancerPartie() {
  const compte = document.getElementById('compte').value;
  if (!compte) {
    alert("Veuillez sélectionner un compte.");
    return;
  }
  window.location.href = `/HTML/jeu.html?compte=${encodeURIComponent(compte)}`;
}

// Chargement initial et rafraîchissement à chaque retour de focus
window.addEventListener('DOMContentLoaded', chargerComptes);
window.addEventListener('focus', chargerComptes);
