import { useState, useEffect, useCallback } from "react";
import { signInWithGoogle, signOutUser, onAuthChange } from "./src/firebase.js";

// ─── Firebase Datenbank-URL ────────────────────────────────────────────────────
const FIREBASE_URL = "https://saucepan-23db2-default-rtdb.europe-west1.firebasedatabase.app/essensplan";
// ──────────────────────────────────────────────────────────────────────────────

const FIREBASE_NOT_CONFIGURED = FIREBASE_URL.includes("DEIN-PROJEKT");

async function loadFromFirebase() {
  const res = await fetch(`${FIREBASE_URL}.json`);
  if (!res.ok) throw new Error(`Firebase Ladefehler: ${res.status}`);
  return await res.json();
}

async function saveToFirebase(data, user) {
  const token = await user.getIdToken();
  const res = await fetch(`${FIREBASE_URL}.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase Speicherfehler: ${res.status}`);
}

const DAYS = ["Samstag", "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

// Stable, deterministic ID from recipe name (safe Firebase key)
function nameToId(name) {
  return "r_" + name.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
}

const SAMPLE_RECIPES = [
  { name: "Allgäuer Kartoffelsuppe", tags: ["suppe", "comfort", "vegetarisch"], emoji: "🥣", kidFav: false, link: "https://www.chefkoch.de/rezepte/384801125013411/Allgaeuer-Kartoffelsuppe-a-la-Naddel.html", note: "" },
  { name: "Baguette mit Hähnchen und Salat", tags: ["hähnchen", "schnell"], emoji: "🥖", kidFav: false, link: "", note: "" },
  { name: "Bowl mit Süßkartoffeln, Rotkohl, Hummus, Hähnchen", tags: ["bowl", "hähnchen"], emoji: "🥗", kidFav: false, link: "", note: "" },
  { name: "Brokkoli-Tofu-Pfanne mit Erdnusssauce", tags: ["tofu", "asiatisch", "pfanne"], emoji: "🥦", kidFav: false, link: "https://www.chefkoch.de/rezepte/1821701295613556/Brokkoli-Tofu-Pfanne-mit-Erdnusssauce.html", note: "" },
  { name: "Brokkolicurry mit roten Linsen", tags: ["curry", "vegan", "linsen"], emoji: "🍛", kidFav: false, link: "https://www.weightwatchers.com/de/rezept/broccolicurry-mit-roten-linsen/591aeb9416581df91e8726f4", note: "" },
  { name: "Buchweizen-Gemüse-Auflauf", tags: ["ofen", "vegan", "buchweizen"], emoji: "🫕", kidFav: false, link: "https://www.rewe.de/rezepte/buchweizen-gemuese-auflauf/", note: "" },
  { name: "Burger", tags: ["schnell", "klassiker"], emoji: "🍔", kidFav: true, link: "", note: "" },
  { name: "Burger + Ofen Kartoffeln", tags: ["klassiker", "ofen"], emoji: "🍔", kidFav: true, link: "", note: "" },
  { name: "Burger mit Kartoffelgratin", tags: ["klassiker", "comfort", "ofen"], emoji: "🍔", kidFav: false, link: "https://www.chefkoch.de/rezepte/837601188560864/Kartoffelgratin.html", note: "" },
  { name: "Chili Sin Carne", tags: ["vegan", "mexikanisch", "günstig"], emoji: "🌶️", kidFav: false, link: "https://www.chefkoch.de/rezepte/2306121367961970/Chili-sin-carne.html", note: "" },
  { name: "Chili Sin Carne mit Nudeln", tags: ["vegan", "mexikanisch", "nudeln"], emoji: "🌶️", kidFav: false, link: "", note: "" },
  { name: "Chili sin Carne mit Reis", tags: ["vegan", "mexikanisch", "reis"], emoji: "🌶️", kidFav: false, link: "https://www.chefkoch.de/rezepte/2306121367961970/Chili-sin-carne.html?portionen=7", note: "" },
  { name: "Döner", tags: ["schnell", "klassiker"], emoji: "🥙", kidFav: false, link: "", note: "" },
  { name: "Flammkuchen", tags: ["backen", "schnell"], emoji: "🫓", kidFav: true, link: "", note: "" },
  { name: "Flammkuchen mit Birne, Ziegenkäse und Walnüssen", tags: ["backen", "vegetarisch"], emoji: "🫓", kidFav: false, link: "", note: "" },
  { name: "Gemüse-Nudel-Auflauf", tags: ["ofen", "vegetarisch", "nudeln"], emoji: "🫕", kidFav: false, link: "", note: "" },
  { name: "Gemüseeintopf mit Kartoffeln und Würstchen", tags: ["suppe", "eintopf"], emoji: "🍲", kidFav: false, link: "https://cookidoo.de/recipes/recipe/de-DE/r312843", note: "" },
  { name: "Gemüsetorte", tags: ["backen", "vegetarisch"], emoji: "🥧", kidFav: false, link: "", note: "" },
  { name: "Gnocchi Caprese", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🥟", kidFav: false, link: "https://cookidoo.de/recipes/recipe/de-DE/r692147", note: "" },
  { name: "Gnocchi mit Spinat", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🥟", kidFav: false, link: "https://www.eatbetter.de/rezepte/gnocchi-mit-spinat-schnell-lecker", note: "" },
  { name: "Gnocchi Spinat Pfanne", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🥟", kidFav: false, link: "", note: "" },
  { name: "Grillgemüse + Würstchen", tags: ["grill", "schnell"], emoji: "🌭", kidFav: false, link: "", note: "" },
  { name: "Grünkohl", tags: ["eintopf", "comfort"], emoji: "🥬", kidFav: false, link: "https://www.chefkoch.de/rezepte/237101096472618/Gruenkohl-wie-ihn-Mutter-kochte.html", note: "" },
  { name: "Gustav grün", tags: ["salat"], emoji: "🥗", kidFav: false, link: "", note: "" },
  { name: "Hackbraten mit Ofenkartoffeln & -gemüse", tags: ["ofen", "fleisch", "comfort"], emoji: "🍖", kidFav: false, link: "https://www.chefkoch.de/rezepte/111041046526210/Hackbraten-Roulade-mit-Spinat.html", note: "" },
  { name: "Hackfleischspieße + Gemüsespieße", tags: ["grill", "fleisch"], emoji: "🍢", kidFav: false, link: "https://sweetchefberry.one/saftige-rinderhackspiese-vom-grill-nie-mehr-trocken/", note: "" },
  { name: "Hähnchen Gemüse Reis", tags: ["hähnchen", "reis", "schnell"], emoji: "🍗", kidFav: false, link: "https://cookidoo.de/recipes/recipe/de-DE/r453314", note: "" },
  { name: "Healthy Burrito Bowls", tags: ["mexikanisch", "bowl", "vegan"], emoji: "🌯", kidFav: false, link: "https://www.mysugarfreekitchen.com/healthy-burrito-bowls/#recipe", note: "" },
  { name: "Kartoffel-Brokkoli-Auflauf", tags: ["ofen", "vegetarisch"], emoji: "🥦", kidFav: false, link: "", note: "" },
  { name: "Kartoffel-Gemüse-Gratin mit Brokkoli und Karotten", tags: ["ofen", "vegetarisch", "comfort"], emoji: "🥔", kidFav: false, link: "", note: "" },
  { name: "Kartoffel-Möhren-Porree Suppe", tags: ["suppe", "vegetarisch"], emoji: "🥣", kidFav: false, link: "", note: "" },
  { name: "Kartoffelpüree mit Gemüse Sauce (Zucchini, Paprika, Champignons)", tags: ["vegetarisch", "comfort"], emoji: "🥔", kidFav: false, link: "", note: "" },
  { name: "Kartoffelpüree mit Spinat", tags: ["comfort", "vegetarisch"], emoji: "🥔", kidFav: true, link: "", note: "" },
  { name: "Kartoffelpüree mit Spinat + Frikadellen", tags: ["comfort", "fleisch"], emoji: "🥔", kidFav: false, link: "https://www.chefkoch.de/rezepte/819141186405890/Omas-beste-Frikadellen.html", note: "" },
  { name: "Kartoffelpüree Puffer", tags: ["vegetarisch", "schnell"], emoji: "🥔", kidFav: false, link: "", note: "" },
  { name: "Kartoffelpüree, Spinat und Fischstäbchen", tags: ["fisch", "comfort"], emoji: "🥔", kidFav: false, link: "", note: "" },
  { name: "Kartoffelsuppe", tags: ["suppe", "comfort", "vegetarisch"], emoji: "🥣", kidFav: false, link: "https://www.chefkoch.de/rezepte/384801125013411/Allgaeuer-Kartoffelsuppe-a-la-Naddel.html", note: "" },
  { name: "Käse-Lauch-Suppe", tags: ["suppe", "comfort"], emoji: "🧀", kidFav: false, link: "https://www.chefkoch.de/rezepte/982031203667502/Kaese-Lauch-Suppe-mit-Hackfleisch.html", note: "" },
  { name: "Käsespätzle", tags: ["spätzle", "comfort", "vegetarisch"], emoji: "🧀", kidFav: true, link: "https://www.chefkoch.de/rezepte/1082671214034473/Cremige-Kaesespaetzle.html", note: "" },
  { name: "Kokosnuss Dhal", tags: ["indisch", "vegan", "günstig"], emoji: "🍛", kidFav: false, link: "https://cookidoo.de/recipes/recipe/de-DE/r124130", note: "" },
  { name: "Kürbis-Kartoffel-Suppe", tags: ["suppe", "herbst", "vegan"], emoji: "🎃", kidFav: false, link: "", note: "" },
  { name: "Kürbislasagne", tags: ["pasta", "ofen", "herbst", "vegetarisch"], emoji: "🎃", kidFav: false, link: "https://www.chefkoch.de/rezepte/2620851411639709/Kuerbislasagne.html", note: "" },
  { name: "Kürbisrisotto", tags: ["reis", "herbst", "vegetarisch"], emoji: "🎃", kidFav: false, link: "https://cookidoo.de/recipes/recipe/de-DE/r143961", note: "" },
  { name: "Kürbissauce mit Nudeln", tags: ["pasta", "herbst", "vegetarisch"], emoji: "🎃", kidFav: false, link: "", note: "" },
  { name: "Kürbissuppe", tags: ["suppe", "herbst", "vegan"], emoji: "🎃", kidFav: false, link: "", note: "" },
  { name: "Lasagne", tags: ["pasta", "ofen", "klassiker"], emoji: "🫕", kidFav: false, link: "", note: "" },
  { name: "Linsenbraten mit Kartoffelpüree", tags: ["vegan", "comfort"], emoji: "🍲", kidFav: false, link: "", note: "" },
  { name: "Maultaschen Kühlregal", tags: ["klassiker", "comfort"], emoji: "🥟", kidFav: true, link: "", note: "" },
  { name: "Maultaschen selbstgemacht", tags: ["klassiker", "comfort"], emoji: "🥟", kidFav: true, link: "https://cookidoo.de/recipes/recipe/de-DE/r708526", note: "" },
  { name: "Milchreis", tags: ["schnell", "vegetarisch"], emoji: "🍚", kidFav: true, link: "", note: "" },
  { name: "Nudeln mit Gemüse", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Gemüsesauce", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Hähnchen in Sahne Paprika Sauce mit Käse überbacken", tags: ["pasta", "hähnchen", "ofen"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Hähnchen in Sahne Sauce", tags: ["pasta", "hähnchen", "schnell"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Käsesauce", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Kürbis-Walnuss-Gorgonzola Sauce", tags: ["pasta", "herbst", "vegetarisch"], emoji: "🍝", kidFav: false, link: "https://www.chefkoch.de/rezepte/391761126793272/Bandnudeln-mit-Kuerbis-und-Gorgonzola-Walnuss-Sauce.html", note: "" },
  { name: "Nudeln mit Möhren", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Pesto", tags: ["pasta", "schnell", "vegan"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Pilz Möhren Sahne Sauce", tags: ["pasta", "vegetarisch"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Nudeln mit Spinatsauce", tags: ["pasta", "schnell", "vegetarisch"], emoji: "🍝", kidFav: true, link: "", note: "" },
  { name: "Nudeln mit Tomatensauce", tags: ["pasta", "schnell", "vegan"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Ofengemüse", tags: ["ofen", "vegan", "einfach"], emoji: "🫕", kidFav: false, link: "", note: "" },
  { name: "Ofenkartoffel mit Sour Cream", tags: ["ofen", "vegetarisch"], emoji: "🥔", kidFav: false, link: "", note: "" },
  { name: "Pfannkuchen", tags: ["pfannkuchen", "vegetarisch", "schnell"], emoji: "🥞", kidFav: false, link: "https://www.chefkoch.de/rezepte/1208161226570428/Der-perfekte-Pfannkuchen-gelingt-einfach-immer.html", note: "" },
  { name: "Pizza", tags: ["backen", "schnell", "klassiker"], emoji: "🍕", kidFav: true, link: "", note: "" },
  { name: "Quiche mit Spinat, Feta und Tomaten", tags: ["backen", "vegetarisch", "eier"], emoji: "🥧", kidFav: false, link: "https://www.chefkoch.de/rezepte/2801401432239694/Quiche-mit-Spinat-Feta-Tomaten-und-Pinienkernen.html", note: "" },
  { name: "Reis mit Gemüse", tags: ["reis", "schnell", "vegan"], emoji: "🍚", kidFav: false, link: "", note: "" },
  { name: "Reis mit Hähnchen und Paprika", tags: ["reis", "hähnchen", "schnell"], emoji: "🍗", kidFav: false, link: "", note: "" },
  { name: "Reis mit Zucchini und Feta", tags: ["reis", "vegetarisch"], emoji: "🍚", kidFav: false, link: "https://de.pinterest.com/pin/68749238836/", note: "" },
  { name: "Spaghetti Carbonara", tags: ["pasta", "schnell"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Spätzle mit Mozzarella Hähnchen", tags: ["spätzle", "hähnchen"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Spätzle mit Spinatsauce", tags: ["spätzle", "vegetarisch"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Spätzle mit Tomatensauce", tags: ["spätzle", "vegetarisch", "schnell"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Spinat-Feta-Lasagne", tags: ["pasta", "ofen", "vegetarisch"], emoji: "🫕", kidFav: false, link: "", note: "" },
  { name: "Spinatknödel", tags: ["vegetarisch", "comfort"], emoji: "🥟", kidFav: true, link: "https://cookidoo.de/recipes/recipe/de-DE/r85370", note: "" },
  { name: "Spinatlasagne", tags: ["pasta", "ofen", "vegetarisch"], emoji: "🫕", kidFav: false, link: "https://www.chefkoch.de/rezepte/1231981228220302/Spinatlasagne.html", note: "" },
  { name: "Tofu Gyros mit Reis", tags: ["griechisch", "tofu", "reis"], emoji: "🥙", kidFav: false, link: "", note: "" },
  { name: "Tofu Gyros mit Reis und Tzatziki", tags: ["griechisch", "tofu"], emoji: "🥙", kidFav: false, link: "https://julesmenu.de/tofu-gyros/", note: "" },
  { name: "Tortellini Auflauf", tags: ["pasta", "ofen", "vegetarisch"], emoji: "🫕", kidFav: false, link: "https://emmasessen.de/tortellini-auflauf-mit-tomaten-mozzarella/", note: "" },
  { name: "Tortellini mit Gemüse", tags: ["pasta", "vegetarisch", "schnell"], emoji: "🥟", kidFav: false, link: "", note: "" },
  { name: "Tortellini mit Käsesauce", tags: ["pasta", "vegetarisch", "schnell"], emoji: "🥟", kidFav: false, link: "", note: "" },
  { name: "Tortelloni mit Käse-Schinken-Sauce", tags: ["pasta", "schnell"], emoji: "🥟", kidFav: true, link: "", note: "" },
  { name: "Tortelloni mit Tomatensauce für jeden Tag", tags: ["pasta", "schnell", "vegan"], emoji: "🥟", kidFav: true, link: "https://cookidoo.de/recipes/recipe/de-DE/r134617", note: "" },
  { name: "Vegane Bolognese mit Blumenkohl", tags: ["pasta", "vegan"], emoji: "🍝", kidFav: false, link: "", note: "" },
  { name: "Vegetarische Burger", tags: ["vegetarisch", "klassiker"], emoji: "🍔", kidFav: false, link: "", note: "" },
  { name: "Vollkornpizza", tags: ["backen", "vegetarisch"], emoji: "🍕", kidFav: false, link: "", note: "" },
  { name: "Wraps", tags: ["schnell"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps + Halloumi", tags: ["vegetarisch", "schnell"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps mit Couscous + Halloumi", tags: ["vegetarisch"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps mit Falafel", tags: ["orientalisch", "vegan"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps mit Falafel, Joghurt-Dressing und frischem Gemüse", tags: ["orientalisch", "vegetarisch"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps mit Feta", tags: ["vegetarisch", "schnell"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps mit Gemüse und Halloumi", tags: ["vegetarisch"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps mit Halloumi", tags: ["vegetarisch", "schnell"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Wraps mit Tofu Gyros und Halloumi", tags: ["tofu", "vegetarisch"], emoji: "🌯", kidFav: false, link: "", note: "" },
  { name: "Würstchen mit Kartoffelpüree", tags: ["comfort", "schnell"], emoji: "🌭", kidFav: false, link: "", note: "" },
  { name: "Zucchini Risotto", tags: ["reis", "vegetarisch"], emoji: "🍚", kidFav: false, link: "https://cookidoo.de/recipes/recipe/de-DE/r100419", note: "" },
];

// Recipes as object keyed by stable ID – the canonical Firebase structure
// Normalize link (string) → links (array) for all sample recipes
const INITIAL_RECIPES = Object.fromEntries(SAMPLE_RECIPES.map(r => {
  const { link, ...rest } = r;
  return [nameToId(r.name), { ...rest, links: link ? [link] : [] }];
}));

function getWeekKey(date) {
  const d = new Date(date);
  // Find Saturday of this week
  const day = d.getDay();
  const diff = (day + 1) % 7; // days since Saturday
  const saturday = new Date(d);
  saturday.setDate(d.getDate() - diff);
  return saturday.toISOString().split("T")[0];
}

function getKW(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
}

function getWeekDates(saturdayKey) {
  const sat = new Date(saturdayKey + "T12:00:00");
  return DAYS.map((_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d;
  });
}

function formatDate(d) {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export default function MealPlanner() {
  const [currentWeekKey, setCurrentWeekKey] = useState(() => getWeekKey(new Date()));
  const [plans, setPlans] = useState({});
  const [history, setHistory] = useState([]);
  const [editingDay, setEditingDay] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [emojiValue, setEmojiValue] = useState("");
  const [noteValue, setNoteValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("alle");
  const [loading, setLoading] = useState(true);
  const [linkValues, setLinkValues] = useState([""]);
  const [kidFavorite, setKidFavorite] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle" | "saving" | "error"
  const [recipes, setRecipes] = useState(INITIAL_RECIPES); // { [id]: recipe }
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in, object = logged in

  // Listen to Firebase Auth state
  useEffect(() => onAuthChange(setUser), []);

  const DEFAULT_DATA = {
    recipes: INITIAL_RECIPES,
    plans: {
      "2026-04-04": {
        "Samstag":    { recipeId: nameToId("Nudeln mit Tomatensauce") },
        "Sonntag":    null,
        "Montag":     { recipeId: nameToId("Gemüsetorte") },
        "Dienstag":   { recipeId: nameToId("Gemüsetorte") },
        "Mittwoch":   { recipeId: nameToId("Kartoffelpüree mit Spinat") },
        "Donnerstag": { recipeId: nameToId("Tofu Gyros mit Reis und Tzatziki") },
        "Freitag":    { recipeId: nameToId("Pizza") },
      }
    },
    history: [
      nameToId("Nudeln mit Tomatensauce"), nameToId("Kartoffelpüree mit Spinat"),
      nameToId("Gemüsetorte"), nameToId("Tofu Gyros mit Reis und Tzatziki"), nameToId("Pizza"),
    ],
  };

  // Migrate old Firebase format → new format:
  //   recipes: array  →  { [id]: recipe }
  //   plans:   { day: { meal, emoji, ... } }  →  { day: { recipeId } }
  //   history: [name, ...]  →  [id, ...]
  function migrateData(data) {
    const firstWeek = Object.values(data.plans || {})[0] || {};
    const firstEntry = Object.values(firstWeek).find(Boolean);
    if (!firstEntry || firstEntry.recipeId !== undefined) return data; // already new format

    // Build recipes object from old array + inline plan data
    const recipeMap = {}; // lowercaseName → id
    const newRecipes = { ...INITIAL_RECIPES };
    const seedArray = Array.isArray(data.recipes) ? data.recipes : SAMPLE_RECIPES;
    seedArray.forEach(r => {
      const id = nameToId(r.name);
      newRecipes[id] = { ...r };
      recipeMap[r.name.toLowerCase()] = id;
    });
    Object.values(data.plans || {}).forEach(weekPlan => {
      Object.values(weekPlan || {}).forEach(entry => {
        if (!entry?.meal) return;
        const key = entry.meal.toLowerCase();
        const id = recipeMap[key] || nameToId(entry.meal);
        if (!newRecipes[id]) {
          newRecipes[id] = { name: entry.meal, emoji: entry.emoji || "🍽️", tags: ["gekocht"], kidFav: !!entry.kidFav, links: entry.link ? [entry.link] : [], note: entry.note || "" };
        } else {
          if (entry.link) newRecipes[id].links = [...(newRecipes[id].links || []), entry.link];
          if (entry.note) newRecipes[id].note = entry.note;
          if (entry.kidFav) newRecipes[id].kidFav = true;
        }
        recipeMap[key] = id;
      });
    });

    // Convert plan entries to { recipeId }
    const newPlans = {};
    Object.entries(data.plans || {}).forEach(([week, weekPlan]) => {
      newPlans[week] = {};
      Object.entries(weekPlan || {}).forEach(([day, entry]) => {
        if (!entry?.meal) { newPlans[week][day] = null; return; }
        newPlans[week][day] = { recipeId: recipeMap[entry.meal.toLowerCase()] || nameToId(entry.meal) };
      });
    });

    // Convert history names → IDs
    const newHistory = (data.history || [])
      .map(h => typeof h === "string" ? (recipeMap[h.toLowerCase()] ?? null) : h)
      .filter(Boolean);

    return { recipes: newRecipes, plans: newPlans, history: newHistory };
  }

  // Initial load from Firebase
  useEffect(() => {
    async function load() {
      if (FIREBASE_NOT_CONFIGURED) {
        setPlans(DEFAULT_DATA.plans);
        setHistory(DEFAULT_DATA.history);
        setLoading(false);
        return;
      }
      try {
        let data = await loadFromFirebase();
        if (data && data.plans) {
          data = migrateData(data);
          // If migration changed the format, persist it immediately
          const firstEntry = Object.values(Object.values(data.plans)[0] || {}).find(Boolean);
          if (firstEntry?.recipeId !== undefined) {
            setPlans(data.plans);
            setHistory(data.history || []);
            setRecipes(data.recipes || INITIAL_RECIPES);
            // Persist migrated data if user is logged in (handled after auth loads)
          }
        } else {
          // First-time setup: write defaults to Firebase
          setPlans(DEFAULT_DATA.plans);
          setHistory(DEFAULT_DATA.history);
          setRecipes(DEFAULT_DATA.recipes);
        }
      } catch {
        setPlans(DEFAULT_DATA.plans);
        setHistory(DEFAULT_DATA.history);
        setRecipes(DEFAULT_DATA.recipes);
        setSyncStatus("error");
      }
      setLoading(false);
    }
    load();
  }, []);

  // Poll Firebase every 30 seconds to pick up changes from other devices
  useEffect(() => {
    if (FIREBASE_NOT_CONFIGURED) return;
    const interval = setInterval(async () => {
      try {
        const raw = await loadFromFirebase();
        if (raw && raw.plans) {
          const data = migrateData(raw);
          setPlans(data.plans);
          setHistory(data.history || []);
          setRecipes(data.recipes || INITIAL_RECIPES);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Save data to Firebase (requires authenticated user)
  const saveData = useCallback(async (newPlans, newHistory, newRecipes) => {
    if (FIREBASE_NOT_CONFIGURED || !user) return;
    setSyncStatus("saving");
    try {
      await saveToFirebase({ plans: newPlans, history: newHistory, recipes: newRecipes }, user);
      setSyncStatus("idle");
    } catch (e) {
      console.error("Save failed:", e);
      setSyncStatus("error");
    }
  }, [user]);

  const weekDates = getWeekDates(currentWeekKey);
  const kw = getKW(currentWeekKey);
  const weekPlan = plans[currentWeekKey] || {};

  function navigateWeek(dir) {
    const sat = new Date(currentWeekKey + "T12:00:00");
    sat.setDate(sat.getDate() + dir * 7);
    setCurrentWeekKey(sat.toISOString().split("T")[0]);
    setEditingDay(null);
  }

  function goToToday() {
    setCurrentWeekKey(getWeekKey(new Date()));
    setEditingDay(null);
  }

  function setMeal(day, meal, emoji, note, links, kidFav) {
    const lower = meal.toLowerCase();
    // Find existing recipe by name or create a stable ID from the name
    const existingEntry = Object.entries(recipes).find(([, r]) => r.name.toLowerCase() === lower);
    const recipeId = existingEntry ? existingEntry[0] : nameToId(meal);
    const resolvedEmoji = emoji || (existingEntry ? existingEntry[1].emoji : findEmoji(meal));
    const cleanLinks = links.filter(l => l.trim());

    const newRecipes = {
      ...recipes,
      [recipeId]: existingEntry
        ? { ...existingEntry[1], emoji: resolvedEmoji, links: cleanLinks.length ? cleanLinks : (existingEntry[1].links || []), note: note || existingEntry[1].note, kidFav: !!kidFav }
        : { name: meal, emoji: resolvedEmoji, tags: ["gekocht"], kidFav: !!kidFav, links: cleanLinks, note: note || "" },
    };

    const newWeekPlan = { ...weekPlan, [day]: { recipeId } };
    const newPlans = { ...plans, [currentWeekKey]: newWeekPlan };
    const newHistory = !history.includes(recipeId)
      ? [recipeId, ...history].slice(0, 100)
      : history;

    setPlans(newPlans);
    setHistory(newHistory);
    setRecipes(newRecipes);
    saveData(newPlans, newHistory, newRecipes);
    setEditingDay(null);
    setInputValue("");
    setEmojiValue("");
    setNoteValue("");
    setLinkValues([""]);
    setKidFavorite(false);
  }

  function removeMeal(day) {
    const newWeekPlan = { ...weekPlan };
    delete newWeekPlan[day];
    const newPlans = { ...plans, [currentWeekKey]: newWeekPlan };
    setPlans(newPlans);
    saveData(newPlans, history, recipes);
  }

  function findEmoji(meal) {
    const lower = meal.toLowerCase();
    const match = Object.values(recipes).find(r => r.name.toLowerCase() === lower);
    if (match) return match.emoji;
    if (lower.includes("nudel") || lower.includes("pasta") || lower.includes("spaghetti")) return "🍝";
    if (lower.includes("pizza")) return "🍕";
    if (lower.includes("kartoffel")) return "🥔";
    if (lower.includes("reis")) return "🍚";
    if (lower.includes("suppe")) return "🍲";
    if (lower.includes("curry")) return "🍛";
    if (lower.includes("salat")) return "🥗";
    if (lower.includes("wrap") || lower.includes("burrito")) return "🌯";
    if (lower.includes("pfannkuchen")) return "🥞";
    if (lower.includes("brot") || lower.includes("toast")) return "🍞";
    if (lower.includes("kuchen") || lower.includes("torte")) return "🥧";
    return "🍽️";
  }

  function startEditing(day) {
    const entry = weekPlan[day];
    const recipe = entry?.recipeId ? recipes[entry.recipeId] : null;
    setEditingDay(day);
    setInputValue(recipe?.name || "");
    setEmojiValue(recipe?.emoji || "");
    setNoteValue(recipe?.note || "");
    setLinkValues(recipe?.links?.length ? recipe.links : [""]);
    setKidFavorite(recipe?.kidFav || false);
    setShowSuggestions(false);
  }

  function getSuggestions() {
    const usedIds = new Set(Object.values(weekPlan).map(v => v?.recipeId).filter(Boolean));
    const tags = suggestionFilter === "alle" ? null : suggestionFilter;

    let pool = Object.entries(recipes)
      .filter(([id]) => !usedIds.has(id))
      .map(([id, r]) => ({ id, ...r }));

    if (tags === "👶 kids") {
      pool = pool.filter(r => r.kidFav);
    } else if (tags === "gekocht") {
      pool = pool.filter(r => r.tags.includes("gekocht"));
    } else if (tags) {
      pool = pool.filter(r => r.tags.includes(tags));
    }

    return pool.sort(() => Math.random() - 0.5).slice(0, 6);
  }

  const allTags = ["alle", "👶 kids", "schnell", "vegan", "vegetarisch", "pasta", "suppe", "ofen", "comfort", "asiatisch", "gekocht"];

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

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
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base, #faf9f6)",
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--text-primary, #1a1a2e)",
          maxWidth: 520,
          margin: "0 auto",
          padding: "0 16px 80px",
        }}
      >
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
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <button onClick={() => navigateWeek(-1)} style={navBtnStyle}>‹</button>
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
              <p style={{
                margin: "2px 0 0",
                fontSize: 13,
                opacity: 0.5,
                fontWeight: 400,
              }}>
                {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
              </p>
            </div>
            <button onClick={() => navigateWeek(1)} style={navBtnStyle}>›</button>
          </div>

          <div style={{
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <button onClick={goToToday} style={pillBtnStyle}>Heute</button>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {!FIREBASE_NOT_CONFIGURED && syncStatus === "saving" && (
                <span style={{ fontSize: 11, opacity: 0.5 }}>&#x21BB; sync...</span>
              )}
              {!FIREBASE_NOT_CONFIGURED && syncStatus === "error" && (
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
                  {user.photoURL && (
                    <img src={user.photoURL} alt="" style={{ width: 18, height: 18, borderRadius: "50%" }} />
                  )}
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


        {/* Week Plan */}
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
                onClick={() => user && startEditing(day)}
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
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 16px",
                  gap: 12,
                }}>
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
                        {recipe.links?.map((link, i) => (
                          <a
                            key={i}
                            href={link}
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
                            🔗 Rezept {recipe.links.length > 1 ? i + 1 : ""}
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
                      onClick={(e) => { e.stopPropagation(); removeMeal(day); }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 16,
                        opacity: 0.2,
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                    >✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Fullscreen editing overlay */}
      {editingDay && user && (() => {
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
              <button
                onClick={() => setEditingDay(null)}
                style={{ ...navBtnStyle, fontSize: 26 }}
              >‹</button>
              <div>
                {editingDate && (
                  <div style={{ fontSize: 12, opacity: 0.45, fontWeight: 500, marginBottom: 1 }}>
                    {formatDate(editingDate)}
                  </div>
                )}
                <div style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                  {editingDay}
                </div>
              </div>
            </div>

            {/* Form */}
            <div style={{ padding: "24px 16px", flex: 1 }}>
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
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && inputValue.trim()) {
                      setMeal(editingDay, inputValue.trim(), emojiValue.trim(), noteValue.trim(), linkValues, kidFavorite);
                    }
                    if (e.key === "Escape") setEditingDay(null);
                  }}
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 16,
                  cursor: "pointer",
                  fontSize: 14,
                  userSelect: "none",
                }}
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
                  onClick={() => {
                    if (inputValue.trim()) {
                      setMeal(editingDay, inputValue.trim(), emojiValue.trim(), noteValue.trim(), linkValues, kidFavorite);
                    }
                  }}
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
                  onClick={() => {
                    setShowSuggestions(!showSuggestions);
                    setSuggestionFilter("alle");
                  }}
                  style={{
                    ...actionBtnStyle,
                    background: showSuggestions
                      ? "linear-gradient(135deg, #e07a5f, #f2cc8f)"
                      : "rgba(224,122,95,0.1)",
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
                    {allTags.map(tag => (
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
                          background: suggestionFilter === tag
                            ? "var(--text-primary, #1a1a2e)"
                            : "rgba(0,0,0,0.05)",
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
                            <span style={{
                              fontSize: 11,
                              background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
                              padding: "2px 6px",
                              borderRadius: 8,
                            }}>👶</span>
                          )}
                          {s.tags.slice(0, 2).map(t => (
                            <span key={t} style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              background: "rgba(0,0,0,0.05)",
                              borderRadius: 6,
                              opacity: 0.6,
                            }}>{t}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setShowSuggestions(false);
                      setTimeout(() => setShowSuggestions(true), 10);
                    }}
                    style={{ ...pillBtnStyle, marginTop: 10, fontSize: 13, width: "100%" }}
                  >
                    🔄 Neue Vorschläge
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}

const navBtnStyle = {
  background: "none",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 10,
  width: 40,
  height: 40,
  fontSize: 22,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'DM Sans', sans-serif",
  color: "var(--text-primary, #1a1a2e)",
};

const pillBtnStyle = {
  padding: "6px 14px",
  borderRadius: 20,
  border: "none",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  background: "rgba(0,0,0,0.05)",
  fontFamily: "'DM Sans', sans-serif",
  color: "var(--text-primary, #1a1a2e)",
  transition: "all 0.2s",
};

const actionBtnStyle = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  transition: "all 0.2s",
};
