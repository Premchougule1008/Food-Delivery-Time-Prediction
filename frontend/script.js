"use strict";

/* ---------- API ---------- */

const API_BASE =
  "https://food-delivery-time-prediction-bz8j.onrender.com";


/* ---------- Elements ---------- */

const $ = (id) => document.getElementById(id);

const form = $("form");

const history = [];


/* ---------- Helpers ---------- */

function haversine(lat1, lon1, lat2, lon2) {

  const R = 6371;

  const rad = (d) => (d * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}


const radio = (name) =>
  form.querySelector(`input[name="${name}"]:checked`).value;


const num = (id) =>
  parseFloat($(id).value);


function normalizeTime(value) {

  return /^\d{2}:\d{2}$/.test(value)
    ? value + ":00"
    : value;
}


/* ---------- API Status ---------- */

async function checkApi() {

  $("statusDot").className = "dot";
  $("statusText").textContent = "Checking API…";

  try {

    const response = await fetch(`${API_BASE}/health`);

    if (response.ok) {

      $("statusDot").className = "dot ok";
      $("statusText").textContent = "API connected";

    } else {

      $("statusDot").className = "dot down";
      $("statusText").textContent = "Model not loaded";

    }

  } catch {

    $("statusDot").className = "dot down";
    $("statusText").textContent = "API not reachable";

  }
}


/* ---------- Live Distance ---------- */

function updateLiveDistance() {

  const values = ["rlat", "rlon", "dlat", "dlon"].map(num);

  $("liveDist").textContent =
    values.some(Number.isNaN)
      ? "–"
      : haversine(...values).toFixed(2) + " km";
}


["rlat", "rlon", "dlat", "dlon"].forEach((id) => {

  $(id).addEventListener(
    "input",
    updateLiveDistance
  );

});


$("ratings").addEventListener("input", (e) => {

  $("ratingOut").textContent =
    Number(e.target.value).toFixed(1);

});


$("vcond").addEventListener("input", (e) => {

  $("vcondOut").textContent =
    e.target.value;

});


$("swap").addEventListener("click", () => {

  [
    ["rlat", "dlat"],
    ["rlon", "dlon"]
  ].forEach(([a, b]) => {

    [$(a).value, $(b).value] =
      [$(b).value, $(a).value];

  });

  updateLiveDistance();

});


/* ---------- Presets ---------- */

const PRESETS = {

  rush: {
    age: 24,
    rating: 4.1,
    rlat: 12.9716,
    rlon: 77.5946,
    dlat: 13.0358,
    dlon: 77.6413,
    time: "19:15",
    city: "Metropolitian",
    traffic: "Jam",
    weather: "Sunny",
    festival: false,
    otype: "Meal",
    vtype: "motorcycle",
    vcond: 1,
    multi: "2"
  },

  calm: {
    age: 35,
    rating: 4.9,
    rlat: 12.9716,
    rlon: 77.5946,
    dlat: 12.9816,
    dlon: 77.6046,
    time: "08:10",
    city: "Urban",
    traffic: "Low",
    weather: "Sunny",
    festival: false,
    otype: "Snack",
    vtype: "scooter",
    vcond: 3,
    multi: "0"
  },

  storm: {
    age: 27,
    rating: 4.3,
    rlat: 12.9352,
    rlon: 77.6245,
    dlat: 12.9912,
    dlon: 77.7011,
    time: "21:40",
    city: "Metropolitian",
    traffic: "High",
    weather: "Stormy",
    festival: true,
    otype: "Buffet",
    vtype: "electric_scooter",
    vcond: 2,
    multi: "1"
  }

};


function applyPreset(p) {

  $("age").value = p.age;

  $("ratings").value = p.rating;

  $("ratingOut").textContent =
    p.rating.toFixed(1);

  $("rlat").value = p.rlat;
  $("rlon").value = p.rlon;
  $("dlat").value = p.dlat;
  $("dlon").value = p.dlon;

  $("time").value = p.time;

  $("city").value = p.city;


  form.querySelector(
    `input[name="road_traffic_density"][value="${p.traffic}"]`
  ).checked = true;


  form.querySelector(
    `input[name="weatherconditions"][value="${p.weather}"]`
  ).checked = true;


  $("festival").checked = p.festival;

  $("otype").value = p.otype;

  $("vtype").value = p.vtype;

  $("vcond").value = p.vcond;

  $("vcondOut").textContent = p.vcond;

  $("multi").value = p.multi;

  updateLiveDistance();
}


document.querySelectorAll("[data-preset]").forEach((button) => {

  button.addEventListener("click", () => {

    applyPreset(
      PRESETS[button.dataset.preset]
    );

  });

});


/* ---------- Validation ---------- */

const RULES = [

  [
    "age",
    (v) => v > 0 && v < 100,
    "Enter an age between 1 and 99."
  ],

  [
    "rlat",
    (v) => v >= -90 && v <= 90,
    "Latitude must be between -90 and 90."
  ],

  [
    "dlat",
    (v) => v >= -90 && v <= 90,
    "Latitude must be between -90 and 90."
  ],

  [
    "rlon",
    (v) => v >= -180 && v <= 180,
    "Longitude must be between -180 and 180."
  ],

  [
    "dlon",
    (v) => v >= -180 && v <= 180,
    "Longitude must be between -180 and 180."
  ]

];


function validate() {

  let ok = true;

  RULES.forEach(([id, test, message]) => {

    const element = $(id);

    const error =
      element.parentElement.querySelector(".err");

    const value =
      parseFloat(element.value);

    const good =
      !Number.isNaN(value) && test(value);

    element.classList.toggle(
      "bad",
      !good
    );

    error.textContent =
      good ? "" : message;

    if (!good) {
      ok = false;
    }

  });


  const time = $("time");

  const timeError =
    time.parentElement.querySelector(".err");

  const timeGood =
    /^\d{2}:\d{2}(:\d{2})?$/.test(time.value);

  time.classList.toggle(
    "bad",
    !timeGood
  );

  timeError.textContent =
    timeGood
      ? ""
      : "Choose the time the order was placed.";


  return ok && timeGood;
}


/* ---------- Count Up ---------- */

function countUp(element, target) {

  const start = performance.now();

  const duration = 900;


  const tick = (now) => {

    const progress =
      Math.min(
        (now - start) / duration,
        1
      );


    element.textContent =
      (
        target *
        (1 - Math.pow(1 - progress, 3))
      ).toFixed(
        progress < 1 ? 0 : 1
      );


    if (progress < 1) {

      requestAnimationFrame(tick);

    }

  };


  requestAnimationFrame(tick);
}


/* ---------- Result ---------- */

function showResult(data) {

  const mins =
    data.predicted_delivery_time_minutes;


  $("empty").hidden = true;

  $("output").hidden = false;


  countUp(
    $("etaNum"),
    mins
  );


  $("etaNote").textContent =

    mins <= 20
      ? "Quick delivery."
      : mins <= 35
        ? "A typical delivery."
        : "A slow delivery.";


  $("outDist").textContent =
    data.distance_km.toFixed(2) + " km";


  $("outSpeed").textContent =

    mins > 0
      ? (
          data.distance_km /
          (mins / 60)
        ).toFixed(1) + " km/h"
      : "–";


  $("outHour").textContent =
    String(data.order_hour).padStart(2, "0") +
    ":00";


  const percentage =
    Math.min(mins / 60, 1) * 100;


  const fill =
    $("meterFill");


  fill.style.width =
    percentage + "%";


  fill.style.background =

    mins <= 20
      ? "var(--moss)"
      : mins <= 35
        ? "var(--signal)"
        : "var(--bad)";
}


/* ---------- History ---------- */

function addHistory(data) {

  history.unshift({

    mins:
      data.predicted_delivery_time_minutes,

    dist:
      data.distance_km,

    traffic:
      radio("road_traffic_density"),

    weather:
      radio("weatherconditions")

  });


  history.splice(5);

  renderHistory();
}


function renderHistory() {

  const list =
    $("historyList");


  list.innerHTML = "";


  if (!history.length) {

    list.innerHTML =
      '<li class="muted">Nothing yet.</li>';

    return;
  }


  history.forEach((item) => {

    const li =
      document.createElement("li");


    const left =
      document.createElement("span");


    left.textContent =
      `${item.dist.toFixed(1)} km, ${item.traffic} traffic, ${item.weather}`;


    const right =
      document.createElement("b");


    right.textContent =
      item.mins.toFixed(1) + " min";


    li.append(left, right);

    list.appendChild(li);

  });

}


$("clearHistory").addEventListener(
  "click",
  () => {

    history.length = 0;

    renderHistory();

  }
);


/* ---------- Error ---------- */

function showError(message) {

  const box =
    $("formError");

  box.textContent =
    message;

  box.hidden =
    !message;
}


function formatDetail(detail) {

  if (Array.isArray(detail)) {

    return detail
      .map(
        (item) =>
          `${(item.loc || []).slice(1).join(".") || "input"}: ${item.msg}`
      )
      .join("; ");

  }


  return typeof detail === "string"
    ? detail
    : "The server rejected the request.";
}


/* ---------- Submit ---------- */

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    showError("");


    if (!validate()) {

      showError(
        "Fix the highlighted fields and try again."
      );

      return;
    }


    const payload = {

      delivery_person_age:
        num("age"),

      delivery_person_ratings:
        num("ratings"),

      restaurant_latitude:
        num("rlat"),

      restaurant_longitude:
        num("rlon"),

      delivery_location_latitude:
        num("dlat"),

      delivery_location_longitude:
        num("dlon"),

      time_ordered:
        normalizeTime(
          $("time").value
        ),

      weatherconditions:
        radio("weatherconditions"),

      road_traffic_density:
        radio("road_traffic_density"),

      vehicle_condition:
        parseInt(
          $("vcond").value,
          10
        ),

      type_of_order:
        $("otype").value,

      type_of_vehicle:
        $("vtype").value,

      multiple_deliveries:
        parseFloat(
          $("multi").value
        ),

      festival:
        $("festival").checked
          ? "Yes"
          : "No",

      city:
        $("city").value

    };


    const button =
      $("submitBtn");


    button.disabled = true;

    button.classList.add("loading");

    button.querySelector(
      ".label-text"
    ).textContent = "Estimating…";


    try {

      const response =
        await fetch(
          `${API_BASE}/predict`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(payload)
          }
        );


      const data =
        await response.json()
          .catch(() => ({}));


      if (!response.ok) {

        throw new Error(
          formatDetail(data.detail)
        );

      }


      showResult(data);

      addHistory(data);


      $("statusDot").className =
        "dot ok";

      $("statusText").textContent =
        "API connected";


    } catch (error) {

      const offline =
        error instanceof TypeError;


      showError(

        offline

          ? `Can't reach the API at ${API_BASE}.`

          : error.message

      );


      if (offline) {

        $("statusDot").className =
          "dot down";

        $("statusText").textContent =
          "API not reachable";

      }

    } finally {

      button.disabled = false;

      button.classList.remove("loading");

      button.querySelector(
        ".label-text"
      ).textContent =
        "Estimate delivery time";

    }

  }
);


/* ---------- Init ---------- */

updateLiveDistance();

checkApi();