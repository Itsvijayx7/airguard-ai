import uuid
import datetime
from typing import Dict, Any, Optional, List
import pandas as pd

class DatabaseStore:
    def __init__(self):
        self.datasets: Dict[str, Dict[str, Any]] = {}
        self.dataframes_raw: Dict[str, pd.DataFrame] = {}
        self.dataframes_cleaned: Dict[str, pd.DataFrame] = {}
        self.analysis_runs: Dict[str, Dict[str, Any]] = {}
        self.recommendations: Dict[str, List[Dict[str, Any]]] = {}
        self.reports: Dict[str, Dict[str, Any]] = {}
        self.chat_history: Dict[str, List[Dict[str, Any]]] = {}

    def save_dataset(self, metadata: Dict[str, Any], df_raw: pd.DataFrame) -> str:
        dataset_id = metadata.get("id") or str(uuid.uuid4())
        metadata["id"] = dataset_id
        if "uploaded_at" not in metadata:
            metadata["uploaded_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.datasets[dataset_id] = metadata
        self.dataframes_raw[dataset_id] = df_raw.copy()
        return dataset_id

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        return self.datasets.get(dataset_id)

    def list_datasets(self) -> List[Dict[str, Any]]:
        return list(self.datasets.values())

    def save_cleaned_df(self, dataset_id: str, df_cleaned: pd.DataFrame):
        self.dataframes_cleaned[dataset_id] = df_cleaned.copy()

    def get_raw_df(self, dataset_id: str) -> Optional[pd.DataFrame]:
        return self.dataframes_raw.get(dataset_id)

    def get_cleaned_df(self, dataset_id: str) -> Optional[pd.DataFrame]:
        return self.dataframes_cleaned.get(dataset_id)

    def save_analysis(self, analysis_id: str, analysis_data: Dict[str, Any]):
        self.analysis_runs[analysis_id] = analysis_data

    def get_analysis(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        return self.analysis_runs.get(analysis_id)

    def get_latest_analysis(self) -> Optional[Dict[str, Any]]:
        if not self.analysis_runs:
            return None
        # Return the most recently created
        sorted_analyses = sorted(
            self.analysis_runs.values(),
            key=lambda x: x.get("created_at", ""),
            reverse=True
        )
        return sorted_analyses[0]

    def save_report(self, report_id: str, report_data: Dict[str, Any]):
        self.reports[report_id] = report_data

    def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        return self.reports.get(report_id)

    def list_reports(self) -> List[Dict[str, Any]]:
        return list(self.reports.values())

db = DatabaseStore()
