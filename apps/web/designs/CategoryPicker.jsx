// CategoryPicker.jsx — RobosGig "What kind of work are you looking for?" page
// Self-contained: no imports needed beyond React. All styling is inline.
// Drop into any React project (Vite, Next, CRA, etc.) and render <CategoryPicker />.

import React, { useState, useMemo, useEffect } from "react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A",
  muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5",
  accent: "#84CC16", accentInk: "#0A0A0A", accentText: "#4D7C0F",
};

// Frame dimensions used by the prototype. Remove the wrapping width/height
// in <CategoryPicker> below to make the page flow naturally on a real route.
const W = 1240, H = 880;

// ─── Data ───────────────────────────────────────────────────────────────────
// Job mock data — replace with your actual jobs feed in production.
const JOBS = [
  { id: "j1", title: "General Handyman Task",            cat: "general",    pay: [30, 80],   urgency: "low" },
  { id: "j2", title: "Silicone Joint Renewal in Shower", cat: "plumbing",   pay: [60, 120],  urgency: "normal" },
  { id: "j3", title: "Assemble IKEA PAX Wardrobe (3m)",  cat: "assembly",   pay: [80, 140],  urgency: "urgent" },
  { id: "j4", title: "Fix Leaky Kitchen Faucet",         cat: "plumbing",   pay: [40, 90],   urgency: "urgent" },
  { id: "j5", title: "Paint Living Room (35 m²)",        cat: "painting",   pay: [280, 450], urgency: "normal" },
  { id: "j6", title: "Replace 3 Bathroom Light Fixtures",cat: "electrical", pay: [70, 140],  urgency: "low" },
  { id: "j7", title: "Gallery Wall — Hang 12 Frames",    cat: "mounting",   pay: [45, 80],   urgency: "normal" },
  { id: "j8", title: "Assemble Patio Furniture (Café)",  cat: "assembly",   pay: [180, 280], urgency: "urgent" },
];

const CATS = {
  general:    { label: "General",    color: "#737373" },
  plumbing:   { label: "Plumbing",   color: "#3B82F6" },
  assembly:   { label: "Assembly",   color: "#F59E0B" },
  painting:   { label: "Painting",   color: "#EC4899" },
  electrical: { label: "Electrical", color: "#EAB308" },
  mounting:   { label: "Mounting",   color: "#10B981" },
};

// Two top-level groupings that map to underlying CATS keys.
const GROUPS = [
  { id: "everyday", title: "Everyday tasks",  desc: "Cleaning, delivery, pet care, moving, assembly, mounting.",
    cats: ["general", "assembly", "mounting"], tone: "blue" },
  { id: "trades",   title: "Trades & skills", desc: "Plumbing, electrical, painting, HVAC, carpentry — licensed work.",
    cats: ["plumbing", "electrical", "painting"], tone: "lime" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const midPay = (range) => Math.round((range[0] + range[1]) / 2);

// Persisted saved/applied set. Drop in your real store if you have one.
function useJobsState() {
  const KEY = "robosgig.jobsState.v2";
  const initial = useMemo(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch {}
    return { saved: [], applied: [] };
  }, []);
  const [saved, setSaved] = useState(initial.saved);
  const [applied, setApplied] = useState(initial.applied);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ saved, applied })); } catch {} }, [saved, applied]);
  return { saved, applied };
}

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

const BookmarkIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h12v17l-6-4-6 4z"/>
  </svg>
);

const SearchIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>
  </svg>
);

const ArrowRightIcon = ({ size = 12, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

const ClipIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="12" height="17" rx="2"/>
    <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
    <path d="M9 11h6M9 15h4"/>
  </svg>
);

const WrenchIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2.5a5 5 0 0 0-3.7 8.4l-7.6 7.6a1.5 1.5 0 0 0 2.1 2.1l7.6-7.6a5 5 0 0 0 6.5-6.5l-2.6 2.6-2.5-.5-.5-2.5 2.7-2.6a5 5 0 0 0-2-1z"/>
  </svg>
);

function CategoryTile({ group, jobs, hover, onHover, onPick }) {
  const TileIcon = group.id === "everyday" ? ClipIcon : WrenchIcon;
  const isLime = group.tone === "lime";
  const accentSoft = isLime ? "#F0FAE0" : "#EBF2FE";
  const accentDark = isLime ? P.accentText : "#1D4ED8";
  const avg = Math.round(jobs.reduce((s, j) => s + midPay(j.pay), 0) / Math.max(jobs.length, 1));
  const urgent = jobs.filter((j) => j.urgency === "urgent").length;
  const isHover = hover === group.id;

  return (
    <div onMouseEnter={() => onHover(group.id)} onMouseLeave={() => onHover(null)} onClick={() => onPick(group)} style={{
      background: P.panel, border: `1px solid ${isHover ? P.ink : P.rule}`, borderRadius: 18,
      padding: "32px 32px 28px", cursor: "pointer", display: "flex", flexDirection: "column",
      gap: 24, position: "relative", overflow: "hidden", transition: "all .18s",
      transform: isHover ? "translateY(-2px)" : "translateY(0)",
      boxShadow: isHover ? "0 12px 32px rgba(0,0,0,.06)" : "0 0 0 transparent",
    }}>
      {/* Icon + counter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: accentSoft, color: accentDark, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <TileIcon size={26}/>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1, letterSpacing: "-.025em", color: P.ink, fontVariantNumeric: "tabular-nums" }}>{jobs.length}</div>
          <div style={{ fontSize: 11, color: P.muted, marginTop: 4, letterSpacing: ".06em", textTransform: "uppercase" }}>open</div>
        </div>
      </div>

      {/* Title + desc */}
      <div>
        <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-.022em", lineHeight: 1.1, margin: 0, color: P.ink }}>{group.title}</h3>
        <p style={{ fontSize: 14, color: P.muted, marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>{group.desc}</p>
      </div>

      {/* Sub-categories */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {group.cats.map((k) => (
          <span key={k} style={{
            padding: "5px 10px", borderRadius: 999, border: `1px solid ${P.rule}`,
            fontSize: 11.5, color: P.muted, display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: CATS[k].color }}/>
            {CATS[k].label}
          </span>
        ))}
      </div>

      {/* Stats footer */}
      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${P.rule}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: P.sub, letterSpacing: ".1em", textTransform: "uppercase" }}>Avg pay</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: P.ink, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>€{avg}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: P.sub, letterSpacing: ".1em", textTransform: "uppercase" }}>Urgent</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: urgent ? "#DC2626" : P.ink, marginTop: 2 }}>{urgent}</div>
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999,
          background: isHover ? P.ink : "transparent",
          color: isHover ? "#fff" : P.ink,
          border: isHover ? "none" : `1px solid ${P.rule}`,
          fontSize: 12.5, fontWeight: 500, transition: "all .15s",
        }}>
          Browse <ArrowRightIcon size={12}/>
        </span>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function CategoryPicker() {
  const j = useJobsState();
  const [hover, setHover] = useState(null);
  const [picked, setPicked] = useState(null);

  const groupJobs = (group) => JOBS.filter((x) => group.cats.includes(x.cat));
  const totalOpen = JOBS.length;

  return (
    <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RobosLogo accent={P.ink} size={24}/>
          <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
          <span style={{ color: P.ink, fontWeight: 500, position: "relative" }}>
            Browse jobs
            <span style={{ position: "absolute", left: 0, right: 0, bottom: -19, height: 2, background: P.ink }}/>
          </span>
          <span style={{ color: P.muted }}>Applications</span>
          <span style={{ color: P.muted }}>Profile</span>
          <span style={{ color: P.muted }}>Pricing</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${P.rule}`, borderRadius: 999, fontSize: 11.5, color: P.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: P.accent, boxShadow: `0 0 6px ${P.accent}` }}/>
            Online · Vienna
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: P.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>W</div>
        </div>
      </div>

      {/* Main body */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 32px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", width: "100%" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 18 }}>
            <span style={{ width: 24, height: 1, background: P.rule }}/>
            <span style={{ fontSize: 11, color: P.muted, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 500 }}>Job board</span>
            <span style={{ width: 24, height: 1, background: P.rule }}/>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-.035em", lineHeight: 1.05, margin: 0, color: P.ink, textAlign: "center" }}>
            What kind of work<br/>are you looking for<span style={{ color: P.accentText }}>?</span>
          </h1>
          <p style={{ fontSize: 15, color: P.muted, marginTop: 14, marginBottom: 0, textAlign: "center", lineHeight: 1.5 }}>
            <span style={{ color: P.ink, fontWeight: 500 }}>{totalOpen} jobs</span> open near you in Vienna · updated 2 min ago
          </p>

          {/* Tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 44 }}>
            {GROUPS.map((g) => (
              <CategoryTile key={g.id} group={g} jobs={groupJobs(g)} hover={hover} onHover={setHover} onPick={setPicked}/>
            ))}
          </div>

          {/* Footer row */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 28, gap: 8 }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999,
              background: P.panel, border: `1px solid ${P.rule}`, fontSize: 13, color: P.ink, fontFamily: FONT, cursor: "pointer", fontWeight: 500,
            }}>
              <BookmarkIcon size={13}/> Saved jobs
              <span style={{ fontSize: 11, color: P.muted, marginLeft: 4 }}>{j.saved.length}</span>
            </button>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999,
              background: P.panel, border: `1px solid ${P.rule}`, fontSize: 13, color: P.ink, fontFamily: FONT, cursor: "pointer", fontWeight: 500,
            }}>
              <SearchIcon size={13}/> Search all
            </button>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999,
              background: P.accent, border: "none", fontSize: 13, color: P.accentInk, fontFamily: FONT, cursor: "pointer", fontWeight: 600,
            }}>
              Browse all jobs
              <ArrowRightIcon size={12} stroke={2.2}/>
            </button>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
        <span>{totalOpen} open</span><span>·</span>
        <span>avg €{Math.round(JOBS.reduce((s, x) => s + midPay(x.pay), 0) / JOBS.length)}</span><span>·</span>
        <span>{JOBS.filter((x) => x.urgency === "urgent").length} urgent</span>
        <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
      </div>
    </div>
  );
}
