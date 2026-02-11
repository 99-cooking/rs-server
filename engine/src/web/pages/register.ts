/**
 * Registration and landing page for 99 Cooking's RS Server
 */

import { db } from '#/db/query.js';
import bcrypt from 'bcrypt';
import World from '#/engine/World.js';

const SERVER_NAME = '99 Cooking RS';
const GITHUB_URL = 'https://github.com/99-cooking/rs-sdk';

// Shared CSS styles
const SITE_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Segoe UI', Arial, sans-serif;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        min-height: 100vh;
        color: #fff;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header {
        text-align: center;
        padding: 40px 20px;
        background: rgba(0,0,0,0.3);
        margin-bottom: 40px;
    }
    header h1 {
        font-size: 3em;
        color: #ffd700;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        margin-bottom: 10px;
    }
    header p { color: #ccc; font-size: 1.2em; }
    .btn {
        display: inline-block;
        padding: 15px 40px;
        background: linear-gradient(180deg, #4a9eff 0%, #0066cc 100%);
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-size: 1.2em;
        font-weight: bold;
        border: none;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(74, 158, 255, 0.4);
    }
    .btn-play {
        background: linear-gradient(180deg, #4aff4a 0%, #00cc00 100%);
        font-size: 1.5em;
        padding: 20px 60px;
    }
    .card {
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 30px;
        margin-bottom: 30px;
        backdrop-filter: blur(10px);
    }
    .card h2 { color: #ffd700; margin-bottom: 20px; }
    .card p { line-height: 1.6; margin-bottom: 15px; }
    .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 40px 0;
    }
    .feature {
        background: rgba(255,255,255,0.05);
        padding: 25px;
        border-radius: 10px;
        text-align: center;
    }
    .feature h3 { color: #4aff4a; margin-bottom: 10px; }
    form { max-width: 400px; margin: 0 auto; }
    .form-group { margin-bottom: 20px; }
    label {
        display: block;
        margin-bottom: 8px;
        color: #ffd700;
        font-weight: bold;
    }
    input[type="text"], input[type="password"] {
        width: 100%;
        padding: 12px 15px;
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        background: rgba(0,0,0,0.3);
        color: white;
        font-size: 1em;
    }
    input:focus {
        outline: none;
        border-color: #4a9eff;
    }
    .error { color: #ff4a4a; margin-bottom: 15px; text-align: center; }
    .success { color: #4aff4a; margin-bottom: 15px; text-align: center; }
    .nav {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-bottom: 40px;
        flex-wrap: wrap;
    }
    .nav a {
        color: #ccc;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 5px;
        transition: background 0.2s;
    }
    .nav a:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin: 30px 0;
        flex-wrap: wrap;
    }
    .stat { text-align: center; }
    .stat-value { font-size: 2.5em; color: #ffd700; font-weight: bold; }
    .stat-label { color: #999; }
    footer {
        text-align: center;
        padding: 40px;
        color: #666;
    }
    footer a { color: #4a9eff; }
    pre {
        background: #000;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        font-family: monospace;
    }
    a { color: #4a9eff; }
`;

function layout(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${SERVER_NAME}</title>
    <style>${SITE_STYLES}</style>
</head>
<body>
    <header>
        <h1>🦞 ${SERVER_NAME}</h1>
        <p>A RuneScape 2004 Private Server</p>
    </header>
    <nav class="nav">
        <a href="/">Home</a>
        <a href="/register">Register</a>
        <a href="/hiscores">Hiscores</a>
        <a href="/rs2.cgi">Play Now</a>
    </nav>
    <div class="container">
        ${content}
    </div>
    <footer>
        <p>Powered by <a href="https://github.com/LostCityRS/Server">LostCity</a> | 
           SDK by <a href="https://github.com/MaxBittker/rs-sdk">rs-sdk</a> |
           Hosted by <a href="https://github.com/99-cooking">99 Cooking</a></p>
    </footer>
</body>
</html>`;
}

async function getStats(): Promise<{ players: number; accounts: number }> {
    try {
        const result = await db.selectFrom('account')
            .select(eb => eb.fn.countAll().as('count'))
            .executeTakeFirst();
        return {
            players: World.getTotalPlayers(),
            accounts: Number(result?.count || 0)
        };
    } catch (e) {
        return { players: 0, accounts: 0 };
    }
}

export async function handleHomePage(url: URL): Promise<Response | null> {
    if (url.pathname !== '/' && url.pathname !== '/home' && url.pathname !== '/home/') {
        return null;
    }
    
    const stats = await getStats();
    
    const content = `
    <div style="text-align: center; margin-bottom: 40px;">
        <a href="/rs2.cgi" class="btn btn-play">▶ Play Now</a>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${stats.players}</div>
            <div class="stat-label">Players Online</div>
        </div>
        <div class="stat">
            <div class="stat-value">${stats.accounts}</div>
            <div class="stat-label">Registered Players</div>
        </div>
    </div>
    
    <div class="features">
        <div class="feature">
            <h3>⚡ 25x XP Rate</h3>
            <p>Level up faster than ever. Perfect for bot training experiments.</p>
        </div>
        <div class="feature">
            <h3>🤖 Bot-Friendly</h3>
            <p>Full SDK support for automation. Train your AI agents!</p>
        </div>
        <div class="feature">
            <h3>🎮 2004 Authentic</h3>
            <p>Experience RuneScape as it was in 2004. Nostalgia included.</p>
        </div>
        <div class="feature">
            <h3>👥 Members Content</h3>
            <p>All members areas and skills unlocked for everyone.</p>
        </div>
    </div>
    
    <div class="card">
        <h2>🚀 Quick Start</h2>
        <p>1. <a href="/register">Register an account</a> or create one when you first log in</p>
        <p>2. <a href="/rs2.cgi">Launch the game client</a></p>
        <p>3. Enter your username and password</p>
        <p>4. Start your adventure!</p>
    </div>
    
    <div class="card">
        <h2>🤖 For Bot Developers</h2>
        <p>Clone the SDK and start automating:</p>
        <pre>git clone ${GITHUB_URL}.git
cd rs-sdk && bun install
bun scripts/create-bot.ts mybot
bun bots/mybot/script.ts</pre>
        <p style="margin-top: 15px;">
            <a href="${GITHUB_URL}">View SDK Documentation →</a>
        </p>
    </div>
    `;
    
    return new Response(layout('Home', content), {
        headers: { 'Content-Type': 'text/html' }
    });
}

export async function handleRegisterPage(req: Request, url: URL): Promise<Response | null> {
    if (url.pathname !== '/register' && url.pathname !== '/register/') {
        return null;
    }
    
    let error = '';
    let success = '';
    
    if (req.method === 'POST') {
        try {
            const formData = await req.formData();
            const username = formData.get('username')?.toString()?.trim() || '';
            const password = formData.get('password')?.toString() || '';
            const confirm = formData.get('confirm')?.toString() || '';
            
            // Validation
            if (!username || username.length < 1 || username.length > 12) {
                error = 'Username must be 1-12 characters';
            } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                error = 'Username can only contain letters, numbers, and underscores';
            } else if (!password || password.length < 4) {
                error = 'Password must be at least 4 characters';
            } else if (password !== confirm) {
                error = 'Passwords do not match';
            } else {
                // Check if username exists
                const existing = await db.selectFrom('account')
                    .select('id')
                    .where('username', '=', username.toLowerCase())
                    .executeTakeFirst();
                
                if (existing) {
                    error = 'Username already taken';
                } else {
                    // Create account
                    const hashedPassword = await bcrypt.hash(password, 10);
                    await db.insertInto('account')
                        .values({
                            username: username.toLowerCase(),
                            password: hashedPassword
                        })
                        .execute();
                    success = `Account "${username}" created successfully! You can now play.`;
                }
            }
        } catch (e: any) {
            console.error('Registration error:', e);
            if (e?.message?.includes('UNIQUE')) {
                error = 'Username already taken';
            } else {
                error = 'Registration failed. Please try again.';
            }
        }
    }
    
    const content = `
    <div class="card" style="max-width: 500px; margin: 0 auto;">
        <h2>📝 Create Account</h2>
        ${error ? `<p class="error">❌ ${error}</p>` : ''}
        ${success ? `<p class="success">✅ ${success}</p>` : ''}
        
        <form method="POST" action="/register">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required 
                       minlength="1" maxlength="12" pattern="[a-zA-Z0-9_]+"
                       placeholder="Enter username (1-12 chars)" autocomplete="username">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required
                       minlength="4" placeholder="Enter password (min 4 chars)" autocomplete="new-password">
            </div>
            <div class="form-group">
                <label for="confirm">Confirm Password</label>
                <input type="password" id="confirm" name="confirm" required
                       placeholder="Confirm your password" autocomplete="new-password">
            </div>
            <button type="submit" class="btn" style="width: 100%;">Create Account</button>
        </form>
        
        <p style="text-align: center; margin-top: 20px; color: #999;">
            Already have an account? <a href="/rs2.cgi">Play Now</a>
        </p>
    </div>
    `;
    
    return new Response(layout('Register', content), {
        headers: { 'Content-Type': 'text/html' }
    });
}
