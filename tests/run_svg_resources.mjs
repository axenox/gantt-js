// >>> SR: Instance-scoped SVG resource acceptance -----------------------------
import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
].filter(Boolean);
let executable;
for (const candidate of candidates) {
    try {
        await access(candidate);
        executable = candidate;
        break;
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}
if (!executable) throw new Error('Set CHROME_PATH to a Chrome/Chromium executable.');

const profile = await mkdtemp(path.join(tmpdir(), 'riel-svg-test-'));
const server = await createServer({
    root,
    configFile: false,
    server: { host: '127.0.0.1', port: 0 },
});
server.middlewares.use('/__svg_test__', (_request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Riel Gantt SVG regression</title></head><body></body></html>');
});
let browser;
let socket;
const pending = new Map();
let next_id = 0;

/** Sends a bounded CDP request to the one browser created by this runner. */
function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
        const id = ++next_id;
        const timeout = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`CDP timeout: ${method}`));
        }, 60000);
        pending.set(id, {
            resolve(value) { clearTimeout(timeout); resolve(value); },
            reject(error) { clearTimeout(timeout); reject(error); },
        });
        socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
}

try {
    await server.listen();
    browser = spawn(executable, [
        '--headless=new',
        '--disable-gpu',
        '--disable-background-networking',
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    const endpoint = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Browser startup timed out')), 30000);
        browser.once('error', (error) => { clearTimeout(timeout); reject(error); });
        browser.once('exit', (code) => {
            clearTimeout(timeout);
            reject(new Error(`Browser exited before startup: ${code}`));
        });
        browser.stderr.on('data', (chunk) => {
            const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/);
            if (match) { clearTimeout(timeout); resolve(match[1]); }
        });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
    });
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id);
        if (message.error) request.reject(new Error(JSON.stringify(message.error)));
        else request.resolve(message.result);
    });
    const { targetId } = await send('Target.createTarget', {
        url: 'about:blank',
    });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    const loaded = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.removeEventListener('message', on_message);
            reject(new Error('Test page load timed out'));
        }, 30000);
        /** Waits for navigation commitment before evaluating module imports. */
        function on_message(event) {
            const message = JSON.parse(event.data);
            if (message.sessionId === sessionId && message.method === 'Page.loadEventFired') {
                clearTimeout(timeout);
                socket.removeEventListener('message', on_message);
                resolve();
            }
        }
        socket.addEventListener('message', on_message);
    });
    await send('Page.navigate', {
        url: `${server.resolvedUrls.local[0]}__svg_test__`,
    }, sessionId);
    await loaded;
    const result = await send('Runtime.evaluate', {
        expression: `(async () => {
            const { run_svg_resource_acceptance } = await import('/tests/svg_resources.browser.js');
            const { default: Source } = await import('/src/index.js');
            const { default: CopyA } = await import('/dist/riel-gantt.es.js?copy=a');
            const { default: CopyB } = await import('/dist/riel-gantt.es.js?copy=b');
            const source = await run_svg_resource_acceptance(Source);
            const bundled = await run_svg_resource_acceptance(CopyA, CopyB);
            return { source: source.length, bundled: bundled.length };
        })()`,
        awaitPromise: true,
        returnByValue: true,
    }, sessionId);
    if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description ||
            JSON.stringify(result.exceptionDetails));
    }
    console.log('SVG resource acceptance passed:', result.result.value);
} finally {
    for (const request of pending.values()) request.reject(new Error('Runner shutting down'));
    pending.clear();
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ id: ++next_id, method: 'Browser.close' }));
        socket.close();
    }
    if (browser && browser.exitCode === null) {
        await new Promise((resolve) => {
            const timeout = setTimeout(() => browser.kill(), 5000);
            browser.once('exit', () => { clearTimeout(timeout); resolve(); });
        });
    }
    await server.close();
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
// <<< SR: Instance-scoped SVG resource acceptance -----------------------------