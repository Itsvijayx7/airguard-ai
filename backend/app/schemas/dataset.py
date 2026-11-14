from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ColumnMapping(BaseModel):
    timestamp_col: Optional[str] = None
    location_col: Optional[str] = None
    pm25_col: Optional[str] = None
    pm10_col: Optional[str] = None
    station_col: Optional[str] = None
    latitude_col: Optional[str] = None
    longitude_col: Optional[str] = None
    unit_col: Optional[str] = None

class FlaggedRecord(BaseModel):
    row_index: int
    raw_data: Dict[str, Any]
    issue_type: str  # 'missing_pm25', 'missing_pm10', 'suspicious_high', 'suspicious_negative', 'duplicate', 'unknown_unit', 'invalid_date'
    description: str
    suggested_action: str
    severity: str = "warning"  # 'info', 'warning', 'danger'

class DataQualitySummary(BaseModel):
    total_records: int = 0
    valid_records: int = 0
    missing_measurements: int = 0
    duplicate_records: int = 0
    suspicious_readings: int = 0
    unknown_units: int = 0
    invalid_dates: int = 0
    completeness_percentage: float = 0.0
    quality_score: float = 0.0  # 0 to 100
    grade: str = "A"  # A, B, C, D, F

class DatasetMetadata(BaseModel):
    id: str
    filename: str
    file_type: str
    uploaded_at: str
    total_rows: int
    detected_columns: List[str]
    column_mapping: ColumnMapping
    is_demo_data: bool = False
    data_quality: Optional[DataQualitySummary] = None

class DatasetUploadResponse(BaseModel):
    dataset_id: str
    filename: str
    total_rows: int
    detected_columns: List[str]
    suggested_mapping: ColumnMapping
    sample_preview: List[Dict[str, Any]]
    message: str

class DatasetValidationRequest(BaseModel):
    confirmed_mapping: ColumnMapping

class DatasetValidationResponse(BaseModel):
    dataset_id: str
    quality_summary: DataQualitySummary
    flagged_records_sample: List[FlaggedRecord]
    total_flagged_count: int
    status: str
    message: str
