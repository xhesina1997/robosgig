// Security.jsx — RobosGig "Account · Security" page
// Single self-contained JSX module. No imports beyond React.
// Default-exports <Security />.
//
// Covers three sections requested:
//   • Payment methods (cards + payout bank + add new)
//   • Report a problem (issue type → details → submit)
//   • Delete account (danger zone with confirm dialog)
// Plus a left rail with account-section nav so it fits naturally inside
// a wider settings/account area.

import React, { useState } from "react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A",
  muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5",
  accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F",
  soft: "#F5F5F3",
  danger: "#DC2626", dangerBg: "#FEF2F2", dangerBr: "#FECACA",
};

const W = 1240, H = 880;

// ─── Mock data ──────────────────────────────────────────────────────────────
const INITIAL_CARDS = [
  { id: "c1", brand: "Visa",       last4: "4242", exp: "08/27", primary: true,  type: "card",   added: "Mar 2025" },
  { id: "c2", brand: "Mastercard", last4: "5599", exp: "11/26", primary: false, type: "card",   added: "Aug 2024" },
];
const PAYOUT = { bank: "Erste Bank Austria", iban: "AT•• •••• •••• 8821", verified: true };

const ISSUE_TYPES = [
  { id: "payment",  label: "Payment or payout",      desc: "Missing money, failed payout, refund request." },
  { id: "client",   label: "Issue with a client",    desc: "Cancellation, no-show, dispute, harassment." },
  { id: "bug",      label: "Bug or app problem",     desc: "Something looks broken or doesn't work." },
  { id: "account",  label: "Account or login",       desc: "Can't sign in, 2FA, verification stuck." },
  { id: "other",    label: "Something else",         desc: "I'll describe it in detail." },
];

// ─── Inline icons ───────────────────────────────────────────────────────────
const Ico = {
  shield: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/></svg>),
  card: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>),
  bank: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10 12 4l9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18"/></svg>),
  warn: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>),
  trash: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>),
  bell: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 17V11a6 6 0 1 1 12 0v6l2 2H4l2-2zM10 21h4"/></svg>),
  key: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>),
  device: (s = 14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>),
  check: (s = 11) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>),
  plus: (s = 12) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>),
  arrow: (s = 12) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
};

const RobosLogo = ({ accent = "#0A0A0A", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="3.5" y="9.5" width="25" height="16.5" rx="5" fill={accent}/>
    <rect x="14.5" y="4" width="3" height="5" rx="1.5" fill={accent}/>
    <circle cx="16" cy="3.4" r="1.6" fill="#84CC16"/>
    <rect x="9" y="14.5" width="5" height="5" rx="2.5" fill="#84CC16"/>
    <rect x="18" y="14.5" width="5" height="5" rx="2.5" fill="#84CC16"/>
    <rect x="12.5" y="23" width="7" height="1.6" rx=".8" fill="#84CC16" opacity=".9"/>
  </svg>
);

// Card brand glyphs (just colored pills, no real brand SVG — swap for real assets later)
function BrandMark({ brand }) {
  const bg = brand === "Visa" ? "#1A1F71" : brand === "Mastercard" ? "#EB001B" : P.ink;
  return (
    <span style={{ width: 44, height: 30, borderRadius: 6, background: bg, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, letterSpacing: ".02em", fontFamily: MONO }}>{brand === "Mastercard" ? "MC" : brand.slice(0, 4).toUpperCase()}</span>
  );
}

// ─── Section primitives ─────────────────────────────────────────────────────
function Section({ icon, eyebrow, title, subtitle, children, danger }) {
  return (
    <section style={{
      background: P.panel,
      border: `1px solid ${danger ? P.dangerBr : P.rule}`,
      borderRadius: 14,
      overflow: "hidden",
    }}>
      <header style={{ padding: "20px 24px 16px", display: "flex", gap: 14, alignItems: "flex-start", borderBottom: `1px solid ${danger ? P.dangerBr : P.rule}`, background: danger ? P.dangerBg : "transparent" }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, background: danger ? "#fff" : P.soft, color: danger ? P.danger : P.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: danger ? P.danger : P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>{eyebrow}</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: danger ? P.danger : P.ink, marginTop: 4, letterSpacing: "-.015em" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: P.muted, marginTop: 6, lineHeight: 1.5, maxWidth: 560 }}>{subtitle}</div>}
        </div>
      </header>
      <div style={{ padding: "18px 24px 22px" }}>{children}</div>
    </section>
  );
}

function NavItem({ icon, label, active, danger }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
      background: active ? P.soft : "transparent",
      color: danger ? P.danger : (active ? P.ink : P.muted),
      fontSize: 13, cursor: "pointer", fontWeight: active ? 500 : 400,
    }}>
      <span style={{ width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      {label}
      {active && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: 2, background: P.accent }}/>}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Security() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [issueType, setIssueType] = useState("payment");
  const [issueBody, setIssueBody] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const canDelete = deleteText === "DELETE";

  const makePrimary = (id) => setCards(cards.map((c) => ({ ...c, primary: c.id === id })));
  const removeCard  = (id) => setCards(cards.filter((c) => c.id !== id));

  return (
    <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top nav */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0, background: P.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RobosLogo accent={P.ink} size={24}/>
          <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
          <span style={{ color: P.muted }}>Browse jobs</span>
          <span style={{ color: P.muted }}>Saved</span>
          <span style={{ color: P.muted }}>Applications</span>
          <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Profile<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
          <span style={{ color: P.muted }}>Pricing</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>Online · Vienna
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 32px 32px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>

          {/* Left rail */}
          <aside style={{ position: "sticky", top: 0, alignSelf: "start" }}>
            <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500, padding: "4px 12px 10px" }}>Account</div>
            <NavItem icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 5-6 8-6s7 2 8 6"/></svg>} label="Profile"/>
            <NavItem icon={Ico.shield(16)} label="Security" active/>
            <NavItem icon={Ico.bell(16)} label="Notifications"/>
            <NavItem icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a14 14 0 0 1 0 20M12 2a14 14 0 0 0 0 20"/></svg>} label="Language & region"/>

            {/* In-page anchors */}
            <div style={{ marginTop: 18, fontSize: 10.5, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500, padding: "4px 12px 10px" }}>Security</div>
            <NavItem icon={Ico.card(16)} label="Payment methods"/>
            <NavItem icon={Ico.key(16)} label="Password"/>
            <NavItem icon={Ico.device(16)} label="Devices & sessions"/>
            <NavItem icon={Ico.warn(16)} label="Report a problem"/>
            <NavItem icon={Ico.trash(16)} label="Delete account" danger/>
          </aside>

          {/* Main column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Page header */}
            <div>
              <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>Profile · Security</div>
              <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: "6px 0 8px", lineHeight: 1.1 }}>Security & account</h1>
              <p style={{ fontSize: 14, color: P.muted, margin: 0, lineHeight: 1.55, maxWidth: 620 }}>Manage how you get paid, report a problem to support, or close your account permanently.</p>
            </div>

            {/* ── PAYMENT METHODS ──────────────────────────────────── */}
            <Section
              icon={Ico.card(16)}
              eyebrow="Payment methods"
              title="Cards & payout"
              subtitle="Cards are used for upgrades and platform fees. Payouts go directly to your verified bank account."
            >
              {/* Card list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cards.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1px solid ${P.rule}`, borderRadius: 12, background: P.panel }}>
                    <BrandMark brand={c.brand}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: P.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                        {c.brand} ending in <span style={{ fontFamily: MONO }}>•• {c.last4}</span>
                        {c.primary && <span style={{ padding: "2px 8px", borderRadius: 999, background: "#F0FAE0", color: P.accentText, fontSize: 10.5, fontWeight: 600, letterSpacing: ".05em", fontFamily: MONO }}>PRIMARY</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: P.muted, marginTop: 3, fontFamily: MONO }}>Expires {c.exp} · added {c.added}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {!c.primary && (
                        <button onClick={() => makePrimary(c.id)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: P.ink, cursor: "pointer", fontFamily: FONT, fontWeight: 500 }}>Make primary</button>
                      )}
                      <button onClick={() => removeCard(c.id)} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: c.primary ? P.sub : P.danger, cursor: c.primary ? "not-allowed" : "pointer", fontFamily: FONT, fontWeight: 500 }} disabled={c.primary}>Remove</button>
                    </div>
                  </div>
                ))}

                {/* Add card CTA */}
                <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", border: `1px dashed ${P.rule}`, borderRadius: 12, background: P.bg, fontSize: 13, color: P.ink, cursor: "pointer", fontFamily: FONT, fontWeight: 500, justifyContent: "center" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{Ico.plus(12)}</span>
                  Add new payment method
                </button>
              </div>

              {/* Payout bank */}
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${P.rule}` }}>
                <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 10 }}>Payout account</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1px solid ${P.rule}`, borderRadius: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: P.soft, color: P.muted, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{Ico.bank(18)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: P.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      {PAYOUT.bank}
                      {PAYOUT.verified && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "#F0FAE0", color: P.accentText, fontSize: 10.5, fontWeight: 600, fontFamily: MONO }}>{Ico.check(9)} VERIFIED</span>}
                    </div>
                    <div style={{ fontSize: 12, color: P.muted, marginTop: 3, fontFamily: MONO }}>{PAYOUT.iban}</div>
                  </div>
                  <button style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: P.ink, cursor: "pointer", fontFamily: FONT, fontWeight: 500 }}>Change bank</button>
                </div>
              </div>
            </Section>

            {/* ── REPORT A PROBLEM ─────────────────────────────────── */}
            <Section
              icon={Ico.warn(16)}
              eyebrow="Support"
              title="Report a problem"
              subtitle="Tell us what's going wrong and we'll get back to you within one business day. Most issues are resolved in under 24 hours."
            >
              {issueSent ? (
                <div style={{ padding: "18px 18px", border: `1px solid ${P.rule}`, borderRadius: 12, background: "#F0FAE0", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ width: 28, height: 28, borderRadius: 999, background: P.accent, color: P.accentInk, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{Ico.check(14)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: P.ink }}>Report sent · ticket #RG-{Math.floor(10000 + Math.random() * 89999)}</div>
                    <div style={{ fontSize: 12.5, color: P.muted, marginTop: 2 }}>We'll email you at the address on file. Reply to that thread to add more detail.</div>
                  </div>
                  <button onClick={() => { setIssueSent(false); setIssueBody(""); }} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12, color: P.ink, cursor: "pointer", fontFamily: FONT, fontWeight: 500 }}>Report another</button>
                </div>
              ) : (
                <div>
                  {/* Issue type chooser */}
                  <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 10 }}>What's the issue?</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {ISSUE_TYPES.map((t) => {
                      const sel = issueType === t.id;
                      return (
                        <div key={t.id} onClick={() => setIssueType(t.id)} style={{
                          padding: "12px 14px", border: `1px solid ${sel ? P.ink : P.rule}`, borderRadius: 10,
                          background: sel ? P.soft : P.panel, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start",
                        }}>
                          <span style={{ width: 14, height: 14, borderRadius: 999, border: `1.5px solid ${sel ? P.ink : P.rule}`, marginTop: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {sel && <span style={{ width: 6, height: 6, borderRadius: 3, background: P.ink }}/>}
                          </span>
                          <div>
                            <div style={{ fontSize: 13, color: P.ink, fontWeight: 500 }}>{t.label}</div>
                            <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2, lineHeight: 1.4 }}>{t.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Details textarea */}
                  <div style={{ marginTop: 14 }}>
                    <label style={{ display: "block", fontSize: 11, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Describe the problem</label>
                    <textarea
                      value={issueBody}
                      onChange={(e) => setIssueBody(e.target.value)}
                      rows={5}
                      placeholder="What happened? Include any job IDs, transaction IDs, or screenshots you can share."
                      style={{ width: "100%", padding: "12px 14px", border: `1px solid ${P.rule}`, borderRadius: 10, fontFamily: FONT, fontSize: 13.5, color: P.ink, boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Attach + send row */}
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <button style={{ padding: "9px 14px", borderRadius: 10, border: `1px dashed ${P.rule}`, background: P.bg, fontSize: 12.5, color: P.muted, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12l-9 9a5 5 0 0 1-7-7l10-10a3.5 3.5 0 0 1 5 5L9 19a2 2 0 1 1-3-3l8-8"/></svg>
                      Attach screenshots
                    </button>
                    <button
                      onClick={() => issueBody.trim() && setIssueSent(true)}
                      disabled={!issueBody.trim()}
                      style={{
                        padding: "11px 18px", borderRadius: 10, border: "none",
                        background: issueBody.trim() ? P.accent : P.soft,
                        color: issueBody.trim() ? P.accentInk : P.muted,
                        fontSize: 13, fontFamily: FONT, fontWeight: 600,
                        cursor: issueBody.trim() ? "pointer" : "not-allowed",
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>Send report {Ico.arrow(12)}</button>
                  </div>
                </div>
              )}
            </Section>

            {/* ── DELETE ACCOUNT ───────────────────────────────────── */}
            <Section
              danger
              icon={Ico.trash(16)}
              eyebrow="Danger zone"
              title="Delete account"
              subtitle="This permanently removes your profile, applications, ratings, and saved jobs. Any in-progress jobs must be completed or cancelled first. This cannot be undone."
            >
              {/* Consequences list */}
              <div style={{ background: P.dangerBg, border: `1px solid ${P.dangerBr}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: P.danger, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>What gets deleted</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    "Your worker profile and verification",
                    "All applications, saved jobs, and message history",
                    "Earnings analytics and rating history",
                    "Cards on file (your bank stays with your bank)",
                  ].map((t, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#7F1D1D", alignItems: "center" }}>
                      <span style={{ width: 4, height: 4, borderRadius: 2, background: P.danger }}/>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={{
                  marginTop: 14, padding: "11px 18px", borderRadius: 10,
                  border: `1px solid ${P.danger}`, background: P.panel, color: P.danger,
                  fontSize: 13, fontFamily: FONT, fontWeight: 600, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}>{Ico.trash(13)} Delete my account</button>
              ) : (
                <div style={{ marginTop: 14, padding: "16px 18px", border: `1px solid ${P.danger}`, borderRadius: 10, background: P.panel }}>
                  <div style={{ fontSize: 13.5, color: P.ink, fontWeight: 500 }}>Type <span style={{ fontFamily: MONO, background: P.dangerBg, color: P.danger, padding: "2px 6px", borderRadius: 4 }}>DELETE</span> to confirm.</div>
                  <div style={{ fontSize: 12, color: P.muted, marginTop: 4 }}>Once confirmed your account is queued for deletion in 14 days. Sign in any time before then to cancel.</div>
                  <input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="Type DELETE"
                    style={{ marginTop: 12, width: "100%", padding: "10px 14px", border: `1px solid ${P.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 13, color: P.ink, boxSizing: "border-box", letterSpacing: ".08em" }}
                  />
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button onClick={() => { setConfirmDelete(false); setDeleteText(""); }} style={{
                      padding: "10px 16px", borderRadius: 10, border: `1px solid ${P.rule}`, background: P.panel,
                      fontSize: 13, color: P.ink, fontFamily: FONT, fontWeight: 500, cursor: "pointer",
                    }}>Cancel</button>
                    <button disabled={!canDelete} style={{
                      padding: "10px 16px", borderRadius: 10, border: "none",
                      background: canDelete ? P.danger : "#FCA5A5", color: "#fff",
                      fontSize: 13, fontFamily: FONT, fontWeight: 600,
                      cursor: canDelete ? "pointer" : "not-allowed",
                    }}>Permanently delete account</button>
                  </div>
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Status footer */}
      <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
        <span>profile · security</span><span>·</span>
        <span>{cards.length} payment methods</span><span>·</span>
        <span>support · &lt; 24h</span>
        <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
      </div>
    </div>
  );
}
