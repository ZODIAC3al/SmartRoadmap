"""Minimal diagram toolkit built on PIL.

Everything renders at SCALE× and is downsampled on save, which is what keeps
text edges clean in Word and in print. Coordinates below are in logical units.
"""
from PIL import Image, ImageDraw, ImageFont

SCALE = 3
FONT_DIR = "C:/Windows/Fonts/"

INK = (15, 23, 42)
MUTED = (100, 116, 139)
INDIGO = (79, 70, 229)
INDIGO_BG = (238, 242, 255)
GREEN = (5, 150, 105)
GREEN_BG = (209, 250, 229)
AMBER = (180, 83, 9)
AMBER_BG = (254, 243, 199)
SLATE_BG = (241, 245, 249)
BORDER = (148, 163, 184)
WHITE = (255, 255, 255)


class Canvas:
    def __init__(self, w, h, bg=WHITE):
        self.w, self.h = w, h
        self.img = Image.new("RGB", (w * SCALE, h * SCALE), bg)
        self.d = ImageDraw.Draw(self.img)
        self._fonts = {}

    def font(self, size, bold=False, italic=False):
        key = (size, bold, italic)
        if key not in self._fonts:
            name = "calibri"
            if bold and italic: name += "z"
            elif bold: name += "b"
            elif italic: name += "i"
            self._fonts[key] = ImageFont.truetype(FONT_DIR + name + ".ttf", int(size * SCALE))
        return self._fonts[key]

    def text_w(self, s, size, bold=False):
        return self.d.textlength(s, font=self.font(size, bold)) / SCALE

    def text(self, x, y, s, size=11, color=INK, bold=False, italic=False, anchor="lt"):
        self.d.text((x * SCALE, y * SCALE), s, font=self.font(size, bold, italic),
                    fill=color, anchor=anchor)

    def ctext(self, cx, y, s, size=11, color=INK, bold=False, italic=False):
        self.text(cx, y, s, size, color, bold, italic, anchor="mt")

    def box(self, x, y, w, h, fill=WHITE, outline=BORDER, width=1.4, radius=8):
        self.d.rounded_rectangle(
            [x * SCALE, y * SCALE, (x + w) * SCALE, (y + h) * SCALE],
            radius=int(radius * SCALE), fill=fill, outline=outline,
            width=max(1, int(width * SCALE)))

    def rect(self, x, y, w, h, fill=None, outline=BORDER, width=1.4):
        self.d.rectangle([x * SCALE, y * SCALE, (x + w) * SCALE, (y + h) * SCALE],
                         fill=fill, outline=outline, width=max(1, int(width * SCALE)))

    def ellipse(self, cx, cy, rx, ry, fill=WHITE, outline=INDIGO, width=1.4):
        self.d.ellipse([(cx - rx) * SCALE, (cy - ry) * SCALE,
                        (cx + rx) * SCALE, (cy + ry) * SCALE],
                       fill=fill, outline=outline, width=max(1, int(width * SCALE)))

    def line(self, x1, y1, x2, y2, color=BORDER, width=1.4, dash=None):
        if dash:
            self._dashed(x1, y1, x2, y2, color, width, dash)
        else:
            self.d.line([x1 * SCALE, y1 * SCALE, x2 * SCALE, y2 * SCALE],
                        fill=color, width=max(1, int(width * SCALE)))

    def _dashed(self, x1, y1, x2, y2, color, width, dash):
        import math
        dist = math.hypot(x2 - x1, y2 - y1)
        if dist == 0: return
        dx, dy = (x2 - x1) / dist, (y2 - y1) / dist
        pos, on = 0.0, True
        while pos < dist:
            seg = min(dash, dist - pos)
            if on:
                self.d.line([(x1 + dx * pos) * SCALE, (y1 + dy * pos) * SCALE,
                             (x1 + dx * (pos + seg)) * SCALE, (y1 + dy * (pos + seg)) * SCALE],
                            fill=color, width=max(1, int(width * SCALE)))
            pos += seg
            on = not on

    def arrow(self, x1, y1, x2, y2, color=MUTED, width=1.4, head=7, dash=None):
        import math
        self.line(x1, y1, x2, y2, color, width, dash)
        ang = math.atan2(y2 - y1, x2 - x1)
        for s in (0.42, -0.42):
            self.d.line([x2 * SCALE, y2 * SCALE,
                         (x2 - head * math.cos(ang - s)) * SCALE,
                         (y2 - head * math.sin(ang - s)) * SCALE],
                        fill=color, width=max(1, int(width * SCALE)))

    def stick(self, cx, top, h=34, color=INK, width=1.6):
        """UML actor."""
        r = h * 0.17
        self.d.ellipse([(cx - r) * SCALE, top * SCALE, (cx + r) * SCALE, (top + 2 * r) * SCALE],
                       outline=color, width=max(1, int(width * SCALE)))
        neck = top + 2 * r
        hip = neck + h * 0.36
        self.line(cx, neck, cx, hip, color, width)
        self.line(cx - h * 0.24, neck + h * 0.10, cx + h * 0.24, neck + h * 0.10, color, width)
        self.line(cx, hip, cx - h * 0.20, hip + h * 0.30, color, width)
        self.line(cx, hip, cx + h * 0.20, hip + h * 0.30, color, width)

    def save(self, path):
        self.img.resize((self.w, self.h), Image.LANCZOS).save(path, "PNG")
        print("  wrote", path)
