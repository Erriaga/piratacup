const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const dbFile = path.join(__dirname, 'piratacup.db');
const db = new Database(dbFile);

db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        acronym TEXT NOT NULL,
        image TEXT NOT NULL,
        champion INTEGER DEFAULT 0,
        runner_up INTEGER DEFAULT 0,
        third_place INTEGER DEFAULT 0,
        semifinalist INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        round_num INTEGER NOT NULL,
        match_index INTEGER NOT NULL,
        group_type TEXT NOT NULL,
        team1_id INTEGER,
        team2_id INTEGER,
        score1 INTEGER DEFAULT 0,
        score2 INTEGER DEFAULT 0,
        pen1 INTEGER DEFAULT NULL,
        pen2 INTEGER DEFAULT NULL,
        status TEXT DEFAULT 'pending'
    );
`);

const tableInfo = db.prepare("PRAGMA table_info(matches)").all();
const hasPen1 = tableInfo.some(col => col.name === 'pen1');
if (!hasPen1) {
    db.exec(`
        ALTER TABLE matches ADD COLUMN pen1 INTEGER DEFAULT NULL;
        ALTER TABLE matches ADD COLUMN pen2 INTEGER DEFAULT NULL;
    `);
}

// Seed default teams if empty
const teamCount = db.prepare("SELECT COUNT(*) as count FROM teams").get().count;
if (teamCount === 0) {
    const insertTeam = db.prepare("INSERT INTO teams (name, acronym, image, champion, runner_up, third_place, semifinalist) VALUES (?, ?, ?, ?, ?, ?, ?)");
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
    const insertMany = db.transaction((teams) => {
        for (const t of teams) insertTeam.run(t);
    });
    insertMany(defaultTeams);
}

// Seed default matches if empty
const matchCount = db.prepare("SELECT COUNT(*) as count FROM matches").get().count;
if (matchCount === 0) {
    const insertMatch = db.prepare("INSERT INTO matches (round_num, match_index, group_type, team1_id, team2_id, score1, score2, pen1, pen2, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const defaultMatches = [
        [1, 1, '0-0', null, null, 0, 0, null, null, 'pending'],
        [1, 2, '0-0', null, null, 0, 0, null, null, 'pending'],
        [1, 3, '0-0', null, null, 0, 0, null, null, 'pending'],
        [1, 4, '0-0', null, null, 0, 0, null, null, 'pending'],
        [2, 1, '1-0', null, null, 0, 0, null, null, 'pending'],
        [2, 2, '1-0', null, null, 0, 0, null, null, 'pending'],
        [2, 3, '0-1', null, null, 0, 0, null, null, 'pending'],
        [2, 4, '0-1', null, null, 0, 0, null, null, 'pending'],
        [3, 1, '1-1', null, null, 0, 0, null, null, 'pending'],
        [3, 2, '1-1', null, null, 0, 0, null, null, 'pending'],
    ];
    const insertManyMatches = db.transaction((matches) => {
        for (const m of matches) insertMatch.run(m);
    });
    insertManyMatches(defaultMatches);
}

// Seed Final Stage matches if missing
const r4Count = db.prepare("SELECT COUNT(*) as count FROM matches WHERE round_num >= 4").get().count;
if (r4Count === 0) {
    const insertMatch = db.prepare("INSERT INTO matches (round_num, match_index, group_type, team1_id, team2_id, score1, score2, pen1, pen2, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const finalMatches = [
        [4, 1, 'Semifinais', null, null, 0, 0, null, null, 'pending'],
        [4, 2, 'Semifinais', null, null, 0, 0, null, null, 'pending'],
        [5, 1, 'Terceiro Lugar', null, null, 0, 0, null, null, 'pending'],
        [6, 1, 'Final', null, null, 0, 0, null, null, 'pending'],
    ];
    const insertManyFinal = db.transaction((matches) => {
        for (const m of matches) insertMatch.run(m);
    });
    insertManyFinal(finalMatches);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'pirata-cup-secret-key-2027',
    resave: false,
    saveUninitialized: false
}));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const admins = {
        'rh': 'rh2027',
        'roni': 'roni2027'
    };

    if (admins[username] && admins[username] === password) {
        req.session.adminLogged = true;
        req.session.adminUser = (username === 'roni') ? 'Roni (Idealizador)' : 'Gerenciador (RH)';
        res.redirect('/?tab=edition2027');
    } else {
        res.redirect('/?tab=login&error=invalid');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.post('/save-matches', (req, res) => {
    if (!req.session.adminLogged) return res.redirect('/?tab=login');

    const { match_id, team1_id, team2_id, score1, score2, pen1, pen2, status } = req.body;
    const ids = Array.isArray(match_id) ? match_id : [match_id];

    const updateMatch = db.prepare(`
        UPDATE matches 
        SET team1_id = ?, team2_id = ?, score1 = ?, score2 = ?, pen1 = ?, pen2 = ?, status = ? 
        WHERE id = ?
    `);

    const updateMany = db.transaction((data) => {
        for (let i = 0; i < data.match_ids.length; i++) {
            const mid = data.match_ids[i];
            const t1 = data.team1_ids[i] ? parseInt(data.team1_ids[i]) : null;
            const t2 = data.team2_ids[i] ? parseInt(data.team2_ids[i]) : null;
            const s1 = parseInt(data.score1s[i] || 0);
            const s2 = parseInt(data.score2s[i] || 0);
            const p1 = (data.pen1s[i] !== '' && data.pen1s[i] !== undefined && data.pen1s[i] !== null) ? parseInt(data.pen1s[i]) : null;
            const p2 = (data.pen2s[i] !== '' && data.pen2s[i] !== undefined && data.pen2s[i] !== null) ? parseInt(data.pen2s[i]) : null;
            const st = data.statuses[i] || 'pending';

            updateMatch.run(t1, t2, s1, s2, p1, p2, st, mid);
        }
    });

    updateMany({
        match_ids: ids,
        team1_ids: team1_id || [],
        team2_ids: team2_id || [],
        score1s: score1 || [],
        score2s: score2 || [],
        pen1s: pen1 || [],
        pen2s: pen2 || [],
        statuses: status || []
    });

    res.redirect('/?tab=edition2027&msg=Confrontos%20atualizados%20com%20sucesso!');
});

app.post('/team-crud', (req, res) => {
    if (!req.session.adminLogged) return res.redirect('/?tab=login');

    const { crud_action, id, name, acronym, image, champion, runner_up, third_place, semifinalist } = req.body;

    if (crud_action === 'create' || crud_action === 'update') {
        const trimmedName = (name || '').trim();
        const trimmedAcronym = (acronym || '').trim().toUpperCase().substring(0, 4);
        const trimmedImage = (image || '').trim();
        const champ = parseInt(champion || 0);
        const runner = parseInt(runner_up || 0);
        const third = parseInt(third_place || 0);
        const semi = parseInt(semifinalist || 0);

        if (trimmedName && trimmedAcronym) {
            if (crud_action === 'create') {
                db.prepare("INSERT INTO teams (name, acronym, image, champion, runner_up, third_place, semifinalist) VALUES (?, ?, ?, ?, ?, ?, ?)")
                  .run(trimmedName, trimmedAcronym, trimmedImage, champ, runner, third, semi);
                res.redirect('/?tab=admin&msg=Equipe%20cadastrada%20com%20sucesso!');
            } else {
                db.prepare("UPDATE teams SET name = ?, acronym = ?, image = ?, champion = ?, runner_up = ?, third_place = ?, semifinalist = ? WHERE id = ?")
                  .run(trimmedName, trimmedAcronym, trimmedImage, champ, runner, third, semi, parseInt(id));
                res.redirect('/?tab=admin&msg=Equipe%20atualizada%20com%20sucesso!');
            }
        } else {
            res.redirect('/?tab=admin&msg=Nome%20e%20Sigla%20sao%20obrigatorios!');
        }
    } else if (crud_action === 'delete') {
        const teamId = parseInt(id || 0);
        if (teamId > 0) {
            db.prepare("DELETE FROM teams WHERE id = ?").run(teamId);
            res.redirect('/?tab=admin&msg=Equipe%20excluida%20com%20sucesso!');
        } else {
            res.redirect('/?tab=admin');
        }
    } else {
        res.redirect('/?tab=admin');
    }
});

app.get('/', (req, res) => {
    const activeTab = req.query.tab || 'home';
    const crudMessage = req.query.msg || '';
    const loginError = req.query.error === 'invalid' ? 'Credenciais inválidas! Tente novamente.' : '';
    const editId = req.query.edit ? parseInt(req.query.edit) : null;

    const teams = db.prepare("SELECT * FROM teams ORDER BY champion DESC, runner_up DESC, third_place DESC, semifinalist DESC, id ASC").all();
    const teamsMap = {};
    teams.forEach(t => { teamsMap[t['id']] = t; });

    const matches = db.prepare("SELECT * FROM matches ORDER BY round_num ASC, match_index ASC").all();
    const editTeam = editId ? db.prepare("SELECT * FROM teams WHERE id = ?").get(editId) : null;
    const adminLogged = req.session.adminLogged || false;
    const adminUser = req.session.adminUser || '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pirata Cup - Campeonato Interescolar</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&family=Raleway:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --card-bg: #131b2e;
            --card-border: #1e293b;
            --gold-primary: #f59e0b;
            --gold-secondary: #d97706;
            --gold-light: #fde68a;
            --gold-dark: #b45309;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent-red: #ef4444;
            --accent-green: #22c55e;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            border-radius: 0 !important; /* STRICT: Zero border-radius across entire page */
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
            background: linear-gradient(180deg, #0f172a 0%, #0b0f19 100%);
            border-bottom: 2px solid var(--gold-dark);
            padding: 20px 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.8);
        }

        .header-container {
            max-width: 1280px;
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

        .logo-img {
            width: 55px;
            height: 55px;
            object-fit: contain;
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4));
        }

        .logo-title h1 {
            font-size: 1.8rem;
            font-weight: 900;
            color: var(--gold-primary);
            text-transform: uppercase;
            text-shadow: 0 2px 4px rgba(0,0,0,0.9);
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
            background: rgba(245, 158, 11, 0.1);
            border-color: var(--gold-secondary);
            box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
        }

        .admin-badge {
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            color: #000;
            padding: 6px 12px;
            font-weight: 800;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        main {
            flex: 1;
            max-width: 1280px;
            width: 100%;
            margin: 30px auto;
            padding: 0 20px;
        }

        .hero-banner {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 2px solid var(--gold-secondary);
            padding: 40px;
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.7);
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
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            text-decoration: none;
            display: inline-block;
        }

        .btn-gold:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
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
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 6px 15px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
        }

        .team-card:hover {
            border-color: var(--gold-secondary);
            transform: translateY(-5px);
            box-shadow: 0 12px 25px rgba(245, 158, 11, 0.15);
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
            transition: transform 0.5s ease;
        }

        .team-card:hover .team-img-container img {
            transform: scale(1.05);
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
        }

        .team-stars-rating {
            text-align: center;
            font-size: 0.95rem;
            color: var(--gold-primary);
            margin-bottom: 4px;
            letter-spacing: 2px;
            min-height: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .team-name {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 15px;
            text-align: center;
            min-height: 2.8rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .trophies-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            background: rgba(0,0,0,0.4);
            padding: 12px 10px;
            border: 1px solid rgba(255,255,255,0.05);
            text-align: center;
            align-items: center;
        }

        .trophies-grid-3 {
            grid-template-columns: repeat(3, 1fr);
        }

        .trophy-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            color: var(--text-muted);
            height: 100%;
        }

        .trophy-item span.count {
            font-size: 1rem;
            font-weight: 800;
            color: var(--gold-light);
            margin-top: 4px;
        }

        .swiss-rounds-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
            margin-bottom: 40px;
        }

        @media(max-width: 1024px) {
            .swiss-rounds-grid {
                grid-template-columns: 1fr;
            }
        }

        .round-column {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 20px;
            box-shadow: 0 6px 15px rgba(0,0,0,0.5);
        }

        .round-column h3 {
            color: var(--gold-primary);
            margin-bottom: 20px;
            font-size: 1.2rem;
            text-align: center;
            border-bottom: 1px solid var(--card-border);
            padding-bottom: 10px;
        }

        .hltv-match-card {
            background-color: #1a2234;
            border: 1px solid #2a374a;
            margin-bottom: 15px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }

        .hltv-team-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            border-bottom: 1px solid #222d3f;
            position: relative;
        }

        .hltv-team-row:last-child {
            border-bottom: none;
        }

        .hltv-status-bar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
        }

        .status-win { background-color: var(--accent-green); }
        .status-loss { background-color: var(--accent-red); }
        .status-neutral { background-color: #64748b; }

        .hltv-team-info {
            display: flex;
            align-items: center;
            gap: 10px;
            padding-left: 8px;
            font-weight: 700;
            font-size: 0.95rem;
            letter-spacing: 0.5px;
        }

        .hltv-team-score {
            font-weight: 800;
            font-size: 1rem;
            color: var(--gold-light);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .match-group-badge {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-align: center;
            background: rgba(0,0,0,0.3);
            padding: 4px;
            font-weight: 600;
            text-transform: uppercase;
            border-bottom: 1px solid #2a374a;
        }

        .teams-pool {
            background: #0f172a;
            border: 1px dashed var(--gold-secondary);
            padding: 15px;
            margin-bottom: 30px;
        }

        .teams-pool h4 {
            color: var(--gold-primary);
            margin-bottom: 10px;
            font-size: 1rem;
        }

        .pool-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .team-chip {
            background: var(--card-bg);
            border: 1px solid var(--gold-secondary);
            color: var(--gold-light);
            padding: 6px 12px;
            font-weight: 800;
            font-size: 0.85rem;
            cursor: grab;
            user-select: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .team-chip:active {
            cursor: grabbing;
        }

        .dropzone-slot {
            min-height: 38px;
            background: #0f172a;
            border: 1px solid #334155;
            padding: 4px 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: var(--text-main);
            font-weight: 700;
        }

        .admin-table {
            width: 100%;
            border-collapse: collapse;
            background-color: var(--card-bg);
            overflow: hidden;
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
            background-color: #1e293b;
            color: var(--gold-primary);
            font-family: 'Raleway', sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.85rem;
        }

        .admin-table tr:hover {
            background-color: rgba(255,255,255,0.02);
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
            background-color: #0f172a;
            border: 1px solid var(--card-border);
            color: var(--text-main);
            font-family: 'Arimo', sans-serif;
            font-size: 1rem;
            transition: border-color 0.3s;
        }

        .form-control:focus {
            outline: none;
            border-color: var(--gold-primary);
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
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
            background-color: rgba(34, 197, 94, 0.15);
            border: 1px solid var(--accent-green);
            color: #4ade80;
        }

        .alert-error {
            background-color: rgba(239, 68, 68, 0.15);
            border: 1px solid var(--accent-red);
            color: #f87171;
        }

        .login-box {
            max-width: 450px;
            margin: 50px auto;
            background-color: var(--card-bg);
            border: 1px solid var(--gold-secondary);
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }

        .login-box h2 {
            color: var(--gold-primary);
            margin-bottom: 20px;
            text-align: center;
            font-size: 1.8rem;
        }

        .btn-danger {
            background: var(--accent-red);
            color: white;
            border: none;
            padding: 8px 14px;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.85rem;
            transition: opacity 0.3s;
        }

        .btn-danger:hover {
            opacity: 0.85;
        }

        .btn-edit {
            background: #0284c7;
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

        .btn-edit:hover {
            opacity: 0.85;
        }

        /* Custom Modal Replacement for alert/confirm (Strict No alert/confirm rule) */
        .custom-modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .custom-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        .custom-modal {
            background: var(--card-bg);
            border: 2px solid var(--gold-secondary);
            padding: 30px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.9);
        }
        .custom-modal p {
            color: var(--text-main);
            font-size: 1.1rem;
            margin-bottom: 25px;
            font-family: 'Arimo', sans-serif;
        }
        .custom-modal-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        footer {
            background-color: #050811;
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
                <img src="piratacup.png" alt="Pirata Cup Logo" class="logo-img" onerror="this.src='https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80'">
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
                    ${adminLogged ? `
                        <li><a href="/?tab=admin" class="${activeTab === 'admin' ? 'active' : ''}">Painel Equipes</a></li>
                        <li><a href="/logout" style="color: var(--accent-red);">Sair</a></li>
                    ` : `
                        <li><a href="/?tab=login" class="${activeTab === 'login' ? 'active' : ''}">Login Admin</a></li>
                    `}
                </ul>
            </nav>
        </div>
    </header>

    <main>
        ${crudMessage ? `<div class="alert alert-success">${escapeHtml(crudMessage)}</div>` : ''}

        ${activeTab === 'home' ? `
            <div class="hero-banner">
                <h2>O Maior Campeonato Interescolar</h2>
                <p>Bem-vindo ao quartel-general oficial da <strong>Pirata Cup</strong>! O torneio anual que consagra a glória, a garra e a honra dos colégios participantes. Navegue pelas edições, conheça as equipes lendárias e acompanhe a preparação épica para a 4ª Edição em 2027!</p>
                <a href="/?tab=edition2027" class="btn-gold">⚔️ Ver Edição 2027</a>
            </div>

            <h3 class="section-title">🏴‍☠️ Destaques das Equipes</h3>
            <div class="grid-teams">
                ${teams.slice(0, 4).map(team => `
                    <div class="team-card">
                        <div class="team-img-container">
                            <img src="${escapeHtml(team.image)}" alt="${escapeHtml(team.name)}" onerror="this.src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80'">
                            <span class="team-acronym">${escapeHtml(team.acronym)}</span>
                        </div>
                        <div class="team-info">
                            <div>
                                <div class="team-stars-rating">${team.champion > 0 ? '⭐'.repeat(team.champion) : ''}</div>
                                <div class="team-name">${escapeHtml(team.name)}</div>
                            </div>
                            ${team.champion > 0 ? `
                                <div class="trophies-grid">
                                    <div class="trophy-item" title="Campeão"><span class="count" style="font-size: 1.1rem;">${'🏆'.repeat(team.champion)}</span></div>
                                    <div class="trophy-item" title="Vice-Campeão">🥈 <span class="count">${team.runner_up}</span></div>
                                    <div class="trophy-item" title="Terceiro Lugar">🥉 <span class="count">${team.third_place}</span></div>
                                    <div class="trophy-item" title="Semifinalista (4º)">🎖️ <span class="count">${team.semifinalist}</span></div>
                                </div>
                            ` : `
                                <div class="trophies-grid trophies-grid-3">
                                    <div class="trophy-item" title="Vice-Campeão">🥈 <span class="count">${team.runner_up}</span></div>
                                    <div class="trophy-item" title="Terceiro Lugar">🥉 <span class="count">${team.third_place}</span></div>
                                    <div class="trophy-item" title="Semifinalista (4º)">🎖️ <span class="count">${team.semifinalist}</span></div>
                                </div>
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${activeTab === 'teams' ? `
            <h3 class="section-title">🛡️ Equipes</h3>
            <p style="margin-bottom: 25px; color: var(--text-muted); line-height: 1.6;">Aqui estão registradas todas as equipes que já navegaram pelos mares da Pirata Cup ao longo de suas edições, contabilizando Títulos (com estrelas ⭐ e troféus 🏆), Vice-Campeonatos, Terceiros Lugares e Semifinais.</p>

            <div class="grid-teams">
                ${teams.map(team => `
                    <div class="team-card">
                        <div class="team-img-container">
                            <img src="${escapeHtml(team.image)}" alt="${escapeHtml(team.name)}" onerror="this.src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80'">
                            <span class="team-acronym">${escapeHtml(team.acronym)}</span>
                        </div>
                        <div class="team-info">
                            <div>
                                <div class="team-stars-rating">${team.champion > 0 ? '⭐'.repeat(team.champion) : ''}</div>
                                <div class="team-name">${escapeHtml(team.name)}</div>
                            </div>
                            ${team.champion > 0 ? `
                                <div class="trophies-grid">
                                    <div class="trophy-item" title="Campeão"><span class="count" style="font-size: 1.1rem;">${'🏆'.repeat(team.champion)}</span></div>
                                    <div class="trophy-item" title="Vice-Campeão">🥈 <span class="count">${team.runner_up}</span></div>
                                    <div class="trophy-item" title="Terceiro Lugar">🥉 <span class="count">${team.third_place}</span></div>
                                    <div class="trophy-item" title="Semifinalista (4º)">🎖️ <span class="count">${team.semifinalist}</span></div>
                                </div>
                            ` : `
                                <div class="trophies-grid trophies-grid-3">
                                    <div class="trophy-item" title="Vice-Campeão">🥈 <span class="count">${team.runner_up}</span></div>
                                    <div class="trophy-item" title="Terceiro Lugar">🥉 <span class="count">${team.third_place}</span></div>
                                    <div class="trophy-item" title="Semifinalista (4º)">🎖️ <span class="count">${team.semifinalist}</span></div>
                                </div>
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${activeTab === 'edition2027' ? `
            <div class="hero-banner" style="padding: 30px;">
                <h2 style="font-size: 5rem; color: var(--gold-primary); text-align: center; margin-bottom: 0;">EDIÇÃO 2027</h2>
            </div>

            ${adminLogged ? `
                <div class="teams-pool">
                    <h4>⚓ Banco de Siglas Disponíveis (Arraste para os confrontos)</h4>
                    <div class="pool-chips">
                        ${teams.map(t => `
                            <div class="team-chip" draggable="true" ondragstart="drag(event)" data-id="${t.id}">
                                ${escapeHtml(t.acronym)} - ${escapeHtml(t.name)}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <form action="/save-matches" method="POST">
            ` : ''}

            <h3 style="color: var(--gold-light); font-style: italic; margin-bottom: 20px; font-size: 1.4rem; text-align: center;">FASE SUÍÇA</h3>
            <div class="swiss-rounds-grid">
                ${[1, 2, 3].map(r => {
                    const roundMatches = matches.filter(m => m.round_num === r);
                    return `
                        <div class="round-column">
                            <h3>⚓ Rodada ${r}</h3>
                            ${roundMatches.map(m => {
                                const t1 = teamsMap[m.team1_id] || null;
                                const t2 = teamsMap[m.team2_id] || null;
                                let status1 = 'status-neutral';
                                let status2 = 'status-neutral';
                                if (m.status === 'finished' && t1 && t2) {
                                    let win1 = false;
                                    let win2 = false;
                                    if (m.score1 > m.score2) win1 = true;
                                    else if (m.score2 > m.score1) win2 = true;
                                    else if (m.pen1 !== null && m.pen2 !== null) {
                                        if (m.pen1 > m.pen2) win1 = true;
                                        else if (m.pen2 > m.pen1) win2 = true;
                                    }
                                    if (win1) { status1 = 'status-win'; status2 = 'status-loss'; }
                                    else if (win2) { status1 = 'status-loss'; status2 = 'status-win'; }
                                }
                                return `
                                    <div class="hltv-match-card">
                                        <div class="match-group-badge">Chave: ${escapeHtml(m.group_type)}</div>
                                        ${adminLogged ? `
                                            <input type="hidden" name="match_id" value="${m.id}">
                                            <div style="padding: 10px; background: #111827; border-bottom: 1px solid #2a374a;">
                                                <div style="font-size:0.75rem; color:var(--gold-light); margin-bottom:4px;">TIME 1:</div>
                                                <div class="dropzone-slot" ondragover="allowDrop(event)" ondrop="drop(event, 'team1_${m.id}')">
                                                    <span id="label_team1_${m.id}">${t1 ? escapeHtml(t1.acronym) : 'Arraste aqui'}</span>
                                                    <input type="hidden" name="team1_id" id="input_team1_${m.id}" value="${m.team1_id || ''}">
                                                </div>
                                                <div style="display:flex; gap:8px; margin-top:8px;">
                                                    <input type="number" name="score1" class="form-control" style="padding:6px;" value="${m.score1}" placeholder="Placar">
                                                    <input type="number" name="pen1" class="form-control" style="padding:6px;" value="${m.pen1 !== null ? m.pen1 : ''}" placeholder="Pen.">
                                                </div>
                                            </div>
                                            <div style="padding: 10px; background: #111827; border-bottom: 1px solid #2a374a;">
                                                <div style="font-size:0.75rem; color:var(--gold-light); margin-bottom:4px;">TIME 2:</div>
                                                <div class="dropzone-slot" ondragover="allowDrop(event)" ondrop="drop(event, 'team2_${m.id}')">
                                                    <span id="label_team2_${m.id}">${t2 ? escapeHtml(t2.acronym) : 'Arraste aqui'}</span>
                                                    <input type="hidden" name="team2_id" id="input_team2_${m.id}" value="${m.team2_id || ''}">
                                                </div>
                                                <div style="display:flex; gap:8px; margin-top:8px;">
                                                    <input type="number" name="score2" class="form-control" style="padding:6px;" value="${m.score2}" placeholder="Placar">
                                                    <input type="number" name="pen2" class="form-control" style="padding:6px;" value="${m.pen2 !== null ? m.pen2 : ''}" placeholder="Pen.">
                                                </div>
                                            </div>
                                            <div style="padding: 8px 10px; background: #0b0f19;">
                                                <select name="status" class="form-control" style="padding:6px; font-size:0.85rem;">
                                                    <option value="pending" ${m.status === 'pending' ? 'selected' : ''}>Pendente</option>
                                                    <option value="finished" ${m.status === 'finished' ? 'selected' : ''}>Finalizada</option>
                                                </select>
                                            </div>
                                        ` : `
                                            <div class="hltv-team-row">
                                                <div class="hltv-status-bar ${status1}"></div>
                                                <div class="hltv-team-info"><span>${t1 ? escapeHtml(t1.acronym) : 'TBD'}</span></div>
                                                <div class="hltv-team-score">${m.status === 'finished' && t1 ? (m.score1 + (m.pen1 !== null && m.pen1 !== '' ? ' (' + m.pen1 + ')' : '')) : '-'}</div>
                                            </div>
                                            <div class="hltv-team-row">
                                                <div class="hltv-status-bar ${status2}"></div>
                                                <div class="hltv-team-info"><span>${t2 ? escapeHtml(t2.acronym) : 'TBD'}</span></div>
                                                <div class="hltv-team-score">${m.status === 'finished' && t2 ? (m.score2 + (m.pen2 !== null && m.pen2 !== '' ? ' (' + m.pen2 + ')' : '')) : '-'}</div>
                                            </div>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>

            <h3 style="color: var(--gold-light); font-style: italic; margin-bottom: 20px; font-size: 1.4rem; margin-top: 50px; text-align: center;">FASE FINAL</h3>
            <div class="swiss-rounds-grid">
                ${[[4, 'Semifinais'], [5, 'Terceiro Lugar'], [6, 'Final']].map(([r, title]) => {
                    const roundMatches = matches.filter(m => m.round_num === r);
                    return `
                        <div class="round-column">
                            <h3>⚔️ ${title}</h3>
                            ${roundMatches.map(m => {
                                const t1 = teamsMap[m.team1_id] || null;
                                const t2 = teamsMap[m.team2_id] || null;
                                let status1 = 'status-neutral';
                                let status2 = 'status-neutral';
                                if (m.status === 'finished' && t1 && t2) {
                                    let win1 = false;
                                    let win2 = false;
                                    if (m.score1 > m.score2) win1 = true;
                                    else if (m.score2 > m.score1) win2 = true;
                                    else if (m.pen1 !== null && m.pen2 !== null) {
                                        if (m.pen1 > m.pen2) win1 = true;
                                        else if (m.pen2 > m.pen1) win2 = true;
                                    }
                                    if (win1) { status1 = 'status-win'; status2 = 'status-loss'; }
                                    else if (win2) { status1 = 'status-loss'; status2 = 'status-win'; }
                                }
                                return `
                                    <div class="hltv-match-card">
                                        <div class="match-group-badge">Chave: ${escapeHtml(m.group_type)}</div>
                                        ${adminLogged ? `
                                            <input type="hidden" name="match_id" value="${m.id}">
                                            <div style="padding: 10px; background: #111827; border-bottom: 1px solid #2a374a;">
                                                <div style="font-size:0.75rem; color:var(--gold-light); margin-bottom:4px;">TIME 1:</div>
                                                <div class="dropzone-slot" ondragover="allowDrop(event)" ondrop="drop(event, 'team1_${m.id}')">
                                                    <span id="label_team1_${m.id}">${t1 ? escapeHtml(t1.acronym) : 'Arraste aqui'}</span>
                                                    <input type="hidden" name="team1_id" id="input_team1_${m.id}" value="${m.team1_id || ''}">
                                                </div>
                                                <div style="display:flex; gap:8px; margin-top:8px;">
                                                    <input type="number" name="score1" class="form-control" style="padding:6px;" value="${m.score1}" placeholder="Placar">
                                                    <input type="number" name="pen1" class="form-control" style="padding:6px;" value="${m.pen1 !== null ? m.pen1 : ''}" placeholder="Pen.">
                                                </div>
                                            </div>
                                            <div style="padding: 10px; background: #111827; border-bottom: 1px solid #2a374a;">
                                                <div style="font-size:0.75rem; color:var(--gold-light); margin-bottom:4px;">TIME 2:</div>
                                                <div class="dropzone-slot" ondragover="allowDrop(event)" ondrop="drop(event, 'team2_${m.id}')">
                                                    <span id="label_team2_${m.id}">${t2 ? escapeHtml(t2.acronym) : 'Arraste aqui'}</span>
                                                    <input type="hidden" name="team2_id" id="input_team2_${m.id}" value="${m.team2_id || ''}">
                                                </div>
                                                <div style="display:flex; gap:8px; margin-top:8px;">
                                                    <input type="number" name="score2" class="form-control" style="padding:6px;" value="${m.score2}" placeholder="Placar">
                                                    <input type="number" name="pen2" class="form-control" style="padding:6px;" value="${m.pen2 !== null ? m.pen2 : ''}" placeholder="Pen.">
                                                </div>
                                            </div>
                                            <div style="padding: 8px 10px; background: #0b0f19;">
                                                <select name="status" class="form-control" style="padding:6px; font-size:0.85rem;">
                                                    <option value="pending" ${m.status === 'pending' ? 'selected' : ''}>Pendente</option>
                                                    <option value="finished" ${m.status === 'finished' ? 'selected' : ''}>Finalizada</option>
                                                </select>
                                            </div>
                                        ` : `
                                            <div class="hltv-team-row">
                                                <div class="hltv-status-bar ${status1}"></div>
                                                <div class="hltv-team-info"><span>${t1 ? escapeHtml(t1.acronym) : 'TBD'}</span></div>
                                                <div class="hltv-team-score">${m.status === 'finished' && t1 ? (m.score1 + (m.pen1 !== null && m.pen1 !== '' ? ' (' + m.pen1 + ')' : '')) : '-'}</div>
                                            </div>
                                            <div class="hltv-team-row">
                                                <div class="hltv-status-bar ${status2}"></div>
                                                <div class="hltv-team-info"><span>${t2 ? escapeHtml(t2.acronym) : 'TBD'}</span></div>
                                                <div class="hltv-team-score">${m.status === 'finished' && t2 ? (m.score2 + (m.pen2 !== null && m.pen2 !== '' ? ' (' + m.pen2 + ')' : '')) : '-'}</div>
                                            </div>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>

            ${adminLogged ? `
                <div style="text-align: center; margin-top: 30px;">
                    <button type="submit" class="btn-gold" style="font-size: 1.1rem; padding: 15px 40px;">💾 Salvar Alterações de Todas as Partidas</button>
                </div>
                </form>
            ` : ''}
        ` : ''}

        ${activeTab === 'login' ? `
            <div class="login-box">
                <h2>🔐 Acesso Administrativo</h2>
                ${loginError ? `<div class="alert alert-error">${escapeHtml(loginError)}</div>` : ''}
                <form action="/login" method="POST">
                    <div class="form-group">
                        <label for="username" style="text-align: center;">Usuário</label>
                        <input type="text" id="username" name="username" class="form-control" style="text-align: center;" required>
                    </div>
                    <div class="form-group">
                        <label for="password" style="text-align: center;">Senha</label>
                        <input type="password" id="password" name="password" class="form-control" style="text-align: center;" required>
                    </div>
                    <button type="submit" class="btn-gold" style="width: 100%; margin-top: 10px;">Entrar no Navio</button>
                </form>
            </div>
        ` : ''}

        ${activeTab === 'admin' ? `
            ${!adminLogged ? `<script>window.location.href="/?tab=login";</script>` : `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h3 class="section-title" style="margin-bottom: 0; border: none;">⚓ Painel de Gerenciamento de Equipes - ${escapeHtml(adminUser)}</h3>
                    <span class="admin-badge">⚡ Sessão Ativa</span>
                </div>

                <div style="margin-bottom: 40px; background: var(--card-bg); padding: 25px; border: 1px solid var(--card-border);">
                    <h3 style="margin-bottom: 20px; color: var(--gold-primary);">${editTeam ? '✏️ Editar Equipe' : '➕ Cadastrar Nova Equipe'}</h3>
                    <form action="/team-crud" method="POST">
                        <input type="hidden" name="crud_action" value="${editTeam ? 'update' : 'create'}">
                        ${editTeam ? `<input type="hidden" name="id" value="${editTeam.id}">` : ''}

                        <div class="form-row">
                            <div class="form-group">
                                <label>Nome do Colégio:</label>
                                <input type="text" name="name" class="form-control" required value="${editTeam ? escapeHtml(editTeam.name) : ''}" placeholder="Ex: Colégio Naval">
                            </div>
                            <div class="form-group">
                                <label>Sigla (Máx 4 chars):</label>
                                <input type="text" name="acronym" class="form-control" maxlength="4" required value="${editTeam ? escapeHtml(editTeam.acronym) : ''}" placeholder="CNAV">
                            </div>
                            <div class="form-group">
                                <label>URL da Imagem:</label>
                                <input type="url" name="image" class="form-control" required value="${editTeam ? escapeHtml(editTeam.image) : 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&auto=format&fit=crop&q=80'}" placeholder="https://...">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Histórico de Conquistas nas Edições:</label>
                            <div class="trophies-input-row">
                                <div>
                                    <label style="font-size:0.75rem; color:var(--text-muted);">🏆 Títulos (Ouro)</label>
                                    <input type="number" name="champion" min="0" class="form-control" value="${editTeam ? editTeam.champion : 0}">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem; color:var(--text-muted);">🥈 Vice</label>
                                    <input type="number" name="runner_up" min="0" class="form-control" value="${editTeam ? editTeam.runner_up : 0}">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem; color:var(--text-muted);">🥉 3º Lugar</label>
                                    <input type="number" name="third_place" min="0" class="form-control" value="${editTeam ? editTeam.third_place : 0}">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem; color:var(--text-muted);">🎖️ Semifinalista</label>
                                    <input type="number" name="semifinalist" min="0" class="form-control" value="${editTeam ? editTeam.semifinalist : 0}">
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button type="submit" class="btn-gold">${editTeam ? 'Salvar Alterações' : 'Cadastrar Equipe'}</button>
                            ${editTeam ? `<a href="/?tab=admin" class="btn-gold" style="background: transparent; border: 1px solid var(--gold-secondary); color: var(--gold-primary);">Cancelar Edição</a>` : ''}
                        </div>
                    </form>
                </div>

                <h3 class="section-title">📋 Lista de Equipes Cadastradas</h3>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Sigla</th>
                            <th>Colégio</th>
                            <th>🏆 Títulos</th>
                            <th>🥈 Vice</th>
                            <th>🥉 3º</th>
                            <th>🎖️ Semi</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teams.map(t => `
                            <tr>
                                <td><strong>${escapeHtml(t.acronym)}</strong></td>
                                <td>${escapeHtml(t.name)}</td>
                                <td>${t.champion > 0 ? '🏆'.repeat(t.champion) : '0'}</td>
                                <td>${t.runner_up}</td>
                                <td>${t.third_place}</td>
                                <td>${t.semifinalist}</td>
                                <td>
                                    <a href="/?tab=admin&edit=${t.id}" class="btn-edit">Editar</a>
                                    <form action="/team-crud" method="POST" style="display:inline;" onsubmit="event.preventDefault(); showCustomConfirm('Tem certeza que deseja excluir esta equipe?', this);">
                                        <input type="hidden" name="crud_action" value="delete">
                                        <input type="hidden" name="id" value="${t.id}">
                                        <button type="submit" class="btn-danger">Excluir</button>
                                    </form>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        ` : ''}
    </main>

    <!-- Custom Modal for Alerts/Confirms (Zero native alert/confirm rule) -->
    <div id="customModal" class="custom-modal-overlay">
        <div class="custom-modal">
            <p id="modalMessage">Mensagem de aviso</p>
            <div class="custom-modal-buttons" id="modalButtons">
                <button type="button" class="btn-gold" onclick="closeCustomModal()">OK</button>
            </div>
        </div>
    </div>

    <footer>
        <p>&copy; 2027 <span>Pirata Cup Interescolar</span>. Todos os direitos reservados. Idealizado por <span>Roni</span> & Gerenciado por <span>RH</span>.</p>
    </footer>

    <script>
        function showCustomAlert(message) {
            document.getElementById('modalMessage').innerText = message;
            document.getElementById('modalButtons').innerHTML = '<button type="button" class="btn-gold" onclick="closeCustomModal()">OK</button>';
            document.getElementById('customModal').classList.add('active');
        }

        function showCustomConfirm(message, formElement) {
            document.getElementById('modalMessage').innerText = message;
            document.getElementById('modalButtons').innerHTML = \`
                <button type="button" class="btn-gold" style="background:var(--accent-red); color:white;" onclick="executeFormSubmit()">Sim</button>
                <button type="button" class="btn-gold" style="background:transparent; border:1px solid var(--gold-secondary); color:var(--gold-primary);" onclick="closeCustomModal()">Não</button>
            \`;
            window.pendingForm = formElement;
            document.getElementById('customModal').classList.add('active');
        }

        function executeFormSubmit() {
            if (window.pendingForm) {
                window.pendingForm.submit();
            }
            closeCustomModal();
        }

        function closeCustomModal() {
            document.getElementById('customModal').classList.remove('active');
            window.pendingForm = null;
        }

        function allowDrop(ev) {
            ev.preventDefault();
        }

        function drag(ev) {
            ev.dataTransfer.setData("text/plain", ev.target.getAttribute("data-id"));
            ev.dataTransfer.setData("text/acronym", ev.target.innerText.split(' - ')[0]);
        }

        function drop(ev, slotId) {
            ev.preventDefault();
            const teamId = ev.dataTransfer.getData("text/plain");
            const teamAcronym = ev.dataTransfer.getData("text/acronym");

            const matchId = slotId.split('_')[1];
            const otherSide = slotId.startsWith('team1') ? 'team2_' + matchId : 'team1_' + matchId;
            const otherInput = document.getElementById('input_' + otherSide);

            if (otherInput && otherInput.value === teamId) {
                showCustomAlert("Uma equipe não pode jogar contra si mesma na mesma partida!");
                return;
            }

            const inputEl = document.getElementById('input_' + slotId);
            const labelEl = document.getElementById('label_' + slotId);

            if (inputEl && labelEl) {
                inputEl.value = teamId;
                labelEl.innerText = teamAcronym;
            }
        }
    </script>
</body>
</html>`;

    res.send(html);
});

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(>g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

app.listen(PORT, () => {
    console.log(\`Servidor Pirata Cup Node.js rodando na porta \${PORT}\`);
});