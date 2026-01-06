const AdminCMS = {
    config: {
        owner: 'AfterlifeOS',
        repo: 'AfterlifeOS.github.io',
        path: 'js/data_changelogs.js',
        branch: 'main'
    },
    
    token: null,
    currentSha: null,
    data: [],
    editingIndex: -1, // -1 means creating new, >= 0 means editing existing

    init: async function() {
        const storedToken = sessionStorage.getItem('gh_token');
        if (storedToken) {
            this.token = storedToken;
            
            // Try to fetch user details to confirm token validity and get username
            try {
                const res = await fetch('https://api.github.com/user', {
                    headers: { 'Authorization': `token ${this.token}` }
                });
                
                if (res.ok) {
                    const user = await res.json();
                    document.getElementById('adminUsername').textContent = user.login;
                    this.showDashboard();
                    this.loadData();
                } else {
                    this.logout(); // Will reload page, creating a loop if we are not careful.
                    // Instead of logout() which reloads, just clear and show login.
                    sessionStorage.removeItem('gh_token');
                    this.showLogin();
                }
            } catch (e) {
                console.error("Auth check failed:", e);
                // Offline fallback: allow access but warn, or just force login?
                // For safety, let's force login again if we can't verify.
                sessionStorage.removeItem('gh_token');
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    },

    showLogin: function() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardScreen').style.display = 'none';
    },

    login: async function() {
        const input = document.getElementById('githubToken');
        const errorMsg = document.getElementById('loginError');
        const token = input.value.trim();

        if (!token) {
            alert("Please enter a token");
            return;
        }

        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Validating token...';
        errorMsg.style.color = 'var(--text-muted)';

        try {
            const res = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${token}` }
            });

            if (res.ok) {
                const user = await res.json();
                this.token = token;
                sessionStorage.setItem('gh_token', token);
                
                // Update username in UI
                document.getElementById('adminUsername').textContent = user.login;
                
                this.showDashboard();
                this.loadData();
            } else {
                const errData = await res.json();
                throw new Error(errData.message || 'Invalid Token');
            }
        } catch (e) {
            errorMsg.textContent = 'Login Error: ' + e.message;
            errorMsg.style.color = '#ff4d4d';
        }
    },

    logout: function() {
        sessionStorage.removeItem('gh_token');
        location.reload();
    },

    showDashboard: function() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'block';
    },

    loadData: async function() {
        const list = document.getElementById('logList');
        try {
            // Add timestamp to prevent caching
            const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}?ref=${this.config.branch}&t=${Date.now()}`;
            const res = await fetch(url, {
                headers: { 
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!res.ok) throw new Error('Failed to fetch data');

            const json = await res.json();
            this.currentSha = json.sha;
            
            const content = new TextDecoder().decode(Uint8Array.from(atob(json.content), c => c.charCodeAt(0)));
            const jsonString = content.replace('window.changelogsData =', '').replace(/;[ 	]*$/, '').trim();
            
            this.data = new Function('return ' + jsonString)();
            this.renderList();
        } catch (e) {
            list.innerHTML = `<div style="color:#ff4d4d">Error loading data: ${e.message}</div>`;
        }
    },

    renderList: function() {
        const list = document.getElementById('logList');
        list.innerHTML = '';

        this.data.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'log-item';
            el.innerHTML = `
                <div class="log-header">
                    <div>
                        <strong style="font-size: 1.1rem;">${item.version}</strong>
                        ${item.isLatest ? '<span style="background:var(--color-primary); color:black; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; margin-left: 10px; vertical-align: middle;">LATEST</span>' : ''}
                    </div>
                    <span style="color:var(--text-muted); font-size:0.9rem;">${item.date}</span>
                </div>
                
                <div class="log-content">${item.changes.trim()}</div>
                
                <div class="log-actions">
                    <button onclick="AdminCMS.editEntry(${index})" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.85rem; height: auto;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="AdminCMS.deleteEntry(${index})" class="btn btn-outline" style="padding: 6px 16px; font-size: 0.85rem; border-color: #ff4d4d; color: #ff4d4d; height: auto;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(el);
        });
    },

    // --- Mode Management ---
    
    editEntry: function(index) {
        const item = this.data[index];
        this.editingIndex = index;

        // Populate form
        document.getElementById('newVersion').value = item.version;
        document.getElementById('newDate').value = item.date;
        document.getElementById('newChanges').value = item.changes.trim();
        document.getElementById('newIsLatest').checked = item.isLatest;

        // Update UI
        document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Release';
        document.getElementById('saveBtn').textContent = 'Save Changes';
        document.getElementById('cancelEditBtn').style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    cancelEdit: function() {
        this.editingIndex = -1;
        
        // Reset form
        document.getElementById('newVersion').value = '';
        document.getElementById('newDate').value = '';
        document.getElementById('newChanges').value = '';
        document.getElementById('newIsLatest').checked = true;

        // Reset UI
        document.getElementById('formTitle').innerHTML = '<i class="fas fa-pen-fancy"></i> Create New Release';
        document.getElementById('saveBtn').textContent = 'Publish Update';
        document.getElementById('cancelEditBtn').style.display = 'none';
    },

    // --- Save Logic ---

    saveEntry: async function() {
        const version = document.getElementById('newVersion').value;
        const date = document.getElementById('newDate').value;
        const changes = document.getElementById('newChanges').value;
        const isLatest = document.getElementById('newIsLatest').checked;

        if (!version || !date || !changes) {
            alert('Please fill all fields');
            return;
        }

        const entry = {
            version,
            date,
            isLatest,
            changes: `\n${changes.trim()}\n`
        };

        // Handle Latest Flag Logic
        if (isLatest) {
            this.data.forEach(d => d.isLatest = false);
        }

        let commitMsg = '';

        if (this.editingIndex >= 0) {
            // Edit Mode
            this.data[this.editingIndex] = entry;
            commitMsg = `Update ${version}`;
        } else {
            // Create Mode
            this.data.unshift(entry);
            commitMsg = `Release ${version}`;
        }

        await this.saveToGithub(commitMsg);
        this.cancelEdit(); // Reset form after save
    },

    deleteEntry: async function(index) {
        if (!confirm('Are you sure you want to delete this changelog? This action cannot be undone.')) return;
        
        const removed = this.data.splice(index, 1);
        await this.saveToGithub(`Delete ${removed[0].version}`);
        
        // If we deleted the item being edited, cancel edit
        if (this.editingIndex === index) {
            this.cancelEdit();
        }
    },

    saveToGithub: async function(commitMessage) {
        this.showToast('Saving to GitHub...', true);
        
        // Disable button
        const btn = document.getElementById('saveBtn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const fileContent = `window.changelogsData = ${JSON.stringify(this.data, null, 4)};`;
        const contentEncoded = btoa(String.fromCharCode(...new TextEncoder().encode(fileContent)));

        try {
            const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.path}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `[CMS] ${commitMessage}`,
                    content: contentEncoded,
                    sha: this.currentSha,
                    branch: this.config.branch
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message);
            }

            const json = await res.json();
            this.currentSha = json.content.sha;
            this.showToast('Success! Changes published.');
            this.renderList();
        } catch (e) {
            alert('Failed to save: ' + e.message);
            this.showToast('Error saving data');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    },

    showToast: function(msg, isLoading = false) {
        const toast = document.getElementById('statusToast');
        const text = document.getElementById('statusText');
        if (!toast || !text) return;
        text.textContent = msg;
        toast.style.display = 'block';
        if (!isLoading) setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }
};

AdminCMS.init();