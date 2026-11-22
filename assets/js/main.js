(() => {
  // The basins always show the finished sheet as one still frame: no opening
  // animation, no stirring. Set to false to bring the motion back.
  const still = true;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const phone = window.matchMedia("(max-width: 760px)");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  let toastTimer;
  const say = (message) => {
    toast.textContent = message;
    toast.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 3200);
  };

  /* ---------- Placeholder links: say so instead of navigating nowhere ---------- */
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (href.startsWith("[") || href.startsWith("mailto:[")) {
      e.preventDefault();
      say("This link is still a placeholder.");
    }
  });

  /* ---------- Résumé: on a real server, check the PDF exists ---------- */
  if (location.protocol.startsWith("http")) {
    fetch("assets/resume.pdf", { method: "HEAD" })
      .then((res) => { if (!res.ok) throw new Error(res.status); })
      .catch(() => {
        $$("[data-resume]").forEach((a) => a.addEventListener("click", (e) => {
          e.preventDefault();
          say("Résumé not uploaded yet. Add it at assets/resume.pdf.");
        }));
      });
  }

  /* ---------- Masthead: border on scroll, current section, phone menu ---------- */
  const masthead = $("#masthead");
  const toggle = $("#navToggle");
  const navLinks = $$("#nav a");
  const setMenu = (open) => {
    masthead.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setMenu(!masthead.classList.contains("is-open")));
  navLinks.forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && masthead.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  const onScroll = () => masthead.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => sectionObserver.observe(s));

  /* ---------- Phone dock: appears once the opening buttons scroll away ---------- */
  const dock = $("#dock");
  const dockLinks = $$("a", dock);
  let actionsVisible = true;
  let contactVisible = false;
  const updateDock = () => {
    const show = phone.matches && !actionsVisible && !contactVisible;
    dock.classList.toggle("is-shown", show);
    dock.setAttribute("aria-hidden", String(!show));
    dockLinks.forEach((a) => a.setAttribute("tabindex", show ? "0" : "-1"));
  };
  new IntersectionObserver(([e]) => { actionsVisible = e.isIntersecting; updateDock(); }).observe($("#openingActions"));
  new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; updateDock(); }).observe($(".close__body"));
  phone.addEventListener("change", updateDock);

  /* ---------- Copy email ---------- */
  const copyBtn = $("#copyEmail");
  const copyLabel = $("#copyLabel");
  const copyStatus = $("#copyStatus");
  copyBtn.addEventListener("click", async () => {
    const email = copyBtn.dataset.email;
    if (email.startsWith("[")) { say("The email address is still a placeholder."); return; }
    try {
      await navigator.clipboard.writeText(email);
      copyBtn.classList.add("is-done");
      copyLabel.textContent = "Copied";
      copyStatus.textContent = `Copied ${email} to the clipboard.`;
      setTimeout(() => {
        copyBtn.classList.remove("is-done");
        copyLabel.textContent = "Copy";
        copyStatus.textContent = "";
      }, 2400);
    } catch {
      say(`Couldn't copy. The address is ${email}`);
    }
  });

  $("#year").textContent = new Date().getFullYear();

  /* =========================================================
     Basins. Every pond on the page (the opening, each project
     placeholder, the band above Contact) is a live basin: it plays
     its own opening when it first scrolls into view, then visitors
     can stir it with the mouse and click to add drops.

     The opening pattern is worked out the way marbling really
     behaves: a list of operations (ink and water drops, waves, the
     comb's tines) that the pattern shader undoes for every pixel,
     so each line starts crisp. Stirring runs a small fluid
     simulation over it, which softens the lines as they move.
     ========================================================= */
  const VERT = `#version 300 es
  in vec2 aPos;
  out vec2 vUv, vL, vR, vT, vB;
  uniform vec2 uTexel;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    vL = vUv - vec2(uTexel.x, 0.0); vR = vUv + vec2(uTexel.x, 0.0);
    vT = vUv + vec2(0.0, uTexel.y); vB = vUv - vec2(0.0, uTexel.y);
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;
  const frag = (body) => `#version 300 es
  precision highp float;
  in vec2 vUv, vL, vR, vT, vB;
  out vec4 outColor;
  ${body}`;

  const SHADERS = {
    // The marbled pattern. Operations are stored two texels per column:
    //   drop  a = (x, y, radius, ink)                                   b.w = 0
    //   tine  a = (x, y, dirX, dirY) b = (strength, falloff)            b.w = 1
    //   wave  a = (pushX, pushY, acrossX, acrossY) b = (amplitude, wavelength, phase)  b.w = 2
    // Walking them newest-first and undoing each one finds which drop's
    // ink ends up at this pixel.
    pattern: frag(`
      uniform sampler2D uOps;
      uniform float uCount, uAspect;
      uniform vec2 uPixel;
      float marble(vec2 uv) {
        vec2 p = vec2(uv.x * uAspect, uv.y);
        int count = int(uCount + 0.5);
        for (int k = 0; k < 256; k++) {
          int i = count - 1 - k;
          if (i < 0) break;
          vec4 a = texelFetch(uOps, ivec2(i, 0), 0);
          vec4 b = texelFetch(uOps, ivec2(i, 1), 0);
          if (b.w < 0.5) {
            vec2 d = p - a.xy;
            float d2 = dot(d, d), r2 = a.z * a.z;
            if (d2 < r2) return a.w;
            p = a.xy + d * sqrt(1.0 - r2 / d2);
          } else if (b.w < 1.5) {
            float dist = abs(dot(p - a.xy, vec2(-a.w, a.z)));
            p -= a.zw * b.x * exp(-dist / b.y);
          } else {
            p -= a.xy * b.x * sin(6.2831853 * dot(p, a.zw) / b.y + b.z);
          }
        }
        return 0.0;
      }
      void main() {
        vec2 o = uPixel * 0.25;
        float v = marble(vUv + vec2(-o.x, o.y)) + marble(vUv + vec2(o.x, -o.y))
                + marble(vUv + vec2(o.x, o.y)) + marble(vUv - o);
        outColor = vec4(v * 0.25, 0.0, 0.0, 1.0);
      }`),
    // One more drop on the existing surface, for clicks after the opening.
    drop: frag(`
      uniform sampler2D uSource;
      uniform vec2 uPoint;
      uniform float uR, uInk, uAspect;
      void main() {
        vec2 p = vUv - uPoint; p.x *= uAspect;
        float d2 = max(dot(p, p), 1e-8), r2 = uR * uR;
        vec2 q = p * sqrt(max(1.0 - r2 / d2, 0.0)); q.x /= uAspect;
        float outside = texture(uSource, uPoint + q).x;
        outColor = vec4(mix(uInk, outside, smoothstep(r2 * 0.96, r2 * 1.04, d2)), 0.0, 0.0, 1.0);
      }`),
    splat: frag(`
      uniform sampler2D uTarget;
      uniform vec2 uPoint, uForce;
      uniform float uRadius, uAspect;
      void main() {
        vec2 p = vUv - uPoint; p.x *= uAspect;
        vec2 v = texture(uTarget, vUv).xy + uForce * exp(-dot(p, p) / uRadius);
        outColor = vec4(v, 0.0, 1.0);
      }`),
    advect: frag(`
      uniform sampler2D uVelocity, uSource;
      uniform float uDt, uDissipation;
      void main() {
        vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy;
        outColor = texture(uSource, coord) / (1.0 + uDissipation * uDt);
      }`),
    divergence: frag(`
      uniform sampler2D uVelocity;
      void main() {
        float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
        float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
        outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
      }`),
    pressure: frag(`
      uniform sampler2D uPressure, uDivergence;
      void main() {
        float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
        float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
        outColor = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
      }`),
    gradient: frag(`
      uniform sampler2D uPressure, uVelocity;
      void main() {
        float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
        float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
        outColor = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
      }`),
    display: frag(`
      uniform sampler2D uDye;
      uniform vec4 uRim;      // axis (0 = x, 1 = y), start, end, top fade (fraction of height)
      uniform vec3 uPaper, uDilute, uIndigo;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float d = texture(uDye, vUv).x;
        float along = uRim.x < 0.5 ? vUv.x : vUv.y;
        d *= smoothstep(uRim.y, uRim.z, along);
        if (uRim.w > 0.0) d *= 1.0 - smoothstep(1.0 - uRim.w, 1.0 - uRim.w * 0.5, vUv.y);
        vec3 ink = mix(uDilute, uIndigo, smoothstep(0.45, 0.95, d));
        vec3 color = mix(uPaper, ink, smoothstep(0.0, 0.5, d));
        color += (hash(gl_FragCoord.xy) - 0.5) * 0.01;
        outColor = vec4(color, 1.0);
      }`),
  };
  const PAPER = [0.965, 0.969, 0.976], DILUTE = [0.333, 0.384, 0.478], INDIGO = [0.039, 0.102, 0.2];

  /* ---------- Composing a marbled sheet ---------- */
  // Seeded random numbers, so every visit lays the same sheets.
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // sites: { x, y (0–1 of the frame), n drops, r radius, core }. Drops from
  // all sites interleave, so neighbouring rings push into each other. Ink
  // drops are small and water drops wide, which leaves thin ink lines; older
  // ink is lighter and each site's newest drop is `core` (dark by default).
  const compose = ({ aspect: asp, sites, tines, waves, start = 0, dropGap = 0.022 }) => {
    const ops = [];
    let at = start;
    const counters = sites.map(() => 0);
    let remaining = sites.reduce((n, s) => n + s.n, 0);
    while (remaining > 0) {
      sites.forEach((s, k) => {
        const i = counters[k];
        if (i >= s.n) return;
        counters[k]++;
        remaining--;
        const fromEnd = s.n - 1 - i;
        const water = fromEnd % 2 === 1;
        const ink = water ? 0 : fromEnd % 4 === 0 ? (s.core ?? 1) : 0.6;
        ops.push({ at, a: [s.x * asp, s.y, water ? s.r : s.r * 0.5, ink], b: [0, 0, 0, 0] });
        at += dropGap;
      });
    }
    at += 0.25;
    const waveOp = (w, dur) => {
      const t = (w.angle || 0) * Math.PI / 180;
      return { at, dur, a: [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)], b: [w.amp, w.len, w.phase || 0, 2] };
    };
    (waves.before || []).forEach((w) => { ops.push(waveOp(w, 1.1)); at += 0.5; });
    tines.forEach((tn) => {
      const len = Math.hypot(tn.dx, tn.dy);
      ops.push({ at, dur: 0.9, a: [tn.x * asp, tn.y, tn.dx / len, tn.dy / len], b: [tn.z, tn.c, 0, 1] });
      at += 0.12;
    });
    at += 0.6;
    (waves.after || []).forEach((w) => { ops.push(waveOp(w, 1.2)); at += 0.4; });
    const end = Math.max(...ops.map((o) => o.at + (o.dur || 0)));
    return { ops, end };
  };

  // A comb: parallel tines at an angle (degrees), alternating direction,
  // each a little stronger or weaker than the last like a hand-drawn pass.
  const comb = (count, spacing, angle, z, c, seed) => {
    const rand = rng(seed);
    const t = angle * Math.PI / 180;
    const [dx, dy] = [Math.cos(t), Math.sin(t)];
    return Array.from({ length: count }, (_, k) => {
      const off = (k - (count - 1) / 2) * spacing;
      const dir = k % 2 ? -1 : 1;
      return { x: 0.5 - dy * off, y: 0.5 + dx * off, dx: dx * dir, dy: dy * dir, z: z * (0.6 + rand() * 0.8), c };
    });
  };

  // The opening sheet: overlapping sites whose rings push into one another,
  // combed on a slant. One site sits just past the name's last letter so
  // the ink reaches the name whatever its length.
  const heroSheet = (canvas) => {
    const box = canvas.getBoundingClientRect();
    const name = $("#name").getBoundingClientRect();
    if (phone.matches) {
      const baseX = Math.min(0.86, Math.max(0.55, (name.right - box.left) / box.width + 0.08));
      return {
        sites: [
          { x: 0.38, y: 0.5, n: 28, r: 0.044 }, { x: 0.74, y: 0.62, n: 24, r: 0.04, core: 0 },
          { x: 0.12, y: 0.7, n: 16, r: 0.032, core: 0.6 }, { x: 0.68, y: 0.3, n: 18, r: 0.034 },
          { x: 0.2, y: 0.24, n: 14, r: 0.03, core: 0 }, { x: baseX, y: 0.1, n: 14, r: 0.03, core: 0.6 },
        ],
        tines: comb(9, 0.075, 24, 0.05, 0.012, 7),
        waves: { before: [{ angle: 70, amp: 0.03, len: 0.7, phase: 0.6 }], after: [{ angle: -35, amp: 0.025, len: 0.55, phase: 1.3 }] },
      };
    }
    const nameX = Math.max(0.42, (name.right - box.left) / box.width + 0.07);
    const nameY = 1 - ((name.top + name.bottom) / 2 - box.top) / box.height;
    return {
      sites: [
        { x: 0.64, y: 0.54, n: 34, r: 0.05 }, { x: 0.8, y: 0.68, n: 30, r: 0.048, core: 0 },
        { x: 0.76, y: 0.34, n: 28, r: 0.045, core: 0.6 }, { x: 0.93, y: 0.5, n: 24, r: 0.042 },
        { x: nameX, y: nameY, n: 16, r: 0.034, core: 0.6 }, { x: 0.9, y: 0.82, n: 16, r: 0.036, core: 0 },
        { x: 0.6, y: 0.2, n: 14, r: 0.032 }, { x: 0.9, y: 0.16, n: 12, r: 0.03, core: 0 },
      ],
      tines: comb(12, 0.07, 18, 0.05, 0.011, 3),
      waves: { before: [{ angle: 100, amp: 0.035, len: 0.9, phase: 0.4 }], after: [{ angle: -28, amp: 0.03, len: 0.6, phase: 1.1 }] },
    };
  };

  // Each smaller pond gets its own sheet, in the same hand as the opening:
  // overlapping sites spread across the frame, combed on its own slant.
  const pondSheet = (index, wide) => {
    const rand = rng(index * 977 + 13);
    const slant = [14, -22, 30, -12][index % 4];
    const cols = wide ? 5 : 3, rows = wide ? 1 : 2;
    const sites = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        sites.push({
          x: (c + 0.5) / cols + (rand() - 0.5) * 0.12,
          y: (r + 0.5) / rows + (rand() - 0.5) * 0.18,
          n: 16 + Math.floor(rand() * 12),
          r: (wide ? 0.06 : 0.055) + rand() * 0.02,
          core: [1, 0.6, 0][Math.floor(rand() * 3)],
        });
      }
    }
    return {
      sites,
      tines: comb(wide ? 7 : 9, wide ? 0.13 : 0.11, slant, 0.06, 0.016, index + 5),
      waves: { before: [{ angle: slant + 90, amp: 0.04, len: 0.8, phase: rand() * 3 }], after: [{ angle: slant - 40, amp: 0.035, len: 0.6, phase: rand() * 3 }] },
      dropGap: 0.018,
    };
  };

  /* ---------- One basin ---------- */
  // settle: skip the opening and start from a sheet that has already been
  // stirred, its lines softened, as if someone had just run a hand through it.
  const createBasin = (canvas, { sheet, rim = () => [0, -1, -0.5, 0], inBasin = () => true, surface = canvas, settle = 0 }) => {
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const programs = {};
    try {
      const vert = compile(gl.VERTEX_SHADER, VERT);
      for (const [name, src] of Object.entries(SHADERS)) {
        const p = gl.createProgram();
        gl.attachShader(p, vert);
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src));
        gl.bindAttribLocation(p, 0, "aPos");
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        const uniforms = {};
        for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
          const { name: u } = gl.getActiveUniform(p, i);
          uniforms[u] = gl.getUniformLocation(p, u);
        }
        programs[name] = { p, u: uniforms };
      }
    } catch {
      return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const makeTarget = (w, h) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fbo, w, h };
    };
    const makeDouble = (w, h) => {
      let a = makeTarget(w, h), b = makeTarget(w, h);
      return { get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; }, w, h };
    };
    const opsTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, opsTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 256, 2, 0, gl.RGBA, gl.FLOAT, null);
    const ops = { tex: opsTex, data: new Float32Array(256 * 2 * 4) };

    // Write the operations that have started by time t, with tines and waves
    // scaled to how far through their stroke they are.
    const uploadOps = (list, t) => {
      let count = 0;
      const row = 256 * 4;
      for (const op of list) {
        if (op.at > t || count >= 256) break;
        const k = Math.min(1, (t - op.at) / (op.dur || 1e-6));
        const b = op.b.slice();
        if (op.b[3] > 0.5) b[0] *= 1 - Math.pow(1 - k, 3);
        ops.data.set(op.a, count * 4);
        ops.data.set(b, row + count * 4);
        count++;
      }
      gl.bindTexture(gl.TEXTURE_2D, ops.tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 2, gl.RGBA, gl.FLOAT, ops.data);
      return count;
    };

    const run = (name, target, uniforms) => {
      const { p, u } = programs[name];
      gl.useProgram(p);
      let unit = 0;
      for (const [key, val] of Object.entries(uniforms)) {
        const loc = u[key];
        if (loc == null) continue;
        if (val && val.tex) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, val.tex);
          gl.uniform1i(loc, unit++);
        } else if (typeof val === "number") gl.uniform1f(loc, val);
        else if (val.length === 2) gl.uniform2fv(loc, val);
        else if (val.length === 3) gl.uniform3fv(loc, val);
        else gl.uniform4fv(loc, val);
      }
      if (u.uTexel) gl.uniform2f(u.uTexel, 1 / target.w, 1 / target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.w, target.h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let dye, sim, divergence, pressure, aspect = 1, comp = null;
    let patternLive = true, clock = 0, lastTouch = -1e9, started = false;
    let visible = false, frame = 0, last = 0, odd = false;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h && dye) return false;
      canvas.width = w;
      canvas.height = h;
      if (dye && Math.abs(w / h - aspect) / aspect < 0.2) return false;
      aspect = w / h;
      dye = makeDouble(w, h);
      const simH = Math.min(200, Math.round(h / 2));
      sim = makeDouble(Math.max(8, Math.round(simH * aspect)), simH);
      divergence = makeTarget(sim.w, sim.h);
      pressure = makeDouble(sim.w, sim.h);
      comp = compose({ aspect, ...sheet() });
      return true;
    };
    const drawPattern = (t) => {
      const count = uploadOps(comp.ops, t);
      run("pattern", dye.write, { uOps: ops, uCount: count, uAspect: aspect, uPixel: [1 / dye.w, 1 / dye.h] });
      dye.swap();
    };
    const render = () => run("display", { fbo: null, w: canvas.width, h: canvas.height }, { uDye: dye.read, uRim: rim(canvas), uPaper: PAPER, uDilute: DILUTE, uIndigo: INDIGO });

    const step = (dt) => {
      run("divergence", divergence, { uVelocity: sim.read });
      for (let i = 0; i < 16; i++) {
        run("pressure", pressure.write, { uPressure: pressure.read, uDivergence: divergence });
        pressure.swap();
      }
      run("gradient", sim.write, { uPressure: pressure.read, uVelocity: sim.read });
      sim.swap();
      run("advect", sim.write, { uVelocity: sim.read, uSource: sim.read, uDt: dt, uDissipation: 1.4 });
      sim.swap();
      run("advect", dye.write, { uVelocity: sim.read, uSource: dye.read, uDt: dt, uDissipation: 0 });
      dye.swap();
    };

    const loop = (now) => {
      frame = 0;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (resize() && !patternLive) { drawPattern(Infinity); if (settle) stirred(); }
      if (patternLive) {
        clock += dt;
        odd = !odd;
        // Recompose every other frame while the opening plays; it is the
        // expensive pass, and the strokes are slow enough not to need more.
        if (odd || clock >= comp.end) drawPattern(clock);
        if (clock >= comp.end + 0.1) {
          patternLive = false;
          drawPattern(Infinity);
        }
      } else if (now - lastTouch < 6000) {
        step(dt);
      }
      render();
      // Sleep once the water is still; stirring or a drop wakes it again.
      if (visible && (patternLive || now - lastTouch < 6000)) frame = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!frame && visible && started) { last = performance.now(); frame = requestAnimationFrame(loop); }
    };

    const stirred = () => {
      const rand = rng(settle);
      for (let i = 0; i < 14; i++) {
        const angle = rand() * Math.PI * 2, force = 0.05 + rand() * 0.06;
        run("splat", sim.write, { uTarget: sim.read, uPoint: [rand(), rand()], uForce: [Math.cos(angle) * force, Math.sin(angle) * force], uRadius: 0.004 + rand() * 0.004, uAspect: aspect });
        sim.swap();
      }
      for (let i = 0; i < 50; i++) step(1 / 30);
    };

    const begin = () => {
      started = true;
      resize();
      if (settle) {
        patternLive = false;
        drawPattern(Infinity);
        stirred();
      }
      if (still) {
        // One still frame of the finished sheet; nothing moves.
        if (!settle) drawPattern(Infinity);
        patternLive = false;
        render();
        return;
      }
      if (settle) { render(); return; }
      wake();
    };
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started) begin();
      else wake();
    }, { rootMargin: "0px 0px -10% 0px" }).observe(canvas);
    addEventListener("resize", () => {
      if (!started) return;
      if (still) { if (resize()) { drawPattern(Infinity); if (settle) stirred(); } render(); return; }
      wake();
    });

    if (still) return { recompose() { if (started) { comp = compose({ aspect, ...sheet() }); drawPattern(Infinity); render(); } } };

    /* Visitors: stir with the mouse, click to drop ink */
    const toUv = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    };
    const pointer = { x: 0, y: 0, last: 0 };
    surface.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const [x, y] = toUv(e);
      const now = performance.now();
      if (!patternLive && pointer.last && now - pointer.last < 80 && inBasin(x, y)) {
        run("splat", sim.write, { uTarget: sim.read, uPoint: [x, y], uForce: [(x - pointer.x) * 1.4, (y - pointer.y) * 1.4], uRadius: 0.0012, uAspect: aspect });
        sim.swap();
        lastTouch = now;
        wake();
      }
      pointer.x = x; pointer.y = y; pointer.last = now;
    });
    surface.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      const [x, y] = toUv(e);
      if (x < 0 || x > 1 || y < 0 || y > 1 || !inBasin(x, y) || !started) return;
      if (patternLive) {
        // During the opening, a click joins the composition exactly.
        comp.ops.push({ at: clock, a: [x * aspect, y, 0.016, 1], b: [0, 0, 0, 0] }, { at: clock + 0.15, a: [x * aspect, y, 0.04, 0], b: [0, 0, 0, 0] });
        comp.ops.sort((p, q) => p.at - q.at);
        return;
      }
      [[1, 0.016], [0, 0.04], [0.6, 0.012]].forEach(([ink, r], i) => setTimeout(() => {
        run("drop", dye.write, { uSource: dye.read, uPoint: [x, y], uR: r, uInk: ink, uAspect: aspect });
        dye.swap();
        lastTouch = performance.now();
        wake();
      }, i * 140));
    });

    return {
      // Re-lay the sheet (the opening's name site moves once fonts load).
      recompose() { if (patternLive) comp = compose({ aspect, ...sheet() }); },
    };
  };

  /* ---------- The ponds on this page ---------- */
  const heroCanvas = $("#basin");
  const hero = createBasin(heroCanvas, {
    sheet: () => heroSheet(heroCanvas),
    // The still margin: ink fades toward the paper on the left (desktop) or
    // the page below the band (phone), and clears under the masthead.
    rim: (c) => {
      const top = (phone.matches ? 120 : 150) / Math.max(1, c.clientHeight);
      return phone.matches ? [1, 0.0, 0.14, top] : [0, 0.24, 0.46, top];
    },
    inBasin: (x, y) => (phone.matches ? y > 0.05 : x > 0.4),
    surface: $(".opening"),
  });
  if (!hero) {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  document.documentElement.classList.add("basin-live");
  document.fonts.ready.then(() => hero.recompose());

  // Project placeholders and the band above Contact: smaller ponds, each
  // with its own sheet, already stirred when they come into view. They
  // stand in for screenshots until real ones go in.
  $$("[data-print]").forEach((el) => {
    const index = Number(el.dataset.print);
    const pond = createBasin($("canvas", el), { sheet: () => pondSheet(index, el.classList.contains("close__print")), surface: el, settle: index + 1 });
    if (pond) el.classList.add("is-pulled");
  });
})();
