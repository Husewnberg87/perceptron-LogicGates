"""Perceptron learning for the logic gates AND, OR, XOR.

A perceptron has 2 inputs, weights w1 w2, a bias b and a step activation:
    z = w1*x1 + w2*x2 + b          y = 1 if z >= 0 else 0
Learning rule (for every training pattern):
    e = t - y                       w_i <- w_i + lr*e*x_i        b <- b + lr*e
Training stops after an epoch with no errors (converged) or after max_epochs.

XOR is not linearly separable, so one perceptron can never learn it.  The
two-layer version solves it with three perceptrons trained by the SAME rule:
    h1 = OR(x1, x2)     h2 = NAND(x1, x2)     y = AND(h1, h2) = XOR(x1, x2)
"""
import math

INPUTS = [(0, 0), (0, 1), (1, 0), (1, 1)]
GATES = {"AND": [0, 0, 0, 1], "OR": [0, 1, 1, 1], "XOR": [0, 1, 1, 0], "NAND": [1, 1, 1, 0]}
LRS = (1, 0.5, 0.1)


def r(x):
    return round(x, 6) + 0.0          # kills float noise and -0.0


def step(z):
    return 1 if z >= 0 else 0


def predict(w, b, x):
    return step(r(w[0] * x[0] + w[1] * x[1] + b))


def train_unit(data, lr, max_epochs, w0, b0):
    """data = [(x, t), ...].  Returns (steps, epoch_errors, converged, w, b)."""
    w, b = [r(w0[0]), r(w0[1])], r(b0)
    steps, errs, converged = [], [], False
    for epoch in range(1, max_epochs + 1):
        n_err = 0
        for i, (x, t) in enumerate(data):
            z = r(w[0] * x[0] + w[1] * x[1] + b)
            y = step(z)
            e = t - y
            w_before, b_before = list(w), b
            if e:
                n_err += 1
                w = [r(w[0] + lr * e * x[0]), r(w[1] + lr * e * x[1])]
                b = r(b + lr * e)
            steps.append({"epoch": epoch, "i": i, "x": list(x), "t": t, "z": z, "y": y, "e": e,
                          "w0": w_before, "b0": b_before, "w": list(w), "b": b})
        errs.append(n_err)
        if n_err == 0:
            converged = True
            break
    return steps, errs, converged, w, b


def _num(v, name, lim=5):
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or abs(v) > lim:
        raise ValueError(f"{name} must be a number between -{lim} and {lim}")
    return v


def run_perceptron(gate, model, lr, w1, w2, b, max_epochs):
    if gate not in ("AND", "OR", "XOR"):
        raise ValueError("gate must be AND, OR or XOR")
    if model not in ("single", "two_layer"):
        raise ValueError("model must be 'single' or 'two_layer'")
    if model == "two_layer" and gate != "XOR":
        raise ValueError("the two-layer network is only needed for XOR")
    if isinstance(lr, bool) or lr not in LRS:
        raise ValueError("learning rate must be 1, 0.5 or 0.1")
    w1, w2, b = _num(w1, "w1"), _num(w2, "w2"), _num(b, "b")
    if isinstance(max_epochs, bool) or not isinstance(max_epochs, int) or not 1 <= max_epochs <= 50:
        raise ValueError("epochs must be an integer from 1 to 50")

    units, steps = [], []

    def add_unit(name, label, inputs, data):
        u = len(units)
        st, errs, conv, w, bb = train_unit(data, lr, max_epochs, (w1, w2), b)
        for s in st:
            s["u"] = u
        steps.extend(st)
        units.append({"name": name, "label": label, "inputs": inputs, "epochErrors": errs,
                      "converged": conv, "w": w, "b": bb,
                      "data": [{"x": list(x), "t": t} for x, t in data]})

    target = GATES[gate]
    if model == "single":
        add_unit("y", gate, ["x1", "x2"], [(x, target[i]) for i, x in enumerate(INPUTS)])
    else:
        add_unit("h1", "OR", ["x1", "x2"], [(x, GATES["OR"][i]) for i, x in enumerate(INPUTS)])
        add_unit("h2", "NAND", ["x1", "x2"], [(x, GATES["NAND"][i]) for i, x in enumerate(INPUTS)])
        hidden = [(predict(units[0]["w"], units[0]["b"], x), predict(units[1]["w"], units[1]["b"], x))
                  for x in INPUTS]
        add_unit("y", "AND", ["h1", "h2"], [(hidden[i], target[i]) for i in range(4)])

    table = []
    for i, x in enumerate(INPUTS):
        if model == "single":
            h, y = None, predict(units[0]["w"], units[0]["b"], x)
        else:
            h = [predict(units[0]["w"], units[0]["b"], x), predict(units[1]["w"], units[1]["b"], x)]
            y = predict(units[2]["w"], units[2]["b"], h)
        table.append({"x": list(x), "t": target[i], "h": h, "y": y, "ok": y == target[i]})

    return {"gate": gate, "model": model, "lr": lr, "maxEpochs": max_epochs, "init": [w1, w2, b],
            "units": units, "steps": steps, "table": table,
            "allCorrect": all(t["ok"] for t in table)}


def run_summary():
    rows = []
    for gate, model in (("AND", "single"), ("OR", "single"), ("XOR", "single"), ("XOR", "two_layer")):
        res = run_perceptron(gate, model, 1, 0, 0, 0, 20)
        rows.append({"gate": gate, "model": model, "allCorrect": res["allCorrect"],
                     "converged": all(u["converged"] for u in res["units"]),
                     "epochs": [len(u["epochErrors"]) for u in res["units"]],
                     "units": [{"label": u["label"], "w": u["w"], "b": u["b"]} for u in res["units"]]})
    return rows
