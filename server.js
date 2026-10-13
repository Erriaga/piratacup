const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'pirata-cup-secret-2027',
    resave: false,
    saveUninitialized: false
}));

const dbFile = path.join(__dirname, 'piratacup.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
    } else {
        console.log('Conectado ao banco SQLite.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        acronym TEXT NOT NULL,
        image TEXT NOT NULL,
        champion INTEGER DEFAULT 0,
        runner_up INTEGER DEFAULT 0,
        third_place INTEGER DEFAULT 0,
        semifinalist INTEGER DEFAULT 0
    )`, () => {
        db.get("SELECT COUNT(*) as count FROM teams", (err, row) => {
            if (row && row.count === 0) {
                const defaultTeams = [
                    ['Colégio Canópus', 'CAN', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 2, 0, 0, 0],
                    ['Rede Decisão/Módulo', 'MOD', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 1, 0, 0, 2],
                    ['Colégio Objetivo', 'OBJ', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 0, 2, 0, 0],
                    ['Instituto Federal', 'IFSP', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 0, 1, 1, 0],
                    ['Colégio Imperatrice', 'IMP', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 0, 0, 2, 0],
                    ['Colégio Amplia/Caraguatá', 'AMP', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 0, 0, 0, 1],
                    ['ETEC de Caraguatatuba/CDU', 'ETEC', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 0, 0, 0, 0],
                    ['Colégio Tableau', 'TAB', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80', 0, 0, 0, 0]
                ];
                const stmt = db.prepare("INSERT INTO teams (name, acronym, image, champion, runner_up, third_place, semifinalist) VALUES (?, ?, ?, ?, ?, ?, ?)");
                defaultTeams.forEach(t => stmt.run(t));
                stmt.finalize();
            }
        });
    });
}

function renderLayout(activeTab, content, loginError = '', crudMsg = '') {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pirata Cup - Campeonato Interescolar</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&family=Raleway:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            border-radius: 0 !important;
        }

        :root {
            --bg-color: #080808;
            --card-bg: #141414;
            --card-border: #262626;
            --gold-primary: #d4af37;
            --gold-secondary: #c5a059;
            --gold-light: #f4e8c1;
            --gold-dark: #8c7323;
            --text-main: #f0f0f0;
            --text-muted: #a0a0a0;
            --accent-red: #c0392b;
            --accent-green: #27ae60;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Arimo', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }

        h1, h2, h3, h4, h5, h6, .brand-font {
            font-family: 'Raleway', sans-serif;
            letter-spacing: 1px;
        }

        header {
            background: linear-gradient(180deg, #111 0%, #080808 100%);
            border-bottom: 2px solid var(--gold-dark);
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .header-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 15px;
            text-decoration: none;
        }

        .logo-title h1 {
            font-size: 1.8rem;
            font-weight: 900;
            color: var(--gold-primary);
            text-transform: uppercase;
        }

        .logo-title span {
            font-size: 0.8rem;
            color: var(--gold-light);
            letter-spacing: 3px;
            display: block;
            text-transform: uppercase;
        }

        nav ul {
            display: flex;
            list-style: none;
            gap: 15px;
            align-items: center;
        }

        nav a {
            color: var(--text-muted);
            text-decoration: none;
            font-family: 'Raleway', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            text-transform: uppercase;
            padding: 8px 16px;
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }

        nav a:hover, nav a.active {
            color: var(--gold-light);
            background: rgba(212, 175, 55, 0.1);
            border-color: var(--gold-secondary);
        }

        main {
            flex: 1;
            max-width: 1200px;
            width: 100%;
            margin: 30px auto;
            padding: 0 20px;
        }

        .hero-banner {
            background: linear-gradient(135deg, #181611 0%, #0d0c09 100%);
            border: 2px solid var(--gold-secondary);
            padding: 40px;
            text-align: center;
            margin-bottom: 40px;
        }

        .hero-banner h2 {
            font-size: 2.5rem;
            color: var(--gold-primary);
            margin-bottom: 15px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .hero-banner p {
            color: var(--gold-light);
            font-size: 1.1rem;
            max-width: 800px;
            margin: 0 auto 25px auto;
            line-height: 1.6;
        }

        .btn-gold {
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
            color: #080808;
            border: none;
            padding: 12px 28px;
            font-family: 'Raleway', sans-serif;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }

        .btn-gold:hover {
            background: linear-gradient(135deg, var(--gold-light), var(--gold-primary));
        }

        .section-title {
            font-size: 1.8rem;
            color: var(--gold-primary);
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--card-border);
            padding-bottom: 10px;
        }

        .grid-teams {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }

        .team-card {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            display: flex;
            flex-direction: column;
        }

        .team-img-container {
            height: 180px;
            width: 100%;
            overflow: hidden;
            background: #111;
            position: relative;
        }

        .team-img-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .team-acronym {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            border: 1px solid var(--gold-secondary);
            color: var(--gold-primary);
            padding: 4px 8px;
            font-size: 0.8rem;
            font-weight: 800;
            letter-spacing: 1px;
        }

        .team-info {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
        }

        .team-stars {
            font-size: 1.1rem;
            margin-bottom: 6px;
            min-height: 24px;
        }

        .team-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 15px;
            min-height: 2.4rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .trophies-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            background: rgba(0,0,0,0.4);
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.05);
            text-align: center;
        }

        .trophies-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            background: rgba(0,0,0,0.4);
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.05);
            text-align: center;
        }

        .trophy-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 0.75rem;
            color: var(--text-muted);
            justify-content: center;
        }

        .trophy-item span.count {
            font-size: 1rem;
            font-weight: 800;
            color: var(--gold-light);
            margin-top: 2px;
        }

        .swiss-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
        }

        @media(max-width: 900px) {
            .swiss-container {
                grid-template-columns: 1fr;
            }
        }

        .swiss-card {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 20px;
        }

        .swiss-card h3 {
            color: var(--gold-primary);
            margin-bottom: 15px;
            font-size: 1.1rem;
            text-align: center;
            text-transform: uppercase;
        }

        .match-box {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.08);
            margin-bottom: 12px;
        }

        .match-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .match-row:last-child {
            border-bottom: none;
        }

        .match-teams {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--text-main);
        }

        .match-score {
            font-weight: 800;
            color: var(--gold-light);
            font-size: 0.95rem;
        }

        .sub-phase-title {
            font-style: italic;
            color: var(--gold-light);
            font-size: 1.4rem;
            margin: 30px 0 15px 0;
            font-family: 'Raleway', sans-serif;
            font-weight: 700;
        }

        .admin-table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            margin-bottom: 30px;
        }

        .admin-table th, .admin-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid var(--card-border);
            font-size: 0.95rem;
        }

        .admin-table th {
            background-color: #1c1c1c;
            color: var(--gold-primary);
            font-family: 'Raleway', sans-serif;
            text-transform: uppercase;
            font-size: 0.85rem;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-family: 'Raleway', sans-serif;
            font-weight: 700;
            color: var(--gold-light);
            font-size: 0.9rem;
            text-transform: uppercase;
        }

        .form-control {
            width: 100%;
            padding: 12px 15px;
            background-color: #0d0d0d;
            border: 1px solid var(--card-border);
            color: var(--text-main);
            font-family: 'Arimo', sans-serif;
            font-size: 1rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 15px;
        }

        .trophies-input-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }

        .alert {
            padding: 15px;
            margin-bottom: 25px;
            font-weight: 600;
        }

        .alert-success {
            background-color: rgba(39, 174, 96, 0.15);
            border: 1px solid var(--accent-green);
            color: #2ecc71;
        }

        .alert-error {
            background-color: rgba(192, 57, 43, 0.15);
            border: 1px solid var(--accent-red);
            color: #e74c3c;
        }

        .login-box {
            max-width: 450px;
            margin: 50px auto;
            background-color: var(--card-bg);
            border: 1px solid var(--gold-secondary);
            padding: 40px;
        }

        .btn-danger {
            background: var(--accent-red);
            color: white;
            border: none;
            padding: 8px 14px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.85rem;
        }

        .btn-edit {
            background: #2980b9;
            color: white;
            border: none;
            padding: 8px 14px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.85rem;
            text-decoration: none;
            display: inline-block;
            margin-right: 5px;
        }

        footer {
            background-color: #050505;
            border-top: 1px solid var(--card-border);
            text-align: center;
            padding: 25px 20px;
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-top: auto;
        }

        footer span {
            color: var(--gold-primary);
            font-weight: 700;
        }
    </style>
</head>
<body>
    <header>
        <div class="header-container">
            <a href="/?tab=home" class="logo-area">
                <div class="logo-title">
                    <h1>Pirata Cup</h1>
                    <span>Interescolar</span>
                </div>
            </a>
            <nav>
                <ul>
                    <li><a href="/?tab=home" class="${activeTab === 'home' ? 'active' : ''}">Início</a></li>
                    <li><a href="/?tab=teams" class="${activeTab === 'teams' ? 'active' : ''}">Equipes</a></li>
                    <li><a href="/?tab=edition2027" class="${activeTab === 'edition2027' ? 'active' : ''}">Edição 2027</a></li>
                    ${content.isAdmin ? '<li><a href="/?tab=admin" class="' + (activeTab === 'admin' ? 'active' : '') + '">Painel Admin</a></li><li><a href="/logout" style="color: var(--accent-red);">Sair</a></li>' : '<li><a href="/?tab=login" class="' + (activeTab === 'login' ? 'active' : '') + '">Login Admin</a></li>'}
                </ul>
            </nav>
        </div>
    </header>

    <main>
        ${crudMsg ? `<div class="alert alert-success">\${crudMsg}</div>` : ''}
        ${loginError ? `<div class="alert alert-error">\${loginError}</div>` : ''}
        ${content.body}
    </main>

    <footer>
        <p>&copy; 2027 <span>Pirata Cup Interescolar</span>. Todos os direitos reservados. Idealizado por <span>Roni</span> & Gerenciado com excelência.</p>
    </footer>
</body>
</html>`;
}

// Routes
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/?tab=home');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const admins = { 'gerenciador': 'pirata2027', 'roni': 'roni2027' };
    if (admins[username] && admins[username] === password) {
        req.session.adminLogged = true;
        req.session.adminUser = username === 'roni' ? 'Roni (Idealizador)' : 'Gerenciador';
        res.redirect('/?tab=admin');
    } else {
        db.all("SELECT * FROM teams", (err, teams) => {
            const body = `<div class="login-box">
                <h2>🔐 Acesso Administrativo</h2>
                <div class="alert alert-error">Credenciais inválidas!</div>
                <form method="POST" action="/login">
                    <div class="form-group"><label>Usuário:</label><input type="text" name="username" class="form-control" required></div>
                    <div class="form-group"><label>Senha:</label><input type="password" name="password" class="form-control" required></div>
                    <button type="submit" class="btn-gold" style="width: 100%; margin-top: 10px;">Entrar no Navio</button>
                </form>
            </div>`;
            res.send(renderLayout('login', { body, isAdmin: false }));
        });
    }
});

app.post('/crud', (req, res) => {
    if (!req.session.adminLogged) return res.redirect('/?tab=login');
    const { crud_action, id, name, acronym, image, champion, runner_up, third_place, semifinalist } = req.body;
    
    if (crud_action === 'create' || crud_action === 'update') {
        const c = parseInt(champion) || 0;
        const r = parseInt(runner_up) || 0;
        const tp = parseInt(third_place) || 0;
        const s = parseInt(semifinalist) || 0;
        const acr = (acronym || '').toUpperCase().substring(0, 4);

        if (crud_action === 'create') {
            db.run("INSERT INTO teams (name, acronym, image, champion, runner_up, third_place, semifinalist) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [name, acr, image, c, r, tp, s], () => {
                    res.redirect('/?tab=admin');
                });
        } else {
            db.run("UPDATE teams SET name=?, acronym=?, image=?, champion=?, runner_up=?, third_place=?, semifinalist=? WHERE id=?",
                [name, acr, image, c, r, tp, s, id], () => {
                    res.redirect('/?tab=admin');
                });
        }
    } else if (crud_action === 'delete') {
        db.run("DELETE FROM teams WHERE id=?", [id], () => {
            res.redirect('/?tab=admin');
        });
    }
});

app.get('/', (req, res) => {
    const activeTab = req.query.tab || 'home';
    const isAdmin = !!req.session.adminLogged;

    db.all("SELECT * FROM teams ORDER BY champion DESC, runner_up DESC, third_place DESC, semifinalist DESC, id ASC", (err, teams) => {
        let body = '';

        if (activeTab === 'home') {
            let highlights = teams.slice(0, 4).map(team => {
                const stars = team.champion > 0 ? '⭐'.repeat(team.champion) : '<span style="opacity:0">⭐</span>';
                const gridHtml = team.champion > 0 
                    ? `<div class="trophies-grid">
                        <div class="trophy-item">🏆 <span class="count">${team.champion}</span></div>
                        <div class="trophy-item">🥈 <span class="count">${team.runner_up}</span></div>
                        <div class="trophy-item">🥉 <span class="count">${team.third_place}</span></div>
                        <div class="trophy-item">🎖️ <span class="count">${team.semifinalist}</span></div>
                       </div>`
                    : `<div class="trophies-grid-3">
                        <div class="trophy-item">🥈 <span class="count">${team.runner_up}</span></div>
                        <div class="trophy-item">🥉 <span class="count">${team.third_place}</span></div>
                        <div class="trophy-item">🎖️ <span class="count">${team.semifinalist}</span></div>
                       </div>`;

                return `<div class="team-card">
                    <div class="team-img-container">
                        <img src="${team.image}" alt="${team.name}">
                        <span class="team-acronym">${team.acronym}</span>
                    </div>
                    <div class="team-info">
                        <div>
                            <div class="team-stars">${stars}</div>
                            <div class="team-name">${team.name}</div>
                        </div>
                        ${gridHtml}
                    </div>
                </div>`;
            }).join('');

            body = `<div class="hero-banner">
                <h2>O Maior Campeonato Interescolar</h2>
                <p>Bem-vindo ao quartel-general oficial da <strong>Pirata Cup</strong>! O torneio anual que consagra a glória, a garra e a honra dos colégios participantes.</p>
                <a href="/?tab=edition2027" class="btn-gold">⚔️ Ver Edição 2027</a>
            </div>
            <h3 class="section-title">🏴‍☠️ Destaques das Equipes</h3>
            <div class="grid-teams">${highlights}</div>`;

        } else if (activeTab === 'teams') {
            let allTeams = teams.map(team => {
                const stars = team.champion > 0 ? '⭐'.repeat(team.champion) : '<span style="opacity:0">⭐</span>';
                const gridHtml = team.champion > 0 
                    ? `<div class="trophies-grid">
                        <div class="trophy-item">🏆 <span class="count">${team.champion}</span></div>
                        <div class="trophy-item">🥈 <span class="count">${team.runner_up}</span></div>
                        <div class="trophy-item">🥉 <span class="count">${team.third_place}</span></div>
                        <div class="trophy-item">🎖️ <span class="count">${team.semifinalist}</span></div>
                       </div>`
                    : `<div class="trophies-grid-3">
                        <div class="trophy-item">🥈 <span class="count">${team.runner_up}</span></div>
                        <div class="trophy-item">🥉 <span class="count">${team.third_place}</span></div>
                        <div class="trophy-item">🎖️ <span class="count">${team.semifinalist}</span></div>
                       </div>`;

                return `<div class="team-card">
                    <div class="team-img-container">
                        <img src="${team.image}" alt="${team.name}">
                        <span class="team-acronym">${team.acronym}</span>
                    </div>
                    <div class="team-info">
                        <div>
                            <div class="team-stars">${stars}</div>
                            <div class="team-name">${team.name}</div>
                        </div>
                        ${gridHtml}
                    </div>
                </div>`;
            }).join('');

            body = `<h3 class="section-title">🛡️ Equipes</h3>
            <p style="margin-bottom: 25px; color: var(--text-muted); line-height: 1.6;">Todas as equipes cadastradas no hall da fama da Pirata Cup.</p>
            <div class="grid-teams">${allTeams}</div>`;

        } else if (activeTab === 'edition2027') {
            body = `<div class="hero-banner" style="text-align: center; padding: 25px;">
                <h2 style="color: #e67e22; font-size: 2.2rem; font-weight: 900;">EDIÇÃO 2027</h2>
            </div>

            <div class="sub-phase-title">FASE SUÍÇA</div>
            <div class="swiss-container">
                <div class="swiss-card">
                    <h3>⚓ Rodada 1</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>

                <div class="swiss-card">
                    <h3>⚓ Rodada 2</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>

                <div class="swiss-card">
                    <h3>⚓ Rodada 3</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>
            </div>

            <div class="sub-phase-title">FASE FINAL</div>
            <div class="swiss-container">
                <div class="swiss-card">
                    <h3>⚓ Semifinais</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>

                <div class="swiss-card">
                    <h3>⚓ Terceiro Lugar</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>

                <div class="swiss-card">
                    <h3>⚓ Final</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>
            </div>`;

        } else if (activeTab === 'login') {
            body = `<div class="login-box">
                <h2>🔐 Acesso Administrativo</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.9rem;">Área restrita ao Gerenciador e Roni.</p>
                <form method="POST" action="/login">
                    <div class="form-group"><label>Usuário:</label><input type="text" name="username" class="form-control" required placeholder="gerenciador ou roni"></div>
                    <div class="form-group"><label>Senha:</label><input type="password" name="password" class="form-control" required placeholder="Senha"></div>
                    <button type="submit" class="btn-gold" style="width: 100%; margin-top: 10px;">Entrar no Navio</button>
                </form>
            </div>`;

        } else if (activeTab === 'admin') {
            if (!isAdmin) return res.redirect('/?tab=login');

            const editId = req.query.edit;
            let editTeam = null;
            if (editId) {
                editTeam = teams.find(t => t.id == editId);
            }

            let rows = teams.map(t => `<tr>
                <td><strong>${t.acronym}</strong></td>
                <td>${t.name}</td>
                <td>${t.champion}</td>
                <td>${t.runner_up}</td>
                <td>${t.third_place}</td>
                <td>${t.semifinalist}</td>
                <td>
                    <a href="/?tab=admin&edit=${t.id}" class="btn-edit">Editar</a>
                    <form method="POST" action="/crud" style="display:inline;" onsubmit="return confirm('Tem certeza?');">
                        <input type="hidden" name="crud_action" value="delete">
                        <input type="hidden" name="id" value="${t.id}">
                        <button type="submit" class="btn-danger">Excluir</button>
                    </form>
                </td>
            </tr>`).join('');

            body = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 class="section-title" style="margin-bottom: 0; border: none;">⚓ Painel de Controle - ${req.session.adminUser}</h3>
            </div>

            <div class="swiss-card" style="margin-bottom: 40px;">
                <h3 style="margin-bottom: 20px; text-align: left;">${editTeam ? '✏️ Editar Equipe' : '➕ Cadastrar Nova Equipe'}</h3>
                <form method="POST" action="/crud">
                    <input type="hidden" name="crud_action" value="${editTeam ? 'update' : 'create'}">
                    ${editTeam ? `<input type="hidden" name="id" value="\${editTeam.id}">` : ''}

                    <div class="form-row">
                        <div class="form-group">
                            <label>Nome do Colégio:</label>
                            <input type="text" name="name" class="form-control" required value="${editTeam ? editTeam.name : ''}" placeholder="Ex: Colégio Naval">
                        </div>
                        <div class="form-group">
                            <label>Sigla (Máx 4 chars):</label>
                            <input type="text" name="acronym" class="form-control" maxlength="4" required value="${editTeam ? editTeam.acronym : ''}" placeholder="CNAV">
                        </div>
                        <div class="form-group">
                            <label>URL da Imagem:</label>
                            <input type="url" name="image" class="form-control" required value="${editTeam ? editTeam.image : 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80'}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Histórico de Conquistas:</label>
                        <div class="trophies-input-row">
                            <div><label style="font-size:0.75rem; color:var::text-muted;">🥇 Campeão</label><input type="number" name="champion" min="0" class="form-control" value="${editTeam ? editTeam.champion : 0}"></div>
                            <div><label style="font-size:0.75rem; color:var::text-muted;">🥈 Vice</label><input type="number" name="runner_up" min="0" class="form-control" value="${editTeam ? editTeam.runner_up : 0}"></div>
                            <div><label style="font-size:0.75rem; color:var::text-muted;">🥉 3º Lugar</label><input type="number" name="third_place" min="0" class="form-control" value="${editTeam ? editTeam.third_place : 0}"></div>
                            <div><label style="font-size:0.75rem; color:var::text-muted;">🎖️ Semi</label><input type="number" name="semifinalist" min="0" class="form-control" value="${editTeam ? editTeam.semifinalist : 0}"></div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 15px; margin-top: 20px;">
                        <button type="submit" class="btn-gold">${editTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}</button>
                        ${editTeam ? `<a href="/?tab=admin" class="btn-gold" style="background: transparent; border: 1px solid var(--gold-secondary); color: var(--gold-primary);">Cancelar</a>` : ''}
                    </div>
                </form>
            </div>

            <h3 class="section-title">📋 Gerenciamento de Equipes</h3>
            <table class="admin-table">
                <thead>
                    <tr><th>Sigla</th><th>Colégio</th><th>🥇 Camp.</th><th>🥈 Vice</th><th>🥉 3º</th><th>🎖️ Semi</th><th>Ações</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`;
        }

        res.send(renderLayout(activeTab, { body, isAdmin }));
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});