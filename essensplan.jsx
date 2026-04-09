import { useState } from "react";
import { signInWithGoogle, signOutUser } from "./src/firebase.js";
import { useMealPlan } from "./src/useMealPlan.js";
import { WeekView } from "./src/WeekView.jsx";
import { EditOverlay } from "./src/EditOverlay.jsx";
import { formatDate } from "./src/utils.js";
import { navBtnStyle, pillBtnStyle } from "./src/styles.js";

const ALLOWED_EMAILS = ["boecker.philipp@googlemail.com", "sarahmeyer1988@gmail.com"];

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

export default function MealPlanner() {
  const {
    loading, user, syncStatus,
    weekPlan, weekDates, kw,
    recipes,
    setMeal, removeMeal, navigateWeek, goToToday,
  } = useMealPlan();

  const [editingDay, setEditingDay] = useState(null);

  if (loading || user === undefined) {
    return (
      <FullscreenCenter>
        <p style={{ fontSize: 18, opacity: 0.6 }}>Lade Essensplan...</p>
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
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 24px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #e07a5f, #f2cc8f)",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(224,122,95,0.3)",
          }}
        >
          Mit Google anmelden
        </button>
      </FullscreenCenter>
    );
  }

  if (!ALLOWED_EMAILS.includes(user.email)) {
    return (
      <FullscreenCenter>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🚫</p>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
          Kein Zugriff
        </h2>
        <p style={{ fontSize: 14, opacity: 0.5, margin: "0 0 32px" }}>
          {user.email} ist nicht berechtigt.
        </p>
        <button
          onClick={signOutUser}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            background: "transparent",
            cursor: "pointer",
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            color: "var(--text-primary, #1a1a2e)",
          }}
        >
          Anderes Konto verwenden
        </button>
      </FullscreenCenter>
    );
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
          position: "sticky",
          top: 0,
          background: "var(--bg-base, #faf9f6)",
          zIndex: 20,
          paddingTop: 20,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => { navigateWeek(-1); setEditingDay(null); }} style={navBtnStyle}>‹</button>
            <div style={{ textAlign: "center" }}>
              <h1 style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 26,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.5px",
                color: "var(--text-primary, #1a1a2e)",
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
                <span style={{ fontSize: 11, opacity: 0.5 }}>&#x21BB; sync...</span>
              )}
              {syncStatus === "error" && (
                <span style={{ fontSize: 11, color: "#e07a5f" }} title="Sync fehlgeschlagen">&#x26A0; offline</span>
              )}
              <button
                onClick={() => { signOutUser(); setEditingDay(null); }}
                title={user.email}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 4px",
                  borderRadius: 20,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {user.photoURL
                  ? <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
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
    </>
  );
}
