from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ml_service import (
    predict_jal_rakshak,
)


router = APIRouter()


# ============================================================
# REQUEST SCHEMA
# ============================================================

class MLPredictionRequest(BaseModel):
    """
    Input data required by both JAL-RAKSHAK ML models.
    """

    # --------------------------------------------------------
    # Raw / Point A
    # --------------------------------------------------------

    raw_tds_ppm: float = Field(..., ge=0)
    raw_turbidity_ntu: float = Field(..., ge=0)
    raw_temperature_c: float

    # --------------------------------------------------------
    # Treated / Point B
    # --------------------------------------------------------

    treated_tds_ppm: float = Field(..., ge=0)
    treated_turbidity_ntu: float = Field(..., ge=0)
    treated_ph: float = Field(..., ge=0, le=14)
    treated_temperature_c: float

    # --------------------------------------------------------
    # Process
    # --------------------------------------------------------

    flow_rate_l_min: float = Field(..., ge=0, le=2)

    # --------------------------------------------------------
    # Efficiency
    # --------------------------------------------------------

    tds_removal_efficiency_pct: float
    turbidity_removal_efficiency_pct: float
    temperature_difference_c: float

    # --------------------------------------------------------
    # Historical / Cycle Features
    # --------------------------------------------------------

    previous_tds_efficiency_pct: float
    efficiency_improvement_pp: float
    rolling_3cycle_avg_efficiency_pct: float
    efficiency_trend_pct: float

    previous_turbidity_efficiency_pct: float
    rolling_3cycle_avg_turbidity_efficiency_pct: float

    cycle_number: int = Field(..., ge=1)


# ============================================================
# RESPONSE SCHEMA
# ============================================================

class PredictionResult(BaseModel):
    prediction: str
    confidence: float
    probabilities: dict[str, float]


class MLPredictionResponse(BaseModel):
    filter_health: PredictionResult
    water_quality: PredictionResult


# ============================================================
# ML PREDICTION ENDPOINT
# ============================================================

@router.post(
    "/predict",
    response_model=MLPredictionResponse,
)
def predict_ml(
    payload: MLPredictionRequest,
):
    """
    Run both JAL-RAKSHAK CatBoost models.

    Returns:
    - Filter Health prediction + confidence
    - Water Quality prediction + confidence
    """

    try:

        # ----------------------------------------------------
        # Convert API payload to ML feature names
        # ----------------------------------------------------

        filter_features = {
            "Raw_TDS_ppm": payload.raw_tds_ppm,
            "Raw_Turbidity_NTU": payload.raw_turbidity_ntu,
            "Raw_Temperature_C": payload.raw_temperature_c,

            "Treated_TDS_ppm": payload.treated_tds_ppm,
            "Treated_Turbidity_NTU": payload.treated_turbidity_ntu,
            "Treated_pH": payload.treated_ph,
            "Treated_Temperature_C": payload.treated_temperature_c,

            "Flow_Rate_L_min": payload.flow_rate_l_min,

            "TDS_Removal_Efficiency_pct":
                payload.tds_removal_efficiency_pct,

            "Turbidity_Removal_Efficiency_pct":
                payload.turbidity_removal_efficiency_pct,

            "Temperature_Difference_C":
                payload.temperature_difference_c,

            "Previous_TDS_Efficiency_pct":
                payload.previous_tds_efficiency_pct,

            "Efficiency_Improvement_pp":
                payload.efficiency_improvement_pp,

            "Rolling_3Cycle_Avg_Efficiency_pct":
                payload.rolling_3cycle_avg_efficiency_pct,

            "Efficiency_Trend_pct":
                payload.efficiency_trend_pct,

            "Previous_Turbidity_Efficiency_pct":
                payload.previous_turbidity_efficiency_pct,

            "Rolling_3Cycle_Avg_Turbidity_Efficiency_pct":
                payload.rolling_3cycle_avg_turbidity_efficiency_pct,

            "Cycle_Number":
                payload.cycle_number,
        }


        # ----------------------------------------------------
        # Water Quality features
        # ----------------------------------------------------

        water_features = {
            "Raw_TDS_ppm": payload.raw_tds_ppm,
            "Raw_Turbidity_NTU": payload.raw_turbidity_ntu,
            "Raw_Temperature_C": payload.raw_temperature_c,

            "Treated_TDS_ppm": payload.treated_tds_ppm,
            "Treated_Turbidity_NTU": payload.treated_turbidity_ntu,
            "Treated_pH": payload.treated_ph,
            "Treated_Temperature_C": payload.treated_temperature_c,

            "TDS_Removal_Efficiency_pct":
                payload.tds_removal_efficiency_pct,

            "Turbidity_Removal_Efficiency_pct":
                payload.turbidity_removal_efficiency_pct,

            "Temperature_Difference_C":
                payload.temperature_difference_c,
        }


        # ----------------------------------------------------
        # Run models
        # ----------------------------------------------------

        result = predict_jal_rakshak(
            filter_features=filter_features,
            water_features=water_features,
        )

        return result


    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"ML prediction failed: {str(exc)}",
        )