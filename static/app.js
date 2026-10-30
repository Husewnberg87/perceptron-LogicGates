/* Perceptron visualizer: replays the steps recorded by the backend (Python or the JS port). */
(function () {
  const $ = id => document.getElementById(id);
  const fmt = v => String(Number(Number(v).toFixed(4)));
  const sg = v => (v < 0 ? `(${fmt(v)})` : fmt(v));
  const sgn = v => (v < 0 ? `&minus;${fmt(-v)}` : fmt(v));
  const INP = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const step = z => (z >= 0 ? 1 : 0);
  let res = null, k = 0, timer = null;

  /* ---------- state at step k ---------- */
  function stateAt() {
    return res.units.map((_, j) => {
      for (let i = k - 1; i >= 0; i--) if (res.steps[i].u === j) return { w: res.steps[i].w, b: res.steps[i].b };
      return { w: res.init.slice(0, 2), b: res.init[2] };
    });
  }
  const curStep = () => (k > 0 ? res.steps[k - 1] : null);
  const curUnit = () => (k > 0 ? res.steps[k - 1].u : 0);
  const out = (s, x) => step(s.w[0] * x[0] + s.w[1] * x[1] + s.b);

  /* ---------- decision boundary ---------- */
  function drawPlot() {
    const cv = $('plot'), c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const u = curUnit(), S = stateAt()[u], unit = res.units[u], cs = curStep();
    const lo = -0.6, hi = 1.6, X = x => (x - lo) / (hi - lo) * W, Y = y => H - (y - lo) / (hi - lo) * H;
    const cell = 6;
    for (let px = 0; px < W; px += cell) for (let py = 0; py < H; py += cell) {
      const x = lo + (px + cell / 2) / W * (hi - lo), y = lo + (H - py - cell / 2) / H * (hi - lo);
      c.fillStyle = S.w[0] * x + S.w[1] * y + S.b >= 0 ? '#e6f4ea' : '#fdecea';
      c.fillRect(px, py, cell, cell);
    }
    c.strokeStyle = '#b8bfd0'; c.lineWidth = 1; c.setLineDash([4, 4]);
    [0, 1].forEach(v => { c.beginPath(); c.moveTo(X(v), 0); c.lineTo(X(v), H); c.moveTo(0, Y(v)); c.lineTo(W, Y(v)); c.stroke(); });
    c.setLineDash([]);
    c.fillStyle = '#667085'; c.font = '13px system-ui';
    c.fillText(unit.inputs[0], W - 28, Y(0) - 6); c.fillText(unit.inputs[1], X(0) + 6, 14);
    [0, 1].forEach(v => { c.fillText(v, X(v) - 3, Y(0) + 15); c.fillText(v, X(0) - 14, Y(v) + 4); });
    // boundary line
    c.strokeStyle = '#3556d8'; c.lineWidth = 3; c.beginPath();
    if (Math.abs(S.w[1]) > 1e-9) { c.moveTo(X(lo), Y(-(S.w[0] * lo + S.b) / S.w[1])); c.lineTo(X(hi), Y(-(S.w[0] * hi + S.b) / S.w[1])); c.stroke(); }
    else if (Math.abs(S.w[0]) > 1e-9) { const xv = -S.b / S.w[0]; c.moveTo(X(xv), 0); c.lineTo(X(xv), H); c.stroke(); }
    // points
    const seen = {};
    unit.data.forEach((d, i) => {
      const key = d.x.join(','); const n = seen[key] = (seen[key] || 0) + 1;
      const px = X(d.x[0]) + (n - 1) * 9, py = Y(d.x[1]) - (n - 1) * 9;
      const ok = out(S, d.x) === d.t;
      if (cs && cs.u === u && cs.i === i) { c.strokeStyle = '#3556d8'; c.lineWidth = 3; c.beginPath(); c.arc(px, py, 17, 0, 7); c.stroke(); }
      c.fillStyle = d.t ? '#333' : '#fff'; c.strokeStyle = ok ? '#1b8a4b' : '#c0392b'; c.lineWidth = 4;
      c.beginPath(); c.arc(px, py, 9, 0, 7); c.fill(); c.stroke();
    });
    $('plotCap').textContent = `unit ${unit.name} = ${unit.label}` + (unit.inputs[0] === 'h1' ? ' (inputs are h1, h2)' : '');
  }

  /* ---------- network diagram ---------- */
  function drawNet() {
    const st = stateAt(), cu = curUnit(), two = res.model === 'two_layer';
    const nodes = two
      ? { x1: [50, 65], x2: [50, 165], u0: [250, 55], u1: [250, 175], u2: [460, 115] }
      : { x1: [60, 65], x2: [60, 165], u0: [400, 115] };
    const src = two ? [['x1', 'x2'], ['x1', 'x2'], ['u0', 'u1']] : [['x1', 'x2']];
    let s = '';
    res.units.forEach((u, j) => {
      src[j].forEach((from, idx) => {
        const a = nodes[from], b = nodes['u' + j], act = j === cu;
        s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${act ? '#3556d8' : '#9aa3b8'}" stroke-width="${act ? 3 : 1.5}"/>`;
        const lx = a[0] + (b[0] - a[0]) * 0.36, ly = a[1] + (b[1] - a[1]) * 0.36;
        s += `<text x="${lx}" y="${ly - 4}" text-anchor="middle" font-size="13" font-weight="600" fill="${act ? '#3556d8' : '#555'}" style="paint-order:stroke;stroke:#fff;stroke-width:4px">w=${fmt(st[j].w[idx])}</text>`;
      });
    });
    const node = (p, label, fill, stroke) =>
      `<circle cx="${p[0]}" cy="${p[1]}" r="23" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text x="${p[0]}" y="${p[1] + 5}" text-anchor="middle" font-size="14" font-weight="700">${label}</text>`;
    s += node(nodes.x1, 'x1', '#fff', '#555') + node(nodes.x2, 'x2', '#fff', '#555');
    res.units.forEach((u, j) => {
      const p = nodes['u' + j];
      s += node(p, u.name, j === cu ? '#dfe6ff' : '#fff', j === cu ? '#3556d8' : '#555');
      s += `<text x="${p[0]}" y="${p[1] + 42}" text-anchor="middle" font-size="12" fill="#333">${u.label} &#183; b=${fmt(st[j].b)}</text>`;
    });
    $('net').innerHTML = s;
  }

  /* ---------- explanation, chips, live truth table ---------- */
  function explain() {
    const s = curStep(), el = $('explain');
    if (!s) {
      el.innerHTML = `Start: w1=${fmt(res.init[0])}, w2=${fmt(res.init[1])}, b=${fmt(res.init[2])}. Press <b>Play</b> or <b>Next</b>.`;
      return;
    }
    const unit = res.units[s.u], [a, b] = unit.inputs;
    let h = `<b>Unit ${unit.name} (${unit.label}) &middot; epoch ${s.epoch} &middot; pattern ${s.i + 1}/4</b>: ${a}=${s.x[0]}, ${b}=${s.x[1]}, target t=${s.t}<br>`;
    h += `z = w1&middot;${a} + w2&middot;${b} + b = ${sg(s.w0[0])}&middot;${s.x[0]} + ${sg(s.w0[1])}&middot;${s.x[1]} + ${sg(s.b0)} = <b>${fmt(s.z)}</b> &rarr; y = step(${fmt(s.z)}) = <b>${s.y}</b><br>`;
    if (!s.e) h += `<span class="good">e = t &minus; y = 0 &rarr; correct, no change.</span>`;
    else h += `<span class="wrong">e = t &minus; y = ${s.t} &minus; ${s.y} = ${s.e} &rarr; wrong, update:</span> `
      + `w1 = ${fmt(s.w0[0])} + ${fmt(res.lr)}&middot;${sg(s.e)}&middot;${s.x[0]} = <b>${fmt(s.w[0])}</b>, `
      + `w2 = ${fmt(s.w0[1])} + ${fmt(res.lr)}&middot;${sg(s.e)}&middot;${s.x[1]} = <b>${fmt(s.w[1])}</b>, `
      + `b = ${fmt(s.b0)} + ${fmt(res.lr)}&middot;${sg(s.e)} = <b>${fmt(s.b)}</b>`;
    el.innerHTML = h;
  }

  function chips() {
    const u = curUnit(), cs = curStep();
    $('chips').innerHTML = '<span class="muted">Errors per epoch (' + res.units[u].name + '):</span> ' +
      res.units[u].epochErrors.map((e, i) => `<span class="chip ${e ? 'bad' : 'ok'} ${cs && cs.u === u && cs.epoch === i + 1 ? 'cur' : ''}">E${i + 1}: ${e}</span>`).join('');
  }

  function live() {
    const st = stateAt(), two = res.model === 'two_layer';
    let h = `<table><tr><th>x1</th><th>x2</th>${two ? '<th>h1</th><th>h2</th>' : ''}<th>target</th><th>output now</th></tr>`;
    INP.forEach((x, i) => {
      let y, hh = '';
      if (two) { const a = out(st[0], x), b = out(st[1], x); y = out(st[2], [a, b]); hh = `<td>${a}</td><td>${b}</td>`; }
      else y = out(st[0], x);
      const t = res.table[i].t;
      h += `<tr><td>${x[0]}</td><td>${x[1]}</td>${hh}<td>${t}</td><td class="${y === t ? 'ok' : 'bad'}">${y} ${y === t ? '&#10003;' : '&#10007;'}</td></tr>`;
    });
    $('live').innerHTML = h + '</table>';
  }

  function status() {
    const el = $('status'); el.className = 'status';
    if (k < res.steps.length) { el.textContent = `Training... step ${k} of ${res.steps.length}`; return; }
    const all = res.units.every(u => u.converged);
    if (all) { el.classList.add('ok'); el.textContent = 'Learned: ' + res.units.map(u => `${u.name} in ${u.epochErrors.length} epochs`).join(', ') + ' (last epoch had 0 errors).'; }
    else { el.classList.add('bad'); el.textContent = `Not learned in ${res.maxEpochs} epochs: errors never reach 0 (${res.gate} is not linearly separable). Try the two-layer model.`; }
  }

  function render() {
    drawPlot(); drawNet(); explain(); chips(); live(); status();
    $('slider').value = k; $('stepNo').textContent = `step ${k} / ${res.steps.length}`;
  }

  /* ---------- player ---------- */
  function stop() { clearInterval(timer); timer = null; $('play').innerHTML = '&#9654; Play'; }
  function go(n) { k = Math.max(0, Math.min(res.steps.length, n)); render(); if (k === res.steps.length) stop(); }
  function play() {
    if (!res) return;
    if (timer) return stop();
    if (k >= res.steps.length) k = 0;
    $('play').innerHTML = '&#9208; Pause';
    timer = setInterval(() => go(k + 1), +$('speed').value);
  }
  $('play').onclick = play;
  $('next').onclick = () => { stop(); res && go(k + 1); };
  $('prev').onclick = () => { stop(); res && go(k - 1); };
  $('first').onclick = () => { stop(); res && go(0); };
  $('last').onclick = () => { stop(); res && go(res.steps.length); };
  $('slider').oninput = e => { stop(); res && go(+e.target.value); };
  $('speed').onchange = () => { if (timer) { stop(); play(); } };

  /* ---------- run ---------- */
  function syncModel() {
    const two = $('model').querySelector('[value=two_layer]');
    two.disabled = $('gate').value !== 'XOR';
    if (two.disabled && $('model').value === 'two_layer') $('model').value = 'single';
  }
  $('gate').onchange = syncModel;

  function run(auto) {
    stop(); $('err').textContent = '';
    computeSteps('perceptron', {
      gate: $('gate').value, model: $('model').value, lr: +$('lr').value,
      w1: parseFloat($('w1').value), w2: parseFloat($('w2').value), b: parseFloat($('b').value),
      maxEpochs: parseInt($('epochs').value, 10)
    }).then(r => {
      res = r; k = 0; $('slider').max = r.steps.length; render();
      if (auto) play();
    }).catch(e => { $('err').textContent = e.message; });
  }
  $('run').onclick = () => run(true);

  /* ---------- summary table ---------- */
  function loadSummary() {
    computeSteps('summary', {}).then(rows => {
      $('summary').innerHTML = '<tr><th>Gate</th><th>Model</th><th>Result</th><th>Epochs</th><th>Final weights</th></tr>' +
        rows.map(r => `<tr><td>${r.gate}</td><td>${r.model === 'single' ? 'single perceptron' : 'two layers'}</td>` +
          `<td class="${r.allCorrect ? 'ok' : 'bad'}">${r.allCorrect ? 'learned' : 'FAILED'}</td><td>${r.epochs.join(' + ')}</td>` +
          `<td>${r.units.map(u => `${u.label}: w=(${sgn(u.w[0])}, ${sgn(u.w[1])}), b=${sgn(u.b)}`).join('<br>')}</td></tr>`).join('');
    }).catch(() => {});
  }

  syncModel(); loadSummary(); run(false);
})();
