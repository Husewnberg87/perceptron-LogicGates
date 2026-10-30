"""Flask server for the Perceptron (AND / OR / XOR) visualizer.

Run:  python app.py      then open  http://127.0.0.1:5003
"""
from flask import Flask, jsonify, render_template, request

from perceptron import run_perceptron, run_summary

app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/perceptron")
def api_perceptron():
    d = request.get_json(silent=True) or {}
    try:
        return jsonify(run_perceptron(d.get("gate"), d.get("model"), d.get("lr"), d.get("w1"),
                                      d.get("w2"), d.get("b"), d.get("maxEpochs")))
    except ValueError as err:
        return jsonify(error=str(err)), 400


@app.post("/api/summary")
def api_summary():
    return jsonify(run_summary())


if __name__ == "__main__":
    app.run(port=5003, debug=True)   # 5000, 5001 and 5002 are used by other projects
