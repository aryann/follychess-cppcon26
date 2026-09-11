import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Presentation } from "./Presentation.tsx";
import { LaserPointer } from "./LaserPointer.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Presentation />
    <LaserPointer />
  </StrictMode>,
);
