---
name: smartroadmap
description: Custom developer skills and design system guidelines for the SmartRoadmap workspace.
---

# SmartRoadmap Custom Skill Guidelines

This custom instruction document details the rules, design aesthetics, and offline/caching mechanisms implemented in the SmartRoadmap fullstack monorepo. Use these guidelines when modifying or expanding features in this repository.

---

## 1. Responsive Design & Coloring Rules

- **Theme Compliance**: Never hardcode colors (like `bg-white`, `bg-slate-50`, `text-slate-900`, `border-slate-200`) in the web app pages.
- **DaisyUI Tokens**: Always use DaisyUI utility classes to make views color-responsive automatically. Examples:
  - Backgrounds: `bg-base-100` (main screens), `bg-base-200` (cards, containers, sidebars), `bg-base-300` (borders/dividers)
  - Text: `text-base-content` (general body), `text-base-content/60` (subheadings), `text-base-content/40` (details/hints)
  - Interactive: `btn bg-indigo-650 hover:bg-indigo-700 text-white rounded-full`

---

## 2. Animated UI transitions (Framer Motion)

- Always wrap core panels or wizard steps in `<motion.div>` tags with smooth entrance fades or slide reveals:
  ```tsx
  import { motion } from "framer-motion";

  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    {/* Page Content */}
  </motion.div>
  ```
- Use `AnimatePresence` for dynamic drawer panels or switching steps.

---

## 3. Transparent Offline Caching & Fallback

- All API queries must go through the standard `apiFetch` helper in `src/lib/api.ts`.
- **GET Request Cache**: Success responses on GET calls are cloned and cached inside `localStorage` under `offline_cache:<path>`.
- **Network / Offline Handlers**:
  - `apiFetch` automatically catches network connection failures or intercepts queries when `navigator.onLine === false`.
  - It transparently serves cached payloads (matching 200 OK Response schema) from `localStorage` without throwing errors to page components.
- **Offline Banner Indicator**:
  - Every core page contains a listener on `window` online/offline events to display a warning alert banner when disconnected:
    ```tsx
    const [isOffline, setIsOffline] = useState(false);
    useEffect(() => {
      setIsOffline(!navigator.onLine);
      const handleOffline = () => setIsOffline(true);
      const handleOnline = () => setIsOffline(false);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
      return () => {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      };
    }, []);
    ```

---

## 4. Pipeline Mindmap Renderer

- **Lines & Connections**: Render paths styled with orange color (`#F97316`). If the connection is active, display a central "Real-time" indicator pill card with a lightning bolt symbol.
- **Themed Nodes**:
  - Root node: Orange circle container with MySQL/Dolphin icon.
  - Intermediate nodes: Hexagonal or pill-shaped cloud icons with lightning symbol (representing DTS transit or AnalyticDB).
  - Leaf/Terminal nodes: Specific badges (fire, bar-chart, users) mapping to hot videos, multi-dimensional BI reports, and user statistics analysis.

---

## 5. Scheduler & Timeline Layout

- **Left profile sidebar**: Displays the user badge (or Isabella Santos placeholder details), subjects selection tags, and availability matrix settings.
- **Availabilities**: Supports configurable hours list (13:00 to 20:00) saved to user object under `studyAvailability`.
- **Timeline Grid**: Renders hours as column headers, days of the week as rows, displaying study blocks with tooltips on hover.

---

## 6. Premium Assessments (Quiz)

- **Timer Countdown**: Renders a pulsing countdown timer. It changes to a pulsing warning style when under 10 seconds.
- **Explanation Blocks**: Provides clean diagnostic explanation boxes upon answering each question.
- **Results Card**: Shows final pass/fail statuses with clear scoring details.
