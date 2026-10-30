/* JavaScript port of perceptron.py - used only by the standalone HTML (no server). */
const P_INPUTS = [[0, 0], [0, 1], [1, 0], [1, 1]];
const P_GATES = { AND: [0, 0, 0, 1], OR: [0, 1, 1, 1], XOR: [0, 1, 1, 0], NAND: [1, 1, 1, 0] };
const P_LRS = [1, 0.5, 0.1];
const pr = x => Number(x.toFixed(6)) + 0;
const pstep = z => (z >= 0 ? 1 : 0);
const ppredict = (w, b, x) => pstep(pr(w[0] * x[0] + w[1] * x[1] + b));

function trainUnit(data, lr, maxEpochs, w0, b0) {
  let w = [pr(w0[0]), pr(w0[1])], b = pr(b0);
  const steps = [], errs = [];
  let converged = false;
  for (let epoch = 1; epoch <= maxEpochs; epoch++) {
    let nErr = 0;
    data.forEach(([x, t], i) => {
      const z = pr(w[0] * x[0] + w[1] * x[1] + b), y = pstep(z), e = t - y;
      const wB = w.slice(), bB = b;
      if (e) {
        nErr++;
        w = [pr(w[0] + lr * e * x[0]), pr(w[1] + lr * e * x[1])];
        b = pr(b + lr * e);
      }
      steps.push({ epoch, i, x: x.slice(), t, z, y, e, w0: wB, b0: bB, w: w.slice(), b });
    });
    errs.push(nErr);
    if (nErr === 0) { converged = true; break; }
  }
  return { steps, errs, converged, w, b };
}

function pnum(v, name, lim = 5) {
  if (typeof v !== 'number' || !isFinite(v) || Math.abs(v) > lim)
    throw new Error(`${name} must be a number between -${lim} and ${lim}`);
  return v;
}

function runPerceptron(d) {
  const { gate, model, lr, maxEpochs } = d;
  if (!['AND', 'OR', 'XOR'].includes(gate)) throw new Error('gate must be AND, OR or XOR');
  if (!['single', 'two_layer'].includes(model)) throw new Error("model must be 'single' or 'two_layer'");
  if (model === 'two_layer' && gate !== 'XOR') throw new Error('the two-layer network is only needed for XOR');
  if (!P_LRS.includes(lr)) throw new Error('learning rate must be 1, 0.5 or 0.1');
  const w1 = pnum(d.w1, 'w1'), w2 = pnum(d.w2, 'w2'), b = pnum(d.b, 'b');
  if (!Number.isInteger(maxEpochs) || maxEpochs < 1 || maxEpochs > 50) throw new Error('epochs must be an integer from 1 to 50');

  const units = [], steps = [];
  const addUnit = (name, label, inputs, data) => {
    const u = units.length;
    const r = trainUnit(data, lr, maxEpochs, [w1, w2], b);
    r.steps.forEach(s => { s.u = u; steps.push(s); });
    units.push({ name, label, inputs, epochErrors: r.errs, converged: r.converged, w: r.w, b: r.b,
                 data: data.map(([x, t]) => ({ x: x.slice(), t })) });
  };
  const target = P_GATES[gate];
  if (model === 'single') {
    addUnit('y', gate, ['x1', 'x2'], P_INPUTS.map((x, i) => [x, target[i]]));
  } else {
    addUnit('h1', 'OR', ['x1', 'x2'], P_INPUTS.map((x, i) => [x, P_GATES.OR[i]]));
    addUnit('h2', 'NAND', ['x1', 'x2'], P_INPUTS.map((x, i) => [x, P_GATES.NAND[i]]));
    const hidden = P_INPUTS.map(x => [ppredict(units[0].w, units[0].b, x), ppredict(units[1].w, units[1].b, x)]);
    addUnit('y', 'AND', ['h1', 'h2'], hidden.map((h, i) => [h, target[i]]));
  }
  const table = P_INPUTS.map((x, i) => {
    let h = null, y;
    if (model === 'single') y = ppredict(units[0].w, units[0].b, x);
    else {
      h = [ppredict(units[0].w, units[0].b, x), ppredict(units[1].w, units[1].b, x)];
      y = ppredict(units[2].w, units[2].b, h);
    }
    return { x: x.slice(), t: target[i], h, y, ok: y === target[i] };
  });
  return { gate, model, lr, maxEpochs, init: [w1, w2, b], units, steps, table,
           allCorrect: table.every(t => t.ok) };
}

function runSummary() {
  return [['AND', 'single'], ['OR', 'single'], ['XOR', 'single'], ['XOR', 'two_layer']].map(([gate, model]) => {
    const res = runPerceptron({ gate, model, lr: 1, w1: 0, w2: 0, b: 0, maxEpochs: 20 });
    return { gate, model, allCorrect: res.allCorrect, converged: res.units.every(u => u.converged),
             epochs: res.units.map(u => u.epochErrors.length),
             units: res.units.map(u => ({ label: u.label, w: u.w, b: u.b })) };
  });
}

/* same interface as static/api.js, but computed in the browser */
function computeSteps(kind, body) {
  try { return Promise.resolve(kind === 'summary' ? runSummary() : runPerceptron(body)); }
  catch (e) { return Promise.reject(e); }
}
