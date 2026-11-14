import re
from typing import Dict, List, Any, Optional
import pandas as pd
from app.schemas.dataset import ColumnMapping

class DataValidator:
    PM25_PATTERNS = [r"^pm_?2\.?5$", r"^pm25$", r"^particulate_?25$", r"^fine_?pm$"]
    PM10_PATTERNS = [r"^pm_?10$", r"^particulate_?10$", r"^coarse_?pm$"]
    LOCATION_PATTERNS = [r"^ward(_?no)?$", r"^area$", r"^location$", r"^zone$", r"^region$", r"^suburb$"]
    TIMESTAMP_PATTERNS = [r"^date(_?time)?$", r"^time(stamp)?$", r"^reading_?date$", r"^measured_?at$"]
    STATION_PATTERNS = [r"^station(_?name)?$", r"^monitoring_?station$", r"^site(_?name)?$", r"^sensor(_?id)?$"]
    LAT_PATTERNS = [r"^lat(itude)?$", r"^coord_?lat$"]
    LON_PATTERNS = [r"^lon(gitude)?$", r"^lng$", r"^coord_?lon$"]
    UNIT_PATTERNS = [r"^unit(s)?$", r"^measurement_?unit$"]

    @classmethod
    def match_column(cls, col_name: str, patterns: List[str]) -> bool:
        clean_name = col_name.strip().lower().replace(" ", "_")
        for pattern in patterns:
            if re.match(pattern, clean_name):
                return True
        return False

    @classmethod
    def auto_detect_mapping(cls, columns: List[str]) -> ColumnMapping:
        mapping = ColumnMapping()
        for col in columns:
            if not mapping.pm25_col and cls.match_column(col, cls.PM25_PATTERNS):
                mapping.pm25_col = col
            elif not mapping.pm10_col and cls.match_column(col, cls.PM10_PATTERNS):
                mapping.pm10_col = col
            elif not mapping.location_col and cls.match_column(col, cls.LOCATION_PATTERNS):
                mapping.location_col = col
            elif not mapping.timestamp_col and cls.match_column(col, cls.TIMESTAMP_PATTERNS):
                mapping.timestamp_col = col
            elif not mapping.station_col and cls.match_column(col, cls.STATION_PATTERNS):
                mapping.station_col = col
            elif not mapping.latitude_col and cls.match_column(col, cls.LAT_PATTERNS):
                mapping.latitude_col = col
            elif not mapping.longitude_col and cls.match_column(col, cls.LON_PATTERNS):
                mapping.longitude_col = col
            elif not mapping.unit_col and cls.match_column(col, cls.UNIT_PATTERNS):
                mapping.unit_col = col
        return mapping

    @classmethod
    def validate_file_structure(cls, df: pd.DataFrame) -> Dict[str, Any]:
        if df.empty:
            raise ValueError("The provided file is empty and contains no readable rows.")
        if len(df.columns) < 2:
            raise ValueError("The dataset must contain at least 2 columns (e.g. Ward and PM2.5 reading).")
        return {
            "total_rows": len(df),
            "columns": list(df.columns),
            "sample": df.head(5).to_dict(orient="records")
        }

data_validator = DataValidator()
