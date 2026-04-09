import { useState, useEffect, useCallback } from "react";
import { loadFromFirebase, saveToFirebase, FIREBASE_NOT_CONFIGURED, onAuthChange } from "./firebase.js";
import { SAMPLE_RECIPES } from "./recipes.js";
import { nameToId, getWeekKey, getWeekDates, getKW } from "./utils.js";

// Migrate old Firebase format → new format:
//   recipes: array  →  { [id]: recipe }
//   plans:   { day: { meal, emoji, ... } }  →  { day: { recipeId } }
function migrateData(data) {
  const firstWeek = Object.values(data.plans || {})[0] || {};
  const firstEntry = Object.values(firstWeek).find(Boolean);
  if (!firstEntry || firstEntry.recipeId !== undefined) return data; // already new format

  const recipeMap = {};
  const newRecipes = {};
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

  const newPlans = {};
  Object.entries(data.plans || {}).forEach(([week, weekPlan]) => {
    newPlans[week] = {};
    Object.entries(weekPlan || {}).forEach(([day, entry]) => {
      if (!entry?.meal) { newPlans[week][day] = null; return; }
      newPlans[week][day] = { recipeId: recipeMap[entry.meal.toLowerCase()] || nameToId(entry.meal) };
    });
  });

  return { recipes: newRecipes, plans: newPlans };
}

export function findEmoji(meal, recipes) {
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

export function useMealPlan() {
  const [currentWeekKey, setCurrentWeekKey] = useState(() => getWeekKey(new Date()));
  const [plans, setPlans] = useState({});
  const [recipes, setRecipes] = useState({});
  const [syncStatus, setSyncStatus] = useState("idle");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthChange(setUser), []);

  // Wait for auth state to resolve before loading data.
  // user === undefined means Firebase Auth hasn't responded yet.
  // user === null means not logged in → no load needed.
  useEffect(() => {
    if (user === undefined) return; // still resolving

    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        let data = await loadFromFirebase(user);
        if (data && data.plans) {
          data = migrateData(data);
        }
        setPlans(data?.plans || {});
        setRecipes(data?.recipes || {});
      } catch {
        setSyncStatus("error");
      }
      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (FIREBASE_NOT_CONFIGURED || !user) return;
    const interval = setInterval(async () => {
      try {
        const raw = await loadFromFirebase(user);
        if (raw && raw.plans) {
          const data = migrateData(raw);
          setPlans(data.plans || {});
          setRecipes(data.recipes || {});
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const saveData = useCallback(async (newPlans, newRecipes) => {
    if (FIREBASE_NOT_CONFIGURED || !user) return;
    setSyncStatus("saving");
    try {
      await saveToFirebase({ plans: newPlans, recipes: newRecipes }, user);
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
  }

  function goToToday() {
    setCurrentWeekKey(getWeekKey(new Date()));
  }

  function setMeal(day, meal, emoji, note, links, kidFav) {
    const lower = meal.toLowerCase();
    const existingEntry = Object.entries(recipes).find(([, r]) => r.name.toLowerCase() === lower);
    const recipeId = existingEntry ? existingEntry[0] : nameToId(meal);
    const resolvedEmoji = emoji || (existingEntry ? existingEntry[1].emoji : findEmoji(meal, recipes));
    const cleanLinks = links.filter(l => (typeof l === "string" ? l : l.url).trim());

    const newRecipes = {
      ...recipes,
      [recipeId]: existingEntry
        ? { ...existingEntry[1], emoji: resolvedEmoji, links: cleanLinks.length ? cleanLinks : (existingEntry[1].links || []), note: note || existingEntry[1].note, kidFav: !!kidFav }
        : { name: meal, emoji: resolvedEmoji, tags: ["gekocht"], kidFav: !!kidFav, links: cleanLinks, note: note || "" },
    };

    const newWeekPlan = { ...weekPlan, [day]: { recipeId } };
    const newPlans = { ...plans, [currentWeekKey]: newWeekPlan };

    setPlans(newPlans);
    setRecipes(newRecipes);
    saveData(newPlans, newRecipes);
  }

  function removeMeal(day) {
    const newWeekPlan = { ...weekPlan };
    delete newWeekPlan[day];
    const newPlans = { ...plans, [currentWeekKey]: newWeekPlan };
    setPlans(newPlans);
    saveData(newPlans, recipes);
  }

  return {
    loading, user, syncStatus,
    weekPlan, weekDates, kw,
    recipes,
    setMeal, removeMeal, navigateWeek, goToToday,
  };
}
