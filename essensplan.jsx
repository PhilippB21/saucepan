import { useState } from "react";
import { signInWithGoogle, signOutUser } from "./src/firebase.js";
import { useMealPlan } from "./src/useMealPlan.js";
import { WeekView } from "./src/WeekView.jsx";
import { EditOverlay } from "./src/EditOverlay.jsx";
import { formatDate } from "./src/utils.js";
import { navBtnStyle, pillBtnStyle } from "./src/styles.js";

export default function MealPlanner() {
  const {
    loading, user, syncStatus,
    weekPlan, weekDates, kw,
    recipes,
    setMeal, removeMeal, navigateWeek, goToToday,
  } = useMealPlan();

  const [editingDay, setEditingDay] = useState(null);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        color: "var(--text-primary, #1a1a2e)",
        background: "var(--bg-base, #faf9f6)",
      }}>
        <p style={{ fontSize: 18, opacity: 0.6 }}>Lade Essensplan...</p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap" rel="stylesheet" />
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
              {user === undefined ? null : user ? (
                <button
                  onClick={() => { signOutUser(); setEditingDay(null); }}
                  title={user.displayName || user.email}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "var(--text-primary, #1a1a2e)",
                  }}
                >
                  {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 18, height: 18, borderRadius: "50%" }} />}
                  Abmelden
                </button>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "none",
                    background: "linear-gradient(135deg, #e07a5f, #f2cc8f)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#fff",
                  }}
                >
                  Anmelden
                </button>
              )}
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
