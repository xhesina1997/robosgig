// SignIn.jsx — RobosGig sign in / sign up page
// Single self-contained JSX module. No imports beyond React.
// Default-exports <SignIn />.
//
// Props (all optional):
//   initialMode   "in" | "up"          (default "in")
//   initialRole   "client" | "worker"  (default "client")
//   onSubmit({ mode, role, email, password, firstName, lastName, city })
//   onOAuth(provider)                  ("google" | "apple")
//   onDemo(name)                       ("Hans" | "Anna" | "Stefan")
//
// All callbacks are optional — if omitted the form just collects state.

import React, { useState } from "react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A",
  muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5",
  accent: "#84CC16", accentText: "#4D7C0F", accentBg: "#F0FAE0",
  soft: "#F5F5F3", positive: "#15803D",
};

// ─── Inline icons ───────────────────────────────────────────────────────────
const I = {
  mail: (s = 15) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>),
  lock: (s = 15) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>),
  user: (s = 15) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>),
  pin: (s = 15) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  home: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12 12 4l9 8M5 10v10h14V10"/></svg>),
  tool: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 7h6v6M6 17H2v-6M14 7 2 19M20 13l-6 6"/></svg>),
  check: (s = 10) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>),
  arrow: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
  shield: (s = 15) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>),
  card: (s = 15) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>),
  clock: (s = 15) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2"/></svg>),
  google: (s = 16) => (<svg width={s} height={s} viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.4h4.7c-.2 1.3-1.5 3.8-4.7 3.8a5.2 5.2 0 1 1 0-10.4c1.7 0 2.8.7 3.4 1.3l2.3-2.3C16.3 5.4 14.3 4.5 12 4.5a7.5 7.5 0 1 0 0 15c4.3 0 7.2-3 7.2-7.3 0-.5 0-.8-.1-1.2H12z"/></svg>),
  apple: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 12.5c0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.2 1-4 1-.9 0-2.1-1-3.5-1-1.8 0-3.5 1-4.4 2.7-1.9 3.3-.5 8.1 1.3 10.7.9 1.3 2 2.7 3.4 2.6 1.4-.1 1.9-.9 3.5-.9s2.1.9 3.5.9c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-3-4.1zM14.7 4.6c.7-.9 1.2-2.2 1.1-3.4-1.1.1-2.4.7-3.2 1.6-.7.8-1.3 2.1-1.1 3.3 1.2.1 2.5-.6 3.2-1.5z"/></svg>),
};

const RobosMark = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="3.5" y="9.5" width="25" height="16.5" rx="5" fill="#0A0A0A"/>
    <rect x="14.5" y="4" width="3" height="5" rx="1.5" fill="#0A0A0A"/>
    <circle cx="16" cy="3.4" r="1.6" fill="#84CC16"/>
    <rect x="9" y="14.5" width="5" height="5" rx="2.5" fill="#84CC16"/>
    <rect x="18" y="14.5" width="5" height="5" rx="2.5" fill="#84CC16"/>
    <rect x="12.5" y="23" width="7" height="1.6" rx=".8" fill="#84CC16" opacity=".9"/>
  </svg>
);

// ─── Demo seed data ─────────────────────────────────────────────────────────
const DEMOS = [
  { name: "Hans",   role: "plumber",     color: "#3B82F6" },
  { name: "Anna",   role: "cleaner",     color: "#10B981" },
  { name: "Stefan", role: "electrician", color: "#0A0A0A" },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function SignIn({
  initialMode = "in",
  initialRole = "client",
  onSubmit = () => {},
  onOAuth = () => {},
  onDemo = () => {},
}) {
  const [mode, setMode] = useState(initialMode); // "in" | "up"
  const [role, setRole] = useState(initialRole); // "client" | "worker"
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    email: "xhesinaveliuu@gmail.com",
    password: "supersecure",
    firstName: "",
    lastName: "",
    city: "Tirana, Albania",
    keepSignedIn: true,
    agree: true,
  });
  const set = (k) => (e) => {
    const v = e?.target?.type === "checkbox" ? e.target.checked : e?.target?.value;
    setForm((s) => ({ ...s, [k]: v }));
  };

  const isUp = mode === "up";

  const submit = (e) => {
    e?.preventDefault?.();
    onSubmit({ mode, role, ...form });
  };

  return (
    <div style={S.page}>

      {/* ── Top nav ─────────────────────────────────── */}
      <div style={S.nav}>
        <a style={S.logo} href="#" onClick={(e) => e.preventDefault()}>
          <RobosMark size={22}/>
          <span style={S.word}>
            RobosGig<span style={S.wordDot}/>
          </span>
        </a>
        <div style={S.navLinks}>
          <a href="#" style={S.navLink}>How it works</a>
          <a href="#" style={S.navLink}>Pricing</a>
          <a href="#" style={S.navLink}>Terms</a>
        </div>
        <div style={S.navRight}>
          <span style={S.status}>
            <span style={S.statusDot}/>
            2 412 pros online · Tirana
          </span>
          <button
            style={{ ...S.pillTab, ...(mode === "up" ? S.pillTabOn : null) }}
            onClick={() => setMode("up")}
          >Sign up</button>
          <button
            style={{ ...S.pillTab, ...(mode === "in" ? S.pillTabOn : null) }}
            onClick={() => setMode("in")}
          >Sign in</button>
        </div>
      </div>
      <div style={S.navEdge}/>

      {/* ── Main split ──────────────────────────────── */}
      <div style={S.split}>

        {/* LEFT · story panel */}
        <aside style={S.left}>
          <div style={S.leftBg}/>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={S.badge}>
              <span style={S.bDot}/>
              2 412 pros · ~12 min avg response
            </span>

            <h1 style={S.hd}>
              {isUp ? "Join RobosGig" : "Find trusted help"}{" "}
              <em style={S.hdEm}>
                {isUp ? "today" : "fast"}
                <span style={S.hdDot}/>
              </em>
            </h1>
            <p style={S.sub}>
              {isUp
                ? "A free account lets you post jobs, save pros, message instantly, and pay through escrow."
                : "Verified plumbers, electricians, cleaners and more — booked in minutes, paid through escrow."}
            </p>

            <div style={S.ticks}>
              <Tick lime icon={I.shield(15)} title="ID-verified workers"
                    sub="Government ID, payment account and address confirmed before they can apply." />
              <Tick icon={I.card(15)} title="Escrow payments"
                    sub="Your money is held safe until you confirm the job's done. Refund any time before." />
              <Tick icon={I.clock(15)} title="Fast matching"
                    sub="Most clients get an offer within 12 minutes. No quotes, no chasing." />
            </div>

            <div style={S.teaser}>
              <div style={S.stack}>
                <Av c="#3B82F6">H</Av>
                <Av c="#10B981">A</Av>
                <Av c="#0A0A0A">S</Av>
                <Av c="#F59E0B">M</Av>
              </div>
              <div style={S.teaserMeta}>
                <b style={S.teaserB}>4.8 ★ · 1 240 reviews this month</b>
                <span style={S.teaserS}>Trusted by clients across Tirana, Vienna, Berlin</span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT · form */}
        <main style={S.rightRail}>
          <form style={S.formWrap} onSubmit={submit}>

            {/* Role toggle */}
            <div style={S.roleToggle}>
              <button
                type="button"
                style={{ ...S.roleBtn, ...(role === "client" ? S.roleBtnOn : null) }}
                onClick={() => setRole("client")}
              >
                <span style={{ ...S.roleIc, ...(role === "client" ? S.roleIcOn : null) }}>{I.home(14)}</span>
                I need help
              </button>
              <button
                type="button"
                style={{ ...S.roleBtn, ...(role === "worker" ? S.roleBtnOn : null) }}
                onClick={() => setRole("worker")}
              >
                <span style={{ ...S.roleIc, ...(role === "worker" ? S.roleIcOn : null) }}>{I.tool(14)}</span>
                I'm a pro
              </button>
            </div>

            {isUp ? (
              <>
                <h2 style={S.formH}>Create your account.</h2>
                <p style={S.formSub}>
                  Already have one?{" "}
                  <a href="#" style={S.linkInk} onClick={(e) => { e.preventDefault(); setMode("in"); }}>
                    Sign in →
                  </a>
                </p>

                <div style={S.grid2}>
                  <Field label="First name">
                    <Input icon={I.user(15)} value={form.firstName} onChange={set("firstName")} placeholder="Xhesi"/>
                  </Field>
                  <Field label="Last name">
                    <Input icon={I.user(15)} value={form.lastName} onChange={set("lastName")} placeholder="Veliu"/>
                  </Field>
                </div>

                <Field label="Email">
                  <Input icon={I.mail(15)} type="email" value={form.email} onChange={set("email")} placeholder="you@email.com"/>
                </Field>

                <Field label="Password">
                  <Input
                    icon={I.lock(15)}
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="At least 8 characters"
                    rightAction={{ label: showPw ? "Hide" : "Show", onClick: () => setShowPw((s) => !s) }}
                  />
                  <div style={S.strength}>
                    <div style={S.bars}>
                      <span style={{ ...S.bar, ...S.barOn }}/>
                      <span style={{ ...S.bar, ...S.barOn }}/>
                      <span style={{ ...S.bar, ...S.barOn }}/>
                      <span style={S.bar}/>
                    </div>
                    Strong · meets all requirements
                  </div>
                </Field>

                <Field label="City">
                  <Input icon={I.pin(15)} value={form.city} onChange={set("city")} placeholder="Tirana, Albania"/>
                </Field>

                <label style={{ ...S.check, marginTop: 14 }}>
                  <input type="checkbox" checked={form.agree} onChange={set("agree")} style={{ display: "none" }}/>
                  <span style={{ ...S.checkBox, ...(form.agree ? S.checkBoxOn : null) }}>
                    {form.agree && I.check(10)}
                  </span>
                  I agree to the{" "}
                  <a href="#" style={S.linkInk}>Terms</a>
                  &nbsp;·&nbsp;
                  <a href="#" style={S.linkInk}>Privacy</a>
                </label>

                <button type="submit" style={S.cta}>
                  <span style={S.ctaPip}/>
                  Create account {I.arrow(14)}
                </button>

                <Divider>or sign up with</Divider>
                <OAuthRow onOAuth={onOAuth}/>

                <div style={S.footnote}>
                  Already have an account?{" "}
                  <a href="#" style={S.linkInk} onClick={(e) => { e.preventDefault(); setMode("in"); }}>Sign in</a>
                </div>
              </>
            ) : (
              <>
                <h2 style={S.formH}>Welcome back.</h2>
                <p style={S.formSub}>
                  New here?{" "}
                  <a href="#" style={S.linkInk} onClick={(e) => { e.preventDefault(); setMode("up"); }}>
                    Create a free account →
                  </a>
                </p>

                <Field label="Email">
                  <Input icon={I.mail(15)} type="email" value={form.email} onChange={set("email")} placeholder="you@email.com"/>
                </Field>

                <Field label="Password">
                  <Input
                    icon={I.lock(15)}
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="••••••••"
                    rightAction={{ label: showPw ? "Hide" : "Show", onClick: () => setShowPw((s) => !s) }}
                  />
                </Field>

                <div style={S.metaRow}>
                  <label style={S.check}>
                    <input type="checkbox" checked={form.keepSignedIn} onChange={set("keepSignedIn")} style={{ display: "none" }}/>
                    <span style={{ ...S.checkBox, ...(form.keepSignedIn ? S.checkBoxOn : null) }}>
                      {form.keepSignedIn && I.check(10)}
                    </span>
                    Keep me signed in
                  </label>
                  <a href="#" style={S.forgot}>Forgot password?</a>
                </div>

                <button type="submit" style={S.cta}>
                  <span style={S.ctaPip}/>
                  Sign in {I.arrow(14)}
                </button>

                <Divider>or continue with</Divider>
                <OAuthRow onOAuth={onOAuth}/>

                <div style={S.demosLbl}>Or try a demo account</div>
                <div style={S.demos}>
                  {DEMOS.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      style={S.demo}
                      onClick={() => onDemo(d.name)}
                    >
                      <span style={{ ...S.demoAv, background: d.color }}>{d.name[0]}</span>
                      <span>
                        <span style={S.demoNm}>{d.name}</span>
                        <span style={S.demoRl}>{d.role}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <div style={S.footnote}>
                  By continuing you accept our{" "}
                  <a href="#" style={S.linkInk}>Terms</a> and{" "}
                  <a href="#" style={S.linkInk}>Privacy</a>.
                </div>
              </>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}

// ─── Small subcomponents ────────────────────────────────────────────────────
function Tick({ icon, title, sub, lime }) {
  return (
    <div style={S.tick}>
      <span style={{ ...S.tickIc, ...(lime ? S.tickIcLime : null) }}>{icon}</span>
      <div>
        <div style={S.tickT}>{title}</div>
        <div style={S.tickS}>{sub}</div>
      </div>
    </div>
  );
}

function Av({ c, children }) {
  return <span style={{ ...S.av, background: c }}>{children}</span>;
}

function Field({ label, children }) {
  return (
    <div style={S.field}>
      <label style={S.fieldLbl}>{label}</label>
      {children}
    </div>
  );
}

function Input({ icon, rightAction, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.inputWrap}>
      <span style={S.inputIc}>{icon}</span>
      <input
        {...rest}
        style={{ ...S.inputEl, ...(focused ? S.inputFocus : null) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightAction && (
        <button type="button" style={S.rightAct} onClick={rightAction.onClick}>
          {rightAction.label}
        </button>
      )}
    </div>
  );
}

function Divider({ children }) {
  return (
    <div style={S.div}>
      <span style={S.divLine}/>
      {children}
      <span style={S.divLine}/>
    </div>
  );
}

function OAuthRow({ onOAuth }) {
  return (
    <div style={S.oauthRow}>
      <button type="button" style={S.oauth} onClick={() => onOAuth("google")}>{I.google(16)} Google</button>
      <button type="button" style={S.oauth} onClick={() => onOAuth("apple")}>{I.apple(14)} Apple</button>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", background: P.bg, color: P.ink, fontFamily: FONT, WebkitFontSmoothing: "antialiased" },

  // nav
  nav: { display: "flex", alignItems: "center", padding: "16px 28px", borderBottom: `1px solid ${P.rule}`, background: P.panel, gap: 24 },
  logo: { display: "inline-flex", alignItems: "flex-end", gap: 8, textDecoration: "none", color: P.ink },
  word: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1, display: "inline-flex", alignItems: "flex-end" },
  wordDot: { display: "inline-block", width: 5.5, height: 5.5, borderRadius: 3, background: P.accent, marginLeft: 3, marginBottom: 2.5 },
  navLinks: { display: "flex", gap: 20, marginLeft: 8 },
  navLink: { fontSize: 13, color: P.muted, textDecoration: "none" },
  navRight: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 },
  pillTab: { fontSize: 13, color: P.muted, padding: "8px 14px", borderRadius: 10, cursor: "pointer", background: "transparent", border: "none", fontFamily: FONT },
  pillTabOn: { background: P.soft, color: P.ink, fontWeight: 500 },
  status: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: P.muted, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, background: P.panel },
  statusDot: { width: 6, height: 6, borderRadius: 3, background: P.positive, boxShadow: "0 0 6px rgba(21,128,61,.5)" },
  navEdge: { height: 2, background: "linear-gradient(90deg,transparent,#84CC16 30%,#84CC16 70%,transparent)", opacity: .35 },

  // split
  split: { flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 0 },

  // left
  left: { position: "relative", padding: "56px 64px 40px", overflow: "hidden", background: "linear-gradient(180deg,#FBFBF8 0%,#F5F5F1 100%)", borderRight: `1px solid ${P.rule}`, display: "flex", flexDirection: "column" },
  leftBg: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(10,10,10,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(10,10,10,.04) 1px,transparent 1px)", backgroundSize: "32px 32px", maskImage: "radial-gradient(ellipse 90% 70% at 30% 40%,#000,transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 30% 40%,#000,transparent 80%)", pointerEvents: "none" },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted, fontFamily: MONO, alignSelf: "flex-start" },
  bDot: { width: 5, height: 5, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` },
  hd: { margin: "32px 0 0", fontSize: 60, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.02, maxWidth: "14ch" },
  hdEm: { fontStyle: "normal", color: P.accentText, display: "inline-flex", alignItems: "flex-end", gap: 6 },
  hdDot: { display: "inline-block", width: 14, height: 14, borderRadius: 8, background: P.accent, marginBottom: 6 },
  sub: { marginTop: 18, fontSize: 15.5, color: P.muted, lineHeight: 1.55, maxWidth: "42ch" },

  ticks: { marginTop: 36, display: "flex", flexDirection: "column", gap: 18 },
  tick: { display: "flex", gap: 14, alignItems: "flex-start" },
  tickIc: { flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: P.panel, border: `1px solid ${P.rule}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: P.ink },
  tickIcLime: { background: P.accentBg, borderColor: "#D6EAA0", color: P.accentText },
  tickT: { fontSize: 14, fontWeight: 500, color: P.ink, lineHeight: 1.3 },
  tickS: { fontSize: 12.5, color: P.muted, marginTop: 3, lineHeight: 1.4 },

  teaser: { marginTop: "auto", paddingTop: 32, display: "flex", alignItems: "center", gap: 12 },
  stack: { display: "flex" },
  av: { width: 30, height: 30, borderRadius: 999, border: "2px solid #FBFBF8", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 600, letterSpacing: "0.02em", marginLeft: -8 },
  teaserMeta: { fontSize: 13, color: P.ink },
  teaserB: { fontFamily: MONO, fontWeight: 500 },
  teaserS: { display: "block", fontSize: 11, color: P.muted, marginTop: 2 },

  // right rail
  rightRail: { padding: "32px 64px", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto" },
  formWrap: { width: "100%", maxWidth: 420, paddingTop: 28 },

  // role toggle
  roleToggle: { display: "grid", gridTemplateColumns: "1fr 1fr", background: P.soft, borderRadius: 12, padding: 4, marginBottom: 32 },
  roleBtn: { padding: "9px 14px", borderRadius: 9, border: "none", background: "transparent", fontFamily: FONT, fontSize: 13, fontWeight: 500, color: P.muted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 },
  roleBtnOn: { background: P.panel, color: P.ink, boxShadow: `0 1px 2px rgba(10,10,10,.06), 0 0 0 1px ${P.rule}` },
  roleIc: { opacity: .6, display: "inline-flex" },
  roleIcOn: { opacity: 1, color: P.accentText },

  formH: { fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 },
  formSub: { marginTop: 8, fontSize: 14, color: P.muted, lineHeight: 1.5 },
  linkInk: { color: P.ink, fontWeight: 500, textDecoration: "none", borderBottom: `1px solid ${P.ink}` },

  field: { marginTop: 18, display: "flex", flexDirection: "column", gap: 6 },
  fieldLbl: { fontSize: 12, color: P.muted, letterSpacing: "0.01em" },
  inputWrap: { position: "relative" },
  inputIc: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: P.sub, display: "inline-flex" },
  inputEl: { width: "100%", padding: "13px 14px 13px 42px", borderRadius: 12, border: `1px solid ${P.rule}`, background: P.panel, fontFamily: FONT, fontSize: 14, color: P.ink, outline: "none", transition: "border-color .15s, box-shadow .15s", boxSizing: "border-box" },
  inputFocus: { borderColor: P.ink, boxShadow: "0 0 0 4px rgba(10,10,10,.06)" },
  rightAct: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, color: P.muted, background: "transparent", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontFamily: FONT },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  strength: { marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: P.muted, fontFamily: MONO },
  bars: { display: "flex", gap: 3 },
  bar: { width: 24, height: 4, borderRadius: 2, background: P.rule },
  barOn: { background: P.accent },

  metaRow: { marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" },
  check: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: P.muted, cursor: "pointer" },
  checkBox: { width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${P.rule}`, background: P.panel, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "transparent", transition: ".12s" },
  checkBoxOn: { background: P.accent, borderColor: P.accent, color: P.ink },
  forgot: { fontSize: 12.5, color: P.ink, fontWeight: 500, textDecoration: "none" },

  cta: { marginTop: 20, width: "100%", padding: "14px 18px", borderRadius: 12, background: P.ink, color: "#fff", border: "none", fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, position: "relative", overflow: "hidden", transition: "transform .12s" },
  ctaPip: { position: "absolute", left: 14, top: "50%", width: 6, height: 6, borderRadius: 4, background: P.accent, transform: "translateY(-50%)", boxShadow: `0 0 8px ${P.accent}` },

  div: { display: "flex", alignItems: "center", gap: 12, margin: "22px 0 16px", color: P.sub, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" },
  divLine: { flex: 1, height: 1, background: P.rule },

  oauthRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  oauth: { padding: "12px 18px", borderRadius: 12, background: P.panel, border: `1px solid ${P.rule}`, color: P.ink, fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, transition: ".12s" },

  footnote: { marginTop: 24, fontSize: 12, color: P.muted, lineHeight: 1.55, textAlign: "center" },

  demosLbl: { marginTop: 32, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: P.muted, fontWeight: 500, textAlign: "center" },
  demos: { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  demo: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, background: P.panel, border: `1px solid ${P.rule}`, cursor: "pointer", textAlign: "left", fontFamily: FONT, transition: ".12s" },
  demoAv: { width: 32, height: 32, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600 },
  demoNm: { fontSize: 13, fontWeight: 500, color: P.ink, lineHeight: 1.1, display: "block" },
  demoRl: { fontSize: 11, color: P.muted, fontFamily: MONO, marginTop: 2, display: "block" },
};
