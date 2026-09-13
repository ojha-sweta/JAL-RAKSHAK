from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.telemetry import get_db
from app.models.cycle import TreatmentCycle
from app.models.device import Device
from app.models.telemetry import Telemetry
from app.services.notification_service import (
    get_notification_status,
    send_test_notifications,
    send_telegram_message,
    send_twilio_sms,
)

router = APIRouter()


def build_alerts(
    telemetry: Telemetry | None,
    cycle: TreatmentCycle | None,
    device: Device | None,
) -> list[dict]:
    alerts: list[dict] = []

    if device is not None:
        last_heartbeat = device.last_heartbeat

        if device.status == "OFFLINE":
            alerts.append(
                {
                    "id": "device-offline",
                    "severity": "WARNING",
                    "type": "DEVICE",
                    "title": "Device offline",
                    "message": (
                        "JAL-001 is not currently reporting a valid "
                        "heartbeat."
                    ),
                    "source": "DEVICE STATUS",
                    "timestamp": (
                        last_heartbeat.isoformat()
                        if last_heartbeat
                        else None
                    ),
                }
            )

    if cycle is not None:
        action = cycle.backend_action or "NO_ACTION"

        if action == "HOLD":
            alerts.append(
                {
                    "id": f"cycle-{cycle.cycle_number}-hold",
                    "severity": "CRITICAL",
                    "type": "PROCESS",
                    "title": f"Cycle {cycle.cycle_number} on HOLD",
                    "message": (
                        "TDS removal efficiency decreased compared with "
                        "the previous completed cycle."
                    ),
                    "source": "BACKEND DECISION ENGINE",
                    "timestamp": (
                        cycle.end_time.isoformat()
                        if cycle.end_time
                        else None
                    ),
                }
            )

        elif action == "OPTIMIZE":
            improvement = cycle.efficiency_improvement

            alerts.append(
                {
                    "id": f"cycle-{cycle.cycle_number}-optimize",
                    "severity": "WARNING",
                    "type": "PROCESS",
                    "title": f"Cycle {cycle.cycle_number} needs optimization",
                    "message": (
                        "Efficiency improvement is at or below the "
                        "8 percentage-point optimization threshold."
                        + (
                            f" Current improvement: {improvement:.2f} pp."
                            if improvement is not None
                            else ""
                        )
                    ),
                    "source": "BACKEND DECISION ENGINE",
                    "timestamp": (
                        cycle.end_time.isoformat()
                        if cycle.end_time
                        else None
                    ),
                }
            )

    if telemetry is not None:
        ph = telemetry.point_b_ph
        tds = telemetry.point_b_tds
        turbidity = telemetry.point_b_turbidity

        if ph < 5.5 or ph > 9.0:
            alerts.append(
                {
                    "id": "quality-ph-critical",
                    "severity": "CRITICAL",
                    "type": "WATER QUALITY",
                    "title": "Critical Point B pH",
                    "message": f"Treated-water pH is {ph:.2f}.",
                    "source": "POINT B SENSOR",
                    "timestamp": telemetry.timestamp.isoformat(),
                }
            )

        if tds > 1000:
            alerts.append(
                {
                    "id": "quality-tds-critical",
                    "severity": "CRITICAL",
                    "type": "WATER QUALITY",
                    "title": "Critical Point B TDS",
                    "message": f"Treated-water TDS is {tds:.0f} ppm.",
                    "source": "POINT B SENSOR",
                    "timestamp": telemetry.timestamp.isoformat(),
                }
            )

        if turbidity > 10:
            alerts.append(
                {
                    "id": "quality-turbidity-critical",
                    "severity": "CRITICAL",
                    "type": "WATER QUALITY",
                    "title": "Critical Point B turbidity",
                    "message": (
                        f"Treated-water turbidity is {turbidity:.2f} NTU."
                    ),
                    "source": "POINT B SENSOR",
                    "timestamp": telemetry.timestamp.isoformat(),
                }
            )

    severity_order = {
        "CRITICAL": 0,
        "WARNING": 1,
        "INFO": 2,
    }

    alerts.sort(
        key=lambda item: severity_order.get(item["severity"], 9)
    )

    return alerts


@router.get("")
async def get_alerts(
    db: Session = Depends(get_db),
):
    telemetry = (
        db.query(Telemetry)
        .order_by(Telemetry.timestamp.desc())
        .first()
    )

    cycle = (
        db.query(TreatmentCycle)
        .order_by(TreatmentCycle.cycle_number.desc())
        .first()
    )

    device = (
        db.query(Device)
        .filter(Device.device_id == "JAL-001")
        .first()
    )

    alerts = build_alerts(
        telemetry=telemetry,
        cycle=cycle,
        device=device,
    )

    return {
        "success": True,
        "timestamp": datetime.utcnow(),
        "alerts": alerts,
        "count": len(alerts),
        "notifications": get_notification_status(),
    }


@router.get("/notification-status")
async def notification_status():
    return {
        "success": True,
        "notifications": get_notification_status(),
    }


@router.post("/test")
async def test_notifications():
    result = send_test_notifications()

    return {
        "success": result.get("enabled", False)
        and (
            result["telegram"].get("success", False)
            or result["twilio"].get("success", False)
        ),
        "result": result,
    }


@router.post("/test/telegram")
async def test_telegram():
    result = send_telegram_message(
        "JAL-RAKSHAK TEST\n\nTelegram alert channel is connected."
    )

    return {
        "success": result.get("success", False),
        "result": result,
    }


@router.post("/test/twilio")
async def test_twilio():
    result = send_twilio_sms(
        "JAL-RAKSHAK TEST: Twilio SMS alert channel is connected."
    )

    return {
        "success": result.get("success", False),
        "result": result,
    }
