// public/JS/index.js

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("compte");
  const deleteBtn = document.getElementById("delete-btn");
  const messageDiv = document.getElementById("message");

  async function reloadComptes() {
    select.innerHTML = '<option value="" disabled selected>— Sélectionnez —</option>';
    deleteBtn.style.display = "none";
    try {
      const res = await fetch("/comptes.json");
      const comptes = await res.json();
      comptes.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.nom;
        opt.textContent = c.nom;
        select.append(opt);
      });
    } catch (err) {
      console.error("Erreur récupération des comptes :", err);
      messageDiv.textContent = "❌ Impossible de charger les comptes.";
    }
  }

  reloadComptes();

  select.addEventListener("change", () => {
    deleteBtn.style.display = select.value ? "inline-block" : "none";
  });

  deleteBtn.addEventListener("click", async () => {
    const nom = select.value;
    if (!nom) return;
    if (!confirm(`Voulez-vous vraiment supprimer le compte « ${nom} » ?`)) return;
    try {
      const res = await fetch(`/api/compte/${encodeURIComponent(nom)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        messageDiv.textContent = `✅ Le compte « ${nom} » a été supprimé.`;
        await reloadComptes();
      } else {
        messageDiv.textContent = "❌ Erreur lors de la suppression du compte.";
      }
    } catch (err) {
      console.error("Erreur suppression compte :", err);
      messageDiv.textContent = "❌ Erreur réseau lors de la suppression.";
    }
  });
});

function lancerPartie() {
  const select = document.getElementById("compte");
  const nom = select.value;
  if (!nom) {
    alert("Veuillez sélectionner un compte avant de lancer la partie.");
    return;
  }
  localStorage.setItem("mq-user", nom);
  window.location.href = "/HTML/jeu.html";
}
