#!/usr/bin/env python3
"""Fail-closed TripSolved kiosk release check. Run from repository root."""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
html = (root / "kiosk" / "index.html").read_text(encoding="utf-8")
files = re.findall(r'file:"([^"]+\.jpg)"', html)
missing = [name for name in files if not (root / "kiosk" / "photos" / name).is_file()]
booking = re.search(r'const bookingUrl="([^"]*)"', html)
errors = []
if not files:
    errors.append("No approved photos configured")
if missing:
    errors.append("Missing ORIGINAL photo assets: " + ", ".join(missing))
if not booking or not booking.group(1).startswith("https://"):
    errors.append("Verified production booking URL not configured")
if errors:
    for err in errors:
        print("BLOCKED:", err)
    sys.exit(1)
print("Local asset and booking URL gates PASS. Live HTTP, payment, privacy and kiosk acceptance still required.")
