import os
import random
import datetime
import pandas as pd
import numpy as np

class DemoDatasetService:
    @classmethod
    def generate_messy_air_quality_dataframe(cls) -> pd.DataFrame:
        """
        Generates realistic synthetic demonstration dataset with deliberate anomalies:
        - Inconsistent column headers (PM25, Reading_Date, Station_Name)
        - Missing values (None/NaN)
        - Duplicates
        - Suspicious negative numbers (-8.0)
        - Suspicious extreme spikes (1280.0)
        - Mixed units (ug/m3, mg/m3, ppm)
        """
        random.seed(42)
        np.random.seed(42)

        wards_config = [
            {"ward": "Ward 1", "station": "Station Alpha", "base_pm25": 84.0, "lat": 19.0760, "lon": 72.8777},
            {"ward": "Ward 2", "station": "Station Beta", "base_pm25": 115.0, "lat": 19.1136, "lon": 72.8697},
            {"ward": "Ward 3", "station": "Station Gamma", "base_pm25": 42.0, "lat": 19.0330, "lon": 72.8560},
            {"ward": "Ward 4", "station": "Station Delta", "base_pm25": 68.0, "lat": 19.1663, "lon": 72.8526},
            {"ward": "Ward 5", "station": "Station Epsilon", "base_pm25": 92.0, "lat": 19.2183, "lon": 72.9781},
            {"ward": "Ward 6", "station": "Station Zeta", "base_pm25": 58.0, "lat": 19.0176, "lon": 72.8302},
            {"ward": "Ward 7", "station": "Station Eta", "base_pm25": 105.0, "lat": 19.1075, "lon": 72.8376},
            {"ward": "Ward 8", "station": "Station Theta", "base_pm25": 28.0, "lat": 19.0596, "lon": 72.8295},
        ]

        base_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)
        rows = []

        for day in range(3):
            for hour in range(0, 24, 4):  # Every 4 hours
                timestamp = (base_time + datetime.timedelta(days=day, hours=hour)).strftime("%Y-%m-%d %H:%M:%S")
                for w in wards_config:
                    # Diurnal oscillation + noise
                    diurnal_factor = 1.25 if hour in [8, 12, 20] else 0.85
                    val_pm25 = round(w["base_pm25"] * diurnal_factor + random.uniform(-6, 8), 1)
                    val_pm10 = round(val_pm25 * 1.65 + random.uniform(-5, 10), 1)
                    unit = "ug/m3"

                    rows.append({
                        "Reading_Date": timestamp,
                        "Ward": w["ward"],
                        "Station_Name": w["station"],
                        "PM25": val_pm25,
                        "PM10": val_pm10,
                        "Unit": unit,
                        "Latitude": w["lat"],
                        "Longitude": w["lon"],
                        "Dataset_Tag": "SYNTHETIC DEMO DATA",
                    })

        # Inject realistic messy defects:
        # 1. Missing PM2.5 readings (rows 7, 23, 44)
        if len(rows) > 45:
            rows[7]["PM25"] = None
            rows[23]["PM25"] = np.nan
            rows[44]["PM25"] = ""

        # 2. Suspicious negative values (sensor baseline fault)
        if len(rows) > 18:
            rows[12]["PM25"] = -7.5
            rows[12]["Unit"] = "ug/m3"

        # 3. Suspicious extreme spike (flare or dust cloud obstruction)
        if len(rows) > 30:
            rows[29]["PM25"] = 1240.0

        # 4. Mixed units: mg/m3 (needs conversion *1000)
        if len(rows) > 15:
            rows[15]["PM25"] = 0.082  # 82 ug/m3 in mg/m3
            rows[15]["Unit"] = "mg/m3"

        # 5. Invalid / unconvertible unit: ppm
        if len(rows) > 35:
            rows[34]["Unit"] = "ppm"

        # 6. Duplicates (duplicate row 10 and 20)
        if len(rows) > 21:
            rows.append(rows[10].copy())
            rows.append(rows[20].copy())

        # 7. Inconsistent date format
        if len(rows) > 40:
            rows[38]["Reading_Date"] = "14/11/2026 14:00"

        return pd.DataFrame(rows)

    @classmethod
    def create_sample_files(cls, base_dir: str):
        os.makedirs(base_dir, exist_ok=True)
        df = cls.generate_messy_air_quality_dataframe()

        # CSV format
        csv_path = os.path.join(base_dir, "air_quality_city_messy_sample.csv")
        df.to_csv(csv_path, index=False)

        # Excel format
        xlsx_path = os.path.join(base_dir, "air_quality_city_messy_sample.xlsx")
        df.to_excel(xlsx_path, index=False)

        # JSON format
        json_path = os.path.join(base_dir, "air_quality_city_messy_sample.json")
        df.to_json(json_path, orient="records", indent=2)

        return csv_path, xlsx_path, json_path

demo_service = DemoDatasetService()
