"""Parsing utilities for knowledge base uploads"""
from __future__ import annotations

import csv
import io
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class ParsedRow:
    row_number: int
    data: Dict[str, str]


@dataclass
class ParsedFile:
    rows: List[ParsedRow]
    headers: List[str]
    file_type: str


SUPPORTED_EXTENSIONS = {"csv", "xlsx"}


class KnowledgeFileParser:
    """Loads CSV/XLSX files into normalized row dictionaries."""

    REQUIRED_COLUMNS = {"title", "jira_key"}

    def parse(self, file_bytes: bytes, file_extension: str) -> ParsedFile:
        ext = file_extension.lower().lstrip(".")
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file extension: {ext}")

        if ext == "csv":
            return self._parse_csv(file_bytes)
        return self._parse_excel(file_bytes)

    def _parse_csv(self, file_bytes: bytes) -> ParsedFile:
        stream = io.StringIO(file_bytes.decode("utf-8"))
        reader = csv.DictReader(stream)
        rows = [ParsedRow(idx + 2, row) for idx, row in enumerate(reader)]  # +2 for header line
        headers = reader.fieldnames or []
        return ParsedFile(rows=rows, headers=headers, file_type="csv")

    def _parse_excel(self, file_bytes: bytes) -> ParsedFile:
        stream = io.BytesIO(file_bytes)
        df = pd.read_excel(stream)
        headers = list(df.columns)
        rows = [ParsedRow(idx + 2, df.iloc[idx].to_dict()) for idx in range(len(df))]
        return ParsedFile(rows=rows, headers=headers, file_type="xlsx")

    def detect_columns(self, headers: List[str]) -> Dict[str, Optional[str]]:
        header_map = {h.lower().strip(): h for h in headers}
        mapping = {
            "title": header_map.get("title"),
            "description": header_map.get("description"),
            "steps": header_map.get("steps"),
            "expected_result": header_map.get("expected_result"),
            "priority": header_map.get("priority"),
            "test_type": header_map.get("test_type"),
            "jira_key": header_map.get("jira_key"),
        }
        missing = [key for key, column in mapping.items() if key in self.REQUIRED_COLUMNS and not column]
        if missing:
            raise ValueError(
                f"Missing required columns: {', '.join(missing)}. Headers detected: {headers}"
            )
        return mapping

    def normalize_row(self, parsed_row: ParsedRow, column_map: Dict[str, Optional[str]]) -> Dict[str, Optional[str]]:
        normalized: Dict[str, Optional[str]] = {"source_row_number": parsed_row.row_number}
        for field, column in column_map.items():
            if column:
                normalized[field] = parsed_row.data.get(column)
            else:
                normalized[field] = None

        # Steps may be JSON or newline-delimited text
        steps_value = normalized.get("steps")
        if isinstance(steps_value, str) and steps_value:
            try:
                normalized["steps"] = json.loads(steps_value)
            except json.JSONDecodeError:
                lines = [line.strip() for line in steps_value.splitlines() if line.strip()]
                normalized["steps"] = [
                    {"step_number": idx + 1, "action": line, "expected_result": None}
                    for idx, line in enumerate(lines)
                ]
        elif steps_value is None:
            normalized["steps"] = None
        return normalized


parser = KnowledgeFileParser()
