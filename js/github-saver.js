// Système de sauvegarde automatique sur GitHub
class GitHubSaver {
    constructor() {
        this.owner = 'Ardalber'; // Votre username GitHub
        this.repo = 'miner-quest'; // Nom du repo
        this.branch = 'main';
        this.token = localStorage.getItem('github_token');
    }

    // Configurer le token GitHub
    setToken(token) {
        this.token = token;
        localStorage.setItem('github_token', token);
    }

    // Vérifier si le token est configuré
    isConfigured() {
        return !!this.token;
    }

    // Sauvegarder un niveau sur GitHub
    async saveLevel(levelName, levelData) {
        if (!this.token) {
            throw new Error('Token GitHub non configuré. Allez dans les paramètres pour le configurer.');
        }

        const filePath = `levels/${levelName}.json`;
        const content = JSON.stringify(levelData, null, 2);
        const message = `Update ${levelName} from editor`;

        try {
            // 1. Récupérer le SHA du fichier existant (si existe)
            let sha = null;
            try {
                const fileResponse = await fetch(
                    `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}?ref=${this.branch}`,
                    {
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                if (fileResponse.ok) {
                    const fileData = await fileResponse.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // Fichier n'existe pas, c'est OK
            }

            // 2. Créer ou mettre à jour le fichier
            const updateData = {
                message: message,
                content: btoa(unescape(encodeURIComponent(content))), // Base64 encode UTF-8
                branch: this.branch
            };

            if (sha) {
                updateData.sha = sha; // Nécessaire pour update
            }

            const response = await fetch(
                `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la sauvegarde sur GitHub');
            }

            const result = await response.json();
            console.log('✅ Sauvegardé sur GitHub:', result.commit.sha);
            return result;

        } catch (error) {
            console.error('❌ Erreur GitHub:', error);
            throw error;
        }
    }

    // Afficher le modal de configuration
    showConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-editor';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-editor-content" style="max-width: 600px;">
                <h2>⚙️ Configuration GitHub</h2>
                <p style="color: #aaa; margin-bottom: 20px;">
                    Pour sauvegarder automatiquement vos niveaux sur GitHub/Netlify,
                    vous devez créer un Personal Access Token.
                </p>
                
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0;">📝 Instructions:</h3>
                    <ol style="line-height: 1.8; color: #ccc;">
                        <li>Allez sur <a href="https://github.com/settings/tokens" target="_blank" style="color: #667eea;">github.com/settings/tokens</a></li>
                        <li>Cliquez "Generate new token" → "Classic"</li>
                        <li>Nom: "Miner Quest Editor"</li>
                        <li>Cochez la permission: <strong>repo</strong> (accès complet au repo)</li>
                        <li>Cliquez "Generate token"</li>
                        <li>Copiez le token (vous ne pourrez plus le voir!)</li>
                        <li>Collez-le ci-dessous</li>
                    </ol>
                </div>
                
                <label style="display: block; margin-bottom: 10px;">
                    <strong>GitHub Personal Access Token:</strong>
                    <input type="password" id="github-token-input" 
                           placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                           style="width: 100%; padding: 12px; margin-top: 8px; 
                                  background: #1a1a1a; border: 2px solid #444; 
                                  border-radius: 6px; color: white; font-family: monospace;">
                </label>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="btn-cancel-token" style="padding: 12px 24px; background: #555; 
                                                         border: none; border-radius: 6px; color: white; 
                                                         cursor: pointer;">Annuler</button>
                    <button id="btn-save-token" style="padding: 12px 24px; background: #667eea; 
                                                       border: none; border-radius: 6px; color: white; 
                                                       cursor: pointer; font-weight: bold;">💾 Sauvegarder</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-cancel-token').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('btn-save-token').addEventListener('click', () => {
            const token = document.getElementById('github-token-input').value.trim();
            if (token) {
                this.setToken(token);
                modal.remove();
                alert('✅ Token GitHub configuré avec succès!\nVous pouvez maintenant sauvegarder vos niveaux directement sur Netlify.');
            } else {
                alert('❌ Veuillez entrer un token valide');
            }
        });
    }
}

// Instance globale
window.githubSaver = new GitHubSaver();
