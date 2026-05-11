// JobDetails.jsx — RobosGig "Job details" page (redesigned from screenshot)
// Single self-contained JSX module. No imports beyond React.
// Default-exports <JobDetails />. Drop into any React project.
//
// What changed vs the original screenshot:
//   • Two-column layout reframed: left = job content, right = sticky action rail
//   • Hero card collapsed into a tighter header row (chips + title + meta inline)
//   • Pay block becomes a clear standalone "offer" card, not buried inside text
//   • Application status moves to a stepper (Applied → Pending → Accepted)
//   • Details grid replaces the icon-list (location/date/duration/category)
//   • Adds: map preview placeholder, tools list, similar jobs strip, save+share row
//   • Removes emoji icons; uses inline SVG matching the rest of the system

import React, { useState } from "react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A",
  muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5",
  accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F",
  soft: "#F5F5F3",
};

const W = 1240, H = 880;

// ─── Mock data (replace with your real job fetch) ───────────────────────────
const JOB = {
  id: "j-2049",
  title: "Kitchen Sink Leak Repair",
  cat: { key: "plumbing", label: "Plumbing", color: "#3B82F6" },
  urgency: "normal",
  status: "open",
  distanceKm: 0,
  postedAgo: "2d ago",
  applicants: 1,
  pay: { low: 15, high: 40, hourly: 15 },
  description: "The client has a leaking kitchen sink that needs to be inspected and repaired. The job involves identifying the source of the leak (drain, P-trap, faucet, or supply lines) and fixing or replacing the faulty components. The plumber should bring standard repair materials and ensure the area is left dry and fully functional.",
  location: { street: "Mariahilfer Str. 9", city: "1060 Vienna" },
  scheduledISO: "2026-05-10",
  scheduledLabel: "Sun, 10 May · 09:00–12:00",
  duration: "~1 hour",
  tools: ["Adjustable wrench", "Plumber's tape", "Replacement P-trap (32mm)", "Towel & bucket"],
  application: { status: "pending", offer: 12, note: "i can do this", appliedAgo: "2d ago" },
  client: { name: "xhesina veliu", initials: "XV", verified: true, jobsPosted: 4, avgRating: 4.9, color: "#7C3AED" },
};

const SIMILAR = [
  { id: "s1", title: "Fix Leaky Bathroom Faucet", pay: [40, 90], dist: 1.2, cat: "Plumbing" },
  { id: "s2", title: "Silicone Joint Renewal — Shower", pay: [60, 120], dist: 2.4, cat: "Plumbing" },
  { id: "s3", title: "Install New Dishwasher Connection", pay: [80, 140], dist: 3.1, cat: "Plumbing" },
];

// ─── Inline icons ───────────────────────────────────────────────────────────
const Ico = {
  back: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>),
  pin: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  cal: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>),
  clock: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  tag: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.5"/></svg>),
  bookmark: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>),
  share: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg>),
  flag: (s = 13) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>),
  check: (s = 11) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>),
  dot: (s = 8) => (<svg width={s} height={s} viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="currentColor"/></svg>),
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

// ─── Small pieces ───────────────────────────────────────────────────────────
function Chip({ children, dot, tone = "neutral" }) {
  const tones = {
    neutral: { bg: P.panel, fg: P.ink, br: P.rule },
    soft: { bg: P.soft, fg: P.muted, br: P.rule },
    open: { bg: "#ECFDF5", fg: "#047857", br: "#A7F3D0" },
    lime: { bg: "#F0FAE0", fg: P.accentText, br: "#D9F0A3" },
  }[tone] || {};
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px", borderRadius: 999, border: `1px solid ${tones.br}`,
      background: tones.bg, color: tones.fg, fontSize: 11.5, fontWeight: 500,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 3, background: dot }}/>}
      {children}
    </span>
  );
}

function Section({ eyebrow, title, action, children }) {
  return (
    <section style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "20px 22px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>{eyebrow}</div>
          {title && <div style={{ fontSize: 16, fontWeight: 500, color: P.ink, marginTop: 4, letterSpacing: "-.01em" }}>{title}</div>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function DetailRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "12px 0", borderTop: `1px solid ${P.rule}`, alignItems: "center" }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: P.soft, color: P.muted, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 12.5, color: P.muted }}>{label}</span>
      <span style={{ fontSize: 13, color: P.ink, fontFamily: mono ? MONO : FONT, fontWeight: 500, fontVariantNumeric: mono ? "tabular-nums" : "normal" }}>{value}</span>
    </div>
  );
}

function Stepper({ status }) {
  const steps = [
    { id: "applied", label: "Applied" },
    { id: "pending", label: "Pending review" },
    { id: "accepted", label: "Accepted" },
  ];
  const idx = steps.findIndex((s) => s.id === status);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
      {steps.map((s, i) => {
        const done = i < idx, cur = i === idx;
        const bg = done ? P.accent : cur ? P.ink : P.soft;
        const fg = done ? P.accentInk : cur ? "#fff" : P.muted;
        return (
          <React.Fragment key={s.id}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, background: bg, color: fg, fontSize: 11, fontWeight: 500 }}>
              <span style={{ width: 14, height: 14, borderRadius: 999, background: cur ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.06)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {done ? Ico.check(9) : <span style={{ fontSize: 9, fontFamily: MONO }}>{i + 1}</span>}
              </span>
              {s.label}
            </span>
            {i < steps.length - 1 && <span style={{ flex: 1, height: 1, background: P.rule }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function JobDetails({ job = JOB }) {
  const [saved, setSaved] = useState(false);
  const hasApplied = !!job.application;

  return (
    <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top nav */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0, background: P.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RobosLogo accent={P.ink} size={24}/>
          <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
          <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Browse jobs<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
          <span style={{ color: P.muted }}>Saved</span>
          <span style={{ color: P.muted }}>Applications</span>
          <span style={{ color: P.muted }}>Profile</span>
          <span style={{ color: P.muted }}>Pricing</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>Online · Vienna
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
        </div>
      </div>

      {/* Breadcrumb / back */}
      <div style={{ padding: "12px 32px", borderBottom: `1px solid ${P.rule}`, display: "flex", alignItems: "center", gap: 10, background: P.panel, flexShrink: 0 }}>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: P.ink, fontFamily: FONT, cursor: "pointer" }}>
          {Ico.back()} Back
        </button>
        <span style={{ fontSize: 12, color: P.sub, fontFamily: MONO }}>browse / plumbing / {job.id}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={() => setSaved(!saved)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: `1px solid ${P.rule}`, background: saved ? P.ink : P.panel, color: saved ? "#fff" : P.ink, fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>
            {Ico.bookmark()} {saved ? "Saved" : "Save"}
          </button>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: P.ink, fontFamily: FONT, cursor: "pointer" }}>{Ico.share()} Share</button>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: P.muted, fontFamily: FONT, cursor: "pointer" }}>{Ico.flag()} Report</button>
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 32px", display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 24, alignItems: "start" }}>

          {/* ── Left column ───────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Hero header — compact, no big card */}
            <div style={{ padding: "4px 4px 0" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <Chip dot={job.cat.color}>{job.cat.label}</Chip>
                <Chip tone="soft">{job.urgency}</Chip>
                <Chip tone="open"><span style={{ color: "#10B981" }}>{Ico.dot(8)}</span> {job.status}</Chip>
                <Chip>{Ico.pin(11)} {job.distanceKm} km away</Chip>
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-.025em", lineHeight: 1.08, margin: 0, color: P.ink }}>{job.title}</h1>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: P.muted }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: job.client.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 600 }}>{job.client.initials}</span>
                <span>Posted by <span style={{ color: P.ink, fontWeight: 500 }}>{job.client.name}</span></span>
                {job.client.verified && <Chip tone="lime">{Ico.check(9)} Verified</Chip>}
                <span>·</span><span>{job.postedAgo}</span>
                <span>·</span><span>{job.applicants} applicant{job.applicants === 1 ? "" : "s"}</span>
              </div>
            </div>

            {/* Description */}
            <Section eyebrow="Description">
              <p style={{ margin: 0, fontSize: 14, color: P.ink, lineHeight: 1.65, letterSpacing: "-.003em" }}>{job.description}</p>
            </Section>

            {/* Details + Map row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
              <Section eyebrow="Details">
                <DetailRow icon={Ico.pin()} label="Location" value={<span style={{ display: "block", textAlign: "right" }}><span style={{ display: "block" }}>{job.location.street}</span><span style={{ fontSize: 11.5, color: P.muted, fontWeight: 400 }}>{job.location.city}</span></span>}/>
                <DetailRow icon={Ico.cal()} label="Scheduled" value={job.scheduledLabel}/>
                <DetailRow icon={Ico.clock()} label="Duration" value={job.duration}/>
                <DetailRow icon={Ico.tag()} label="Category" value={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: job.cat.color }}/>{job.cat.label}</span>}/>
              </Section>

              <Section eyebrow="Location preview">
                <div style={{ height: 196, borderRadius: 10, background: `repeating-linear-gradient(45deg, ${P.soft} 0 8px, ${P.bg} 8px 16px)`, border: `1px solid ${P.rule}`, position: "relative", overflow: "hidden" }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                    <path d="M0 130 Q 80 100 150 120 T 300 90" stroke={P.rule} strokeWidth="1" fill="none"/>
                    <path d="M0 70 Q 100 90 200 60 T 300 80" stroke={P.rule} strokeWidth="1" fill="none"/>
                    <path d="M40 0 L 40 200 M 220 0 L 220 200" stroke={P.rule} strokeWidth="1"/>
                  </svg>
                  <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -100%)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50% 50% 50% 0", background: P.ink, transform: "rotate(-45deg)", border: `3px solid ${P.accent}` }}/>
                  </div>
                  <span style={{ position: "absolute", left: 10, bottom: 10, fontSize: 10.5, fontFamily: MONO, color: P.sub, background: "rgba(255,255,255,.9)", padding: "3px 6px", borderRadius: 4 }}>48.198° N · 16.354° E</span>
                </div>
                <button style={{ marginTop: 10, width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: P.ink, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Open in Maps →</button>
              </Section>
            </div>

            {/* Tools */}
            <Section eyebrow="Tools & equipment needed" title={`${job.tools.length} items the worker should bring`}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {job.tools.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${P.rule}`, borderRadius: 10, background: P.bg }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: "#F0FAE0", color: P.accentText, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{Ico.check(11)}</span>
                    <span style={{ fontSize: 13, color: P.ink }}>{t}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Similar jobs */}
            <Section eyebrow="Similar jobs nearby" action={<span style={{ fontSize: 12, color: P.muted, cursor: "pointer" }}>See all →</span>}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {SIMILAR.map((s) => (
                  <div key={s.id} style={{ padding: "12px 14px", border: `1px solid ${P.rule}`, borderRadius: 10, background: P.bg, cursor: "pointer" }}>
                    <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>{s.cat}</div>
                    <div style={{ fontSize: 13, color: P.ink, fontWeight: 500, marginTop: 4, lineHeight: 1.3 }}>{s.title}</div>
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 11.5, fontFamily: MONO, color: P.muted }}>
                      <span style={{ color: P.ink }}>€{s.pay[0]}–{s.pay[1]}</span>
                      <span>{s.dist} km</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* ── Right rail ────────────────────────────────────────── */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 0 }}>
            {/* Pay card */}
            <div style={{ background: P.ink, color: "#fff", borderRadius: 16, padding: "22px 22px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 100% 0%, ${P.accent}33, transparent 55%)`, pointerEvents: "none" }}/>
              <div style={{ fontSize: 10.5, color: "#A3A3A3", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500, position: "relative" }}>Client's offer</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6, position: "relative", fontVariantNumeric: "tabular-nums" }}>
                <span style={{ fontSize: 42, fontWeight: 500, letterSpacing: "-.035em", lineHeight: 1 }}>€{job.pay.low}–{job.pay.high}</span>
              </div>
              <div style={{ fontSize: 12, color: "#A3A3A3", marginTop: 6, position: "relative" }}>Est. <span style={{ color: P.accent, fontFamily: MONO }}>€{job.pay.hourly}/hr</span> · fixed price · paid via escrow</div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #262626", display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#A3A3A3", position: "relative", fontFamily: MONO }}>
                <span>fee 12% (Pro)</span><span style={{ color: "#fff" }}>you keep €{Math.round(job.pay.low * 0.88)}–{Math.round(job.pay.high * 0.88)}</span>
              </div>
            </div>

            {/* Application status / Apply */}
            {hasApplied ? (
              <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>Your application</div>
                <Stepper status={job.application.status}/>
                <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: P.soft, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
                  <span style={{ color: P.muted }}>Offered price</span>
                  <span style={{ color: P.ink, fontWeight: 500, fontFamily: MONO }}>€{job.application.offer}</span>
                </div>
                <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: P.bg, border: `1px solid ${P.rule}`, fontSize: 13, color: P.ink, fontStyle: "italic", lineHeight: 1.4 }}>"{job.application.note}"</div>
                <div style={{ marginTop: 8, fontSize: 11, color: P.sub, fontFamily: MONO }}>Applied {job.application.appliedAgo}</div>
                <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 13, color: P.ink, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Edit offer</button>
                  <button style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 13, color: "#DC2626", fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Withdraw</button>
                </div>
              </div>
            ) : (
              <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>Apply</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: P.ink, marginTop: 4, letterSpacing: "-.01em" }}>Send your offer</div>
                <label style={{ display: "block", marginTop: 14, fontSize: 11, color: P.muted, letterSpacing: ".08em", textTransform: "uppercase" }}>Your price (€)</label>
                <input defaultValue="" placeholder={`Suggested ${job.pay.low}–${job.pay.high}`} style={{ marginTop: 6, width: "100%", padding: "10px 12px", border: `1px solid ${P.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 14, color: P.ink, boxSizing: "border-box" }}/>
                <label style={{ display: "block", marginTop: 12, fontSize: 11, color: P.muted, letterSpacing: ".08em", textTransform: "uppercase" }}>Quick note</label>
                <textarea rows={3} placeholder="Tell the client why you're a good fit…" style={{ marginTop: 6, width: "100%", padding: "10px 12px", border: `1px solid ${P.rule}`, borderRadius: 10, fontFamily: FONT, fontSize: 13, color: P.ink, boxSizing: "border-box", resize: "none" }}/>
                <button style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 10, border: "none", background: P.accent, color: P.accentInk, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>Send application →</button>
              </div>
            )}

            {/* About the client */}
            <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>About the client</div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: job.client.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>{job.client.initials}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: P.ink, fontWeight: 500 }}>{job.client.name}</div>
                  {job.client.verified && <div style={{ marginTop: 2, fontSize: 11.5, color: P.accentText, display: "inline-flex", alignItems: "center", gap: 4 }}>{Ico.check(10)} Identity verified</div>}
                </div>
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: P.soft }}>
                  <div style={{ fontSize: 10, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>Jobs posted</div>
                  <div style={{ fontSize: 16, color: P.ink, fontWeight: 500, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{job.client.jobsPosted}</div>
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 10, background: P.soft }}>
                  <div style={{ fontSize: 10, color: P.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>Avg rating</div>
                  <div style={{ fontSize: 16, color: P.ink, fontWeight: 500, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>★ {job.client.avgRating}</div>
                </div>
              </div>
              <button style={{ marginTop: 12, width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12.5, color: P.ink, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>View profile</button>
            </div>
          </aside>
        </div>
      </div>

      {/* Status footer */}
      <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
        <span>job · {job.id}</span><span>·</span>
        <span>{job.cat.label.toLowerCase()}</span><span>·</span>
        <span>{job.status}</span>
        <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
      </div>
    </div>
  );
}
