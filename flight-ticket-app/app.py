from flask import Flask, render_template_string, request, jsonify
import random, string
from datetime import datetime

app = Flask(__name__)

# ── MOCK DATA ─────────────────────────────────────────────────────────────────
FLIGHTS = [
    {"id": "F001", "airline": "AirZip",    "code": "AZ-204", "logo": "✈",
     "from": "JFK", "to": "LAX", "dep": "06:00", "arr": "09:25", "dur": "5h 25m",
     "stops": "Non-stop", "distance": "2475 mi", "aircraft": "Boeing 737",
     "classes": {"economy": {"seats": 42, "price": 189}, "premium": {"seats": 18, "price": 340},
                 "business": {"seats": 12, "price": 680}, "first": {"seats": 6, "price": 1250}}},
    {"id": "F002", "airline": "SkyFast",   "code": "SF-118", "logo": "🛫",
     "from": "JFK", "to": "LAX", "dep": "08:45", "arr": "12:30", "dur": "5h 45m",
     "stops": "Non-stop", "distance": "2475 mi", "aircraft": "Airbus A320",
     "classes": {"economy": {"seats": 60, "price": 159}, "premium": {"seats": 24, "price": 295},
                 "business": {"seats": 16, "price": 590}, "first": {"seats": 0, "price": 0}}},
    {"id": "F003", "airline": "CloudJet",  "code": "CJ-505", "logo": "🌤",
     "from": "JFK", "to": "LAX", "dep": "11:20", "arr": "15:50", "dur": "6h 30m",
     "stops": "1 Stop", "distance": "2475 mi", "aircraft": "Boeing 787",
     "classes": {"economy": {"seats": 88, "price": 129}, "premium": {"seats": 30, "price": 265},
                 "business": {"seats": 20, "price": 520}, "first": {"seats": 8, "price": 980}}},
    {"id": "F004", "airline": "EagleAir",  "code": "EA-779", "logo": "🦅",
     "from": "JFK", "to": "LAX", "dep": "14:10", "arr": "17:55", "dur": "5h 45m",
     "stops": "Non-stop", "distance": "2475 mi", "aircraft": "Airbus A380",
     "classes": {"economy": {"seats": 22, "price": 215}, "premium": {"seats": 14, "price": 390},
                 "business": {"seats": 8,  "price": 760}, "first": {"seats": 4, "price": 1480}}},
    {"id": "F005", "airline": "SwiftWings","code": "SW-332", "logo": "⚡",
     "from": "JFK", "to": "LAX", "dep": "19:30", "arr": "23:15", "dur": "5h 45m",
     "stops": "Non-stop", "distance": "2475 mi", "aircraft": "Boeing 777",
     "classes": {"economy": {"seats": 76, "price": 175}, "premium": {"seats": 28, "price": 310},
                 "business": {"seats": 18, "price": 640}, "first": {"seats": 6, "price": 1180}}},
]

CITIES = ["New York (JFK)", "Los Angeles (LAX)", "Chicago (ORD)", "Houston (IAH)",
          "Miami (MIA)", "Dallas (DFW)", "Seattle (SEA)", "Denver (DEN)",
          "Atlanta (ATL)", "Boston (BOS)", "San Francisco (SFO)", "Las Vegas (LAS)"]

TAKEN_SEATS = {
    "F001": [2, 5, 8, 12, 15, 18, 22, 26, 30, 35, 40, 44, 48, 52, 56, 60, 64, 68, 72],
    "F002": [1, 4, 7, 10, 14, 17, 20, 24, 28, 32, 36, 41, 45, 49, 53, 57, 61, 65],
    "F003": [3, 6, 9, 11, 16, 19, 23, 27, 31, 37, 42, 46, 50, 54, 58, 62, 66, 70],
    "F004": [2, 5, 8, 13, 17, 21, 25, 29, 33, 38, 43, 47, 51, 55, 59, 63],
    "F005": [1, 3, 6, 9, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
}

bookings = {}

# ── HTML (inline — no templates folder needed) ────────────────────────────────
HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>FlyZip — Next-Gen Flight Booking</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#04050f;--s1:#090b1a;--s2:#0f1229;--s3:#141830;--bd:#1e2240;--bd2:#252b50;--cyan:#00e5ff;--purple:#7c4dff;--pink:#f50057;--yellow:#ffd740;--green:#00e676;--red:#ff1744;--txt:#e8eaf6;--muted:#5c6080;--font:'Space Grotesk',sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--txt);min-height:100vh;overflow-x:hidden}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px}
::selection{background:var(--cyan);color:#000}
.nav{display:flex;justify-content:space-between;align-items:center;padding:14px 56px;background:rgba(4,5,15,.9);backdrop-filter:blur(24px);position:sticky;top:0;z-index:300;border-bottom:1px solid var(--bd)}
.nav-logo{display:flex;align-items:center;gap:10px;font-size:1.45rem;font-weight:800;color:#fff;letter-spacing:-1px}
.nav-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--cyan),var(--purple));border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem}
.nav-links{display:flex;align-items:center;gap:22px}
.nav-links a{color:var(--muted);text-decoration:none;font-size:.86rem;font-weight:500;transition:color .2s}
.nav-links a:hover{color:var(--txt)}
.nav-cta{background:linear-gradient(135deg,var(--cyan),var(--purple))!important;color:#000!important;padding:8px 20px;border-radius:25px;font-weight:700!important;font-size:.82rem!important}
.stepbar{background:var(--s1);padding:10px 56px;border-bottom:1px solid var(--bd);display:flex;justify-content:center}
.steps-row{display:flex;align-items:center;background:var(--s2);border:1px solid var(--bd);border-radius:50px;padding:4px}
.sp{display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:40px;font-size:.78rem;font-weight:600;color:var(--muted);transition:all .3s;white-space:nowrap}
.sp .sn{width:22px;height:22px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700}
.sp.active{background:linear-gradient(135deg,rgba(0,229,255,.15),rgba(124,77,255,.15));color:var(--cyan);border:1px solid rgba(0,229,255,.3)}
.sp.active .sn{background:var(--cyan);color:#000}
.sp.done{color:var(--green)}.sp.done .sn{background:var(--green);color:#000}
.sdiv{width:18px;height:1px;background:var(--bd);margin:0 2px}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:radial-gradient(ellipse 100% 70% at 50% -10%,rgba(124,77,255,.18) 0%,transparent 65%),var(--bg)}
.hero-particles{position:absolute;inset:0;overflow:hidden}
.particle{position:absolute;border-radius:50%;animation:float linear infinite}
@keyframes float{0%{transform:translateY(100vh) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100px) rotate(720deg);opacity:0}}
.hero-grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(30,34,64,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(30,34,64,.4) 1px,transparent 1px);background-size:50px 50px;mask-image:radial-gradient(ellipse 90% 90% at 50% 50%,black 30%,transparent 80%)}
.hero-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(124,77,255,.12) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.hero-inner{text-align:center;position:relative;z-index:2;padding:40px 20px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,229,255,.07);border:1px solid rgba(0,229,255,.25);color:var(--cyan);padding:7px 16px;border-radius:30px;font-size:.75rem;font-weight:600;margin-bottom:28px;letter-spacing:.5px}
.blink{width:7px;height:7px;border-radius:50%;background:var(--cyan);animation:blink 1.5s infinite}
@keyframes blink{0%,100%{opacity:1;box-shadow:0 0 6px var(--cyan)}50%{opacity:.3;box-shadow:none}}
.hero h1{font-size:4.5rem;font-weight:800;line-height:1.0;letter-spacing:-3px;color:#fff}
.hero h1 .grad{background:linear-gradient(135deg,var(--cyan),var(--purple),var(--pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{color:var(--muted);margin:16px auto 0;font-size:.98rem;max-width:500px;line-height:1.65}
.hero-numbers{display:flex;justify-content:center;gap:48px;margin-top:36px;flex-wrap:wrap}
.hn{text-align:center}
.hn h4{font-size:1.7rem;font-weight:800;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hn p{font-size:.72rem;color:var(--muted);margin-top:2px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}
.search-wrap{max-width:1020px;margin:0 auto;padding:0 24px;position:relative;z-index:3}
.s-card{background:var(--s1);border:1px solid var(--bd);border-radius:22px;padding:28px 32px;position:relative;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.s-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--cyan),var(--purple),var(--pink),var(--yellow),var(--cyan))}
.trip-tabs{display:flex;gap:4px;margin-bottom:22px}
.tt{padding:7px 16px;border-radius:8px;background:transparent;border:1px solid var(--bd);color:var(--muted);font-family:var(--font);font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s}
.tt.on{background:rgba(124,77,255,.15);border-color:var(--purple);color:var(--txt)}
.s-fields{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}
.sf{flex:1;min-width:130px}
.sf label{display:block;font-size:.68rem;font-weight:700;color:var(--muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.8px}
.sf-in{display:flex;align-items:center;gap:9px;background:var(--s2);border:1px solid var(--bd);border-radius:11px;padding:11px 13px;transition:all .2s}
.sf-in:focus-within{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(0,229,255,.08)}
.sf-in .ic{font-size:.95rem;opacity:.55;flex-shrink:0}
.sf-in select,.sf-in input{background:transparent;border:none;outline:none;font-family:var(--font);font-size:.86rem;color:var(--txt);width:100%;cursor:pointer}
.sf-in select option{background:var(--s2);color:var(--txt)}
.sw-wrap{display:flex;align-items:flex-end;padding-bottom:1px}
.sw{width:40px;height:40px;background:var(--s2);border:1px solid var(--bd);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cyan);font-size:.95rem;transition:all .4s;flex-shrink:0}
.sw:hover{transform:rotate(180deg);border-color:var(--cyan)}
.btn-search{background:linear-gradient(135deg,var(--cyan),var(--purple));color:#000;border:none;padding:12px 30px;border-radius:11px;font-family:var(--font);font-size:.92rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .2s;box-shadow:0 4px 22px rgba(124,77,255,.35)}
.btn-search:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(124,77,255,.5)}
.page{padding:30px 56px;max-width:1160px;margin:0 auto}
.hidden{display:none!important}
.ph{display:flex;align-items:center;gap:16px;margin-bottom:26px}
.ph h2{font-size:1.4rem;font-weight:800;color:#fff;letter-spacing:-.5px}
.ph .psub{color:var(--muted);font-size:.82rem;margin-top:2px}
.ml{margin-left:auto}
.btn-back{background:var(--s2);border:1px solid var(--bd);padding:9px 16px;border-radius:10px;cursor:pointer;font-family:var(--font);font-weight:600;color:var(--txt);font-size:.82rem;transition:all .2s;white-space:nowrap}
.btn-back:hover{border-color:var(--cyan);color:var(--cyan)}
.sel-sort{background:var(--s2);border:1px solid var(--bd);color:var(--txt);padding:8px 13px;border-radius:9px;font-family:var(--font);font-size:.8rem;outline:none;cursor:pointer}
.flight-list{display:flex;flex-direction:column;gap:14px}
.fc{background:var(--s1);border:1px solid var(--bd);border-radius:18px;overflow:hidden;cursor:pointer;transition:all .25s;position:relative}
.fc::after{content:'';position:absolute;inset:0;border-radius:18px;box-shadow:inset 0 0 0 1px var(--cyan);opacity:0;transition:opacity .25s}
.fc:hover{transform:translateY(-3px);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.fc:hover::after{opacity:1}
.fc-body{display:flex;align-items:center;gap:18px;padding:20px 26px;flex-wrap:wrap}
.fc-airline{min-width:150px}
.fc-logo{font-size:2rem;margin-bottom:4px}
.fc-aname{font-size:.95rem;font-weight:700;color:#fff}
.fc-code{font-size:.68rem;color:var(--muted);margin-top:2px;letter-spacing:.5px;font-weight:600}
.fc-ac{display:inline-block;padding:3px 9px;border-radius:5px;font-size:.65rem;font-weight:700;background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.2);color:var(--cyan);margin-top:6px}
.fc-time{text-align:center;min-width:80px}
.fc-time h3{font-size:1.5rem;font-weight:800;color:#fff;letter-spacing:-.5px}
.fc-time p{font-size:.68rem;color:var(--muted);margin-top:2px}
.fc-journey{flex:1;text-align:center;padding:0 12px}
.fc-jline{display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:8px}
.jd{width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 8px var(--cyan);flex-shrink:0}
.jd2{width:8px;height:8px;border-radius:50%;background:var(--purple);box-shadow:0 0 8px var(--purple);flex-shrink:0}
.jl{flex:1;height:1px;background:linear-gradient(90deg,var(--cyan),var(--purple));max-width:100px;position:relative}
.jl::after{content:'✈';position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:.9rem}
.fc-journey p{font-size:.75rem;color:var(--muted);font-weight:500}
.fc-stop{font-size:.7rem;padding:3px 9px;border-radius:5px;font-weight:700;display:inline-block;margin-top:4px}
.fc-stop.nonstop{background:rgba(0,230,118,.08);color:var(--green);border:1px solid rgba(0,230,118,.2)}
.fc-stop.onestop{background:rgba(255,215,64,.08);color:var(--yellow);border:1px solid rgba(255,215,64,.2)}
.fc-classes{display:flex;gap:8px;flex-wrap:wrap}
.cc{padding:8px 11px;border-radius:9px;border:1px solid var(--bd);background:var(--s2);cursor:pointer;transition:all .2s;text-align:center;min-width:75px}
.cc:hover{border-color:var(--cyan);background:rgba(0,229,255,.05)}
.cc .ccn{font-size:.62rem;color:var(--muted);font-weight:700;display:block;text-transform:uppercase}
.cc .ccs{font-size:.8rem;color:#fff;font-weight:700;display:block;margin:2px 0}
.cc .ccp{font-size:.68rem;color:var(--cyan);font-weight:600;display:block}
.fc-foot{background:var(--s2);padding:10px 26px;border-top:1px solid var(--bd);display:flex;align-items:center;gap:14px}
.fc-amenity{font-size:.7rem;color:var(--muted);display:flex;align-items:center;gap:5px}
.fc-rating{margin-left:auto;font-size:.8rem;font-weight:700;color:var(--yellow)}
.btn-pick{background:linear-gradient(135deg,var(--cyan),var(--purple));color:#000;border:none;padding:8px 18px;border-radius:8px;font-family:var(--font);font-weight:700;cursor:pointer;font-size:.8rem;transition:all .2s}
.btn-pick:hover{transform:scale(1.05)}
.p3{display:flex;gap:22px;align-items:flex-start}
.p3-main{flex:1}
.cabin-section{background:var(--s1);border:1px solid var(--bd);border-radius:16px;padding:24px;margin-bottom:16px}
.cabin-title{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.cabin-title h3{font-size:.92rem;font-weight:700;color:#fff}
.cabin-badge{padding:4px 10px;border-radius:5px;font-size:.68rem;font-weight:700}
.cb-eco{background:rgba(0,229,255,.1);color:var(--cyan);border:1px solid rgba(0,229,255,.2)}
.cb-pre{background:rgba(124,77,255,.1);color:var(--purple);border:1px solid rgba(124,77,255,.2)}
.cb-biz{background:rgba(255,215,64,.1);color:var(--yellow);border:1px solid rgba(255,215,64,.2)}
.cb-fst{background:rgba(245,0,87,.1);color:var(--pink);border:1px solid rgba(245,0,87,.2)}
.legend-row{display:flex;gap:14px;margin-left:auto;flex-wrap:wrap}
.leg{display:flex;align-items:center;gap:6px;font-size:.7rem;color:var(--muted)}
.lsq{width:16px;height:16px;border-radius:4px}
.lsq.a{background:rgba(0,230,118,.12);border:1.5px solid var(--green)}
.lsq.s{background:linear-gradient(135deg,var(--cyan),var(--purple))}
.lsq.t{background:var(--s3);border:1.5px dashed var(--bd2)}
.plane-nose{text-align:center;padding:10px;font-size:.8rem;color:var(--muted);border-bottom:1px dashed var(--bd2);margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600}
.plane-nose::before,.plane-nose::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--bd2))}
.plane-nose::after{background:linear-gradient(90deg,var(--bd2),transparent)}
.seat-row{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.row-num{font-size:.6rem;color:var(--muted);width:22px;text-align:center;font-weight:600;flex-shrink:0}
.seat{width:44px;height:44px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0;border:1.5px solid transparent}
.seat .sn{font-size:.7rem;font-weight:700}
.seat.avail{background:rgba(0,230,118,.08);border-color:var(--green);color:var(--green)}
.seat.avail:hover{background:rgba(0,230,118,.22);transform:scale(1.12)}
.seat.chosen{background:linear-gradient(135deg,var(--cyan),var(--purple));border-color:var(--cyan);color:#000;transform:scale(1.1);box-shadow:0 0 18px rgba(0,229,255,.4);font-weight:800}
.seat.taken{background:var(--s3);border-color:var(--bd);color:var(--bd2);cursor:not-allowed}
.aisle{width:20px;flex-shrink:0}
.seat-header-row{display:flex;align-items:center;gap:6px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--bd)}
.sh{width:44px;text-align:center;font-size:.65rem;font-weight:700;color:var(--muted);flex-shrink:0}
.sh.ais{width:20px}
.rp{width:275px;position:sticky;top:95px;display:flex;flex-direction:column;gap:13px}
.rp-card{background:var(--s1);border:1px solid var(--bd);border-radius:15px;padding:20px}
.rp-card h3{font-size:.85rem;font-weight:700;color:#fff;margin-bottom:15px}
.rp-row{display:flex;justify-content:space-between;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bd);font-size:.8rem;gap:8px}
.rp-row:last-child{border:none}
.rp-l{color:var(--muted)}.rp-v{font-weight:600;color:var(--txt);text-align:right;font-size:.78rem}
.rp-row.rp-tot{padding-top:10px}
.rp-row.rp-tot .rp-l{font-weight:700;color:var(--txt);font-size:.86rem}
.rp-row.rp-tot .rp-v{font-size:1.1rem;font-weight:800;color:var(--cyan)}
.pf-wrap{display:flex;gap:22px;align-items:flex-start}
.pf-left{flex:1;display:flex;flex-direction:column;gap:13px}
.pf-card{background:var(--s1);border:1px solid var(--bd);border-radius:15px;padding:22px}
.pf-card h4{font-size:.85rem;font-weight:700;color:#fff;margin-bottom:15px;padding-bottom:11px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:10px}
.seat-tag{font-size:.66rem;background:rgba(0,229,255,.1);color:var(--cyan);border:1px solid rgba(0,229,255,.25);padding:3px 9px;border-radius:5px;font-weight:700}
.pf-row{display:flex;gap:11px}
.pf-f{flex:1;display:flex;flex-direction:column;gap:5px}
.pf-f label{font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px}
.pf-f input,.pf-f select{background:var(--s2);border:1px solid var(--bd);color:var(--txt);padding:9px 13px;border-radius:9px;font-family:var(--font);font-size:.84rem;outline:none;transition:all .2s}
.pf-f input:focus,.pf-f select:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(0,229,255,.07)}
.pf-f select option{background:var(--s2)}
.pf-note{font-size:.69rem;color:var(--purple);margin-top:7px;display:flex;align-items:center;gap:5px;font-weight:500}
.bk-panel{width:285px;position:sticky;top:95px;display:flex;flex-direction:column;gap:13px}
.bk-card{background:var(--s1);border:1px solid var(--bd);border-radius:15px;padding:19px}
.bk-card h3{font-size:.85rem;font-weight:700;color:#fff;margin-bottom:13px}
.bk-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.8rem;gap:8px}
.bk-row:last-child{border:none}
.bk-l{color:var(--muted)}.bk-v{font-weight:600;color:var(--txt);text-align:right;font-size:.78rem}
.bk-row.bk-t{padding-top:9px}
.bk-row.bk-t .bk-l{font-weight:700;color:var(--txt);font-size:.85rem}
.bk-row.bk-t .bk-v{font-size:1.05rem;font-weight:800;color:var(--cyan)}
.contact-c{background:var(--s1);border:1px solid var(--bd);border-radius:15px;padding:19px}
.contact-c h4{font-size:.83rem;font-weight:700;color:#fff;margin-bottom:13px}
.contact-c input{width:100%;background:var(--s2);border:1px solid var(--bd);color:var(--txt);padding:10px 13px;border-radius:9px;font-family:var(--font);font-size:.83rem;outline:none;margin-bottom:9px;transition:all .2s}
.contact-c input:focus{border-color:var(--cyan)}
.btn-primary{width:100%;background:linear-gradient(135deg,var(--cyan),var(--purple));color:#000;border:none;padding:13px;border-radius:11px;font-family:var(--font);font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 22px rgba(124,77,255,.3)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(124,77,255,.5)}
.btn-outline{background:transparent;color:var(--cyan);border:1.5px solid var(--cyan);padding:11px 26px;border-radius:11px;font-family:var(--font);font-size:.9rem;font-weight:600;cursor:pointer;transition:all .2s}
.btn-outline:hover{background:rgba(0,229,255,.07)}
.conf-wrap{max-width:660px;margin:36px auto;padding:0 20px}
.conf-head{text-align:center;margin-bottom:26px}
.conf-emoji{font-size:4.5rem;display:block;margin-bottom:14px;animation:pop .6s cubic-bezier(.175,.885,.32,1.275)}
@keyframes pop{from{transform:scale(0) rotate(-20deg)}to{transform:scale(1)}}
.conf-head h2{font-size:2.1rem;font-weight:800;color:#fff;letter-spacing:-1px}
.conf-head p{color:var(--muted);margin-top:8px;font-size:.9rem}
.booking-ref{background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(124,77,255,.08));border:1px solid rgba(0,229,255,.2);border-radius:15px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.br-l .br-lbl{font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:700;margin-bottom:3px}
.br-val{font-size:1.6rem;font-weight:800;color:#fff;letter-spacing:2px;font-family:monospace}
.br-status{background:rgba(0,230,118,.1);color:var(--green);border:1px solid rgba(0,230,118,.3);padding:7px 16px;border-radius:25px;font-size:.72rem;font-weight:700}
.bp{background:var(--s1);border:1px solid var(--bd);border-radius:20px;overflow:hidden;margin-bottom:22px;box-shadow:0 20px 70px rgba(0,0,0,.6)}
.bp-strip{height:4px;background:linear-gradient(90deg,var(--cyan),var(--purple),var(--pink),var(--yellow),var(--cyan));background-size:200% 100%;animation:slide 3s linear infinite}
@keyframes slide{0%{background-position:0% 0}100%{background-position:200% 0}}
.bp-head{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid var(--bd)}
.bp-logo{display:flex;align-items:center;gap:8px;font-size:1rem;font-weight:800;color:#fff}
.bp-logo-icon{width:28px;height:28px;background:linear-gradient(135deg,var(--cyan),var(--purple));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.9rem}
.bp-class{padding:4px 13px;border-radius:20px;font-size:.7rem;font-weight:700;background:rgba(124,77,255,.12);border:1px solid rgba(124,77,255,.3);color:var(--purple)}
.bp-route{display:flex;align-items:center;padding:22px 24px;background:linear-gradient(135deg,rgba(0,229,255,.03),rgba(124,77,255,.03));gap:10px}
.bp-city{flex:1}.bp-city:last-child{text-align:right}
.bp-code{font-size:2.4rem;font-weight:900;color:#fff;letter-spacing:2px;line-height:1}
.bp-city-name{font-size:.7rem;color:var(--muted);margin-top:3px}
.bp-city-time{font-size:1rem;font-weight:700;color:var(--cyan);margin-top:6px}
.bp-city-date{font-size:.66rem;color:var(--muted);margin-top:2px}
.bp-mid{flex:1;text-align:center;padding:0 10px}
.bp-plane-line{width:100%;height:1.5px;background:linear-gradient(90deg,var(--cyan),var(--purple));position:relative;border-radius:2px}
.bp-plane-line::after{content:'▶';position:absolute;right:-5px;top:-7px;color:var(--purple);font-size:.62rem}
.bp-plane-emoji{font-size:1.3rem;margin:8px 0}
.bp-dur{font-size:.66rem;color:var(--muted);font-weight:600}
.bp-details{display:grid;grid-template-columns:repeat(3,1fr);padding:0 24px;border-top:1px solid var(--bd)}
.bp-detail{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.bp-detail:nth-child(3n+2),.bp-detail:nth-child(3n+3){padding-left:14px;border-left:1px solid rgba(255,255,255,.04)}
.bp-detail label{display:block;font-size:.62rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.bp-detail span{font-size:.84rem;font-weight:700;color:var(--txt)}
.bp-pax{padding:14px 24px;border-top:1px dashed var(--bd)}
.bp-pax h5{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:10px}
.pax-row{display:flex;justify-content:space-between;padding:7px 11px;border-radius:7px;background:var(--s2);margin-bottom:4px;font-size:.78rem}
.pax-name{font-weight:600;color:var(--txt)}.pax-seat{color:var(--cyan);font-weight:700}
.bp-foot{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:rgba(0,0,0,.2);border-top:1px solid var(--bd)}
.bp-price label{font-size:.66rem;color:var(--muted);font-weight:600;display:block;margin-bottom:3px}
.bp-price h3{font-size:1.6rem;font-weight:900;background:linear-gradient(135deg,var(--cyan),var(--yellow));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.bp-bc{text-align:center}
.bc-bars{display:flex;gap:2px;justify-content:center;height:40px;align-items:flex-end;margin-bottom:5px}
.bc-bar{border-radius:1px}
.bc-text{font-size:.62rem;color:var(--muted);font-family:monospace;letter-spacing:1px}
.conf-actions{display:flex;gap:13px;justify-content:center}
.conf-actions button{flex:1;max-width:210px}
.toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(120px);background:var(--s2);color:var(--txt);border:1px solid var(--bd);padding:12px 22px;border-radius:11px;font-weight:600;font-size:.82rem;transition:transform .3s;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,.6);display:flex;align-items:center;gap:8px;white-space:nowrap}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast::before{content:'⚠';color:var(--yellow)}
@media(max-width:860px){
  .nav,.stepbar{padding:13px 18px}.hero h1{font-size:2.5rem;letter-spacing:-1.5px}
  .search-wrap{padding:0 14px}.s-fields{flex-direction:column}
  .page{padding:16px 18px}.p3,.pf-wrap{flex-direction:column}
  .rp,.bk-panel{width:100%;position:static}.bp-details{grid-template-columns:1fr 1fr}
  .steps-row{overflow-x:auto;gap:0}.hero-numbers{gap:24px}
}
</style>
</head>
<body>
<nav class="nav">
  <div class="nav-logo"><div class="nav-icon">✈</div>FlyZip</div>
  <div class="nav-links">
    <a href="#">Home</a><a href="#">My Bookings</a>
    <a href="#">Check-In</a><a href="#">Deals</a>
    <a href="#" class="nav-cta">Sign In</a>
  </div>
</nav>
<div class="stepbar">
  <div class="steps-row">
    <div class="sp active" id="si1"><div class="sn">1</div>Search</div>
    <div class="sdiv"></div>
    <div class="sp" id="si2"><div class="sn">2</div>Flights</div>
    <div class="sdiv"></div>
    <div class="sp" id="si3"><div class="sn">3</div>Seats</div>
    <div class="sdiv"></div>
    <div class="sp" id="si4"><div class="sn">4</div>Passengers</div>
    <div class="sdiv"></div>
    <div class="sp" id="si5"><div class="sn">5</div>Done</div>
  </div>
</div>
<section id="page1">
  <div class="hero">
    <div class="hero-particles" id="particles"></div>
    <div class="hero-grid-bg"></div>
    <div class="hero-glow"></div>
    <div style="width:100%;z-index:2">
      <div class="hero-inner">
        <div class="hero-badge"><div class="blink"></div>200+ DESTINATIONS LIVE</div>
        <h1>Fly Anywhere,<br/><span class="grad">Instantly.</span></h1>
        <p class="hero-sub">Book flights in seconds. Best fares, zero hassle.</p>
        <div class="hero-numbers">
          <div class="hn"><h4>200+</h4><p>Destinations</p></div>
          <div class="hn"><h4>50+</h4><p>Airlines</p></div>
          <div class="hn"><h4>2M+</h4><p>Bookings</p></div>
          <div class="hn"><h4>4.9&#9733;</h4><p>Rated</p></div>
        </div>
      </div>
      <div class="search-wrap">
        <div class="s-card">
          <div class="trip-tabs">
            <button class="tt on">One Way</button>
            <button class="tt">Round Trip</button>
            <button class="tt">Multi-City</button>
          </div>
          <div class="s-fields">
            <div class="sf"><label>From</label>
              <div class="sf-in"><span class="ic">&#128205;</span>
                <select id="fromCity">
                  <option value="">Select City</option>
                  {% for c in cities %}<option value="{{ c }}">{{ c }}</option>{% endfor %}
                </select>
              </div>
            </div>
            <div class="sw-wrap"><button class="sw" onclick="swapCities()">&#8644;</button></div>
            <div class="sf"><label>To</label>
              <div class="sf-in"><span class="ic">&#127937;</span>
                <select id="toCity">
                  <option value="">Select City</option>
                  {% for c in cities %}<option value="{{ c }}">{{ c }}</option>{% endfor %}
                </select>
              </div>
            </div>
            <div class="sf"><label>Date</label>
              <div class="sf-in"><span class="ic">&#128197;</span><input type="date" id="depDate"/></div>
            </div>
            <div class="sf"><label>Passengers</label>
              <div class="sf-in"><span class="ic">&#128100;</span>
                <select id="paxCount">
                  <option value="1">1 Adult</option><option value="2">2 Adults</option>
                  <option value="3">3 Adults</option><option value="4">4 Adults</option>
                  <option value="5">5 Adults</option><option value="6">6 Adults</option>
                </select>
              </div>
            </div>
            <div class="sf"><label>Class</label>
              <div class="sf-in"><span class="ic">&#128186;</span>
                <select id="cabinClass">
                  <option value="economy">Economy</option>
                  <option value="premium">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
            </div>
            <button class="btn-search" onclick="doSearch()">Search Flights &#8594;</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="page hidden" id="page2">
  <div class="ph">
    <button class="btn-back" onclick="goTo(1)">&#8592; Back</button>
    <div><h2 id="p2h">Flights</h2><p class="psub" id="p2sub"></p></div>
    <div class="ml" style="display:flex;gap:9px">
      <select class="sel-sort" onchange="sortF(this.value)">
        <option value="price">Price: Low to High</option>
        <option value="dep">Departure Time</option>
        <option value="dur">Duration</option>
      </select>
    </div>
  </div>
  <div class="flight-list" id="flightList"></div>
</section>
<section class="page hidden" id="page3">
  <div class="ph">
    <button class="btn-back" onclick="goTo(2)">&#8592; Back</button>
    <div><h2 id="p3h">Select Your Seat</h2><p class="psub" id="p3sub"></p></div>
  </div>
  <div class="p3">
    <div class="p3-main">
      <div class="cabin-section">
        <div class="cabin-title">
          <h3 id="cabinLabel">Economy Class</h3>
          <span class="cabin-badge cb-eco" id="cabinBadge">ECO</span>
          <div class="legend-row">
            <div class="leg"><div class="lsq a"></div>Available</div>
            <div class="leg"><div class="lsq s"></div>Selected</div>
            <div class="leg"><div class="lsq t"></div>Taken</div>
          </div>
        </div>
        <div class="plane-nose">&#9992; &nbsp; FRONT OF AIRCRAFT &nbsp; &#9992;</div>
        <div class="seat-header-row">
          <div class="sh" style="width:22px"></div>
          <div class="sh">A</div><div class="sh">B</div><div class="sh">C</div>
          <div class="sh ais"></div>
          <div class="sh">D</div><div class="sh">E</div><div class="sh">F</div>
        </div>
        <div id="seatMap"></div>
      </div>
    </div>
    <div class="rp">
      <div class="rp-card">
        <h3>&#9992; Selection</h3>
        <div class="rp-row"><span class="rp-l">Flight</span><span class="rp-v" id="rs-flight">&#8212;</span></div>
        <div class="rp-row"><span class="rp-l">Class</span><span class="rp-v" id="rs-class">&#8212;</span></div>
        <div class="rp-row"><span class="rp-l">Route</span><span class="rp-v" id="rs-route">&#8212;</span></div>
        <div class="rp-row"><span class="rp-l">Selected</span><span class="rp-v" id="rs-seats">None</span></div>
        <div class="rp-row"><span class="rp-l">Fare/Seat</span><span class="rp-v" id="rs-fare">$0</span></div>
        <div class="rp-row rp-tot"><span class="rp-l">Total</span><span class="rp-v" id="rs-total">$0</span></div>
      </div>
      <button class="btn-primary" onclick="toPax()">Continue &#8594;</button>
    </div>
  </div>
</section>
<section class="page hidden" id="page4">
  <div class="ph">
    <button class="btn-back" onclick="goTo(3)">&#8592; Back</button>
    <h2>Passenger Details</h2>
  </div>
  <div class="pf-wrap">
    <div class="pf-left" id="pfLeft"></div>
    <div class="bk-panel">
      <div class="bk-card">
        <h3>Flight Summary</h3>
        <div class="bk-row"><span class="bk-l">Airline</span><span class="bk-v" id="bs-airline">&#8212;</span></div>
        <div class="bk-row"><span class="bk-l">Flight</span><span class="bk-v" id="bs-flight">&#8212;</span></div>
        <div class="bk-row"><span class="bk-l">Route</span><span class="bk-v" id="bs-route">&#8212;</span></div>
        <div class="bk-row"><span class="bk-l">Date</span><span class="bk-v" id="bs-date">&#8212;</span></div>
        <div class="bk-row"><span class="bk-l">Class</span><span class="bk-v" id="bs-class">&#8212;</span></div>
        <div class="bk-row"><span class="bk-l">Seats</span><span class="bk-v" id="bs-seats">&#8212;</span></div>
        <div class="bk-row bk-t"><span class="bk-l">Total</span><span class="bk-v" id="bs-total">&#8212;</span></div>
      </div>
      <div class="contact-c">
        <h4>Contact Info</h4>
        <input type="email" id="cEmail" placeholder="Email address"/>
        <input type="tel" id="cPhone" placeholder="Mobile number"/>
      </div>
      <button class="btn-primary" onclick="doBook()">Pay &amp; Confirm &#8594;</button>
    </div>
  </div>
</section>
<section class="page hidden" id="page5">
  <div class="conf-wrap">
    <div class="conf-head">
      <span class="conf-emoji">&#127882;</span>
      <h2>Boarding Pass Ready!</h2>
      <p>Your flight is confirmed. Have a great trip!</p>
    </div>
    <div class="booking-ref">
      <div class="br-l"><div class="br-lbl">Booking Reference</div><div class="br-val" id="bkRef">&#8212;</div></div>
      <div class="br-status">&#10003; CONFIRMED</div>
    </div>
    <div class="bp">
      <div class="bp-strip"></div>
      <div class="bp-head">
        <div class="bp-logo"><div class="bp-logo-icon">&#9992;</div>FlyZip Boarding Pass</div>
        <div class="bp-class" id="bpClass">Economy</div>
      </div>
      <div class="bp-route">
        <div class="bp-city">
          <div class="bp-code" id="bpFrom">&#8212;</div>
          <div class="bp-city-name" id="bpFromName">&#8212;</div>
          <div class="bp-city-time" id="bpDep">&#8212;</div>
          <div class="bp-city-date" id="bpDepDate">&#8212;</div>
        </div>
        <div class="bp-mid">
          <div class="bp-plane-line"></div>
          <div class="bp-plane-emoji">&#9992;</div>
          <div class="bp-dur" id="bpDur">&#8212;</div>
        </div>
        <div class="bp-city">
          <div class="bp-code" id="bpTo">&#8212;</div>
          <div class="bp-city-name" id="bpToName">&#8212;</div>
          <div class="bp-city-time" id="bpArr">&#8212;</div>
          <div class="bp-city-date">Scheduled Arrival</div>
        </div>
      </div>
      <div class="bp-details">
        <div class="bp-detail"><label>Airline</label><span id="bpAirline">&#8212;</span></div>
        <div class="bp-detail"><label>Flight No.</label><span id="bpFlight">&#8212;</span></div>
        <div class="bp-detail"><label>Aircraft</label><span id="bpAircraft">&#8212;</span></div>
        <div class="bp-detail"><label>Seats</label><span id="bpSeats">&#8212;</span></div>
        <div class="bp-detail"><label>Distance</label><span id="bpDist">&#8212;</span></div>
        <div class="bp-detail"><label>Terminal</label><span>T2 &#8212; Gate B14</span></div>
      </div>
      <div class="bp-pax">
        <h5>Passengers</h5>
        <div id="bpPaxList"></div>
      </div>
      <div class="bp-foot">
        <div class="bp-price"><label>Total Paid</label><h3 id="bpTotal">$0</h3></div>
        <div class="bp-bc">
          <div class="bc-bars" id="bcBars"></div>
          <div class="bc-text" id="bcText">&#8212;</div>
        </div>
      </div>
    </div>
    <div class="conf-actions">
      <button class="btn-outline" onclick="window.print()">&#128424; Print</button>
      <button class="btn-primary" style="max-width:220px" onclick="reset()">New Search</button>
    </div>
  </div>
</section>
<div class="toast" id="toast"><span id="toastMsg"></span></div>
<script>
let flights=[], S={from:'',to:'',date:'',pax:1,cls:'economy',selFlight:null,selSeats:[],taken:[]};
document.addEventListener('DOMContentLoaded',()=>{
  const t=new Date().toISOString().split('T')[0];
  document.getElementById('depDate').value=t;
  document.getElementById('depDate').min=t;
  document.querySelectorAll('.tt').forEach(b=>b.addEventListener('click',function(){
    document.querySelectorAll('.tt').forEach(x=>x.classList.remove('on'));this.classList.add('on');
  }));
  spawnParticles();
});
function spawnParticles(){
  const c=document.getElementById('particles');
  const cols=['rgba(0,229,255,.4)','rgba(124,77,255,.4)','rgba(245,0,87,.3)','rgba(255,215,64,.3)'];
  for(let i=0;i<18;i++){
    const d=document.createElement('div');
    const sz=4+Math.random()*6;
    d.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${8+Math.random()*14}s;animation-delay:${Math.random()*10}s`;
    d.classList.add('particle');c.appendChild(d);
  }
}
function goTo(n){
  [1,2,3,4,5].forEach(i=>{
    document.getElementById('page'+i)?.classList.add('hidden');
    document.getElementById('si'+i)?.classList.remove('active','done');
  });
  document.getElementById('page'+n)?.classList.remove('hidden');
  if(n>1) setTimeout(()=>document.getElementById('page'+n)?.scrollIntoView({behavior:'smooth',block:'start'}),60);
  for(let i=1;i<n;i++) document.getElementById('si'+i)?.classList.add('done');
  document.getElementById('si'+n)?.classList.add('active');
}
function swapCities(){const f=document.getElementById('fromCity'),t=document.getElementById('toCity');[f.value,t.value]=[t.value,f.value]}
function fmtDate(d){return new Date(d+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
async function doSearch(){
  const from=document.getElementById('fromCity').value,to=document.getElementById('toCity').value;
  const date=document.getElementById('depDate').value,pax=parseInt(document.getElementById('paxCount').value);
  const cls=document.getElementById('cabinClass').value;
  if(!from) return toast('Select departure city');
  if(!to) return toast('Select destination city');
  if(from===to) return toast('Cities cannot be same');
  S={...S,from,to,date,pax,cls};
  const res=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from,to,date,pax})});
  const data=await res.json();
  flights=data.flights;
  document.getElementById('p2h').textContent=from.split('(')[1]?.replace(')','')+'  →  '+to.split('(')[1]?.replace(')','');
  document.getElementById('p2sub').textContent=fmtDate(date)+' · '+pax+' Passenger(s) · '+cls.charAt(0).toUpperCase()+cls.slice(1);
  renderFlights(flights);goTo(2);
}
function renderFlights(list){
  const g=document.getElementById('flightList');
  const clsMap={economy:'Economy',premium:'Premium Eco',business:'Business',first:'First Class'};
  if(!list.length){g.innerHTML='<div style="text-align:center;padding:60px;color:var(--muted);background:var(--s1);border-radius:16px">No flights found.</div>';return;}
  g.innerHTML=list.map(f=>{
    const chips=Object.entries(f.classes).filter(([,v])=>v&&v.seats>0).map(([k,v])=>`
      <div class="cc" onclick="event.stopPropagation();pickFlight('${f.id}','${k}')">
        <span class="ccn">${clsMap[k]||k}</span><span class="ccs">${v.seats} Left</span><span class="ccp">$${v.price}</span>
      </div>`).join('');
    return`<div class="fc" onclick="pickFlight('${f.id}','${S.cls}')">
      <div class="fc-body">
        <div class="fc-airline"><div class="fc-logo">${f.logo}</div><div class="fc-aname">${f.airline}</div><div class="fc-code">${f.code}</div><div class="fc-ac">${f.aircraft}</div></div>
        <div class="fc-time"><h3>${f.dep}</h3><p>Departure</p></div>
        <div class="fc-journey">
          <div class="fc-jline"><div class="jd"></div><div class="jl"></div><div class="jd2"></div></div>
          <p>${f.dur} · ${f.distance}</p>
          <div class="fc-stop ${f.stops==='Non-stop'?'nonstop':'onestop'}">${f.stops}</div>
        </div>
        <div class="fc-time"><h3>${f.arr}</h3><p>Arrival</p></div>
        <div class="fc-classes">${chips}</div>
      </div>
      <div class="fc-foot">
        <div class="fc-amenity"><span>\u{1F4F6}</span>WiFi</div>
        <div class="fc-amenity"><span>\u{1F37D}</span>Meals</div>
        <div class="fc-amenity"><span>\u{1F3AC}</span>Entertainment</div>
        <div class="fc-rating">★ 4.${Math.floor(Math.random()*3)+6}</div>
        <button class="btn-pick" onclick="event.stopPropagation();pickFlight('${f.id}','${S.cls}')">Select</button>
      </div>
    </div>`}).join('');
}
function sortF(by){
  let s=[...flights];
  if(by==='price') s.sort((a,b)=>(a.classes[S.cls]?.price||9999)-(b.classes[S.cls]?.price||9999));
  else if(by==='dep') s.sort((a,b)=>a.dep.localeCompare(b.dep));
  else s.sort((a,b)=>a.dur.localeCompare(b.dur));
  renderFlights(s);
}
function pickFlight(id,cls){
  S.selFlight=flights.find(f=>f.id===id);S.cls=cls;S.selSeats=[];S.taken=S.selFlight.taken||[];
  document.getElementById('p3h').textContent=S.selFlight.airline+' · '+S.selFlight.code;
  document.getElementById('p3sub').textContent=S.selFlight.dep+' → '+S.selFlight.arr+' · '+S.selFlight.dur;
  const clsMap={economy:'Economy Class',premium:'Premium Economy',business:'Business Class',first:'First Class'};
  const badgeMap={economy:'cb-eco',premium:'cb-pre',business:'cb-biz',first:'cb-fst'};
  document.getElementById('cabinLabel').textContent=clsMap[cls]||cls;
  document.getElementById('cabinBadge').textContent=cls.toUpperCase().substring(0,3);
  document.getElementById('cabinBadge').className='cabin-badge '+badgeMap[cls];
  buildSeatMap(cls);updRightPanel();goTo(3);
}
function buildSeatMap(cls){
  const map=document.getElementById('seatMap'),taken=S.taken;
  const rows=cls==='first'?4:cls==='business'?8:cls==='premium'?12:26;
  const startRow=cls==='first'?1:cls==='business'?5:cls==='premium'?13:20;
  let html='',num=1;
  for(let r=startRow;r<startRow+rows;r++){
    html+=`<div class="seat-row"><div class="row-num">${r}</div>`;
    const sps=cls==='first'||cls==='business'?2:3;
    for(let s=0;s<sps;s++,num++){
      const isTaken=taken.includes(num),isSel=S.selSeats.find(x=>x.num===num);
      const c=isTaken?'taken':isSel?'chosen':'avail';
      const alpha=String.fromCharCode(65+s);
      const click=isTaken?'':` onclick="tglSeat(${num},'${r}${alpha}')"`;
      html+=`<div class="seat ${c}" id="seat-${num}"${click}><span class="sn">${r}${alpha}</span></div>`;
    }
    html+='<div class="aisle"></div>';
    for(let s=0;s<sps;s++,num++){
      const isTaken=taken.includes(num),isSel=S.selSeats.find(x=>x.num===num);
      const c=isTaken?'taken':isSel?'chosen':'avail';
      const alpha=String.fromCharCode(65+sps+s);
      const click=isTaken?'':` onclick="tglSeat(${num},'${r}${alpha}')"`;
      html+=`<div class="seat ${c}" id="seat-${num}"${click}><span class="sn">${r}${alpha}</span></div>`;
    }
    html+='</div>';
  }
  map.innerHTML=html;
}
function tglSeat(num,lbl){
  const idx=S.selSeats.findIndex(s=>s.num===num);
  if(idx>-1) S.selSeats.splice(idx,1);
  else{if(S.selSeats.length>=S.pax) return toast('Max '+S.pax+' seat(s)');S.selSeats.push({num,lbl});}
  document.getElementById('seat-'+num).className='seat '+(S.selSeats.find(s=>s.num===num)?'chosen':'avail');
  updRightPanel();
}
function updRightPanel(){
  const f=S.selFlight,c=S.cls,fare=f?.classes[c]?.price||0;
  const clsMap={economy:'Economy',premium:'Premium Eco',business:'Business',first:'First Class'};
  document.getElementById('rs-flight').textContent=f?f.airline+' '+f.code:'—';
  document.getElementById('rs-class').textContent=clsMap[c]||c;
  document.getElementById('rs-route').textContent=(S.from.match(/\(([^)]+)\)/)?.[1]||S.from)+' → '+(S.to.match(/\(([^)]+)\)/)?.[1]||S.to);
  document.getElementById('rs-seats').textContent=S.selSeats.length?S.selSeats.map(s=>s.lbl).join(', '):'None';
  document.getElementById('rs-fare').textContent='$'+fare;
  document.getElementById('rs-total').textContent='$'+(fare*S.selSeats.length);
}
function toPax(){
  if(!S.selSeats.length) return toast('Please select at least 1 seat');
  if(S.selSeats.length<S.pax) return toast('Select '+S.pax+' seat(s) for all passengers');
  buildPaxForm();
  const f=S.selFlight,c=S.cls,fare=f.classes[c].price;
  const clsMap={economy:'Economy',premium:'Premium Economy',business:'Business Class',first:'First Class'};
  document.getElementById('bs-airline').textContent=f.airline;
  document.getElementById('bs-flight').textContent=f.code;
  document.getElementById('bs-route').textContent=S.from.split('(')[1]?.replace(')','')+'→'+S.to.split('(')[1]?.replace(')','');
  document.getElementById('bs-date').textContent=fmtDate(S.date);
  document.getElementById('bs-class').textContent=clsMap[c];
  document.getElementById('bs-seats').textContent=S.selSeats.map(s=>s.lbl).join(', ');
  document.getElementById('bs-total').textContent='$'+(fare*S.selSeats.length);
  goTo(4);
}
function buildPaxForm(){
  document.getElementById('pfLeft').innerHTML=S.selSeats.map((seat,i)=>`
    <div class="pf-card">
      <h4>Passenger ${i+1} <span class="seat-tag">Seat ${seat.lbl}</span></h4>
      <div class="pf-row">
        <div class="pf-f"><label>First Name</label><input type="text" id="pfn-${i}" placeholder="John"/></div>
        <div class="pf-f"><label>Last Name</label><input type="text" id="pln-${i}" placeholder="Doe"/></div>
      </div>
      <div class="pf-row" style="margin-top:10px">
        <div class="pf-f"><label>Gender</label>
          <select id="pgn-${i}"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select>
        </div>
        <div class="pf-f"><label>Passport / ID</label><input type="text" id="pid-${i}" placeholder="A1234567"/></div>
      </div>
      <div class="pf-note">ℹ Name must match government-issued ID</div>
    </div>`).join('');
}
async function doBook(){
  for(let i=0;i<S.selSeats.length;i++){
    if(!document.getElementById('pfn-'+i)?.value.trim()) return toast('Enter first name for Passenger '+(i+1));
    if(!document.getElementById('pln-'+i)?.value.trim()) return toast('Enter last name for Passenger '+(i+1));
    if(!document.getElementById('pgn-'+i)?.value) return toast('Select gender for Passenger '+(i+1));
    if(!document.getElementById('pid-'+i)?.value.trim()) return toast('Enter passport/ID for Passenger '+(i+1));
  }
  if(!document.getElementById('cEmail').value.trim()) return toast('Enter email address');
  if(!document.getElementById('cPhone').value.trim()) return toast('Enter mobile number');
  const f=S.selFlight,c=S.cls;
  const passengers=S.selSeats.map((seat,i)=>({name:document.getElementById('pfn-'+i).value+' '+document.getElementById('pln-'+i).value,gender:document.getElementById('pgn-'+i).value,id:document.getElementById('pid-'+i).value,seat:seat.lbl}));
  const payload={flight:f,cls:c,seats:S.selSeats.map(s=>s.lbl),passengers,from:S.from,to:S.to,date:S.date,total:f.classes[c].price*S.selSeats.length,email:document.getElementById('cEmail').value,phone:document.getElementById('cPhone').value};
  const res=await fetch('/api/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await res.json();
  renderBP(data,payload);goTo(5);
}
function renderBP(data,payload){
  const f=payload.flight,c=payload.cls;
  const clsMap={economy:'Economy Class',premium:'Premium Economy',business:'Business Class',first:'First Class'};
  document.getElementById('bkRef').textContent=data.booking_id;
  document.getElementById('bpClass').textContent=clsMap[c]||c;
  document.getElementById('bpFrom').textContent=payload.from.match(/\(([^)]+)\)/)?.[1]||payload.from;
  document.getElementById('bpFromName').textContent=payload.from.split('(')[0].trim();
  document.getElementById('bpTo').textContent=payload.to.match(/\(([^)]+)\)/)?.[1]||payload.to;
  document.getElementById('bpToName').textContent=payload.to.split('(')[0].trim();
  document.getElementById('bpDep').textContent=f.dep;document.getElementById('bpArr').textContent=f.arr;
  document.getElementById('bpDepDate').textContent=fmtDate(payload.date);
  document.getElementById('bpDur').textContent=f.dur;
  document.getElementById('bpAirline').textContent=f.airline;document.getElementById('bpFlight').textContent=f.code;
  document.getElementById('bpAircraft').textContent=f.aircraft;document.getElementById('bpSeats').textContent=payload.seats.join(', ');
  document.getElementById('bpDist').textContent=f.distance;document.getElementById('bpTotal').textContent='$'+payload.total;
  document.getElementById('bpPaxList').innerHTML=payload.passengers.map(p=>`<div class="pax-row"><span class="pax-name">${p.name} (${p.gender})</span><span class="pax-seat">Seat ${p.seat}</span></div>`).join('');
  const colors=['var(--cyan)','var(--purple)','var(--pink)','var(--yellow)','var(--green)'];
  document.getElementById('bcBars').innerHTML=Array.from({length:46},(_,i)=>`<div class="bc-bar" style="height:${10+Math.random()*30}px;width:${Math.random()>.5?3:2}px;background:${colors[i%5]};border-radius:1px"></div>`).join('');
  document.getElementById('bcText').textContent=data.pnr;
}
function reset(){S={from:'',to:'',date:'',pax:1,cls:'economy',selFlight:null,selSeats:[],taken:[]};goTo(1);window.scrollTo({top:0,behavior:'smooth'});}
function toast(msg){document.getElementById('toastMsg').textContent=msg;const el=document.getElementById('toast');el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3200);}
</script>
</body>
</html>"""

# ── ROUTES ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template_string(HTML, cities=CITIES)

@app.route("/api/search", methods=["POST"])
def search():
    data = request.json
    results = [{**f, "taken": TAKEN_SEATS.get(f["id"], [])} for f in FLIGHTS]
    return jsonify({"flights": results, "from": data.get("from"), "to": data.get("to"),
                    "date": data.get("date"), "pax": data.get("pax", 1)})

@app.route("/api/book", methods=["POST"])
def book():
    data = request.json
    booking_id = "FZ" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    pnr = "".join(random.choices(string.digits, k=10))
    bookings[booking_id] = {**data, "booking_id": booking_id, "pnr": pnr,
                             "booked_at": datetime.now().strftime("%d %b %Y, %H:%M")}
    return jsonify({"booking_id": booking_id, "pnr": pnr, "status": "CONFIRMED"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
