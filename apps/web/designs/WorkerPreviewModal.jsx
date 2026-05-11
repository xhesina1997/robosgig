// WorkerPreviewModal.jsx — RobosGig
// Modal shown to a client when they tap a worker's avatar/name on a job application.
// Single self-contained JSX module. No imports beyond React.
// Default-exports <WorkerPreviewModal />.
//
// Usage:
//   <WorkerPreviewModal
//     open={showModal}
//     worker={selectedWorker}
//     onClose={() => setShowModal(false)}
//     onAccept={(w) => acceptApplication(w)}
//     onMessage={(w) => openChat(w)}
//     onSave={(w) => toggleSaved(w)}
//   />
//
// If `worker` is omitted the component renders the demo "ches veliu" record
// so it can be dropped in standalone for design review.

import React, { useEffect, useState } from "react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const FONT = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';

const P = {
  bg: "#FAFAFA", panel: "#FFFFFF", ink: "#0A0A0A",
  muted: "#737373", sub: "#A3A3A3", rule: "#E8E8E5",
  accent: "#84CC16", accentText: "#4D7C0F", accentBg: "#F0FAE0",
  soft: "#F5F5F3", positive: "#15803D",
  rateBg: "#EEF0FF", rateBr: "#C7D2FE", rateInk: "#3F3BC4",
};

// ─── Demo worker (used if no `worker` prop is passed) ───────────────────────
const DEMO_WORKER = {
  initials: "cv",
  name: "ches veliu",
  verified: true,
  online: true,
  jobs: 0,
  city: "Tirana",
  distanceKm: 1.2,
  rate: 20,
  age: 18,
  languages: ["EN", "DE", "SQ"],
  responseMin: 12,
  joined: "Apr 2026",
  acceptance: 100,
  acceptanceMeta: "1 / 1 offered",
  rating: null,
  reviewsCount: 0,
  about: "i am the best there is",
  skills: [
    { label: "Deep cleaning",      color: "#10B981" },
    { label: "Lamp installation",  color: "#F59E0B" },
    { label: "Furniture assembly", color: "#737373" },
    { label: "Drain unblocking",   color: "#3B82F6" },
  ],
  application: {
    proposedRate: 12,
    vsOwnRatePct: -40,
    quote: "i can do this",
    appliedAgo: "14 min ago",
    canStart: "today, 16:00",
    eta: "45–75 min",
  },
  reviews: [], // empty → renders empty state
};

// ─── Inline icons ───────────────────────────────────────────────────────────
const Ico = {
  check: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7"/>
    </svg>
  ),
  close: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6 18 18M6 18 18 6"/>
    </svg>
  ),
  jobs: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4h8v2"/>
    </svg>
  ),
  pin: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  lang: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7h13M3 7h2M8 12h13M3 12h2M8 17h13M3 17h2"/>
    </svg>
  ),
  bookmark: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12v17l-6-4-6 4z"/>
    </svg>
  ),
  bookmarkFill: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12v17l-6-4-6 4z"/>
    </svg>
  ),
  chat: (s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>
    </svg>
  ),
  arrow: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  clock: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2"/>
    </svg>
  ),
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function WorkerPreviewModal({
  open = true,
  worker,
  onClose = () => {},
  onAccept = () => {},
  onMessage = () => {},
  onSave = () => {},
}) {
  const w = worker || DEMO_WORKER;
  const [saved, setSaved] = useState(false);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => { setSaved((s) => !s); onSave(w); };

  return (
    <div
      style={mpStyles.root}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wpm-name"
      onClick={onClose}
    >
      <div style={mpStyles.scrim} aria-hidden="true" />
      <div style={mpStyles.modal} onClick={(e) => e.stopPropagation()}>

        {/* ─── Header ───────────────────────────── */}
        <div style={mpStyles.head}>
          <div style={mpStyles.av}>
            {w.initials || w.name?.split(" ").map((s) => s[0]).join("").slice(0,2).toLowerCase()}
            {w.online && <span style={mpStyles.online} title="Online now" />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={mpStyles.nameRow}>
              <span id="wpm-name" style={mpStyles.name}>{w.name}</span>
              {w.verified && (
                <span style={mpStyles.verified}>
                  {Ico.check(11)} Verified
                </span>
              )}
            </div>

            <div style={mpStyles.chips}>
              <Chip icon={Ico.jobs(11)}>{w.jobs} jobs</Chip>
              <Chip icon={Ico.pin(11)}>
                {w.city}{w.distanceKm ? ` · ${w.distanceKm} km` : ""}
              </Chip>
              <Chip variant="rate">€{w.rate}/hr</Chip>
              <Chip>{w.age} yrs old</Chip>
              {w.languages?.length > 0 && (
                <Chip icon={Ico.lang(11)}>{w.languages.join(" · ")}</Chip>
              )}
            </div>

            <div style={mpStyles.available}>
              <span style={mpStyles.dot} />
              Available now{w.responseMin ? ` · responds in ~${w.responseMin} min` : ""}
            </div>
          </div>

          <button style={mpStyles.close} onClick={onClose} aria-label="Close">
            {Ico.close(14)}
          </button>
        </div>

        {/* ─── Trust strip ──────────────────────── */}
        <div style={mpStyles.trust}>
          <TrustCell
            k="Rating"
            v={w.rating ? <>{w.rating} <span style={{ color: P.accent, fontSize: 13 }}>★</span></> : <>— <span style={{ color: P.accent, fontSize: 13 }}>★</span></>}
            s={w.reviewsCount ? `${w.reviewsCount} reviews` : "no reviews yet"}
            first
          />
          <TrustCell
            k="Acceptance"
            v={`${w.acceptance}%`}
            s={w.acceptanceMeta}
          />
          <TrustCell
            k="Response"
            v={`~ ${w.responseMin}m`}
            s="avg first reply"
          />
          <TrustCell
            k="Joined"
            v={w.joined}
            s="new on RobosGig"
          />
        </div>

        {/* ─── Body (scrollable) ─────────────────── */}
        <div style={mpStyles.body}>

          {/* Application */}
          {w.application && (
            <Section label="Their application">
              <div style={mpStyles.app}>
                <div style={mpStyles.appRow}>
                  <span style={mpStyles.appK}>Proposed price</span>
                  <span style={mpStyles.appV}>
                    €{w.application.proposedRate}/hr
                    {typeof w.application.vsOwnRatePct === "number" && (
                      <span style={mpStyles.appVs}>
                        {w.application.vsOwnRatePct > 0 ? "+" : ""}
                        {w.application.vsOwnRatePct}% vs their rate
                      </span>
                    )}
                  </span>
                </div>
                {w.application.quote && (
                  <div style={mpStyles.quote}>"{w.application.quote}"</div>
                )}
                <div style={mpStyles.appMeta}>
                  {w.application.appliedAgo && <span>applied {w.application.appliedAgo}</span>}
                  {w.application.canStart && (<><span style={mpStyles.appSep}>·</span><span>can start: {w.application.canStart}</span></>)}
                  {w.application.eta && (<><span style={mpStyles.appSep}>·</span><span>est. {w.application.eta}</span></>)}
                </div>
              </div>
            </Section>
          )}

          {/* About */}
          {w.about && (
            <Section label="About">
              <div style={mpStyles.aboutText}>{w.about}</div>
            </Section>
          )}

          {/* Skills */}
          {w.skills?.length > 0 && (
            <Section label="Skills">
              <div style={mpStyles.skills}>
                {w.skills.map((s) => (
                  <span key={s.label} style={mpStyles.skill}>
                    <span style={{ ...mpStyles.skillDot, background: s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Reviews */}
          <Section
            label="Reviews"
            right={(
              <span style={{ fontSize: 11, color: P.sub, fontFamily: MONO }}>
                {w.reviewsCount} reviews
              </span>
            )}
          >
            {w.reviews && w.reviews.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {w.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
              </div>
            ) : (
              <div style={mpStyles.empty}>
                <span style={{ flexShrink: 0, color: P.sub, marginTop: 1 }}>{Ico.clock(16)}</span>
                <div>
                  <div style={{ color: P.ink, fontWeight: 500, fontSize: 13 }}>
                    No reviews yet
                  </div>
                  <div style={{ marginTop: 3 }}>
                    This worker is building their reputation. Verified ID + accepted
                    application — RobosGig holds payment in escrow until you confirm
                    the job is done.
                  </div>
                </div>
              </div>
            )}
          </Section>

        </div>

        {/* ─── Action footer ────────────────────── */}
        <div style={mpStyles.foot}>
          <button
            style={{
              ...mpStyles.btnIcon,
              color: saved ? P.accentText : P.muted,
              background: saved ? P.accentBg : P.panel,
              borderColor: saved ? "#D6EAA0" : P.rule,
            }}
            onClick={handleSave}
            aria-label={saved ? "Saved" : "Save for later"}
            title={saved ? "Saved" : "Save for later"}
          >
            {saved ? Ico.bookmarkFill(14) : Ico.bookmark(14)}
          </button>
          <button style={mpStyles.btnGhost} onClick={() => onMessage(w)}>
            {Ico.chat(13)} Message
          </button>
          <button style={mpStyles.btnPrimary} onClick={() => onAccept(w)}>
            Accept €{w.application?.proposedRate ?? w.rate}/hr {Ico.arrow(14)}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Small subcomponents ────────────────────────────────────────────────────
function Chip({ children, icon, variant }) {
  const isRate = variant === "rate";
  return (
    <span style={{
      ...mpStyles.chip,
      ...(isRate ? mpStyles.chipRate : null),
    }}>
      {icon && <span style={mpStyles.chipIc}>{icon}</span>}
      {children}
    </span>
  );
}

function TrustCell({ k, v, s, first }) {
  return (
    <div style={{
      ...mpStyles.trustCell,
      borderLeft: first ? "none" : `1px solid ${P.rule}`,
      paddingLeft: first ? 0 : 12,
    }}>
      <span style={mpStyles.trustK}>{k}</span>
      <span style={mpStyles.trustV}>{v}</span>
      <span style={mpStyles.trustS}>{s}</span>
    </div>
  );
}

function Section({ label, right, children }) {
  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 10,
      }}>
        <div style={mpStyles.lbl}>{label}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div style={mpStyles.review}>
      <div style={mpStyles.reviewH}>
        <span style={mpStyles.reviewWho}>
          <span style={{ ...mpStyles.reviewAv, background: review.color || "#737373" }}>
            {review.initials}
          </span>
          <span style={mpStyles.reviewNm}>{review.name}</span>
          {review.cat && <span style={mpStyles.reviewCat}>· {review.cat}</span>}
        </span>
        <span style={mpStyles.reviewRating}>
          <span style={{ color: P.accent }}>★</span> {review.rating}
          <span style={{ color: P.sub, marginLeft: 6, fontFamily: MONO }}>{review.date}</span>
        </span>
      </div>
      <div style={mpStyles.reviewBody}>{review.body}</div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const mpStyles = {
  root: {
    position: "fixed", inset: 0, zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 20px",
    fontFamily: FONT,
  },
  scrim: {
    position: "absolute", inset: 0,
    background: "rgba(10,10,10,.45)",
    backdropFilter: "blur(2px)",
    WebkitBackdropFilter: "blur(2px)",
  },

  modal: {
    position: "relative", zIndex: 1,
    width: 560, maxWidth: "100%",
    background: P.panel,
    borderRadius: 18,
    boxShadow: "0 30px 80px rgba(10,10,10,.25), 0 8px 22px rgba(10,10,10,.10)",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
    maxHeight: "90vh",
    color: P.ink,
  },

  // Header
  head: {
    padding: "22px 24px 18px",
    display: "flex", gap: 16, alignItems: "flex-start",
    borderBottom: `1px solid ${P.rule}`,
  },
  av: {
    position: "relative", width: 72, height: 72, borderRadius: 999,
    background: "#0A0A0A", color: "#fff",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em",
    flexShrink: 0,
  },
  online: {
    position: "absolute", right: 1, bottom: 3,
    width: 14, height: 14, borderRadius: 999,
    background: P.accent, border: `3px solid ${P.panel}`,
  },
  nameRow: {
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
  },
  name: {
    fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em",
    color: P.ink, lineHeight: 1.1,
  },
  verified: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 999,
    background: P.accentBg, color: P.accentText,
    fontSize: 11.5, fontWeight: 600,
  },
  chips: {
    display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10,
  },
  chip: {
    padding: "4px 10px", borderRadius: 999,
    border: `1px solid ${P.rule}`, background: P.panel,
    fontSize: 12, color: P.ink,
    display: "inline-flex", alignItems: "center", gap: 5,
  },
  chipRate: {
    borderColor: P.rateBr, background: P.rateBg, color: P.rateInk,
    fontFamily: MONO, fontWeight: 500,
  },
  chipIc: {
    color: P.muted, display: "inline-flex", alignItems: "center",
  },
  available: {
    marginTop: 10, fontSize: 12.5, color: P.positive,
    display: "inline-flex", alignItems: "center", gap: 5,
    fontWeight: 500,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    background: P.positive, boxShadow: "0 0 6px rgba(21,128,61,.5)",
  },
  close: {
    flexShrink: 0, width: 34, height: 34, borderRadius: 999,
    border: `1px solid ${P.rule}`, background: P.soft,
    color: P.muted, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontFamily: FONT,
  },

  // Trust strip
  trust: {
    padding: "14px 24px",
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    borderBottom: `1px solid ${P.rule}`,
    background: "#FCFCFA",
  },
  trustCell: {
    display: "flex", flexDirection: "column", gap: 2,
    paddingRight: 12,
  },
  trustK: {
    fontSize: 10, color: P.muted,
    letterSpacing: "0.12em", textTransform: "uppercase",
    fontWeight: 500,
  },
  trustV: {
    fontSize: 15, color: P.ink, fontWeight: 500,
    fontFamily: MONO, fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em", lineHeight: 1.2,
  },
  trustS: { fontSize: 10.5, color: P.sub },

  // Body
  body: {
    padding: "18px 24px 20px",
    display: "flex", flexDirection: "column", gap: 18,
    overflowY: "auto",
  },
  lbl: {
    fontSize: 10.5, color: P.muted,
    letterSpacing: "0.14em", textTransform: "uppercase",
    fontWeight: 500,
  },

  // Application
  app: {
    padding: "16px 18px",
    border: `1px solid ${P.rule}`, borderRadius: 12,
    background: P.soft,
  },
  appRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  appK: { fontSize: 13.5, color: P.ink },
  appV: {
    fontSize: 18, fontWeight: 600, color: P.ink,
    fontFamily: MONO, fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
  },
  appVs: {
    fontSize: 11, color: P.positive,
    fontFamily: FONT, fontWeight: 500, marginLeft: 6,
  },
  quote: {
    marginTop: 12, paddingLeft: 12,
    borderLeft: `2px solid ${P.accent}`,
    fontStyle: "italic", fontSize: 13.5,
    color: "#404040", lineHeight: 1.55,
  },
  appMeta: {
    marginTop: 10, fontSize: 11.5, color: P.muted,
    fontFamily: MONO,
    display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
  },
  appSep: { color: P.rule },

  // About
  aboutText: { fontSize: 14, color: P.ink, lineHeight: 1.55 },

  // Skills
  skills: { display: "flex", flexWrap: "wrap", gap: 6 },
  skill: {
    padding: "5px 11px", borderRadius: 999,
    border: `1px solid ${P.rule}`, background: P.panel,
    fontSize: 12, color: P.ink,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  skillDot: { width: 5, height: 5, borderRadius: 3 },

  // Reviews
  review: {
    padding: "12px 14px",
    border: `1px solid ${P.rule}`, borderRadius: 10,
    display: "flex", flexDirection: "column", gap: 6,
  },
  reviewH: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  reviewWho: {
    display: "inline-flex", alignItems: "center", gap: 8,
  },
  reviewAv: {
    width: 24, height: 24, borderRadius: 999,
    color: "#fff", fontSize: 10, fontWeight: 600,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
  reviewNm: { fontSize: 12, color: P.ink, fontWeight: 500 },
  reviewCat: {
    fontSize: 10.5, color: P.muted,
    textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500,
  },
  reviewRating: {
    fontSize: 11.5, color: P.ink,
    display: "inline-flex", alignItems: "center", gap: 3,
  },
  reviewBody: { fontSize: 12.5, color: "#404040", lineHeight: 1.5 },

  // Empty state
  empty: {
    padding: "14px 16px",
    border: `1px dashed ${P.rule}`, borderRadius: 10,
    fontSize: 12.5, color: P.muted, lineHeight: 1.5,
    background: "#FCFCFA",
    display: "flex", gap: 10, alignItems: "flex-start",
  },

  // Footer / actions
  foot: {
    padding: "16px 24px",
    borderTop: `1px solid ${P.rule}`,
    display: "flex", gap: 8,
    background: P.panel,
  },
  btnGhost: {
    flex: "0 0 auto",
    padding: "11px 16px", borderRadius: 10,
    border: `1px solid ${P.rule}`, background: P.panel,
    fontFamily: FONT, fontSize: 13, color: P.ink,
    cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8,
  },
  btnPrimary: {
    flex: 1,
    padding: "11px 18px", borderRadius: 10,
    border: "none", background: P.ink, color: "#fff",
    fontFamily: FONT, fontSize: 13, fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnIcon: {
    padding: "11px 12px", borderRadius: 10,
    border: `1px solid ${P.rule}`, background: P.panel,
    color: P.muted, cursor: "pointer",
    fontFamily: FONT,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
};
