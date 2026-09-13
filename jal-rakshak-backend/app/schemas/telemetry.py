from datetime import datetime

from pydantic import BaseModel, Field


class PointAReading(BaseModel):
    tds: float = Field(..., ge=0)
    turbidity: float = Field(..., ge=0)
    temperature: float


class PointBReading(BaseModel):
    ph: float = Field(..., ge=0, le=14)
    tds: float = Field(..., ge=0)
    turbidity: float = Field(..., ge=0)
    temperature: float


class TelemetryPayload(BaseModel):
    device_id: str = Field(..., min_length=1)
    timestamp: datetime

    point_a: PointAReading
    point_b: PointBReading

    flow_rate: float = Field(..., ge=0, le=2)

    pump_status: bool