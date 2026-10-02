from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "xgb_best.pkl"
SCALER_PATH = BASE_DIR / "standard_scaler.pkl"


# =========================================================
# MODEL FEATURE NAMES
# =========================================================

FEATURE_NAMES = [
    "Delivery_person_Age",
    "Delivery_person_Ratings",
    "distance_km",
    "order_hour",
    "Road_traffic_density",
    "Vehicle_condition",
    "multiple_deliveries",

    "Type_of_order_Drinks",
    "Type_of_order_Meal",
    "Type_of_order_Snack",

    "Type_of_vehicle_electric_scooter",
    "Type_of_vehicle_motorcycle",
    "Type_of_vehicle_scooter",

    "Festival_Yes",

    "City_Semi-Urban",
    "City_Urban",

    "Weatherconditions_Fog",
    "Weatherconditions_Sandstorms",
    "Weatherconditions_Stormy",
    "Weatherconditions_Sunny",
    "Weatherconditions_Windy",
]


# =========================================================
# ALLOWED INPUT VALUES
# =========================================================

Traffic = Literal["Low", "Medium", "High", "Jam"]

OrderType = Literal["Buffet","Drinks","Meal","Snack"]

VehicleType = Literal["electric_scooter","motorcycle","scooter"]

Weather = Literal["Fog","Sandstorms","Stormy","Sunny","Windy"]

City = Literal["Semi-Urban","Urban","Metropolitian"]


# =========================================================
# USER REQUEST MODEL
# =========================================================

class DeliveryRequest(BaseModel):
    """
    User input required for delivery-time prediction.
    """

    # Delivery partner information
    delivery_person_age: float = Field(gt=0,lt=100)

    delivery_person_ratings: float = Field(ge=0,le=5)

    # Restaurant location
    restaurant_latitude: float = Field(ge=-90,le=90)

    restaurant_longitude: float = Field(ge=-180,le=180)

    # Delivery location
    delivery_location_latitude: float = Field(ge=-90,le=90)

    delivery_location_longitude: float = Field(ge=-180,le=180)

    # Order time
    time_ordered: str = Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$")

    # Other order information
    weatherconditions: Weather

    road_traffic_density: Traffic

    vehicle_condition: int = Field(ge=0,le=5)

    type_of_order: OrderType

    type_of_vehicle: VehicleType

    multiple_deliveries: float = Field(oge=0,le=3)

    festival: Literal["Yes", "No"]

    city: City


# =========================================================
# RESPONSE MODEL
# =========================================================

class PredictionResponse(BaseModel):

    predicted_delivery_time_minutes: float

    distance_km: float

    order_hour: int


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Food Delivery Time Prediction API",
    version="1.0.0",
    description="Predict delivery time using the trained XGBoost model.",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# LOAD MODEL AND SCALER
# =========================================================

try:

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    ARTIFACT_ERROR = None

except (FileNotFoundError, ValueError, ImportError) as exc:

    model = None
    scaler = None
    ARTIFACT_ERROR = str(exc)


# =========================================================
# HAVERSINE DISTANCE
# =========================================================

def haversine_distance_km(
    latitude_one: float,
    longitude_one: float,
    latitude_two: float,
    longitude_two: float,
) -> float:

    radius_km = 6371.0

    lat_one, lon_one, lat_two, lon_two = np.radians(
        [
            latitude_one,
            longitude_one,
            latitude_two,
            longitude_two,
        ]
    )

    delta_latitude = lat_two - lat_one

    delta_longitude = lon_two - lon_one

    value = (
        np.sin(delta_latitude / 2) ** 2
        +
        np.cos(lat_one)
        * np.cos(lat_two)
        * np.sin(delta_longitude / 2) ** 2
    )

    distance = (
        2
        * radius_km
        * np.arcsin(np.sqrt(value))
    )

    return float(distance)


# =========================================================
# BUILD MODEL FEATURES
# =========================================================

def build_feature_vector(
    request: DeliveryRequest
) -> pd.DataFrame:

    # -----------------------------------------------------
    # 1. Calculate distance
    # -----------------------------------------------------

    distance_km = haversine_distance_km(
        request.restaurant_latitude,
        request.restaurant_longitude,
        request.delivery_location_latitude,
        request.delivery_location_longitude,
    )

    # -----------------------------------------------------
    # 2. Extract hour from time
    # -----------------------------------------------------

    order_hour = int(
        request.time_ordered[:2]
    )

    # -----------------------------------------------------
    # 3. Create all features with 0
    # -----------------------------------------------------

    features = {
        feature_name: 0
        for feature_name in FEATURE_NAMES
    }

    # -----------------------------------------------------
    # 4. Numerical features
    # -----------------------------------------------------

    features.update(
        {
            "Delivery_person_Age":
                request.delivery_person_age,

            "Delivery_person_Ratings":
                request.delivery_person_ratings,

            "distance_km":
                distance_km,

            "order_hour":
                order_hour,

            "Road_traffic_density":
                {
                    "Low": 0,
                    "Medium": 1,
                    "High": 2,
                    "Jam": 3,
                }[request.road_traffic_density],

            "Vehicle_condition":
                request.vehicle_condition,

            "multiple_deliveries":
                request.multiple_deliveries,
        }
    )

    # -----------------------------------------------------
    # 5. Type of Order
    # -----------------------------------------------------

    for category in [
        "Drinks",
        "Meal",
        "Snack"
    ]:

        features[
            f"Type_of_order_{category}"
        ] = int(
            request.type_of_order == category
        )

    # -----------------------------------------------------
    # 6. Type of Vehicle
    # -----------------------------------------------------

    for category in [
        "electric_scooter",
        "motorcycle",
        "scooter"
    ]:

        features[
            f"Type_of_vehicle_{category}"
        ] = int(
            request.type_of_vehicle == category
        )

    # -----------------------------------------------------
    # 7. Festival
    # -----------------------------------------------------

    features["Festival_Yes"] = int(
        request.festival == "Yes"
    )

    # -----------------------------------------------------
    # 8. City
    # -----------------------------------------------------

    for category in [
        "Semi-Urban",
        "Urban"
    ]:

        features[
            f"City_{category}"
        ] = int(
            request.city == category
        )

    # -----------------------------------------------------
    # 9. Weather
    # -----------------------------------------------------

    for category in [
        "Fog",
        "Sandstorms",
        "Stormy",
        "Sunny",
        "Windy"
    ]:

        features[
            f"Weatherconditions_{category}"
        ] = int(
            request.weatherconditions == category
        )

    # -----------------------------------------------------
    # 10. Create DataFrame in exact model order
    # -----------------------------------------------------

    return pd.DataFrame(
        [
            [
                features[name]
                for name in FEATURE_NAMES
            ]
        ],
        columns=FEATURE_NAMES
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():

    if model is None or scaler is None:

        raise HTTPException(
            status_code=503,
            detail=(
                f"Model artifacts unavailable: "
                f"{ARTIFACT_ERROR}"
            )
        )

    return {
        "status": "ok"
    }


# =========================================================
# PREDICTION ENDPOINT
# =========================================================

@app.post(
    "/predict",
    response_model=PredictionResponse
)
def predict_delivery_time(
    request: DeliveryRequest
):

    # -----------------------------------------------------
    # Check model
    # -----------------------------------------------------

    if model is None or scaler is None:

        raise HTTPException(
            status_code=503,
            detail=(
                f"Model artifacts unavailable: "
                f"{ARTIFACT_ERROR}"
            )
        )

    # -----------------------------------------------------
    # Build features
    # -----------------------------------------------------

    raw_features = build_feature_vector(
        request
    )

    # -----------------------------------------------------
    # Scale features
    # -----------------------------------------------------

    scaled_features = scaler.transform(
        raw_features
    )

    # -----------------------------------------------------
    # Model prediction
    # -----------------------------------------------------

    prediction = float(
        model.predict(
            scaled_features
        )[0]
    )

    # -----------------------------------------------------
    # Return result
    # -----------------------------------------------------

    return PredictionResponse(

        predicted_delivery_time_minutes=round(
            max(prediction, 0),
            2
        ),

        distance_km=round(
            float(
                raw_features.iloc[0]["distance_km"]
            ),
            3
        ),

        order_hour=int(
            raw_features.iloc[0]["order_hour"]
        ),
    )