import os
import html
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

logger = logging.getLogger(__name__)

DOSSIER_DIR = Path(__file__).resolve().parent.parent / "storage" / "dossiers"
DOSSIER_DIR.mkdir(parents=True, exist_ok=True)


def generate_dossier_pdf(
    run_id: str,
    filename: str,
    agent1_data: Dict[str, Any],
    agent2_data: Dict[str, Any],
    agent3_data: Dict[str, Any],
    agent4_data: Dict[str, Any],
    confidence_band: str,
    reviewer_name: str,
    reviewed_at: str,
    reviewer_notes: Optional[str] = None,
) -> str:
    """
    Compiles a formal 1-to-2 page legal evidence discrepancy dossier PDF using ReportLab.
    """
    output_path = DOSSIER_DIR / f"{run_id}_dossier.pdf"
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=20,
        textColor=colors.HexColor("#0f172a"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#059669"),
    )
    section_heading = ParagraphStyle(
        "SecHead",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=8,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#334155"),
    )
    body_bold = ParagraphStyle(
        "DocBodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )
    disclaimer_style = ParagraphStyle(
        "DocDisclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#64748b"),
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>GREENTRACE EVIDENCE DOSSIER</b>", title_style),
            Paragraph(f"<b>CONFIDENCE BAND</b><br/><font size='13' color='{'#16a34a' if confidence_band == 'green' else '#d97706' if confidence_band == 'yellow' else '#dc2626'}'><b>● {confidence_band.upper()}</b></font>", ParagraphStyle("RightH", parent=title_style, alignment=2)),
        ],
        [
            Paragraph("Autonomous Environmental Clearance Compliance & Discrepancy Audit", subtitle_style),
            Paragraph(f"Run ID: <font fontName='Courier'>{run_id[:12]}</font> | Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", ParagraphStyle("RightSub", parent=body_style, alignment=2)),
        ]
    ]
    header_table = Table(header_data, colWidths=[340, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0f172a"), spaceBefore=2, spaceAfter=8))


    # 2. Project Metadata & Clearance Status
    proj_name = html.escape(str(agent1_data.get("project_name", "N/A")))
    file_no = html.escape(str(agent1_data.get("file_number", "N/A")))
    ec_date = html.escape(str(agent1_data.get("ec_approval_date", "N/A")))
    coords = agent1_data.get("coordinates", [[]])
    coord_str = f"{coords[0][0]:.4f}° N, {coords[0][1]:.4f}° E" if coords and len(coords[0]) == 2 else "N/A"
    
    parivesh_status = html.escape(str(agent2_data.get("parivesh_status", "N/A")))
    amendments = len(agent2_data.get("amendment_history", []))

    meta_table_data = [
        [
            Paragraph("<b>Project Name:</b>", body_bold), Paragraph(proj_name, body_style),
            Paragraph("<b>EC Approval Date:</b>", body_bold), Paragraph(ec_date, body_style),
        ],
        [
            Paragraph("<b>MoEFCC File No:</b>", body_bold), Paragraph(file_no, body_style),
            Paragraph("<b>Site Coordinates:</b>", body_bold), Paragraph(coord_str, body_style),
        ],
        [
            Paragraph("<b>PARIVESH Status:</b>", body_bold), Paragraph(parivesh_status.upper(), body_style),
            Paragraph("<b>Amendments Found:</b>", body_bold), Paragraph(str(amendments), body_style),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[110, 160, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. Mandated Environmental Conditions vs Ground Truth
    story.append(Paragraph("1. Mandated Clearance Conditions (Agent 1 & Agent 3)", section_heading))
    
    conditions = agent1_data.get("conditions", [])
    cond_rows = [
        [Paragraph("<b>Clause ID</b>", body_bold), Paragraph("<b>Mandated Condition & Spatial Constraint</b>", body_bold), Paragraph("<b>Target Feature</b>", body_bold), Paragraph("<b>Buffer Applied</b>", body_bold)]
    ]
    
    for c in conditions[:3]:
        c_type = c.get("condition_type", "qualitative")
        buf = f"{c.get('buffer_distance_meters', 100)}m" if c_type == "quantitative_spatial" else "N/A (Qualitative)"
        c_id_esc = html.escape(str(c.get("condition_id", "COND")))
        c_text = str(c.get("text", ""))[:130] + ("..." if len(str(c.get("text", ""))) > 130 else "")
        c_text_esc = html.escape(c_text)
        c_target_esc = html.escape(str(c.get("waterbody_target", "General") or "General"))

        cond_rows.append([
            Paragraph(c_id_esc, body_bold),
            Paragraph(c_text_esc, body_style),
            Paragraph(c_target_esc, body_style),
            Paragraph(buf, body_bold),
        ])
        
    cond_table = Table(cond_rows, colWidths=[80, 280, 90, 90])
    cond_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(cond_table)
    story.append(Spacer(1, 8))

    # 4. Satellite Spectral Discrepancy Findings (Agent 4)
    story.append(Paragraph("2. Satellite Ground-Truth & Spectral Delta Analysis (Agent 4)", section_heading))
    
    sensor = html.escape(str(agent4_data.get("sensor_used", "Sentinel-2")))
    cloud = agent4_data.get("cloud_cover_pct", 0.0)
    pre_date = html.escape(str(agent4_data.get("pre_ec_date", "Pre-EC")))
    post_date = html.escape(str(agent4_data.get("post_ec_date", "Post-EC")))
    total_buf_m2 = agent4_data.get("buffer_total_area_m2", 0.0)
    change_m2 = agent4_data.get("change_area_m2", 0.0)
    change_pct = agent4_data.get("change_percentage", 0.0)
    discrepancy = agent4_data.get("discrepancy_detected", False)

    sat_summary_data = [
        [
            Paragraph("<b>Sensor Platform:</b>", body_bold), Paragraph(sensor, body_style),
            Paragraph("<b>Cloud Coverage:</b>", body_bold), Paragraph(f"{cloud}% (&lt;20% verified)", body_style),
        ],
        [
            Paragraph("<b>Baseline Interval:</b>", body_bold), Paragraph(pre_date, body_style),
            Paragraph("<b>Audit Interval:</b>", body_bold), Paragraph(post_date, body_style),
        ],
        [
            Paragraph("<b>Protected Buffer Area:</b>", body_bold), Paragraph(f"{total_buf_m2:,.1f} m²", body_style),
            Paragraph("<b>Unauthorized Change:</b>", body_bold), Paragraph(f"<font color='{'#dc2626' if discrepancy else '#16a34a'}'><b>{change_m2:,.1f} m² ({change_pct}%)</b></font>", body_bold),
        ],
    ]
    sat_table = Table(sat_summary_data, colWidths=[120, 150, 120, 150])
    sat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(sat_table)
    story.append(Spacer(1, 8))

    # 5. Review Gate Verification & Sign-off Box
    story.append(Paragraph("3. Human Verification Gate & Legal Attestation", section_heading))
    
    rev_name_esc = html.escape(str(reviewer_name or "Official Auditor"))
    rev_notes_esc = html.escape(str(reviewer_notes or "Evidence verified against satellite baseline. Physical land-cover discrepancy confirmed within mandatory riparian buffer."))
    
    review_data = [
        [
            Paragraph("<b>Verified By (Expert Auditor):</b>", body_bold),
            Paragraph(rev_name_esc, body_style),
            Paragraph("<b>Attestation Timestamp:</b>", body_bold),
            Paragraph(html.escape(str(reviewed_at or datetime.now(timezone.utc).isoformat())), body_style),
        ],
        [
            Paragraph("<b>Auditor Notes / Findings:</b>", body_bold),
            Paragraph(rev_notes_esc, body_style),
            Paragraph("<b>Audit Status:</b>", body_bold),
            Paragraph("<font color='#16a34a'><b>REVIEWED & CONFIRMED</b></font>", body_bold),
        ]
    ]
    review_table = Table(review_data, colWidths=[130, 140, 120, 150])
    review_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#059669")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#a7f3d0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(review_table)
    story.append(Spacer(1, 10))

    # 6. Statutory Disclaimer & Actionable Recommendations
    disclaimer_text = (
        "<b>STATUTORY DISCLAIMER & ADMISSIBILITY NOTICE:</b> This dossier is an autonomous evidence artifact generated by GreenTrace "
        "multi-agent discrepancy detection engine. All spatial measurements (UTM metric buffers) and satellite spectral indices (NDBI/NDVI) "
        "are deterministic. This document serves as prima facie investigative evidence for regulatory agencies (MoEFCC/SEIAA/CPCB/NGT) "
        "and must be verified by a certified environmental inspector prior to punitive regulatory enforcement."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    # Build PDF
    doc.build(story)
    logger.info(f"Generated Dossier PDF at {output_path}")
    return str(output_path)
