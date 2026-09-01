"""Generates the four diagrams referenced by the ITI documentation."""
import os
from draw import (Canvas, INK, MUTED, INDIGO, INDIGO_BG, GREEN, GREEN_BG,
                  AMBER, AMBER_BG, SLATE_BG, BORDER, WHITE)

OUT = os.environ.get("DIAG_OUT", "diagrams")
os.makedirs(OUT, exist_ok=True)


# ═══════════════════════ 1. USE CASE DIAGRAM ══════════════════════════════
def use_case():
    c = Canvas(1180, 760)
    c.ctext(590, 16, "Devotopia — Use Case Diagram", 19, INK, bold=True)

    # System boundary
    bx, by, bw, bh = 300, 60, 580, 672
    c.rect(bx, by, bw, bh, fill=SLATE_BG, outline=BORDER, width=1.6)
    c.ctext(bx + bw / 2, by + 10, "Devotopia Platform", 13, MUTED, bold=True)

    cases = [
        ("UC-01  Register / Log in", 108),
        ("UC-02  Complete onboarding", 152),
        ("UC-03  Generate roadmap", 196),
        ("UC-04  Take adaptive exam", 240),
        ("UC-05  Pass module (unlock)", 284),
        ("UC-06  Fail module (remedial)", 328),
        ("UC-07  Earn certificate", 372),
        ("UC-08  Build / parse CV", 416),
        ("UC-09  View skill passport", 460),
        ("UC-10  Match to job", 504),
        ("UC-11  Close skill gap", 548),
        ("UC-12  Post job", 592),
        ("UC-13  Screen candidates", 636),
        ("UC-18  Moderate platform", 690),
    ]
    pos = {}
    for label, y in cases:
        cx = bx + bw / 2
        c.ellipse(cx, y, 158, 17, fill=WHITE, outline=INDIGO, width=1.4)
        c.ctext(cx, y - 8, label, 10.5, INK)
        pos[label.split()[0]] = (cx, y)

    # Actors
    def actor(x, y, name):
        c.stick(x, y)
        c.ctext(x, y + 42, name, 11, INK, bold=True)
        return (x, y + 20)

    learner = actor(150, 250, "Learner")
    company = actor(150, 560, "Company")
    mentor = actor(1030, 250, "Mentor")
    admin = actor(1030, 560, "Admin")

    def link(a, uc, right=False):
        x, y = pos[uc]
        ex = x + 158 if right else x - 158
        c.line(a[0] + (30 if not right else -30), a[1], ex, y, BORDER, 1.2)

    for uc in ["UC-01", "UC-02", "UC-03", "UC-04", "UC-08", "UC-09", "UC-10", "UC-11"]:
        link(learner, uc)
    for uc in ["UC-12", "UC-13"]:
        link(company, uc)
    link(mentor, "UC-01", right=True)
    link(admin, "UC-18", right=True)

    # «include» relationships — the system-driven outcomes of an exam.
    # Routed through a channel to the right of the ovals so the dashed lines
    # never cross the use cases they connect.
    def include(src, dst, channel):
        x1, y1 = pos[src]
        x2, y2 = pos[dst]
        c.line(x1 + 158, y1, channel, y1, GREEN, 1.1, dash=5)
        c.line(channel, y1, channel, y2, GREEN, 1.1, dash=5)
        c.arrow(channel, y2, x2 + 160, y2, GREEN, 1.1, 6, dash=5)

    include("UC-04", "UC-05", bx + bw - 34)
    include("UC-04", "UC-06", bx + bw - 16)
    include("UC-05", "UC-07", bx + bw - 52)
    c.text(bx + bw + 6, 330, "«include»", 9.5, GREEN, italic=True)

    c.text(40, 700, "Solid line = association   ·   Dashed arrow = «include»", 10, MUTED, italic=True)
    c.save(f"{OUT}/use-case-diagram.png")


# ═══════════════════════ 2. CLASS DIAGRAM ═════════════════════════════════
def class_diagram():
    c = Canvas(1240, 900)
    c.ctext(620, 14, "Devotopia — Class Diagram (core domain)", 19, INK, bold=True)

    def cls(x, y, name, attrs, w=250, accent=INDIGO, bg=INDIGO_BG):
        head = 26
        h = head + 13 * len(attrs) + 12
        c.box(x, y, w, h, fill=WHITE, outline=accent, width=1.6, radius=5)
        c.d.rounded_rectangle([x * 3, y * 3, (x + w) * 3, (y + head) * 3],
                              radius=15, fill=bg, outline=accent, width=5)
        c.rect(x, y + head - 6, w, 6, fill=bg, outline=bg, width=0)
        c.line(x, y + head, x + w, y + head, accent, 1.4)
        c.ctext(x + w / 2, y + 6, name, 12, INK, bold=True)
        for i, a in enumerate(attrs):
            c.text(x + 9, y + head + 5 + i * 13, a, 9.5, INK)
        return {"x": x, "y": y, "w": w, "h": h}

    user = cls(30, 60, "User", [
        "email : string «unique»", "passwordHash : string", "name : string",
        "role : learner|company|mentor|admin", "provider : local|google",
        "plan : free|pro_learner|company_tier", "isVerified : boolean",
        "tokensValidFrom : date"], 262)

    roadmap = cls(480, 60, "Roadmap", [
        "userId : ObjectId", "title : string", "targetRole : string",
        "totalEstimatedHours : number", "status : active|archived",
        "modules : ModuleItem[]"], 250)

    module = cls(900, 60, "ModuleItem", [
        "id : string", "title : string", "difficulty : enum",
        "estimatedHours : number", "topics : string[]",
        "prerequisites : string[]", "status : locked|in_progress|",
        "         completed|failed", "positionX / positionY : number"], 300)

    session = cls(480, 320, "QuizSession", [
        "userId : ObjectId", "moduleId : string",
        "status : in_progress|completed", "score : number (0-100)",
        "passed : boolean", "answers : QuizAnswer[]"], 250)

    answer = cls(900, 320, "QuizAnswer", [
        "question : string", "userAnswer : string", "correct : boolean",
        "difficulty : easy|medium|hard", "timeTaken : number (s)"], 300)

    topic = cls(900, 500, "UserTopicResult", [
        "userId : ObjectId", "topicId : string", "attempts : number",
        "failedAttempts : number", "failPercentage : number",
        "status : passed|failed|remedial_inserted"], 300)

    cv = cls(30, 350, "CV", [
        "userId : ObjectId «unique»", "personal : object",
        "experience[] / education[]", "skills : string[]", "projects[]"], 262)

    cert = cls(30, 530, "TrackCertification", [
        "userId : ObjectId", "certificateId : string",
        "trackTitle : string", "issuedAt : date"], 262)

    payment = cls(30, 690, "Payment", [
        "userId : ObjectId", "paypalOrderId : string «unique»",
        "amount : number", "status : created|completed|failed", "plan : enum"], 262)

    job = cls(480, 530, "Job", [
        "title / company / location", "requiredSkills : string[]",
        "salaryMin / salaryMax : number", "remote : boolean"], 250)

    def assoc(a, b, label, side="h"):
        if side == "h":
            x1 = a["x"] + a["w"]; y1 = a["y"] + 20
            x2 = b["x"]; y2 = b["y"] + 20
            c.line(x1, y1, x2, y2, BORDER, 1.4)
            c.ctext((x1 + x2) / 2, y1 - 15, label, 9.5, GREEN, bold=True)
        else:
            x1 = a["x"] + a["w"] / 2; y1 = a["y"] + a["h"]
            x2 = b["x"] + b["w"] / 2; y2 = b["y"]
            c.line(x1, y1, x2, y2, BORDER, 1.4)
            c.text(x1 + 6, (y1 + y2) / 2 - 7, label, 9.5, GREEN, bold=True)

    assoc(user, roadmap, "1 → 0..*")
    assoc(roadmap, module, "1 → *")
    assoc(roadmap, session, "", "v")
    assoc(session, answer, "1 → 5")
    assoc(user, cv, "1 → 0..1", "v")
    assoc(cv, cert, "", "v")
    assoc(cert, payment, "", "v")
    assoc(session, job, "", "v")
    assoc(answer, topic, "", "v")

    c.line(user["x"] + user["w"], user["y"] + 150, session["x"], session["y"] + 20, BORDER, 1.4)
    c.text(330, 300, "1 → *", 9.5, GREEN, bold=True)

    c.text(30, 866, "Cardinalities shown on each association. Sub-documents (ModuleItem, QuizAnswer) are embedded, not separate collections.",
           10, MUTED, italic=True)
    c.save(f"{OUT}/class-diagram.png")


# ═══════════════════════ 3. ERD ═══════════════════════════════════════════
def erd():
    c = Canvas(1200, 800)
    c.ctext(600, 14, "Devotopia — Entity Relationship Diagram", 19, INK, bold=True)

    def ent(x, y, name, pk, fields, w=228, accent=INDIGO):
        head = 25
        rows = [("PK", pk)] + fields
        h = head + 13 * len(rows) + 10
        c.box(x, y, w, h, fill=WHITE, outline=accent, width=1.6, radius=5)
        c.rect(x + 1, y + 1, w - 2, head - 2, fill=INDIGO_BG, outline=INDIGO_BG, width=0)
        c.line(x, y + head, x + w, y + head, accent, 1.4)
        c.ctext(x + w / 2, y + 5, name, 12, INK, bold=True)
        for i, (tag, f) in enumerate(rows):
            yy = y + head + 4 + i * 13
            col = AMBER if tag == "PK" else (GREEN if tag == "FK" else MUTED)
            if tag:
                c.text(x + 8, yy, tag, 8.5, col, bold=True)
            c.text(x + 32, yy, f, 9.5, INK)
        return {"x": x, "y": y, "w": w, "h": h}

    user = ent(40, 60, "USER", "_id", [
        ("", "email «unique»"), ("", "passwordHash"), ("", "name"),
        ("", "role"), ("", "plan"), ("", "subscriptionStatus")])

    roadmap = ent(460, 60, "ROADMAP", "_id", [
        ("FK", "userId → USER"), ("", "title"), ("", "targetRole"),
        ("", "totalEstimatedHours"), ("", "status")])

    module = ent(860, 60, "MODULE_ITEM", "id", [
        ("FK", "roadmapId → ROADMAP"), ("", "title"), ("", "difficulty"),
        ("", "estimatedHours"), ("", "prerequisites[]"), ("", "status")])

    quiz = ent(460, 290, "QUIZ_SESSION", "_id", [
        ("FK", "userId → USER"), ("FK", "moduleId → MODULE_ITEM"),
        ("", "score"), ("", "passed"), ("", "status")])

    answer = ent(860, 290, "QUIZ_ANSWER", "_id", [
        ("FK", "sessionId → QUIZ_SESSION"), ("", "question"),
        ("", "correct"), ("", "difficulty"), ("", "timeTaken")])

    topic = ent(860, 500, "USER_TOPIC_RESULT", "_id", [
        ("FK", "userId → USER"), ("", "topicId"), ("", "attempts"),
        ("", "failedAttempts"), ("", "failPercentage")])

    cv = ent(40, 300, "CV", "_id", [
        ("FK", "userId → USER «unique»"), ("", "personal"),
        ("", "experience[]"), ("", "skills[]")])

    cert = ent(40, 470, "TRACK_CERTIFICATION", "_id", [
        ("FK", "userId → USER"), ("", "certificateId"), ("", "trackTitle"),
        ("", "issuedAt")])

    pay = ent(40, 645, "PAYMENT", "_id", [
        ("FK", "userId → USER"), ("", "paypalOrderId «unique»"),
        ("", "amount"), ("", "plan")])

    job = ent(460, 520, "JOB", "_id", [
        ("", "title"), ("", "company"), ("", "requiredSkills[]"),
        ("", "salaryMin / salaryMax")])

    def crow(a, b, left_card, right_card, horizontal=True):
        if horizontal:
            x1 = a["x"] + a["w"]; y1 = a["y"] + 34
            x2 = b["x"]; y2 = b["y"] + 34
            c.line(x1, y1, x2, y2, MUTED, 1.4)
            c.text(x1 + 6, y1 - 15, left_card, 10, GREEN, bold=True)
            c.text(x2 - 26, y2 - 15, right_card, 10, GREEN, bold=True)
        else:
            x1 = a["x"] + a["w"] / 2; y1 = a["y"] + a["h"]
            x2 = b["x"] + b["w"] / 2; y2 = b["y"]
            c.line(x1, y1, x2, y2, MUTED, 1.4)
            c.text(x1 + 8, y1 + 4, left_card, 10, GREEN, bold=True)
            c.text(x2 + 8, y2 - 16, right_card, 10, GREEN, bold=True)

    crow(user, roadmap, "1", "0..*")
    crow(roadmap, module, "1", "*")
    crow(quiz, answer, "1", "5")
    crow(roadmap, quiz, "", "", horizontal=False)
    crow(answer, topic, "", "", horizontal=False)
    crow(user, cv, "1", "0..1", horizontal=False)
    crow(cv, cert, "", "", horizontal=False)
    crow(cert, pay, "", "", horizontal=False)
    crow(quiz, job, "", "", horizontal=False)

    c.line(user["x"] + user["w"], user["y"] + 120, quiz["x"], quiz["y"] + 34, MUTED, 1.4)
    c.text(330, 250, "1 → *", 10, GREEN, bold=True)

    c.text(40, 770, "PK = primary key   ·   FK = foreign reference   ·   MODULE_ITEM and QUIZ_ANSWER are embedded sub-documents in MongoDB.",
           10, MUTED, italic=True)
    c.save(f"{OUT}/erd.png")


# ═══════════════════════ 4. SYSTEM ARCHITECTURE ═══════════════════════════
def architecture():
    c = Canvas(1180, 900)
    c.ctext(590, 14, "Devotopia — System Architecture", 19, INK, bold=True)

    def layer(y, h, title, color, bg):
        c.box(40, y, 1100, h, fill=bg, outline=color, width=1.6, radius=10)
        c.text(56, y + 8, title, 11.5, color, bold=True)

    def chip(x, y, w, label, sub=None, color=INDIGO, bg=WHITE, h=44):
        c.box(x, y, w, h, fill=bg, outline=color, width=1.4, radius=6)
        c.ctext(x + w / 2, y + (9 if sub else 14), label, 10.5, INK, bold=True)
        if sub:
            c.ctext(x + w / 2, y + 25, sub, 9, MUTED)

    # Client
    layer(46, 108, "PRESENTATION  ·  apps/web", INDIGO, INDIGO_BG)
    for i, (lab, sub) in enumerate([
        ("Next.js 14", "App Router · 24 routes"), ("React 18 + TS", "Tailwind · DaisyUI"),
        ("Redux Toolkit", "client state"), ("Recharts", "lazy-loaded"),
        ("PWA", "manifest · service worker")]):
        chip(62 + i * 214, 82, 200, lab, sub)

    c.arrow(590, 154, 590, 196, MUTED, 1.6, 9)
    c.text(600, 164, "apiFetch()  ·  access token in memory  ·  refresh token in httpOnly cookie", 9.5, MUTED, italic=True)

    # Security
    layer(200, 82, "SECURITY  ·  runs before every controller", AMBER, AMBER_BG)
    for i, (lab, sub) in enumerate([
        ("JwtAuthGuard", "global · deny by default"), ("RolesGuard", "learner/company/mentor/admin"),
        ("assertSelfOrAdmin", "resource ownership"), ("Throttler + Helmet", "rate limit · headers")]):
        chip(62 + i * 270, 232, 256, lab, sub, color=AMBER)

    c.arrow(590, 282, 590, 314, MUTED, 1.6, 9)

    # Application
    layer(318, 128, "APPLICATION  ·  apps/api  ·  NestJS 11  ·  40 modules · 118 routes", INDIGO, INDIGO_BG)
    for i, lab in enumerate(["Auth", "Roadmap", "Assessment", "CV", "Hiring", "Community", "Payment", "Admin"]):
        chip(62 + i * 136, 350, 124, lab, None, h=32)
    c.box(62, 392, 1056, 44, fill=GREEN_BG, outline=GREEN, width=1.4, radius=6)
    c.ctext(590, 400, "DOMAIN RULES  —  deterministic, unit-tested, never delegated to a model", 10.5, INK, bold=True)
    c.ctext(590, 416, "difficulty ladder (2-answer streak)  ·  weighted score (1.0 / 1.5 / 2.0)  ·  pass at 70%  ·  remedial at 30%  ·  prerequisite unlocking", 9, MUTED)

    c.arrow(300, 452, 300, 492, MUTED, 1.6, 9)
    c.arrow(590, 452, 590, 492, MUTED, 1.6, 9)
    c.arrow(880, 452, 880, 492, MUTED, 1.6, 9)

    # Data
    layer(496, 96, "DATA", GREEN, GREEN_BG)
    for i, (lab, sub) in enumerate([
        ("MongoDB Atlas", "49 Mongoose schemas"), ("Qdrant", "vector · cosine similarity"),
        ("Redis + BullMQ", "remedial generation queue")]):
        chip(62 + i * 362, 530, 344, lab, sub, color=GREEN)

    c.arrow(590, 600, 590, 640, MUTED, 1.6, 9)

    # AI chain
    layer(644, 106, "AI LAYER  ·  one chain, tried in order, always ends in a deterministic mock", INDIGO, INDIGO_BG)
    names = ["OpenAI", "Gemini", "Groq", "HuggingFace", "Mock"]
    subs = ["gpt-4o-mini", "2.5 / 2.0 flash", "llama-3.3-70b", "Llama-3.1-8B", "deterministic"]
    for i, (n, s) in enumerate(zip(names, subs)):
        col = GREEN if n == "Mock" else INDIGO
        bg = GREEN_BG if n == "Mock" else WHITE
        chip(62 + i * 214, 680, 190, n, s, color=col, bg=bg)
        if i < 4:
            c.arrow(62 + i * 214 + 192, 702, 62 + (i + 1) * 214 - 4, 702, MUTED, 1.4, 6)
    c.ctext(590, 730, "a provider that errors, or returns a reply failing the shape check, falls through to the next — never to the user",
            9, MUTED, italic=True)

    # External
    layer(766, 84, "EXTERNAL SERVICES  ·  server-side only — no provider key ever reaches the browser", MUTED, SLATE_BG)
    for i, lab in enumerate(["PayPal", "Cloudinary", "Resend", "AssemblyAI", "Appwrite", "Adzuna"]):
        chip(62 + i * 178, 798, 166, lab, None, color=MUTED, h=32)

    c.save(f"{OUT}/architecture.png")


if __name__ == "__main__":
    print("generating diagrams…")
    use_case()
    class_diagram()
    erd()
    architecture()
    print("done")
