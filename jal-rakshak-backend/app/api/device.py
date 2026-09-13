from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal

from app.models.device import Device
from app.models.command import DeviceCommand

from app.services.command_engine import (
    get_next_pending_command,
    acknowledge_command,
)


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
# DEVICE HEARTBEAT
# ============================================================

@router.post("/heartbeat")
async def device_heartbeat(
    device_id: str,
    db: Session = Depends(get_db),
):

    device = (
        db.query(Device)
        .filter(
            Device.device_id == device_id
        )
        .first()
    )

    # --------------------------------------------------------
    # Register device if it does not exist.
    # --------------------------------------------------------

    if device is None:

        device = Device(
            device_id=device_id,
            status="ONLINE",
            wifi_connected=True,
            last_heartbeat=datetime.utcnow(),
        )

        db.add(device)

    else:

        device.status = "ONLINE"

        device.wifi_connected = True

        device.last_heartbeat = (
            datetime.utcnow()
        )

    db.commit()

    return {
        "success": True,
        "device_id": device.device_id,
        "status": device.status,
        "wifi_connected": device.wifi_connected,
        "last_heartbeat": device.last_heartbeat,
    }


# ============================================================
# DEVICE STATUS
# ============================================================

@router.get("/{device_id}/status")
async def get_device_status(
    device_id: str,
    db: Session = Depends(get_db),
):

    device = (
        db.query(Device)
        .filter(
            Device.device_id == device_id
        )
        .first()
    )

    if device is None:

        return {
            "success": False,
            "message": "Device not found",
        }

    # --------------------------------------------------------
    # Mark device offline if heartbeat is older than 30 sec.
    # --------------------------------------------------------

    status = device.status

    if device.last_heartbeat is not None:

        elapsed_seconds = (
            datetime.utcnow()
            - device.last_heartbeat
        ).total_seconds()

        if elapsed_seconds > 30:

            status = "OFFLINE"

            device.status = "OFFLINE"

            device.wifi_connected = False

            db.commit()

    return {
        "success": True,
        "device": {
            "device_id": device.device_id,
            "status": status,
            "wifi_connected": device.wifi_connected,
            "last_heartbeat": device.last_heartbeat,
            "last_telemetry": device.last_telemetry,
            "firmware_version": device.firmware_version,
            "ip_address": device.ip_address,
        },
    }


# ============================================================
# GET NEXT DEVICE COMMAND
# ============================================================

@router.get("/{device_id}/command")
async def get_device_command(
    device_id: str,
    db: Session = Depends(get_db),
):

    command = get_next_pending_command(
        db=db,
        device_id=device_id,
    )

    # --------------------------------------------------------
    # No command available
    # --------------------------------------------------------

    if command is None:

        return {
            "success": True,
            "command_available": False,
            "message": "No pending command",
        }

    # --------------------------------------------------------
    # Return pending command
    # --------------------------------------------------------

    return {
        "success": True,
        "command_available": True,

        "command": {
            "id": command.id,
            "device_id": command.device_id,
            "command": command.command,
            "status": command.status,
            "cycle_number": command.cycle_number,
            "created_at": command.created_at,
        },
    }


# ============================================================
# COMMAND ACKNOWLEDGEMENT
# ============================================================

@router.post("/{device_id}/command/ack")
async def acknowledge_device_command(
    device_id: str,
    command_id: int,
    status: str,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Validate status
    # --------------------------------------------------------

    allowed_statuses = {
        "EXECUTED",
        "FAILED",
    }

    if status not in allowed_statuses:

        return {
            "success": False,
            "message": (
                "Invalid command status. "
                "Use EXECUTED or FAILED."
            ),
        }

    # --------------------------------------------------------
    # Find command
    # --------------------------------------------------------

    command = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.id == command_id,
            DeviceCommand.device_id == device_id,
        )
        .first()
    )

    if command is None:

        return {
            "success": False,
            "message": "Command not found",
        }

    # --------------------------------------------------------
    # Prevent duplicate ACK
    # --------------------------------------------------------

    if command.status in {
        "EXECUTED",
        "FAILED",
    }:

        return {
            "success": True,
            "message": "Command already acknowledged",
            "command": {
                "id": command.id,
                "command": command.command,
                "status": command.status,
                "cycle_number": command.cycle_number,
                "executed_at": command.executed_at,
            },
        }

    # --------------------------------------------------------
    # Update command
    # --------------------------------------------------------

    acknowledge_command(
        db=db,
        command=command,
        status=status,
    )

    db.commit()

    return {
        "success": True,
        "message": "Command acknowledged",
        "command": {
            "id": command.id,
            "device_id": command.device_id,
            "command": command.command,
            "status": command.status,
            "cycle_number": command.cycle_number,
            "created_at": command.created_at,
            "executed_at": command.executed_at,
        },
    }