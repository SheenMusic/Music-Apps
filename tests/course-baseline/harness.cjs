const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const BASE = 'd4936c7ddbae8dfbd963c6880b1be983f2d96110';
const COURSES = {
  ET05: 'ET-Intervals/05-2nd-d7wzes/index.html',
  ET06: 'ET-Intervals/06-2nd-9g6ymn/index.html',
  MT03: 'MT-Intervals/lesson03/index.html'
};
const sha = text => createHash('sha256').update(text).digest('hex');
const original = file => execFileSync('git', ['show', `${BASE}:${file}`], {cwd: ROOT, maxBuffer: 4 * 1024 * 1024});
const scripts = html => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m => !/\bsrc\s*=/.test(m[1])).map(m => m[2]);
// Remove only style blocks/stylesheet links. DOM, text, event attributes and JS stay protected.
const withoutCSS = html => html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '').replace(/>\s+</g, '><').trim();
async function serve() {
  const cache = new Map();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const reference = url.pathname.startsWith('/__baseline__/');
    const file = decodeURIComponent(url.pathname.replace(reference ? '/__baseline__/' : /^\//, ''));
    if (!file || file.split('/').includes('..')) {res.writeHead(404).end(); return;}
    try {
      const body = reference ? (cache.get(file) || original(file)) : fs.readFileSync(path.join(ROOT, file));
      if (reference) cache.set(file, body);
      const ext = path.extname(file);
      res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8'})[ext] || 'application/octet-stream');
      res.end(body);
    } catch {res.writeHead(404).end();}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve))};
}
// Test-only fake audio devices and clock. Original course functions remain untouched.
function installMocks() {
  const RealDate = Date;
  window.__clock = 1000000;
  window.Date = class extends RealDate {
    constructor(...args) {super(...(args.length ? args : [window.__clock]));}
    static now() {return window.__clock;}
  };
  Math.random = () => window.__random ?? .5;
  window.__audio = {oscillators: [], streams: 0, stoppedTracks: 0, clipboard: '', alerts: [], timers: []};
  window.__mockPitch = 0;
  let frame = 0;
  window.requestAnimationFrame = () => ++frame;
  window.cancelAnimationFrame = () => {};
  window.setTimeout = (callback, delay) => {window.__audio.timers.push({callback, delay}); return window.__audio.timers.length;};
  window.clearTimeout = () => {};
  window.alert = message => window.__audio.alerts.push(message);
  window.confirm = () => true;
  const param = () => ({value: 0, setValueAtTime(v) {this.value=v;}, setTargetAtTime(v) {this.target=v;}, linearRampToValueAtTime(v) {this.value=v;}, exponentialRampToValueAtTime(v) {this.value=v;}});
  const node = () => ({connect() {}, disconnect() {}, gain: param(), frequency: param(), start() {this.started=true;}, stop() {this.stopped=true;}});
  window.AudioContext = window.webkitAudioContext = class {
    constructor() {this.state='running'; this.currentTime=0; this.sampleRate=48000; this.destination={};}
    resume() {this.state='running'; return Promise.resolve();}
    createOscillator() {const n=node(); window.__audio.oscillators.push(n); return n;}
    createGain() {return node();}
    createBiquadFilter() {return node();}
    createMediaStreamSource() {return node();}
    createAnalyser() {return {fftSize:2048, getFloatTimeDomainData(buf) {
      for (let i=0;i<buf.length;i++) buf[i] = window.__mockPitch ? .2*Math.sin(2*Math.PI*window.__mockPitch*i/48000) : 0;
    }};}
  };
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {configurable:true, value: async () => {
    window.__audio.streams++;
    return {getTracks: () => [{stop() {window.__audio.stoppedTracks++;}}]};
  }});
  Object.defineProperty(navigator, 'clipboard', {configurable:true, value: {writeText: async text => {window.__audio.clipboard=text;}}});
  document.execCommand = () => true;
}
async function open(browser, url, course, options = {}) {
  const context = await browser.newContext({viewport: options.viewport || {width:1280,height:900}, colorScheme: options.theme || 'light', reducedMotion:'reduce'});
  const errors = [], cssFailures = [];
  // Do not send analytics or external requests during tests.
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  if (options.mocks !== false) await context.addInitScript(installMocks);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {if (response.url().endsWith('.css') && response.status() !== 200) cssFailures.push(response.url());});
  const response = await page.goto(`${url}/${options.reference ? '__baseline__/' : ''}${COURSES[course]}`, {waitUntil:'load'});
  if (response.status() !== 200) throw new Error(`Entry failed: ${response.status()}`);
  return {page, context, errors, cssFailures};
}
async function solveMT(page) {
  await page.locator('#startPracticeBtn').click();
  const questions = await page.evaluate(() => practiceData.questions);
  for (const q of questions) {
    await page.locator('#optionsGrid .option-btn').evaluateAll((buttons, answers) => {
      for (const b of buttons) if (answers.includes(b.dataset.value)) b.click();
    }, [...q.correctAnswer].reverse());
    await page.locator('#confirmBtn').click();
    await page.locator('#nextBtn').click();
  }
}
async function passET(page, course, count = 1) {
  await page.evaluate(({course,count}) => {
    const runPitch = midi => {window.__mockPitch=midiToFreq(midi); for (let frame=0;frame<8;frame++) processAudio(); window.__clock+=250; processAudio();};
    if (!practiceStartTime) practiceStartTime=Date.now();
    for (let i=0;i<count;i++) {
      if (i) generateQuestion();
      if (course==='ET05') {
        isListening=true;
        // The analyser is initialized by startMic in the caller.
        runPitch(currentTargetMidi);
      } else {
        isListening=true; activeCaptureTarget='low'; runPitch(currentLowMidi);
        isListening=true; activeCaptureTarget='high'; runPitch(currentHighMidi);
      }
    }
  }, {course,count});
}
module.exports = {ROOT,BASE,COURSES,sha,original,scripts,withoutCSS,serve,installMocks,open,solveMT,passET};
