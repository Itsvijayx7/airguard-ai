"""
Data Cleaner and Audit Service for AirGuard AI.

Provides high-performance, vectorized data sanitization, schema alignment,
and deterministic anomaly auditing for municipal environmental datasets.
"""

from typing import Dict, List, Any, Tuple, Optional
import numpy as np
import pandas as pd

from app.schemas.dataset import ColumnMapping, FlaggedRecord, DataQualitySummary


class DataCleaner:
    """High-performance vectorized dataset cleaner and quality auditing engine."""

    @classmethod
    def clean_and_audit(
        cls, df_raw: pd.DataFrame, mapping: ColumnMapping
    ) -> Tuple[pd.DataFrame, DataQualitySummary, List[FlaggedRecord]]:
        """Clean and audit messy environmental datasets using vectorized operations.

        Args:
            df_raw: Raw input DataFrame from CSV, Excel, or JSON.
            mapping: Confirmed column mapping identifying key pollutant and location columns.

        Returns:
            Tuple containing:
                - pd.DataFrame: Cleaned DataFrame with standardized internal columns.
                - DataQualitySummary: Comprehensive audit metrics and data quality score.
                - List[FlaggedRecord]: Detailed list of flagged records for evidence traceability.
        """
        df = df_raw.copy()
        total_records = len(df)

        # Vectorized 1-based index assignment
        df["_original_row_idx"] = np.arange(1, total_records + 1)
        df["is_suspicious"] = False
        df["suspicion_reason"] = ""
        df["is_valid_reading"] = True

        flagged_records: List[FlaggedRecord] = []
        missing_count = 0
        duplicate_count = 0
        suspicious_count = 0
        unknown_units_count = 0
        invalid_dates_count = 0

        # -------------------------------------------------------------
        # 1. Location Sanitization
        # -------------------------------------------------------------
        loc_col = mapping.location_col
        if loc_col and loc_col in df.columns:
            df["_ward_clean"] = df[loc_col].astype(str).str.strip()
            null_loc_mask = df["_ward_clean"].str.lower().isin(
                ["nan", "null", "none", "", "unknown"]
            )
            if null_loc_mask.any():
                flagged_rows = df[null_loc_mask]
                for idx, row in flagged_rows.iterrows():
                    row_num = int(row["_original_row_idx"])
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="missing_location",
                            description=f"Missing or unassigned location identifier at row {row_num}",
                            suggested_action="Assign ward identifier or route to unassigned municipal buffer",
                            severity="warning",
                        )
                    )
                df.loc[null_loc_mask, "_ward_clean"] = "Unassigned Ward"
        else:
            df["_ward_clean"] = "General Monitored Area"

        # -------------------------------------------------------------
        # 2. Vectorized Timestamp Normalization
        # -------------------------------------------------------------
        time_col = mapping.timestamp_col
        if time_col and time_col in df.columns:
            df["_timestamp_clean"] = pd.to_datetime(df[time_col], errors="coerce")
            invalid_date_mask = df["_timestamp_clean"].isna()
            invalid_dates_count = int(invalid_date_mask.sum())
            if invalid_date_mask.any():
                flagged_dates = df[invalid_date_mask]
                for idx, row in flagged_dates.iterrows():
                    row_num = int(row["_original_row_idx"])
                    raw_val = str(df.loc[idx, time_col])
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="invalid_date",
                            description=f"Unparseable date/time '{raw_val}' at row {row_num}",
                            suggested_action="Convert date to standard ISO 8601 (YYYY-MM-DD)",
                            severity="warning",
                        )
                    )
        else:
            df["_timestamp_clean"] = pd.Timestamp.now()

        # -------------------------------------------------------------
        # 3. Vectorized Unit Normalization
        # -------------------------------------------------------------
        unit_col = mapping.unit_col
        df["_pm25_unit"] = "µg/m³"
        df["_unit_multiplier"] = 1.0

        if unit_col and unit_col in df.columns:
            unit_series = df[unit_col].astype(str).str.strip().str.lower()

            # Vectorized mapping for metric units
            mg_mask = unit_series.isin(["mg/m3", "mg/m^3", "milligrams/m3"])
            df.loc[mg_mask, "_unit_multiplier"] = 1000.0

            # Flag volumetric gas units (ppm/ppb) as unconvertible for particulates
            ppm_mask = unit_series.isin(["ppm", "ppb"])
            unknown_units_count = int(ppm_mask.sum())
            if ppm_mask.any():
                df.loc[ppm_mask, "is_suspicious"] = True
                df.loc[
                    ppm_mask, "suspicion_reason"
                ] = "Volumetric unit cannot be converted to gravimetric µg/m³"
                for idx, row in df[ppm_mask].iterrows():
                    row_num = int(row["_original_row_idx"])
                    u_val = str(row[unit_col])
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="unknown_unit",
                            description=f"Particulate reading specified in '{u_val}' at row {row_num}. Gravimetric µg/m³ required.",
                            suggested_action="Recalibrate sensor telemetry to gravimetric µg/m³",
                            severity="danger",
                        )
                    )

        # -------------------------------------------------------------
        # 4. Vectorized PM2.5 Validation & Anomaly Detection
        # -------------------------------------------------------------
        pm25_col = mapping.pm25_col
        if pm25_col and pm25_col in df.columns:
            df["_pm25_raw"] = pd.to_numeric(df[pm25_col], errors="coerce")
            df["_pm25_clean"] = df["_pm25_raw"] * df["_unit_multiplier"]

            # Vectorized masks
            missing_mask = df["_pm25_clean"].isna()
            negative_mask = (~missing_mask) & (df["_pm25_clean"] < 0)
            spike_mask = (~missing_mask) & (df["_pm25_clean"] > 950)

            missing_count = int(missing_mask.sum())
            df.loc[missing_mask, "is_valid_reading"] = False

            if missing_mask.any():
                for idx, row in df[missing_mask].iterrows():
                    row_num = int(row["_original_row_idx"])
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="missing_pm25",
                            description=f"Missing PM2.5 numerical reading at row {row_num}",
                            suggested_action="Check monitoring station connectivity during timestamp",
                            severity="warning",
                        )
                    )

            if negative_mask.any():
                suspicious_count += int(negative_mask.sum())
                df.loc[negative_mask, "is_suspicious"] = True
                df.loc[
                    negative_mask, "suspicion_reason"
                ] = "Negative particulate reading indicates optical zero-drift error"
                for idx, row in df[negative_mask].iterrows():
                    row_num = int(row["_original_row_idx"])
                    val = row["_pm25_clean"]
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="suspicious_negative",
                            description=f"Negative PM2.5 measurement ({val} µg/m³) at row {row_num}",
                            suggested_action="Zero-calibrate optical sensor chamber",
                            severity="danger",
                        )
                    )

            if spike_mask.any():
                suspicious_count += int(spike_mask.sum())
                df.loc[spike_mask, "is_suspicious"] = True
                df.loc[
                    spike_mask, "suspicion_reason"
                ] = "Extreme particulate spike exceeds linear dynamic sensor range"
                for idx, row in df[spike_mask].iterrows():
                    row_num = int(row["_original_row_idx"])
                    val = row["_pm25_clean"]
                    flagged_records.append(
                        FlaggedRecord(
                            row_index=row_num,
                            raw_data=df_raw.iloc[idx].to_dict(),
                            issue_type="suspicious_high",
                            description=f"Suspicious PM2.5 spike of {val:.1f} µg/m³ at row {row_num}",
                            suggested_action="Inspect optical chamber for debris or smoke flare",
                            severity="danger",
                        )
                    )
        else:
            df["_pm25_clean"] = np.nan

        # -------------------------------------------------------------
        # 5. Vectorized PM10 Validation
        # -------------------------------------------------------------
        pm10_col = mapping.pm10_col
        if pm10_col and pm10_col in df.columns:
            df["_pm10_raw"] = pd.to_numeric(df[pm10_col], errors="coerce")
            df["_pm10_clean"] = df["_pm10_raw"] * df["_unit_multiplier"]

            pm10_neg_mask = df["_pm10_clean"].notna() & (df["_pm10_clean"] < 0)
            pm10_spike_mask = df["_pm10_clean"].notna() & (df["_pm10_clean"] > 1500)

            if pm10_neg_mask.any():
                suspicious_count += int(pm10_neg_mask.sum())
                df.loc[pm10_neg_mask, "is_suspicious"] = True
                for idx, row in df[pm10_neg_mask].iterrows():
                    row_num = int(row["_original_row_idx"])
                    val = row["_pm10_clean"]
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

            if pm10_spike_mask.any():
                suspicious_count += int(pm10_spike_mask.sum())
                df.loc[pm10_spike_mask, "is_suspicious"] = True
                for idx, row in df[pm10_spike_mask].iterrows():
                    row_num = int(row["_original_row_idx"])
                    val = row["_pm10_clean"]
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
            # Deterministic urban particulate ratio fallback (PM10 ~ 1.6x PM2.5)
            df["_pm10_clean"] = df["_pm25_clean"] * 1.6

        # -------------------------------------------------------------
        # 6. Vectorized Duplicate Telemetry Detection
        # -------------------------------------------------------------
        dup_cols = ["_ward_clean"]
        if time_col and time_col in df.columns:
            dup_cols.append("_timestamp_clean")

        dups_mask = df.duplicated(subset=dup_cols, keep=False)
        duplicate_count = int(dups_mask.sum())
        if dups_mask.any():
            for idx, row in df[dups_mask].iterrows():
                row_num = int(row["_original_row_idx"])
                ward_name = row["_ward_clean"]
                flagged_records.append(
                    FlaggedRecord(
                        row_index=row_num,
                        raw_data=df_raw.iloc[idx].to_dict(),
                        issue_type="duplicate",
                        description=f"Duplicate reading detected for {ward_name} at row {row_num}",
                        suggested_action="Keep primary transmission reading or average concurrent telemetry bursts",
                        severity="info",
                    )
                )

        # -------------------------------------------------------------
        # 7. Coordinates & Station Resolution
        # -------------------------------------------------------------
        lat_col = mapping.latitude_col
        lon_col = mapping.longitude_col
        if lat_col and lat_col in df.columns and lon_col and lon_col in df.columns:
            df["_latitude"] = pd.to_numeric(df[lat_col], errors="coerce")
            df["_longitude"] = pd.to_numeric(df[lon_col], errors="coerce")
        else:
            df["_latitude"] = np.nan
            df["_longitude"] = np.nan

        station_col = mapping.station_col
        if station_col and station_col in df.columns:
            df["_station"] = df[station_col].astype(str)
        else:
            df["_station"] = df["_ward_clean"] + " Station"

        # -------------------------------------------------------------
        # 8. Data Quality Summary Score Formula
        # -------------------------------------------------------------
        valid_records = int((df["is_valid_reading"] & (~df["is_suspicious"])).sum())
        completeness = round((valid_records / max(total_records, 1)) * 100, 1)

        # Audit score: starts at 100, deducts proportional weighted penalties
        penalty = (
            (missing_count * 2.0)
            + (duplicate_count * 1.0)
            + (suspicious_count * 3.0)
            + (invalid_dates_count * 2.0)
        )
        max_penalty = total_records * 2.5
        penalty_ratio = min(penalty / max(max_penalty, 1.0), 1.0)
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
