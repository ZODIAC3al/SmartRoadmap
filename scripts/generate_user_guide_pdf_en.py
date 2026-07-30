from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "output" / "screenshots"
OUTPUT = ROOT / "output" / "pdf" / "SmartRoadmap-English-User-Guide.pdf"

GREEN = colors.HexColor("#14B889")
GREEN_DARK = colors.HexColor("#08785C")
INK = colors.HexColor("#17211D")
MUTED = colors.HexColor("#60706A")
LIGHT = colors.HexColor("#EEF8F4")
BORDER = colors.HexColor("#D8E6E0")
WHITE = colors.white

base = getSampleStyleSheet()
styles = {
    "title": ParagraphStyle(
        "Title",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        textColor=INK,
        alignment=TA_CENTER,
        spaceAfter=12,
    ),
    "subtitle": ParagraphStyle(
        "Subtitle",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=20,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=12,
    ),
    "h1": ParagraphStyle(
        "H1",
        parent=base["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=26,
        textColor=GREEN_DARK,
        alignment=TA_LEFT,
        spaceBefore=4,
        spaceAfter=10,
    ),
    "h2": ParagraphStyle(
        "H2",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=19,
        textColor=INK,
        alignment=TA_LEFT,
        spaceBefore=8,
        spaceAfter=5,
    ),
    "body": ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=15.5,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=5,
    ),
    "bullet": ParagraphStyle(
        "Bullet",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=9.8,
        leading=15,
        textColor=INK,
        leftIndent=10,
        firstLineIndent=-8,
        spaceAfter=3,
    ),
    "caption": ParagraphStyle(
        "Caption",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceBefore=5,
        spaceAfter=8,
    ),
    "route": ParagraphStyle(
        "Route",
        parent=base["Code"],
        fontName="Courier",
        fontSize=8,
        leading=12,
        textColor=MUTED,
        alignment=TA_LEFT,
    ),
}


def p(text, style="body"):
    return Paragraph(text, styles[style])


def bullet(text):
    return p("- " + text, "bullet")


def screenshot(filename, caption):
    path = SCREENSHOTS / filename
    if not path.exists():
        return [p("Screenshot unavailable.", "caption")]
    with PILImage.open(path) as im:
        width, height = im.size
    max_w = 17.6 * cm
    max_h = 10.7 * cm
    scale = min(max_w / width, max_h / height)
    image = Image(str(path), width=width * scale, height=height * scale)
    image.hAlign = "CENTER"
    return [image, p(caption, "caption")]


def formatted_table(rows, widths):
    data = [[p(cell, "body") for cell in row] for row in rows]
    table = Table(data, colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def page_decor(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(GREEN)
    canvas.rect(0, height - 0.18 * cm, width, 0.18 * cm, stroke=0, fill=1)
    if doc.page > 1:
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(1.5 * cm, 0.7 * cm, "SmartRoadmap | User Guide")
        canvas.drawRightString(width - 1.5 * cm, 0.7 * cm, str(doc.page))
        canvas.setStrokeColor(BORDER)
        canvas.line(1.5 * cm, 1.0 * cm, width - 1.5 * cm, 1.0 * cm)
    canvas.restoreState()


story = [
    Spacer(1, 2.5 * cm),
    p("SmartRoadmap", "title"),
    p("Complete Project Guide and Role-Based User Manual", "subtitle"),
    Spacer(1, 0.7 * cm),
]
story += screenshot(
    "01-home.png",
    "Home page: the platform's value proposition for learners and employers.",
)
story += [
    Spacer(1, 0.25 * cm),
    p("Guide edition: July 2026", "caption"),
    PageBreak(),
]

story += [
    p("1. What is SmartRoadmap?", "h1"),
    p(
        "SmartRoadmap is an intelligent learning and hiring platform. A learner selects a career target, completes a skill assessment, receives an adaptive roadmap, proves progress through assessments, and presents verified results through a Skill Passport. Employers can then discover and compare candidates using evidence rather than resume claims alone."
    ),
    p("The platform journey", "h2"),
    bullet("Assess the learner's current level and identify skill gaps."),
    bullet("Generate a personalized sequence of learning modules."),
    bullet("Verify progress through adaptive quizzes, projects, and badges."),
    bullet("Match the verified profile with suitable job opportunities."),
    Spacer(1, 0.3 * cm),
    formatted_table(
        [
            ["Role", "Primary goal", "Key capabilities"],
            [
                "Learner",
                "Develop skills and become job-ready",
                "Roadmaps, quizzes, CV, Skill Passport, jobs, mentors",
            ],
            [
                "Company",
                "Find verified candidates",
                "Talent board, filters, candidate comparison, messaging",
            ],
            [
                "Mentor",
                "Guide learners",
                "Mentor profile, availability, session management, feedback",
            ],
            [
                "Administrator",
                "Operate and protect the platform",
                "Users, roles, analytics, moderation, audit logs",
            ],
        ],
        [3.2 * cm, 5.0 * cm, 8.9 * cm],
    ),
    PageBreak(),
    p("2. Core Feature Map", "h1"),
    formatted_table(
        [
            ["Feature", "Purpose", "Users"],
            [
                "Authentication",
                "Secure registration, login, token refresh, and session revocation",
                "All users",
            ],
            [
                "Onboarding",
                "Collect target role, background, and existing skills",
                "Learner",
            ],
            [
                "Learning roadmap",
                "Generate modules, track progress, extend or rebuild the path",
                "Learner",
            ],
            [
                "Adaptive assessment",
                "Adjust question difficulty and record verified results",
                "Learner",
            ],
            [
                "CV builder",
                "Upload, edit, enhance, preview, save, and export a resume",
                "Learner",
            ],
            [
                "Skill Passport",
                "Present verified scores, badges, projects, and readiness",
                "Learner and company",
            ],
            [
                "Job matching",
                "Calculate fit, expose gaps, and connect gaps to learning",
                "Learner and company",
            ],
            [
                "Community and resources",
                "Post, discuss, vote, report, and discover learning material",
                "Signed-in users",
            ],
            [
                "Mentorship",
                "Discover mentors, book sessions, provide feedback and ratings",
                "Learner and mentor",
            ],
            [
                "Administration",
                "Manage users, analytics, reports, and sensitive operations",
                "Administrator",
            ],
        ],
        [3.5 * cm, 10.0 * cm, 3.6 * cm],
    ),
    Spacer(1, 0.3 * cm),
    p(
        "Authorization is enforced by the API on every request. Hiding a button in the interface is not treated as a security boundary."
    ),
    PageBreak(),
]

story += [
    p("3. Getting Started: Registration and Login", "h1"),
    p("Create an account", "h2"),
    bullet("Open the registration page and select Learner or Recruiter."),
    bullet(
        "Enter a name, valid email address, and a password of at least eight characters containing letters and numbers."
    ),
    bullet(
        "Learners select a career goal and education level. Recruiters provide company information."
    ),
    bullet(
        "After registration, learners continue to onboarding while recruiters enter the talent workflow."
    ),
]
story += screenshot(
    "03-register.png", "Account registration and role selection."
)
story += [
    p("Login and account recovery", "h2"),
    bullet("Sign in with email and password."),
    bullet(
        "The application uses a short-lived access token and a protected refresh cookie."
    ),
    bullet(
        "Password reset links invalidate previous sessions after a successful change."
    ),
    bullet(
        "Users can sign out of the current device or revoke all active sessions."
    ),
]
story += screenshot(
    "02-login.png", "Email and password login with account recovery access."
)
story += [PageBreak()]

story += [
    p("4. Learner User Guide", "h1"),
    p("Step 1: Complete onboarding", "h2"),
    bullet(
        "Choose Frontend, Backend, Data Science, DevOps, or enter a custom target role."
    ),
    bullet(
        "Describe your current background and select skills you already know."
    ),
    bullet("Review the information and request a personalized roadmap."),
    bullet(
        "If no external AI provider is configured, development mode uses a safe demonstration roadmap."
    ),
]
story += screenshot(
    "06-onboarding.png", "Onboarding wizard and career target selection."
)
story += [
    p("Step 2: Use the learner dashboard", "h2"),
    bullet(
        "Review career readiness, completed milestones, verified badges, the current mission, and the best job match."
    ),
    bullet(
        "Use the navigation bar to open the roadmap, CV, jobs, community, mentors, and resources."
    ),
    bullet(
        "Study Buddy provides contextual learning help and retains a resettable conversation history."
    ),
    p(
        "Without a valid login session, the dashboard displays an access gate before personal data is shown."
    ),
]
story += screenshot(
    "05-learner-dashboard.png",
    "Dashboard access gate protecting learner progress and career data.",
)
story += [PageBreak()]

story += [
    p("5. Learning Roadmap and Adaptive Assessments", "h1"),
    p("Learning roadmap", "h2"),
    bullet(
        "Each roadmap belongs to a target career and contains ordered learning modules."
    ),
    bullet(
        "A module includes a title, description, skills, resources, status, and estimated duration."
    ),
    bullet(
        "Learners can update module status, view progress, add missing skills, extend the roadmap, or delete it and start again."
    ),
    p("Adaptive quiz", "h2"),
    bullet("Start the quiz attached to the relevant learning module."),
    bullet("Answer one question at a time while the system adjusts difficulty."),
    bullet(
        "Passing results unlock progress and become evidence in the Skill Passport."
    ),
    bullet(
        "A weak result can create a shorter remedial module instead of leaving the learner blocked."
    ),
    p("Interface routes:", "body"),
    p("/roadmap     /quiz/[moduleId]", "route"),
    PageBreak(),
]

story += [
    p("6. AI Resume and CV Builder", "h1"),
    bullet("Start from the editor or upload an existing resume for parsing."),
    bullet(
        "Edit personal information, summary, experience, education, skills, and projects."
    ),
    bullet(
        "Use Guidance for writing help, Analysis for completeness, and Matching for job alignment."
    ),
    bullet(
        "Request AI-assisted wording improvements, save the CV, and export it as PDF."
    ),
    bullet(
        "Profile photo uploads use the project's configured image upload service."
    ),
]
story += screenshot(
    "08-cv-builder.png",
    "CV editor with structured fields and a live export-ready preview.",
)
story += [PageBreak()]

story += [
    p("7. Skill Passport and Job Matching", "h1"),
    p("Verified Skill Passport", "h2"),
    bullet(
        "The passport summarizes career score, hiring readiness, assessment results, badges, and verified projects."
    ),
    bullet(
        "Learners can share a public profile instead of relying only on unverified resume statements."
    ),
    bullet(
        "Employers use the same evidence to rank and compare candidates."
    ),
]
story += screenshot(
    "09-skill-passport.png",
    "Verified Skill Passport with readiness and assessment evidence.",
)
story += [
    p("Job matching and gap closure", "h2"),
    bullet("Browse available jobs and review the fit percentage for each role."),
    bullet(
        "The system compares the learner profile and CV with required job skills."
    ),
    bullet(
        "Missing skills are displayed explicitly instead of being hidden behind a rejection."
    ),
    bullet(
        "Close Gap adds missing requirements to the roadmap so the learner can work toward a stronger match."
    ),
    PageBreak(),
]

story += [
    p("8. Resources, Community, and Mentors", "h1"),
    p("Learning resources", "h2"),
    bullet(
        "Browse resources or request recommendations linked to the active roadmap."
    ),
    bullet(
        "Add a useful resource and vote to help the community surface strong content."
    ),
    p("Community", "h2"),
    bullet("Join a topic space, read posts, publish, vote, and comment."),
    bullet(
        "Report inappropriate posts, comments, resources, or mentor profiles for administrator review."
    ),
    p("Mentorship", "h2"),
    bullet("Search mentors by expertise or use personalized recommendations."),
    bullet("Book a session with a date, time, and discussion topic."),
    bullet(
        "Track session status, use messages for follow-up, and submit a rating after completion."
    ),
    p("/resources     /community     /mentors     /messages", "route"),
    PageBreak(),
]

story += [
    p("9. Profile, Messages, Notifications, and Settings", "h1"),
    bullet(
        "Update name, username, phone number, biography, and profile picture."
    ),
    bullet("Switch between English and Arabic and select light or dark theme."),
    bullet(
        "Read notifications, mark one or all as read, and delete notifications."
    ),
    bullet(
        "Use the messaging inbox to review conversations, partner roles, and message history."
    ),
    bullet(
        "The interface offers a standalone application download when a build is available for the current operating system."
    ),
    bullet(
        "Some password controls on the profile screen are currently simulated; the actual recovery flow is implemented through the authentication pages."
    ),
    PageBreak(),
]

story += [
    p("10. Company and Recruiter User Guide", "h1"),
    p("Access the talent board", "h2"),
    bullet("Register as a Recruiter or sign in with a verified Company account."),
    bullet(
        "Other roles cannot retrieve candidate data because the API checks the role before returning results."
    ),
]
story += screenshot(
    "17-company-dashboard.png",
    "Recruiter access gate displayed without a valid Company session.",
)
story += [
    p("Find and review candidates", "h2"),
    bullet("Search by candidate name, target role, or skill."),
    bullet(
        "Filter by role category, match score, and learning progress."
    ),
    bullet(
        "Open a candidate record to review skills, CV, Skill Passport, and readiness."
    ),
    bullet("Start a conversation when the candidate is a strong fit."),
    p("Job management", "h2"),
    bullet(
        "The API supports creating jobs, listing jobs, reindexing opportunities, and linking candidate gaps to learning."
    ),
    bullet(
        "Company Tier is activated after the company subscription flow completes."
    ),
    PageBreak(),
]

story += [
    p("11. Mentor User Guide", "h1"),
    bullet(
        "Create a mentor profile with title, biography, expertise, skills, hourly rate, and availability."
    ),
    bullet(
        "The profile appears in the mentor directory and can be recommended to matching learners."
    ),
    bullet(
        "Review incoming bookings and update the session to accepted, completed, or rejected."
    ),
    bullet(
        "After a session, record notes and recommendations that guide the learner's next steps."
    ),
    bullet(
        "Ratings are connected to completed sessions so the mentor score reflects a real interaction."
    ),
    bullet(
        "Use messages to coordinate session details and share follow-up guidance."
    ),
    p("Recommended workflow", "h2"),
    bullet("Complete the mentor profile and availability."),
    bullet("Review and accept a booking request."),
    bullet("Message the learner and conduct the session."),
    bullet("Close the session with feedback and receive a rating."),
    PageBreak(),
]

story += [
    p("12. Administrator User Guide", "h1"),
    p("Operations dashboard", "h2"),
    bullet(
        "Review totals for users, learners, companies, mentors, assessments, jobs, payments, and mentorship activity."
    ),
    bullet(
        "AI insights summarize operational risks, mentorship quality, and recommended actions."
    ),
]
story += screenshot(
    "19-admin-dashboard.png",
    "Protected administrator gate before sensitive controls and metrics.",
)
story += [
    p("User management", "h2"),
    bullet("Search, create, edit, change roles, or delete user accounts."),
    bullet(
        "An administrator cannot remove their own admin role or delete or demote the final administrator."
    ),
    bullet(
        "Changing a mentor to another role removes the related mentor profile."
    ),
    p("Content moderation and audit logs", "h2"),
    bullet(
        "Review reports by status, inspect the reason and content type, then resolve, reject, or remove the content."
    ),
    bullet(
        "Sensitive operations such as user creation, role changes, deletion, and report resolution are added to the audit log."
    ),
    PageBreak(),
]

story += [
    p("13. Plans and Payments", "h1"),
    bullet("The Free plan supports initial access and basic platform features."),
    bullet("Pro Learner unlocks premium learner capabilities."),
    bullet("Company Tier provides subscription access for employer workflows."),
    bullet(
        "The payment flow creates an order, captures it, and updates the user's plan."
    ),
    bullet(
        "PayPal can be simulated in development. Production requires real PayPal credentials."
    ),
]
story += screenshot(
    "04-pricing.png", "Pricing page and subscription entry point."
)
story += [PageBreak()]

story += [
    p("14. Technical Architecture", "h1"),
    bullet(
        "Frontend: Next.js, React, TypeScript, Tailwind CSS, and DaisyUI. The local web application runs on port 3001."
    ),
    bullet(
        "Backend: NestJS modules for authentication, roadmaps, assessments, CVs, hiring, community, mentorship, and administration."
    ),
    bullet(
        "Database: MongoDB stores users, roadmaps, results, messages, sessions, payments, and audit logs."
    ),
    bullet(
        "Semantic search: Qdrant indexes opportunities and resources, with a fallback mode when it is not configured."
    ),
    bullet(
        "AI providers: Gemini or Groq behind a shared service, with deterministic demonstration results when keys are unavailable."
    ),
    bullet(
        "External services: Cloudinary for images, optional resume parsing, PayPal for payments, and a mail provider for transactional email."
    ),
    bullet(
        "Security: password hashing, access and refresh tokens, secure cookies, rate limiting, role checks, ownership checks, and validated input."
    ),
    p("Simplified request flow", "h2"),
    p(
        "The frontend sends an authenticated request. The backend validates the session, role, ownership, and input. It then reads or updates MongoDB and calls AI or search services when required before returning a permission-scoped response."
    ),
    PageBreak(),
]

story += [
    p("15. Operation Notes and Current Limitations", "h1"),
    bullet(
        "Local operation requires MongoDB. Redis and Qdrant are needed only for the features configured to use them."
    ),
    bullet(
        "Gemini or Groq, Cloudinary, PayPal, Google Sign-In, and mail provider credentials are optional in development but required for their real production integrations."
    ),
    bullet(
        "Job listings currently rely on seeded database content. The Adzuna scraper is not connected."
    ),
    bullet(
        "Without a mail provider, development logs verification and reset links to the API console. This must not be used as a production email strategy."
    ),
    bullet(
        "Screenshots in this guide were captured from the current local application. Protected pages display an access gate when no valid session is available."
    ),
    p("Recommended end-to-end demonstration", "h2"),
    bullet("Create a learner account and complete onboarding."),
    bullet("Generate a roadmap, open a module, and take an assessment."),
    bullet("Build the CV and review the Skill Passport and job matches."),
    bullet("Try resources, community, mentorship, messages, and notifications."),
    bullet(
        "Switch to a Company account to review candidates, then use an Administrator account to review users and reports."
    ),
    PageBreak(),
    Spacer(1, 4 * cm),
    p("End of the SmartRoadmap Guide", "title"),
    p(
        "This document covers the user journeys and major features available in the current project.",
        "subtitle",
    ),
    Spacer(1, 0.5 * cm),
    p("SmartRoadmap - Learn. Verify. Get Hired.", "subtitle"),
]


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
document = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=1.5 * cm,
    leftMargin=1.5 * cm,
    topMargin=1.45 * cm,
    bottomMargin=1.35 * cm,
    title="SmartRoadmap English User Guide",
    author="SmartRoadmap",
    subject="Project overview and user guides by role",
)
document.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
print(OUTPUT)
