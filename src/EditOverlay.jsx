import { useState, useEffect } from "react";
import { DAYS, formatDate } from "./utils.js";
import { navBtnStyle, pillBtnStyle, actionBtnStyle } from "./styles.js";

const ALL_TAGS = ["alle", "👶 kids", "schnell", "vegan", "vegetarisch", "pasta", "suppe", "ofen", "comfort", "asiatisch", "gekocht"];

export function EditOverlay({ editingDay, weekDates, weekPlan, recipes, onSave, onClose }) {
  const [inputValue, setInputValue] = useState("");
  const [emojiValue, setEmojiValue] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [linkValues, setLinkValues] = useState([""]);
  const [kidFavorite, setKidFavorite] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("alle");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);

  // Populate form when opening a day
  useEffect(() => {
    if (!editingDay) return;
    const entry = weekPlan[editingDay];
    const recipe = entry?.recipeId ? recipes[entry.recipeId] : null;
    setInputValue(recipe?.name || "");
    setEmojiValue(recipe?.emoji || "");
    setNoteValue(recipe?.note || "");
    setLinkValues(recipe?.links?.length ? recipe.links : [""]);
    setKidFavorite(recipe?.kidFav || false);
    setShowSuggestions(false);
    setShowAutocomplete(false);
    setSuggestionFilter("alle");
  }, [editingDay]);

  const autocompleteMatches = showAutocomplete && inputValue.trim().length > 0
    ? Object.values(recipes)
        .filter(r => r.name.toLowerCase().includes(inputValue.toLowerCase()))
        .sort((a, b) => {
          const aStarts = a.name.toLowerCase().startsWith(inputValue.toLowerCase());
          const bStarts = b.name.toLowerCase().startsWith(inputValue.toLowerCase());
          if (aStarts !== bStarts) return aStarts ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 7)
    : [];

  function applyAutocomplete(recipe) {
    setInputValue(recipe.name);
    setEmojiValue(recipe.emoji || "");
    setLinkValues(recipe.links?.length ? recipe.links : [""]);
    setNoteValue(recipe.note || "");
    setKidFavorite(!!recipe.kidFav);
    setShowAutocomplete(false);
  }

  function getSuggestions() {
    const usedIds = new Set(Object.values(weekPlan).map(v => v?.recipeId).filter(Boolean));
    const tags = suggestionFilter === "alle" ? null : suggestionFilter;

    let pool = Object.entries(recipes)
      .filter(([id]) => !usedIds.has(id))
      .map(([id, r]) => ({ id, ...r }));

    if (tags === "👶 kids") pool = pool.filter(r => r.kidFav);
    else if (tags === "gekocht") pool = pool.filter(r => r.tags.includes("gekocht"));
    else if (tags) pool = pool.filter(r => r.tags.includes(tags));

    return pool.sort(() => Math.random() - 0.5).slice(0, 6);
  }

  function handleSave() {
    if (!inputValue.trim()) return;
    onSave(editingDay, inputValue.trim(), emojiValue.trim(), noteValue.trim(), linkValues, kidFavorite);
  }

  if (!editingDay) return null;

  const editingDayIndex = DAYS.indexOf(editingDay);
  const editingDate = editingDayIndex >= 0 ? weekDates[editingDayIndex] : null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "var(--bg-base, #faf9f6)",
      fontFamily: "'DM Sans', sans-serif",
      color: "var(--text-primary, #1a1a2e)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "20px 16px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ ...navBtnStyle, fontSize: 26 }}>‹</button>
        <div>
          {editingDate && (
            <div style={{ fontSize: 12, opacity: 0.45, fontWeight: 500, marginBottom: 1 }}>
              {formatDate(editingDate)}
            </div>
          )}
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
            {editingDay}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "24px 16px", flex: 1 }}>
        {/* Emoji + Name */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid rgba(224,122,95,0.3)", paddingBottom: 2 }}>
            <input
              value={emojiValue}
              onChange={e => setEmojiValue(e.target.value)}
              placeholder="🍽️"
              style={{
                width: 48,
                fontSize: 26,
                textAlign: "center",
                border: "none",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 10,
                outline: "none",
                padding: "6px 4px",
                cursor: "text",
                flexShrink: 0,
                fontFamily: "sans-serif",
              }}
            />
            <input
              autoFocus
              value={inputValue}
              onChange={e => {
                setInputValue(e.target.value);
                setShowAutocomplete(true);
                setAutocompleteIndex(0);
              }}
              onKeyDown={e => {
                if (showAutocomplete && autocompleteMatches.length > 0) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setAutocompleteIndex(i => Math.min(i + 1, autocompleteMatches.length - 1));
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setAutocompleteIndex(i => Math.max(i - 1, 0));
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyAutocomplete(autocompleteMatches[autocompleteIndex]);
                    return;
                  }
                  if (e.key === "Escape") {
                    setShowAutocomplete(false);
                    return;
                  }
                }
                if (e.key === "Enter" && inputValue.trim()) handleSave();
                if (e.key === "Escape") onClose();
              }}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
              placeholder="Was wird gekocht?"
              style={{
                flex: 1,
                padding: "14px 0",
                border: "none",
                background: "transparent",
                fontSize: 18,
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                color: "var(--text-primary, #1a1a2e)",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Autocomplete dropdown */}
          {autocompleteMatches.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--bg-base, #faf9f6)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              zIndex: 10,
              overflow: "hidden",
              marginTop: 4,
            }}>
              {autocompleteMatches.map((r, idx) => (
                <div
                  key={r.name}
                  onMouseDown={() => applyAutocomplete(r)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    cursor: "pointer",
                    background: idx === autocompleteIndex ? "rgba(224,122,95,0.08)" : "transparent",
                    borderBottom: idx < autocompleteMatches.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  }}
                  onMouseEnter={() => setAutocompleteIndex(idx)}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{r.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{r.name}</span>
                  {r.kidFav && <span style={{ fontSize: 10, background: "linear-gradient(135deg, #ffecd2, #fcb69f)", padding: "2px 6px", borderRadius: 6, marginLeft: "auto" }}>👶</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        {linkValues.map((lv, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: idx === 0 ? 8 : 4 }}>
            <input
              value={lv}
              onChange={e => {
                const next = [...linkValues];
                next[idx] = e.target.value;
                setLinkValues(next);
              }}
              placeholder="🔗 Rezept-Link (optional)"
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                background: "transparent",
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                color: "var(--text-primary, #1a1a2e)",
                boxSizing: "border-box",
              }}
            />
            {linkValues.length > 1 && (
              <button
                onClick={() => setLinkValues(linkValues.filter((_, i) => i !== idx))}
                style={{ background: "none", border: "none", fontSize: 16, opacity: 0.3, cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}
              >✕</button>
            )}
          </div>
        ))}
        <button
          onClick={() => setLinkValues([...linkValues, ""])}
          style={{ ...pillBtnStyle, marginTop: 6, fontSize: 12 }}
        >+ Link hinzufügen</button>

        {/* Note */}
        <input
          value={noteValue}
          onChange={e => setNoteValue(e.target.value)}
          placeholder="Notiz (optional)"
          style={{
            width: "100%",
            padding: "12px 0",
            border: "none",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            background: "transparent",
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            color: "var(--text-primary, #1a1a2e)",
            boxSizing: "border-box",
            marginTop: 4,
          }}
        />

        {/* Kid favorite */}
        <label
          onClick={() => setKidFavorite(!kidFavorite)}
          style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, cursor: "pointer", fontSize: 14, userSelect: "none" }}
        >
          <span style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            border: kidFavorite ? "none" : "2px solid rgba(0,0,0,0.15)",
            background: kidFavorite ? "linear-gradient(135deg, #ffecd2, #fcb69f)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            transition: "all 0.2s",
            flexShrink: 0,
          }}>
            {kidFavorite ? "👶" : ""}
          </span>
          <span style={{ opacity: kidFavorite ? 1 : 0.5 }}>Kinderliebling</span>
        </label>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          <button
            onClick={handleSave}
            disabled={!inputValue.trim()}
            style={{
              ...actionBtnStyle,
              flex: 1,
              opacity: inputValue.trim() ? 1 : 0.3,
              background: "var(--text-primary, #1a1a2e)",
              color: "#fff",
              fontSize: 15,
              padding: "14px 18px",
            }}
          >
            Speichern
          </button>
          <button
            onClick={() => { setShowSuggestions(!showSuggestions); setSuggestionFilter("alle"); }}
            style={{
              ...actionBtnStyle,
              background: showSuggestions ? "linear-gradient(135deg, #e07a5f, #f2cc8f)" : "rgba(224,122,95,0.1)",
              color: showSuggestions ? "#fff" : "#e07a5f",
              fontSize: 15,
              padding: "14px 18px",
            }}
          >
            💡 Vorschläge
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSuggestionFilter(tag)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 12,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: suggestionFilter === tag ? "var(--text-primary, #1a1a2e)" : "rgba(0,0,0,0.05)",
                    color: suggestionFilter === tag ? "#fff" : "var(--text-primary, #1a1a2e)",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {getSuggestions().map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(s.name);
                    setEmojiValue(s.emoji || "");
                    setKidFavorite(!!s.kidFav);
                    setLinkValues(s.links?.length ? s.links : [""]);
                    setNoteValue(s.note || "");
                    setShowSuggestions(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: s.kidFav ? "rgba(255,236,210,0.3)" : "rgba(0,0,0,0.02)",
                    border: s.kidFav ? "1px solid rgba(252,182,159,0.3)" : "1px solid rgba(0,0,0,0.05)",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: "var(--text-primary, #1a1a2e)",
                    textAlign: "left",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>{s.name}</div>
                    {s.note && (
                      <div style={{ fontSize: 11, opacity: 0.45, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.note}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                    {s.links?.length > 0 && <span style={{ fontSize: 12, opacity: 0.4 }}>🔗</span>}
                    {s.kidFav && (
                      <span style={{ fontSize: 11, background: "linear-gradient(135deg, #ffecd2, #fcb69f)", padding: "2px 6px", borderRadius: 8 }}>👶</span>
                    )}
                    {s.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: 10, padding: "2px 6px", background: "rgba(0,0,0,0.05)", borderRadius: 6, opacity: 0.6 }}>{t}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowSuggestions(false); setTimeout(() => setShowSuggestions(true), 10); }}
              style={{ ...pillBtnStyle, marginTop: 10, fontSize: 13, width: "100%" }}
            >
              🔄 Neue Vorschläge
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
