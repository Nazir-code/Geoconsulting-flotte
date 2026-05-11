# FleetNexus Global Theme System

## 📋 Overview

This document explains the global theme system implementation for the FleetNexus dashboard application. The system supports Light Mode and Dark Mode with persistent storage and instant application across the entire app.

---

## 🏗️ Architecture

### Components

#### 1. **ThemeContext** (`src/context/ThemeContext.tsx`)
- Manages theme state (light/dark)
- Provides `useTheme()` hook
- Handles localStorage persistence
- Applies theme to document root

```typescript
const { theme, toggleTheme } = useTheme();
```

#### 2. **ThemeProvider** (`src/context/ThemeContext.tsx`)
- Wraps the entire application
- Initializes theme from localStorage or system preference
- Applies theme to `document.documentElement`

#### 3. **ThemeToggle Component** (`src/components/common/ThemeToggle.tsx`)
- Reusable toggle button with icon animation
- Two versions: compact (button) and extended (with label)
- Already integrated in TopBar

---

## 🎨 Theme Variables

### CSS Variables (`:root`)

#### Dark Theme (Default)
```css
:root {
  --bg-primary: #070B14;
  --bg-secondary: #0D1320;
  --bg-tertiary: #111827;
  --text-primary: #F4F6FF;
  --text-secondary: #A7B1C6;
  --border: rgba(244, 246, 255, 0.08);
  --border-active: rgba(0, 240, 255, 0.55);
  --scroll-thumb: rgba(244, 246, 255, 0.2);
  --scroll-track: rgba(244, 246, 255, 0.02);
}
```

#### Light Theme (`.light` class)
```css
.light {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-tertiary: #F1F5F9;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --border: rgba(30, 41, 59, 0.08);
  --border-active: rgba(0, 240, 255, 0.55);
  --scroll-thumb: rgba(30, 41, 59, 0.3);
  --scroll-track: rgba(30, 41, 59, 0.02);
}
```

---

## 🎯 How It Works

### 1. Theme Initialization
```typescript
// App.tsx
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>  {/* Wraps entire app */}
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### 2. Theme Application
The `ThemeProvider` applies the theme class to the document root:
```typescript
document.documentElement.classList.toggle('dark', theme === 'dark');
document.documentElement.classList.toggle('light', theme === 'light');
```

### 3. CSS Variables Usage
All styled elements use CSS variables:
```css
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.card {
  background: rgba(13, 19, 32, 0.72);
  border: 1px solid var(--border);
}
```

### 4. Persistence
Theme preference is saved to localStorage and restored on app load:
```typescript
const savedTheme = localStorage.getItem('fleetnexus-theme');
return (savedTheme as Theme) || 'dark';
```

---

## 🔄 Toggle Theme

### Using the Hook
```typescript
function MyComponent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Using the Component
```typescript
import { ThemeToggle } from '@/components/common/ThemeToggle';

// Compact version (button in navbar)
<ThemeToggle compact={true} />

// Extended version (full toggle with label)
<ThemeToggle compact={false} />
```

---

## 📦 Styled Components

All components automatically support both themes via CSS variables:

### Cards
```tsx
<div className="card">
  <div className="card-header">Header</div>
  <div className="card-body">Content</div>
  <div className="card-footer">Footer</div>
</div>
```

### Buttons
```tsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
```

### Input Fields
```tsx
<input className="input-field" placeholder="Enter text..." />
```

### Navigation Rail
```tsx
<nav className="nav-rail">
  {/* Navigation items */}
</nav>
```

---

## 🌟 Key Features

### ✅ Global Application
- Theme affects the **entire application**
- All components use CSS variables automatically
- No need to update individual components

### ✅ Smooth Transitions
- CSS transitions between themes (0.3s)
- Smooth color changes
- No visual jarring

### ✅ Persistent Storage
- Theme preference saved to localStorage
- Automatically restored on page reload
- User preference always preserved

### ✅ System Preference (Optional)
Current implementation defaults to dark mode, but can be extended:
```typescript
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
return (savedTheme as Theme) || (isDarkMode ? 'dark' : 'light');
```

---

## 📱 Component Integration

### In TopBar (Already Integrated)
```tsx
const { theme, toggleTheme } = useTheme();

<motion.button
  onClick={toggleTheme}
  className="w-10 h-10 rounded-xl flex items-center justify-center..."
>
  {theme === 'dark' ? <Sun /> : <Moon />}
</motion.button>
```

### In Settings Page
```tsx
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function SettingsView() {
  return (
    <div className="card">
      <div className="card-body">
        <ThemeToggle compact={false} />
      </div>
    </div>
  );
}
```

---

## 🎨 Styling Best Practices

### Use CSS Variables
❌ **Don't do this:**
```css
.card {
  background: #0D1320;  /* Hardcoded dark theme */
  color: #F4F6FF;
}
```

✅ **Do this:**
```css
.card {
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### Light Theme Overrides
For component-specific light theme styling:
```css
.card {
  background: rgba(13, 19, 32, 0.72);
}

.light .card {
  background: rgba(248, 250, 252, 0.8);
}
```

### Add Transition Classes
```tsx
className="transition-all duration-300"
```

---

## 🔧 Customization

### Adding New Theme Variables

1. Update `:root` in `src/index.css`:
```css
:root {
  --my-color: #value-dark;
}

.light {
  --my-color: #value-light;
}
```

2. Use in components:
```css
.component {
  color: var(--my-color);
}
```

### Changing Color Scheme

Simply update the hex values in `src/index.css`:
```css
:root {
  --accent-primary: #00F0FF;  /* Change accent color */
}
```

---

## 📋 File Structure

```
src/
├── context/
│   └── ThemeContext.tsx          ← Theme state management
├── components/
│   ├── common/
│   │   └── ThemeToggle.tsx       ← Toggle component
│   ├── layout/
│   │   ├── TopBar.tsx            ← Integrated toggle
│   │   └── NavigationRail.tsx
│   ├── settings/
│   │   └── SettingsView.tsx      ← Settings page demo
│   └── ...
├── App.tsx                        ← ThemeProvider wrapper
├── index.css                      ← CSS variables & styles
└── ...
```

---

## ✅ Verification Checklist

- [ ] ThemeProvider wraps entire app in App.tsx
- [ ] Theme toggle button works in TopBar
- [ ] localStorage persists theme preference
- [ ] All CSS uses CSS variables, not hardcoded colors
- [ ] Light and dark CSS classes exist in index.css
- [ ] Tailwind darkMode: ['class'] configured
- [ ] Smooth transitions between themes (0.3s)
- [ ] Scrollbar theme changes with theme
- [ ] Cards, buttons, inputs all support both themes
- [ ] Navigation rail and top bar change colors

---

## 🚀 Testing the Theme

1. **Toggle theme**: Click the sun/moon icon in the TopBar
2. **Check persistence**: Refresh the page - theme should remain
3. **Verify global**: Navigate to different sections - theme applies everywhere
4. **Test light mode**: Switch to light mode and verify all components
5. **Check transitions**: Observe smooth color transitions

---

## 📚 Resources

- **Framer Motion**: Animation library for transitions
- **Tailwind CSS**: Uses `darkMode: ['class']` for class-based theming
- **CSS Variables**: Used for dynamic theme switching
- **localStorage API**: Persists user preference

---

## 🎯 Summary

The FleetNexus theme system provides:

1. ✅ Global theme switching (light/dark)
2. ✅ Persistent user preference (localStorage)
3. ✅ Smooth transitions between themes
4. ✅ CSS variable-based styling
5. ✅ Reusable ThemeToggle component
6. ✅ Automatic application to all components
7. ✅ Production-ready architecture

**No additional setup needed!** The system is fully integrated and ready to use.
