// Shared builders for the ITI deliverables.
const {
  AlignmentType, BorderStyle, HeadingLevel, LevelFormat, Paragraph, ShadingType,
  Table, TableCell, TableRow, TextRun, WidthType,
} = require('docx');

const INK = '1F2933';
const ACCENT = '4F46E5';
const MUTED = '6B7280';
const HEADBG = 'EEF2FF';
const BORDER = 'CBD5E1';

// A4 content width in DXA: 11906 - (2 * 1134 margins) = 9638
const CONTENT_W = 9638;

const numbering = {
  config: [
    {
      reference: 'bullets',
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 880, hanging: 260 } } } },
      ],
    },
    {
      reference: 'numbers',
      levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
      ],
    },
  ],
};

const styles = {
  default: {
    document: { run: { font: 'Calibri', size: 22, color: INK } },
  },
  paragraphStyles: [
    { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 56, bold: true, color: INK, font: 'Calibri' },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 160 } } },
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 32, bold: true, color: INK, font: 'Calibri' },
      paragraph: { spacing: { before: 360, after: 160 },
        border: { bottom: { color: ACCENT, style: BorderStyle.SINGLE, size: 12, space: 6 } } } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 26, bold: true, color: ACCENT, font: 'Calibri' },
      paragraph: { spacing: { before: 260, after: 110 } } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 23, bold: true, color: INK, font: 'Calibri' },
      paragraph: { spacing: { before: 190, after: 80 } } },
  ],
};

const P = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: opts.after ?? 120, line: 276 },
    alignment: opts.align,
    indent: opts.indent,
    children: [new TextRun({
      text,
      bold: opts.bold,
      italics: opts.italic,
      color: opts.color,
      size: opts.size,
    })],
  });

const H1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1 });
const H2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2 });
const H3 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_3 });

const Bullet = (text, level = 0) =>
  new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 70, line: 276 },
    children: [new TextRun({ text })],
  });

const Num = (text) =>
  new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { after: 70, line: 276 },
    children: [new TextRun({ text })],
  });

/** Bullet with a bold lead-in before the em dash. */
const BulletLead = (lead, rest, level = 0) =>
  new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 70, line: 276 },
    children: [
      new TextRun({ text: lead, bold: true }),
      new TextRun({ text: rest ? ' — ' + rest : '' }),
    ],
  });

const cell = (text, { bold = false, bg, width, align } = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({
      alignment: align,
      spacing: { after: 0, line: 260 },
      children: [new TextRun({ text: String(text), bold, size: 20 })],
    })],
  });

/**
 * Table with dual widths — the column widths and every cell width must both be
 * set in DXA, or the layout collapses in Google Docs.
 */
const Tbl = (headers, rows, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => Math.round((w / total) * CONTENT_W));

  return new Table({
    columnWidths: widths,
    width: { size: CONTENT_W, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { bold: true, bg: HEADBG, width: widths[i] })),
      }),
      ...rows.map((r) => new TableRow({
        children: r.map((c, i) => cell(c, { width: widths[i] })),
      })),
    ],
  });
};

/** Callout for content the team must supply — deliberately impossible to miss. */
const ActionBox = (title, lines) =>
  new Table({
    columnWidths: [CONTENT_W],
    width: { size: CONTENT_W, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: 'D97706' },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: 'D97706' },
      left: { style: BorderStyle.SINGLE, size: 18, color: 'D97706' },
      right: { style: BorderStyle.SINGLE, size: 8, color: 'D97706' },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'FFFBEB', color: 'auto' },
        margins: { top: 130, bottom: 130, left: 170, right: 150 },
        children: [
          new Paragraph({
            spacing: { after: 70 },
            children: [new TextRun({ text: title, bold: true, color: '92400E', size: 21 })],
          }),
          ...lines.map((l) => new Paragraph({
            spacing: { after: 55, line: 260 },
            children: [new TextRun({ text: l, size: 20, color: '78350F' })],
          })),
        ],
      })],
    })],
  });

const Spacer = (h = 120) => new Paragraph({ spacing: { after: h }, children: [] });

/** A left-aligned logo, sized by width with the aspect ratio preserved. */
const Logo = (imgPath, widthPt, { align = AlignmentType.LEFT, after = 0 } = {}) => {
  const { ImageRun } = require('docx');
  const fs = require('fs');
  const buf = fs.readFileSync(imgPath);
  const pxW = buf.readUInt32BE(16);
  const pxH = buf.readUInt32BE(20);
  return new Paragraph({
    alignment: align,
    spacing: { after },
    children: [new ImageRun({
      data: buf,
      type: 'png',
      transformation: { width: widthPt, height: Math.round((widthPt * pxH) / pxW) },
    })],
  });
};

/**
 * Running header carrying the ITI mark in the top-left corner.
 *
 * Word treats the first page separately when `titlePage` is set, which lets the
 * cover show a large logo while every following page carries a small one.
 */
const Headers = (logoPath) => {
  const { Header } = require('docx');
  return {
    first: new Header({ children: [Logo(logoPath, 96, { after: 40 })] }),
    default: new Header({ children: [Logo(logoPath, 52, { after: 60 })] }),
  };
};

/**
 * Place a diagram scaled to the text column, with a numbered caption.
 * Width is capped at CONTENT_W in EMU-equivalent points (DXA / 20 = points).
 */
const Figure = (imgPath, caption, maxWidthPt = 460) => {
  const { ImageRun } = require('docx');
  const fs = require('fs');
  const { execSync } = require('child_process');

  const buf = fs.readFileSync(imgPath);
  // PNG dimensions live at bytes 16-23 of the IHDR chunk.
  const pxW = buf.readUInt32BE(16);
  const pxH = buf.readUInt32BE(20);
  const w = Math.min(maxWidthPt, pxW);
  const h = Math.round((w * pxH) / pxW);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 60 },
      children: [new ImageRun({ data: buf, type: 'png', transformation: { width: w, height: h } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, italics: true, size: 18, color: MUTED })],
    }),
  ];
};

module.exports = {
  INK, ACCENT, MUTED, HEADBG, BORDER, CONTENT_W,
  numbering, styles,
  P, H1, H2, H3, Bullet, BulletLead, Num, Tbl, ActionBox, Spacer, Figure, Logo, Headers,
};
