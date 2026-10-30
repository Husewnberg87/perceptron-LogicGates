# Perceptron: AND, OR, XOR (Python + Flask)

Task: *"AND OR XOR qapıları üçün task yazıb perseptronda işlədiyini göstərin"* - write the task for the AND, OR, XOR gates and show them working in a perceptron.

* A **single perceptron** (2 inputs, weights, bias, step activation) is trained with the perceptron learning rule on the truth tables of **AND** and **OR** - it converges.
* **XOR** is not linearly separable - the single perceptron never converges (the page shows the errors never reaching 0).
* The **two-layer perceptron** solves XOR: `h1 = OR`, `h2 = NAND`, `y = AND(h1, h2)`, each unit trained with the same rule.

The page shows every training step: the formula with real numbers, the weight update, the decision line moving, the network weights and a live truth table.

## Run it with Flask (Windows)

```
cd perceptron_flask
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5003 (port 5003 because 5000, 5001 and 5002 are used by other projects; change the last line of `app.py` if needed).

## Single HTML file (no server)

`perceptron.html` (next to this folder) is the same app as one standalone file - double-click it. It uses a JavaScript port of the training code (`static/logic.js`). Rebuild after changes with `python build_single_html.py`.

## Files

| File | What it does |
|---|---|
| `perceptron.py` | Perceptron training; records every step; AND/OR/XOR + two-layer XOR |
| `app.py` | Flask server: `/`, `POST /api/perceptron`, `POST /api/summary` |
| `templates/body.html` | Page layout (shared by Flask and the standalone file) |
| `static/app.js` | Drawing (boundary plot, network, tables) and step replay |
| `static/api.js` / `static/logic.js` | Flask calls vs JavaScript port (standalone only) |
| `build_single_html.py` | Builds the standalone `perceptron.html` |
