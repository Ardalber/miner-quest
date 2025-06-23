document.getElementById("form-creer").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nom = document.getElementById("nom").value.trim();
  const mdp = document.getElementById("mdp").value.trim();
  const confirm = document.getElementById("confirm").value.trim();
  const message = document.getElementById("message");

  if (!nom || !mdp || !confirm) {
    message.textContent = "Tous les champs sont obligatoires.";
    return;
  }

  if (mdp !== confirm) {
    message.textContent = "Les mots de passe ne correspondent pas.";
    return;
  }

  try {
    const res = await fetch("/api/compte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, motDePasse: mdp })
    });

    if (res.status === 409) {
      message.textContent = "Ce compte existe déjà.";
    } else if (res.ok) {
      message.textContent = "Compte créé avec succès.";
    } else {
      message.textContent = "Erreur lors de la création.";
    }
  } catch (err) {
    message.textContent = "Erreur de connexion.";
  }
});

function togglePassword(id, btn) {
  const input = document.getElementById(id);
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁️";
  }
}
