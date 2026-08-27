from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def create_demo_ec_pdf(output_path: str):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1, # Center
        textColor=colors.HexColor("#0f172a")
    )
    center_sub = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=1,
        textColor=colors.HexColor("#334155")
    )
    body = ParagraphStyle(
        'ECBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )
    body_bold = ParagraphStyle(
        'ECBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )
    
    story = []
    
    # Government Header
    story.append(Paragraph("<b>GOVERNMENT OF INDIA</b>", center_sub))
    story.append(Paragraph("<b>MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE</b>", title_style))
    story.append(Paragraph("(Impact Assessment Division — Industry I Sector)", center_sub))
    story.append(Paragraph("Indira Paryavaran Bhawan, Jor Bagh Road, New Delhi – 110003", center_sub))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0f172a"), spaceBefore=2, spaceAfter=8))
    
    # File details
    file_info = [
        [Paragraph("<b>File No:</b> IA/KA/IND/64291/2021", body_bold), Paragraph("<b>Date:</b> 15th June, 2021", ParagraphStyle("RDate", parent=body_bold, alignment=2))],
        [Paragraph("<b>Proposal No:</b> IA/KA/IND/218042/2021", body), Paragraph("<b>Category:</b> A (Industrial)", ParagraphStyle("RCat", parent=body, alignment=2))]
    ]
    t = Table(file_info, colWidths=[270, 260])
    t.setStyle(TableStyle([('TOPPADDING', (0,0), (-1,-1), 1), ('BOTTOMPADDING', (0,0), (-1,-1), 1)]))
    story.append(t)
    story.append(Spacer(1, 8))
    
    # Subject
    story.append(Paragraph("<b>To,</b><br/>The Managing Director,<br/>M/s Bhadra Integrated Steel & Alloy Industries Ltd.,<br/>Industrial Area, Bhadravati, Shivamogga District, Karnataka – 577301.", body))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("<b>Subject: Environmental Clearance for Proposed Expansion of Integrated Steel & Sponge Iron Plant from 0.4 MTPA to 1.2 MTPA at Latitude 13.8485° N, Longitude 75.7042° E by M/s Bhadra Integrated Steel Ltd. — Regarding.</b>", body_bold))
    story.append(Spacer(1, 8))
    
    # Narrative
    story.append(Paragraph("Sir,<br/>This has reference to your online application dated 12th January 2021 submitted on the PARIVESH portal seeking prior Environmental Clearance (EC) under the provisions of the EIA Notification, 2006 for the above-captioned project.", body))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("The proposal was examined by the Expert Appraisal Committee (EAC) in its 48th meeting held during March 2021. Based on the EIA report, baseline air and water monitoring data, and mitigation measures submitted by the proponent, the Ministry of Environment, Forest and Climate Change hereby accords prior Environmental Clearance subject to the strict compliance of the following specific and general conditions:", body))
    story.append(Spacer(1, 8))
    
    # Conditions Table
    story.append(Paragraph("<b>A. SPECIFIC CONDITIONS:</b>", body_bold))
    story.append(Spacer(1, 4))
    
    conds = [
        ("Condition (i) [Spatial Buffer Mandate]", "A mandatory no-construction green belt buffer zone of at least 100 meters shall be strictly maintained from the high flood line (HFL) of the Bhadra River bordering the western boundary of the project site. No industrial plant structure, raw material stocking yard, slag dump, or civil infrastructure shall be erected inside this 100m riparian buffer zone."),
        ("Condition (ii) [Effluent Management]", "Zero Liquid Discharge (ZLD) facility shall be installed. Under no circumstances shall treated or untreated industrial effluent, wash water, or storm water runoff be discharged into the Bhadra River or adjoining irrigation canals."),
        ("Condition (iii) [Green Belt Development]", "A minimum of 33% of the total project area (12.5 hectares) shall be developed as a multi-tier greenbelt with native species of minimum 2,500 trees per hectare within 3 years of project commissioning."),
    ]
    
    for cid, ctext in conds:
        story.append(Paragraph(f"<b>{cid}:</b> {ctext}", body))
        story.append(Spacer(1, 4))
        
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>B. GENERAL CONDITIONS:</b>", body_bold))
    story.append(Spacer(1, 4))
    
    gen_conds = [
        ("General Condition (i)", "The project proponent shall submit six-monthly compliance reports on the status of implementation of the stipulated environmental conditions on the PARIVESH portal (www.parivesh.nic.in) on 1st June and 1st December of each calendar year."),
        ("General Condition (ii)", "Continuous Ambient Air Quality Monitoring (CAAQM) stations and continuous effluent monitoring systems with live web-telemetry to CPCB and SPCB servers shall be installed prior to commercial operation."),
    ]
    
    for gid, gtext in gen_conds:
        story.append(Paragraph(f"<b>{gid}:</b> {gtext}", body))
        story.append(Spacer(1, 4))
        
    story.append(Spacer(1, 10))
    story.append(Paragraph("This clearance is issued with the approval of the Competent Authority.<br/><br/><b>(Dr. S. K. Sharma)</b><br/>Scientist 'F' / Director (IA Division)<br/>Ministry of Environment, Forest and Climate Change", body_bold))
    
    doc.build(story)
    print(f"Created demo EC PDF at {output_path}")

if __name__ == "__main__":
    create_demo_ec_pdf("demo_data/demo_bhadra_steel_ec.pdf")
    create_demo_ec_pdf("storage/uploads/demo_bhadra_steel_ec.pdf")
