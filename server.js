// 摇一摇赛跑 - 零依赖，只需要 Node.js 16+，运行: node server.js
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';   // 放在 nginx 后面时设为 127.0.0.1
const KEY = process.env.ADMIN_KEY || '1234';       // 主持人口令
const DURATION = +process.env.DURATION || 20;      // 比赛时长(秒)
const MAXRATE = 12;                                // 每人每秒最多计 12 次，防作弊

let S = { phase: 'lobby', startAt: 0, endAt: 0 };  // lobby -> countdown -> running -> finished
const players = new Map(), clients = new Set();
let seq = 0, num = 0;
const EMOJI = ['🐯','🐼','🐶','🐱','🐰','🐸','🦁','🐵','🐧','🐮','🐷','🐔'];

const ranking = () => [...players.values()].sort((a, b) => b.count - a.count || a.t - b.t);
function snap() {
  const now = Date.now(), r = ranking(), fin = S.phase === 'finished';
  return {
    phase: S.phase, duration: DURATION, n: players.size,
    cd: S.phase === 'countdown' ? Math.max(1, Math.ceil((S.startAt - now) / 1000)) : 0,
    left: S.phase === 'running' ? Math.max(0, (S.endAt - now) / 1000) : fin ? 0 : DURATION,
    recent: [...players.values()].slice(-12).map(p => p.name),
    top: r.slice(0, 10).map(p => ({ name: p.name, count: p.count, tail: fin ? p.tail : undefined })),
  };
}
setInterval(() => {
  const now = Date.now();
  if (S.phase === 'countdown' && now >= S.startAt) { S.phase = 'running'; S.endAt = now + DURATION * 1000; }
  else if (S.phase === 'running' && now >= S.endAt) S.phase = 'finished';
  if (!clients.size) return;
  const msg = `data: ${JSON.stringify(snap())}\n\n`;
  for (const c of clients) c.write(msg);
}, 200);

const body = req => new Promise(ok => { let b = ''; req.on('data', d => b += d); req.on('end', () => { try { ok(JSON.parse(b)); } catch { ok({}); } }); });
const json = (res, o, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
const page = (res, f) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(fs.readFileSync(path.join(__dirname, f))); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname, q = u.searchParams;
  if (p === '/') return page(res, 'screen.html');
  if (p === '/play' || p === '/play/') return page(res, 'play.html');
  if (p === '/qr.js') { res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' }); return res.end(fs.readFileSync(path.join(__dirname, 'qr.js'))); }
  if (p === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`data: ${JSON.stringify(snap())}\n\n`);
    clients.add(res); req.on('close', () => clients.delete(res)); return;
  }
  if (p === '/info') {
    const ips = Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).map(i => `http://${i.address}:${PORT}/play`);
    return json(res, { urls: ips });
  }
  if (p === '/join' && req.method === 'POST') {   // 扫码即加入：无需输入，自动分配号码
    const d = await body(req), id = String(d.cid || '').slice(0, 64);
    if (!id) return json(res, { err: 'bad request' }, 400);
    if (!players.has(id)) {
      const n = ++num;
      players.set(id, { id, num: n, name: EMOJI[(n - 1) % EMOJI.length] + n + '号', tail: '', count: 0, t: ++seq });
    }
    const pl = players.get(id);
    return json(res, { id, name: pl.name, num: pl.num });
  }
  if (p === '/shake' && req.method === 'POST') {
    const d = await body(req), pl = players.get(d.id);
    if (!pl) return json(res, { err: 'unknown' }, 404);
    if (S.phase === 'running') {
      const max = Math.ceil((Date.now() - (S.endAt - DURATION * 1000)) / 1000 * MAXRATE) + 5;
      const c = Math.min(d.count | 0, max);
      if (c > pl.count) { pl.count = c; pl.t = Date.now(); }
    }
    return json(res, { count: pl.count });
  }
  if (p === '/me') {
    const r = ranking(), i = r.findIndex(x => x.id === q.get('id'));
    return json(res, { rank: i + 1, total: r.length, count: i < 0 ? 0 : r[i].count });
  }
  if (p.startsWith('/admin/') || p === '/results.csv') {
    if (q.get('key') !== KEY) return json(res, { err: '口令错误' }, 403);
    if (p === '/admin/start' && S.phase === 'lobby') { S.phase = 'countdown'; S.startAt = Date.now() + 3000; }
    if (p === '/admin/reset') { S.phase = 'lobby'; if (q.get('clear')) { players.clear(); num = 0; } else players.forEach(x => { x.count = 0; }); }
    if (p === '/results.csv') {
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename=results.csv' });
      return res.end('\ufeff名次,号码,次数\n' + ranking().map((x, i) => `${i + 1},${x.name},${x.count}`).join('\n'));
    }
    return json(res, { ok: true, phase: S.phase });
  }
  res.writeHead(404); res.end('Not found');
}).listen(PORT, HOST, () => {
  console.log(`\n大屏幕(主持人)打开:  http://localhost:${PORT}/?key=${KEY}`);
  console.log('观众手机打开:');
  Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).forEach(i => console.log(`  http://${i.address}:${PORT}/play`));
});
