document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("compte-select");

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
    console.error("Erreur récupération comptes :", err);
  }
});
