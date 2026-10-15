const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// LOGS GLOBAIS: em vez de derrubar o processo (causa dos 502), registra o erro no log do Render
process.on('uncaughtException', (err) => console.error('UNCAUGHT EXCEPTION:', err));
process.on('unhandledRejection', (err) => console.error('UNHANDLED REJECTION:', err));

// Necessário atrás do proxy do Render (HTTPS)
app.set('trust proxy', 1);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sessão em cookie assinado: sobrevive a restarts/spin-down do Render
app.use(cookieSession({
    name: 'piratacup.sess',
    keys: ['pirata-cup-secret-2027', 'pirata-cup-fallback-key'],
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
}));

// Disco persistente: defina DATA_DIR=/opt/data no Environment do Render (com Disk montado)
const dataDir = process.env.DATA_DIR || __dirname;
const dbFile = path.join(dataDir, 'piratacup.db');

const db = new sqlite3.Database(dbFile, (err) => {
    if (err) console.error('Erro ao abrir o banco de dados:', err.message);
    else { console.log('Conectado ao banco SQLite em', dbFile); initDb(); }
});

// ============================================================
// BANCO COM AUTO-REPARO
// ============================================================
function initDb() {
    ensureTeamsTable();
    ensureMatchesTable();
}

function ensureTeamsTable() {
    db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, acronym TEXT NOT NULL, image TEXT NOT NULL,
        champion INTEGER DEFAULT 0, runner_up INTEGER DEFAULT 0,
        third_place INTEGER DEFAULT 0, semifinalist INTEGER DEFAULT 0
    )`, () => {
        db.all("PRAGMA table_info(teams)", (err, cols) => {
            const names = (cols || []).map(c => c.name);
            const needed = ['name', 'acronym', 'image', 'champion', 'runner_up', 'third_place', 'semifinalist'];
            const missing = needed.filter(c => !names.includes(c));
            if (err || missing.length > 0) {
                console.error('BANCO ANTIGO: tabela teams incompatível. Recriando... Faltando:', missing.join(', ') || (err && err.message));
                db.serialize(() => {
                    db.run("DROP TABLE IF EXISTS teams");
                    db.run(`CREATE TABLE teams (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL, acronym TEXT NOT NULL, image TEXT NOT NULL,
                        champion INTEGER DEFAULT 0, runner_up INTEGER DEFAULT 0,
                        third_place INTEGER DEFAULT 0, semifinalist INTEGER DEFAULT 0
                    )`, () => seedTeams());
                });
            } else {
                db.get("SELECT COUNT(*) as count FROM teams", (errCount, row) => {
                    if (!errCount && row && row.count === 0) seedTeams();
                });
            }
        });
    });
}

function seedTeams() {
    const defaultTeams = [
        ['Colégio Canópus', 'CAN', 'https://scontent-gru1-1.xx.fbcdn.net/v/t39.30808-6/300576667_476619551139509_6941224390542513015_n.jpg?stp=dst-jpg_tt6&cstp=mx800x800&ctp=s800x800&_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=ae4R3qI_rM4Q7kNvwGnbb6h&_nc_oc=AdrhOzaXAaYH62PM0PhNnZXJrcRth-2ssFCFwamRfOV7Xx82ZG6JVbdm1Yyx4Q-i9gg&_nc_zt=23&_nc_ht=scontent-gru1-1.xx&_nc_gid=CL5gqr8TGtE09gA1fSLZuQ&_nc_ss=7b2a8&oh=00_AQPw90j3GEDTXK3tXvQOtrt0k1SoKM1QIMHria9TZFlWWw&oe=6AD38624', 2, 0, 0, 0],
        ['Rede Decisão/Módulo', 'MOD', 'https://ugc.production.linktr.ee/DILxL8jQKSi0otT2Uy4w_5e1dc1e176aabfe8d07377b19887b84c2?io=true&size=avatar-v3_0', 1, 0, 0, 2],
        ['Colégio Objetivo', 'OBJ', 'https://scontent-gru2-1.xx.fbcdn.net/v/t39.30808-6/261749881_4887557201309848_2673603789593802657_n.jpg?stp=dst-jpg_tt6&cstp=mx1000x1000&ctp=s1000x1000&_nc_cat=109&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=y0A-EAjmIwMQ7kNvwFu7h2b&_nc_oc=AdpwGFsKD7xHDbycwqLHkOhUuLyOj2LtOBwqfryJkRpZeXYFePdTHcA986A3yJcXSDk&_nc_zt=23&_nc_ht=scontent-gru2-1.xx&_nc_gid=1z2Cga_Aefbb_U-xe1oOcw&_nc_ss=7b2a8&oh=00_AQP_oXLsuB19bKVbV3XwZ0UXOx9H-loE96cScCL7NO5-IA&oe=6AD3854C', 0, 2, 0, 0],
        ['Instituto Federal', 'IFSP', 'https://scontent-gru2-2.xx.fbcdn.net/v/t39.30808-6/292419707_428540039285469_3420664120318090063_n.jpg?stp=dst-jpg_tt6&cstp=mx900x1042&ctp=s900x1042&_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=MAS2Jv04qD0Q7kNvwGE9FW9&_nc_oc=AdoQfzMYSGRaGzl_1Ym4j5J96u9qTWXSBVthzvsfEo0eN89EGvT1qTfgPEhfylNu2I&_nc_zt=23&_nc_ht=scontent-gru2-2.xx&_nc_gid=eoeQu0uBkhuFiSe9CdYZ5w&_nc_ss=7b2a8&oh=00_AQPMzWVjiHGVL4uKtL8A5cthjQkwOf8r5ZJ1P_A2frpsZwQ&oe=6AD364A8', 0, 1, 1, 0],
        ['Colégio Imperatrice', 'IMP', 'https://scontent-gru1-2.xx.fbcdn.net/v/t39.30808-6/533127058_122218958456122240_9154884991764728512_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s1080x1080&_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=oRmKyOgMrxUQ7kNvwEtVTxp&_nc_oc=AdqIISAb9PZi54md9WVUCIuxHVj9wzwPxsfO6pUfKDnLrLq8eow4nVdhxwi2PR5jGw0&_nc_zt=23&_nc_ht=scontent-gru1-2.xx&_nc_gid=uiBIerTUWsqb_xwJ2G7GrA&_nc_ss=7b2a8&oh=00_AQP3o0PVJ1WzkN52FcWiJmhy-JozBBy3pKz9qg6LzEA&oe=6AD37FED', 0, 0, 2, 0],
        ['Colégio Amplia/Caraguatá', 'AMP', 'https://scontent-gru2-2.xx.fbcdn.net/v/t39.30808-6/459556427_122103470552517182_4089939684042885040_n.jpg?stp=dst-jpg_tt6&cstp=mx2000x2000&ctp=s2000x2000&_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=Trz0WX9BHEoQ7kNvwHO4hs4&_nc_oc=AdoKP8nKNFp8A-hzY-5SIuVfQlrSQ6IlTHKCHFjVb-FUxRnNg8jTm9xpaxbz8dYiTJE&_nc_zt=23&_nc_ht=scontent-gru2-2.xx&_nc_gid=s8i6wGzUpVy5qLgEStv4kQ&_nc_ss=7b2a8&oh=00_AQNll-LrOwEKJuL5F2U2VfZQY3Z3JkX2W9Hm7C6nQ4pR8sT5uU1vW2xY3zA4bC5dE6fG&oe=6AD3787D', 0, 0, 0, 1],
        ['ETEC de Caraguatatuba/CDU', 'ETEC', 'https://scontent-gru1-1.xx.fbcdn.net/v/t39.30808-6/426235193_903602695102152_7572691400377464565_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1080&ctp=s1080x1080&_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=E-FWezEkvYIQ7kNvwG7gB5K&_nc_oc=AdoTUSmU762ZzfWYrVWIKwKlwd0fYsnXpvRaSZDIKoYI6thzvsfEo0eN89EGvT1qTfgPEhfylNu2I&_nc_zt=23&_nc_ht=scontent-gru1-1.xx&_nc_gid=1ghA2BB4fTlWtnY1xeyWcQ&_nc_ss=7b2a8&oh=00_AQM9OIiJ0DYfUzWVHEqcgZaKKraizTAW2vWDfRqUnR4fJQ&oe=6AD362E2', 0, 0, 0, 0],
        ['Colégio Tableau', 'TAB', 'https://scontent-gru2-2.xx.fbcdn.net/v/t39.30808-6/352464491_220473307511154_3318921309442921716_n.jpg?stp=dst-jpg_tt6&cstp=mx723x724&ctp=s723x724&_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=hp7X1TaetZcQ7kNvwEtd3Cv&_nc_oc=AdrsQFTDFqPCTqiHe9rY4Ez4_bwLdxXbsnzRmZaBBdPOyTuHhecgua6DlRYkGdBHHQw&_nc_zt=23&_nc_ht=scontent-gru2-2.xx&_nc_gid=s5BxW8GCn1uou9Cc004OOw&_nc_ss=7b2a8&oh=00_AQMeMF4bu3m0WVLHm-Prdjmbi99MGsk-mYhFm8Y2ytofkw&oe=6AD380DD', 0, 0, 0, 0],
        ['Colégio Nova Geração', 'CNG', 'https://scontent-gru2-1.xx.fbcdn.net/v/t39.30808-6/518326505_1520068049385695_578969158403584619_n.jpg?stp=dst-jpg_tt6&cstp=mx740x740&ctp=s740x740&_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=KmH7Zqq0D3gQ7kNvwEZ9bV&_nc_oc=Adrex_UAeFKSM0N_n7MuTrpLGvxn5r8Ja8FddMoHdbJ_9K_s963Pinln4THLaa73SyM&_nc_zt=23&_nc_ht=scontent-gru2-1.xx&_nc_gid=iM2yych6gGXIvAUCeq6MsQ&_nc_ss=7b2a8&oh=00_AQPcvKANUqi_CPaZlXvr7Bl26uIG3QYjVEJ8aSJZM1bmxg&oe=6AD376DF', 0, 0, 0, 0]
    ];
    const stmt = db.prepare("INSERT INTO teams (name, acronym, image, champion, runner_up, third_place, semifinalist) VALUES (?, ?, ?, ?, ?, ?, ?)");
    defaultTeams.forEach(t => stmt.run(t));
    stmt.finalize(() => console.log('Equipes padrão cadastradas.'));
}

function ensureMatchesTable() {
    db.run(`CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phase TEXT NOT NULL, match_index INTEGER NOT NULL,
        team1_id INTEGER, team2_id INTEGER,
        team1_score INTEGER DEFAULT 0, team2_score INTEGER DEFAULT 0,
        team1_pen INTEGER DEFAULT NULL, team2_pen INTEGER DEFAULT NULL
    )`, () => {
        db.all("PRAGMA table_info(matches)", (err, cols) => {
            const names = (cols || []).map(c => c.name);
            const needed = ['phase', 'match_index', 'team1_id', 'team2_id', 'team1_score', 'team2_score', 'team1_pen', 'team2_pen'];
            const missing = needed.filter(c => !names.includes(c));
            if (err || missing.length > 0) {
                console.error('BANCO ANTIGO: tabela matches incompatível. Recriando... Faltando:', missing.join(', ') || (err && err.message));
                db.serialize(() => {
                    db.run("DROP TABLE IF EXISTS matches");
                    db.run(`CREATE TABLE matches (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        phase TEXT NOT NULL, match_index INTEGER NOT NULL,
                        team1_id INTEGER, team2_id INTEGER,
                        team1_score INTEGER DEFAULT 0, team2_score INTEGER DEFAULT 0,
                        team1_pen INTEGER DEFAULT NULL, team2_pen INTEGER DEFAULT NULL
                    )`, () => {
                        db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_phase_index ON matches(phase, match_index)", (errIdx) => {
                            if (errIdx) console.error('Aviso no índice único:', errIdx.message);
                        });
                        seedMatches();
                    });
                });
            } else {
                db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_phase_index ON matches(phase, match_index)", (errIdx) => {
                    if (errIdx) console.error('Aviso no índice único (verifique duplicatas):', errIdx.message);
                });
                // Partidas antigas sem equipes atribuídas e com placar 0-0 viram "-" (não jogadas)
                db.run("UPDATE matches SET team1_score = NULL, team2_score = NULL WHERE team1_score = 0 AND team2_score = 0 AND team1_id IS NULL AND team2_id IS NULL");
                db.get("SELECT COUNT(*) as count FROM matches", (errCount, row) => {
                    if (!errCount && row && row.count === 0) seedMatches();
                });
            }
        });
    });
}

function seedMatches() {
    const initialMatches = [
        ['swiss_r1', 0], ['swiss_r1', 1], ['swiss_r1', 2], ['swiss_r1', 3],
        ['swiss_r2', 0], ['swiss_r2', 1], ['swiss_r2', 2], ['swiss_r2', 3],
        ['swiss_r3', 0], ['swiss_r3', 1],
        ['playoffs_semi', 0], ['playoffs_semi', 1],
        ['playoffs_third', 0], ['playoffs_final', 0]
    ];
    const stmt = db.prepare("INSERT OR IGNORE INTO matches (phase, match_index, team1_score, team2_score) VALUES (?, ?, NULL, NULL)");
    initialMatches.forEach(m => stmt.run(m));
    stmt.finalize(() => console.log('Partidas iniciais cadastradas.'));
}

// ============================================================
// LAYOUT
// ============================================================
function renderLayout(activeTab, content, loginError = '') {
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
        * { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; }
        :root {
            --bg-color: #080808; --card-bg: #141414; --card-border: #262626;
            --gold-primary: #d4af37; --gold-secondary: #c5a059; --gold-light: #f4e8c1; --gold-dark: #8c7323;
            --text-main: #f0f0f0; --text-muted: #a0a0a0;
            --accent-red: #c0392b; --accent-green: #27ae60;
        }
        body { background-color: var(--bg-color); color: var(--text-main); font-family: 'Arimo', sans-serif; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
        h1, h2, h3, h4, h5, h6, .brand-font { font-family: 'Raleway', sans-serif; letter-spacing: 1px; }
        header { background: linear-gradient(180deg, #111 0%, #080808 100%); border-bottom: 2px solid var(--gold-dark); padding: 15px 0; position: sticky; top: 0; z-index: 1000; }
        .header-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 15px; }
        .logo-area { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-title h1 { font-size: 1.5rem; font-weight: 900; color: var(--gold-primary); text-transform: uppercase; }
        .logo-title span { font-size: 0.75rem; color: var(--gold-light); letter-spacing: 3px; display: block; text-transform: uppercase; }
        nav ul { display: flex; list-style: none; gap: 8px; align-items: center; flex-wrap: wrap; }
        nav a { color: var(--text-muted); text-decoration: none; font-family: 'Raleway', sans-serif; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; padding: 6px 12px; transition: all 0.3s ease; border: 1px solid transparent; }
        nav a:hover, nav a.active { color: var(--gold-light); background: rgba(212, 175, 55, 0.1); border-color: var(--gold-secondary); }
        main { flex: 1; max-width: 1200px; width: 100%; margin: 20px auto; padding: 0 15px; }
        .hero-banner { background: linear-gradient(135deg, #181611 0%, #0d0c09 100%); border: 2px solid var(--gold-secondary); padding: 30px 20px; text-align: center; margin-bottom: 30px; }
        .hero-banner h2 { font-size: 2rem; color: var(--gold-primary); margin-bottom: 12px; font-weight: 800; text-transform: uppercase; word-break: break-word; }
        .hero-banner p { color: var(--gold-light); font-size: 1rem; max-width: 800px; margin: 0 auto 20px auto; line-height: 1.5; }
        .btn-gold { background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary)); color: #080808; border: none; padding: 10px 22px; font-family: 'Raleway', sans-serif; font-weight: 800; text-transform: uppercase; cursor: pointer; text-decoration: none; display: inline-block; font-size: 0.9rem; }
        .btn-gold:hover { background: linear-gradient(135deg, var(--gold-light), var(--gold-primary)); }
        .section-title { font-size: 1.5rem; color: var(--gold-primary); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--card-border); padding-bottom: 8px; flex-wrap: wrap; }
        .grid-teams { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .team-card { background-color: var(--card-bg); border: 1px solid var(--card-border); display: flex; flex-direction: column; }
        .team-img-container { height: 160px; width: 100%; overflow: hidden; background: #111; position: relative; }
        .team-img-container img { width: 100%; height: 100%; object-fit: cover; }
        .team-acronym { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.8); border: 1px solid var(--gold-secondary); color: var(--gold-primary); padding: 3px 6px; font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; }
        .team-info { padding: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; text-align: center; }
        .team-stars { font-size: 1rem; margin-bottom: 4px; min-height: 20px; }
        .team-name { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px; min-height: 2.2rem; display: flex; align-items: center; justify-content: center; }
        .trophies-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: rgba(0,0,0,0.4); padding: 8px; border: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .trophies-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: rgba(0,0,0,0.4); padding: 8px; border: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .trophy-item { display: flex; flex-direction: column; align-items: center; font-size: 0.7rem; color: var(--text-muted); justify-content: center; }
        .trophy-item span.count { font-size: 0.95rem; font-weight: 800; color: var(--gold-light); margin-top: 2px; }
        .swiss-container { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px; }
        @media(max-width: 900px) { .swiss-container { grid-template-columns: 1fr; } }
        .swiss-card { background-color: var(--card-bg); border: 1px solid var(--card-border); padding: 15px; }
        .swiss-card h3 { color: var(--gold-primary); margin-bottom: 12px; font-size: 1rem; text-align: center; text-transform: uppercase; }
        .match-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px; overflow: hidden; }
        .match-label {
            font-size: 0.75rem; color: var(--gold-light); padding: 5px 10px;
            background: rgba(212,175,55,0.12); border-bottom: 1px solid var(--gold-dark);
            text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;
            font-family: 'Raleway', sans-serif;
        }
        .match-team-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 10px; gap: 10px; border-left: 3px solid transparent;
        }
        .match-team-row.drag-over { background: rgba(212, 175, 55, 0.2); outline: 1px dashed var(--gold-primary); outline-offset: -2px; }
        .match-team-name {
            flex: 1; min-width: 0; font-size: 0.9rem; color: var(--text-main);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .match-team-name strong { font-weight: 800; letter-spacing: 1px; margin-right: 6px; color: inherit; }
        .match-score-wrap { display: flex; align-items: center; gap: 4px; }
        .match-score-final {
            font-weight: 800; font-size: 1.05rem; color: var(--gold-light);
            min-width: 24px; text-align: center; display: inline-flex; align-items: center; gap: 4px;
        }
        .loss-arrow { font-size: 0.85rem; opacity: 0.85; }
        .result-win { border-left-color: #2ecc71; }
        .result-win .match-team-name, .result-win .match-score-final, .result-win .score-input { color: #2ecc71; }
        .result-loss { border-left-color: #e74c3c; }
        .result-loss .match-team-name, .result-loss .match-score-final, .result-loss .score-input { color: #e74c3c; }
        .pen-note { font-size: 0.75rem; color: var(--gold-secondary); padding: 2px 10px 6px 10px; text-align: right; }
        .sub-phase-title { font-style: italic; color: var(--gold-light); font-size: 1.2rem; margin: 25px 0 12px 0; font-family: 'Raleway', sans-serif; font-weight: 700; text-align: center; }
        .teams-palette { background: #111; border: 1px solid var(--gold-secondary); padding: 12px; margin-bottom: 20px; }
        .teams-palette h4 { color: var(--gold-primary); font-size: 0.9rem; margin-bottom: 8px; text-transform: uppercase; }
        .palette-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .team-chip { background: rgba(212, 175, 55, 0.15); border: 1px solid var(--gold-secondary); color: var(--gold-light); padding: 6px 10px; font-weight: 700; font-size: 0.8rem; cursor: grab; user-select: none; display: inline-flex; align-items: center; gap: 6px; }
        .team-chip:active { cursor: grabbing; }
        .team-chip.selected { background: var(--gold-primary); color: #000; }
        .score-input { width: 38px; background: #0d0d0d; border: 1px solid var(--card-border); color: var(--gold-light); text-align: center; font-weight: 800; font-size: 0.85rem; padding: 4px; }
        .pen-inputs { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--gold-light); padding: 6px 10px; justify-content: flex-start; background: rgba(212,175,55,0.05); border-top: 1px solid rgba(255,255,255,0.06); }
        .admin-table-container { width: 100%; overflow-x: auto; margin-bottom: 30px; }
        .admin-table { width: 100%; min-width: 650px; border-collapse: collapse; background-color: var(--card-bg); border: 1px solid var(--card-border); }
        .admin-table th, .admin-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--card-border); font-size: 0.9rem; }
        .admin-table th { background-color: #1c1c1c; color: var(--gold-primary); font-family: 'Raleway', sans-serif; text-transform: uppercase; font-size: 0.8rem; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 6px; font-family: 'Raleway', sans-serif; font-weight: 700; color: var(--gold-light); font-size: 0.85rem; text-transform: uppercase; }
        .form-control { width: 100%; padding: 10px 12px; background-color: #0d0d0d; border: 1px solid var(--card-border); color: var(--text-main); font-family: 'Arimo', sans-serif; font-size: 0.95rem; }
        .form-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }
        @media(max-width: 768px) {
            .form-row { grid-template-columns: 1fr; }
            .header-container { flex-direction: column; gap: 10px; text-align: center; }
            nav ul { justify-content: center; }
            .hero-banner h2 { font-size: 1.6rem; }
        }
        .trophies-input-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media(max-width: 500px) { .trophies-input-row { grid-template-columns: repeat(2, 1fr); } }
        .alert { padding: 12px; margin-bottom: 20px; font-weight: 600; font-size: 0.9rem; }
        .alert-success { background-color: rgba(39, 174, 96, 0.15); border: 1px solid var(--accent-green); color: #2ecc71; }
        .alert-error { background-color: rgba(192, 57, 43, 0.15); border: 1px solid var(--accent-red); color: #e74c3c; }
        .login-box { max-width: 420px; margin: 30px auto; background-color: var(--card-bg); border: 1px solid var(--gold-secondary); padding: 30px 20px; }
        .btn-danger { background: var(--accent-red); color: white; border: none; padding: 6px 12px; cursor: pointer; font-weight: 700; font-size: 0.8rem; }
        .btn-edit { background: #2980b9; color: white; border: none; padding: 6px 12px; cursor: pointer; font-weight: 700; font-size: 0.8rem; text-decoration: none; display: inline-block; margin-right: 4px; }
        footer { background-color: #050505; border-top: 1px solid var(--card-border); text-align: center; padding: 20px 15px; color: var(--text-muted); font-size: 0.85rem; margin-top: auto; }
        footer span { color: var(--gold-primary); font-weight: 700; }
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
        ${loginError ? `<div class="alert alert-error">${loginError}</div>` : ''}
        ${content.body}
    </main>
    <footer>
        <p>&copy; 2027 <span>Pirata Cup Interescolar</span>. Todos os direitos reservados. Idealizado por <span>Roni</span> & gerenciado por <span>RH</span>.</p>
    </footer>
</body>
</html>`;
}

// ============================================================
// ROTAS
// ============================================================
app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/?tab=home');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const admins = { 'rh': 'rh2027', 'roni': 'roni2027' };
    if (admins[username] && admins[username] === password) {
        req.session.adminLogged = true;
        req.session.adminUser = username === 'roni' ? 'Roni (Idealizador)' : 'RH';
        res.redirect('/?tab=admin');
    } else {
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
    }
});

// Salvamento simplificado: sem transação, sem prepare, com timeout de segurança.
// Aceita número, "-" (não jogada) ou vazio -> grava NULL no banco.
app.post('/save-matches', (req, res) => {
    if (!req.session.adminLogged) {
        return res.status(401).json({ success: false, error: 'Sessão expirada. Recarregue a página e faça login novamente.' });
    }
    console.log('/save-matches: recebido de', req.session.adminUser);

    const matchesData = (req.body && Array.isArray(req.body.matches)) ? req.body.matches : null;
    if (!matchesData || matchesData.length === 0) {
        return res.status(400).json({ success: false, error: 'Dados inválidos ou vazios.' });
    }

    const parseScore = (v) => {
        if (v === null || v === undefined) return null;
        const s = String(v).trim();
        if (s === '' || s === '-') return null;
        const n = parseInt(s, 10);
        return isNaN(n) ? null : n;
    };

    let responded = false;
    const respond = (code, payload) => {
        if (responded) return;
        responded = true;
        res.status(code).json(payload);
    };

    // Garantia: o botão NUNCA fica travado em "Salvando..."
    const timeout = setTimeout(() => {
        console.error('/save-matches: TIMEOUT — o banco não respondeu em 15s.');
        respond(504, { success: false, error: 'Tempo esgotado ao salvar. Tente novamente.' });
    }, 15000);

    const sql = `INSERT OR REPLACE INTO matches
        (phase, match_index, team1_id, team2_id, team1_score, team2_score, team1_pen, team2_pen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let completed = 0;
    let errors = [];

    matchesData.forEach(m => {
        const t1 = (m.team1_id !== null && m.team1_id !== undefined && m.team1_id !== '') ? parseInt(m.team1_id) : null;
        const t2 = (m.team2_id !== null && m.team2_id !== undefined && m.team2_id !== '') ? parseInt(m.team2_id) : null;
        const s1 = parseScore(m.team1_score);
        const s2 = parseScore(m.team2_score);
        const p1 = parseScore(m.team1_pen);
        const p2 = parseScore(m.team2_pen);

        db.run(sql, [String(m.phase), parseInt(m.match_index), t1, t2, s1, s2, p1, p2], (err) => {
            if (err) {
                errors.push(m.phase + '#' + m.match_index + ': ' + err.message);
                console.error('/save-matches erro:', m.phase, m.match_index, err.message);
            }
            completed++;
            if (completed === matchesData.length) {
                clearTimeout(timeout);
                if (errors.length > 0) {
                    respond(500, { success: false, error: errors.join(' | ') });
                } else {
                    console.log('/save-matches:', matchesData.length, 'partidas salvas.');
                    respond(200, { success: true, saved: matchesData.length });
                }
            }
        });
    });
});

app.post('/crud', (req, res) => {
    if (!req.session.adminLogged) return res.redirect('/?tab=login');
    const { crud_action, id, name, acronym, image, champion, runner_up, third_place, semifinalist } = req.body;
    if (crud_action === 'create' || crud_action === 'update') {
        const c = parseInt(champion) || 0, r = parseInt(runner_up) || 0;
        const tp = parseInt(third_place) || 0, s = parseInt(semifinalist) || 0;
        const acr = (acronym || '').toUpperCase().substring(0, 4);
        if (crud_action === 'create') {
            db.run("INSERT INTO teams (name, acronym, image, champion, runner_up, third_place, semifinalist) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [name, acr, image, c, r, tp, s], (err) => {
                    if (err) console.error("Erro ao criar equipe:", err.message);
                    res.redirect('/?tab=admin');
                });
        } else {
            db.run("UPDATE teams SET name=?, acronym=?, image=?, champion=?, runner_up=?, third_place=?, semifinalist=? WHERE id=?",
                [name, acr, image, c, r, tp, s, id], (err) => {
                    if (err) console.error("Erro ao atualizar equipe:", err.message);
                    res.redirect('/?tab=admin');
                });
        }
    } else if (crud_action === 'delete') {
        db.run("DELETE FROM teams WHERE id=?", [id], (err) => {
            if (err) console.error("Erro ao excluir equipe:", err.message);
            res.redirect('/?tab=admin');
        });
    }
});

app.get('/', (req, res) => {
    const activeTab = req.query.tab || 'home';
    const isAdmin = !!req.session.adminLogged;
    db.all("SELECT * FROM teams ORDER BY champion DESC, runner_up DESC, third_place DESC, semifinalist DESC, id ASC", (err, teams) => {
        if (err || !Array.isArray(teams)) {
            console.error('Erro ao consultar teams:', err && err.message);
            teams = [];
        }
        db.all("SELECT * FROM matches", (errM, matches) => {
            if (errM || !Array.isArray(matches)) {
                console.error('Erro ao consultar matches:', errM && errM.message);
                matches = [];
            }
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
                let teamsJson = JSON.stringify(teams);
                const getMatch = (phase, idx) => {
                    return matches.find(m => m.phase === phase && m.match_index === idx) || { team1_id: null, team2_id: null, team1_score: null, team2_score: null, team1_pen: null, team2_pen: null };
                };
                const teamBadge = (id) => {
                    const t = teams.find(item => String(item.id) === String(id));
                    return t ? `<strong>${t.acronym}</strong> ${t.name}` : `<strong>TBD</strong>`;
                };
                const getScoreDisplay = (v) => (v === null || v === undefined) ? '-' : v;
                const matchRowMeta = (m, teamNum) => {
                    const meta = { cls: '', arrow: '' };
                    if (m.team1_score === null || m.team1_score === undefined || m.team2_score === null || m.team2_score === undefined) return meta;
                    let t1wins = null;
                    if (m.team1_score > m.team2_score) t1wins = true;
                    else if (m.team1_score < m.team2_score) t1wins = false;
                    else if (m.team1_pen !== null && m.team1_pen !== undefined && m.team2_pen !== null && m.team2_pen !== undefined && m.team1_pen !== m.team2_pen) {
                        t1wins = m.team1_pen > m.team2_pen;
                    }
                    if (t1wins === null) return meta;
                    const win = (teamNum === 1) ? t1wins : !t1wins;
                    meta.cls = win ? 'result-win' : 'result-loss';
                    if (!win) meta.arrow = '<span class="loss-arrow">↓</span>';
                    return meta;
                };
                const renderMatchBox = (phase, idx, labelTitle) => {
                    const m = getMatch(phase, idx);
                    const meta1 = matchRowMeta(m, 1);
                    const meta2 = matchRowMeta(m, 2);
                    if (isAdmin) {
                        const pen1 = (m.team1_pen !== null && m.team1_pen !== undefined) ? m.team1_pen : '';
                        const pen2 = (m.team2_pen !== null && m.team2_pen !== undefined) ? m.team2_pen : '';
                        return `<div class="match-box" data-phase="${phase}" data-match-index="${idx}">
                        <div class="match-label">${labelTitle}</div>
                        <div class="match-team-row ${meta1.cls}" data-slot="1" data-team-id="${m.team1_id || ''}" ondragover="allowDrop(event)" ondragleave="removeDragOver(event)" ondrop="dropTeam(event, '${phase}', ${idx}, 1)" onclick="selectSlotForClick(event, this, '${phase}', ${idx}, 1)">
                            <span class="match-team-name">${teamBadge(m.team1_id)}</span>
                            <span class="match-score-wrap"><input type="text" inputmode="numeric" class="score-input" value="${getScoreDisplay(m.team1_score)}" data-score="1" placeholder="-" onchange="markDirty()">${meta1.arrow}</span>
                        </div>
                        <div class="match-team-row ${meta2.cls}" data-slot="2" data-team-id="${m.team2_id || ''}" ondragover="allowDrop(event)" ondragleave="removeDragOver(event)" ondrop="dropTeam(event, '${phase}', ${idx}, 2)" onclick="selectSlotForClick(event, this, '${phase}', ${idx}, 2)">
                            <span class="match-team-name">${teamBadge(m.team2_id)}</span>
                            <span class="match-score-wrap"><input type="text" inputmode="numeric" class="score-input" value="${getScoreDisplay(m.team2_score)}" data-score="2" placeholder="-" onchange="markDirty()">${meta2.arrow}</span>
                        </div>
                        <div class="pen-inputs">
                            <span>Pênaltis:</span>
                            <input type="text" inputmode="numeric" class="score-input pen-input-1" value="${pen1}" placeholder="-" onchange="markDirty()">
                            <span>-</span>
                            <input type="text" inputmode="numeric" class="score-input pen-input-2" value="${pen2}" placeholder="-" onchange="markDirty()">
                            <button type="button" onclick="clearMatchSlot('${phase}', ${idx})" style="background:none; border:1px solid var(--accent-red); color:var(--accent-red); font-size:0.7rem; cursor:pointer; font-weight:700; padding:2px 8px; margin-left:auto;">Limpar</button>
                        </div>
                    </div>`;
                    } else {
                        const played = (m.team1_score !== null && m.team1_score !== undefined && m.team2_score !== null && m.team2_score !== undefined);
                        const penNote = (played && m.team1_score === m.team2_score && m.team1_pen !== null && m.team2_pen !== null)
                            ? `<div class="pen-note">Disputa por pênaltis: ${m.team1_pen} - ${m.team2_pen}</div>` : '';
                        return `<div class="match-box">
                        <div class="match-label">${labelTitle}</div>
                        <div class="match-team-row ${meta1.cls}">
                            <span class="match-team-name">${teamBadge(m.team1_id)}</span>
                            <span class="match-score-final">${getScoreDisplay(m.team1_score)}${meta1.arrow}</span>
                        </div>
                        <div class="match-team-row ${meta2.cls}">
                            <span class="match-team-name">${teamBadge(m.team2_id)}</span>
                            <span class="match-score-final">${getScoreDisplay(m.team2_score)}${meta2.arrow}</span>
                        </div>
                        ${penNote}
                    </div>`;
                    }
                };
                let adminControlsHtml = '';
                if (isAdmin) {
                    let paletteChips = teams.map(t =>
                        `<div class="team-chip" draggable="true" ondragstart="dragTeam(event, ${t.id})" onclick="clickTeamPalette(event, ${t.id}, '${t.acronym}')">
                            ${t.acronym} - ${t.name}
                        </div>`
                    ).join('');
                    adminControlsHtml = `
                    <div style="background: rgba(212,175,55,0.08); border: 1px solid var(--gold-secondary); padding: 20px; margin-bottom: 25px;">
                        <h3 style="color: var(--gold-primary); margin-bottom: 10px; font-size: 1.1rem;">🛠️ Painel de Gerenciamento da Edição 2027</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px;">
                            Arraste as siglas das equipes (ou clique na equipe e depois na linha da partida) para formar os confrontos. Use "-" no placar para partidas que ainda não aconteceram. Insira o placar dos pênaltis quando necessário.
                        </p>
                        <div class="teams-palette">
                            <h4>Equipes Disponíveis (Arraste ou Clique):</h4>
                            <div class="palette-chips">${paletteChips}</div>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <button type="button" class="btn-gold" onclick="saveMatches()">💾 Salvar Alterações das Partidas</button>
                            <span id="save-status" style="font-size: 0.85rem; font-weight: 700; color: var(--accent-green);"></span>
                        </div>
                    </div>`;
                }
                body = `<div class="hero-banner" style="text-align: center; padding: 25px;">
                    <img src="https://raw.githubusercontent.com/Erriaga/piratacup/refs/heads/main/piratacup.png" width="80px" alt="Pirata Cup">
                    <h2 style="color: #e67e22; font-size: 2.2rem; font-weight: 900; margin-top: 10px;">EDIÇÃO 2027</h2>
                    <p style="margin-top: 10px;">Confrontos oficiais do Sistema Suíço e Fases Finais.</p>
                </div>
                ${adminControlsHtml}
                <div class="sub-phase-title">FASE SUÍÇA</div>
                <div class="swiss-container">
                    <div class="swiss-card">
                        <h3>Rodada 1 (0-0)</h3>
                        ${renderMatchBox('swiss_r1', 0, 'Partida 1')}
                        ${renderMatchBox('swiss_r1', 1, 'Partida 2')}
                        ${renderMatchBox('swiss_r1', 2, 'Partida 3')}
                        ${renderMatchBox('swiss_r1', 3, 'Partida 4')}
                    </div>
                    <div class="swiss-card">
                        <h3>Rodada 2 (1-0 & 0-1)</h3>
                        <div style="font-size:0.75rem; color:var(--gold-secondary); margin-bottom:6px; font-weight:700;">Chave 1-0 (Vencedores R1)</div>
                        ${renderMatchBox('swiss_r2', 0, 'Jogo 1-0 #1')}
                        ${renderMatchBox('swiss_r2', 1, 'Jogo 1-0 #2')}
                        <div style="font-size:0.75rem; color:var(--gold-secondary); margin: 10px 0 6px 0; font-weight:700;">Chave 0-1 (Perdedores R1)</div>
                        ${renderMatchBox('swiss_r2', 2, 'Jogo 0-1 #1')}
                        ${renderMatchBox('swiss_r2', 3, 'Jogo 0-1 #2')}
                    </div>
                    <div class="swiss-card">
                        <h3>Rodada 3 (1-1)</h3>
                        ${renderMatchBox('swiss_r3', 0, 'Confronto Decisivo 1')}
                        ${renderMatchBox('swiss_r3', 1, 'Confronto Decisivo 2')}
                    </div>
                </div>
                <div class="sub-phase-title">FASE FINAL</div>
                <div class="swiss-container">
                    <div class="swiss-card">
                        <h3>Semifinais</h3>
                        ${renderMatchBox('playoffs_semi', 0, 'Semifinal 1')}
                        ${renderMatchBox('playoffs_semi', 1, 'Semifinal 2')}
                    </div>
                    <div class="swiss-card">
                        <h3>Terceiro Lugar</h3>
                        ${renderMatchBox('playoffs_third', 0, 'Disputa 3º Lugar')}
                    </div>
                    <div class="swiss-card">
                        <h3>Final</h3>
                        ${renderMatchBox('playoffs_final', 0, 'Grande Final')}
                    </div>
                </div>
                ${isAdmin ? `
                <script>
                    const allTeamsData = ${teamsJson};
                    let selectedTeamForClick = null;
                    function dragTeam(e, teamId) {
                        e.dataTransfer.setData('text/plain', teamId);
                        e.dataTransfer.setData('text', teamId);
                    }
                    function allowDrop(e) {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-over');
                    }
                    function removeDragOver(e) {
                        e.currentTarget.classList.remove('drag-over');
                    }
                    function dropTeam(e, phase, matchIndex, slotNum) {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-over');
                        const teamId = e.dataTransfer.getData('text') || e.dataTransfer.getData('text/plain');
                        if (teamId) {
                            assignTeam(phase, matchIndex, slotNum, teamId);
                        }
                    }
                    function clickTeamPalette(e, teamId, acronym) {
                        selectedTeamForClick = { id: teamId, acronym: acronym };
                        document.querySelectorAll('.team-chip').forEach(c => c.classList.remove('selected'));
                        e.currentTarget.classList.add('selected');
                    }
                    function selectSlotForClick(e, slotElem, phase, matchIndex, slotNum) {
                        if (e.target && e.target.tagName === 'INPUT') return;
                        if (selectedTeamForClick) {
                            assignTeam(phase, matchIndex, slotNum, selectedTeamForClick.id);
                            selectedTeamForClick = null;
                            document.querySelectorAll('.team-chip').forEach(c => c.classList.remove('selected'));
                        }
                    }
                    function assignTeam(phase, matchIndex, slotNum, teamId) {
                        const matchBox = document.querySelector(\`.match-box[data-phase="\${phase}"][data-match-index="\${matchIndex}"]\`);
                        if (!matchBox) return;
                        const otherSlotNum = slotNum === 1 ? 2 : 1;
                        const otherSlot = matchBox.querySelector(\`.match-team-row[data-slot="\${otherSlotNum}"]\`);
                        if (otherSlot && String(otherSlot.getAttribute('data-team-id')) === String(teamId)) {
                            showStatus('Uma equipe não pode jogar contra si mesma na mesma partida!', true);
                            return;
                        }
                        const targetSlot = matchBox.querySelector(\`.match-team-row[data-slot="\${slotNum}"]\`);
                        const teamObj = allTeamsData.find(t => String(t.id) === String(teamId));
                        if (!teamObj) return;
                        targetSlot.setAttribute('data-team-id', teamObj.id);
                        targetSlot.querySelector('.match-team-name').innerHTML = '<strong>' + teamObj.acronym + '</strong> ' + teamObj.name;
                        markDirty();
                    }
                    function clearMatchSlot(phase, matchIndex) {
                        const matchBox = document.querySelector(\`.match-box[data-phase="\${phase}"][data-match-index="\${matchIndex}"]\`);
                        if (!matchBox) return;
                        matchBox.querySelectorAll('.match-team-row').forEach(r => {
                            r.setAttribute('data-team-id', '');
                            r.classList.remove('result-win', 'result-loss');
                            r.querySelector('.match-team-name').innerHTML = '<strong>TBD</strong>';
                            const arrow = r.querySelector('.loss-arrow');
                            if (arrow) arrow.remove();
                        });
                        matchBox.querySelectorAll('.score-input[data-score]').forEach(i => i.value = '-');
                        matchBox.querySelectorAll('.pen-inputs input.pen-input-1, .pen-inputs input.pen-input-2').forEach(i => i.value = '');
                        markDirty();
                    }
                    function markDirty() {
                        const status = document.getElementById('save-status');
                        status.style.color = '#e74c3c';
                        status.innerText = '⚠️ Alterações não salvas!';
                    }
                    function showStatus(msg, isError = false) {
                        const status = document.getElementById('save-status');
                        status.style.color = isError ? '#e74c3c' : '#2ecc71';
                        status.innerText = msg;
                    }
                    function saveMatches() {
                        const matchBoxes = document.querySelectorAll('.match-box[data-phase]');
                        const matchesPayload = [];
                        const parseVal = (v) => { const s = (v || '').trim(); return (s === '' || s === '-') ? null : s; };
                        matchBoxes.forEach(box => {
                            const phase = box.getAttribute('data-phase');
                            const matchIndex = parseInt(box.getAttribute('data-match-index'));
                            const slot1 = box.querySelector('.match-team-row[data-slot="1"]');
                            const slot2 = box.querySelector('.match-team-row[data-slot="2"]');
                            const score1 = box.querySelector('.score-input[data-score="1"]');
                            const score2 = box.querySelector('.score-input[data-score="2"]');
                            const penInput1 = box.querySelector('.pen-input-1');
                            const penInput2 = box.querySelector('.pen-input-2');
                            matchesPayload.push({
                                phase: phase,
                                match_index: matchIndex,
                                team1_id: slot1.getAttribute('data-team-id') || null,
                                team2_id: slot2.getAttribute('data-team-id') || null,
                                team1_score: score1 ? parseVal(score1.value) : null,
                                team2_score: score2 ? parseVal(score2.value) : null,
                                team1_pen: penInput1 ? parseVal(penInput1.value) : null,
                                team2_pen: penInput2 ? parseVal(penInput2.value) : null
                            });
                        });
                        showStatus('⏳ Salvando partidas...');
                        fetch('/save-matches', {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ matches: matchesPayload })
                        })
                        .then(async (res) => {
                            let data = {};
                            try { data = await res.json(); } catch (e) { /* resposta não era JSON */ }
                            if (res.ok && data.success) {
                                showStatus('✅ Partidas salvas com sucesso!');
                                setTimeout(() => location.reload(), 1000);
                            } else if (res.status === 401) {
                                showStatus('❌ Sua sessão expirou. Recarregue a página (F5) e faça login novamente.', true);
                            } else if (res.status === 502 || res.status === 504) {
                                showStatus('❌ O servidor está indisponível ou reiniciando. Aguarde ~1 minuto e tente de novo.', true);
                            } else {
                                showStatus('❌ Erro ao salvar (HTTP ' + res.status + '): ' + (data.error || 'resposta inválida do servidor'), true);
                                console.error('Resposta do servidor:', res.status, data);
                            }
                        })
                        .catch(err => {
                            showStatus('❌ Falha na requisição: ' + err.message, true);
                            console.error(err);
                        });
                    }
                </script>
                ` : ''}`;
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
                const editTeam = editId ? teams.find(t => String(t.id) === String(editId)) : null;
                const rows = teams.map(t => `<tr>
                    <td><strong>${t.acronym}</strong></td>
                    <td>${t.name}</td>
                    <td>${t.champion}</td>
                    <td>${t.runner_up}</td>
                    <td>${t.third_place}</td>
                    <td>${t.semifinalist}</td>
                    <td>
                        <a href="/?tab=admin&edit=${t.id}" class="btn-edit">✏️ Editar</a>
                        <form method="POST" action="/crud" style="display:inline;" onsubmit="return confirm('Excluir a equipe ${t.name}?');">
                            <input type="hidden" name="crud_action" value="delete">
                            <input type="hidden" name="id" value="${t.id}">
                            <button type="submit" class="btn-danger">🗑️ Excluir</button>
                        </form>
                    </td>
                </tr>`).join('');
                const fv = (field) => editTeam ? editTeam[field] : '';
                body = `<h3 class="section-title">🛠️ Painel Administrativo</h3>
                ${editTeam
                    ? `<h4 style="color: var(--gold-light); margin-bottom: 15px;">Editando: ${editTeam.name} <a href="/?tab=admin" style="color: var(--accent-red); font-size: 0.8rem; margin-left: 10px;">✖ Cancelar Edição</a></h4>`
                    : `<p style="color: var(--text-muted); margin-bottom: 15px;">Gerencie as equipes cadastradas no campeonato.</p>`}
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead><tr><th>Sigla</th><th>Equipe</th><th>🏆</th><th>🥈</th><th>🥉</th><th>🎖️</th><th>Ações</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <h3 class="section-title">${editTeam ? '✏️ Editar Equipe' : '➕ Adicionar Nova Equipe'}</h3>
                <form method="POST" action="/crud" style="max-width: 800px;">
                    <input type="hidden" name="crud_action" value="${editTeam ? 'update' : 'create'}">
                    ${editTeam ? `<input type="hidden" name="id" value="${editTeam.id}">` : ''}
                    <div class="form-row">
                        <div class="form-group"><label>Nome da Equipe</label><input type="text" name="name" class="form-control" value="${fv('name')}" required></div>
                        <div class="form-group"><label>Sigla</label><input type="text" name="acronym" class="form-control" maxlength="4" value="${fv('acronym')}" required></div>
                        <div class="form-group"><label>URL do Escudo</label><input type="url" name="image" class="form-control" value="${fv('image')}" required></div>
                    </div>
                    <div class="form-group">
                        <label>Conquistas</label>
                        <div class="trophies-input-row">
                            <div><label style="font-size:0.75rem;">🏆 Campeã</label><input type="number" min="0" name="champion" class="form-control" value="${editTeam ? editTeam.champion : 0}"></div>
                            <div><label style="font-size:0.75rem;">🥈 Vice</label><input type="number" min="0" name="runner_up" class="form-control" value="${editTeam ? editTeam.runner_up : 0}"></div>
                            <div><label style="font-size:0.75rem;">🥉 3º Lugar</label><input type="number" min="0" name="third_place" class="form-control" value="${editTeam ? editTeam.third_place : 0}"></div>
                            <div><label style="font-size:0.75rem;">🎖️ Semifinal</label><input type="number" min="0" name="semifinalist" class="form-control" value="${editTeam ? editTeam.semifinalist : 0}"></div>
                        </div>
                    </div>
                    <button type="submit" class="btn-gold">${editTeam ? '💾 Salvar Alterações' : '➕ Cadastrar Equipe'}</button>
                </form>`;
            }
            res.send(renderLayout(activeTab, { body, isAdmin }));
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor Pirata Cup rodando na porta ${PORT}`);
});
