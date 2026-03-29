## Visual Style Reference: Alibaba Cloud Console

Follow the Alibaba Cloud (aliyun.com) console design language:

### Color Scheme
- **Primary**: `#ff6a00` (Alibaba Cloud orange) for brand accents, active menu items, primary buttons
- **Header background**: `#1a1a1a` (near-black dark header)
- **Header text**: `#ffffff` (white), menu hover: `rgba(255,255,255,0.85)`
- **Body background**: `#f5f5f5` (light gray)
- **Card background**: `#ffffff` with subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`
- **Text primary**: `#333333`, secondary: `#666666`, tertiary: `#999999`
- **Danger/delete**: `#ff4d4f` (Ant Design default red)

### Top Navigation Bar
- Height: 48-50px, fixed at top
- Dark background (`#1a1a1a`), full width
- Left: logo/product name in white
- Center-left: horizontal menu items in white, active item with orange bottom border or highlight
- Right: language switcher + user avatar/name dropdown, all in white/light gray
- Clean dividers between right-side elements

### Layout
- Content area below header with `padding: 24px`, max-width container
- Page title as breadcrumb or simple heading at top of content area
- Tables and forms inside white Cards with 16-24px padding and border-radius: 8px

### Components
- **Buttons**: primary = orange fill, default = white with gray border
- **Tables**: clean horizontal lines, hover row highlight `#fafafa`, pagination at bottom right
- **Forms**: label-top layout, consistent field spacing
- **Tags**: role tags with subtle background colors (admin = orange, user = blue)

### Typography
- Font: system font stack (same as Ant Design default)
- Headings: 16-20px semibold, body: 14px regular

### Responsive Design
- **Breakpoint**: `768px` — below is mobile, above is desktop
- **Mobile header**: collapse horizontal Menu into hamburger icon (Ant Design `Drawer`), tap to open full-screen navigation drawer
- **Language switcher + user dropdown**: remain visible in header on all sizes; on mobile, compact as icon-only buttons
- **Tables (Users, Books)**: on mobile, switch to Ant Design `List` with card-style items or use horizontal scroll wrapper
- **Forms**: single-column layout on mobile (label on top, full-width inputs)
- **Book catalog cards**: grid `repeat(auto-fill, minmax(280px, 1fr))` — naturally wraps from multi-column to single-column
- **PDF viewer iframe**: full width, reduced height on mobile with expand-to-fullscreen button
- **Spacing**: content padding 24px on desktop, 12-16px on mobile

---

## Context

The frontend is a React 19 + TypeScript + Vite app with React Router. Authentication (AuthContext, JWT in localStorage) and API client (axios with interceptor) are already in place. All pages currently use raw HTML with inline styles. There are two route groups: `/admin/*` (requires role=admin) and `/console/*` (any authenticated user).

## Goals / Non-Goals

**Goals:**
- Unified top navigation layout for all authenticated pages
- Right-aligned user dropdown (user info + logout) visible on every page
- Admin top nav: User Management, Book Management
- Console top nav: Book Catalog, click book to read (PDF viewer)
- Polished UI using Ant Design components

**Non-Goals:**
- Sidebar navigation (not needed for current page count)
- Dark mode / theme customization

## Decisions

### 1. Ant Design 5.x

**Choice**: Use `antd` v5 (CSS-in-JS, tree-shakeable, zero-config with Vite).

**Why**: Most mature React UI library for management systems. Built-in Layout, Menu, Table, Form, Upload.

### 2. Single top-navigation layout

**Choice**: One shared `AppLayout` component for all authenticated pages:

Desktop (>=768px):
```
┌──────────────────────────────────────────────────────┐
│ Logo/Title    [Nav Items...]      [🌐 Lang] [User ▼] │
├──────────────────────────────────────────────────────┤
│                                                      │
│                    Content                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Mobile (<768px):
```
┌──────────────────────────┐
│ [☰]  Logo       [🌐] [👤] │
├──────────────────────────┤
│                          │
│        Content           │
│                          │
└──────────────────────────┘

Drawer (hamburger tap):
┌──────────────────────────┐
│  ✕  Navigation           │
│  ─────────────           │
│  User Management         │
│  Book Management         │
│  ─────────────           │
│  Logout                  │
└──────────────────────────┘
```

- Admin sees nav items: "User Management", "Book Management"
- Regular user sees nav items: "Book Catalog"
- Right side: language switcher (中文/EN) + user dropdown (username, role, logout)
- Mobile: nav collapses to hamburger → Drawer; lang/user become icon-only
- Login/Register pages: no layout wrapper (but language switcher still available)

**Why**: Top navigation is cleaner for the current number of pages. One layout component reduces duplication. Nav items adapt based on role from AuthContext.

### 3. i18n with react-i18next

**Choice**: Use `react-i18next` + `i18next` for internationalization. Two languages: Chinese (`zh`) and English (`en`). Translation files stored as JSON under `frontend/src/locales/zh.json` and `frontend/src/locales/en.json`. Default language: `zh`. Language preference persisted in `localStorage`.

**Why**: react-i18next is the de-facto React i18n library. Lightweight, hook-based (`useTranslation`), supports lazy loading. Ant Design also provides locale switching via `ConfigProvider` — we sync both.

**Alternative considered**: Custom context with a translation map — works for small apps but doesn't scale and lacks pluralization/interpolation.

### 4. Language switcher

**Choice**: A globe icon button or `Select` placed in the Header, to the left of the user dropdown. Clicking toggles between 中文 and English. Switching language:
1. Updates `i18next` language → all `t()` calls re-render
2. Updates Ant Design `ConfigProvider` locale (zhCN / enUS) → table pagination text, form validation messages etc. switch language
3. Persists choice to `localStorage`

**Why**: Minimal UI footprint. Immediately visible. Persisted so user doesn't re-select on each visit.

### 5. PDF reading in browser

**Choice**: Use `<iframe>` to display PDF inline on the book detail page, with browser's native PDF viewer. Fallback download button.

**Why**: All modern browsers have built-in PDF rendering. No extra dependency needed. Simple and reliable.

**Alternative considered**: react-pdf / pdf.js — adds significant bundle size for a feature the browser already handles natively.

### 4. User dropdown

**Choice**: Ant Design `Dropdown` with `Avatar` in the Header right section. Menu items:
- User info display (username, role)
- Divider
- "Logout" item

Click "Logout" → clear token → redirect to `/login`.

**Why**: Standard pattern. Visible on every page. Non-intrusive.

### 5. Page component mapping

| Page | Key Ant Design components |
|------|--------------------------|
| Login | Card, Form, Input, Button |
| Register | Card, Form, Input, Button |
| Admin Users | Table (columns, pagination), Popconfirm, Tag (role) |
| Admin UserEdit | Form, Input, Select (role), Button |
| Admin Books | Table, Popconfirm, Button |
| Admin BookNew | Form, Input, Upload (PDF), Button |
| Admin BookEdit | Form, Input, Upload, Button |
| Console Books | Card grid, Pagination |
| Console BookDetail | Descriptions, Button (download), iframe (PDF viewer) |

### 6. Navigation feedback

**Choice**: Ant Design `message` for success/error toasts. `Popconfirm` for destructive actions (delete user/book). Replace native `confirm()` and `alert()`.

## Risks / Trade-offs

- **[Bundle size]** → Ant Design adds ~200-300KB gzipped. Acceptable for internal tool.
- **[Full page rewrite]** → Every page component changes. Mitigation: backend API unchanged, E2E curl tests still valid.
- **[iframe PDF]** → Some PDFs with complex features may render differently across browsers. Acceptable trade-off vs adding pdf.js dependency.
