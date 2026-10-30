/* Flask version: the Python backend does the computing. */
function computeSteps(kind, body) {
  return fetch('/api/' + kind, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify(body || {}) })
    .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Server error'); return d; });
}
