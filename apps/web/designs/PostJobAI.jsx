// PostJobAI.jsx — RobosGig "Post a job (AI)" page
// Single self-contained JSX module. Default-exports <PostJobAI />.
// Integrated into the standard client app shell (top nav + status footer).
//
// Mode: AI describe → generate → review draft. Manual form is a toggle (out of scope here).

import React, { useMemo, useState } from "react";

// ─── Tokens ─────────────────────────────────────────────────────────────────
const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A", muted: "#737373", sub: "#A3A3A3",
  rule: "#E8E8E5", soft: "#F5F5F3",
  accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F", accentSoft: "#F0FAE0",
  ai: "#5A56E0", aiSoft: "#EEF0FF", aiText: "#3F3BC4",
};
const W = 1240, H = 880;

// ─── Mock prompt chips ──────────────────────────────────────────────────────
const TRY_CHIPS = [
  "Leaky kitchen sink",
  "Move a sofa to another room",
  "Walk my dog this afternoon",
  "Light switch stopped working",
];

const URGENCY = [
  { id: "flex",  label: "Flexible", ti: "this week" },
  { id: "soon",  label: "Soon",     ti: "1–2 days"  },
  { id: "asap",  label: "ASAP",     ti: "today"     },
];

// ─── Inline icons ───────────────────────────────────────────────────────────
const Ico = {
  spark: (s = 12) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/></svg>),
  pin: (s = 16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  image: (s = 16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 17-5-5-8 8"/></svg>),
  arrow: (s = 11) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
  lock: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>),
  shield: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/></svg>),
};

const RobosLogo = ({ accent = "#0A0A0A", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="9" width="24" height="17" rx="6" fill={accent}/>
    <rect x="14.5" y="3.5" width="3" height="6" rx="1.5" fill={accent}/>
    <circle cx="16" cy="3.5" r="1.4" fill={accent}/>
    <circle cx="11.5" cy="17" r="2.4" fill="#fff"/>
    <circle cx="20.5" cy="17" r="2.4" fill="#fff"/>
  </svg>
);

// ─── Reusable bits ──────────────────────────────────────────────────────────
function Chip({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 12px", borderRadius: 999, border: `1px solid ${P.rule}`,
      background: P.panel, fontSize: 12, color: P.ink, cursor: "pointer",
      fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6,
    }}>
      <span style={{ color: P.muted, display: "inline-flex" }}>{Ico.arrow(11)}</span>
      {children}
    </button>
  );
}

function RailCard({ heading, children }) {
  return (
    <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "18px 18px" }}>
      <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>{heading}</div>
      {children}
    </div>
  );
}

function Step({ n, label, det, state }) {
  // state: "active" | "done" | "muted"
  const n_bg = state === "done" ? P.accent : state === "active" ? P.ink : P.soft;
  const n_fg = state === "done" ? P.accentInk : state === "active" ? "#fff" : P.muted;
  const lab_color = state === "muted" ? P.muted : P.ink;
  const lab_weight = state === "muted" ? 400 : 500;
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 0" }}>
      <span style={{ width: 22, height: 22, borderRadius: 999, background: n_bg, color: n_fg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: MONO, fontWeight: 500, flexShrink: 0 }}>{n}</span>
      <div>
        <div style={{ fontSize: 13, color: lab_color, fontWeight: lab_weight }}>{label}</div>
        <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2, lineHeight: 1.45 }}>{det}</div>
      </div>
    </div>
  );
}

function KV({ k, v, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: accent ? P.accentSoft : P.soft, borderRadius: 10 }}>
      <span style={{ fontSize: 11, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>{k}</span>
      <span style={{ fontSize: accent ? 15 : 13, color: accent ? P.accentText : P.ink, fontWeight: 500, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function PostJobAI() {
  const [mode, setMode] = useState("ai");          // "ai" | "manual"
  const [task, setTask] = useState("");
  const [urgency, setUrgency] = useState("soon");
  const [location, setLocation] = useState("");
  const [generated, setGenerated] = useState(false);
  const charCount = task.length;

  const draft = useMemo(() => ({
    title: "Fix leaking kitchen sink — cracked drain pipe",
    desc: "Single-bowl kitchen sink leaks from the trap area; water visible under the cabinet. Likely cracked P-trap or loose slip-joint. Worker should bring basic plumbing tools and a replacement trap (1¼\"). Access is unobstructed, water shutoff is under the sink.",
  }), []);

  return (
    <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Top nav ─────────────────────────────────────────────── */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, background: P.panel, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RobosLogo accent={P.ink} size={24}/>
          <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
          <span style={{ marginLeft: 6, padding: "2px 7px", borderRadius: 4, background: P.soft, fontSize: 10.5, color: P.muted, fontFamily: MONO, letterSpacing: ".06em" }}>CLIENT</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
          <span style={{ color: P.muted }}>Dashboard</span>
          <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Post a job<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
          <span style={{ color: P.muted }}>My jobs</span>
          <span style={{ color: P.muted }}>Spending</span>
          <span style={{ color: P.muted }}>Messages</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>Vienna · EUR
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#5A56E0", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>AG</div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Page header */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 16px", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Post a job</div>
              <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: 0, lineHeight: 1.1 }}>Tell us what you need — we'll write the post.</h1>
              <div style={{ fontSize: 13.5, color: P.muted, marginTop: 6, maxWidth: 620, lineHeight: 1.55 }}>
                Describe the problem in plain language. Our AI drafts the listing, suggests a fair price band, and matches workers near you. You stay in control — review, edit, then publish.
              </div>
            </div>
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel }}>
              {[{ id: "ai", label: "AI mode", dot: P.accent }, { id: "manual", label: "Manual form" }].map((m) => {
                const on = mode === m.id;
                return (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{
                    padding: "7px 14px", borderRadius: 999, border: "none",
                    background: on ? P.ink : "transparent",
                    color: on ? "#fff" : P.muted, fontFamily: FONT, fontSize: 12,
                    fontWeight: on ? 500 : 400, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                    {m.dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: on ? P.accent : P.ai }}/>}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 32px 40px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          {/* Main column */}
          <div>
            {/* Composer */}
            <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Composer head */}
              <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${P.rule}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: MONO, fontWeight: 500 }}>1</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: P.ink }}>Describe your task</span>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: P.aiSoft, color: P.aiText, fontSize: 11, fontWeight: 600 }}>
                  {Ico.spark(12)}AI-powered
                </span>
              </div>

              {/* Composer body */}
              <div style={{ padding: "22px 22px 6px" }}>
                <label style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8, display: "block" }}>What's going on?</label>
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value.slice(0, 600))}
                  placeholder="e.g. My kitchen sink is leaking and there's water under the cabinet. The pipe seems cracked and I need a plumber to fix it asap…"
                  style={{
                    width: "100%", minHeight: 160, padding: "16px 18px",
                    border: `1.5px solid ${P.ink}`, borderRadius: 12,
                    fontFamily: FONT, fontSize: 15, color: P.ink, lineHeight: 1.55,
                    resize: "vertical", outline: "none", background: P.panel, boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11.5, color: P.muted }}>
                  <span style={{ color: P.ink }}>More detail = better price + closer matches.</span>
                  <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>{charCount} / 600</span>
                </div>

                {/* Try chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, color: P.muted, marginRight: 2 }}>Try:</span>
                  {TRY_CHIPS.map((c) => <Chip key={c} onClick={() => setTask(c)}>{c}</Chip>)}
                </div>

                {/* Meta row */}
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 10, marginTop: 18 }}>
                  {/* Location */}
                  <div style={{ border: `1px solid ${P.rule}`, borderRadius: 10, padding: "10px 12px", background: P.panel, display: "flex", alignItems: "center", gap: 10, minHeight: 42 }}>
                    <span style={{ color: P.muted, display: "inline-flex" }}>{Ico.pin(16)}</span>
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or postcode…" style={{ border: "none", outline: "none", background: "transparent", fontFamily: FONT, fontSize: 13, color: P.ink, flex: 1 }}/>
                    <button style={{ border: "none", background: "transparent", color: P.muted, fontFamily: FONT, fontSize: 12, padding: "2px 6px", borderRadius: 6, cursor: "pointer" }}>Use current</button>
                  </div>
                  {/* Photos */}
                  <div style={{ border: `1px solid ${P.rule}`, borderRadius: 10, padding: "10px 12px", background: P.panel, display: "flex", alignItems: "center", gap: 10, minHeight: 42, cursor: "pointer" }}>
                    <span style={{ color: P.muted, display: "inline-flex" }}>{Ico.image(16)}</span>
                    <span style={{ fontSize: 13, color: P.sub, flex: 1 }}>Add photos (optional)</span>
                    <span style={{ fontSize: 11, color: P.sub, fontFamily: MONO }}>0/4</span>
                  </div>
                  {/* Urgency segmented */}
                  <div style={{ display: "flex", gap: 6, border: `1px solid ${P.rule}`, borderRadius: 10, padding: 4, background: P.panel }}>
                    {URGENCY.map((u) => {
                      const on = urgency === u.id;
                      return (
                        <button key={u.id} onClick={() => setUrgency(u.id)} style={{
                          flex: 1, padding: "8px 4px", borderRadius: 7, border: "none",
                          background: on ? P.ink : "transparent", color: on ? "#fff" : P.muted,
                          fontFamily: FONT, fontSize: 12, cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        }}>
                          <span>{u.label}</span>
                          <span style={{ fontSize: 10, color: on ? "#A3A3A3" : P.sub, fontFamily: MONO }}>{u.ti}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Composer footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderTop: `1px solid ${P.rule}`, marginTop: 22, background: "#FCFCFA" }}>
                <span style={{ fontSize: 11.5, color: P.muted, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {Ico.lock(13)} Nothing is published yet — you'll review the draft first.
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${P.rule}`, background: P.panel, fontFamily: FONT, fontSize: 12.5, color: P.ink, cursor: "pointer" }}>Save draft</button>
                  <button onClick={() => task.trim() && setGenerated(true)} style={{
                    padding: "11px 18px", borderRadius: 10, border: "none",
                    background: task.trim() ? P.ink : P.soft,
                    color: task.trim() ? "#fff" : P.muted,
                    fontFamily: FONT, fontSize: 13, fontWeight: 500,
                    cursor: task.trim() ? "pointer" : "not-allowed",
                    display: "inline-flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: P.accent, display: "inline-flex" }}>{Ico.spark(14)}</span>
                    Generate listing
                  </button>
                </div>
              </div>
            </div>

            {/* AI draft preview */}
            <div style={{ marginTop: 20, background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, overflow: "hidden", opacity: generated ? 1 : 0.65 }}>
              <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${P.rule}`, background: "#FCFCFA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 999, background: "radial-gradient(circle at 30% 30%, #8B86FF, #5A56E0 60%, #3A36B8)", boxShadow: "0 0 0 4px rgba(90,86,224,.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    {Ico.spark(18)}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>AI draft preview</h3>
                    <div style={{ fontSize: 11, color: P.muted, marginTop: 2, fontFamily: MONO }}>{generated ? "edit before publish" : "appears after generate"}</div>
                  </div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: P.aiSoft, color: P.aiText, fontSize: 11, fontWeight: 600 }}>
                  {generated ? "DRAFT · STEP 2" : "PLACEHOLDER"}
                </span>
              </div>
              <div style={{ padding: "20px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Suggested title</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: P.ink, letterSpacing: "-.015em", marginBottom: 8 }}>{draft.title}</div>
                  <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginTop: 14, marginBottom: 8 }}>Auto-written description</div>
                  <div style={{ fontSize: 13, color: "#404040", lineHeight: 1.6 }}>{draft.desc}</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: P.aiText, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>✎ Edit draft</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>AI suggestions</div>
                  <KV k="Category"          v={<span style={{ fontFamily: FONT }}>Plumbing · Repair</span>}/>
                  <KV k="Time estimate"     v="45–75 min"/>
                  <KV k="Fair price band"   v="€55 – €95" accent/>
                  <KV k="Matches near you"  v="12 workers · 0.4 km avg"/>
                  <KV k="Likely accept"     v="~ 18 min"/>
                </div>
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <RailCard heading="How it works">
              <Step n="1" state="active" label="Describe the task" det="Plain language is fine — typos, fragments, voice notes. The more you give us, the tighter the price band."/>
              <Step n="2" state="muted"  label="Review the AI draft" det="Edit the title, description, category, and price band before anything goes live."/>
              <Step n="3" state="muted"  label="Choose a worker" det="Top matches arrive within minutes. Chat, accept, and payment holds in escrow until the job is done."/>
            </RailCard>

            <RailCard heading="Tips for a better draft">
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {[
                  "Include rough size or count (e.g. \"3 m² of tile\", \"12 frames\")",
                  "Mention access — stairs, parking, pets, lift",
                  "If you have a deadline, say when (\"before Friday 6pm\")",
                  "Add a photo if it's something visible (leak, broken item, layout)",
                ].map((t, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: "#404040", lineHeight: 1.5, marginBottom: 8, paddingLeft: 18, position: "relative" }}>
                    <span style={{ position: "absolute", left: 4, top: 8, width: 4, height: 4, borderRadius: 2, background: P.accent }}/>
                    {t}
                  </li>
                ))}
              </ul>
            </RailCard>

            <RailCard heading="Privacy">
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: P.soft, borderRadius: 10, padding: 12 }}>
                <span style={{ color: P.muted, flexShrink: 0, marginTop: 1, display: "inline-flex" }}>{Ico.shield(18)}</span>
                <div>
                  <div style={{ fontSize: 12, color: P.ink, fontWeight: 500 }}>Your address stays hidden</div>
                  <div style={{ fontSize: 11.5, color: P.muted, marginTop: 3, lineHeight: 1.45 }}>Workers only see the neighbourhood until you accept their offer. We don't train on your messages.</div>
                </div>
              </div>
            </RailCard>
          </div>
        </div>
      </div>

      {/* Status footer */}
      <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
        <span>post a job · AI mode</span><span>·</span>
        <span>{charCount} / 600 chars</span><span>·</span>
        <span>{generated ? "draft ready" : "nothing published yet"}</span>
        <span style={{ marginLeft: "auto" }}>RobosGig · Client · v2.4</span>
      </div>
    </div>
  );
}
