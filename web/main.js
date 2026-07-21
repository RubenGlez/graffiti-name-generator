import blocks from "../data/blocks.json";
import patterns from "../data/patterns.json";
import clusters from "../data/clusters.json";
import dictionary from "../data/dictionary-en.txt";
import blocklist from "../data/blocklist.txt";
import oldSchool from "../data/styles/old-school.json";
import modern from "../data/styles/modern.json";
import wildstyle from "../data/styles/wildstyle.json";
import tech from "../data/styles/tech.json";
import minimal from "../data/styles/minimal.json";
import hardcore from "../data/styles/hardcore.json";
import { generate, setDataSource, STYLE_IDS } from "../dist/browser.js";

/* ---------- data: bundled at build time, no network, no server ---------- */

setDataSource(() => ({
  blocks,
  patterns,
  clusters,
  dictionary,
  blocklist,
  styles: {
    "old-school": oldSchool,
    modern,
    wildstyle,
    tech,
    minimal,
    hardcore,
  },
}));

/* ---------- spray colors per style (classic cap colors) ---------- */

const SPRAY_COLORS = {
  "old-school": "#e2452e",
  modern: "#3d7bff",
  wildstyle: "#a94bff",
  tech: "#00b8a0",
  minimal: "#f2f0ea",
  hardcore: "#e62e7b",
};
const DEFAULT_COLOR = "#e2452e";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/* ---------- DOM ---------- */

const form = document.getElementById("form");
const styleSelect = document.getElementById("style");
const errorEl = document.getElementById("error");
const metaEl = document.getElementById("meta");
const chipsEl = document.getElementById("chips");
const toastEl = document.getElementById("toast");
const liveEl = document.getElementById("live");
const canvas = document.getElementById("wall");
const fallbackEl = document.getElementById("fallback");

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- WebGL spray-paint wall ---------- */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_reveal;
uniform float u_drip;
uniform float u_motion;
uniform vec3 u_color;
uniform sampler2D u_tex;

float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 q) {
  vec2 i = floor(q), f = fract(q);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 q) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(q); q *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0);

  /* concrete wall */
  float nBig = fbm(p * 2.6);
  float nMid = fbm(p * 11.0 + 4.7);
  float nFine = noise(p * 260.0);
  vec3 wall = mix(vec3(0.795, 0.785, 0.755), vec3(0.685, 0.68, 0.66), nBig);
  wall = mix(wall, wall * 0.93, smoothstep(0.55, 0.85, nMid));
  wall += (nFine - 0.5) * 0.05;
  float stain = fbm(p * 1.3 + 9.1);
  wall *= 1.0 - smoothstep(0.6, 0.95, stain) * 0.09;
  float light = 1.0 - distance(uv, vec2(0.45, 0.68)) * 0.35
              + 0.02 * sin(u_time * 0.13) * u_motion;
  wall *= mix(0.88, 1.07, light);

  /* name mask (R) and drip growth gradient (G) */
  vec4 t = texture2D(u_tex, uv);
  float m = t.r;

  /* overspray halo: cheap 12-tap blur of the mask */
  vec2 o1 = 10.0 / u_res;
  vec2 o2 = 24.0 / u_res;
  float halo =
    texture2D(u_tex, uv + vec2( o1.x, 0.0)).r + texture2D(u_tex, uv + vec2(-o1.x, 0.0)).r +
    texture2D(u_tex, uv + vec2(0.0,  o1.y)).r + texture2D(u_tex, uv + vec2(0.0, -o1.y)).r +
    texture2D(u_tex, uv + o1 * 0.7).r + texture2D(u_tex, uv - o1 * 0.7).r +
    texture2D(u_tex, uv + vec2(o1.x, -o1.y) * 0.7).r + texture2D(u_tex, uv + vec2(-o1.x, o1.y) * 0.7).r +
    texture2D(u_tex, uv + vec2( o2.x, 0.0)).r + texture2D(u_tex, uv + vec2(-o2.x, 0.0)).r +
    texture2D(u_tex, uv + vec2(0.0,  o2.y)).r + texture2D(u_tex, uv + vec2(0.0, -o2.y)).r;
  halo /= 12.0;

  /* spray sweep: noisy left-to-right reveal */
  float jit = (noise(vec2(uv.y * 22.0, 3.7)) - 0.5) * 0.15;
  float sweep = u_reveal * 1.3 - 0.15;
  float sw = 1.0 - smoothstep(sweep - 0.02, sweep + 0.06, uv.x + jit);

  /* rough spray edges on the letters */
  float mth = 0.5 + (noise(p * 95.0) - 0.5) * 0.3;
  float ink = smoothstep(mth - 0.12, mth + 0.12, m);
  float over = smoothstep(0.06, 0.55, halo) * (1.0 - ink);
  float speck = smoothstep(0.86, 0.99, noise(p * 150.0)) * over;

  /* drips grow downward as u_drip rises */
  float drip = smoothstep(1.0 - u_drip, 1.0 - u_drip + 0.08, t.g) * step(0.001, u_drip);

  float alpha = clamp(ink + over * 0.28 + speck * 0.5 + drip * 0.9, 0.0, 1.0) * sw;
  alpha *= 0.86 + 0.14 * noise(p * 130.0);

  vec3 paint = u_color * (0.9 + 0.2 * nMid);
  vec3 col = mix(wall, paint, alpha);

  /* film grain + vignette */
  col += (hash(uv * (u_time * u_motion + 13.0)) - 0.5) * 0.03;
  float vig = smoothstep(1.25, 0.4, distance(uv, vec2(0.5)));
  col *= mix(0.92, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

const gl = canvas.getContext("webgl", { antialias: false });
let uniforms = null;

function initGL() {
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  uniforms = {
    res: gl.getUniformLocation(prog, "u_res"),
    time: gl.getUniformLocation(prog, "u_time"),
    reveal: gl.getUniformLocation(prog, "u_reveal"),
    drip: gl.getUniformLocation(prog, "u_drip"),
    motion: gl.getUniformLocation(prog, "u_motion"),
    color: gl.getUniformLocation(prog, "u_color"),
  };
  gl.uniform1f(uniforms.motion, reducedMotion ? 0.0 : 1.0);
}

/* ---------- name texture: sharp tag in R, drip gradients in G ---------- */

const texCanvas = document.createElement("canvas");
let currentName = "";

function drawNameTexture(name) {
  const W = canvas.width,
    H = canvas.height;
  if (!W || !H) return;
  texCanvas.width = W;
  texCanvas.height = H;
  const ctx = texCanvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (!name) {
    upload();
    return;
  }

  let size = H * 0.42;
  ctx.font = `${size}px "Sedgwick Ave Display", "Arial Black", sans-serif`;
  const width = ctx.measureText(name).width;
  const maxW = W * 0.84;
  if (width > maxW) {
    size *= maxW / width;
    ctx.font = `${size}px "Sedgwick Ave Display", "Arial Black", sans-serif`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ff0000";
  ctx.fillText(name, W / 2, H * 0.44);

  drawDrips(ctx, W, H);
  upload();
}

function drawDrips(ctx, W, H) {
  // find the bottom-most painted pixel per column, then hang drips off a few
  const img = ctx.getImageData(0, 0, W, H).data;
  const candidates = [];
  for (let x = 4; x < W; x += 6) {
    for (let y = H - 1; y >= 0; y--) {
      if (img[(y * W + x) * 4] > 120) {
        candidates.push({ x, y });
        break;
      }
    }
  }
  if (!candidates.length) return;

  candidates.sort(() => Math.random() - 0.5);
  const target = Math.min(14, Math.max(6, Math.round(candidates.length / 14)));
  const picked = [];
  for (const c of candidates) {
    if (picked.length >= target) break;
    if (picked.every((p) => Math.abs(p.x - c.x) > W * 0.02)) picked.push(c);
  }

  ctx.globalCompositeOperation = "lighter";
  for (const { x, y } of picked) {
    const len = H * (0.04 + Math.random() * 0.14);
    const w = 2 + Math.random() * 4;
    const grad = ctx.createLinearGradient(0, y, 0, y + len);
    grad.addColorStop(0, "rgba(0,255,0,0.95)");
    grad.addColorStop(1, "rgba(0,255,0,0.12)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 2);
    ctx.lineTo(x - w * 0.16, y + len);
    ctx.lineTo(x + w * 0.16, y + len);
    ctx.lineTo(x + w / 2, y - 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function upload() {
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    texCanvas,
  );
}

/* ---------- render loop ---------- */

let sprayStart = -1;
let sprayColor = hexToRgb(DEFAULT_COLOR);

const easeOut = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

function frame(now) {
  const t = now / 1000;
  let reveal = 1,
    drip = 1;
  if (!reducedMotion && sprayStart >= 0) {
    const el = now - sprayStart;
    reveal = easeOut(el / 1200);
    drip = easeOut((el - 500) / 3000);
  }
  gl.uniform2f(uniforms.res, canvas.width, canvas.height);
  gl.uniform1f(uniforms.time, t);
  gl.uniform1f(uniforms.reveal, reveal);
  gl.uniform1f(uniforms.drip, drip);
  gl.uniform3f(uniforms.color, sprayColor[0], sprayColor[1], sprayColor[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  requestAnimationFrame(frame);
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (w === canvas.width && h === canvas.height) return;
  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);
  drawNameTexture(currentName);
}

function spray(name) {
  currentName = name;
  liveEl.textContent = name;
  if (!gl) {
    fallbackEl.textContent = name;
    return;
  }
  drawNameTexture(name);
  sprayStart = performance.now();
}

/* ---------- UI wiring ---------- */

function setSprayColor(styleId) {
  const hex = SPRAY_COLORS[styleId] ?? DEFAULT_COLOR;
  sprayColor = hexToRgb(hex);
  document.documentElement.style.setProperty("--spray", hex);
}

function loadStyles() {
  styleSelect.innerHTML = STYLE_IDS.map(
    (id) => `<option value="${id}">${id.replace(/-/g, " ")}</option>`,
  ).join("");
  setSprayColor(styleSelect.value);
}

styleSelect.addEventListener("change", () => setSprayColor(styleSelect.value));

function formToOptions(form) {
  const data = new FormData(form);
  const options = { style: data.get("style") };

  for (const key of ["count", "minLength", "maxLength", "seed"]) {
    const value = data.get(key);
    if (value) options[key] = Number(value);
  }

  for (const key of [
    "preferredLetters",
    "forbiddenLetters",
    "prefix",
    "suffix",
  ]) {
    const value = data.get(key);
    if (value) options[key] = value;
  }

  options.pronounceable = data.get("pronounceable") === "on";
  return options;
}

function exhaustionMessage(options) {
  const consonant = /[BCDFGHJKLMNPQRSTVWXYZ]/i;
  const hasConsonantBoundary =
    options.pronounceable &&
    (consonant.test((options.prefix ?? "").at(-1) ?? "") ||
      consonant.test((options.suffix ?? "")[0] ?? ""));

  if (hasConsonantBoundary) {
    return "With Pronounceable enabled, a consonant-ending prefix or consonant-starting suffix must form an approved cluster with the generated name. Try an affix with a vowel at that boundary, or turn off Pronounceable.";
  }

  return "Try changing the style, length, or other filters.";
}

function renderResults(result, options) {
  const names = [...result.names].sort((a, b) => b.score - a.score);
  chipsEl.innerHTML = "";
  names.forEach((n, i) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (i === 0 ? " active" : "");
    chip.type = "button";
    chip.innerHTML = `${n.name} <span class="score">${n.score}</span>`;
    chip.title = `pattern ${n.pattern}`;
    chip.addEventListener("click", () => {
      chipsEl.querySelector(".active")?.classList.remove("active");
      chip.classList.add("active");
      spray(n.name);
    });
    chipsEl.appendChild(chip);
  });

  const m = result.meta;
  metaEl.textContent =
    `${m.style} · seed ${m.seed} · ${m.attempts} attempts · ${m.rejected} rejected` +
    (m.exhausted ? " · pool exhausted" : "");

  if (m.exhausted) {
    const summary = names.length
      ? `Only generated ${names.length} of ${m.requested} names.`
      : "No names matched these settings.";
    errorEl.textContent = `${summary} ${exhaustionMessage(options)}`;
  }

  if (names.length) spray(names[0].name);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorEl.textContent = "";

  const options = formToOptions(form);
  try {
    renderResults(generate(options), options);
  } catch (error) {
    errorEl.textContent =
      error instanceof Error ? error.message : String(error);
  }
});

/* click the wall to copy the current name */
let toastTimer;
canvas.addEventListener("click", async () => {
  if (!currentName) return;
  try {
    await navigator.clipboard.writeText(currentName);
    toastEl.textContent = `${currentName} copied`;
  } catch {
    toastEl.textContent = currentName;
  }
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1400);
});

/* ---------- boot ---------- */

async function boot() {
  if (!gl) {
    canvas.hidden = true;
    fallbackEl.hidden = false;
  } else {
    initGL();
    resize();
    new ResizeObserver(resize).observe(canvas);
    requestAnimationFrame(frame);
  }

  loadStyles();
  await document.fonts.load('400 200px "Sedgwick Ave Display"').catch(() => {});

  form.requestSubmit();
}

boot();
