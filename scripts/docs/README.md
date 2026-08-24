# Document generators

Regenerates the ITI submission deliverables into `output/docs/`. Everything is
generated from these scripts — do not hand-edit the `.docx` output, because the
next run overwrites it.

## Prerequisites

```bash
npm install docx          # in this directory, or anywhere on the resolve path
python -m pip install reportlab pillow
```

LibreOffice is *not* required. `docx2pdf.py` re-renders the DOCX XML with
ReportLab instead, which also lets it generate a real page-numbered table of
contents — the Word TOC is a field that only populates when the reader chooses
"Update Field".

## Usage

```bash
cd scripts/docs
export DIAG_DIR="../../output/docs/diagrams"
export LOGO_PATH="../../output/docs/assets/iti-logo.png"

# 1. diagrams  (use-case, class, ERD, architecture)
DIAG_OUT="$DIAG_DIR" python diagrams.py

# 2. Word documents
node gen-doc.js  "../../output/docs/Devotopia-Project-Documentation.docx"
node gen-pres.js "../../output/docs/Devotopia-Presentation-Outline.docx"

# 3. PDFs, rendered from the .docx produced above
python docx2pdf.py "../../output/docs/Devotopia-Project-Documentation.docx" \
                   "../../output/docs/Devotopia-Project-Documentation.pdf" \
                   "Devotopia — Project Documentation"
python docx2pdf.py "../../output/docs/Devotopia-Presentation-Outline.docx" \
                   "../../output/docs/Devotopia-Presentation-Outline.pdf" \
                   "Devotopia — Presentation Outline"
```

Run the diagrams step before the documents — the generators embed the PNGs.

## Files

| File | Role |
|---|---|
| `shared.js` | Shared docx-js builders: styles, headings, tables, callout boxes, figures, the ITI page header |
| `gen-doc.js` | The 8-chapter documentation, numbered to match `Documentation Template.docx` |
| `gen-pres.js` | 15-slide outline with speaker notes, numbered to match `Presentation-Outline.docx` |
| `draw.py` | Minimal PIL drawing toolkit — renders at 3× and downsamples for clean text |
| `diagrams.py` | The four UML/architecture diagrams |
| `docx2pdf.py` | DOCX → PDF renderer covering the constructs these documents use |

## Gotchas

- **Tables need dual widths.** Column widths on the table *and* a width on every
  cell, both in DXA. Percentage widths break in Google Docs.
- **`ShadingType.CLEAR`, never `SOLID`** — solid renders black.
- **Never insert a literal bullet character.** Use the `numbering` config.
- **`titlePage: true`** is what lets the cover carry a large logo while the
  following pages carry a small one.
- The amber callout boxes are load-bearing: they mark the sections that still
  need real survey and user-testing data. Do not quietly fill them in.
