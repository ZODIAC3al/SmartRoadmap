from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
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
OUTPUT = ROOT / "output" / "pdf" / "SmartRoadmap-Arabic-User-Guide.pdf"

GREEN = colors.HexColor("#14B889")
GREEN_DARK = colors.HexColor("#08785C")
INK = colors.HexColor("#17211D")
MUTED = colors.HexColor("#60706A")
LIGHT = colors.HexColor("#EEF8F4")
BORDER = colors.HexColor("#D8E6E0")
WHITE = colors.white


pdfmetrics.registerFont(TTFont("Tahoma", r"C:\Windows\Fonts\tahoma.ttf"))
pdfmetrics.registerFont(TTFont("Tahoma-Bold", r"C:\Windows\Fonts\tahomabd.ttf"))


def rtl(text: str) -> str:
    """Shape Arabic and reorder it for ReportLab's left-to-right text engine."""
    return get_display(arabic_reshaper.reshape(text))


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="ArabicTitle",
        fontName="Tahoma-Bold",
        fontSize=28,
        leading=38,
        textColor=INK,
        alignment=TA_CENTER,
        spaceAfter=14,
    )
)
styles.add(
    ParagraphStyle(
        name="ArabicSubtitle",
        fontName="Tahoma",
        fontSize=13,
        leading=22,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="ArabicH1",
        fontName="Tahoma-Bold",
        fontSize=21,
        leading=30,
        textColor=GREEN_DARK,
        alignment=TA_RIGHT,
        spaceBefore=4,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="ArabicH2",
        fontName="Tahoma-Bold",
        fontSize=15,
        leading=23,
        textColor=INK,
        alignment=TA_RIGHT,
        spaceBefore=8,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="ArabicBody",
        fontName="Tahoma",
        fontSize=10.2,
        leading=18,
        textColor=INK,
        alignment=TA_RIGHT,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="ArabicBullet",
        fontName="Tahoma",
        fontSize=9.8,
        leading=17,
        textColor=INK,
        alignment=TA_RIGHT,
        rightIndent=10,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="ArabicCaption",
        fontName="Tahoma",
        fontSize=8.5,
        leading=14,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceBefore=5,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="EnglishSmall",
        fontName="Tahoma",
        fontSize=8,
        leading=12,
        textColor=MUTED,
        alignment=TA_LEFT,
    )
)


def p(text: str, style: str = "ArabicBody"):
    return Paragraph(rtl(text), styles[style])


def bullet(text: str):
    return p(text, "ArabicBullet")


def route(text: str):
    return Paragraph(text, styles["EnglishSmall"])


def section_title(text: str):
    return p(text, "ArabicH1")


def subsection(text: str):
    return p(text, "ArabicH2")


def screenshot(filename: str, caption: str):
    path = SCREENSHOTS / filename
    if not path.exists():
        return [p("تعذر العثور على صورة هذه الشاشة.", "ArabicCaption")]
    with PILImage.open(path) as im:
        width, height = im.size
    max_w = 17.6 * cm
    max_h = 10.7 * cm
    scale = min(max_w / width, max_h / height)
    img = Image(str(path), width=width * scale, height=height * scale)
    img.hAlign = "CENTER"
    return [img, p(caption, "ArabicCaption")]


def role_table():
    rows = [
        ["الدور", "الهدف الأساسي", "أهم الصلاحيات"],
        ["المتعلّم", "تطوير المهارات والوصول لفرصة مناسبة", "خارطة تعلم، اختبارات، سيرة ذاتية، جواز مهارات، وظائف، موجّهون"],
        ["الشركة", "البحث عن مواهب موثّقة", "لوحة المرشحين، البحث والتصفية، مقارنة الجاهزية، التواصل"],
        ["الموجّه", "تقديم التوجيه ومتابعة الجلسات", "ملف موجّه، توافر وخبرة، إدارة الجلسات، ملاحظات وتقييمات"],
        ["المدير", "تشغيل المنصة وحمايتها", "المستخدمون والأدوار، التحليلات، البلاغات، سجل العمليات"],
    ]
    data = [[p(cell, "ArabicBody") for cell in row] for row in rows]
    table = Table(data, colWidths=[3.1 * cm, 5.0 * cm, 9.0 * cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def feature_table():
    rows = [
        ["الوظيفة", "ما الذي تفعله؟", "المستخدمون"],
        ["التسجيل والدخول", "إنشاء جلسة آمنة، تحديث الرموز، تسجيل الخروج من جهاز أو كل الأجهزة", "الجميع"],
        ["الإعداد الأولي", "تحديد الوظيفة المستهدفة والخلفية والمهارات لتخصيص الخطة", "المتعلّم"],
        ["خارطة التعلّم", "إنشاء وحدات متدرجة، قياس التقدم، تمديد الخطة وإغلاق فجوات المهارات", "المتعلّم"],
        ["الاختبار التكيفي", "اختيار أسئلة حسب المستوى وتسجيل النتيجة وفتح الخطوة التالية أو العلاجية", "المتعلّم"],
        ["منشئ السيرة", "رفع أو بناء السيرة، تحسين المحتوى، المعاينة والتصدير", "المتعلّم"],
        ["جواز المهارات", "عرض الدرجات والشارات والمشروعات الموثقة في ملف قابل للمشاركة", "المتعلّم والشركة"],
        ["مطابقة الوظائف", "حساب التوافق وإظهار المهارات الناقصة وربطها بخطة تعلم", "المتعلّم والشركة"],
        ["المجتمع والموارد", "نشر ومناقشة وتصويت وإبلاغ، مع توصيات تعلم مناسبة", "الجميع بعد الدخول"],
        ["الموجّهون", "اكتشاف الموجّه المناسب وحجز جلسة ومتابعتها وتقييمها", "المتعلّم والموجّه"],
        ["الرسائل والإشعارات", "محادثات مباشرة وتنبيهات قابلة للقراءة أو الحذف", "كل الحسابات"],
        ["الإدارة", "مراقبة الأرقام والمستخدمين والمحتوى المبلغ عنه وسجل التدقيق", "المدير"],
    ]
    data = [[p(cell, "ArabicBody") for cell in row] for row in rows]
    table = Table(data, colWidths=[3.4 * cm, 10.2 * cm, 3.5 * cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.45, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
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
        canvas.setFont("Tahoma", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(1.5 * cm, 0.7 * cm, f"SmartRoadmap  |  User Guide")
        canvas.drawRightString(width - 1.5 * cm, 0.7 * cm, str(doc.page))
        canvas.setStrokeColor(BORDER)
        canvas.line(1.5 * cm, 1.0 * cm, width - 1.5 * cm, 1.0 * cm)
    canvas.restoreState()


story = []

# Cover
story += [
    Spacer(1, 2.6 * cm),
    p("سمارت رودماب", "ArabicTitle"),
    Paragraph("SmartRoadmap", ParagraphStyle("CoverEN", parent=styles["Title"], fontName="Tahoma-Bold", fontSize=24, textColor=GREEN, alignment=TA_CENTER)),
    Spacer(1, 0.4 * cm),
    p("دليل المشروع وطريقة الاستخدام لكل نوع مستخدم", "ArabicSubtitle"),
    Spacer(1, 0.7 * cm),
]
story += screenshot("01-home.png", "الصفحة الرئيسية: ملخص القيمة التي تقدمها المنصة للمتعلّمين والشركات.")
story += [
    Spacer(1, 0.25 * cm),
    p("إصدار الدليل: يوليو 2026", "ArabicCaption"),
    PageBreak(),
]

# Project overview
story += [
    section_title("1. ما هو مشروع SmartRoadmap؟"),
    p("منصة ذكية تربط بين التعلّم المخصص وإثبات المهارة والتوظيف. يبدأ المستخدم بتحديد هدفه المهني، ثم تقيس المنصة مستواه، وتبني خارطة تعلم تكيفية، وتوثّق نتائج الاختبارات داخل جواز مهارات، ثم تقارن الملف بفرص العمل واحتياجات الشركات."),
    subsection("الفكرة في أربع خطوات"),
    bullet("قياس المستوى الحالي وتحديد الفجوات بدلاً من تقديم منهج واحد للجميع."),
    bullet("توليد مسار تعلم متدرج للوصول إلى وظيفة مستهدفة."),
    bullet("تحويل التقدم والاختبارات والمشروعات إلى أدلة مهارة قابلة للمراجعة."),
    bullet("مطابقة المرشح بالوظائف وإتاحة ملف موثّق للشركات."),
    Spacer(1, 0.25 * cm),
    role_table(),
    PageBreak(),
    section_title("2. خريطة الوظائف الأساسية"),
    feature_table(),
    Spacer(1, 0.3 * cm),
    p("ملاحظة: الصلاحيات الحقيقية تُفحص في الخادم مع كل طلب، وليست معتمدة على إخفاء الزر في الواجهة فقط."),
    PageBreak(),
]

# Common access
story += [
    section_title("3. البدء: التسجيل والدخول"),
    subsection("إنشاء حساب جديد"),
    bullet("افتح صفحة التسجيل واختر نوع الحساب: متعلّم أو شركة."),
    bullet("اكتب الاسم والبريد الإلكتروني وكلمة مرور لا تقل عن ثمانية أحرف وتضم حروفاً وأرقاماً."),
    bullet("للمتعلّم: اختر الهدف الوظيفي والتعليم. للشركة: أدخل اسم الشركة والمجال والموقع."),
    bullet("بعد التسجيل تُنشأ الجلسة وينتقل المتعلّم للإعداد الأولي، بينما تنتقل الشركة إلى لوحة المواهب."),
]
story += screenshot("03-register.png", "صفحة إنشاء الحساب وخيار تحديد نوع المستخدم.")
story += [
    subsection("تسجيل الدخول واسترجاع الحساب"),
    bullet("أدخل البريد وكلمة المرور. رمز الوصول يُستخدم للطلبات القصيرة، ورمز التحديث محفوظ في ملف ارتباط آمن."),
    bullet("يمكن طلب رابط إعادة تعيين كلمة المرور، وبعد التغيير تُلغى الجلسات القديمة للحماية."),
    bullet("تسجيل الخروج العادي ينهي الجلسة الحالية، وتسجيل الخروج من جميع الأجهزة يلغي كل الجلسات."),
]
story += screenshot("02-login.png", "صفحة الدخول بالبريد وكلمة المرور، مع مسار استرجاع كلمة المرور.")
story += [PageBreak()]

# Learner
story += [
    section_title("4. طريقة استخدام حساب المتعلّم"),
    subsection("الخطوة 1: الإعداد الأولي"),
    bullet("اختر الوظيفة المستهدفة مثل Frontend أو Backend أو Data Science أو DevOps، أو اكتب هدفاً مخصصاً."),
    bullet("أدخل الخلفية الحالية والمهارات التي تعرفها حتى لا يكرر المسار موضوعات أتقنتها."),
    bullet("راجع البيانات ثم اطلب إنشاء المسار. عند عدم توفر خدمة ذكاء اصطناعي خارجية، تستخدم بيئة التطوير خطة تجريبية بديلة."),
]
story += screenshot("06-onboarding.png", "معالج الإعداد الأولي واختيار الوظيفة المستهدفة.")
story += [
    subsection("الخطوة 2: لوحة المتعلّم"),
    bullet("تعرض درجة الجاهزية المهنية، عدد المراحل المكتملة، الشارات، المهمة الحالية، وأفضل فرصة مطابقة."),
    bullet("من شريط التنقل تصل إلى خارطة التعلم والسيرة والوظائف والمجتمع والموجّهين والموارد."),
    bullet("زر Study Buddy يفتح مساعداً تعليمياً يحتفظ بتاريخ المحادثة ويمكن إعادة ضبطه."),
    p("عند عدم وجود جلسة دخول، تظهر شاشة حماية تطلب تسجيل الدخول قبل عرض البيانات الشخصية."),
]
story += screenshot("05-learner-dashboard.png", "بوابة حماية لوحة المتعلّم قبل إظهار بيانات الجاهزية والتقدم.")
story += [PageBreak()]

story += [
    section_title("5. خارطة التعلم والاختبار التكيفي"),
    subsection("خارطة التعلم"),
    bullet("كل خارطة مرتبطة بوظيفة مستهدفة وتتكون من وحدات مرتبة حسب المستوى."),
    bullet("كل وحدة تعرض العنوان والوصف والمهارات والموارد والحالة والمدة المتوقعة."),
    bullet("يمكن تحديث حالة الوحدة، حساب نسبة التقدم، تمديد المسار بمهارات إضافية، أو حذف المسار وإعادة بنائه."),
    subsection("الاختبارات"),
    bullet("ابدأ الاختبار من الوحدة المناسبة، ثم أجب سؤالاً بعد الآخر."),
    bullet("الخادم يضبط صعوبة الأسئلة حسب الأداء ويحسب الدرجة النهائية."),
    bullet("عند النجاح تُسجّل النتيجة وتُفتح الخطوة التالية؛ وعند الضعف يمكن إضافة وحدة علاجية أقصر."),
    bullet("الدرجات الناجحة تتحول إلى دليل داخل جواز المهارات."),
    p("مسارات الواجهة:"),
    route("/roadmap     /quiz/[moduleId]"),
    PageBreak(),
]

story += [
    section_title("6. منشئ السيرة الذاتية الذكي"),
    bullet("ابدأ من نموذج جاهز أو ارفع ملف السيرة ليتم استخراج البيانات المتاحة."),
    bullet("عدّل المعلومات الأساسية، الملخص، الخبرات، التعليم، المهارات والمشروعات."),
    bullet("تبويب Guidance يقدم إرشادات، وAnalysis يراجع الاكتمال، وMatching يقارن السيرة بمتطلبات الوظائف."),
    bullet("يمكن طلب تحسين الصياغة بالذكاء الاصطناعي، ثم حفظ النسخة وتصديرها بصيغة PDF."),
    bullet("رفع الصورة الشخصية يمر عبر خدمة رفع الصور المهيأة للمشروع."),
]
story += screenshot("08-cv-builder.png", "محرر السيرة: حقول التحرير في المنتصف ومعاينة حية قابلة للتصدير.")
story += [PageBreak()]

story += [
    section_title("7. جواز المهارات ومطابقة الوظائف"),
    subsection("جواز المهارات"),
    bullet("ملف مختصر يضم درجة المسار المهني، الجاهزية للتوظيف، درجات الاختبارات، الشارات والمشروعات الموثقة."),
    bullet("يستطيع المتعلّم مشاركة رابط الملف العام بدلاً من الاعتماد على ادعاءات غير موثّقة في السيرة."),
    bullet("تستخدم الشركات هذه البيانات لفرز المرشحين حسب المهارة الفعلية."),
]
story += screenshot("09-skill-passport.png", "جواز المهارات الموثّق ودرجات التقييم والجاهزية.")
story += [
    subsection("مطابقة الوظائف وإغلاق الفجوات"),
    bullet("تعرض المنصة الوظائف المتاحة ونسبة التوافق لكل وظيفة."),
    bullet("تُقارن مهارات الملف والسيرة بمتطلبات الوظيفة لإظهار المهارات الموجودة والناقصة."),
    bullet("خيار إغلاق الفجوة يضيف المهارات الناقصة إلى خارطة التعلم بدلاً من الاكتفاء برفض المطابقة."),
    bullet("يمكن استخدام جواز المهارات عند التقديم أو مشاركة الملف مع مسؤول التوظيف."),
    PageBreak(),
]

story += [
    section_title("8. الموارد والمجتمع والموجّهون"),
    subsection("الموارد"),
    bullet("تصفّح الموارد التعليمية أو اطلب توصيات مرتبطة بالخارطة النشطة."),
    bullet("يمكن إضافة مورد جديد وتقييم الموارد بالتصويت لمساعدة المجتمع على إبراز المحتوى المفيد."),
    subsection("المجتمع"),
    bullet("اختر مساحة موضوعية، اقرأ المنشورات، أنشئ منشوراً، صوّت وأضف تعليقاً."),
    bullet("يمكن الإبلاغ عن منشور أو تعليق أو مورد أو ملف موجّه؛ ينتقل البلاغ إلى فريق الإدارة."),
    subsection("الموجّهون"),
    bullet("ابحث عن موجّه حسب الخبرة أو استعرض التوصيات المناسبة لهدفك."),
    bullet("احجز جلسة بموعد وموضوع، وتابع حالتها، ثم أضف تقييماً بعد اكتمالها."),
    bullet("استخدم الرسائل للتواصل والمتابعة قبل الجلسة أو بعدها."),
    p("مسارات الواجهة:"),
    route("/resources     /community     /mentors     /messages"),
    PageBreak(),
]

story += [
    section_title("9. الملف الشخصي والإشعارات والإعدادات"),
    bullet("حدّث الاسم واسم المستخدم والهاتف والنبذة والصورة الشخصية."),
    bullet("اختر اللغة العربية أو الإنجليزية، وبدّل بين الوضع الفاتح والداكن."),
    bullet("صفحة الإشعارات تعرض التنبيهات، وتسمح بتعليم إشعار أو الجميع كمقروء، أو حذف إشعار."),
    bullet("صفحة الرسائل تجمع المحادثات وتعرض الطرف الآخر ودوره وتاريخ الرسائل."),
    bullet("الواجهة توفر خيار تنزيل تطبيق مستقل حسب نظام التشغيل عندما تكون حزمة التطبيق متاحة."),
    bullet("بعض خيارات كلمة المرور في صفحة الملف ما زالت محاكاة في الواجهة الحالية؛ مسار الاسترجاع الفعلي يعمل من صفحات المصادقة."),
    PageBreak(),
]

# Company
story += [
    section_title("10. طريقة استخدام حساب الشركة"),
    subsection("الدخول إلى لوحة المواهب"),
    bullet("أنشئ حساب Recruiter أو سجّل الدخول بحساب Company موثّق."),
    bullet("الحسابات الأخرى لا تستطيع فتح بيانات المرشحين؛ الخادم يتحقق من الدور قبل إرجاع القائمة."),
]
story += screenshot("17-company-dashboard.png", "بوابة تقييد لوحة الشركة عندما لا توجد جلسة Recruiter صالحة.")
story += [
    subsection("البحث عن المرشحين"),
    bullet("استخدم مربع البحث بالاسم أو الوظيفة أو المهارة."),
    bullet("رشّح النتائج حسب الوظيفة المستهدفة، درجة المطابقة، ونسبة تقدم التعلم."),
    bullet("افتح بطاقة المرشح لمراجعة المهارات والسيرة وجواز المهارات ودرجة الجاهزية."),
    bullet("تواصل مع المرشح عبر الرسائل عند وجود تطابق مناسب."),
    subsection("إدارة الفرص"),
    bullet("واجهة الخادم تدعم إنشاء وظيفة بمتطلباتها، استعراض الوظائف، إعادة فهرستها، وإغلاق فجوات المرشحين."),
    bullet("الخطة المخصصة للشركات تفتح مستوى خدمة Company Tier عند إتمام الدفع."),
    PageBreak(),
]

# Mentor
story += [
    section_title("11. طريقة استخدام حساب الموجّه"),
    bullet("يُنشئ الموجّه ملفه المتخصص ويحدد المسمى والنبذة والخبرات والمهارات والسعر والتوافر."),
    bullet("يظهر الملف في دليل الموجّهين ويمكن أن يظهر ضمن التوصيات الملائمة للمتعلّم."),
    bullet("من قائمة الجلسات يراجع الطلبات ويغيّر الحالة إلى مقبولة أو مكتملة أو مرفوضة حسب سير الجلسة."),
    bullet("بعد الجلسة يسجل ملاحظات وتوصيات تساعد المتعلّم على تحديث خطواته القادمة."),
    bullet("التقييمات مرتبطة بجلسات مكتملة حتى تعكس تجربة حقيقية، وتظهر في ملف الموجّه."),
    bullet("الرسائل تستخدم لترتيب التفاصيل ومشاركة الملاحظات دون كشف صلاحيات مستخدم آخر."),
    subsection("تسلسل العمل المقترح"),
    bullet("استكمال الملف والتوافر."),
    bullet("مراجعة طلب الحجز وقبوله."),
    bullet("التواصل مع المتعلّم وتنفيذ الجلسة."),
    bullet("إغلاق الجلسة مع الملاحظات، ثم استلام التقييم."),
    PageBreak(),
]

# Admin
story += [
    section_title("12. طريقة استخدام حساب المدير"),
    subsection("لوحة المتابعة"),
    bullet("تعرض إجمالي المستخدمين والمتعلّمين والشركات والموجّهين، نشاط الاختبارات، الوظائف، المدفوعات والجلسات."),
    bullet("قسم الرؤى الذكية يلخص المخاطر التشغيلية وجودة التوجيه ويقترح إجراءات."),
]
story += screenshot("19-admin-dashboard.png", "بوابة الإدارة المحمية قبل عرض المؤشرات والعمليات الحساسة.")
story += [
    subsection("إدارة المستخدمين"),
    bullet("البحث في الحسابات، إنشاء مستخدم، تعديل بياناته ودوره، أو حذف الحساب."),
    bullet("لا يمكن للمدير إزالة دوره من نفسه، ولا حذف أو تخفيض آخر مدير في النظام."),
    bullet("تغيير المستخدم من دور الموجّه يزيل ملف الموجّه المرتبط لتجنب ظهور ملف بلا صلاحية."),
    subsection("مراجعة المحتوى"),
    bullet("عرض البلاغات حسب الحالة، مراجعة نوع المحتوى والسبب، ثم الحل أو الرفض أو الحذف."),
    bullet("يمكن حذف منشور أو تعليق أو مورد مخالف، أو إزالة ملف موجّه وإعادة الحساب لدور متعلّم."),
    subsection("سجل التدقيق"),
    bullet("تُسجّل العمليات الحساسة مثل إنشاء المستخدم، تغيير الدور، الحذف وحل البلاغات مع هوية المدير."),
    PageBreak(),
]

# Shared system
story += [
    section_title("13. الدفع والخطط"),
    bullet("الخطة المجانية مناسبة للبدء وتجربة الوظائف الأساسية."),
    bullet("خطة Pro Learner تفتح مزايا المتعلّم المدفوعة، وخطة Company Tier مخصصة للشركات."),
    bullet("تدفق الدفع ينشئ طلباً ثم يؤكده ويحدّث خطة الحساب."),
    bullet("في بيئة التطوير يمكن محاكاة PayPal؛ في الإنتاج يجب ضبط بيانات PayPal الحقيقية."),
]
story += screenshot("04-pricing.png", "صفحة الخطط والأسعار ونقطة الانتقال إلى الاشتراك.")
story += [PageBreak()]

story += [
    section_title("14. كيف يعمل المشروع تقنياً؟"),
    bullet("الواجهة: Next.js مع React وTypeScript وTailwind وDaisyUI، وتعمل على المنفذ 3001 محلياً."),
    bullet("الخادم: NestJS مع وحدات مستقلة للمصادقة والخارطة والاختبارات والسيرة والتوظيف والمجتمع والتوجيه والإدارة."),
    bullet("البيانات: MongoDB للمستخدمين والخرائط والنتائج والرسائل والجلسات والمدفوعات وسجل التدقيق."),
    bullet("البحث الدلالي: Qdrant لفهرسة الوظائف والموارد، مع وضع بديل عند عدم تهيئته."),
    bullet("الذكاء الاصطناعي: مزودات Gemini أو Groq خلف خدمة موحدة، مع نتائج تجريبية آمنة عند غياب المفاتيح."),
    bullet("الصور: Cloudinary عند ضبط بياناته. السيرة: محلل خارجي اختياري مع محلل محلي بديل."),
    bullet("الأمان: كلمات مرور مشفرة، رموز وصول وتحديث، ملفات ارتباط آمنة، تحديد معدل الطلبات، أدوار وملكية، والتحقق من المدخلات."),
    subsection("مسار البيانات المختصر"),
    p("الواجهة ترسل طلباً مصادقاً إلى الخادم، والخادم يتحقق من الجلسة والدور والملكية، ثم يقرأ أو يحدّث MongoDB ويستدعي خدمة الذكاء الاصطناعي أو البحث عند الحاجة، وبعد ذلك يعيد نتيجة محددة الصلاحيات للواجهة."),
    PageBreak(),
]

story += [
    section_title("15. ملاحظات التشغيل والحدود الحالية"),
    bullet("تشغيل كل الوظائف محلياً يحتاج MongoDB، بينما Redis وQdrant مطلوبان فقط للخصائص التي تعتمد عليهما حسب الإعداد."),
    bullet("مفاتيح Gemini أو Groq وCloudinary وPayPal وGoogle Sign-In اختيارية في التطوير لكنها مطلوبة لتشغيل التكامل الحقيقي في الإنتاج."),
    bullet("الوظائف المعروضة تعتمد على بيانات مزروعة في قاعدة البيانات؛ جامع وظائف Adzuna غير موصل حالياً."),
    bullet("الإرسال البريدي يسجل الروابط في سجل الخادم عند غياب مزود البريد، ولا ينبغي استخدام ذلك في الإنتاج."),
    bullet("صور الدليل مأخوذة من النسخة المحلية الحالية. بعض الشاشات المحمية تظهر بوابة الدخول عندما لا توجد جلسة صالحة، وهو سلوك أمني مقصود."),
    subsection("ترتيب تجربة المشروع"),
    bullet("ابدأ بحساب متعلّم وأكمل الإعداد الأولي."),
    bullet("أنشئ خارطة، افتح وحدة، ثم نفّذ اختباراً."),
    bullet("ابنِ السيرة وراجع جواز المهارات والوظائف المطابقة."),
    bullet("جرّب المجتمع والموارد وحجز جلسة موجّه."),
    bullet("انتقل لحساب شركة لمراجعة المرشحين، ثم حساب مدير لمراجعة المستخدمين والبلاغات."),
    PageBreak(),
]

story += [
    Spacer(1, 4.0 * cm),
    p("انتهى دليل SmartRoadmap", "ArabicTitle"),
    p("هذا الدليل يشرح تجربة المستخدم والوظائف الأساسية كما هي موجودة في المشروع الحالي.", "ArabicSubtitle"),
    Spacer(1, 0.5 * cm),
    Paragraph("SmartRoadmap - Learn. Verify. Get Hired.", ParagraphStyle("EndEN", parent=styles["Normal"], fontName="Tahoma-Bold", fontSize=13, textColor=GREEN_DARK, alignment=TA_CENTER)),
]


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=1.5 * cm,
    leftMargin=1.5 * cm,
    topMargin=1.45 * cm,
    bottomMargin=1.35 * cm,
    title="SmartRoadmap Arabic User Guide",
    author="SmartRoadmap",
    subject="Project overview and user guides by role",
)
doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
print(OUTPUT)
