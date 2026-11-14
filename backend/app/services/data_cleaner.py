import math
from typing import Dict, List, Any, Tuple
import pandas as pd
import numpy as np
from app.schemas.dataset import ColumnMapping, FlaggedRecord, DataQualitySummary

class DataCleaner:
    @classmethod
    def clean_and_audit(
        cls, df_raw: pd.DataFrame, mapping: ColumnMapping
    ) -> Tuple[pd.DataFrame, DataQualitySummary, List[FlaggedRecord]]:
        df = df_raw.copy()
        # Keep track of original 1-based row index (for humans/auditing)
        df["_original_row_idx"] = range(1, len(df) + 1)
        df["is_suspicious"] = False
        df["suspicion_reason"] = ""
        df["is_valid_reading"] = True

        flagged_records: List[FlaggedRecord] = []
        total_records = len(df)
        missing_count = 0
        duplicate_count = 0
        suspicious_count = 0
        unknown_units_count = 0
        invalid_dates_count = 0

        # 1. Location handling
        loc_col = mapping.location_col
        if loc_col and loc_col in df.columns:
            df["_ward_clean"] = df[loc_col].astype(str).str.strip()
            # If location is null or 'nan'
            null_loc_mask = df["_ward_clean"].str.lower().isin(["nan", "null", "none", "", "unknown"])
            for idx in df[null_loc_mask].index:
                row_num = int(df.loc[idx, "_original_row_idx"])
                flagged_records.append(
                    FlaggedRecord(
                        row_index=row_num,
                        raw_data=df_raw.iloc[idx].to_dict(),
                        issue_type="missing_location",
                        description=f"Missing or invalid location at row {row_num}",
                        suggested_action="Verify monitoring station address or designate unassigned zone",
                        severity="warning",
                    )
                )
                df.loc[idx, "_ward_clean"] = "Unassigned Ward"
        else:
            df["_ward_clean"] = "General Monitored Area"

        # 2. Timestamp normalization
        time_col = mapping.timestamp_col
        if time_col and time_col in df.columns:
            df["_timestamp_clean"] = pd.to_datetime(df[time_col], errors="coerce")
            invalid_date_mask = df["_timestamp_clean"].isna()
            invalid_dates_count = int(invalid_date_mask.sum())
            for idx in df[invalid_date_mask].index:
                row_num = int(df.loc[idx, "_original_row_idx"])
                flagged_records.append(
                    FlaggedRecord(
                        row_index=row_num,
                        raw_data=df_raw.iloc[idx].to_dict(),
                        issue_type="invalid_date",
                        description=f"Unparseable date/time format '{df.loc[idx, time_col]}' at row {row_num}",
                        suggested_action="Convert date to standard ISO 8601 (YYYY-MM-DD)",
                        severity="warning",
                    )
                )
        else:
            # Default timestamp if missing in dataset
            df["_timestamp_clean"] = pd.Timestamp.now()

        # 3. Unit Normalization
        unit_col = mapping.unit_col
        df["_pm25_unit"] = "µg/m³"
        df["_unit_multiplier"] = 1.0

        if unit_col and unit_col in df.columns:
            for idx in df.index:
                u = str(df.loc[idx, unit_col]).strip().lower()
                row_num = int(df.loc[idx, "_original_row_idx"])
                if u in ["mg/m3", "mg/m^3", "milligrams/m3"]:
                    df.loc[idx, "_unit_multiplier"] = 1000.0  # 1 mg = 1000 ug
                elif u in ["ppm", "ppb"]:
                    unknown_units_count += 1
                    df.loc[idx, "is_suspicious"] = True
                    df.loc[idx, "suspicion_reason"] = f"Unit '{u}' cannot be converted to µg/m³ without particulate molecular weight"
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="unknown_unit",
                            description=f"Particulate reading specified in '{u}'. Particulates require gravimetric µg/m³.",
                            suggested_action="Recalibrate sensor output to gravimetric µg/m³",
                            severity="danger",
                        )
                    )

        # 4. PM2.5 validation
        pm25_col = mapping.pm25_col
        if pm25_col and pm25_col in df.columns:
            df["_pm25_raw"] = pd.to_numeric(df[pm25_col], errors="coerce")
            df["_pm25_clean"] = df["_pm25_raw"] * df["_unit_multiplier"]

            for idx in df.index:
                val = df.loc[idx, "_pm25_clean"]
                row_num = int(df.loc[idx, "_original_row_idx"])
                if pd.isna(val):
                    missing_count += 1
                    df.loc[idx, "is_valid_reading"] = False
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="missing_pm25",
                            description=f"Missing PM2.5 numerical reading at row {row_num}",
                            suggested_action="Check monitoring station connectivity during this timestamp",
                            severity="warning",
                        )
                    )
                elif val < 0:
                    suspicious_count += 1
                    df.loc[idx, "is_suspicious"] = True
                    df.loc[idx, "suspicion_reason"] = "Negative particulate reading indicates sensor zero-drift error"
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="suspicious_negative",
                            description=f"Negative PM2.5 measurement ({val} µg/m³) at row {row_num}",
                            suggested_action="Zero-calibrate optical sensor optical chamber",
                            severity="danger",
                        )
                    )
                elif val > 950:
                    suspicious_count += 1
                    df.loc[idx, "is_suspicious"] = True
                    df.loc[idx, "suspicion_reason"] = f"Extreme spike ({val} µg/m³) exceeds sensor linear dynamic range"
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="suspicious_high",
                            description=f"Suspicious PM2.5 spike of {val:.1f} µg/m³ at row {row_num}",
                            suggested_action="Inspect sensor for optical chamber obstruction or local smoke flare",
                            severity="danger",
                        )
                    )
        else:
            df["_pm25_clean"] = np.nan

        # 5. PM10 validation
        pm10_col = mapping.pm10_col
        if pm10_col and pm10_col in df.columns:
            df["_pm10_raw"] = pd.to_numeric(df[pm10_col], errors="coerce")
            df["_pm10_clean"] = df["_pm10_raw"] * df["_unit_multiplier"]
            for idx in df.index:
                val = df.loc[idx, "_pm10_clean"]
                row_num = int(df.loc[idx, "_original_row_idx"])
                if pd.isna(val):
                    # Flag only if PM25 is also valid (avoid double-penalizing completely empty rows)
                    pass
                elif val < 0:
                    suspicious_count += 1
                    df.loc[idx, "is_suspicious"] = True
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="suspicious_negative",
                            description=f"Negative PM10 reading ({val} µg/m³) at row {row_num}",
                            suggested_action="Check sensor baseline calibration",
                            severity="danger",
                        )
                    )
                elif val > 1500:
                    suspicious_count += 1
                    df.loc[idx, "is_suspicious"] = True
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="suspicious_high",
                            description=f"Extreme PM10 spike ({val:.1f} µg/m³) at row {row_num}",
                            suggested_action="Verify nearby road construction or heavy demolition",
                            severity="danger",
                        )
                    )
        else:
            # If no PM10 column, estimate from PM2.5 if available (PM10 is typically ~1.6x PM2.5 in urban dust conditions)
            # but mark it clearly
            df["_pm10_clean"] = df["_pm25_clean"] * 1.6

        # 6. Duplicate detection
        dup_cols = ["_ward_clean"]
        if time_col and time_col in df.columns:
            dup_cols.append("_timestamp_clean")
        dups_mask = df.duplicated(subset=dup_cols, keep=False)
        duplicate_count = int(dups_mask.sum())
        for idx in df[dups_mask].index:
            row_num = int(df.loc[idx, "_original_row_idx"])
            flagged_records.append(
                FlaggedRecord(
                    row_index=row_num,
                    raw_data=df_raw.iloc[idx].to_dict(),
                    issue_type="duplicate",
                    description=f"Duplicate reading detected for {df.loc[idx, '_ward_clean']} at row {row_num}",
                    suggested_action="Keep the primary transmission reading or average concurrent telemetry bursts",
                    severity="info",
                )
            )

        # 7. Coordinates resolution (if available)
        lat_col = mapping.latitude_col
        lon_col = mapping.longitude_col
        if lat_col and lat_col in df.columns and lon_col and lon_col in df.columns:
            df["_latitude"] = pd.to_numeric(df[lat_col], errors="coerce")
            df["_longitude"] = pd.to_numeric(df[lon_col], errors="coerce")
        else:
            df["_latitude"] = np.nan
            df["_longitude"] = np.nan

        # Station column
        station_col = mapping.station_col
        if station_col and station_col in df.columns:
            df["_station"] = df[station_col].astype(str)
        else:
            df["_station"] = df["_ward_clean"] + " Station"

        # Calculate Data Quality Metrics
        valid_records = int((df["is_valid_reading"] & (~df["is_suspicious"])).sum())
        completeness = round((valid_records / max(total_records, 1)) * 100, 1)

        # Score formulation: starts at 100, penalizes missing (-2 each), duplicates (-1 each), suspicious (-3 each)
        penalty = (missing_count * 2.0) + (duplicate_count * 1.0) + (suspicious_count * 3.0) + (invalid_dates_count * 2.0)
        max_penalty = total_records * 2.5
        penalty_ratio = min(penalty / max(max_penalty, 1), 1.0)
        quality_score = round(max(100.0 * (1.0 - penalty_ratio), 12.0), 1)

        if quality_score >= 88:
            grade = "A"
        elif quality_score >= 75:
            grade = "B"
        elif quality_score >= 60:
            grade = "C"
        elif quality_score >= 45:
            grade = "D"
        else:
            grade = "F"

        quality_summary = DataQualitySummary(
            total_records=total_records,
            valid_records=valid_records,
            missing_measurements=missing_count,
            duplicate_records=duplicate_count,
            suspicious_readings=suspicious_count,
            unknown_units=unknown_units_count,
            invalid_dates=invalid_dates_count,
            completeness_percentage=completeness,
            quality_score=quality_score,
            grade=grade,
        )

        return df, quality_summary, flagged_records

data_cleaner = DataCleaner()
