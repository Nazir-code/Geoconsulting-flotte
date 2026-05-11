# GEMINI.md - FleetNexus Engineering Mandates

This document defines the foundational engineering standards and architectural mandates for the FleetNexus project. All development must strictly adhere to these guidelines.

## 🛠 Tech Stack & Environment
- **Core:** React 19 (TypeScript), Vite
- **Styling:** Tailwind CSS + Vanilla CSS Variables (for theming)
- **Animations:** GSAP, Framer Motion
- **UI Components:** Radix UI primitives, Lucide React icons
- **Maps:** Leaflet, React Leaflet
- **State Management:** React Context API

## 📐 Architecture & Patterns
- **Directory Structure:**
  - `src/components/`: Modular UI components organized by feature or category.
  - `src/context/`: Global state management (e.g., Auth, Theme).
  - `src/services/`: Pure logic, API calls, and simulation services.
  - `src/types/`: Centralized TypeScript interfaces and types.
  - `src/data/`: Mock data and static configurations.
- **Component Design:**
  - Prefer functional components with hooks.
  - Use `clsx` and `tailwind-merge` for conditional class manipulation.
  - Adhere to the established Theme System using CSS variables defined in `src/index.css`.

## 🎨 Theming & Styling Mandates
- **Variables:** NEVER hardcode colors for themed elements. ALWAYS use CSS variables (e.g., `var(--bg-primary)`, `var(--text-primary)`).
- **Transitions:** All theme-affected components should have a smooth transition (default `0.3s ease`).
- **Icons:** Use `lucide-react` for consistent iconography.

## 📝 Coding Standards
- **Naming:**
  - Components: `PascalCase.tsx`
  - Functions/Variables: `camelCase`
  - Types/Interfaces: `PascalCase`
- **Typing:** Use strict TypeScript. Avoid `any`. Define interfaces in `src/types/index.ts` for cross-component usage.
- **Organization:** Keep components small and focused. Extract complex logic into custom hooks or services.

## 🧪 Validation & Quality
- **Linting:** Run `npm run lint` before completing any task.
- **Build:** Ensure `npm run build` passes for any major architectural changes.
- **Testing:** While a testing framework is not yet fully integrated, prioritize writing testable, modular code. (Note: Add Vitest/Testing Library if requested).

## 🚀 Workflow
1. **Research:** Analyze existing patterns in `src/` before adding new features.
2. **Implementation:** Surgical updates that maintain consistency with the existing global theme and glassmorphism aesthetic.
3. **Verification:** Manually verify UI changes in both Light and Dark modes.
