from typing import Dict, Optional, List
from app.schemas.analysis import EvidenceItem

class EvidenceService:
    def __init__(self):
        self.evidence_registry: Dict[str, EvidenceItem] = {}

    def clear(self):
        self.evidence_registry.clear()

    def record_evidence(
        self,
        evidence_id: str,
        original_filename: str,
        ward: str,
        metric: str,
        current_reading: float,
        previous_reading: Optional[float],
        calculation: str,
        result: str,
        unit: str = "µg/m³",
        original_row_number: Optional[int] = None,
        data_quality: str = "Deterministic Verified",
    ) -> EvidenceItem:
        item = EvidenceItem(
            evidence_id=evidence_id,
            original_filename=original_filename,
            original_row_number=original_row_number,
            ward=ward,
            metric=metric,
            previous_reading=previous_reading,
            current_reading=round(current_reading, 2),
            calculation=calculation,
            result=result,
            unit=unit,
            reporting_date="Current Active Period",
            data_quality=data_quality,
            source_verification=f"Verified from row {original_row_number} of {original_filename}" if original_row_number else f"Aggregated from validated readings of {original_filename}",
        )
        self.evidence_registry[evidence_id] = item
        return item

    def get_evidence(self, evidence_id: str) -> Optional[EvidenceItem]:
        return self.evidence_registry.get(evidence_id)

    def get_all(self) -> Dict[str, EvidenceItem]:
        return self.evidence_registry.copy()

evidence_service = EvidenceService()
