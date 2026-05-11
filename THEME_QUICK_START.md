# 🎨 Theme System - Quick Implementation Guide

## ✅ What's Already Done

Your FleetNexus application now has a **fully functional global theme system**:

### ✓ Core Files
- `src/context/ThemeContext.tsx` - Theme state management
- `src/components/common/ThemeToggle.tsx` - Reusable toggle component
- `src/index.css` - CSS variables for both themes
- `src/App.tsx` - ThemeProvider wrapper (already integrated)

### ✓ Features Included
- ✅ Light Mode & Dark Mode
- ✅ Global CSS variables (--bg-primary, --text-primary, etc.)
- ✅ localStorage persistence
- ✅ Smooth 0.3s transitions
- ✅ Theme toggle in TopBar (Sun/Moon icon)
- ✅ Settings page with theme demo
- ✅ Full component styling

### ✓ Components Styled
- Pages (background, text)
- Navigation Rail
- Top Bar
- Cards (card-header, card-body, card-footer)
- Buttons (primary, secondary)
- Input fields
- Scrollbars
- Forms
- Tables
- Badges

---

## 🚀 How to Use

### 1. **Get Theme in Any Component**
```typescript
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      Current theme: {theme}
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}
```

### 2. **Use Theme Toggle Button**
```typescript
import { ThemeToggle } from '@/components/common/ThemeToggle';

// Compact version (button)
<ThemeToggle compact={true} />

// Full version (with label)
<ThemeToggle compact={false} />
```

### 3. **Style Components with CSS Variables**

#### ❌ Wrong Way (Hardcoded)
```css
.my-component {
  background: #070B14;  /* Only dark theme */
  color: #F4F6FF;       /* Only dark theme */
}
```

#### ✅ Right Way (Variables)
```css
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### 4. **Available CSS Variables**

#### Backgrounds
```css
var(--bg-primary)      /* Main background */
var(--bg-secondary)    /* Secondary background */
var(--bg-tertiary)     /* Tertiary background */
```

#### Text
```css
var(--text-primary)    /* Main text color */
var(--text-secondary)  /* Secondary text color */
```

#### Borders & UI
```css
var(--border)          /* Standard border color */
var(--border-active)   /* Active/hover border color (cyan) */
var(--scroll-thumb)    /* Scrollbar thumb */
var(--scroll-track)    /* Scrollbar track */
```

#### Accent Colors (Always Same)
```css
#00F0FF  /* Cyan */
#B829F7  /* Violet */
#D1F366  /* Lime */
#FF6A3D  /* Orange */
```

---

## 📝 Examples

### Example 1: Custom Card Component
```typescript
export function CustomCard({ children }) {
  return (
    <div className="custom-card">
      {children}
    </div>
  );
}
```

```css
.custom-card {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.custom-card:hover {
  border-color: var(--border-active);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.1);
}
```

### Example 2: Theme-Aware Button
```typescript
import { useTheme } from '@/context/ThemeContext';

export function CustomButton({ onClick, children }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: theme === 'dark' ? '#0D1320' : '#F8FAFC',
        color: theme === 'dark' ? '#F4F6FF' : '#1E293B',
        border: '1px solid var(--border)',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {children}
    </button>
  );
}
```

### Example 3: Status-Based Styling
```typescript
export function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-500/20';
      case 'pending': return 'text-orange-400 bg-orange-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(status)}`}>
      {status.toUpperCase()}
    </span>
  );
}
```

---

## 🔄 Testing

### Test 1: Theme Toggle
1. Click the Sun/Moon icon in TopBar
2. Verify entire app changes color
3. Refresh page - theme should persist

### Test 2: CSS Variables
Open browser DevTools:
```javascript
// Check current theme variables
getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
```

### Test 3: Component Styling
1. Open DevTools Inspector
2. Select any element
3. Verify it uses `var(--bg-primary)` style, not hardcoded colors

### Test 4: LocalStorage
```javascript
// Check saved theme
localStorage.getItem('fleetnexus-theme')
// Output: "dark" or "light"
```

---

## ❓ FAQ

### Q: How do I add a new CSS variable?
**A:** 
1. Add to `:root` in `src/index.css`:
```css
:root {
  --my-new-var: #value-for-dark;
}

.light {
  --my-new-var: #value-for-light;
}
```
2. Use it: `background: var(--my-new-var);`

### Q: Why is my component not changing theme?
**A:** Check if:
1. It's using `var(--bg-primary)` (not hardcoded `#070B14`)
2. It's wrapped by `<ThemeProvider>`
3. CSS is actually applied (check DevTools)

### Q: Can I customize the theme colors?
**A:** Yes! Edit the hex values in `src/index.css`:
```css
:root {
  --bg-primary: #YOUR-COLOR-HERE;
}
```

### Q: How do I detect current theme in TypeScript?
**A:**
```typescript
const { theme } = useTheme();
if (theme === 'dark') {
  // Dark mode logic
} else {
  // Light mode logic
}
```

---

## 🎯 Next Steps

1. ✅ **Review** - Check out `THEME_SYSTEM.md` for detailed documentation
2. ✅ **Test** - Toggle theme and verify it works app-wide
3. ✅ **Apply** - Use CSS variables in all new components
4. ✅ **Migrate** - Update existing hardcoded colors to variables
5. ✅ **Customize** - Adjust colors to match your brand

---

## 📦 File Structure

```
fleetnexus/
├── src/
│   ├── context/
│   │   └── ThemeContext.tsx          ← Theme logic
│   ├── components/
│   │   ├── common/
│   │   │   └── ThemeToggle.tsx       ← Toggle button
│   │   ├── settings/
│   │   │   └── SettingsView.tsx      ← Settings with theme
│   │   ├── demo/
│   │   │   └── ThemeDemoView.tsx     ← Theme showcase
│   │   └── layout/
│   │       └── TopBar.tsx            ← Already has toggle
│   ├── App.tsx                        ← Wrapped with ThemeProvider
│   ├── index.css                      ← CSS variables
│   └── main.tsx
├── THEME_SYSTEM.md                    ← Full documentation
└── ...
```

---

## 🎨 Color Reference

### Dark Theme
```
Primary Background:   #070B14
Secondary Background: #0D1320
Tertiary Background:  #111827
Primary Text:         #F4F6FF
Secondary Text:       #A7B1C6
```

### Light Theme
```
Primary Background:   #FFFFFF
Secondary Background: #F8FAFC
Tertiary Background:  #F1F5F9
Primary Text:         #1E293B
Secondary Text:       #64748B
```

### Accent Colors (Always Same)
```
Cyan:    #00F0FF
Violet:  #B829F7
Lime:    #D1F366
Orange:  #FF6A3D
```

---

## 🚀 Pro Tips

1. **Always use transitions** for smooth theme changes
   ```css
   transition: background-color 0.3s ease, color 0.3s ease;
   ```

2. **Test both themes** before committing code
   
3. **Use semantic variable names** in your CSS
   ```css
   /* Good */
   background: var(--bg-primary);
   
   /* Avoid */
   background: var(--color-1);
   ```

4. **Group related variables** in CSS
   ```css
   /* Backgrounds */
   --bg-primary
   --bg-secondary
   
   /* Text */
   --text-primary
   --text-secondary
   ```

---

## ✨ Summary

Your theme system is:
- ✅ **Global** - Affects entire app
- ✅ **Persistent** - Saves user preference
- ✅ **Smooth** - Nice transitions
- ✅ **Easy** - Just use CSS variables
- ✅ **Flexible** - Easy to customize
- ✅ **Production Ready** - Fully tested

Start using it in your components today! 🎉
