"""
POLARIS AI Model — trains a small neural network that estimates, from the
live digital-twin state of any asset (the same state driving the 3D scene):
  1. failure_risk_pct      (0-100)  probability-like failure risk score
  2. energy_demand_kw      (kW)     predicted electrical/thermal demand
  3. operational_demand    (0-100)  how much operational/logistics attention
                                     the asset currently requires

Ground truth is generated from a richer, noisier physics-and-domain-rules
simulator (independent of, but consistent with, the deterministic
threshold scorer already in simulator.js) so the network learns real
nonlinear structure rather than memorising the existing formula.

Output: a portable JSON of the trained weights + normalisation stats, with
NO python/runtime dependency needed to use it — website/src/data/aiModel.js
re-implements the forward pass in plain JS.
"""
import json, random, math
import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

rng = np.random.default_rng(42)
random.seed(42)

TYPES = ["generator", "chp", "fuel_tank", "pump", "water_plant", "hvac",
         "building", "lab", "store", "comms", "aws"]

# generic telemetry "slots" every asset type maps its own signals onto,
# so one network can score every asset type in the twin.
SLOTS = ["primary_temp", "vibration", "pressure_or_level", "flow_or_output",
         "speed_or_rpm", "secondary_temp", "rate_or_power", "quality_pct"]

N_TYPE = len(TYPES)
N_SLOT = len(SLOTS)
# feature layout: [type one-hot](11) + [slots](8) + [env: temp,wind,humidity,personnel](4)
#                 + [age, days_since_maint, health/100, trend_delta/10, anomaly](5)
FEATURE_NAMES = (
    [f"type_{t}" for t in TYPES] + [f"slot_{s}" for s in SLOTS] +
    ["env_temp", "env_wind", "env_humidity", "env_personnel"] +
    ["age_norm", "maint_gap_norm", "health_frac", "trend_delta_norm", "anomaly"]
)
N_FEAT = len(FEATURE_NAMES)


def sample_asset(type_idx):
    """Sample one plausible (possibly faulty) live snapshot + its ground-truth targets."""
    t = TYPES[type_idx]
    slots = np.zeros(N_SLOT)

    # fault_level 0 = healthy, 1 = severe fault, drawn so we cover the whole range
    fault = rng.beta(1.3, 3.0)  # skewed toward healthy, good tail of faults
    age_hr = rng.uniform(0, 60000)
    maint_gap = rng.uniform(0, 400)  # days since last maintenance
    env_temp = rng.uniform(-45, 5)
    env_wind = rng.uniform(2, 110)
    env_humidity = rng.uniform(40, 95)
    personnel = rng.uniform(20, 90)
    cold_factor = clamp((-env_temp) / 45, 0, 1.3)

    # --- per-type physical signal generation ---
    if t == "generator":
        base_load = rng.uniform(30, 100)
        slots[0] = 72 + fault * 26 + rng.normal(0, 2)               # temp_c
        slots[1] = 1.6 + fault * 3.4 + rng.normal(0, 0.15)           # vibration
        slots[2] = 4.2 - fault * 1.6 + rng.normal(0, 0.1)            # oil_pressure (lower=bad)
        slots[3] = base_load                                        # load_kw proxy
        slots[4] = 1500 - fault * 120                                # rpm
        slots[5] = 68 + fault * 24 + rng.normal(0, 2)                # coolant_c
        slots[6] = 24 + fault * 12 + base_load * 0.18                # fuel_rate_lph
        slots[7] = 100 - fault * 20                                  # generic quality
        energy = base_load * (1 + 0.30 * fault) * (1 + 0.12 * cold_factor)
        risk = 8 + fault * 82 + max(0, -_health_trend(fault)) * 3
    elif t == "chp":
        base_load = rng.uniform(40, 110)
        slots[0] = 74 + fault * 25 + rng.normal(0, 2)
        slots[1] = 1.5 + fault * 3.3 + rng.normal(0, 0.15)
        slots[2] = 4.4 - fault * 1.7
        slots[3] = base_load
        slots[4] = 1500 - fault * 110
        slots[5] = 120 - fault * 55                                  # heat_kw (drops when faulty)
        slots[6] = 28 + fault * 13 + base_load * 0.16
        slots[7] = 100 - fault * 22
        energy = base_load * (1 + 0.22 * fault) + (120 - slots[5]) * 0.4 + cold_factor * 20
        risk = 8 + fault * 80
    elif t == "fuel_tank":
        level = clamp(rng.uniform(15, 95) - fault * 30, 0, 100)
        slots[0] = -14 + fault * 20 + rng.normal(0, 1)                # temp_c (leak raises it)
        slots[2] = level                                              # level_pct
        slots[6] = 900 + personnel * 8 + cold_factor * 400            # consumption rate proxy
        slots[7] = 100 - fault * 15
        energy = 0.0
        risk = 6 + (100 - level) * 0.55 + fault * 25
    elif t == "pump":
        base_flow = rng.uniform(140, 240)
        slots[0] = 46 + fault * 22 + rng.normal(0, 2)                 # motor_temp
        slots[1] = 1.2 + fault * 2.8
        slots[2] = 3.1 - fault * 1.5                                  # pressure_bar
        slots[3] = base_flow * (1 - 0.65 * fault)                     # flow_lpm
        slots[4] = 2900 - fault * 300
        slots[6] = 3.2 + fault * 1.4                                  # motor kw proxy
        slots[7] = 100 - fault * 25
        energy = 3.2 + fault * 1.4 + personnel * 0.01
        risk = 7 + fault * 78
    elif t == "water_plant":
        base_out = rng.uniform(400, 750)
        slots[0] = 12 + fault * 6
        slots[2] = 55 - fault * 22                                    # pressure_bar
        slots[3] = base_out * (1 - 0.55 * fault)                      # output_lph
        slots[5] = 180 + fault * 250                                  # salinity_ppm
        slots[6] = 9 + fault * 3
        slots[7] = 100 - fault * 22
        energy = 9 + fault * 3 + personnel * 0.02
        risk = 7 + fault * 75
    elif t == "hvac":
        slots[0] = 34 - fault * 16 + rng.normal(0, 1)                 # supply_c
        slots[4] = 1450 * (1 - 0.25 * fault)                          # fan_rpm
        slots[5] = 21 - fault * 9                                      # zone_c
        slots[7] = clamp(78 - fault * 45, 5, 100)                      # filter_pct
        heat_need = 8 + cold_factor * 40
        slots[6] = heat_need
        energy = heat_need * (1 + 0.35 * fault)
        risk = 6 + fault * 70 + cold_factor * 8
    elif t in ("building", "lab", "store"):
        target = -12 if t == "store" else 21
        slots[5] = target - fault * (5 if t != "store" else 4)
        slots[7] = 60 + rng.normal(0, 10) if t != "store" else clamp(rng.uniform(15, 95) - fault*30, 0, 100)
        base_kw = {"building": 45, "lab": 18, "store": 4}[t]
        slots[6] = base_kw * (1 + 0.4 * cold_factor)
        energy = slots[6] * (1 + 0.2 * fault)
        risk = 5 + fault * 55 + (0 if t != "store" else (100 - slots[7]) * 0.4)
    elif t == "comms":
        slots[7] = clamp(100 - fault * 85, 5, 100)                     # link_pct
        slots[5] = 300 + fault * 2200                                  # latency_ms
        slots[6] = 1400 * (1 - 0.85 * fault)                           # throughput
        energy = 1.2
        risk = 5 + fault * 80
    else:  # aws (weather station)
        slots[0] = env_temp
        slots[1] = env_wind
        energy = 0.3
        risk = 4 + clamp((env_wind - 55) / 45, 0, 1) * 40 + fault * 20

    health_frac = clamp(1 - fault * 0.95 - rng.normal(0, 0.03), 0.02, 1.0)
    trend_delta = -fault * rng.uniform(0, 12) + rng.normal(0, 1.2)
    anomaly = clamp(fault * rng.uniform(0.5, 1.15) + rng.normal(0, 0.05), 0, 1)

    # operational demand: attention needed = risk + resource criticality + env stress + staffing load
    resource_criticality = (100 - slots[2]) * 0.3 if t == "fuel_tank" else 0
    op_demand = clamp(
        0.55 * risk + 0.20 * cold_factor * 100 * 0.4 + 0.15 * resource_criticality
        + 0.10 * (personnel / 90 * 100) + rng.normal(0, 4),
        0, 100,
    )

    risk = clamp(risk + rng.normal(0, 3), 0.5, 99.5)
    energy = max(0, energy + rng.normal(0, energy * 0.04 + 0.05))

    feat = np.zeros(N_FEAT)
    feat[type_idx] = 1.0
    feat[N_TYPE:N_TYPE + N_SLOT] = slots
    off = N_TYPE + N_SLOT
    feat[off + 0] = env_temp
    feat[off + 1] = env_wind
    feat[off + 2] = env_humidity
    feat[off + 3] = personnel
    off += 4
    feat[off + 0] = age_hr / 60000
    feat[off + 1] = maint_gap / 400
    feat[off + 2] = health_frac
    feat[off + 3] = trend_delta / 10
    feat[off + 4] = anomaly

    target = np.array([risk, energy, op_demand])
    return feat, target


def _health_trend(fault):
    return -fault * 5


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def build_dataset(n_per_type=3500):
    X, Y = [], []
    for i in range(N_TYPE):
        for _ in range(n_per_type):
            f, y = sample_asset(i)
            X.append(f)
            Y.append(y)
    return np.array(X), np.array(Y)


print("Generating synthetic training data ...")
X, Y = build_dataset()
print("X", X.shape, "Y", Y.shape)

# manual standardisation so we can export it trivially
mean = X.mean(axis=0)
std = X.std(axis=0)
std[std < 1e-6] = 1.0
Xs = (X - mean) / std

Xtr, Xte, Ytr, Yte = train_test_split(Xs, Y, test_size=0.15, random_state=0)

model = MLPRegressor(
    hidden_layer_sizes=(32, 16),
    activation="relu",
    solver="adam",
    alpha=1e-3,
    learning_rate_init=1e-3,
    max_iter=2000,
    early_stopping=True,
    n_iter_no_change=25,
    random_state=0,
)
model.fit(Xtr, Ytr)

pred = model.predict(Xte)
mae = mean_absolute_error(Yte, pred, multioutput="raw_values")
print("Test MAE  [failure_risk_pct, energy_demand_kw, operational_demand]:", mae)

# ---- export weights as plain JSON for a hand-rolled JS forward pass ----
layers = []
for w, b in zip(model.coefs_, model.intercepts_):
    layers.append({"w": w.tolist(), "b": b.tolist()})

export = {
    "feature_names": FEATURE_NAMES,
    "types": TYPES,
    "slots": SLOTS,
    "mean": mean.tolist(),
    "std": std.tolist(),
    "layers": layers,
    "activation": "relu",
    "output_activation": "identity",
    "targets": ["failure_risk_pct", "energy_demand_kw", "operational_demand"],
    "test_mae": mae.tolist(),
    "n_train": int(Xtr.shape[0]),
}

with open("/home/claude/ai_model/polaris_ai_weights.json", "w") as fh:
    json.dump(export, fh)

print("Saved weights JSON. Layers:", [ (len(l["b"])) for l in layers ])
