import { DAYS, isToday } from "./utils.js";

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "Rezept"; }
}

function linkHref(link) { return typeof link === "string" ? link : link.url; }
function linkLabel(link) {
  if (typeof link === "string") return getDomain(link);
  return link.label || getDomain(link.url);
}

export function WeekView({ weekPlan, weekDates, recipes, user, onStartEditing, onRemoveMeal }) {
  return (
    <div style={{ marginTop: 16 }}>
      {DAYS.map((day, i) => {
        const entry = weekPlan[day];
        const recipe = entry?.recipeId ? recipes[entry.recipeId] : null;
        const date = weekDates[i];
        const today = isToday(date);
        const hasMeal = !!recipe;

        return (
          <div
            key={day}
            onClick={() => user && onStartEditing(day)}
            style={{
              marginBottom: 6,
              borderRadius: 14,
              background: today
                ? "linear-gradient(135deg, rgba(224,122,95,0.08), rgba(242,204,143,0.08))"
                : "rgba(255,255,255,0.6)",
              border: today
                ? "1.5px solid rgba(224,122,95,0.25)"
                : "1px solid rgba(0,0,0,0.04)",
              overflow: "hidden",
              cursor: user ? "pointer" : "default",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}>
              {/* Day indicator */}
              <div style={{ minWidth: 44, textAlign: "center" }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  opacity: 0.4,
                  lineHeight: 1,
                }}>{day.slice(0, 2)}</div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "'Fraunces', serif",
                  color: today ? "#e07a5f" : "var(--text-primary, #1a1a2e)",
                  lineHeight: 1.3,
                }}>{date.getDate()}</div>
              </div>

              {/* Meal content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {hasMeal ? (
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>
                      {recipe.emoji && <span style={{ marginRight: 6 }}>{recipe.emoji}</span>}
                      {recipe.name}
                      {recipe.kidFav && (
                        <span style={{
                          marginLeft: 6,
                          fontSize: 11,
                          background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
                          padding: "2px 6px",
                          borderRadius: 8,
                          verticalAlign: "middle",
                        }}>👶</span>
                      )}
                    </span>
                    {recipe.note && (
                      <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{recipe.note}</div>
                    )}
                    {recipe.links?.map((link, idx) => (
                      <a
                        key={idx}
                        href={linkHref(link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          fontSize: 11,
                          color: "#e07a5f",
                          textDecoration: "none",
                          marginTop: 2,
                          marginRight: 8,
                          display: "inline-block",
                        }}
                      >
                        🔗 {linkLabel(link)}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 14, opacity: 0.3, fontStyle: "italic" }}>
                    {user ? "Tippe zum Planen..." : ""}
                  </span>
                )}
              </div>

              {user && hasMeal && (
                <button
                  onClick={e => { e.stopPropagation(); onRemoveMeal(day); }}
                  style={{ background: "none", border: "none", fontSize: 16, opacity: 0.2, cursor: "pointer", padding: "4px 8px" }}
                >✕</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
