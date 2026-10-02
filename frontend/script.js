"use strict";

/* ---------- Config ---------- */
let API_BASE = (() => {
  try { return localStorage.getItem("apiBase") || "https://food-delivery-time-prediction-bz8j.onrender.com"; }
  catch { return "https://food-delivery-time-prediction-bz8j.onrender.com"; }
})();

const $ = (id) => document.getElementById(id);
const form = $("form");
const history = [];

/* ---------- Helpers ---------- */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const radio = (name) => form.querySelector(`input[name="${name}"]:checked`).value;
const num = (id) => parseFloat($(id).value);

function normalizeTime(v) {              // "18:30" -> "18:30:00"
  return /^\d{2}:\d{2}$/.test(v) ? v + ":00" : v;
}

/* ---------- API status ---------- */
async function checkApi() {
  $("statusDot").className = "dot";
  $("statusText").textContent = "Checking API…";
  try {
    const r = await fetch(`${API_BASE}/health`);
    if (r.ok) {
      $("statusDot").className = "dot ok";
      $("statusText").textContent = "API connected";
    } else {
      const d = await r.json().catch(() => ({}));
      $("statusDot").className = "dot down";
      $("statusText").textContent = "Model not loaded";
      console.warn(d.detail);
    }
  } catch {
    $("statusDot").className = "dot down";
    $("statusText").textContent = "API not reachable";
  }
}
$("apiUrl").value = API_BASE;
$("apiToggle").addEventListener("click", () => { $("apiPanel").hidden = !$("apiPanel").hidden; });
$("apiSave").addEventListener("click", () => {
  API_BASE = $("apiUrl").value.trim().replace(/\/+$/, "");
  try { localStorage.setItem("apiBase", API_BASE); } catch {}
  checkApi();
});

/* ---------- Live bits ---------- */
function updateLiveDistance() {
  const v = ["rlat", "rlon", "dlat", "dlon"].map(num);
  $("liveDist").textContent = v.some(Number.isNaN) ? "–" : haversine(...v).toFixed(2) + " km";
}
["rlat", "rlon", "dlat", "dlon"].forEach((id) => $(id).addEventListener("input", updateLiveDistance));
$("ratings").addEventListener("input", (e) => ($("ratingOut").textContent = (+e.target.value).toFixed(1)));
$("vcond").addEventListener("input", (e) => ($("vcondOut").textContent = e.target.value));
$("swap").addEventListener("click", () => {
  [["rlat", "dlat"], ["rlon", "dlon"]].forEach(([a, b]) => {
    [$(a).value, $(b).value] = [$(b).value, $(a).value];
  });
  updateLiveDistance();
});

/* ---------- Presets ---------- */
const PRESETS = {
  rush:  { age: 24, rating: 4.1, rlat: 12.9716, rlon: 77.5946, dlat: 13.0358, dlon: 77.6413, time: "19:15:00",
           city: "Metropolitian", traffic: "Jam", weather: "Sunny", festival: false, otype: "Meal", vtype: "motorcycle", vcond: 1, multi: "2" },
  calm:  { age: 35, rating: 4.9, rlat: 12.9716, rlon: 77.5946, dlat: 12.9816, dlon: 77.6046, time: "08:10:00",
           city: "Urban", traffic: "Low", weather: "Sunny", festival: false, otype: "Snack", vtype: "scooter", vcond: 3, multi: "0" },
  storm: { age: 27, rating: 4.3, rlat: 12.9352, rlon: 77.6245, dlat: 12.9912, dlon: 77.7011, time: "21:40:00",
           city: "Metropolitian", traffic: "High", weather: "Stormy", festival: true, otype: "Buffet", vtype: "electric_scooter", vcond: 2, multi: "1" },
};
function applyPreset(p) {
  $("age").value = p.age;
  $("ratings").value = p.rating; $("ratingOut").textContent = p.rating.toFixed(1);
  $("rlat").value = p.rlat; $("rlon").value = p.rlon; $("dlat").value = p.dlat; $("dlon").value = p.dlon;
  $("time").value = p.time; $("city").value = p.city;
  form.querySelector(`input[name="road_traffic_density"][value="${p.traffic}"]`).checked = true;
  form.querySelector(`input[name="weatherconditions"][value="${p.weather}"]`).checked = true;
  $("festival").checked = p.festival;
  $("otype").value = p.otype; $("vtype").value = p.vtype;
  $("vcond").value = p.vcond; $("vcondOut").textContent = p.vcond;
  $("multi").value = p.multi;
  updateLiveDistance();
}
document.querySelectorAll("[data-preset]").forEach((b) =>
  b.addEventListener("click", () => applyPreset(PRESETS[b.dataset.preset])));

/* ---------- Validation (mirrors the Pydantic rules) ---------- */
const RULES = [
  ["age", (v) => v > 0 && v < 100, "Enter an age between 1 and 99."],
  ["rlat", (v) => v >= -90 && v <= 90, "Latitude must be between -90 and 90."],
  ["dlat", (v) => v >= -90 && v <= 90, "Latitude must be between -90 and 90."],
  ["rlon", (v) => v >= -180 && v <= 180, "Longitude must be between -180 and 180."],
  ["dlon", (v) => v >= -180 && v <= 180, "Longitude must be between -180 and 180."],
];
function validate() {
  let ok = true;
  RULES.forEach(([id, test, msg]) => {
    const el = $(id), err = el.parentElement.querySelector(".err");
    const v = parseFloat(el.value), good = !Number.isNaN(v) && test(v);
    el.classList.toggle("bad", !good);
    err.textContent = good ? "" : msg;
    if (!good) ok = false;
  });
  const t = $("time"), tErr = t.parentElement.querySelector(".err");
  const tGood = /^\d{2}:\d{2}(:\d{2})?$/.test(t.value);
  t.classList.toggle("bad", !tGood);
  tErr.textContent = tGood ? "" : "Choose the time the order was placed.";
  return ok && tGood;
}

/* ---------- Route animation ---------- */
const routePath = $("routeLine");
let riderRaf;
function animateRider() {
  cancelAnimationFrame(riderRaf);
  const rider = $("rider"), len = routePath.getTotalLength();
  rider.setAttribute("opacity", "1");
  routePath.classList.add("run");
  const dur = 2200, start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - t, 3);
    const p = routePath.getPointAtLength(len * e);
    rider.setAttribute("transform", `translate(${p.x},${p.y})`);
    if (t < 1) riderRaf = requestAnimationFrame(step);
  };
  riderRaf = requestAnimationFrame(step);
}

function countUp(el, to) {
  const start = performance.now(), dur = 900;
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = (to * (1 - Math.pow(1 - t, 3))).toFixed(t < 1 ? 0 : 1);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Result display ---------- */
function showResult(data) {
  const mins = data.predicted_delivery_time_minutes;
  $("empty").hidden = true;
  $("output").hidden = false;
  countUp($("etaNum"), mins);
  $("etaNote").textContent =
    mins <= 20 ? "Quick run. Expect an early drop-off." :
    mins <= 35 ? "A typical delivery." :
    "A slow run. Consider letting the customer know.";
  $("outDist").textContent = data.distance_km.toFixed(2) + " km";
  $("outSpeed").textContent = mins > 0 ? (data.distance_km / (mins / 60)).toFixed(1) + " km/h" : "–";
  $("outHour").textContent = String(data.order_hour).padStart(2, "0") + ":00";
  const pct = Math.min(mins / 60, 1) * 100;
  const fill = $("meterFill");
  fill.style.width = pct + "%";
  fill.style.background = mins <= 20 ? "var(--moss)" : mins <= 35 ? "var(--signal)" : "var(--bad)";
  animateRider();
}

function addHistory(data) {
  history.unshift({ mins: data.predicted_delivery_time_minutes, dist: data.distance_km,
    traffic: radio("road_traffic_density"), weather: radio("weatherconditions") });
  history.splice(5);
  renderHistory();
}
function renderHistory() {
  const ul = $("historyList");
  ul.innerHTML = "";
  if (!history.length) { ul.innerHTML = '<li class="muted">Nothing yet.</li>'; return; }
  history.forEach((h) => {
    const li = document.createElement("li");
    const left = document.createElement("span");
    left.textContent = `${h.dist.toFixed(1)} km, ${h.traffic} traffic, ${h.weather}`;
    const right = document.createElement("b");
    right.textContent = h.mins.toFixed(1) + " min";
    li.append(left, right);
    ul.appendChild(li);
  });
}
$("clearHistory").addEventListener("click", () => { history.length = 0; renderHistory(); });

/* ---------- Submit ---------- */
function showError(msg) {
  const box = $("formError");
  box.textContent = msg;
  box.hidden = !msg;
}
function formatDetail(detail) {
  if (Array.isArray(detail))
    return detail.map((d) => `${(d.loc || []).slice(1).join(".") || "input"}: ${d.msg}`).join("; ");
  return typeof detail === "string" ? detail : "The server rejected the request.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  if (!validate()) { showError("Fix the highlighted fields and try again."); return; }

  const payload = {
    delivery_person_age: num("age"),
    delivery_person_ratings: num("ratings"),
    restaurant_latitude: num("rlat"),
    restaurant_longitude: num("rlon"),
    delivery_location_latitude: num("dlat"),
    delivery_location_longitude: num("dlon"),
    time_ordered: normalizeTime($("time").value),
    weatherconditions: radio("weatherconditions"),
    road_traffic_density: radio("road_traffic_density"),
    vehicle_condition: parseInt($("vcond").value, 10),
    type_of_order: $("otype").value,
    type_of_vehicle: $("vtype").value,
    multiple_deliveries: parseFloat($("multi").value),
    festival: $("festival").checked ? "Yes" : "No",
    city: $("city").value,
  };

  const btn = $("submitBtn");
  btn.disabled = true; btn.classList.add("loading");
  btn.querySelector(".label-text").textContent = "Estimating…";
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(formatDetail(data.detail));
    showResult(data);
    addHistory(data);
    $("statusDot").className = "dot ok";
    $("statusText").textContent = "API connected";
  } catch (err) {
    const offline = err instanceof TypeError;
    showError(offline
      ? `Can't reach the API at ${API_BASE}. Start the server with: uvicorn main:app --reload`
      : err.message);
    if (offline) { $("statusDot").className = "dot down"; $("statusText").textContent = "API not reachable"; }
  } finally {
    btn.disabled = false; btn.classList.remove("loading");
    btn.querySelector(".label-text").textContent = "Estimate delivery time";
  }
});

/* ---------- Init ---------- */
updateLiveDistance();
checkApi();
