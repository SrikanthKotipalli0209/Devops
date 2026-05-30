const express = require('express');
const app = express();
app.use(express.json());

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
const CRUISES = [
  {id:'C001',name:'Caribbean Paradise',ship:'Ocean Voyager',line:'AquaLine',
   from:'Miami, FL',to:'Caribbean Islands',dep:'Jun 15, 2026',arr:'Jun 22, 2026',duration:'7 Nights',nights:7,
   stops:['Miami','Nassau','St. Thomas','San Juan'],
   classes:{interior:{cabins:120,price:599},oceanview:{cabins:80,price:899},balcony:{cabins:60,price:1299},suite:{cabins:20,price:2499}}},
  {id:'C002',name:'Mediterranean Dream',ship:'Azure Empress',line:'SkyOcean',
   from:'Barcelona, Spain',to:'Mediterranean',dep:'Jul 5, 2026',arr:'Jul 15, 2026',duration:'10 Nights',nights:10,
   stops:['Barcelona','Marseille','Rome','Athens','Dubrovnik'],
   classes:{interior:{cabins:100,price:799},oceanview:{cabins:70,price:1199},balcony:{cabins:50,price:1799},suite:{cabins:15,price:3299}}},
  {id:'C003',name:'Alaska Adventure',ship:'Glacier Explorer',line:'PolarCruise',
   from:'Seward, AK',to:'Alaska & Glaciers',dep:'Aug 10, 2026',arr:'Aug 17, 2026',duration:'7 Nights',nights:7,
   stops:['Seward','Hubbard Glacier','Juneau','Ketchikan','Vancouver'],
   classes:{interior:{cabins:90,price:699},oceanview:{cabins:60,price:999},balcony:{cabins:45,price:1499},suite:{cabins:12,price:2899}}},
  {id:'C004',name:'Norway Fjords',ship:'Nordic Star',line:'FjordLine',
   from:'Bergen, Norway',to:'Norwegian Fjords',dep:'Sep 2, 2026',arr:'Sep 10, 2026',duration:'8 Nights',nights:8,
   stops:['Bergen','Flam','Geiranger','Alesund','Tromso'],
   classes:{interior:{cabins:85,price:899},oceanview:{cabins:55,price:1299},balcony:{cabins:40,price:1899},suite:{cabins:10,price:3499}}},
  {id:'C005',name:'Bahamas Escape',ship:'Coral Princess',line:'TropicLine',
   from:'Fort Lauderdale, FL',to:'Bahamas',dep:'Jun 28, 2026',arr:'Jul 2, 2026',duration:'4 Nights',nights:4,
   stops:['Fort Lauderdale','Nassau','Freeport'],
   classes:{interior:{cabins:150,price:349},oceanview:{cabins:100,price:499},balcony:{cabins:80,price:749},suite:{cabins:25,price:1499}}}
];

const PORTS = ['Miami, FL','Fort Lauderdale, FL','New York, NY','Los Angeles, CA',
               'Seattle, WA','Seward, AK','Barcelona, Spain','Civitavecchia, Italy',
               'Bergen, Norway','Southampton, UK','Venice, Italy','Piraeus, Greece'];

const TAKEN = {
  C001:[101,102,115,203,215,301,312,405,418,501,508,512,601,615,701,710],
  C002:[101,110,205,208,302,315,401,412,505,518,603,614,705,712],
  C003:[102,108,201,210,305,312,408,415,502,510,608,615,701],
  C004:[103,109,202,211,304,311,407,414,503,511,605,612],
  C005:[101,105,201,207,303,310,404,412,504,509,601,610,701,708]
};

const bookings = {};

// ── INLINE HTML ────────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>CruiseZip &mdash; Premium Cruise Booking</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#020c1b;--s1:#041428;--s2:#071e38;--s3:#0a2a50;--bd:#1a3a5c;--bd2:#234d7a;
--blue:#0088ff;--cyan:#00d4ff;--teal:#00c9b1;--gold:#ffd700;--pink:#ff6b9d;
--green:#00e676;--red:#ff4444;--txt:#d0e8ff;--muted:#4a7a9b;--font:'Space Grotesk',sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--txt);min-height:100vh;overflow-x:hidden}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px}
::selection{background:var(--blue);color:#fff}

/* NAV */
.nav{display:flex;justify-content:space-between;align-items:center;padding:14px 56px;
background:rgba(2,12,27,.92);backdrop-filter:blur(24px);position:sticky;top:0;z-index:300;
border-bottom:1px solid var(--bd)}
.nav-logo{display:flex;align-items:center;gap:10px;font-size:1.4rem;font-weight:800;color:#fff;letter-spacing:-1px}
.nav-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--blue),var(--teal));
border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem}
.nav-links{display:flex;align-items:center;gap:22px}
.nav-links a{color:var(--muted);text-decoration:none;font-size:.86rem;font-weight:500;transition:color .2s}
.nav-links a:hover{color:var(--txt)}
.nav-cta{background:linear-gradient(135deg,var(--blue),var(--teal))!important;color:#fff!important;
padding:8px 20px;border-radius:25px;font-weight:700!important;font-size:.82rem!important}

/* STEPBAR */
.stepbar{background:var(--s1);padding:10px 56px;border-bottom:1px solid var(--bd);display:flex;justify-content:center}
.steps-row{display:flex;align-items:center;background:var(--s2);border:1px solid var(--bd);border-radius:50px;padding:4px}
.sp{display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:40px;
font-size:.78rem;font-weight:600;color:var(--muted);transition:all .3s;white-space:nowrap}
.sp .sn{width:22px;height:22px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700}
.sp.active{background:linear-gradient(135deg,rgba(0,136,255,.15),rgba(0,201,177,.15));color:var(--cyan);border:1px solid rgba(0,136,255,.3)}
.sp.active .sn{background:var(--blue);color:#fff}
.sp.done{color:var(--teal)}.sp.done .sn{background:var(--teal);color:#000}
.sdiv{width:18px;height:1px;background:var(--bd);margin:0 2px}

/* HERO */
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;
position:relative;overflow:hidden;background:radial-gradient(ellipse 90% 60% at 50% -10%,rgba(0,136,255,.2) 0%,transparent 65%),var(--bg)}
.wave-wrap{position:absolute;bottom:0;left:0;width:100%;overflow:hidden;line-height:0}
.wave-wrap svg{position:relative;display:block;width:calc(100% + 1.3px);height:80px}
.wave-fill{fill:var(--s1)}
.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(26,58,92,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(26,58,92,.3) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 90% 90% at 50% 50%,black 20%,transparent 75%)}
.particles{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.p{position:absolute;border-radius:50%;opacity:.6}
.p1{width:3px;height:3px;background:var(--blue);top:20%;left:15%;animation:drift 8s infinite ease-in-out}
.p2{width:2px;height:2px;background:var(--teal);top:40%;left:80%;animation:drift 12s infinite ease-in-out reverse}
.p3{width:4px;height:4px;background:var(--gold);top:70%;left:25%;animation:drift 10s infinite ease-in-out}
.p4{width:2px;height:2px;background:var(--cyan);top:30%;left:55%;animation:drift 9s infinite ease-in-out}
.p5{width:3px;height:3px;background:var(--pink);top:60%;left:70%;animation:drift 11s infinite ease-in-out reverse}
@keyframes drift{0%,100%{transform:translateY(0) translateX(0)}25%{transform:translateY(-20px) translateX(10px)}50%{transform:translateY(-10px) translateX(-15px)}75%{transform:translateY(-25px) translateX(5px)}}
.hero-inner{text-align:center;position:relative;z-index:2;padding:60px 20px 100px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,136,255,.08);
border:1px solid rgba(0,136,255,.3);color:var(--cyan);padding:7px 18px;border-radius:30px;
font-size:.74rem;font-weight:600;margin-bottom:28px;letter-spacing:.5px}
.blink{width:7px;height:7px;border-radius:50%;background:var(--cyan);animation:blink 1.5s infinite}
@keyframes blink{0%,100%{opacity:1;box-shadow:0 0 6px var(--cyan)}50%{opacity:.3}}
.hero h1{font-size:4.2rem;font-weight:800;line-height:1.05;letter-spacing:-3px;color:#fff;margin-bottom:16px}
.hero h1 .g1{background:linear-gradient(135deg,var(--blue),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero h1 .g2{background:linear-gradient(135deg,var(--teal),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{color:var(--muted);font-size:.96rem;max-width:480px;margin:0 auto 36px;line-height:1.65}
.hero-stats{display:flex;justify-content:center;gap:48px;margin-bottom:48px;flex-wrap:wrap}
.hs{text-align:center}
.hs h4{font-size:1.6rem;font-weight:800;background:linear-gradient(135deg,var(--blue),var(--teal));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hs p{font-size:.7rem;color:var(--muted);margin-top:2px;font-weight:500;text-transform:uppercase;letter-spacing:.5px}

/* SEARCH CARD */
.search-wrap{max-width:1020px;margin:0 auto;padding:0 24px;position:relative;z-index:3}
.s-card{background:var(--s1);border:1px solid var(--bd);border-radius:22px;padding:28px 32px;
box-shadow:0 30px 80px rgba(0,0,0,.7);position:relative;overflow:hidden}
.s-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
background:linear-gradient(90deg,var(--blue),var(--teal),var(--gold),var(--blue))}
.s-title{font-size:.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:20px}
.s-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-bottom:16px}
.s-grid2{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:14px;align-items:end}
.fg{display:flex;flex-direction:column;gap:6px}
.fg label{font-size:.74rem;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.fg input,.fg select{background:var(--s2);border:1px solid var(--bd);color:var(--txt);
font-family:var(--font);font-size:.88rem;padding:11px 14px;border-radius:10px;outline:none;transition:border .2s}
.fg input:focus,.fg select:focus{border-color:var(--blue)}
.fg select option{background:var(--s2)}
.s-btn{background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff;
font-family:var(--font);font-size:.9rem;font-weight:700;padding:12px 32px;border:none;
border-radius:12px;cursor:pointer;white-space:nowrap;transition:opacity .2s;display:flex;align-items:center;gap:8px}
.s-btn:hover{opacity:.85}

/* SECTION COMMON */
.section{padding:60px 24px;max-width:1020px;margin:0 auto;display:none}
.section.active{display:block}
.sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px}
.sec-title{font-size:1.5rem;font-weight:700;color:#fff}
.sec-sub{font-size:.84rem;color:var(--muted);margin-top:4px}
.back-btn{background:var(--s2);border:1px solid var(--bd);color:var(--muted);
font-family:var(--font);font-size:.82rem;font-weight:600;padding:9px 18px;border-radius:10px;cursor:pointer;transition:all .2s}
.back-btn:hover{border-color:var(--blue);color:var(--txt)}

/* CRUISE CARDS */
.cruise-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.c-card{background:var(--s1);border:1px solid var(--bd);border-radius:18px;overflow:hidden;
transition:all .3s;cursor:pointer;position:relative}
.c-card:hover{border-color:var(--blue);transform:translateY(-3px);box-shadow:0 20px 50px rgba(0,136,255,.15)}
.c-card.selected{border-color:var(--teal);box-shadow:0 0 0 2px rgba(0,201,177,.3)}
.c-banner{height:140px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.c-banner-1{background:linear-gradient(135deg,#0a3a6e,#0066cc,#00a8cc)}
.c-banner-2{background:linear-gradient(135deg,#1a0a3e,#3d0099,#0044cc)}
.c-banner-3{background:linear-gradient(135deg,#0a2a1a,#0a4a3a,#006655)}
.c-banner-4{background:linear-gradient(135deg,#1a2a0a,#2a4a0a,#0a3a5a)}
.c-banner-5{background:linear-gradient(135deg,#3a0a1a,#cc0055,#ff6b9d)}
.c-ship-icon{font-size:3.5rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,.5));z-index:2}
.c-wave{position:absolute;bottom:0;left:0;width:100%;opacity:.3}
.c-body{padding:18px 20px}
.c-line{font-size:.7rem;color:var(--blue);font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.c-name{font-size:1.08rem;font-weight:700;color:#fff;margin-bottom:4px}
.c-ship{font-size:.78rem;color:var(--muted);margin-bottom:14px}
.c-route{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.c-port{font-size:.74rem;background:var(--s2);border:1px solid var(--bd);padding:4px 10px;border-radius:20px;color:var(--txt)}
.c-arrow{color:var(--blue);font-size:.8rem}
.c-meta{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap}
.c-meta span{font-size:.75rem;color:var(--muted);display:flex;align-items:center;gap:5px}
.c-meta span b{color:var(--txt)}
.c-classes{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.cc-pill{padding:5px 12px;border-radius:20px;font-size:.72rem;font-weight:600;border:1px solid var(--bd);color:var(--muted);cursor:pointer;transition:all .2s}
.cc-pill.int{border-color:#555}.cc-pill.ocn{border-color:var(--blue)}.cc-pill.bal{border-color:var(--teal)}.cc-pill.sui{border-color:var(--gold)}
.cc-pill.active-int{background:rgba(100,100,100,.2);color:#ccc;border-color:#888}
.cc-pill.active-ocn{background:rgba(0,136,255,.15);color:var(--blue);border-color:var(--blue)}
.cc-pill.active-bal{background:rgba(0,201,177,.15);color:var(--teal);border-color:var(--teal)}
.cc-pill.active-sui{background:rgba(255,215,0,.15);color:var(--gold);border-color:var(--gold)}
.c-footer{display:flex;align-items:center;justify-content:space-between}
.c-price{display:flex;flex-direction:column}
.c-price-from{font-size:.68rem;color:var(--muted)}
.c-price-val{font-size:1.3rem;font-weight:800;color:#fff}
.c-price-pp{font-size:.7rem;color:var(--muted)}
.sel-btn{background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff;
font-family:var(--font);font-size:.8rem;font-weight:700;padding:10px 22px;border:none;border-radius:10px;cursor:pointer;transition:opacity .2s}
.sel-btn:hover{opacity:.85}

/* CABIN MAP */
.cabin-info-bar{display:flex;align-items:center;gap:20px;background:var(--s1);border:1px solid var(--bd);
border-radius:14px;padding:14px 20px;margin-bottom:24px;flex-wrap:wrap}
.cib-item{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--txt)}
.cib-dot{width:14px;height:14px;border-radius:4px;flex-shrink:0}
.deck-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.dt{padding:8px 18px;border-radius:10px;background:var(--s2);border:1px solid var(--bd);
color:var(--muted);font-family:var(--font);font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s}
.dt.active{background:rgba(0,136,255,.15);border-color:var(--blue);color:var(--blue)}
.ship-view{background:var(--s1);border:1px solid var(--bd);border-radius:18px;padding:24px;position:relative}
.deck-label{text-align:center;font-size:.75rem;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:16px}
.ship-outline{background:var(--s2);border:1px solid var(--bd2);border-radius:60px 60px 30px 30px;padding:20px;position:relative}
.ship-side-label{font-size:.65rem;color:var(--muted);text-align:center;margin-bottom:8px;font-weight:600;text-transform:uppercase}
.cabin-row{display:flex;justify-content:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}
.cab{width:44px;height:36px;border-radius:7px;display:flex;align-items:center;justify-content:center;
font-size:.62rem;font-weight:700;cursor:pointer;transition:all .2s;border:1px solid transparent;user-select:none}
.cab.interior{background:rgba(100,100,120,.2);border-color:#555;color:#aaa}
.cab.oceanview{background:rgba(0,136,255,.15);border-color:rgba(0,136,255,.4);color:var(--blue)}
.cab.balcony{background:rgba(0,201,177,.15);border-color:rgba(0,201,177,.4);color:var(--teal)}
.cab.suite{background:rgba(255,215,0,.1);border-color:rgba(255,215,0,.4);color:var(--gold)}
.cab.taken{background:rgba(255,68,68,.08)!important;border-color:rgba(255,68,68,.3)!important;color:rgba(255,68,68,.5)!important;cursor:not-allowed;text-decoration:line-through}
.cab.selected-cab{transform:scale(1.1);box-shadow:0 0 0 2px var(--cyan),0 4px 12px rgba(0,212,255,.3)}
.cab:not(.taken):hover{transform:scale(1.05);filter:brightness(1.2)}
.ship-divider{border:none;border-top:1px dashed var(--bd);margin:10px 0}
.selected-cabin-info{background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.25);
border-radius:14px;padding:16px 20px;margin-top:20px;display:none}
.sci-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.sci-label{font-size:.75rem;color:var(--muted);margin-bottom:2px}
.sci-val{font-size:.95rem;font-weight:700;color:var(--cyan)}
.next-btn{background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff;
font-family:var(--font);font-size:.9rem;font-weight:700;padding:12px 32px;border:none;
border-radius:12px;cursor:pointer;transition:opacity .2s;margin-top:20px;display:block;width:100%}
.next-btn:hover{opacity:.85}
.next-btn:disabled{opacity:.35;cursor:not-allowed}

/* PASSENGER FORM */
.pax-card{background:var(--s1);border:1px solid var(--bd);border-radius:18px;padding:24px;margin-bottom:20px}
.pax-card-title{font-size:.88rem;font-weight:700;color:var(--cyan);margin-bottom:20px;display:flex;align-items:center;gap:8px}
.pax-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.pax-grid-full{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.fg input[type=date]{color-scheme:dark}

/* BOOKING SUMMARY */
.summary-bar{background:var(--s2);border:1px solid var(--bd);border-radius:14px;padding:16px 20px;
margin-bottom:28px;display:flex;gap:24px;flex-wrap:wrap}
.sb-item{display:flex;flex-direction:column;gap:2px}
.sb-label{font-size:.68rem;color:var(--muted);text-transform:uppercase;font-weight:600;letter-spacing:.4px}
.sb-val{font-size:.9rem;font-weight:700;color:var(--txt)}

/* BOARDING PASS */
.bp-wrap{max-width:700px;margin:0 auto}
.bp-success{text-align:center;margin-bottom:36px}
.bp-success-icon{font-size:3.5rem;margin-bottom:12px}
.bp-success h2{font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:8px}
.bp-success p{color:var(--muted);font-size:.9rem}
.bp{background:var(--s1);border:1px solid var(--bd);border-radius:22px;overflow:hidden;
box-shadow:0 30px 80px rgba(0,0,0,.6);position:relative}
.bp::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;
background:linear-gradient(90deg,var(--blue),var(--teal),var(--gold),var(--blue))}
.bp-header{padding:28px 32px;background:linear-gradient(135deg,var(--s2),var(--s3));
display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.bp-logo{font-size:1.3rem;font-weight:800;color:#fff;letter-spacing:-1px}
.bp-ref{text-align:right}
.bp-ref-label{font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.bp-ref-val{font-size:1.2rem;font-weight:800;color:var(--cyan);letter-spacing:2px}
.bp-route{padding:24px 32px;background:var(--s2);display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.bp-port{text-align:center}
.bp-port-city{font-size:1.8rem;font-weight:800;color:#fff;letter-spacing:-1px}
.bp-port-name{font-size:.72rem;color:var(--muted);margin-top:2px}
.bp-route-mid{flex:1;text-align:center;min-width:120px}
.bp-ship-icon{font-size:2rem;display:block;margin-bottom:4px}
.bp-line{border:none;border-top:2px dashed var(--bd2);margin:4px 0}
.bp-duration{font-size:.72rem;color:var(--blue);font-weight:600}
.bp-body{padding:24px 32px}
.bp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:20px}
.bp-field{display:flex;flex-direction:column;gap:4px}
.bp-field-label{font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.bp-field-val{font-size:.9rem;font-weight:700;color:var(--txt)}
.bp-tear{padding:0 32px;display:flex;align-items:center;gap:8px}
.bp-tear hr{flex:1;border:none;border-top:2px dashed var(--bd2)}
.bp-tear-circle{width:20px;height:20px;border-radius:50%;background:var(--bg);border:1px solid var(--bd2);flex-shrink:0}
.bp-footer{padding:20px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.bp-barcode{display:flex;gap:2px;align-items:flex-end}
.bp-bar{background:var(--txt);border-radius:1px}
.bp-status{display:inline-flex;align-items:center;gap:6px;background:rgba(0,230,118,.1);
border:1px solid rgba(0,230,118,.3);color:var(--green);padding:8px 16px;border-radius:30px;font-size:.78rem;font-weight:700}
.bp-actions{display:flex;gap:12px;margin-top:28px;justify-content:center}
.bp-action-btn{padding:11px 24px;border-radius:12px;font-family:var(--font);font-size:.84rem;font-weight:600;cursor:pointer;transition:all .2s}
.bp-print{background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff;border:none}
.bp-new{background:transparent;border:1px solid var(--bd);color:var(--muted)}
.bp-new:hover{border-color:var(--blue);color:var(--txt)}

/* LOADING */
.loading{display:none;text-align:center;padding:60px 20px}
.spinner{width:44px;height:44px;border:3px solid var(--bd);border-top-color:var(--blue);
border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
.loading p{color:var(--muted);font-size:.88rem}

/* TOAST */
.toast{position:fixed;bottom:28px;right:28px;background:var(--red);color:#fff;
padding:12px 20px;border-radius:12px;font-size:.84rem;font-weight:600;z-index:999;
transform:translateY(80px);opacity:0;transition:all .3s;pointer-events:none}
.toast.show{transform:translateY(0);opacity:1}
.toast.ok{background:var(--teal)}

@media(max-width:768px){
.nav{padding:12px 20px}.hero h1{font-size:2.6rem;letter-spacing:-1.5px}
.search-wrap{padding:0 16px}.s-grid{grid-template-columns:1fr 1fr}.s-grid2{grid-template-columns:1fr 1fr}
.s-grid2 .s-btn{grid-column:1/-1}.cruise-grid{grid-template-columns:1fr}
.pax-grid{grid-template-columns:1fr 1fr}.bp-grid{grid-template-columns:1fr 1fr}
.stepbar{padding:10px 16px}.section{padding:40px 16px}}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-logo">
    <div class="nav-icon">&#9875;</div>
    CruiseZip
  </div>
  <div class="nav-links">
    <a href="#">Destinations</a>
    <a href="#">Ships</a>
    <a href="#">Deals</a>
    <a href="#" class="nav-cta">Sign In</a>
  </div>
</nav>

<div class="stepbar">
  <div class="steps-row">
    <div class="sp active" id="st1"><span class="sn">1</span> Search</div>
    <div class="sdiv"></div>
    <div class="sp" id="st2"><span class="sn">2</span> Select Cruise</div>
    <div class="sdiv"></div>
    <div class="sp" id="st3"><span class="sn">3</span> Choose Cabin</div>
    <div class="sdiv"></div>
    <div class="sp" id="st4"><span class="sn">4</span> Passengers</div>
    <div class="sdiv"></div>
    <div class="sp" id="st5"><span class="sn">5</span> Boarding Pass</div>
  </div>
</div>

<!-- ── STEP 1: HERO SEARCH ─────────────────────────────────── -->
<div id="page1">
  <div class="hero">
    <div class="hero-grid"></div>
    <div class="particles">
      <div class="p p1"></div><div class="p p2"></div><div class="p p3"></div>
      <div class="p p4"></div><div class="p p5"></div>
    </div>
    <div style="width:100%;z-index:2;padding-bottom:60px">
      <div class="hero-inner">
        <div class="hero-badge"><span class="blink"></span> 500+ Cruise Routes Worldwide</div>
        <h1>Set Sail Into<br/><span class="g1">Endless</span> <span class="g2">Horizons</span></h1>
        <p class="hero-sub">Discover world-class cruise experiences. From Caribbean beaches to Norwegian fjords, your perfect voyage awaits.</p>
        <div class="hero-stats">
          <div class="hs"><h4>50+</h4><p>Ships</p></div>
          <div class="hs"><h4>200+</h4><p>Destinations</p></div>
          <div class="hs"><h4>1M+</h4><p>Happy Sailors</p></div>
          <div class="hs"><h4>4.9</h4><p>Rating</p></div>
        </div>
      </div>
      <div class="search-wrap">
        <div class="s-card">
          <div class="s-title">&#9875; Find Your Perfect Cruise</div>
          <div class="s-grid">
            <div class="fg">
              <label>Departure Port</label>
              <select id="depPort">
                <option value="">Select port...</option>
              </select>
            </div>
            <div class="fg">
              <label>Destination</label>
              <select id="destSel">
                <option value="">Any destination</option>
                <option>Caribbean Islands</option>
                <option>Mediterranean</option>
                <option>Alaska & Glaciers</option>
                <option>Norwegian Fjords</option>
                <option>Bahamas</option>
              </select>
            </div>
            <div class="fg">
              <label>Departure Date</label>
              <input type="date" id="depDate"/>
            </div>
            <div class="fg">
              <label>Passengers</label>
              <select id="paxCount">
                <option value="1">1 Passenger</option>
                <option value="2" selected>2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
              </select>
            </div>
          </div>
          <div class="s-grid2">
            <div class="fg">
              <label>Cabin Class</label>
              <select id="classSel">
                <option value="">Any class</option>
                <option value="interior">Interior</option>
                <option value="oceanview">Ocean View</option>
                <option value="balcony">Balcony</option>
                <option value="suite">Suite</option>
              </select>
            </div>
            <div class="fg">
              <label>Duration</label>
              <select id="durSel">
                <option value="">Any duration</option>
                <option>1-5 Nights</option>
                <option>6-9 Nights</option>
                <option>10+ Nights</option>
              </select>
            </div>
            <div class="fg">
              <label>Sort By</label>
              <select id="sortSel">
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Duration</option>
              </select>
            </div>
            <button class="s-btn" onclick="searchCruises()">&#9875; Search</button>
          </div>
        </div>
      </div>
    </div>
    <div class="wave-wrap">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path d="M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,80 L0,80 Z" class="wave-fill"/>
      </svg>
    </div>
  </div>
</div>

<!-- ── STEP 2: CRUISE RESULTS ─────────────────────────────── -->
<div id="page2" class="section">
  <div class="sec-head">
    <div>
      <div class="sec-title">Available Cruises</div>
      <div class="sec-sub" id="results-sub">Showing all cruises</div>
    </div>
    <button class="back-btn" onclick="goPage(1)">&#8592; Back</button>
  </div>
  <div class="loading" id="loading"><div class="spinner"></div><p>Searching cruises...</p></div>
  <div class="cruise-grid" id="cruiseGrid"></div>
</div>

<!-- ── STEP 3: CABIN SELECTION ────────────────────────────── -->
<div id="page3" class="section">
  <div class="sec-head">
    <div>
      <div class="sec-title">Choose Your Cabin</div>
      <div class="sec-sub" id="cabin-sub">Select a cabin from the deck map</div>
    </div>
    <button class="back-btn" onclick="goPage(2)">&#8592; Back</button>
  </div>
  <div class="cabin-info-bar">
    <div class="cib-item"><div class="cib-dot" style="background:rgba(100,100,120,.5);border:1px solid #555"></div> Interior</div>
    <div class="cib-item"><div class="cib-dot" style="background:rgba(0,136,255,.3);border:1px solid rgba(0,136,255,.5)"></div> Ocean View</div>
    <div class="cib-item"><div class="cib-dot" style="background:rgba(0,201,177,.3);border:1px solid rgba(0,201,177,.5)"></div> Balcony</div>
    <div class="cib-item"><div class="cib-dot" style="background:rgba(255,215,0,.2);border:1px solid rgba(255,215,0,.5)"></div> Suite</div>
    <div class="cib-item"><div class="cib-dot" style="background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.4)"></div> Occupied</div>
  </div>
  <div class="deck-tabs" id="deckTabs"></div>
  <div class="ship-view">
    <div class="deck-label" id="deckLabel">Deck 8 &mdash; Interior Cabins</div>
    <div class="ship-outline">
      <div class="ship-side-label">Starboard (Right)</div>
      <div class="cabin-row" id="starboardRow"></div>
      <hr class="ship-divider"/>
      <div class="cabin-row" id="portRow"></div>
      <div class="ship-side-label" style="margin-top:8px">Port (Left)</div>
    </div>
    <div class="selected-cabin-info" id="selCabinInfo">
      <div class="sci-row">
        <div><div class="sci-label">Cabin Number</div><div class="sci-val" id="sci-num">--</div></div>
        <div><div class="sci-label">Deck</div><div class="sci-val" id="sci-deck">--</div></div>
        <div><div class="sci-label">Class</div><div class="sci-val" id="sci-class">--</div></div>
        <div><div class="sci-label">Price / Person</div><div class="sci-val" id="sci-price">--</div></div>
      </div>
    </div>
  </div>
  <button class="next-btn" id="cabinNextBtn" disabled onclick="goPage(4)">Continue to Passenger Details &#8594;</button>
</div>

<!-- ── STEP 4: PASSENGER DETAILS ─────────────────────────── -->
<div id="page4" class="section">
  <div class="sec-head">
    <div>
      <div class="sec-title">Passenger Details</div>
      <div class="sec-sub">Enter details for all passengers</div>
    </div>
    <button class="back-btn" onclick="goPage(3)">&#8592; Back</button>
  </div>
  <div class="summary-bar" id="paxSummary"></div>
  <div id="paxForms"></div>
  <button class="next-btn" onclick="confirmBooking()">Confirm Booking &amp; Get Boarding Pass &#8594;</button>
</div>

<!-- ── STEP 5: BOARDING PASS ──────────────────────────────── -->
<div id="page5" class="section">
  <div class="bp-wrap">
    <div class="bp-success">
      <div class="bp-success-icon">&#127881;</div>
      <h2>Booking Confirmed!</h2>
      <p>Your cabin is reserved. Have a wonderful voyage!</p>
    </div>
    <div class="bp" id="boardingPass"></div>
    <div class="bp-actions">
      <button class="bp-action-btn bp-print" onclick="window.print()">&#128438; Print Boarding Pass</button>
      <button class="bp-action-btn bp-new" onclick="location.reload()">Book Another Cruise</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
var TAKEN = ${JSON.stringify(TAKEN)};
var state = {
  cruises: [],
  selectedCruise: null,
  selectedClass: 'economy',
  selectedCabin: null,
  currentDeck: 8,
  paxCount: 2,
  booking: null
};

var DECK_MAP = {
  8: { class: 'interior', label: 'Deck 8 — Interior Cabins' },
  9: { class: 'interior', label: 'Deck 9 — Interior Cabins' },
  10: { class: 'oceanview', label: 'Deck 10 — Ocean View Cabins' },
  11: { class: 'balcony', label: 'Deck 11 — Balcony Cabins' },
  12: { class: 'suite', label: 'Deck 12 — Suite Cabins' }
};

var CLASS_NAMES = { interior: 'Interior', oceanview: 'Ocean View', balcony: 'Balcony', suite: 'Suite' };
var CLASS_PRICES = { interior: 0, oceanview: 0, balcony: 0, suite: 0 };

(function init() {
  var portSel = document.getElementById('depPort');
  var ports = ['Miami, FL','Fort Lauderdale, FL','New York, NY','Los Angeles, CA',
                'Seattle, WA','Seward, AK','Barcelona, Spain','Civitavecchia, Italy',
                'Bergen, Norway','Southampton, UK','Venice, Italy','Piraeus, Greece'];
  for (var i = 0; i < ports.length; i++) {
    var o = document.createElement('option');
    o.value = ports[i]; o.textContent = ports[i];
    portSel.appendChild(o);
  }
  var today = new Date();
  document.getElementById('depDate').min = today.toISOString().split('T')[0];
})();

function goPage(n) {
  for (var i = 1; i <= 5; i++) {
    var p = document.getElementById('page' + i);
    if (p) { p.style.display = (i === n) ? (i === 1 ? 'block' : 'block') : 'none'; }
    if (i > 1) { var el = document.getElementById('page' + i); if(el) el.className = (i === n) ? 'section active' : 'section'; }
  }
  if (n === 1) document.getElementById('page1').style.display = 'block';
  var steps = ['st1','st2','st3','st4','st5'];
  for (var j = 0; j < steps.length; j++) {
    var s = document.getElementById(steps[j]);
    s.className = 'sp';
    if (j + 1 < n) s.className = 'sp done';
    if (j + 1 === n) s.className = 'sp active';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function searchCruises() {
  document.getElementById('page1').style.display = 'none';
  var p2 = document.getElementById('page2');
  p2.className = 'section active';
  document.getElementById('loading').style.display = 'block';
  document.getElementById('cruiseGrid').innerHTML = '';
  document.getElementById('st1').className = 'sp done';
  document.getElementById('st2').className = 'sp active';
  state.paxCount = parseInt(document.getElementById('paxCount').value) || 2;
  setTimeout(function() {
    fetch('/api/search', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        state.cruises = d.cruises;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results-sub').textContent = d.cruises.length + ' cruises found';
        renderCruises(d.cruises);
      });
  }, 600);
}

function renderCruises(cruises) {
  var grid = document.getElementById('cruiseGrid');
  grid.innerHTML = '';
  var banners = ['c-banner-1','c-banner-2','c-banner-3','c-banner-4','c-banner-5'];
  var ships = ['&#128674;','&#9875;','&#128676;','&#9874;','&#128675;'];
  for (var i = 0; i < cruises.length; i++) {
    var c = cruises[i];
    var stops = '';
    for (var s = 0; s < c.stops.length; s++) {
      stops += '<span class="c-port">' + c.stops[s] + '</span>';
      if (s < c.stops.length - 1) stops += '<span class="c-arrow">&#8594;</span>';
    }
    var pills = '';
    var classes = ['interior','oceanview','balcony','suite'];
    var pillLabels = ['Interior','Ocean View','Balcony','Suite'];
    var pillKeys = ['int','ocn','bal','sui'];
    for (var k = 0; k < classes.length; k++) {
      if (c.classes[classes[k]] && c.classes[classes[k]].price > 0) {
        pills += '<span class="cc-pill ' + pillKeys[k] + '" onclick="selectClass(\'' + c.id + '\',\'' + classes[k] + '\',this)">' + pillLabels[k] + ' $' + c.classes[classes[k]].price + '</span>';
      }
    }
    var div = document.createElement('div');
    div.className = 'c-card';
    div.id = 'card-' + c.id;
    div.innerHTML = '<div class="c-banner ' + banners[i % 5] + '">'
      + '<span class="c-ship-icon">' + ships[i % 5] + '</span>'
      + '<svg class="c-wave" viewBox="0 0 400 30" preserveAspectRatio="none"><path d="M0,15 C80,30 180,0 280,15 C360,28 380,5 400,15 L400,30 L0,30 Z" fill="rgba(0,0,0,0.3)"/></svg>'
      + '</div>'
      + '<div class="c-body">'
      + '<div class="c-line">' + c.line + '</div>'
      + '<div class="c-name">' + c.name + '</div>'
      + '<div class="c-ship">&#9875; ' + c.ship + '</div>'
      + '<div class="c-route">' + stops + '</div>'
      + '<div class="c-meta">'
      + '<span>&#128197; <b>' + c.dep + '</b></span>'
      + '<span>&#127760; <b>' + c.duration + '</b></span>'
      + '<span>&#128205; <b>' + c.from + '</b></span>'
      + '</div>'
      + '<div class="c-classes">' + pills + '</div>'
      + '<div class="c-footer">'
      + '<div class="c-price"><div class="c-price-from">From</div><div class="c-price-val" id="price-' + c.id + '">$' + c.classes.interior.price + '</div><div class="c-price-pp">per person</div></div>'
      + '<button class="sel-btn" onclick="selectCruise(\'' + c.id + '\')">Select &#8594;</button>'
      + '</div>'
      + '</div>';
    grid.appendChild(div);
  }
}

function selectClass(cid, cls, el) {
  var card = document.getElementById('card-' + cid);
  var pills = card.querySelectorAll('.cc-pill');
  for (var i = 0; i < pills.length; i++) {
    pills[i].className = pills[i].className.replace(/ active-[a-z]+/,'');
  }
  var keyMap = { interior:'int', oceanview:'ocn', balcony:'bal', suite:'sui' };
  el.className = el.className + ' active-' + keyMap[cls];
  var cruise = null;
  for (var j = 0; j < state.cruises.length; j++) {
    if (state.cruises[j].id === cid) { cruise = state.cruises[j]; break; }
  }
  if (cruise && cruise.classes[cls]) {
    document.getElementById('price-' + cid).textContent = '$' + cruise.classes[cls].price;
  }
  if (!state._classSelections) state._classSelections = {};
  state._classSelections[cid] = cls;
}

function selectCruise(cid) {
  for (var j = 0; j < state.cruises.length; j++) {
    if (state.cruises[j].id === cid) { state.selectedCruise = state.cruises[j]; break; }
  }
  if (state._classSelections && state._classSelections[cid]) {
    state.selectedClass = state._classSelections[cid];
  } else {
    state.selectedClass = 'interior';
  }
  CLASS_PRICES = state.selectedCruise.classes;
  state.selectedCabin = null;
  state.currentDeck = 8;
  buildDeckMap();
  goPage(3);
  document.getElementById('cabin-sub').textContent = state.selectedCruise.name + ' — ' + state.selectedCruise.ship;
}

function buildDeckMap() {
  var tabs = document.getElementById('deckTabs');
  tabs.innerHTML = '';
  for (var d = 8; d <= 12; d++) {
    var btn = document.createElement('button');
    btn.className = 'dt' + (d === state.currentDeck ? ' active' : '');
    btn.textContent = 'Deck ' + d;
    btn.setAttribute('data-deck', d);
    btn.onclick = (function(deck) { return function() { switchDeck(deck); }; })(d);
    tabs.appendChild(btn);
  }
  renderDeck(state.currentDeck);
}

function switchDeck(d) {
  state.currentDeck = d;
  var tabs = document.getElementById('deckTabs').querySelectorAll('.dt');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].className = parseInt(tabs[i].getAttribute('data-deck')) === d ? 'dt active' : 'dt';
  }
  renderDeck(d);
}

function renderDeck(d) {
  var info = DECK_MAP[d];
  document.getElementById('deckLabel').textContent = info.label.replace('—', '—');
  var takenList = (state.selectedCruise && TAKEN[state.selectedCruise.id]) ? TAKEN[state.selectedCruise.id] : [];
  var star = document.getElementById('starboardRow');
  var port = document.getElementById('portRow');
  star.innerHTML = '';
  port.innerHTML = '';
  for (var n = 1; n <= 10; n++) {
    var cabNum = d * 100 + n;
    var isTaken = takenList.indexOf(cabNum) !== -1;
    var isSelected = state.selectedCabin === cabNum;
    var cls = 'cab ' + info.class + (isTaken ? ' taken' : '') + (isSelected ? ' selected-cab' : '');
    var s = document.createElement('div');
    s.className = cls;
    s.textContent = cabNum;
    if (!isTaken) {
      s.onclick = (function(num, deckCls) { return function() { chooseCabin(num, deckCls, d); }; })(cabNum, info.class);
    }
    star.appendChild(s);
  }
  for (var m = 11; m <= 20; m++) {
    var cabNum2 = d * 100 + m;
    var isTaken2 = takenList.indexOf(cabNum2) !== -1;
    var isSelected2 = state.selectedCabin === cabNum2;
    var cls2 = 'cab ' + info.class + (isTaken2 ? ' taken' : '') + (isSelected2 ? ' selected-cab' : '');
    var p = document.createElement('div');
    p.className = cls2;
    p.textContent = cabNum2;
    if (!isTaken2) {
      p.onclick = (function(num2, deckCls2) { return function() { chooseCabin(num2, deckCls2, d); }; })(cabNum2, info.class);
    }
    port.appendChild(p);
  }
}

function chooseCabin(num, cabClass, deck) {
  state.selectedCabin = num;
  renderDeck(deck);
  var price = CLASS_PRICES[cabClass] ? CLASS_PRICES[cabClass].price : 0;
  document.getElementById('sci-num').textContent = num;
  document.getElementById('sci-deck').textContent = 'Deck ' + deck;
  document.getElementById('sci-class').textContent = CLASS_NAMES[cabClass];
  document.getElementById('sci-price').textContent = '$' + price;
  document.getElementById('selCabinInfo').style.display = 'block';
  document.getElementById('cabinNextBtn').disabled = false;
}

function buildPaxForms() {
  var c = state.selectedCruise;
  var sb = document.getElementById('paxSummary');
  var cabClass = DECK_MAP[state.currentDeck] ? DECK_MAP[state.currentDeck].class : 'interior';
  var price = CLASS_PRICES[cabClass] ? CLASS_PRICES[cabClass].price : 0;
  sb.innerHTML = '<div class="sb-item"><div class="sb-label">Cruise</div><div class="sb-val">' + c.name + '</div></div>'
    + '<div class="sb-item"><div class="sb-label">Ship</div><div class="sb-val">' + c.ship + '</div></div>'
    + '<div class="sb-item"><div class="sb-label">Cabin</div><div class="sb-val">' + state.selectedCabin + '</div></div>'
    + '<div class="sb-item"><div class="sb-label">Class</div><div class="sb-val">' + CLASS_NAMES[cabClass] + '</div></div>'
    + '<div class="sb-item"><div class="sb-label">Departure</div><div class="sb-val">' + c.dep + '</div></div>'
    + '<div class="sb-item"><div class="sb-label">Total</div><div class="sb-val" style="color:var(--teal)">$' + (price * state.paxCount) + '</div></div>';
  var paxDiv = document.getElementById('paxForms');
  paxDiv.innerHTML = '';
  for (var i = 0; i < state.paxCount; i++) {
    var card = document.createElement('div');
    card.className = 'pax-card';
    card.innerHTML = '<div class="pax-card-title">&#128100; Passenger ' + (i + 1) + (i === 0 ? ' (Lead)' : '') + '</div>'
      + '<div class="pax-grid">'
      + '<div class="fg"><label>First Name</label><input type="text" id="p' + i + '_fn" placeholder="John"/></div>'
      + '<div class="fg"><label>Last Name</label><input type="text" id="p' + i + '_ln" placeholder="Smith"/></div>'
      + '<div class="fg"><label>Date of Birth</label><input type="date" id="p' + i + '_dob"/></div>'
      + '</div>'
      + '<div class="pax-grid-full">'
      + '<div class="fg"><label>Passport / ID Number</label><input type="text" id="p' + i + '_pp" placeholder="AB1234567"/></div>'
      + '<div class="fg"><label>Nationality</label><input type="text" id="p' + i + '_nat" placeholder="American"/></div>'
      + '</div>';
    paxDiv.appendChild(card);
  }
}

function confirmBooking() {
  var passengers = [];
  for (var i = 0; i < state.paxCount; i++) {
    var fn = document.getElementById('p' + i + '_fn').value.trim();
    var ln = document.getElementById('p' + i + '_ln').value.trim();
    if (!fn || !ln) { showToast('Please fill in all passenger names'); return; }
    passengers.push({ firstName: fn, lastName: ln,
      dob: document.getElementById('p' + i + '_dob').value,
      passport: document.getElementById('p' + i + '_pp').value,
      nationality: document.getElementById('p' + i + '_nat').value });
  }
  var cabClass = DECK_MAP[state.currentDeck] ? DECK_MAP[state.currentDeck].class : 'interior';
  fetch('/api/book', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ cruiseId: state.selectedCruise.id, cabinClass: cabClass, cabinNum: state.selectedCabin, passengers: passengers })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    state.booking = d.booking;
    renderBoardingPass(d.booking);
    goPage(5);
  });
}

function renderBoardingPass(b) {
  var c = b.cruise;
  var paxNames = '';
  for (var i = 0; i < b.passengers.length; i++) {
    paxNames += b.passengers[i].firstName + ' ' + b.passengers[i].lastName;
    if (i < b.passengers.length - 1) paxNames += ', ';
  }
  var bars = '';
  var widths = [3,5,2,4,3,6,2,5,3,4,2,3,5,2,4,3,6,2,5,3,4,2];
  for (var b2 = 0; b2 < widths.length; b2++) {
    var h = 20 + Math.floor(Math.random() * 25);
    bars += '<div class="bp-bar" style="width:' + widths[b2] + 'px;height:' + h + 'px"></div>';
  }
  document.getElementById('boardingPass').innerHTML =
    '<div class="bp-header">'
    + '<div class="bp-logo">&#9875; CruiseZip</div>'
    + '<div class="bp-ref"><div class="bp-ref-label">Booking Reference</div><div class="bp-ref-val">' + b.ref + '</div></div>'
    + '</div>'
    + '<div class="bp-route">'
    + '<div class="bp-port"><div class="bp-port-city">' + (c.from.split(',')[0]) + '</div><div class="bp-port-name">' + c.from + '</div></div>'
    + '<div class="bp-route-mid"><span class="bp-ship-icon">&#9875;</span><hr class="bp-line"/><div class="bp-duration">' + c.duration + '</div></div>'
    + '<div class="bp-port"><div class="bp-port-city">' + (c.to.split(' ')[0]) + '</div><div class="bp-port-name">' + c.to + '</div></div>'
    + '</div>'
    + '<div class="bp-body">'
    + '<div class="bp-grid">'
    + '<div class="bp-field"><div class="bp-field-label">Cruise</div><div class="bp-field-val">' + c.name + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Ship</div><div class="bp-field-val">' + c.ship + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Cruise Line</div><div class="bp-field-val">' + c.line + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Departure</div><div class="bp-field-val">' + c.dep + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Return</div><div class="bp-field-val">' + c.arr + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Duration</div><div class="bp-field-val">' + c.duration + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Cabin Number</div><div class="bp-field-val" style="color:var(--teal)">' + b.cabinNum + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Cabin Class</div><div class="bp-field-val">' + CLASS_NAMES[b.cabinClass] + '</div></div>'
    + '<div class="bp-field"><div class="bp-field-label">Passengers</div><div class="bp-field-val">' + b.passengers.length + '</div></div>'
    + '</div>'
    + '<div class="bp-field" style="margin-top:8px"><div class="bp-field-label">Passenger(s)</div><div class="bp-field-val">' + paxNames + '</div></div>'
    + '</div>'
    + '<div class="bp-tear"><div class="bp-tear-circle"></div><hr/><div class="bp-tear-circle"></div></div>'
    + '<div class="bp-footer">'
    + '<div><div class="bp-field-label" style="font-size:.65rem;color:var(--muted)">Boarding Pass</div><div class="bp-barcode">' + bars + '</div></div>'
    + '<div class="bp-status">&#10003; CONFIRMED</div>'
    + '</div>';
}

function goPage(n) {
  var pages = document.querySelectorAll('[id^="page"]');
  for (var i = 0; i < pages.length; i++) {
    pages[i].style.display = 'none';
    pages[i].className = pages[i].id === 'page1' ? '' : 'section';
  }
  var target = document.getElementById('page' + n);
  if (target) { target.style.display = 'block'; target.className = target.id === 'page1' ? '' : 'section active'; }
  var steps = ['st1','st2','st3','st4','st5'];
  for (var j = 0; j < steps.length; j++) {
    var s = document.getElementById(steps[j]);
    s.className = 'sp';
    if (j + 1 < n) s.className = 'sp done';
    if (j + 1 === n) s.className = 'sp active';
  }
  if (n === 4) buildPaxForms();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(msg, ok) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (ok ? ' ok' : '');
  setTimeout(function() { t.className = 'toast'; }, 3000);
}

document.getElementById('page1').style.display = 'block';
for (var _i = 2; _i <= 5; _i++) {
  var _p = document.getElementById('page' + _i);
  if (_p) { _p.style.display = 'none'; _p.className = 'section'; }
}
</script>
</body>
</html>`;

// ── ROUTES ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send(HTML));

app.post('/api/search', (req, res) => {
  res.json({ cruises: CRUISES });
});

app.post('/api/book', (req, res) => {
  const { cruiseId, cabinClass, cabinNum, passengers } = req.body;
  const cruise = CRUISES.find(c => c.id === cruiseId);
  const ref = 'CRZ' + Date.now().toString(36).toUpperCase();
  const booking = { ref, cruise, cabinClass, cabinNum, passengers };
  bookings[ref] = booking;
  res.json({ success: true, booking });
});

app.listen(3000, () => console.log('CruiseZip running on http://localhost:3000'));
