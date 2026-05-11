// ClientSpending.jsx — RobosGig "Client Spending" page
// Mirror of WorkerEarnings, flipped for the client side:
//   • Total spent (not earned) over a range, with a category split
//   • Wallet/budget card: balance topped up, escrow held, this-month spend, avg/job
//   • Activity stats reframed for clients (jobs posted, completion rate, etc.)
//   • Transactions log shows payments out, top-ups in, refunds, escrow
//   • Right rail: payment method on file + auto top-up settings
// Single self-contained module. Default-exports <ClientSpending />.

import React from "react";

// ─── Logo ───────────────────────────────────────────────────────────────────
const RobosLogo = ({ accent = "#0A0A0A", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="9" width="24" height="17" rx="6" fill={accent}/>
    <rect x="14.5" y="3.5" width="3" height="6" rx="1.5" fill={accent}/>
    <circle cx="16" cy="3.5" r="1.4" fill={accent}/>
    <circle cx="11.5" cy="17" r="2.4" fill="#fff"/>
    <circle cx="20.5" cy="17" r="2.4" fill="#fff"/>
  </svg>
);

const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const W = 1240, H = 880;
const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A", muted: "#737373", sub: "#A3A3A3",
  rule: "#E8E8E5", accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F",
  soft: "#F5F5F3", positive: "#15803D", warn: "#B45309", spend: "#0A0A0A",
};

// 12-week spend sparkline (mock — euros paid out per week)
const SERIES = [120, 80, 220, 140, 260, 180, 340, 280, 410, 230, 380, 290];

const TX = [
  { id: "t1", label: "Bathroom retiling — Daniel B.",       cat: "plumbing",   date: "26 Apr 2026", amount: -240, status: "paid",     ref: "TXN-8819" },
  { id: "t2", label: "Apartment deep clean — Priti S.",     cat: "cleaning",   date: "18 Apr 2026", amount: -110, status: "paid",     ref: "TXN-8634" },
  { id: "t3", label: "Top-up · Visa ****4242",              cat: "topup",      date: "18 Apr 2026", amount: +500, status: "topup",    ref: "TOP-8631" },
  { id: "t4", label: "Lamp install (5 fixtures) — Erjon L.", cat: "electrical", date: "11 May 2026", amount: -360, status: "escrow",   ref: "ESC-9001" },
  { id: "t5", label: "Refund · cancelled job #J-7720",      cat: "refund",     date: "01 Apr 2026", amount: +120, status: "refunded",  ref: "REF-7720" },
];

function Spark({ data, w = 280, h = 60, color = "#0A0A0A", fill = "rgba(132,204,22,.18)" }) {
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - (v / max) * (h - 6) - 3]);
  const pathD = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaD = pathD + ` L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path d={areaD} fill={fill} stroke="none"/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p, i) => i === pts.length - 1 && <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color}/>)}
    </svg>
  );
}

const TX_DOT = { plumbing: "#3B82F6", cleaning: "#10B981", electrical: "#F59E0B", general: "#737373", topup: "#0A0A0A", refund: "#A3A3A3" };
const TX_BG  = { paid: "#F5F5F5", escrow: "#FEF3C7", topup: "#F0FAE0", refunded: "#EFF6FF" };
const TX_FG  = { paid: P.muted,    escrow: "#92400E", topup: P.accentText, refunded: "#1D4ED8" };

function Stat({ label, value, sub, big, accent, mono }) {
  return (
    <div style={{ flex: 1, padding: "16px 18px", background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 12 }}>
      <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: big ? 32 : 22, fontWeight: 500, color: accent || P.ink, marginTop: 8, letterSpacing: "-.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums", fontFamily: mono ? MONO : FONT }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: P.sub, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function ClientSpending() {
  const totalSpent = SERIES.reduce((s, v) => s + v, 0);

  return (
    <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top nav — client side */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0, background: P.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RobosLogo accent={P.ink} size={24}/>
          <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
          <span style={{ marginLeft: 6, padding: "2px 7px", borderRadius: 4, background: P.soft, fontSize: 10.5, color: P.muted, fontFamily: MONO, letterSpacing: ".06em" }}>CLIENT</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
          <span style={{ color: P.muted }}>Dashboard</span>
          <span style={{ color: P.muted }}>Post a job</span>
          <span style={{ color: P.muted }}>My jobs</span>
          <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>Spending<span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/></span>
          <span style={{ color: P.muted }}>Messages</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>Vienna · EUR
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#5A56E0", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>AG</div>
        </div>
      </div>

      {/* Page header */}
      <div style={{ padding: "26px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 6 }}>Spending &amp; budget</div>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.025em", margin: 0, lineHeight: 1, color: P.ink }}>Spending</h1>
          <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>What you've paid, what's still in escrow, and where it went.</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel }}>
            {["7d", "30d", "90d", "All"].map((r, i) => (
              <button key={r} style={{
                padding: "6px 12px", borderRadius: 999, border: "none",
                background: i === 1 ? P.ink : "transparent",
                color: i === 1 ? "#fff" : P.muted, fontSize: 11.5, fontFamily: FONT, fontWeight: i === 1 ? 500 : 400, cursor: "pointer",
              }}>{r}</button>
            ))}
          </div>
          <button style={{ padding: "8px 14px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 12.5, fontFamily: FONT, color: P.ink, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/></svg>Export CSV
          </button>
          <button style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: P.ink, color: "#fff", fontSize: 12.5, fontFamily: FONT, fontWeight: 500, cursor: "pointer" }}>Add funds →</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Hero spend card + balance grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "22px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>Total spent · last 90 days</div>
                <div style={{ fontSize: 56, fontWeight: 500, color: P.ink, letterSpacing: "-.035em", lineHeight: 1, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
                  €{totalSpent.toLocaleString()}<span style={{ fontSize: 18, color: P.muted, fontWeight: 400, marginLeft: 4 }}>.00</span>
                </div>
                <div style={{ fontSize: 12, color: P.warn, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  ↑ +€680 vs prior 90d <span style={{ color: P.muted }}>· 12 jobs paid</span>
                </div>
              </div>
              <Spark data={SERIES} color={P.ink} fill="rgba(10,10,10,.06)"/>
            </div>
            {/* Category split */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", background: P.soft }}>
                <div style={{ width: "44%", background: P.ink }}/>
                <div style={{ width: "26%", background: P.accent }}/>
                <div style={{ width: "18%", background: "#F59E0B" }}/>
                <div style={{ width: "12%", background: "#A3A3A3" }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: P.muted, letterSpacing: ".02em" }}>
                <span><span style={{ color: P.ink }}>●</span> Plumbing 44%</span>
                <span><span style={{ color: P.accent }}>●</span> Cleaning 26%</span>
                <span><span style={{ color: "#F59E0B" }}>●</span> Electrical 18%</span>
                <span><span style={{ color: "#A3A3A3" }}>●</span> Other 12%</span>
              </div>
            </div>
          </div>

          {/* Right balance breakdowns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10 }}>
            <Stat label="Wallet balance" value="€420.00" sub="ready to spend" big accent={P.positive} mono/>
            <Stat label="Held in escrow" value="€360.00" sub="1 job in progress" accent={P.warn} mono/>
            <Stat label="Spent this month" value="€710" sub="of €1,000 budget" mono/>
            <Stat label="Avg per job" value="€178" sub="vs €145 city avg" mono/>
          </div>
        </div>

        {/* Activity stats — client-flavored */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          <Stat label="Jobs posted" value="16" sub="4 this month"/>
          <Stat label="Completion rate" value="94%" sub="15 of 16 finished"/>
          <Stat label="Avg time to hire" value="2.4h" sub="from post to accept"/>
          <Stat label="Workers rated" value="12" sub="avg 4.7★ given"/>
          <Stat label="Repeat hires" value="5" sub="31% rebook rate"/>
        </div>

        {/* Transactions + payment method */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${P.rule}` }}>
              <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "-.005em", color: P.ink, display: "inline-flex", alignItems: "center", gap: 8 }}>
                Transactions
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 18, padding: "0 6px", borderRadius: 999, background: P.ink, color: "#fff", fontSize: 10.5, fontWeight: 600 }}>{TX.length}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.ink}`, background: P.ink, color: "#fff", fontSize: 11, fontFamily: FONT, cursor: "pointer" }}>All</button>
                <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, color: P.muted, fontSize: 11, fontFamily: FONT, cursor: "pointer" }}>Payments</button>
                <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, color: P.muted, fontSize: 11, fontFamily: FONT, cursor: "pointer" }}>Top-ups</button>
                <button style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.rule}`, background: P.panel, color: P.muted, fontSize: 11, fontFamily: FONT, cursor: "pointer" }}>Refunds</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", padding: "0 22px", fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, height: 30, alignItems: "center", borderBottom: `1px solid ${P.rule}`, columnGap: 14 }}>
              <span>Date</span><span>Item</span><span>Status</span><span style={{ textAlign: "right" }}>Amount</span><span style={{ fontFamily: MONO }}>Ref</span>
            </div>
            {TX.map((t, i) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", padding: "12px 22px", alignItems: "center", borderBottom: i < TX.length - 1 ? `1px solid ${P.rule}` : "none", fontSize: 12, columnGap: 14 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: P.muted, fontVariantNumeric: "tabular-nums" }}>{t.date}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: TX_DOT[t.cat], flexShrink: 0 }}/>
                  <span style={{ color: P.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 999, background: TX_BG[t.status], color: TX_FG[t.status], fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em" }}>{t.status}</span>
                <span style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", fontWeight: 500, color: t.amount > 0 ? P.positive : P.ink, textAlign: "right" }}>
                  {t.amount > 0 ? "+" : "−"}€{Math.abs(t.amount).toFixed(2)}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.sub }}>{t.ref}</span>
              </div>
            ))}
          </div>

          {/* Payment method + monthly budget */}
          <div style={{ background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: P.ink, letterSpacing: "-.005em" }}>Payment method</div>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "#0A0A0A", color: "#fff", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 100% 0%, ${P.accent}33, transparent 60%)` }}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                <span style={{ fontSize: 10.5, color: "#A3A3A3", letterSpacing: ".14em", textTransform: "uppercase" }}>Visa · Primary</span>
                <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 999, background: P.accent, color: P.accentInk, fontWeight: 600 }}>Default</span>
              </div>
              <div style={{ fontSize: 14, fontFamily: MONO, letterSpacing: ".06em", position: "relative" }}>•••• •••• •••• 4242</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#A3A3A3", position: "relative" }}>
                <span>EXPIRES 08/27</span><span>ANDREA GRAC</span>
              </div>
            </div>
            <button style={{ padding: "8px", borderRadius: 8, border: `1px solid ${P.rule}`, background: P.panel, fontSize: 11.5, fontFamily: FONT, color: P.ink, cursor: "pointer" }}>+ Add another method</button>

            {/* Monthly budget */}
            <div style={{ borderTop: `1px solid ${P.rule}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 10.5, color: P.muted, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>Monthly budget</div>
                <div style={{ fontSize: 11, color: P.muted, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>€710 / €1,000</div>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: P.soft, overflow: "hidden" }}>
                <div style={{ width: "71%", height: "100%", background: P.accent }}/>
              </div>
              <div style={{ fontSize: 11.5, color: P.muted, lineHeight: 1.5 }}>You'll get an email when you hit 90%. Hard cap pauses auto top-ups but never blocks active jobs.</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span style={{ fontSize: 12, color: P.ink }}>Auto top-up at €100</span>
                <button style={{ width: 34, height: 20, borderRadius: 999, border: "none", background: P.ink, position: "relative", cursor: "pointer", padding: 0 }}>
                  <span style={{ position: "absolute", top: 3, left: 17, width: 14, height: 14, borderRadius: 999, background: P.accent }}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
        <span>balance €420</span><span>·</span>
        <span>16 jobs posted</span><span>·</span>
        <span>94% completion</span><span>·</span>
        <span>budget 71%</span>
        <span style={{ marginLeft: "auto" }}>RobosGig · Client · v2.4</span>
      </div>
    </div>
  );
}
