import { useState, useEffect } from "react";
import { onAuthChange, getUserPlan, createPlan as fbCreatePlan, joinPlan as fbJoinPlan, clearUserPlan } from "./firebase.js";

export function usePlanAccess() {
  const [user, setUser]     = useState(undefined); // undefined = noch nicht aufgelöst
  const [planId, setPlanId] = useState(undefined); // undefined = lädt, null = kein Plan
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthChange(async (u) => {
      setUser(u);
      if (!u) {
        setPlanId(null);
        setLoading(false);
        return;
      }
      try {
        const id = await getUserPlan(u);
        setPlanId(id ?? null);
      } catch {
        setPlanId(null);
      }
      setLoading(false);
    });
  }, []);

  async function createPlan(name) {
    const id = await fbCreatePlan(user, name.trim());
    setPlanId(id);
    return id;
  }

  async function joinPlan(code) {
    const id = code.trim().toUpperCase();
    await fbJoinPlan(user, id);
    setPlanId(id);
  }

  async function leavePlan() {
    await clearUserPlan(user);
    setPlanId(null);
  }

  return { user, planId, loading, createPlan, joinPlan, leavePlan };
}
