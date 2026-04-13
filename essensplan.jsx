import { useState, useEffect } from "react";
import { signInWithGoogle, signOutUser } from "./src/firebase.js";
import { usePlanAccess } from "./src/usePlanAccess.js";
import { useMealPlan } from "./src/useMealPlan.js";
import { WeekView } from "./src/WeekView.jsx";
import { EditOverlay } from "./src/EditOverlay.jsx";
import { formatDate } from "./src/utils.js";
import { navBtnStyle, pillBtnStyle } from "./src/styles.js";

const fontLink = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap";

function FullscreenCenter({ children }) {
  return (
    <>
      <link href={fontLink} rel="stylesheet" />
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        color: "var(--text-primary, #1a1a2e)",
        background: "var(--bg-base, #faf9f6)",
        padding: 24,
        textAlign: "center",
      }}>
        {children}
      </div>
    </>
  );
}

// ── Kein-Plan-Screen ──────────────────────────────────────────────────────────
function NoPlanScreen({ onCreatePlan, onJoinPlan, accessDenied }) {
  const [tab, setTab]         = useState("create"); // "create" | "join"
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(false);

  async function handleCreate() {
    if (!nameInput.trim()) return;
    setBusy(true); setError(null);
    try { await onCreatePlan(nameInput); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleJoin() {
    if (!codeInput.trim()) return;
    setBusy(true); setError(null);
    try { await onJoinPlan(codeInput); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1.5px solid rgba(0,0,0,0.1)",
    background: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 10,
  };

  const btnStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #e07a5f, #f2cc8f)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    opacity: busy ? 0.5 : 1,
  };

  return (
    <FullscreenCenter>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>
        🍳 Saucepan
      </h1>
      <p style={{ fontSize: 14, opacity: 0.45, margin: "0 0 32px" }}>
        {accessDenied ? "Kein Zugriff auf den gespeicherten Plan." : "Kein Essensplan gefunden."}
      </p>

      {/* Tab-Auswahl */}
      <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.05)", borderRadius: 12, padding: 4, marginBottom: 24, width: "100%", maxWidth: 320 }}>
        {[["create", "Neuer Plan"], ["join", "Beitreten"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setError(null); }} style={{
            flex: 1, padding: "8px 12px", borderRadius: 9, border: "none",
            background: tab === key ? "#fff" : "transparent",
            fontWeight: tab === key ? 600 : 400,
            fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            color: "var(--text-primary, #1a1a2e)",
            cursor: "pointer",
            boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 320, textAlign: "left" }}>
        {tab === "create" ? (
          <>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Name des Plans, z.B. Familie Böcker"
              style={inputStyle}
              autoFocus
            />
            <button onClick={handleCreate} disabled={busy || !nameInput.trim()} style={btnStyle}>
              {busy ? "Wird erstellt…" : "Plan erstellen"}
            </button>
          </>
        ) : (
          <>
            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              placeholder="Einladungscode (z.B. X4K9QM)"
              style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: 2, fontSize: 18 }}
              autoFocus
            />
            <button onClick={handleJoin} disabled={busy || !codeInput.trim()} style={btnStyle}>
              {busy ? "Wird beigetreten…" : "Plan beitreten"}
            </button>
          </>
        )}
        {error && (
          <p style={{ color: "#e07a5f", fontSize: 13, marginTop: 10, textAlign: "center" }}>{error}</p>
        )}
      </div>
    </FullscreenCenter>
  );
}

// ── Plan-Info-Overlay ─────────────────────────────────────────────────────────
function PlanInfoOverlay({ planName, planId, onLeave, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(planId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg-base, #faf9f6)",
        borderRadius: "20px 20px 0 0",
        padding: "24px 20px 40px",
        width: "100%",
        maxWidth: 520,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.15)", margin: "0 auto 20px" }} />
        <p style={{ fontSize: 12, opacity: 0.45, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Essensplan</p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, margin: "0 0 20px" }}>
          {planName || "Mein Plan"}
        </h2>

        <p style={{ fontSize: 13, opacity: 0.5, margin: "0 0 8px" }}>Einladungscode</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
            background: "rgba(224,122,95,0.08)",
            padding: "10px 16px",
            borderRadius: 12,
            flex: 1,
            textAlign: "center",
          }}>{planId}</span>
          <button onClick={copyCode} style={{
            padding: "12px 16px", borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            background: copied ? "rgba(224,122,95,0.1)" : "transparent",
            fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", color: "#e07a5f",
          }}>
            {copied ? "Kopiert ✓" : "Kopieren"}
          </button>
        </div>

        <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 24 }}>
          Teile diesen Code, damit andere Familienmitglieder diesem Plan beitreten können.
        </p>

        <button onClick={onLeave} style={{
          width: "100%", padding: "13px",
          borderRadius: 12, border: "1px solid rgba(224,122,95,0.3)",
          background: "transparent", color: "#e07a5f",
          fontSize: 14, fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
        }}>
          Plan verlassen
        </button>
      </div>
    </div>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
export default function MealPlanner() {
  const { user, planId, loading: planLoading, createPlan, joinPlan, leavePlan } = usePlanAccess();
  const {
    loading: dataLoading, syncStatus, accessDenied,
    planName,
    weekPlan, weekDates, kw,
    recipes,
    setMeal, removeMeal, navigateWeek, goToToday,
  } = useMealPlan(user, planId);

  const [editingDay, setEditingDay]     = useState(null);
  const [showPlanInfo, setShowPlanInfo] = useState(false);

  useEffect(() => {
    if (accessDenied) leavePlan();
  }, [accessDenied]);

  const loading = planLoading || (!!planId && dataLoading);

  if (loading || user === undefined) {
    return (
      <FullscreenCenter>
        <p style={{ fontSize: 18, opacity: 0.6 }}>Lade Essensplan…</p>
      </FullscreenCenter>
    );
  }

  if (!user) {
    return (
      <FullscreenCenter>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 700, margin: "0 0 8px" }}>
          🍳 Saucepan
        </h1>
        <p style={{ fontSize: 15, opacity: 0.5, margin: "0 0 40px" }}>Unser Essensplan</p>
        <button
          onClick={signInWithGoogle}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 24px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #e07a5f, #f2cc8f)",
            cursor: "pointer", fontSize: 15, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", color: "#fff",
            boxShadow: "0 4px 16px rgba(224,122,95,0.3)",
          }}
        >
          Mit Google anmelden
        </button>
      </FullscreenCenter>
    );
  }

  if (!planId || accessDenied) {
    return <NoPlanScreen onCreatePlan={createPlan} onJoinPlan={joinPlan} accessDenied={accessDenied} />;
  }

  return (
    <>
      <link href={fontLink} rel="stylesheet" />
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-base, #faf9f6)",
        fontFamily: "'DM Sans', sans-serif",
        color: "var(--text-primary, #1a1a2e)",
        maxWidth: 520,
        margin: "0 auto",
        padding: "0 16px 80px",
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0,
          background: "var(--bg-base, #faf9f6)",
          zIndex: 20, paddingTop: 20, paddingBottom: 12,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => { navigateWeek(-1); setEditingDay(null); }} style={navBtnStyle}>‹</button>
            <div style={{ textAlign: "center" }}>
              <h1 style={{
                fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700,
                margin: 0, letterSpacing: "-0.5px", color: "var(--text-primary, #1a1a2e)",
              }}>
                KW {kw}
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.5, fontWeight: 400 }}>
                {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
              </p>
            </div>
            <button onClick={() => { navigateWeek(1); setEditingDay(null); }} style={navBtnStyle}>›</button>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => { goToToday(); setEditingDay(null); }} style={pillBtnStyle}>Heute</button>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {syncStatus === "saving" && (
                <span style={{ fontSize: 11, opacity: 0.5 }}>&#x21BB; sync…</span>
              )}
              {syncStatus === "error" && (
                <span style={{ fontSize: 11, color: "#e07a5f" }} title="Sync fehlgeschlagen">&#x26A0; offline</span>
              )}

              {/* Plan-Info-Button */}
              <button
                onClick={() => setShowPlanInfo(true)}
                title="Plan-Einstellungen"
                style={{
                  padding: "4px 8px", borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "transparent", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  fontFamily: "monospace", letterSpacing: 1,
                  color: "rgba(0,0,0,0.35)",
                }}
              >
                {planId}
              </button>

              {/* Avatar / Abmelden */}
              <button
                onClick={() => { signOutUser(); setEditingDay(null); }}
                title={user.email}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 4px", borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "transparent", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {user.photoURL
                  ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                  : <span style={{ fontSize: 22 }}>👤</span>
                }
              </button>
            </div>
          </div>
        </div>

        <WeekView
          weekPlan={weekPlan}
          weekDates={weekDates}
          recipes={recipes}
          user={user}
          onStartEditing={setEditingDay}
          onRemoveMeal={removeMeal}
        />
      </div>

      <EditOverlay
        editingDay={editingDay}
        weekDates={weekDates}
        weekPlan={weekPlan}
        recipes={recipes}
        onSave={(day, ...args) => { setMeal(day, ...args); setEditingDay(null); }}
        onClose={() => setEditingDay(null)}
      />

      {showPlanInfo && (
        <PlanInfoOverlay
          planName={planName}
          planId={planId}
          onLeave={async () => { await leavePlan(); setShowPlanInfo(false); }}
          onClose={() => setShowPlanInfo(false)}
        />
      )}
    </>
  );
}
