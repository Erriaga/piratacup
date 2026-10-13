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
                    ['Colégio Canópus', 'CAN', 'https://scontent-gru1-1.xx.fbcdn.net/v/t39.30808-6/300576667_476619551139509_6941224390542513015_n.jpg?stp=dst-jpg_tt6&cstp=mx800x800&ctp=s800x800&_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=ae4R3qI_rM4Q7kNvwGnbb6h&_nc_oc=AdrhOzaXAaYH62PM0PhNnZXJrcRth-2ssFCFwamRfOV7Xx82ZG6JVbdm1Yyx4Q-i9gg&_nc_zt=23&_nc_ht=scontent-gru1-1.xx&_nc_gid=CL5gqr8TGtE09gA1fSLZuQ&_nc_ss=7b2a8&oh=00_AQPw90j3GEDTXK3tXvQOtrt0k1SoKM1QIMHria9TZFlWWw&oe=6AD38624', 2, 0, 0, 0],
                    ['Rede Decisão/Módulo', 'MOD', 'https://ugc.production.linktr.ee/DILxL8jQKSi0otT2Uy4w_5e1dc1e176aabfe8d07377b19887b84c2?io=true&size=avatar-v3_0', 1, 0, 0, 2],
                    ['Colégio Objetivo', 'OBJ', 'https://scontent-gru2-1.xx.fbcdn.net/v/t39.30808-6/261749881_4887557201309848_2673603789593802657_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1000&ctp=s1000x1000&_nc_cat=109&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=y0A-EAjmIwMQ7kNvwFu7h2b&_nc_oc=AdpwGFsKD7xHDbycwqLHkOhUuLyOj2LtOBwqfryJkRpZeXYFePdTHcA986A3yJcXSDk&_nc_zt=23&_nc_ht=scontent-gru2-1.xx&_nc_gid=1z2Cga_Aefbb_U-xe1oOcw&_nc_ss=7b2a8&oh=00_AQP_oXLsuB19bKVbV3XwZ0UXOx9H-loE96cScCL7NO5-IA&oe=6AD3854C', 0, 2, 0, 0],
                    ['Instituto Federal', 'IFSP', 'https://scontent-gru2-2.xx.fbcdn.net/v/t39.30808-6/292419707_428540039285469_3420664120318090063_n.jpg?stp=dst-jpg_tt6&cstp=mx900x1042&ctp=s900x1042&_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=MAS2Jv04qD0Q7kNvwGE9FW9&_nc_oc=AdoQfzMYSGRaGzl_1Ym4j5J696u9qTWXSBVthzvsfEo0eN89EGvT1qTfgPEhfylNu2I&_nc_zt=23&_nc_ht=scontent-gru2-2.xx&_nc_gid=eoeQu0uBkhuFiSe9CdYZ5w&_nc_ss=7b2a8&oh=00_AQPMzWVjiHGVL4uKtL8A5cthjQkwO8r5ZJ1P_A2frpsZwQ&oe=6AD364A8', 0, 1, 1, 0],
                    ['Colégio Imperatrice', 'IMP', 'https://scontent-gru1-2.xx.fbcdn.net/v/t39.30808-6/533127058_122218958456122240_9154884991764728512_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s1080x1080&_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=oRmKyOgMrxUQ7kNvwEtVTxp&_nc_oc=AdqIISAb9PZi54md9WVUCIuxHVj9wzwPxsfO6pUfKDnLrLq8eow4nVdhxwi2PR5jGw0&_nc_zt=23&_nc_ht=scontent-gru1-2.xx&_nc_gid=uiBIerTUWsqb_xwJ2G7GrA&_nc_ss=7b2a8&oh=00_AQP3o0PVJ1WzkN52FcWiJmhy-JozBBy3pKz9qjg9Lb7zEA&oe=6AD37FED', 0, 0, 2, 0],
                    ['Colégio Amplia/Caraguatá', 'AMP', 'https://scontent-gru2-2.xx.fbcdn.net/v/t39.30808-6/459556427_122103470552517182_4089939684042885040_n.jpg?stp=dst-jpg_tt6&cstp=mx2000x2000&ctp=s2000x2000&_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Trz0WX9BHEoQ7kNvwHO4hs4&_nc_oc=AdoKP8nKNFp9A-hzY-5SIuVfQlrSQ6IlTHKCHFjVb-FUxRnNg8jTm9xpaxbz8dYiTJE&_nc_zt=23&_nc_ht=scontent-gru2-2.xx&_nc_gid=s8i6wGzUpVy5qLgEStv4kQ&_nc_ss=7b2a8&oh=00_AQNll-LrOwEKJuL5F2U2Vg7nNohztWNRFb3IbQFtcukyFQ&oe=6AD3787D', 0, 0, 0, 1],
                    ['ETEC de Caraguatatuba/CDU', 'ETEC', 'https://scontent-gru1-1.xx.fbcdn.net/v/t39.30808-6/426235193_903602695102152_7572691400377464565_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s1080x1080&_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=E-FWezEkvYIQ7kNvwG7gB5K&_nc_oc=AdoTUSmU762ZzfWYrVWIKwKlwd0fYsnXpvRaSZDIKoYIv6pOQqfmMBDVCGaLdnyuqC0&_nc_zt=23&_nc_ht=scontent-gru1-1.xx&_nc_gid=1ghA2BB4fTlWtnY1xeyWcQ&_nc_ss=7b2a8&oh=00_AQM9OIiJ0DYfUzWVHEqcgZaKKraizTAW2vWDfRqUnR4fJQ&oe=6AD362E2', 0, 0, 0, 0],
                    ['Colégio Tableau', 'TAB', 'https://scontent-gru2-2.xx.fbcdn.net/v/t39.30808-6/352464491_220473307511154_3318921309442921716_n.jpg?stp=dst-jpg_tt6&cstp=mx723x724&ctp=s723x724&_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=hp7X1TaetZcQ7kNvwEtd3Cv&_nc_oc=AdrsQFTDFqPCTqiHe9rY4Ez4_bwLdxXbsnzRmZaBBdPOyTuHhecgua6DlRYkGdBHHQw&_nc_zt=23&_nc_ht=scontent-gru2-2.xx&_nc_gid=s5BxW8GCn1uou9Cc004OOw&_nc_ss=7b2a8&oh=00_AQMeMF4bu3m0WVLHm-Prdjmbi99MGsk-mYhFm8Y2ytofkw&oe=6AD380DD', 0, 0, 0, 0],
                    ['Colégio Nova Geração', 'CNG', 'https://scontent-gru2-1.xx.fbcdn.net/v/t39.30808-6/518326505_1520068049385695_578969158403584619_n.jpg?stp=dst-jpg_tt6&cstp=mx740x740&ctp=s740x740&_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=KmH7Zqq0D3gQ7kNvwEZU9bV&_nc_oc=Adrex_UAeFKSM0N_n7MuTrpLGvxn5r8Ja8FddMoHdbJ_9K_s963Pinln4THLaa73SyM&_nc_zt=23&_nc_ht=scontent-gru2-1.xx&_nc_gid=iM2yych6gGXIvAUCeq6MsQ&_nc_ss=7b2a8&oh=00_AQPcvKANUqi_CPaZlXvr7Bl26uIG3QYjVEJ8aSJZM1bmxg&oe=6AD376DF', 0, 0, 0, 0]
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
            padding: 15px 0;
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
            font-size: 1.5rem;
            font-weight: 900;
            color: var(--gold-primary);
            text-transform: uppercase;
        }

        .logo-title span {
            font-size: 0.75rem;
            color: var(--gold-light);
            letter-spacing: 3px;
            display: block;
            text-transform: uppercase;
        }

        nav ul {
            display: flex;
            list-style: none;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        nav a {
            color: var(--text-muted);
            text-decoration: none;
            font-family: 'Raleway', sans-serif;
            font-weight: 700;
            font-size: 0.85rem;
            text-transform: uppercase;
            padding: 6px 12px;
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
            margin: 20px auto;
            padding: 0 15px;
        }

        .hero-banner {
            background: linear-gradient(135deg, #181611 0%, #0d0c09 100%);
            border: 2px solid var(--gold-secondary);
            padding: 30px 20px;
            text-align: center;
            margin-bottom: 30px;
        }

        .hero-banner h2 {
            font-size: 2rem;
            color: var(--gold-primary);
            margin-bottom: 12px;
            font-weight: 800;
            text-transform: uppercase;
            word-break: break-word;
        }

        .hero-banner p {
            color: var(--gold-light);
            font-size: 1rem;
            max-width: 800px;
            margin: 0 auto 20px auto;
            line-height: 1.5;
        }

        .btn-gold {
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
            color: #080808;
            border: none;
            padding: 10px 22px;
            font-family: 'Raleway', sans-serif;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-size: 0.9rem;
        }

        .btn-gold:hover {
            background: linear-gradient(135deg, var(--gold-light), var(--gold-primary));
        }

        .section-title {
            font-size: 1.5rem;
            color: var(--gold-primary);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid var(--card-border);
            padding-bottom: 8px;
            flex-wrap: wrap;
        }

        .grid-teams {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .team-card {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            display: flex;
            flex-direction: column;
        }

        .team-img-container {
            height: 160px;
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
            top: 8px;
            right: 8px;
            background: rgba(0,0,0,0.8);
            border: 1px solid var(--gold-secondary);
            color: var(--gold-primary);
            padding: 3px 6px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 1px;
        }

        .team-info {
            padding: 15px;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
        }

        .team-stars {
            font-size: 1rem;
            margin-bottom: 4px;
            min-height: 20px;
        }

        .team-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 12px;
            min-height: 2.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .trophies-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            background: rgba(0,0,0,0.4);
            padding: 8px;
            border: 1px solid rgba(255,255,255,0.05);
            text-align: center;
        }

        .trophies-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            background: rgba(0,0,0,0.4);
            padding: 8px;
            border: 1px solid rgba(255,255,255,0.05);
            text-align: center;
        }

        .trophy-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 0.7rem;
            color: var(--text-muted);
            justify-content: center;
        }

        .trophy-item span.count {
            font-size: 0.95rem;
            font-weight: 800;
            color: var(--gold-light);
            margin-top: 2px;
        }

        .swiss-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }

        @media(max-width: 900px) {
            .swiss-container {
                grid-template-columns: 1fr;
            }
        }

        .swiss-card {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 15px;
        }

        .swiss-card h3 {
            color: var(--gold-primary);
            margin-bottom: 12px;
            font-size: 1rem;
            text-align: center;
            text-transform: uppercase;
        }

        .match-box {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.08);
            margin-bottom: 10px;
        }

        .match-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .match-row:last-child {
            border-bottom: none;
        }

        .match-teams {
            font-weight: 700;
            font-size: 0.9rem;
            color: var(--text-main);
        }

        .match-score {
            font-weight: 800;
            color: var(--gold-light);
            font-size: 0.9rem;
        }

        .sub-phase-title {
            font-style: italic;
            color: var(--gold-light);
            font-size: 1.2rem;
            margin: 25px 0 12px 0;
            font-family: 'Raleway', sans-serif;
            font-weight: 700;
            text-align: center;
        }

        .admin-table-container {
            width: 100%;
            overflow-x: auto;
            margin-bottom: 30px;
        }

        .admin-table {
            width: 100%;
            min-width: 650px;
            border-collapse: collapse;
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
        }

        .admin-table th, .admin-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--card-border);
            font-size: 0.9rem;
        }

        .admin-table th {
            background-color: #1c1c1c;
            color: var(--gold-primary);
            font-family: 'Raleway', sans-serif;
            text-transform: uppercase;
            font-size: 0.8rem;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 6px;
            font-family: 'Raleway', sans-serif;
            font-weight: 700;
            color: var(--gold-light);
            font-size: 0.85rem;
            text-transform: uppercase;
        }

        .form-control {
            width: 100%;
            padding: 10px 12px;
            background-color: #0d0d0d;
            border: 1px solid var(--card-border);
            color: var(--text-main);
            font-family: 'Arimo', sans-serif;
            font-size: 0.95rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 12px;
        }

        @media(max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            .header-container {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
            nav ul {
                justify-content: center;
            }
            .hero-banner h2 {
                font-size: 1.6rem;
            }
        }

        .trophies-input-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        @media(max-width: 500px) {
            .trophies-input-row {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .alert {
            padding: 12px;
            margin-bottom: 20px;
            font-weight: 600;
            font-size: 0.9rem;
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
            max-width: 420px;
            margin: 30px auto;
            background-color: var(--card-bg);
            border: 1px solid var(--gold-secondary);
            padding: 30px 20px;
        }

        .btn-danger {
            background: var(--accent-red);
            color: white;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.8rem;
        }

        .btn-edit {
            background: #2980b9;
            color: white;
            border: none;
            padding: 6px 12px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.8rem;
            text-decoration: none;
            display: inline-block;
            margin-right: 4px;
        }

        footer {
            background-color: #050505;
            border-top: 1px solid var(--card-border);
            text-align: center;
            padding: 20px 15px;
            color: var(--text-muted);
            font-size: 0.85rem;
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
        <p>&copy; 2027 <span>Pirata Cup Interescolar</span>. Todos os direitos reservados. Idealizado por <span>Roni</span> & gerenciado por <span>RH</span>.</p>
    </footer>
</body>
</html>`;
}

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/?tab=home');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const admins = { 'rh': 'rh2027', 'roni': 'roni2027' };
    if (admins[username] && admins[username] === password) {
        req.session.adminLogged = true;
        req.session.adminUser = username === 'roni' ? 'Roni (Idealizador)' : 'RH';
        res.redirect('/?tab=admin');
    } else {
        db.all("SELECT * FROM teams", (err, teams) => {
            const body = `<div class="login-box">
                <h2 style="color: #d4af37; text-align: center; font-size: 1.3rem;">ACESSO ADMINISTRATIVO</h2><br>
                <div class="alert alert-error">Credenciais inválidas!</div>
                <form method="POST" action="/login">
                    <div class="form-group" style="text-align: center;"><label>Usuário</label><input type="text" name="username" class="form-control" style="text-align: center;" required></div>
                    <div class="form-group" style="text-align: center;"><label>Senha</label><input type="password" name="password" class="form-control" style="text-align: center;" required></div>
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
            <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 20px;">Todas as equipes cadastradas no hall da fama da Pirata Cup.</p>
            <div class="grid-teams">${allTeams}</div>`;

        } else if (activeTab === 'edition2027') {
            body = `<div class="hero-banner" style="text-align: center; padding: 25px;">
                <img src="https://raw.githubusercontent.com/Erriaga/piratacup/refs/heads/main/piratacup.png" width="80px" alt="Pirata Cup">
                <h2 style="color: #e67e22; font-size: 2.5rem; font-weight: 900; margin-top: 10px;">EDIÇÃO 2027</h2>
            </div>

            <div class="sub-phase-title">FASE SUÍÇA</div>
            <div class="swiss-container">
                <div class="swiss-card">
                    <h3>Rodada 1</h3>
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
                    <h3>Rodada 2</h3>
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
                    <h3>Rodada 3</h3>
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
                    <h3>Semifinais</h3>
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
                    <h3>Terceiro Lugar</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>

                <div class="swiss-card">
                    <h3>Final</h3>
                    <div class="match-box">
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                        <div class="match-row"><span class="match-teams">TBD</span><span class="match-score">-</span></div>
                    </div>
                </div>
            </div>`;

        } else if (activeTab === 'login') {
            body = `<div class="login-box">
                <h2 style="color: #d4af37; text-align: center; font-size: 1.3rem;">ACESSO ADMINISTRATIVO</h2><br>
                <form method="POST" action="/login">
                    <div class="form-group" style="text-align: center;"><label>Usuário</label><input type="text" name="username" class="form-control" style="text-align: center;" required></div>
                    <div class="form-group" style="text-align: center;"><label>Senha</label><input type="password" name="password" class="form-control" style="text-align: center;" required></div>
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
                    <form method="POST" action="/crud" style="display:inline;">
                        <input type="hidden" name="crud_action" value="delete">
                        <input type="hidden" name="id" value="${t.id}">
                        <button type="submit" class="btn-danger">Excluir</button>
                    </form>
                </td>
            </tr>`).join('');

            body = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <h3 class="section-title" style="margin-bottom: 0; border: none;">⚓ Painel de Controle - ${req.session.adminUser}</h3>
            </div>

            <div class="swiss-card" style="margin-bottom: 30px;">
                <h3 style="margin-bottom: 15px; text-align: left;">${editTeam ? '✏️ Editar Equipe' : '➕ Cadastrar Nova Equipe'}</h3>
                <form method="POST" action="/crud">
                    <input type="hidden" name="crud_action" value="${editTeam ? 'update' : 'create'}">
                    ${editTeam ? `<input type="hidden" name="id" value="${editTeam.id}">` : ''}

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
                            <div><label style="font-size:0.75rem; color:var(--text-muted);">🥇 Campeão</label><input type="number" name="champion" min="0" class="form-control" value="${editTeam ? editTeam.champion : 0}"></div>
                            <div><label style="font-size:0.75rem; color:var(--text-muted);">🥈 Vice</label><input type="number" name="runner_up" min="0" class="form-control" value="${editTeam ? editTeam.runner_up : 0}"></div>
                            <div><label style="font-size:0.75rem; color:var(--text-muted);">🥉 3º Lugar</label><input type="number" name="third_place" min="0" class="form-control" value="${editTeam ? editTeam.third_place : 0}"></div>
                            <div><label style="font-size:0.75rem; color:var(--text-muted);">🎖️ Semi</label><input type="number" name="semifinalist" min="0" class="form-control" value="${editTeam ? editTeam.semifinalist : 0}"></div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 15px; margin-top: 15px; flex-wrap: wrap;">
                        <button type="submit" class="btn-gold">${editTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}</button>
                        ${editTeam ? `<a href="/?tab=admin" class="btn-gold" style="background: transparent; border: 1px solid var(--gold-secondary); color: var(--gold-primary);">Cancelar</a>` : ''}
                    </div>
                </form>
            </div>

            <h3 class="section-title">📋 Gerenciamento de Equipes</h3>
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr><th>Sigla</th><th>Colégio</th><th>🥇 Camp.</th><th>🥈 Vice</th><th>🥉 3º</th><th>🎖️ Semi</th><th>Ações</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        }

        res.send(renderLayout(activeTab, { body, isAdmin }));
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
