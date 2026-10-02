#!/usr/bin/env python3
"""TRA hub generator - בונה דף HTML אחד עם קישורים וטורניר השחמט.
הרצה: python3 tra_hub.py -> tra-hub.html
Related Claude reference (not imported):
https://claude.ai/public/artifacts/5617a45a-eb49-49b4-8cc4-18567b8e12b9
"""
from html import escape
from pathlib import Path

G = "https://tomerangel212-png.github.io/-/"

LINK_GROUPS = [
    ("🌐 עץ תרא 3 · ציבורי", "פתוח לכולם", "open", [
        ("עץ תרא 3 — ציבורי", "https://tra-links-public.tomerangel212.chatgpt.site", False)]),
    ("🎮 משחקי היטסטר", "פעיל", "open", [
        ("HITSTER TRA", G + "hitster.html", False),
        ("HITSTER 888", G + "hitster-888.html", False),
        ("HITSTER 888 — English", G + "hitster-888-en.html", False),
        ("היטסטר לנייד", G + "hitster-mobile.html", False)]),
    ("🔒 עצים מוגבלים", "דורש התחברות", "locked", [
        ("עץ תרא 1 — מנהל", "https://tra-links-admin.tomerangel212.chatgpt.site", True),
        ("עץ תרא 2 — חברים", "https://tra-links-members.tomerangel212.chatgpt.site", True)]),
]

TOURNAMENT = {
    "title": "טורניר שחמט · כפר בלום 2026",
    "winner": "עידו פישר",
    "quarterfinals": [
        ("תומר אנג׳ל", "דוד אטון"),
        ("ינון משולם", "מתן פישר"),
        ("מיכאל ששר", "אבישי פישר"),
        ("דן ששר", "עידו פישר"),
    ],
}

CSS = """
:root{--bg:#f4f7f9;--card:#fff;--ink:#0b1e28;--mute:#5b6f7a;--line:#dbe4e9;--acc:#0a8f7a;--lock:#b4572b}
@media(prefers-color-scheme:dark){:root{--bg:#081922;--card:#0e2733;--ink:#eaf4f7;--mute:#8fa8b3;--line:#1b3a49;--acc:#2fd0b3;--lock:#f0905a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,Arial,sans-serif;line-height:1.5}
main{max-width:720px;margin:0 auto;padding:24px 16px 40px}header{text-align:center}h1{font-size:2rem;letter-spacing:.12em;margin:0}
header p{color:var(--mute);margin:.25rem 0 0}section{margin-top:22px}h2{font-size:1rem;display:flex;gap:8px;align-items:center;margin:0 0 10px}
.badge{font-size:.72rem;padding:2px 8px;border-radius:99px;border:1px solid var(--line);color:var(--mute)}
.open{color:var(--acc);border-color:var(--acc)}.locked{color:var(--lock);border-color:var(--lock)}
.row,.qf{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:8px}
.row a{color:var(--ink);text-decoration:none;font-weight:600}.row small{display:block;color:var(--mute);direction:ltr;text-align:right;overflow-wrap:anywhere}
.qf{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}.qf b{grid-column:1/-1;color:var(--mute);font-size:.78rem}
.qf em{font-style:normal;color:var(--mute);font-size:.8rem}.w{font-weight:700;color:var(--acc)}
.champ{background:var(--acc);color:#fff;border-radius:14px;padding:12px;text-align:center;font-size:1.1rem;margin-bottom:8px}
footer{margin-top:32px;text-align:center;color:var(--mute);font-size:.8rem}
"""

def links_html():
    out = []
    for title, badge, cls, items in LINK_GROUPS:
        out.append(f'<section><h2>{title} <span class="badge {cls}">{badge}</span></h2>')
        for name, url, locked in items:
            icon = "🔒 " if locked else ""
            out.append(f'<div class="row"><a href="{escape(url)}" target="_blank" rel="noopener">'
                       f'{icon}{escape(name)}<small>{escape(url.replace("https://", ""))}</small></a></div>')
        out.append("</section>")
    return "\n".join(out)

def tournament_html():
    t = TOURNAMENT
    out = [f'<section><h2>♟️ {escape(t["title"])} <span class="badge open">הסתיים</span></h2>',
           f'<div class="champ">🏆 מנצח הטורניר: <b>{escape(t["winner"])}</b></div>']
    for i, (a, b) in enumerate(t["quarterfinals"], 1):
        mark = lambda n: f'<span class="w">{escape(n)} 🏆</span>' if n == t["winner"] else f"<span>{escape(n)}</span>"
        out.append(f'<div class="qf"><b>רבע גמר {i}</b>{mark(a)}<em>נגד</em>{mark(b)}</div>')
    out.append("</section>")
    return "\n".join(out)

def build():
    return f"""<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRA · מרכז קישורים</title><style>{CSS}</style></head>
<body><main>
<header><h1>TRA</h1><p>מרכז הקישורים של תומר · רפאל · אנג׳ל</p></header>
{links_html()}
{tournament_html()}
<footer>© 2026 Tomer Rafael Angel · All Rights Reserved</footer>
</main></body></html>"""

if __name__ == "__main__":
    Path(__file__).with_name("tra-hub.html").write_text(build(), encoding="utf-8")
    print("נוצר: tra-hub.html")
