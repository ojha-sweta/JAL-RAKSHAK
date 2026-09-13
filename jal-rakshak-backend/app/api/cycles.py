from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.cycle import TreatmentCycle


router = APIRouter()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# CYCLE SERIALIZER
# ============================================================

def serialize_cycle(
    cycle: TreatmentCycle,
) -> dict:

    return {

        "id": cycle.id,

        "device_id": cycle.device_id,

        "cycle_number": cycle.cycle_number,

        "start_time": cycle.start_time,

        "end_time": cycle.end_time,

        "status": cycle.status,

        "reading_count": cycle.reading_count,

        # ----------------------------------------------------
        # POINT A
        # ----------------------------------------------------

        "point_a": {

            "tds": cycle.avg_point_a_tds,

            "turbidity": cycle.avg_point_a_turbidity,

            "temperature": cycle.avg_point_a_temperature,
        },

        # ----------------------------------------------------
        # POINT B
        # ----------------------------------------------------

        "point_b": {

            "ph": cycle.avg_point_b_ph,

            "tds": cycle.avg_point_b_tds,

            "turbidity": cycle.avg_point_b_turbidity,

            "temperature": cycle.avg_point_b_temperature,
        },

        # ----------------------------------------------------
        # FLOW
        # ----------------------------------------------------

        "flow_rate_l_min": (
            cycle.avg_flow_rate_l_min
        ),

        # ----------------------------------------------------
        # EFFICIENCY
        # ----------------------------------------------------

        "tds_removal_efficiency": (
            cycle.tds_removal_efficiency
        ),

        "turbidity_removal_efficiency": (
            cycle.turbidity_removal_efficiency
        ),

        # ----------------------------------------------------
        # FILTER HEALTH
        # ----------------------------------------------------

        "filter_health_score_pct": (
            cycle.filter_health_score_pct
        ),

        # ----------------------------------------------------
        # IMPROVEMENT
        # ----------------------------------------------------

        "efficiency_improvement": (
            cycle.efficiency_improvement
        ),

        "improvement_condition": (
            cycle.improvement_condition
        ),

        # ----------------------------------------------------
        # ML PREDICTIONS
        # ----------------------------------------------------

        "ml": {

            "filter_health": {

                "prediction": (
                    cycle.ml_filter_health_prediction
                ),

                "confidence": (
                    cycle.ml_filter_health_confidence
                ),
            },

            "water_quality": {

                "prediction": (
                    cycle.ml_water_quality_prediction
                ),

                "confidence": (
                    cycle.ml_water_quality_confidence
                ),
            },
        },

        # ----------------------------------------------------
        # BACKEND DECISION
        # ----------------------------------------------------

        "backend_action": (
            cycle.backend_action
        ),
    }


# ============================================================
# GET LATEST CYCLE
# ============================================================

@router.get("/latest")
async def get_latest_cycle(

    device_id: str | None = None,

    db: Session = Depends(get_db),
):

    query = db.query(
        TreatmentCycle
    )

    # --------------------------------------------------------
    # Optional device filter
    # --------------------------------------------------------

    if device_id is not None:

        query = query.filter(
            TreatmentCycle.device_id
            == device_id
        )

    cycle = (

        query

        .order_by(
            TreatmentCycle.cycle_number.desc()
        )

        .first()
    )

    # --------------------------------------------------------
    # No cycle available
    # --------------------------------------------------------

    if cycle is None:

        return {

            "success": False,

            "message": "No cycle data available",

            "data": None,
        }

    # --------------------------------------------------------
    # Return cycle
    # --------------------------------------------------------

    return {

        "success": True,

        "data": serialize_cycle(cycle),
    }


# ============================================================
# GET CYCLE HISTORY
# ============================================================

@router.get("/history")
async def get_cycle_history(

    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),

    device_id: str | None = None,

    db: Session = Depends(get_db),
):

    query = db.query(
        TreatmentCycle
    )

    # --------------------------------------------------------
    # Optional device filter
    # --------------------------------------------------------

    if device_id is not None:

        query = query.filter(
            TreatmentCycle.device_id
            == device_id
        )

    # --------------------------------------------------------
    # Latest cycles first
    # --------------------------------------------------------

    cycles = (

        query

        .order_by(
            TreatmentCycle.cycle_number.desc()
        )

        .limit(limit)

        .all()
    )

    return {

        "success": True,

        "count": len(cycles),

        "limit": limit,

        "data": [

            serialize_cycle(cycle)

            for cycle in cycles

        ],
    }


# ============================================================
# GET CYCLE BY NUMBER
# ============================================================

@router.get("/{cycle_number}")
async def get_cycle(

    cycle_number: int,

    device_id: str | None = None,

    db: Session = Depends(get_db),
):

    query = (

        db.query(TreatmentCycle)

        .filter(

            TreatmentCycle.cycle_number
            == cycle_number
        )
    )

    # --------------------------------------------------------
    # Optional device filter
    # --------------------------------------------------------

    if device_id is not None:

        query = query.filter(

            TreatmentCycle.device_id
            == device_id
        )

    cycle = (

        query

        .order_by(
            TreatmentCycle.id.desc()
        )

        .first()
    )

    # --------------------------------------------------------
    # Not found
    # --------------------------------------------------------

    if cycle is None:

        return {

            "success": False,

            "message": (
                f"Cycle {cycle_number} not found"
            ),

            "data": None,
        }

    return {

        "success": True,

        "data": serialize_cycle(cycle),
    }