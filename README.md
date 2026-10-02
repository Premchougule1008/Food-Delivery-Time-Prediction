# 🍔 Food Delivery Time Prediction

An end-to-end **Machine Learning web application** that predicts food delivery time in minutes based on delivery partner details, distance, traffic, weather, vehicle condition, order type, festival status, and city information.

The project uses **XGBoost Regression** for prediction, **FastAPI** for the REST API, and **HTML, CSS & JavaScript** for the frontend.

## 🚀 Live Demo

**Frontend:**
https://meek-cat-baeed5.netlify.app/

## 🎯 Project Highlights

* Built an end-to-end **ML prediction system** from data preprocessing to deployment.
* Used **XGBoost Regression** for delivery-time prediction.
* Calculated delivery distance using the **Haversine Formula**.
* Implemented feature preprocessing using **StandardScaler** and categorical encoding.
* Developed a **FastAPI REST API** for real-time predictions.
* Built an interactive frontend using **HTML, CSS and JavaScript**.
* Deployed the frontend using **Netlify** and connected it with the backend API.

## 🧠 Machine Learning Workflow

```text
Raw Dataset
     ↓
Data Cleaning & Preprocessing
     ↓
Feature Engineering
     ↓
Distance Calculation
     ↓
Categorical Encoding
     ↓
Feature Scaling
     ↓
XGBoost Regression
     ↓
Model Evaluation
     ↓
FastAPI Deployment
     ↓
Web Application
```

## 📊 Features Used

The model uses important delivery-related features such as:

* Delivery Person Age
* Delivery Person Ratings
* Distance in KM
* Order Hour
* Road Traffic Density
* Vehicle Condition
* Multiple Deliveries
* Type of Order
* Type of Vehicle
* Weather Conditions
* Festival
* City

## 🛠️ Tech Stack

**Languages:**
Python, HTML, CSS, JavaScript

**Machine Learning:**
XGBoost, Scikit-learn

**Data Processing:**
Pandas, NumPy

**Backend:**
FastAPI, Uvicorn, Pydantic

**Model Deployment:**
Joblib, REST API

**Frontend Deployment:**
Netlify

## 🔌 API

The backend provides REST endpoints for health checking and delivery-time prediction.

### Health Check

```http
GET /health
```

### Prediction

```http
POST /predict
```

FastAPI interactive documentation:

```text
http://127.0.0.1:8000/docs
```

## 💻 Run Locally

### Clone Repository

```bash
git clone https://github.com/Premchougule1008/Food-Delivery-Time-Prediction.git
cd Food-Delivery-Time-Prediction
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Start FastAPI Server

```bash
python -m uvicorn main:app --reload
```

API will be available at:

```text
http://127.0.0.1:8000
```

## 📁 Project Structure

```text
Food-Delivery-Time-Prediction/
│
├── main.py
├── xgb_best.pkl
├── standard_scaler.pkl
├── requirements.txt
├── Food delivery.csv
├── Food_Delivery_Time_Prediction.ipynb
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── README.md
```

## 👨‍💻 Author

**Prem Chougule**

GitHub:
https://github.com/Premchougule1008


