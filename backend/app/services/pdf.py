"""PDF generation for quotes using fpdf2 with bundled Unicode font."""

import os
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import List

from fpdf import FPDF

# Font path: bundled DejaVuSans.ttf (covers Latin-1 + Latin Extended-A)
_FONT_PATH = str(Path(__file__).resolve().parent.parent / "assets" / "DejaVuSans.ttf")

# Business info from env vars with defaults
BUSINESS_NAME = "Lubricentro G&G"
BUSINESS_PHONE = os.environ.get("BUSINESS_PHONE", "11-XXXX-XXXX")
BUSINESS_ADDRESS = os.environ.get("BUSINESS_ADDRESS", "Direccion a confirmar")


class QuotePDF(FPDF):
    """Custom PDF class for quote documents."""

    def __init__(self):
        super().__init__()
        self.add_font("DejaVu", "", _FONT_PATH)
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font("DejaVu", size=16)
        self.cell(0, 10, BUSINESS_NAME, new_x="LMARGIN", new_y="NEXT", align="C")
        self.set_font("DejaVu", size=9)
        self.cell(0, 5, f"Tel: {BUSINESS_PHONE}", new_x="LMARGIN", new_y="NEXT", align="C")
        self.cell(0, 5, BUSINESS_ADDRESS, new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(5)
        # Separator line
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("DejaVu", size=8)
        self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}}", align="C")


def generate_pdf(quote, items: List) -> BytesIO:
    """
    Generate a PDF for a quote.

    Args:
        quote: Quote ORM object with quote_number, client_name, client_phone, total, created_at
        items: List of QuoteItem ORM objects with description, quantity, unit_price, subtotal

    Returns:
        BytesIO buffer containing the PDF
    """
    pdf = QuotePDF()
    pdf.alias_nb_pages()
    pdf.add_page()

    # Quote info
    pdf.set_font("DejaVu", size=12)
    pdf.cell(0, 8, f"Presupuesto: {quote.quote_number}", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", size=10)
    date_str = quote.created_at.strftime("%d/%m/%Y") if quote.created_at else ""
    pdf.cell(0, 6, f"Fecha: {date_str}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    # Client info
    pdf.set_font("DejaVu", size=11)
    pdf.cell(0, 7, f"Cliente: {quote.client_name}", new_x="LMARGIN", new_y="NEXT")
    if quote.client_phone:
        pdf.set_font("DejaVu", size=10)
        pdf.cell(0, 6, f"Telefono: {quote.client_phone}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # Items table header
    pdf.set_font("DejaVu", size=10)
    pdf.set_fill_color(240, 240, 240)
    col_widths = [90, 25, 35, 40]
    headers = ["Descripcion", "Cant.", "P. Unit.", "Subtotal"]
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 8, header, border=1, fill=True, align="C")
    pdf.ln()

    # Items table rows
    pdf.set_font("DejaVu", size=9)
    for item in items:
        desc = item.description or ""
        if len(desc) > 45:
            desc = desc[:42] + "..."
        qty = str(item.quantity)
        unit_price = f"${item.unit_price:,.2f}" if item.unit_price else "$0.00"
        subtotal = f"${item.subtotal:,.2f}" if item.subtotal else "$0.00"

        pdf.cell(col_widths[0], 7, desc, border=1)
        pdf.cell(col_widths[1], 7, qty, border=1, align="C")
        pdf.cell(col_widths[2], 7, unit_price, border=1, align="R")
        pdf.cell(col_widths[3], 7, subtotal, border=1, align="R")
        pdf.ln()

    # Total
    pdf.ln(3)
    pdf.set_font("DejaVu", size=12)
    total_str = f"${quote.total:,.2f}" if quote.total else "$0.00"
    pdf.cell(col_widths[0] + col_widths[1] + col_widths[2], 10, "TOTAL:", border=0, align="R")
    pdf.cell(col_widths[3], 10, total_str, border=1, align="R")

    # Output to BytesIO
    buffer = BytesIO()
    pdf_content = pdf.output()
    buffer.write(pdf_content)
    buffer.seek(0)
    return buffer
