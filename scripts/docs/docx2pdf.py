"""Render the generated .docx files to PDF.

LibreOffice is not installed here, so rather than duplicating every paragraph in
a second generator, this walks the DOCX XML and re-renders it with ReportLab.
It only needs to handle the constructs these documents actually use — headings,
paragraphs, bullets, numbered lists, tables, callout boxes and images — which is
what makes a converter this small viable.
"""
import io
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, Image, KeepTogether, ListFlowable,
    ListItem, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'

INK = colors.HexColor('#1F2933')
ACCENT = colors.HexColor('#4F46E5')
MUTED = colors.HexColor('#6B7280')
HEADBG = colors.HexColor('#EEF2FF')
BORDER = colors.HexColor('#CBD5E1')
AMBER = colors.HexColor('#D97706')
AMBER_BG = colors.HexColor('#FFFBEB')
AMBER_INK = colors.HexColor('#78350F')
AMBER_TITLE = colors.HexColor('#92400E')

PAGE_W, PAGE_H = A4
MARGIN = 1.7 * cm
CW = PAGE_W - 2 * MARGIN

# The DOCX carries the ITI mark in a page header; ReportLab has no equivalent,
# so it is drawn onto every page in `furniture` instead.
import os
LOGO = os.environ.get('LOGO_PATH') or None
LOGO_W = LOGO_H = 1
if LOGO and os.path.exists(LOGO):
    with PILImage.open(LOGO) as _im:
        LOGO_W, LOGO_H = _im.size
else:
    LOGO = None

base = getSampleStyleSheet()
S = {
    'Title': ParagraphStyle('t', parent=base['Title'], fontName='Helvetica-Bold',
                            fontSize=30, leading=36, textColor=INK,
                            alignment=TA_CENTER, spaceAfter=8),
    'Heading1': ParagraphStyle('h1', parent=base['Normal'], fontName='Helvetica-Bold',
                               fontSize=17, leading=22, textColor=INK,
                               spaceBefore=16, spaceAfter=4),
    'Heading2': ParagraphStyle('h2', parent=base['Normal'], fontName='Helvetica-Bold',
                               fontSize=12.5, leading=17, textColor=ACCENT,
                               spaceBefore=12, spaceAfter=5),
    'Heading3': ParagraphStyle('h3', parent=base['Normal'], fontName='Helvetica-Bold',
                               fontSize=11, leading=15, textColor=INK,
                               spaceBefore=9, spaceAfter=4),
    'Normal': ParagraphStyle('n', parent=base['Normal'], fontName='Helvetica',
                             fontSize=9.6, leading=14.4, textColor=INK,
                             alignment=TA_LEFT, spaceAfter=5),
    'Center': ParagraphStyle('c', parent=base['Normal'], fontName='Helvetica',
                             fontSize=9.6, leading=14.4, textColor=INK,
                             alignment=TA_CENTER, spaceAfter=5),
    'Cell': ParagraphStyle('cell', parent=base['Normal'], fontName='Helvetica',
                           fontSize=7.8, leading=10.4, textColor=INK),
    'CellB': ParagraphStyle('cellb', parent=base['Normal'], fontName='Helvetica-Bold',
                            fontSize=7.8, leading=10.4, textColor=INK),
    'Caption': ParagraphStyle('cap', parent=base['Normal'], fontName='Helvetica-Oblique',
                              fontSize=8, leading=11, textColor=MUTED,
                              alignment=TA_CENTER, spaceAfter=9),
}


def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


class TocDocTemplate(BaseDocTemplate):
    """Reports each heading to the TOC so page numbers resolve on the second pass."""

    def afterFlowable(self, flowable):
        if not isinstance(flowable, Paragraph):
            return
        name = flowable.style.name
        level = {'h1': 0, 'h2': 1, 'h3': 2}.get(name)
        if level is None:
            return
        text = re.sub(r'<[^>]+>', '', flowable.getPlainText()).strip()
        if not text or text.lower() == 'table of contents':
            return
        key = f'toc-{id(flowable)}'
        self.canv.bookmarkPage(key)
        self.notify('TOCEntry', (level, text, self.page, key))


def runs_to_markup(p):
    """Convert w:r runs into ReportLab inline markup, preserving bold/italic."""
    out = []
    for r in p.iter(f'{W}r'):
        text = ''.join(t.text or '' for t in r.findall(f'{W}t'))
        if not text:
            continue
        rpr = r.find(f'{W}rPr')
        bold = rpr is not None and rpr.find(f'{W}b') is not None
        ital = rpr is not None and rpr.find(f'{W}i') is not None
        col = None
        if rpr is not None:
            cnode = rpr.find(f'{W}color')
            if cnode is not None:
                v = cnode.get(f'{W}val')
                if v and v != 'auto':
                    col = '#' + v
        s = esc(text)
        if bold:
            s = f'<b>{s}</b>'
        if ital:
            s = f'<i>{s}</i>'
        if col:
            s = f'<font color="{col}">{s}</font>'
        out.append(s)
    return ''.join(out)


def para_style(p):
    ppr = p.find(f'{W}pPr')
    if ppr is None:
        return 'Normal', None, False
    st = ppr.find(f'{W}pStyle')
    name = st.get(f'{W}val') if st is not None else 'Normal'
    numpr = ppr.find(f'{W}numPr')
    numid = None
    if numpr is not None:
        n = numpr.find(f'{W}numId')
        if n is not None:
            numid = n.get(f'{W}val')
    jc = ppr.find(f'{W}jc')
    centered = jc is not None and jc.get(f'{W}val') == 'center'
    return name, numid, centered


def cell_fill(tc):
    shd = tc.find(f'.//{W}shd')
    if shd is None:
        return None
    v = shd.get(f'{W}fill')
    return v if v and v != 'auto' else None


def convert(src, dst, title):
    z = zipfile.ZipFile(src)
    root = ET.fromstring(z.read('word/document.xml'))
    body = root.find(f'{W}body')

    # Map relationship ids to media parts so inline images can be pulled out.
    rels = {}
    try:
        rt = ET.fromstring(z.read('word/_rels/document.xml.rels'))
        for rel in rt:
            rels[rel.get('Id')] = rel.get('Target')
    except KeyError:
        pass

    flow = []
    pending_bullets = []

    def flush_bullets():
        nonlocal pending_bullets
        if not pending_bullets:
            return
        flow.append(ListFlowable(
            [ListItem(Paragraph(t, S['Normal']), leftIndent=14) for t in pending_bullets],
            bulletType='bullet', bulletFontSize=7, leftIndent=14,
            bulletOffsetY=-1, spaceAfter=5,
        ))
        pending_bullets = []

    for el in body:
        tag = el.tag.replace(W, '')

        if tag == 'p':
            style, numid, centered = para_style(el)

            # Inline image?
            blip = el.find(f'.//{A}blip')
            if blip is not None:
                flush_bullets()
                rid = blip.get(f'{R}embed')
                target = rels.get(rid)
                if target:
                    data = z.read('word/' + target.replace('\\', '/'))
                    im = PILImage.open(io.BytesIO(data))
                    iw, ih = im.size
                    w = CW
                    h = w * ih / iw
                    max_h = 15.5 * cm
                    if h > max_h:
                        h = max_h
                        w = h * iw / ih
                    img = Image(io.BytesIO(data), width=w, height=h)
                    img.hAlign = 'CENTER'
                    flow.append(img)
                continue

            if el.find(f'.//{W}br[@{W}type="page"]') is not None:
                flush_bullets()
                flow.append(PageBreak())
                continue

            text = runs_to_markup(el)
            if not text.strip():
                flush_bullets()
                flow.append(Spacer(1, 0.16 * cm))
                continue

            if numid:
                pending_bullets.append(text)
                continue

            flush_bullets()

            # The Word TOC is a field the reader is told to refresh. In a PDF
            # that instruction is meaningless, so emit a real generated TOC and
            # drop the instruction paragraph that follows it.
            plain = re.sub(r'<[^>]+>', '', text).strip().lower()
            if plain == 'table of contents':
                flow.append(Paragraph(text, S['Heading1']))
                flow.append(HRFlowable(width='100%', thickness=1, color=ACCENT,
                                       spaceBefore=1, spaceAfter=9))
                toc = TableOfContents()
                toc.levelStyles = [
                    ParagraphStyle('toc0', fontName='Helvetica-Bold', fontSize=10,
                                   leading=17, textColor=INK),
                    ParagraphStyle('toc1', fontName='Helvetica', fontSize=9.2,
                                   leading=14, leftIndent=16, textColor=ACCENT),
                    ParagraphStyle('toc2', fontName='Helvetica', fontSize=8.6,
                                   leading=12.6, leftIndent=34, textColor=MUTED),
                ]
                flow.append(toc)
                continue
            if 'Update Field' in plain or 'update field' in plain:
                continue

            if style in ('Heading1', 'Heading2', 'Heading3', 'Title'):
                flow.append(Paragraph(text, S[style]))
                if style == 'Heading1':
                    flow.append(HRFlowable(width='100%', thickness=1, color=ACCENT,
                                           spaceBefore=1, spaceAfter=7))
            else:
                # A short centred italic line under an image is a figure caption.
                is_caption = centered and '<i>' in text and len(text) < 220
                flow.append(Paragraph(text, S['Caption'] if is_caption
                                      else (S['Center'] if centered else S['Normal'])))
            continue

        if tag == 'tbl':
            flush_bullets()
            rows_xml = el.findall(f'{W}tr')
            if not rows_xml:
                continue

            first_cells = rows_xml[0].findall(f'{W}tc')
            fill0 = cell_fill(first_cells[0]) if first_cells else None

            # Callout box: single cell, amber background.
            if len(rows_xml) == 1 and len(first_cells) == 1 and fill0 == 'FFFBEB':
                paras = first_cells[0].findall(f'{W}p')
                inner = []
                for i, p in enumerate(paras):
                    t = runs_to_markup(p)
                    if not t.strip():
                        continue
                    st = ParagraphStyle(
                        f'ab{i}', parent=S['Normal'], fontSize=8.4, leading=11.6,
                        textColor=AMBER_TITLE if i == 0 else AMBER_INK,
                        fontName='Helvetica-Bold' if i == 0 else 'Helvetica',
                        spaceAfter=3, leftIndent=2,
                    )
                    inner.append(Paragraph(re.sub(r'</?b>', '', t), st))
                t = Table([[inner]], colWidths=[CW])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), AMBER_BG),
                    ('LINEBEFORE', (0, 0), (0, -1), 2.5, AMBER),
                    ('BOX', (0, 0), (-1, -1), 0.6, AMBER),
                    ('LEFTPADDING', (0, 0), (-1, -1), 9),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 7),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
                ]))
                flow.append(KeepTogether([Spacer(1, 0.12 * cm), t, Spacer(1, 0.22 * cm)]))
                continue

            # Regular table — derive column widths from the stored grid.
            grid = el.find(f'{W}tblGrid')
            widths = None
            if grid is not None:
                dxa = [int(g.get(f'{W}w', 0)) for g in grid.findall(f'{W}gridCol')]
                total = sum(dxa)
                if total:
                    widths = [d / total * CW for d in dxa]

            data = []
            for ri, row in enumerate(rows_xml):
                cells = []
                for tc in row.findall(f'{W}tc'):
                    txt = ' '.join(
                        runs_to_markup(p) for p in tc.findall(f'{W}p')
                    ).strip()
                    cells.append(Paragraph(txt, S['CellB'] if ri == 0 else S['Cell']))
                data.append(cells)

            if not widths or len(widths) != len(data[0]):
                widths = [CW / len(data[0])] * len(data[0])

            t = Table(data, colWidths=widths, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HEADBG),
                ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 3.5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ]))
            flow.append(t)
            flow.append(Spacer(1, 0.28 * cm))
            continue

    flush_bullets()

    def furniture(canvas, doc):
        canvas.saveState()

        # ITI mark, top-left on every page. Larger on the cover.
        if LOGO:
            lw = 96 if doc.page == 1 else 52
            lh = lw * LOGO_H / LOGO_W
            canvas.drawImage(LOGO, MARGIN, PAGE_H - 1.05 * cm - lh,
                             width=lw, height=lh, mask='auto')

        if doc.page > 1:
            canvas.setFont('Helvetica', 7.5)
            canvas.setFillColor(MUTED)
            canvas.drawString(MARGIN, 1.1 * cm, title)
            canvas.drawRightString(PAGE_W - MARGIN, 1.1 * cm, str(doc.page))
            canvas.setStrokeColor(BORDER)
            canvas.setLineWidth(0.4)
            canvas.line(MARGIN, 1.45 * cm, PAGE_W - MARGIN, 1.45 * cm)
        canvas.restoreState()

    doc = TocDocTemplate(
        dst, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=2.55 * cm, bottomMargin=1.9 * cm, title=title, author='Devotopia',
    )
    frame = Frame(MARGIN, 1.9 * cm, CW, PAGE_H - 2.55 * cm - 1.9 * cm, id='body',
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='main', frames=[frame], onPage=furniture)])
    # Two passes: the first collects headings, the second resolves page numbers.
    doc.multiBuild(flow)

    import os
    print(f'  {dst}  ({os.path.getsize(dst)/1024:.0f} KB)')


if __name__ == '__main__':
    convert(sys.argv[1], sys.argv[2], sys.argv[3])
