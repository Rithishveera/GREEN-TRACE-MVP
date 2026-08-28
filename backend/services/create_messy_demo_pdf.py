"""
create_messy_demo_pdf.py
Generates a deliberately messy EC PDF for testing MANUAL_LEGAL_REVIEW routing.

Properties:
  - No explicit coordinates (no lat/lon, no state name that hits STATE_CENTERS)
    -> coordinates_source = "fabricated_unresolved" -> BLOCKING
  - Non-standard file number (MISC/REG/...)
    -> parivesh_status = "format_unrecognized"
  - Only qualitative conditions (no spatial buffer distances)

Usage:
    python create_messy_demo_pdf.py
"""
import sys
from pathlib import Path

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
except ImportError:
    print("reportlab is required: pip install reportlab")
    sys.exit(1)


def create_messy_pdf(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(output_path), pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 60, "OFFICE OF THE SPECIAL ENVIRONMENTAL COMMISSIONER")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, "Grant of Provisional Approval for Industrial Operation")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 120, "FORM EC-XII (PROVISIONAL) — ENVIRONMENTAL AUTHORISATION")

    c.setFont("Helvetica", 9)
    lines = [
        "File Ref : MISC/REG/2022/9876/Z",
        "Project  : Amalgamated Quarrying & Mineral Extraction Works",
        "Proponent: M/s Khanij Udyog Pvt. Ltd.",
        "Activity : Quarrying, Crushing, and Conveyance of Minor Minerals",
        "",
        "AUTHORISATION CONDITIONS:",
        "",
        "1. The proponent shall take all necessary precautions to ensure that dust and noise",
        "   levels remain within permissible limits as prescribed by the relevant authority.",
        "",
        "2. Effective water management practices shall be implemented at the site.",
        "",
        "3. Adequate tree plantation activities shall be undertaken by the company in a ratio",
        "   of 1:3 for every tree felled.",
        "",
        "4. The company shall maintain a green belt around the operational boundary.",
        "",
        "5. Regular environmental audits shall be submitted to this office half-yearly.",
        "",
        "Note: The exact operational area shall be determined by field inspection.",
        "No GPS coordinates are available in this provisional grant.",
        "",
        "Dated this day at the District Headquarters.",
        "Authorized Signatory: Jt. Commissioner (Environment)",
    ]

    y = height - 150
    for line in lines:
        c.drawString(60, y, line)
        y -= 14

    c.save()
    print(f"[OK] Messy demo PDF created: {output_path}")


if __name__ == "__main__":
    dest = Path(__file__).resolve().parent.parent / "demo_data" / "demo_messy_ec_no_coords.pdf"
    create_messy_pdf(dest)
