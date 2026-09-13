from pathlib import Path
from typing import Any

import pandas as pd
from catboost import CatBoostClassifier


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_DIR = BASE_DIR / "ml" / "models"

FILTER_HEALTH_MODEL_PATH = MODEL_DIR / "filter_health_model.cbm"
WATER_QUALITY_MODEL_PATH = MODEL_DIR / "water_quality_model.cbm"


# ============================================================
# FEATURE DEFINITIONS
# ============================================================

FILTER_HEALTH_FEATURES = [
    "Raw_TDS_ppm",
    "Raw_Turbidity_NTU",
    "Raw_Temperature_C",
    "Treated_TDS_ppm",
    "Treated_Turbidity_NTU",
    "Treated_pH",
    "Treated_Temperature_C",
    "Flow_Rate_L_min",
    "TDS_Removal_Efficiency_pct",
    "Turbidity_Removal_Efficiency_pct",
    "Temperature_Difference_C",
    "Previous_TDS_Efficiency_pct",
    "Efficiency_Improvement_pp",
    "Rolling_3Cycle_Avg_Efficiency_pct",
    "Efficiency_Trend_pct",
    "Previous_Turbidity_Efficiency_pct",
    "Rolling_3Cycle_Avg_Turbidity_Efficiency_pct",
    "Cycle_Number",
]


WATER_QUALITY_FEATURES = [
    "Raw_TDS_ppm",
    "Raw_Turbidity_NTU",
    "Raw_Temperature_C",
    "Treated_TDS_ppm",
    "Treated_Turbidity_NTU",
    "Treated_pH",
    "Treated_Temperature_C",
    "TDS_Removal_Efficiency_pct",
    "Turbidity_Removal_Efficiency_pct",
    "Temperature_Difference_C",
]


# ============================================================
# MODEL LOADING
# ============================================================

_filter_health_model = None
_water_quality_model = None


def load_models() -> None:
    """
    Load both CatBoost models into memory.
    Models are loaded once when the service starts.
    """

    global _filter_health_model
    global _water_quality_model

    if not FILTER_HEALTH_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Filter Health model not found: "
            f"{FILTER_HEALTH_MODEL_PATH}"
        )

    if not WATER_QUALITY_MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Water Quality model not found: "
            f"{WATER_QUALITY_MODEL_PATH}"
        )

    _filter_health_model = CatBoostClassifier()
    _filter_health_model.load_model(
        str(FILTER_HEALTH_MODEL_PATH)
    )

    _water_quality_model = CatBoostClassifier()
    _water_quality_model.load_model(
        str(WATER_QUALITY_MODEL_PATH)
    )

    print("JAL-RAKSHAK ML models loaded successfully.")


# ============================================================
# INTERNAL VALIDATION
# ============================================================

def _validate_features(
    features: dict[str, Any],
    required_features: list[str],
) -> None:

    missing_features = [
        feature
        for feature in required_features
        if feature not in features
    ]

    if missing_features:
        raise ValueError(
            "Missing ML features: "
            + ", ".join(missing_features)
        )


# ============================================================
# FILTER HEALTH PREDICTION
# ============================================================

def predict_filter_health(
    features: dict[str, Any],
) -> dict[str, Any]:

    if _filter_health_model is None:
        load_models()

    _validate_features(
        features,
        FILTER_HEALTH_FEATURES,
    )

    input_data = pd.DataFrame(
        [[features[f] for f in FILTER_HEALTH_FEATURES]],
        columns=FILTER_HEALTH_FEATURES,
    )

    prediction = _filter_health_model.predict(input_data)

    predicted_class = str(prediction[0][0])

    probabilities = _filter_health_model.predict_proba(
        input_data
    )[0]

    class_names = _filter_health_model.classes_

    class_probabilities = {
        str(class_name): float(probability)
        for class_name, probability
        in zip(class_names, probabilities)
    }

    confidence = max(class_probabilities.values())

    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 2),
        "probabilities": {
            class_name: round(probability * 100, 2)
            for class_name, probability
            in class_probabilities.items()
        },
    }


# ============================================================
# WATER QUALITY PREDICTION
# ============================================================

def predict_water_quality(
    features: dict[str, Any],
) -> dict[str, Any]:

    if _water_quality_model is None:
        load_models()

    _validate_features(
        features,
        WATER_QUALITY_FEATURES,
    )

    input_data = pd.DataFrame(
        [[features[f] for f in WATER_QUALITY_FEATURES]],
        columns=WATER_QUALITY_FEATURES,
    )

    prediction = _water_quality_model.predict(input_data)

    predicted_class = str(prediction[0][0])

    probabilities = _water_quality_model.predict_proba(
        input_data
    )[0]

    class_names = _water_quality_model.classes_

    class_probabilities = {
        str(class_name): float(probability)
        for class_name, probability
        in zip(class_names, probabilities)
    }

    confidence = max(class_probabilities.values())

    return {
        "prediction": predicted_class,
        "confidence": round(confidence * 100, 2),
        "probabilities": {
            class_name: round(probability * 100, 2)
            for class_name, probability
            in class_probabilities.items()
        },
    }


# ============================================================
# COMBINED PREDICTION
# ============================================================

def predict_jal_rakshak(
    filter_features: dict[str, Any],
    water_features: dict[str, Any],
) -> dict[str, Any]:

    filter_result = predict_filter_health(
        filter_features
    )

    water_result = predict_water_quality(
        water_features
    )

    return {
        "filter_health": filter_result,
        "water_quality": water_result,
    }