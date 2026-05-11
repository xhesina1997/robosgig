// WorkerSavedJobs.jsx — RobosGig "Saved jobs" page
// Designed from scratch to match the existing light-modern system
// (same nav, lime accent, Geist type, status footer, panel cards).
// Default-exports <WorkerSavedJobs />. Drop into any React project.

import React, { useState, useMemo, useEffect } from "react";

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

// ─── Mock data (replace with real saved-jobs feed) ──────────────────────────
const SAVED = [
  { id: "j2", title: "Silicone Joint Renewal in Shower", cat: "plumbing",   pay: [60, 120],  urgency: "normal", posted: "26 Apr", distanceKm: 0.1, client: { name: "Andrea Grac", short: "AG", city: "Wien", verified: true, color: "#E54C84" }, savedAt: "2h ago" },
  { id: "j3", title: "Assemble IKEA PAX Wardrobe (3m)",  cat: "assembly",   pay: [80, 140],  urgency: "urgent", posted: "27 Apr", distanceKm: 1.2, client: { name: "Lukas M.",   short: "LM", city: "Neubau",  verified: true, color: "#0F8A5F" }, savedAt: "5h ago" },
  { id: "j4", title: "Fix Leaky Kitchen Faucet",         cat: "plumbing",   pay: [40, 90],   urgency: "urgent", posted: "27 Apr", distanceKm: 0.8, client: { name: "Sophie K.",  short: "SK", city: "Mariahilf", verified: false, color: "#C26A2A" }, savedAt: "yesterday" },
  { id: "j5", title: "Paint Living Room (35 m²)",        cat: "painting",   pay: [280, 450], urgency: "normal", posted: "25 Apr", distanceKm: 2.4, client: { name: "Familie Becker", short: "FB", city: "Hietzing", verified: true, color: "#7A5AE0" }, savedAt: "2 days ago" },
  { id: "j6", title: "Replace 3 Bathroom Light Fixtures",cat: "electrical", pay: [70, 140],  urgency: "low",    posted: "24 Apr", distanceKm: 1.5, client: { name: "Markus T.",  short: "MT", city: "Leopoldstadt", verified: true, color: "#1E7A8C" }, savedAt: "3 days ago" },
];

const CATS = {
  general:    { label: "General",    color: "#737373" },
  plumbing:   { label: "Plumbing",   color: "#3B82F6" },
  assembly:   { label: "Assembly",   color: "#F59E0B" },
  painting:   { label: "Painting",   color: "#EC4899" },
  electrical: { label: "Electrical", color: "#EAB308" },
  mounting:   { label: "Mounting",   color: "#10B981" },
};

const URGENCY = {
  low:    { label: "Low",    color: "#737373", dot: "#A3A3A3" },
  normal: { label: "Normal", color: "#525252", dot: "#525252" },
  urgent: { label: "Urgent", color: "#DC2626", dot: "#EF4444" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const midPay = (range) => Math.round((range[0] + range[1]) / 2);
const fmtDistance = (km) => (km < 1 ? `${(km * 1000) | 0} m` : `${km.toFixed(1)} km`);
const fmtPay = (range) => `€${range[0]}–${range[1]}`;

// ─── Inline icons ───────────────────────────────────────────────────────────
const BookmarkFillIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
);
const BookmarkIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
);
const PinIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
);
const ClockIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
);
const ArrowRightIcon = ({ size = 12, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
);
const CheckIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>
);
const SortIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h12M4 12h8M4 17h4M17 4v16m0 0 4-4m-4 4-4-4"/></svg>
);

const RobosLogo = ({ accent = "#0A0A0A", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="9" width="24" height="17" rx="6" fill={accent}/>
    <rect x="14.5" y="3.5" width="3" height="6" rx="1.5" fill={accent}/>
    <circle cx="16" cy="3.5" r="1.4" fill={accent}/>
    <circle cx="11.5" cy="17" r="2.4" fill="#fff"/>
    <circle cx="20.5" cy="17" r="2.4" fill="#fff"/>
  </svg>
);

// ─── Saved Job Card ─────────────────────────────────────────────────────────
function SavedJobCard({ job, onUnsave, onApply, applied }) {
  const cat = CATS[job.cat];
  const urg = URGENCY[job.urgency];
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: P.panel, border: `1px solid ${hover ? P.ink : P.rule}`, borderRadius: 14,
        padding: "18px 20px", display: "grid",
        gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 18,
        transition: "all .15s",
        boxShadow: hover ? "0 6px 20px rgba(0,0,0,.05)" : "none",
      }}
    >
      {/* Client avatar */}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: job.client.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, letterSpacing: ".02em", flexShrink: 0 }}>
        {job.client.short}
      </div>

      {/* Title + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, background: P.soft, fontSize: 10.5, color: P.muted, fontFamily: MONO, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 500 }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: cat.color }}/>
            {cat.label}
          </span>
          {job.urgency === "urgent" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "rgba(220,38,38,.08)", fontSize: 10.5, color: urg.color, fontFamily: MONO, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 500 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: urg.dot }}/>
              Urgent
            </span>
          )}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: P.ink, letterSpacing: "-.012em", lineHeight: 1.3, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {job.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: P.muted, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <PinIcon size={11}/> {fmtDistance(job.distanceKm)} · {job.client.city}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <ClockIcon size={11}/> Saved {job.savedAt}
          </span>
          <span>· Posted {job.posted}</span>
        </div>
      </div>

      {/* Pay */}
      <div style={{ textAlign: "right", paddingRight: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: P.ink, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>
          {fmtPay(job.pay)}
        </div>
        <div style={{ fontSize: 10.5, color: P.sub, fontFamily: MONO, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 2 }}>
          est · €{midPay(job.pay)} avg
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          onClick={() => onUnsave(job.id)}
          title="Remove from saved"
          style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${P.rule}`,
            background: P.panel, color: P.accentText, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all .12s",
          }}
        >
          <BookmarkFillIcon size={14}/>
        </button>
        {applied ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 14px", height: 36, borderRadius: 10, background: "#F0FAE0", color: P.accentText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}>
            <CheckIcon size={11}/> Applied
          </span>
        ) : (
          <button
            onClick={() => onApply(job.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "0 16px", height: 36, borderRadius: 10,
              background: P.ink, color: "#fff", border: "none", fontSize: 12.5, fontWeight: 500, fontFamily: FONT, cursor: "pointer", letterSpacing: "-.005em",
            }}
          >
            Apply <ArrowRightIcon size={11} stroke={2.2}/>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ background: P.panel, border: `1px dashed ${P.rule}`, borderRadius: 14, padding: "56px 32px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: P.soft, color: P.muted, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <BookmarkIcon size={24}/>
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, color: P.ink, letterSpacing: "-.015em", marginBottom: 6 }}>No saved jobs yet</div>
      <div style={{ fontSize: 13, color: P.muted, maxWidth: 380, margin: "0 auto 18px", lineHeight: 1.5 }}>
        Tap the bookmark on any job to keep it here. You'll get a nudge if it's about to fill up.
      </div>
      <button style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999,
        background: P.accent, border: "none", fontSize: 13, color: P.accentInk, fontFamily: FONT, fontWeight: 600, cursor: "pointer",
      }}>
        Browse jobs <ArrowRightIcon size={12} stroke={2.2}/>
      </button>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function WorkerSavedJobs() {
  const [saved, setSaved] = useState(SAVED);
  const [applied, setApplied] = useState([]);
  const [catFilter, setCatFilter] = useState("all");
  const [sort, setSort] = useState("recent"); // recent | pay-high | distance | urgent

  const filtered = useMemo(() => {
    let list = catFilter === "all" ? saved : saved.filter((j) => j.cat === catFilter);
    if (sort === "pay-high") list = [...list].sort((a, b) => midPay(b.pay) - midPay(a.pay));
    else if (sort === "distance") list = [...list].sort((a, b) => a.distanceKm - b.distanceKm);
    else if (sort === "urgent") list = [...list].sort((a, b) => (b.urgency === "urgent") - (a.urgency === "urgent"));
    return list;
  }, [saved, catFilter, sort]);

  const stats = useMemo(() => ({
    total: saved.length,
    urgent: saved.filter((j) => j.urgency === "urgent").length,
    avgPay: saved.length ? Math.round(saved.reduce((s, j) => s + midPay(j.pay), 0) / saved.length) : 0,
    near: saved.filter((j) => j.distanceKm < 1).length,
  }), [saved]);

  // Category chips: only show cats that have saved jobs.
  const catChips = useMemo(() => {
    const set = new Set(saved.map((j) => j.cat));
    return ["all", ...Array.from(set)];
  }, [saved]);

  const onUnsave = (id) => setSaved((s) => s.filter((j) => j.id !== id));
  const onApply = (id) => setApplied((a) => a.includes(id) ? a : [...a, id]);

  return (
    <div style={{ width: W, height: H, background: P.bg, color: P.ink, fontFamily: FONT, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${P.rule}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RobosLogo accent={P.ink} size={24}/>
          <span style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-.015em" }}>RobosGig</span>
        </div>
        <div style={{ display: "flex", gap: 22, fontSize: 12.5 }}>
          <span style={{ color: P.muted }}>Browse jobs</span>
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

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 40px 28px", boxSizing: "border-box" }}>
          {/* Hero */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 32, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: P.muted, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Saved jobs</div>
              <h1 style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-.035em", margin: 0, lineHeight: 1.02, color: P.ink }}>
                Your shortlist<span style={{ color: P.accentText }}>.</span>
              </h1>
              <div style={{ fontSize: 14, color: P.muted, marginTop: 12, maxWidth: 540, lineHeight: 1.55 }}>
                Jobs you've bookmarked. They stay here until you apply, the client closes them, or you remove them.
              </div>
            </div>
            {/* Stat strip */}
            <div style={{ display: "flex", gap: 0, background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14, padding: "12px 0", flexShrink: 0 }}>
              {[
                { label: "Saved",   value: stats.total,  tone: P.ink },
                { label: "Urgent",  value: stats.urgent, tone: stats.urgent ? "#DC2626" : P.ink },
                { label: "Nearby",  value: stats.near,   tone: P.ink, suffix: " <1km" },
                { label: "Avg pay", value: `€${stats.avgPay}`, tone: P.ink },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  padding: "0 22px",
                  borderRight: i < arr.length - 1 ? `1px solid ${P.rule}` : "none",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 500, color: s.tone, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>
                    {s.value}{s.suffix && <span style={{ fontSize: 10, color: P.sub, fontWeight: 400, marginLeft: 2 }}>{s.suffix}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: P.sub, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar: category chips + sort */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {catChips.map((k) => {
                const active = catFilter === k;
                const count = k === "all" ? saved.length : saved.filter((j) => j.cat === k).length;
                return (
                  <button key={k} onClick={() => setCatFilter(k)} style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999,
                    border: `1px solid ${active ? P.ink : P.rule}`,
                    background: active ? P.ink : P.panel,
                    color: active ? "#fff" : P.ink,
                    fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: "pointer", transition: "all .12s",
                  }}>
                    {k !== "all" && <span style={{ width: 6, height: 6, borderRadius: 3, background: CATS[k].color }}/>}
                    {k === "all" ? "All saved" : CATS[k].label}
                    <span style={{ fontSize: 10.5, color: active ? "rgba(255,255,255,.6)" : P.sub, marginLeft: 2, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 12px", border: `1px solid ${P.rule}`, borderRadius: 999, background: P.panel }}>
              <SortIcon size={12}/>
              <span style={{ fontSize: 11, color: P.muted, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 500 }}>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  border: "none", background: "transparent", fontFamily: FONT, fontSize: 12.5, color: P.ink,
                  fontWeight: 500, cursor: "pointer", outline: "none", paddingRight: 4,
                }}
              >
                <option value="recent">Recently saved</option>
                <option value="pay-high">Pay (highest)</option>
                <option value="distance">Distance</option>
                <option value="urgent">Urgent first</option>
              </select>
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            saved.length === 0 ? <EmptyState/> : (
              <div style={{ padding: 32, textAlign: "center", color: P.muted, fontSize: 13, background: P.panel, border: `1px solid ${P.rule}`, borderRadius: 14 }}>
                No saved jobs in this category. Try "All saved".
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((job) => (
                <SavedJobCard
                  key={job.id}
                  job={job}
                  applied={applied.includes(job.id)}
                  onUnsave={onUnsave}
                  onApply={onApply}
                />
              ))}
            </div>
          )}

          {/* Tip strip */}
          {filtered.length > 0 && (
            <div style={{
              marginTop: 24, padding: "14px 18px", borderRadius: 12, background: "#F0FAE0",
              border: `1px solid rgba(132,204,22,.3)`, display: "flex", alignItems: "center", gap: 12,
              fontSize: 12.5, color: P.accentText,
            }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ flex: 1, lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>Pro tip:</strong> Saved jobs get filled fast in Vienna — apply within an hour of posting for a <span style={{ fontVariantNumeric: "tabular-nums" }}>2.4×</span> higher booking rate.
              </span>
              <button style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${P.accentText}`, background: "transparent", color: P.accentText, fontFamily: FONT, fontSize: 11.5, fontWeight: 500, cursor: "pointer" }}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ height: 28, borderTop: `1px solid ${P.rule}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, color: P.sub, fontSize: 11.5, fontFamily: MONO, fontVariantNumeric: "tabular-nums", flexShrink: 0, background: P.panel }}>
        <span>saved · {filtered.length}/{saved.length}</span><span>·</span>
        <span>{stats.urgent} urgent</span><span>·</span>
        <span>avg €{stats.avgPay}</span>
        <span style={{ marginLeft: "auto" }}>RobosGig · Worker · v2.4</span>
      </div>
    </div>
  );
}
