import { useState, useEffect } from "react";

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
    id: "maitri", name: "Maitri", fullName: "Maitri Station",
    location: "Queen Maud Land · 70°46'S 11°44'E",
    photo: "MAITRI_STATION", bg: "BG_MAITRI",
    temp: "−18 °C", wind: "10 kts · NE", power: "Optimal", status: "Operational",
    mmCx: 44, mmCy: 50,
  },
  {
    id: "bharati", name: "Bharati", fullName: "Bharati Station",
    location: "Larsemann Hills · 69°24'S 76°11'E",
    photo: "BHARATI_STATION", bg: "BG_BHARATI",
    temp: "−10 °C", wind: "22 kts · E", power: "Optimal", status: "Operational",
    mmCx: 61, mmCy: 65,
  },
];

function Minimap({ activeId }) {
  return (
    <svg viewBox="0 0 100 100" width="76" height="76">
      <ellipse cx="50" cy="55" rx="39" ry="36" fill="#b8d0de" opacity="0.45" />
      <polygon
        points="50,18 63,34 82,44 72,56 77,72 61,66 50,82 39,66 23,72 28,56 18,44 37,34"
        fill="#c5dce8" opacity="0.82"
      />
      {STATIONS.map((s) => {
        const on = s.id === activeId;
        return (
          <g key={s.id}>
            <circle cx={s.mmCx} cy={s.mmCy} r={on ? 4.5 : 3}
              fill={on ? "#e8600a" : "rgba(232,96,10,0.28)"}
              style={{ transition: "all 0.4s" }} />
            <text x={s.mmCx - (s.id === "maitri" ? 18 : 1)} y={s.mmCy - 7}
              fontSize="6.2" fontWeight="700"
              fill={on ? "#e8600a" : "rgba(232,96,10,0.38)"}
              style={{ transition: "fill 0.4s" }}>
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MetricRow({ pip, label, value }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
      <div style={{ width:5, height:5, borderRadius:"50%", background:pip, flexShrink:0 }} />
      <span style={{ fontSize:12.5, color:"rgba(255,255,255,0.82)" }}>
        <span style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginRight:3 }}>{label}:</span>
        {value}
      </span>
    </div>
  );
}

// Tiny reusable style helpers
const S = {
  btn: (active) => ({
    background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.65)", width:26, height:26, borderRadius:"50%",
    cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center",
  }),
};

export default function PolarisLogin({ onLogin }) {
  const [cur, setCur] = useState(0);
  const [fade, setFade] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [uFocus, setUFocus] = useState(false);
  const [pFocus, setPFocus] = useState(false);

  const st = STATIONS[cur];

  useEffect(() => {
    const t = setInterval(() => slide((cur + 1) % STATIONS.length), 7000);
    return () => clearInterval(t);
  }, [cur]);

  function slide(idx) {
    if (idx === cur) return;
    setFade(false);
    setTimeout(() => { setCur(idx); setFade(true); }, 380);
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) { alert("Please enter your credentials."); return; }
    // Prototype auth: any non-empty credentials are accepted.
    // Replace with institutional SSO (OAuth2 / OIDC) + MFA before real use.
    if (onLogin) onLogin(username);
  }

  const inputStyle = (focused) => ({
    width:"100%", padding:"12px 38px 12px 38px",
    border: `1.5px solid ${focused ? "#e8600a" : "#e3e3e3"}`,
    borderRadius:10, fontSize:13.5, color:"#222", background: focused ? "#fff" : "#f9f9f9",
    outline:"none", fontFamily:"inherit", transition:"border-color 0.18s, background 0.18s",
  });

  return (
    <div style={{
      position:"fixed", inset:0,
      fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",
      overflow:"hidden", background:"#000",
    }}>
      {/* ── Backgrounds ── */}
      {STATIONS.map((s, i) => (
        <div key={s.id} style={{
          position:"absolute", inset:0,
          backgroundImage:`url(${IMG[s.bg]})`,
          backgroundSize:"cover", backgroundPosition:"center",
          opacity: i === cur ? 1 : 0,
          transition:"opacity 1.3s cubic-bezier(0.4,0,0.2,1)", zIndex:0,
        }} />
      ))}
      <div style={{
        position:"absolute", inset:0, zIndex:1,
        background:"linear-gradient(120deg,rgba(0,8,20,0.70) 0%,rgba(0,10,24,0.50) 50%,rgba(0,5,15,0.67) 100%)",
      }} />

      {/* ── Top bar ── */}
      <header style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        height:70,
        background:"#0c1526",
        display:"flex", alignItems:"stretch",
        overflow:"hidden",
        boxShadow:"0 2px 20px rgba(0,0,0,0.55)",
        fontFamily:"'Segoe UI',system-ui,sans-serif",
      }}>

        {/* ── Logo band with diagonal right clip ── */}
        <div style={{
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
            <div style={{ display:"flex", flexDirection:"column", lineHeight:1.3 }}>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Smart India</span>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Hackathon</span>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>2026</span>
            </div>
          </div>

          {/* Sep */}
          <div style={{ width:1, height:42, background:"rgba(255,255,255,0.16)", flexShrink:0, alignSelf:"center" }} />

          {/* MoES */}
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"0 14px" }}>
            <img src={IMG.LOGO_MOES} alt="Ministry of Earth Sciences"
              style={{ height:38, width:"auto", objectFit:"contain", display:"block" }} />
            <div style={{ display:"flex", flexDirection:"column", lineHeight:1.3 }}>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Ministry of</span>
              <span style={{ fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.88)", whiteSpace:"nowrap" }}>Earth Sciences</span>
              <span style={{ fontSize:10, fontWeight:500, color:"rgba(255,255,255,0.5)", whiteSpace:"nowrap" }}>(MoES)</span>
            </div>
          </div>

          {/* Sep */}
          <div style={{ width:1, height:42, background:"rgba(255,255,255,0.16)", flexShrink:0, alignSelf:"center" }} />

          {/* NCPOR — logo only, text is already inside the circular logo badge */}
          <div style={{ display:"flex", alignItems:"center", padding:"0 4px 0 14px" }}>
            <img src={IMG.LOGO_NCPOR} alt="NCPOR"
              style={{ height:44, width:"auto", objectFit:"contain", display:"block" }} />
          </div>

        </div>{/* /logo band */}

        {/* ── Title ── */}
        <div style={{ flex:1, display:"flex", alignItems:"center", padding:"0 24px", minWidth:0 }}>
          <span style={{
            fontSize:18.5, fontWeight:600,
            color:"rgba(255,255,255,0.93)", letterSpacing:0.1,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          }}>
            Digital Twin Platform for Indian Antarctic Research Stations
          </span>
        </div>

      </header>

      {/* ── Body ── */}
      <div style={{
        position:"fixed", inset:0, zIndex:10,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"80px 48px 48px", gap:28,
      }}>

        {/* Station card */}
        <div style={{
          width:440, flexShrink:0,
          background:"rgba(255,255,255,0.075)",
          backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
          border:"1px solid rgba(255,255,255,0.14)",
          borderRadius:16, overflow:"hidden",
          boxShadow:"0 28px 70px rgba(0,0,0,0.56), 0 1px 0 rgba(255,255,255,0.09) inset",
        }}>

          {/* Photo */}
          <div style={{ position:"relative", width:"100%", height:232, overflow:"hidden" }}>
            {STATIONS.map((s, i) => (
              <img key={s.id} src={IMG[s.photo]} alt={s.fullName}
                style={{
                  position:"absolute", inset:0, width:"100%", height:"100%",
                  objectFit:"cover", objectPosition:"center",
                  opacity: i === cur ? (fade ? 1 : 0) : 0,
                  transition:"opacity 0.85s ease",
                }} />
            ))}
            <div style={{
              position:"absolute", bottom:0, left:0, right:0, height:90,
              background:"linear-gradient(transparent,rgba(0,0,0,0.68))",
              zIndex:1, pointerEvents:"none",
            }} />
            <div style={{
              position:"absolute", bottom:12, left:15, zIndex:2,
              fontSize:9.5, fontWeight:700, letterSpacing:1.2,
              color:"rgba(255,255,255,0.52)", textTransform:"uppercase",
              opacity: fade ? 1 : 0, transition:"opacity 0.4s",
            }}>
              {st.location}
            </div>
          </div>

          {/* Metrics strip */}
          <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ flex:1, padding:"12px 16px" }}>
              <div style={{
                fontSize:8.5, fontWeight:700, letterSpacing:1.1,
                color:"rgba(255,255,255,0.34)", textTransform:"uppercase", marginBottom:8,
                opacity: fade ? 1 : 0, transition:"opacity 0.4s",
              }}>
                Current Station Metrics ({st.name.toUpperCase()})
              </div>
              <div style={{ opacity: fade ? 1 : 0, transition:"opacity 0.4s" }}>
                <MetricRow pip="#5ab4d8" label="Temperature" value={st.temp} />
                <MetricRow pip="#6ecfa8" label="Wind"        value={st.wind} />
                <MetricRow pip="#f0b429" label="Power"       value={st.power} />
                <MetricRow pip="#a78bfa" label="Status"      value={st.status} />
              </div>
            </div>
            {/* Real Antarctica map — click to enlarge */}
            <div
              onClick={() => setMapOpen(true)}
              title="Click to view full map"
              style={{
                width:120, flexShrink:0,
                borderLeft:"1px solid rgba(255,255,255,0.07)",
                background:"rgba(0,0,0,0.18)",
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                padding:"8px 6px", gap:4,
                cursor:"pointer",
                position:"relative",
                transition:"background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(0,0,0,0.18)"}
            >
              <div style={{ position:"relative", width:"100%", textAlign:"center" }}>
                <img
                  src={IMG_ANTMAP}
                  alt="Antarctica Map"
                  style={{
                    width:"100%", height:86,
                    objectFit:"cover", objectPosition:"center",
                    borderRadius:4,
                    display:"block",
                  }}
                />
                {/* Station dots overlay */}
                <div style={{
                  position:"absolute", inset:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {/* Maitri pin - top center-right area */}
                  {STATIONS.map(s => (
                    <div key={s.id} style={{
                      position:"absolute",
                      left: s.id==="maitri" ? "57%" : "72%",
                      top:  s.id==="maitri" ? "22%" : "48%",
                      transform:"translate(-50%,-50%)",
                    }}>
                      <div style={{
                        width: s.id===st.id ? 7 : 5,
                        height: s.id===st.id ? 7 : 5,
                        borderRadius:"50%",
                        background: s.id===st.id ? "#e8600a" : "rgba(232,96,10,0.45)",
                        border: s.id===st.id ? "1.5px solid #fff" : "1px solid rgba(255,255,255,0.4)",
                        boxShadow: s.id===st.id ? "0 0 5px rgba(232,96,10,0.8)" : "none",
                        transition:"all 0.4s",
                      }} />
                    </div>
                  ))}
                </div>
                {/* Zoom hint icon */}
                <div style={{
                  position:"absolute", top:3, right:3,
                  background:"rgba(0,0,0,0.55)", borderRadius:3,
                  padding:"2px 4px", fontSize:9,
                  color:"rgba(255,255,255,0.7)", lineHeight:1,
                }}>⤢</div>
              </div>
              <span style={{
                fontSize:9, color:"rgba(255,255,255,0.38)", letterSpacing:0.4,
                textTransform:"uppercase", fontWeight:600,
              }}>Click to expand</span>
            </div>
          </div>

          {/* Nav */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"9px 14px 6px",
          }}>
            <button onClick={() => slide((cur - 1 + STATIONS.length) % STATIONS.length)}
              style={S.btn(false)}>&#8592;</button>
            <span style={{
              fontSize:10.5, fontWeight:700, letterSpacing:0.9,
              color:"rgba(255,255,255,0.48)", textTransform:"uppercase",
            }}>{st.fullName}</span>
            <button onClick={() => slide((cur + 1) % STATIONS.length)}
              style={S.btn(false)}>&#8594;</button>
          </div>
          <div style={{ display:"flex", gap:6, padding:"0 14px 11px" }}>
            {STATIONS.map((_, i) => (
              <button key={i} onClick={() => slide(i)} style={{
                height:3, borderRadius:2, border:"none", outline:"none", cursor:"pointer", padding:0,
                background: i === cur ? "#e8600a" : "rgba(255,255,255,0.2)",
                width: i === cur ? 32 : 22, transition:"all 0.3s",
              }} />
            ))}
          </div>
        </div>

        {/* ── Login panel ── */}
        <div style={{
          width:348, flexShrink:0,
          background:"rgba(255,255,255,0.97)",
          borderRadius:16, padding:"34px 30px 30px",
          boxShadow:"0 32px 80px rgba(0,0,0,0.62), 0 1px 0 rgba(255,255,255,0.5) inset",
          display:"flex", flexDirection:"column",
        }}>
          {/* Badge */}
          <div style={{
            alignSelf:"center", display:"flex", alignItems:"center", gap:5,
            background:"#edfaf2", border:"1px solid #a8e6c0",
            borderRadius:20, padding:"4px 12px", marginBottom:18,
            fontSize:10.5, fontWeight:600, color:"#1a7a3c",
          }}>
            <div style={{
              width:6, height:6, borderRadius:"50%", background:"#22c55e",
              animation:"blink 1.6s infinite",
            }} />
            All Systems Operational
          </div>

          <h1 style={{
            fontSize:22, fontWeight:700, color:"#111",
            textAlign:"center", marginBottom:5, letterSpacing:-0.2,
          }}>Secure Portal Login</h1>
          <p style={{ fontSize:12.5, color:"#999", textAlign:"center", marginBottom:26 }}>
            Network Access for authorized personnel
          </p>

          {/* Username field */}
          <div style={{ position:"relative", marginBottom:14 }}>
            <svg style={{
              position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              width:16, height:16, opacity:0.33, pointerEvents:"none",
            }} viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <input
              type="text" value={username} placeholder="Username" autoComplete="username"
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setUFocus(true)} onBlur={() => setUFocus(false)}
              style={{...inputStyle(uFocus), padding:"12px 14px 12px 38px"}}
            />
          </div>

          {/* Password field */}
          <div style={{ position:"relative", marginBottom:4 }}>
            <svg style={{
              position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              width:16, height:16, opacity:0.33, pointerEvents:"none",
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
              position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer",
              color:"#bbb", fontSize:13, lineHeight:1, padding:0,
            }}>{showPass ? "●" : "○"}</button>
          </div>

          <button onClick={handleLogin} style={{
            width:"100%", padding:13, marginTop:16,
            background:"#e8600a", color:"#fff", border:"none", borderRadius:10,
            fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 16px rgba(232,96,10,0.30)", letterSpacing:0.2,
            transition:"background 0.2s",
          }}
            onMouseOver={e => e.currentTarget.style.background="#c94f08"}
            onMouseOut={e  => e.currentTarget.style.background="#e8600a"}
          >Log In</button>

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:18 }}>
            {["Forgot Password?","Request Access"].map(t => (
              <a key={t} href="#" style={{
                fontSize:12, color:"#aaa", textDecoration:"underline",
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
                      background: s.id===st.id ? "#e8600a" : "rgba(60,60,60,0.85)",
                      padding:"2px 7px", borderRadius:4,
                      marginBottom:3, whiteSpace:"nowrap",
                      boxShadow:"0 2px 6px rgba(0,0,0,0.5)",
                    }}>{s.name} (India)</div>
                    <div style={{
                      width:10, height:10, borderRadius:"50%",
                      background: s.id===st.id ? "#e8600a" : "#888",
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

            {/* Star */}
      <div style={{
        position:"fixed", bottom:52, right:28, zIndex:20,
        fontSize:26, color:"rgba(255,255,255,0.13)", userSelect:"none",
      }}>&#10022;</div>

      {/* Footer */}
      <footer style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:200, height:40,
        background:"rgba(2,8,18,0.82)",
        backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        borderTop:"1px solid rgba(255,255,255,0.06)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px",
      }}>
        <div style={{ display:"flex", gap:22 }}>
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
      `}</style>
    </div>
  );
}
