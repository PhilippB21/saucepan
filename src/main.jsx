import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MealPlanner from "../essensplan.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MealPlanner />
  </StrictMode>
);
