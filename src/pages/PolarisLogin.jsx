import { useState } from "react";

import { ROLES } from "../context/PolarisContext";

/* Station photography and logos are bundled as real image assets so
   Vite can cache them separately instead of inlining ~9 MB of base64. */
import IMPORTED_MAITRI_STATION from "../assets/login-maitri-station.png";
import IMPORTED_BHARATI_STATION from "../assets/login-bharati-station.png";
import IMPORTED_BG_MAITRI from "../assets/login-bg-maitri.png";
import IMPORTED_BG_BHARATI from "../assets/login-bg-bharati.png";
import IMPORTED_LOGO_SIH from "../assets/login-logo-sih.png";
import IMPORTED_LOGO_MOES from "../assets/login-logo-moes.png";
import IMPORTED_LOGO_NCPOR from "../assets/login-logo-ncpor.png";
import IMPORTED_IMG_ANTMAP from "../assets/login-img-antmap.png";

const IMG = {
  MAITRI_STATION:  IMPORTED_MAITRI_STATION,
  BHARATI_STATION: IMPORTED_BHARATI_STATION,
  BG_MAITRI:       IMPORTED_BG_MAITRI,
  BG_BHARATI:      IMPORTED_BG_BHARATI,
  LOGO_SIH:        IMPORTED_LOGO_SIH,
  LOGO_MOES:       IMPORTED_LOGO_MOES,
  LOGO_NCPOR:      IMPORTED_LOGO_NCPOR,
};

// Real Antarctica map
const IMG_ANTMAP = IMPORTED_IMG_ANTMAP;


const STATIONS = [
  {
    id: "bharati", name: "Bharati", fullName: "Bharati Station",
    region: "East Antarctica (Larsemann Hills)",
    coords: "69°24'S, 76°11'E",
    location: "LARSEMANN HILLS · 69°24'S 76°11'E",
    photo: "BHARATI_STATION", bg: "BG_BHARATI",
    temp: "−10 °C", wind: "22 kts · E", power: "Optimal", status: "Operational",
  },
  {
    id: "maitri", name: "Maitri", fullName: "Maitri Station",
    region: "Antarctica (Schirmacher Oasis)",
    coords: "70°46'S, 11°44'E",
    location: "QUEEN MAUD LAND · 70°46'S 11°44'E",
    photo: "MAITRI_STATION", bg: "BG_MAITRI",
    temp: "−18 °C", wind: "10 kts · NE", power: "Optimal", status: "Operational",
  },
];

function Chip({ pip, label, value }) {
  return (
    <div className="pl-chip">
      <span className="pl-chip-pip" style={{ background: pip }} />
      <span className="pl-chip-label">{label}</span>
      <span className="pl-chip-val">{value}</span>
    </div>
  );
}

export default function PolarisLogin({ onLogin }) {
  const [cur, setCur] = useState("maitri");
  const [role, setRole] = useState("operations");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [uFocus, setUFocus] = useState(false);
  const [pFocus, setPFocus] = useState(false);
  const [rFocus, setRFocus] = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) { alert("Please enter your credentials."); return; }
    // Prototype auth: any non-empty credentials are accepted.
    // Replace with institutional SSO (OAuth2 / OIDC) + MFA before real use.
    if (onLogin) onLogin({ username, role, station: cur });
  }

  const inputStyle = (focused) => ({
    width:"100%", padding:"clamp(14px, 1.1vw, 17px) 40px",
    border: `1.5px solid ${focused ? "#e8600a" : "#e3e3e3"}`,
    borderRadius:12, fontSize:"clamp(15.5px, 1.1vw, 17px)", color:"#222", background: focused ? "#fff" : "#f9f9f9",
    outline:"none", fontFamily:"inherit", transition:"border-color 0.18s, background 0.18s",
  });

  return (
    <div style={{
      position:"fixed", inset:0,
      fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",
      overflow:"hidden", background:"#000",
    }}>
      {/* ── Backgrounds ── */}
      {STATIONS.map((s) => (
        <div key={s.id} style={{
          position:"absolute", inset:0,
          backgroundImage:`url(${IMG[s.bg]})`,
          backgroundSize:"cover", backgroundPosition:"center",
          opacity: s.id === cur ? 1 : 0,
          transition:"opacity 1.3s cubic-bezier(0.4,0,0.2,1)", zIndex:0,
        }} />
      ))}
      <div style={{
        position:"absolute", inset:0, zIndex:1,
        background:"linear-gradient(120deg,rgba(0,8,20,0.70) 0%,rgba(0,10,24,0.50) 50%,rgba(0,5,15,0.67) 100%)",
      }} />

      {/* ── Top bar ── */}
      <header className="pl-topbar" style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        height:70,
        background:"#0c1526",
        display:"flex", alignItems:"stretch",
        overflow:"hidden",
        boxShadow:"0 2px 20px rgba(0,0,0,0.55)",
        fontFamily:"'Segoe UI',system-ui,sans-serif",
      }}>

        {/* ── Logo band with diagonal right clip ── */}
        <div className="pl-logoband" style={{
          display:"flex", alignItems:"center",
          background:"#152040",
          clipPath:"polygon(0 0, calc(100% - 28px) 0, 100% 100%, 0 100%)",
          padding:"0 44px 0 14px",
          gap:0, flexShrink:0,
        }}>

          {/* SIH */}
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"0 14px 0 4px" }}>
            <img src={IMG.LOGO_SIH} alt="SIH 2026"
              style={{ height:40, width:"auto", objectFit:"contain", display:"block" }} />
            <div className="pl-hide-sm" style={{ display:"flex", flexDirection:"column", lineHeight:1.3 }}>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Smart India</span>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Hackathon</span>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>2026</span>
            </div>
          </div>

          {/* Sep */}
          <div className="pl-hide-md" style={{ width:1, height:42, background:"rgba(255,255,255,0.16)", flexShrink:0, alignSelf:"center" }} />

          {/* MoES */}
          <div className="pl-hide-md" style={{ display:"flex", alignItems:"center", gap:9, padding:"0 14px" }}>
            <img src={IMG.LOGO_MOES} alt="Ministry of Earth Sciences"
              style={{ height:38, width:"auto", objectFit:"contain", display:"block" }} />
            <div style={{ display:"flex", flexDirection:"column", lineHeight:1.3 }}>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Ministry of</span>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Earth Sciences</span>
              <span style={{ fontSize:10, fontWeight:500, color:"rgba(255,255,255,0.5)", whiteSpace:"nowrap" }}>(MoES)</span>
            </div>
          </div>

          {/* Sep */}
          <div className="pl-hide-md" style={{ width:1, height:42, background:"rgba(255,255,255,0.16)", flexShrink:0, alignSelf:"center" }} />

          {/* NCPOR — logo only, text is already inside the circular logo badge */}
          <div className="pl-hide-md" style={{ display:"flex", alignItems:"center", padding:"0 4px 0 14px" }}>
            <img src={IMG.LOGO_NCPOR} alt="NCPOR"
              style={{ height:44, width:"auto", objectFit:"contain", display:"block" }} />
          </div>

        </div>{/* /logo band */}

        {/* ── Title ── */}
        <div style={{ flex:1, display:"flex", alignItems:"center", padding:"0 24px", minWidth:0 }}>
          <span className="pl-apptitle" style={{
            fontSize:20, fontWeight:600,
            color:"rgba(255,255,255,0.93)", letterSpacing:0.1,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            Digital Twin Platform for Indian Antarctic Research Stations
          </span>
        </div>

      </header>

      {/* ── Body ── */}
      <div className="pl-body" style={{
        position:"fixed", inset:0, zIndex:10,
      }}>

        {/* ── Station twin picker ── */}
        <div className="pl-picker">
          <div className="pl-picker-head">
            Choose your station twin <span>(Access &amp; Management)</span>
          </div>

          <div className="pl-picker-cards">
            {STATIONS.map((s) => {
              const active = cur === s.id;
              return (
                <div
                  key={s.id}
                  className={`pl-station${active ? " is-active" : ""}`}
                  onClick={() => setCur(s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCur(s.id); }
                  }}
                >
                  <div className="pl-station-photo">
                    <img src={IMG[s.photo]} alt={s.fullName} />
                    <div className="pl-station-locband">{s.location}</div>
                  </div>

                  <div className="pl-station-body">
                    <div className="pl-station-headrow">
                      <div style={{ minWidth:0 }}>
                        <div className="pl-station-name">{s.fullName}</div>
                        <div className="pl-station-loc">{s.region}</div>
                        <div className="pl-station-coords">{s.coords}</div>
                      </div>
                      <img
                        className="pl-station-map"
                        src={IMG_ANTMAP}
                        alt="Antarctica map"
                        title="Click to view full map"
                        onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}
                      />
                    </div>

                    <div className="pl-chip-grid">
                      <Chip pip="#5ab4d8" label="Temp:"  value={s.temp} />
                      <Chip pip="#6ecfa8" label="Wind:"  value={s.wind} />
                      <Chip pip="#f0b429" label="Power:" value={s.power} />
                      <Chip pip="#a78bfa" label="Status:" value={s.status} />
                    </div>

                    <div className={`pl-station-cta${active ? " is-active" : ""}`}>
                      {active ? "✓ Selected twin" : `Select ${s.name} twin`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Login panel ── */}
        <div className="pl-panel" style={{
          flexShrink:0,
          background:"rgba(255,255,255,0.97)",
          borderRadius:16, padding:"clamp(34px, 2.6vw, 46px) clamp(34px, 2.6vw, 46px) clamp(30px, 2.2vw, 40px)",
          boxShadow:"0 32px 80px rgba(0,0,0,0.62), 0 1px 0 rgba(255,255,255,0.5) inset",
          display:"flex", flexDirection:"column",
        }}>
          {/* Badge */}
          <div style={{
            alignSelf:"center", display:"flex", alignItems:"center", gap:5,
            background:"#edfaf2", border:"1px solid #a8e6c0",
            borderRadius:20, padding:"6px 14px", marginBottom:16,
            fontSize:13, fontWeight:600, color:"#1a7a3c",
          }}>
            <div style={{
              width:7, height:7, borderRadius:"50%", background:"#22c55e",
              animation:"blink 1.6s infinite",
            }} />
            All Systems Operational
          </div>

          <h1 style={{
            fontSize:"clamp(27px, 2vw, 34px)", fontWeight:700, color:"#111",
            textAlign:"center", marginBottom:6, letterSpacing:-0.2,
          }}>Secure Portal Login</h1>
          <p style={{ fontSize:"clamp(14px, 1vw, 16px)", color:"#999", textAlign:"center", marginBottom:22 }}>
            Network Access for authorized personnel
          </p>

          {/* Role selector (RBAC) */}
          <div style={{ marginBottom:16 }}>
            <div style={{
              fontSize:10.5, fontWeight:700, letterSpacing:1.1, textTransform:"uppercase",
              color:"#8a8a8a", marginBottom:6,
            }}>
              Sign in as <span style={{ color:"#e8600a" }}>(Role · RBAC)</span>
            </div>
            <div style={{ position:"relative" }}>
              <span style={{
                position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
                fontSize:16, pointerEvents:"none", zIndex:1,
              }}>{ROLES[role].icon}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onFocus={() => setRFocus(true)}
                onBlur={() => setRFocus(false)}
                aria-label="Sign in as role"
                style={{
                  ...inputStyle(rFocus),
                  appearance:"none", WebkitAppearance:"none", MozAppearance:"none",
                  padding:"13px 36px 13px 42px",
                  cursor:"pointer", color:"#222",
                }}
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
              <svg style={{
                position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                pointerEvents:"none", opacity:0.4,
              }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.4">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <div style={{ fontSize:12, color:"#999", marginTop:6, minHeight:15 }}>
              {ROLES[role].desc}
            </div>
          </div>

          {/* Username field */}
          <div style={{ position:"relative", marginBottom:14 }}>
            <svg style={{
              position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
              width:18, height:18, opacity:0.33, pointerEvents:"none",
            }} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <input
              type="text" value={username} placeholder="Username" autoComplete="username"
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setUFocus(true)} onBlur={() => setUFocus(false)}
              style={{...inputStyle(uFocus), padding:"14px 14px 14px 42px"}}
            />
          </div>

          {/* Password field */}
          <div style={{ position:"relative", marginBottom:4 }}>
            <svg style={{
              position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
              width:18, height:18, opacity:0.33, pointerEvents:"none",
            }} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type={showPass ? "text" : "password"} value={password}
              placeholder="Password" autoComplete="current-password"
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPFocus(true)} onBlur={() => setPFocus(false)}
              style={inputStyle(pFocus)}
            />
            <button onClick={() => setShowPass(!showPass)} style={{
              position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer",
              color:"#bbb", fontSize:16, lineHeight:1, padding:0,
            }}>{showPass ? "●" : "○"}</button>
          </div>

          <button onClick={handleLogin} style={{
            width:"100%", padding:"clamp(15px, 1.2vw, 18px)", marginTop:14,
            background:"#e8600a", color:"#fff", border:"none", borderRadius:12,
            fontSize:"clamp(16px, 1.2vw, 18px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 16px rgba(232,96,10,0.30)", letterSpacing:0.2,
            transition:"background 0.2s",
          }}
            onMouseOver={e => e.currentTarget.style.background="#c94f08"}
            onMouseOut={e  => e.currentTarget.style.background="#e8600a"}
          >Log In</button>

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:18 }}>
            {["Forgot Password?","Request Access"].map(t => (
              <a key={t} href="#" style={{
                fontSize:13.5, color:"#aaa", textDecoration:"underline",
                textUnderlineOffset:2,
              }}>{t}</a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map Lightbox Modal ── */}
      {mapOpen && (
        <div
          onClick={() => setMapOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:999,
            background:"rgba(0,0,0,0.88)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:24,
            cursor:"zoom-out",
            animation:"fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position:"relative",
              maxWidth:"92vw", maxHeight:"90vh",
              borderRadius:12,
              overflow:"hidden",
              boxShadow:"0 32px 80px rgba(0,0,0,0.8)",
              border:"1px solid rgba(255,255,255,0.1)",
              cursor:"default",
            }}
          >
            <img
              src={IMG_ANTMAP}
              alt="Antarctica Research Stations Map"
              style={{
                display:"block",
                maxWidth:"92vw", maxHeight:"86vh",
                objectFit:"contain",
              }}
            />
            {/* Station pins overlay on modal */}
            <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
              {STATIONS.map(s => (
                <div key={s.id} style={{
                  position:"absolute",
                  left: s.id==="maitri" ? "57%" : "72%",
                  top:  s.id==="maitri" ? "22%" : "48%",
                  transform:"translate(-50%,-100%)",
                }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{
                      fontSize:10, fontWeight:700, color:"#fff",
                      background: s.id===cur ? "#e8600a" : "rgba(60,60,60,0.85)",
                      padding:"2px 7px", borderRadius:4,
                      marginBottom:3, whiteSpace:"nowrap",
                      boxShadow:"0 2px 6px rgba(0,0,0,0.5)",
                    }}>{s.name} (India)</div>
                    <div style={{
                      width:10, height:10, borderRadius:"50%",
                      background: s.id===cur ? "#e8600a" : "#888",
                      border:"2px solid #fff",
                      margin:"0 auto",
                      boxShadow:"0 0 8px rgba(232,96,10,0.6)",
                    }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Close button */}
            <button
              onClick={() => setMapOpen(false)}
              style={{
                position:"absolute", top:10, right:10,
                background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.2)",
                color:"#fff", width:32, height:32, borderRadius:"50%",
                fontSize:16, cursor:"pointer", lineHeight:1,
                display:"flex", alignItems:"center", justifyContent:"center",
                backdropFilter:"blur(4px)",
              }}
            >✕</button>
            {/* Caption */}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0,
              background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)",
              padding:"10px 18px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.85)" }}>
                🗺 Antarctica — Indian Research Stations
              </span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>
                Click outside or ✕ to close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pl-footer" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:200, height:40,
        background:"rgba(2,8,18,0.82)",
        backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        borderTop:"1px solid rgba(255,255,255,0.06)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px",
      }}>
        <div className="pl-footer-links" style={{ display:"flex", gap:22 }}>
          {["System Status","Help & Support","Privacy Policy"].map(t => (
            <a key={t} href="#" style={{
              fontSize:11.5, color:"rgba(255,255,255,0.38)", textDecoration:"none",
            }}>{t}</a>
          ))}
        </div>
        <span style={{ fontSize:11.5, color:"rgba(255,255,255,0.28)" }}>© NCPOR 2026</span>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:scale(0.96); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes blink {
          0%,100% { opacity:1; }
          50% { opacity:0.4; transform:scale(0.8); }
        }
        * { box-sizing:border-box; }

        /* ── Layout: picker + panel ── */
        .pl-body {
          display:flex; flex-wrap:wrap;
          align-items:center; justify-content:center;
          gap:clamp(18px, 2vw, 40px); padding:76px 24px 40px;
          overflow-y:auto; -webkit-overflow-scrolling:touch;
        }
        .pl-picker { width:min(960px, 54vw); display:flex; flex-direction:column; gap:clamp(14px, 1.2vw, 20px); }
        .pl-picker-head {
          font-size:clamp(14.5px, 1.05vw, 19px); font-weight:800; letter-spacing:1.8px; text-transform:uppercase;
          color:rgba(255,255,255,0.92); text-shadow:0 2px 10px rgba(0,0,0,0.6);
          padding-left:2px;
        }
        .pl-picker-head span { color:rgba(255,255,255,0.5); font-weight:600; letter-spacing:0.8px; text-transform:none; }
        .pl-picker-cards { display:grid; grid-template-columns:1fr 1fr; gap:clamp(18px, 1.6vw, 28px); }
        .pl-panel { width:min(570px, 36vw); min-width:340px; }
        @media (max-width:1000px) {
          .pl-picker { width:100%; }
          .pl-panel { width:min(570px, 100%); min-width:0; }
        }

        .pl-station {
          text-align:left; cursor:pointer; padding:0; color:inherit; font:inherit;
          border:1px solid rgba(255,255,255,0.16);
          border-radius:14px; overflow:hidden;
          background:rgba(10,18,34,0.55);
          backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
          transition:border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .pl-station:hover { transform:translateY(-2px); border-color:rgba(255,255,255,0.34); }
        .pl-station:focus-visible { outline:2px solid #e8600a; outline-offset:2px; }
        .pl-station.is-active {
          border-color:#e8600a;
          box-shadow:0 0 0 1.5px #e8600a, 0 18px 48px rgba(0,0,0,0.5);
        }
        .pl-station-photo { position:relative; height:clamp(170px, 16vw, 300px); overflow:hidden; }
        .pl-station-photo img { width:100%; height:100%; object-fit:cover; display:block; }
        .pl-station-locband {
          position:absolute; bottom:0; left:0; right:0;
          padding:26px 16px 10px;
          font-size:clamp(11px, 0.8vw, 14px); font-weight:700; letter-spacing:1.1px; text-transform:uppercase;
          color:rgba(255,255,255,0.62);
          background:linear-gradient(transparent, rgba(0,0,0,0.72));
        }
        .pl-station-body { padding:clamp(15px, 1.4vw, 24px); display:flex; flex-direction:column; gap:clamp(13px, 1.2vw, 18px); }
        .pl-station-headrow { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .pl-station-name { font-size:clamp(19px, 1.45vw, 27px); font-weight:700; color:#fff; }
        .pl-station-loc { font-size:clamp(13px, 0.95vw, 17px); color:rgba(255,255,255,0.62); margin-top:4px; }
        .pl-station-coords { font-size:clamp(12.5px, 0.9vw, 16px); color:rgba(255,255,255,0.4); margin-top:2px; }
        .pl-station-map {
          width:clamp(70px, 5.5vw, 104px); height:clamp(58px, 4.6vw, 88px); object-fit:cover; border-radius:6px;
          border:1px solid rgba(255,255,255,0.18); flex-shrink:0; cursor:zoom-in;
        }
        .pl-chip-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(9px, 0.9vw, 13px) clamp(11px, 1vw, 14px); }
        .pl-chip {
          display:flex; align-items:center; gap:7px;
          font-size:clamp(13px, 0.95vw, 16px); color:rgba(255,255,255,0.85);
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09);
          border-radius:9px; padding:clamp(7px, 0.65vw, 10px) clamp(10px, 0.9vw, 14px); white-space:nowrap;
        }
        .pl-chip-pip { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .pl-chip-label { color:rgba(255,255,255,0.45); font-size:clamp(11.5px, 0.85vw, 14px); }
        .pl-chip-val { overflow:hidden; text-overflow:ellipsis; }
        .pl-station-cta {
          margin-top:2px; text-align:center;
          font-size:clamp(13.5px, 1vw, 16px); font-weight:800; letter-spacing:0.8px; text-transform:uppercase;
          padding:clamp(13px, 1.1vw, 17px); border-radius:10px;
          border:1px solid rgba(232,96,10,0.55);
          color:#ffb488; background:rgba(232,96,10,0.10);
          transition:background 0.25s, color 0.25s;
        }
        .pl-station:hover .pl-station-cta { background:rgba(232,96,10,0.22); }
        .pl-station.is-active .pl-station-cta {
          background:#e8600a; border-color:#e8600a; color:#fff;
        }

        @media (max-width: 980px) {
          .pl-body { padding:84px 20px 52px; gap:24px; }
        }
        @media (max-width: 900px) {
          .pl-hide-md { display:none !important; }
        }
        @media (max-width: 640px) {
          .pl-topbar { height:58px !important; }
          .pl-body { padding:78px 12px 50px; }
          .pl-picker-cards { grid-template-columns:1fr; }
          .pl-station-photo { height:160px; }
          .pl-footer { padding:0 12px !important; }
          .pl-footer-links { gap:12px !important; flex-wrap:wrap; }
          .pl-footer-links a { font-size:10.5px !important; }
          /* prevent iOS auto-zoom on focus (inputs < 16px) */
          .pl-panel input, .pl-panel select { font-size:16px !important; }
        }
        @media (max-width: 480px) {
          .pl-hide-sm { display:none !important; }
          .pl-apptitle { font-size:12.5px !important; }
          .pl-panel { padding:30px 22px 26px !important; }
          .pl-logoband { padding:0 30px 0 10px !important; }
          .pl-footer-links { display:none !important; }
          .pl-footer { justify-content:center !important; }
        }
      `}</style>
    </div>
  );
}
