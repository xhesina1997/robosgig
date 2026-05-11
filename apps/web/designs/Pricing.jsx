// Pricing.jsx — RobosGig pricing page
// Self-contained: no imports needed beyond React. All styling is inline.
// Drop into any React project (Vite, Next, CRA, etc.) and render <Pricing />.

import React, { useState } from "react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A",
  muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5",
  accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F",
  soft: "#F5F5F3", positive: "#15803D",
};

// Frame dimensions used by the prototype. Remove the wrapping width/height
// in <Pricing> below to make the page flow naturally on a real route.
const W = 1240, H = 880;

// ─── Data ───────────────────────────────────────────────────────────────────
const PLANS_WORKER = [
  {
    id: "free", name: "Free", price: { mo: 0, yr: 0 }, fee: "15%",
    tagline: "Pick up jobs as they come.",
    features: [
      ["5", "applications / month"],
      ["15%", "platform fee on earnings"],
      ["Standard", "search ranking"],
      ["—", "Pro badge on profile"],
      ["—", "Advanced analytics"],
      ["Basic", "profile listing"],
    ],
    cta: "Current plan", ctaActive: true,
  },
  {
    id: "pro", name: "Pro", price: { mo: 19.99, yr: 199 }, fee: "12%",
    tagline: "Get found, get booked, keep more.", featured: true,
    features: [
      ["Unlimited", "job applications"],
      ["12%", "platform fee · save 3%"],
      ["Priority", "in search results"],
      ["Pro", "badge on your profile"],
      ["Full", "earnings & traffic analytics"],
      ["Featured", "profile listing"],
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: "elite", name: "Elite", price: { mo: 39.99, yr: 399 }, fee: "10%",
    tagline: "For full-time pros at the top of the list.",
    features: [
      ["Unlimited", "+ direct hire requests"],
      ["10%", "platform fee · save 5%"],
      ["Top placement", "in your category"],
      ["Verified Elite", "badge"],
      ["Dedicated", "account manager"],
      ["Custom", "scheduling & invoicing"],
    ],
    cta: "Talk to sales",
  },
];

const COMPARE_ROWS = [
  { group: "Earning", rows: [
    { label: "Platform fee on each job", free: "15%", pro: "12%", elite: "10%" },
    { label: "Payout speed", free: "2 business days", pro: "1 business day", elite: "Same day" },
    { label: "Auto-withdraw", free: false, pro: true, elite: true },
  ]},
  { group: "Visibility", rows: [
    { label: "Search ranking", free: "Standard", pro: "Priority", elite: "Top placement" },
    { label: "Profile badge", free: false, pro: "Pro", elite: "Elite ★" },
    { label: "Featured in category", free: false, pro: "Sometimes", elite: "Always" },
  ]},
  { group: "Tooling", rows: [
    { label: "Monthly applications", free: "5", pro: "Unlimited", elite: "Unlimited" },
    { label: "Earnings analytics", free: "Basic", pro: "Advanced", elite: "Advanced + export" },
    { label: "Account manager", free: false, pro: false, elite: true },
  ]},
];

const FAQ = [
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your account; you keep Pro access until the end of the billing period — no questions, no fees." },
  { q: "What does the platform fee cover?", a: "Payment processing, escrow, dispute mediation, and the marketplace itself. There are no hidden charges on top." },
  { q: "Do clients see my plan?", a: "Only your badge — Pro or Elite — appears on your public profile. Free workers show no badge." },
  { q: "Can I switch plans later?", a: "Yes — upgrade or downgrade at any time. We prorate the difference automatically." },
];

// ─── Sub-components ─────────────────────────────────────────────────────────
const RobosLogo = ({ accent = "#0A0A0A", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="9" width="24" height="17" rx="6" fill={accent}/>
    <rect x="14.5" y="3.5" width="3" height="6" rx="1.5" fill={accent}/>
    <circle cx="16" cy="3.5" r="1.4" fill={accent}/>
    <circle cx="11.5" cy="17" r="2.4" fill="#fff"/>
    <circle cx="20.5" cy="17" r="2.4" fill="#fff"/>
  </svg>
);

function Check({ on, dim }) {
  if (on === false) return <span style={{ color: P.sub, fontFamily: MONO, fontSize: 13 }}>—</span>;
  if (on === true) return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, background: dim ? P.soft : "#F0FAE0", color: dim ? P.muted : P.accentText }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
    </span>
  );
  return <span style={{ fontSize: 12, color: P.ink }}>{on}</span>;
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid ${P.rule}` }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "16px 0", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: FONT, textAlign: "left" }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: P.ink, letterSpacing: "-.005em" }}>{q}</span>
        <span style={{ width: 22, height: 22, borderRadius: 999, border: `1px solid ${P.rule}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: P.muted, fontSize: 13, lineHeight: 1, transition: "transform .15s", transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      {open && <div style={{ paddingBottom: 18, fontSize: 13, color: P.muted, lineHeight: 1.6, maxWidth: 720 }}>{a}</div>}
    </div>
  );
}

function PriceBlock({ price, period }) {
  if (price === 0) {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1, color: P.ink }}>Free</span>
      </div>
    );
  }
  const [whole, dec] = price.toFixed(2).split(".");
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{ fontSize: 22, fontWeight: 500, color: P.ink, alignSelf: "flex-start", marginTop: 14, fontVariantNumeric: "tabular-nums" }}>€</span>
      <span style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1, color: P.ink, fontVariantNumeric: "tabular-nums" }}>{whole}</span>
      <span style={{ fontSize: 22, fontWeight: 500, color: P.muted, alignSelf: "flex-start", marginTop: 14, fontVariantNumeric: "tabular-nums" }}>.{dec}</span>
      <span style={{ fontSize: 13, color: P.muted, marginLeft: 6 }}>/{period}</span>
    </div>
  );
}

function PlanCard({ plan, period }) {
  const featured = plan.featured;
  const dark = featured;
  const ink = dark ? "#fff" : P.ink;
  const subInk = dark ? "#A3A3A3" : P.muted;
  const rule = dark ? "#262626" : P.rule;
  const surface = dark ? "#0A0A0A" : P.panel;
  const accentBox = dark ? P.accent : "#F0FAE0";
  const accentTxt = dark ? P.accentInk : P.accentText;

  return (
    <div style={{
      position: "relative", flex: 1, background: surface, border: `1px solid ${rule}`,
      borderRadius: 18, padding: "28px 26px 24px", display: "flex", flexDirection: "column", gap: 20,
      boxShadow: featured ? "0 30px 60px -30px rgba(10,10,10,.55)" : "0 1px 0 rgba(10,10,10,.02)",
      transform: featured ? "translateY(-8px)" : "none",
    }}>
      {featured && (
        <div style={{ position: "absolute", top: -12, left: 24, padding: "5px 10px", borderRadius: 999, background: P.accent, color: P.accentInk, fontSize: 10.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase" }}>Most popular</div>
      )}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: subInk, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 500 }}>Worker {plan.name}</div>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 999, background: accentBox, color: accentTxt, fontSize: 11, fontWeight: 600, fontFamily: MONO }}>{plan.fee} fee</span>
        </div>
        <div style={{ marginTop: 16 }}>
          {period === "mo"
            ? <PriceBlock price={plan.price.mo} period="mo"/>
            : <PriceBlock price={plan.price.yr === 0 ? 0 : plan.price.yr / 12} period="mo"/>}
          <div style={{ fontSize: 11.5, color: subInk, marginTop: 8, minHeight: 16 }}>
            {plan.price.mo === 0
              ? "No card required"
              : (period === "yr"
                  ? <>billed annually · €{plan.price.yr.toFixed(0)}/yr <span style={{ color: P.accent, fontWeight: 500 }}>· save {Math.round((1 - plan.price.yr / (plan.price.mo * 12)) * 100)}%</span></>
                  : "billed monthly · cancel anytime")}
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: ink, marginTop: 14, letterSpacing: "-.005em", lineHeight: 1.45 }}>{plan.tagline}</div>
      </div>

      <div style={{ height: 1, background: rule }}/>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {plan.features.map(([key, label], i) => {
          const muted = key === "—";
          return (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 12.5, color: muted ? subInk : ink, opacity: muted ? .55 : 1 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: muted ? subInk : (dark ? P.accent : P.accentText), minWidth: 64, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{key}</span>
              <span style={{ flex: 1, lineHeight: 1.45 }}>{label}</span>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: "auto", paddingTop: 4 }}>
        <button disabled={plan.ctaActive} style={{
          width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", cursor: plan.ctaActive ? "default" : "pointer",
          background: plan.ctaActive ? (dark ? "#262626" : P.soft) : (featured ? P.accent : P.ink),
          color: plan.ctaActive ? subInk : (featured ? P.accentInk : "#fff"),
          fontSize: 13, fontFamily: FONT, fontWeight: 500, letterSpacing: "-.005em",
        }}>
          {plan.cta}{!plan.ctaActive && <span style={{ marginLeft: 6 }}>→</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Pricing() {
  const [period, setPeriod] = useState("yr");
  const [audience, setAudience] = useState("worker");
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top nav */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RobosLogo accent={P.ink} size={24}/>
          <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
          <span style={{ color: P.muted }}>Browse jobs</span>
          <span style={{ color: P.muted }}>Applications</span>
          <span style={{ color: P.muted }}>Profile</span>
          <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Pricing<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>Online
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero */}
        <div style={{ padding: "44px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 32, maxWidth: 1180, margin: "0 auto", boxSizing: "border-box", width: "100%" }}>
          <div>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Pricing</div>
            <h1 style={{ fontSize: 48, fontWeight: 500, letterSpacing: "-.035em", margin: 0, lineHeight: 1.02, color: P.ink, maxWidth: 720 }}>
              Simple pricing.<br/>
              <span style={{ color: P.muted }}>You</span> keep what you earn.
            </h1>
            <div style={{ fontSize: 14, color: P.muted, marginTop: 16, maxWidth: 540, lineHeight: 1.55 }}>Start free. Upgrade when the work picks up — pay less platform fee, get found first, cancel anytime.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
            {/* Audience pill */}
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel }}>
              {[{ id: "worker", label: "I'm a worker" }, { id: "client", label: "I'm a client" }].map((a) => (
                <button key={a.id} onClick={() => setAudience(a.id)} style={{
                  padding: "7px 14px", borderRadius: 999, border: "none",
                  background: audience === a.id ? P.ink : "transparent",
                  color: audience === a.id ? "#fff" : P.muted, fontSize: 12, fontFamily: FONT, fontWeight: audience === a.id ? 500 : 400, cursor: "pointer",
                }}>{a.label}</button>
              ))}
            </div>
            {/* Billing pill */}
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, alignItems: "center" }}>
              {[{ id: "mo", label: "Monthly" }, { id: "yr", label: "Yearly" }].map((p) => (
                <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                  padding: "7px 14px", borderRadius: 999, border: "none",
                  background: period === p.id ? P.ink : "transparent",
                  color: period === p.id ? "#fff" : P.muted, fontSize: 12, fontFamily: FONT, fontWeight: period === p.id ? 500 : 400, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  {p.label}
                  {p.id === "yr" && <span style={{ padding: "1px 6px", borderRadius: 999, background: period === "yr" ? P.accent : "#F0FAE0", color: period === "yr" ? P.accentInk : P.accentText, fontSize: 9.5, fontFamily: MONO, fontWeight: 600, letterSpacing: ".05em" }}>2 MOS FREE</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Client banner */}
        {audience === "client" && (
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 40px 12px", boxSizing: "border-box" }}>
            <div style={{ padding: "20px 24px", border: `1px dashed ${P.rule}`, borderRadius: 14, background: P.panel, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>For clients</div>
                <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: P.ink, marginTop: 4 }}>Posting jobs is always free.</div>
                <div style={{ fontSize: 13, color: P.muted, marginTop: 6, maxWidth: 600, lineHeight: 1.5 }}>You only pay your worker — no platform fee, no markup. Funds sit in escrow until the job is done; release with one tap.</div>
              </div>
              <button style={{ padding: "10px 18px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 13, fontFamily: FONT, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>Post a job →</button>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ padding: "12px 40px 24px", maxWidth: 1180, margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, alignItems: "stretch", paddingTop: 12 }}>
            {PLANS_WORKER.map((plan) => <PlanCard key={plan.id} plan={plan} period={period}/>)}
          </div>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 11.5, color: P.sub, fontFamily: MONO, letterSpacing: ".02em" }}>
            All prices in EUR · VAT calculated at checkout · 30-day money-back on first upgrade
          </div>
        </div>

        {/* Compare table */}
        <div style={{ padding: "12px 40px 24px", maxWidth: 1180, margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "18px 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>Compare</div>
                <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-.015em", color: P.ink, marginTop: 4 }}>What's in each plan</div>
              </div>
              <span style={{ fontSize: 11, color: P.sub, fontFamily: MONO }}>worker plans · {period === "yr" ? "yearly" : "monthly"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", padding: "10px 24px", borderTop: `1px solid ${P.rule}`, borderBottom: `1px solid ${P.rule}`, fontSize: 11, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, alignItems: "center" }}>
              <span></span>
              <span style={{ textAlign: "center" }}>Free</span>
              <span style={{ textAlign: "center", color: P.ink }}>Pro <span style={{ marginLeft: 4, padding: "1px 6px", borderRadius: 999, background: P.accent, color: P.accentInk, fontSize: 9, fontFamily: MONO, letterSpacing: ".05em" }}>POPULAR</span></span>
              <span style={{ textAlign: "center" }}>Elite</span>
            </div>
            {COMPARE_ROWS.map((sec) => (
              <React.Fragment key={sec.group}>
                <div style={{ padding: "12px 24px 6px", fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, background: P.soft }}>{sec.group}</div>
                {sec.rows.map((r, ri) => (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", padding: "12px 24px", alignItems: "center", borderTop: `1px solid ${P.rule}`, fontSize: 13 }}>
                    <span style={{ color: P.ink }}>{r.label}</span>
                    <span style={{ textAlign: "center" }}><Check on={r.free} dim/></span>
                    <span style={{ textAlign: "center", background: "rgba(132,204,22,.06)", padding: "10px 0", margin: "-12px 0", borderLeft: `1px solid ${P.rule}`, borderRight: `1px solid ${P.rule}` }}><Check on={r.pro}/></span>
                    <span style={{ textAlign: "center" }}><Check on={r.elite}/></span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* FAQ + dark CTA */}
        <div style={{ padding: "8px 40px 32px", maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, boxSizing: "border-box" }}>
          <div>
            <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>FAQ</div>
            <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: P.ink, marginTop: 4, marginBottom: 8 }}>Questions, answered.</div>
            <div>
              {FAQ.map((f, i) => (
                <FaqItem key={i} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}/>
              ))}
            </div>
          </div>
          <div style={{ background: "#0A0A0A", color: "#fff", borderRadius: 16, padding: "26px 26px", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden", alignSelf: "start" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 100% 0%, ${P.accent}40, transparent 55%)`, pointerEvents: "none" }}/>
            <div style={{ fontSize: 11, color: "#A3A3A3", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, position: "relative" }}>Still deciding?</div>
            <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", lineHeight: 1.2, position: "relative" }}>Try Pro free for 14 days.</div>
            <div style={{ fontSize: 12.5, color: "#A3A3A3", lineHeight: 1.5, position: "relative" }}>No card. Auto-downgrades to Free if you don't upgrade — your jobs and ratings stay put.</div>
            <button style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, border: "none", background: P.accent, color: P.accentInk, fontSize: 13, fontFamily: FONT, fontWeight: 600, cursor: "pointer", position: "relative" }}>Start 14-day Pro trial →</button>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#737373", marginTop: 4, position: "relative", fontFamily: MONO }}>
              <span>★ 4.92 avg</span><span>·</span><span>2,400+ workers</span><span>·</span><span>EU-hosted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status footer */}
      <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
        <span>pricing · {audience} · {period}</span><span>·</span>
        <span>3 plans</span><span>·</span>
        <span>cancel anytime</span>
        <span style={{ marginLeft: "auto" }}>RobosGig · v2.4</span>
      </div>
    </div>
  );
}
