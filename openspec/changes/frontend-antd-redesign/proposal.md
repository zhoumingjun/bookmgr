## Why

The frontend currently uses raw HTML elements with inline styles — no navigation, no logout button, no shared layout. Users cannot navigate between sections or log out. The app is unusable as a real product.

## What Changes

- Install Ant Design (`antd`) as the UI framework
- Create a shared `AppLayout` with top navigation bar: left side shows nav items based on role (admin: User Management / Book Management; user: Book Catalog), right side shows language switcher (中文/English) and user dropdown (user info + logout)
- Add i18n support with react-i18next: Chinese and English, all UI text externalized into translation files
- Rewrite all pages using Ant Design components (Table, Form, Card, etc.)
- Add a Register page
- Add in-browser PDF reading on book detail page (iframe with native PDF viewer)
- Responsive design: mobile (<768px) uses hamburger menu + Drawer navigation, single-column forms, card-list fallback for tables, full-width PDF viewer
- Use React Router nested routes for layout wrapping

## Capabilities

### New Capabilities

- `app-layout`: Shared top navigation layout with role-based menu items, language switcher, and user dropdown (info + logout)
- `i18n`: Chinese/English language switching with react-i18next, persisted in localStorage
- `register-page`: User registration page with Ant Design Form
- `pdf-reader`: In-browser PDF viewing on book detail page

### Modified Capabilities

- `login-page`: Rewritten with Ant Design Form/Card
- `admin-users`: Rewritten with Ant Design Table and Form
- `admin-books`: Rewritten with Ant Design Table, Form, Upload
- `console-books`: Rewritten with Ant Design Card grid
- `console-book-detail`: Rewritten with PDF iframe viewer and download button

## Impact

- **Dependencies**: `antd`, `react-i18next`, `i18next` added to frontend
- **Code**: All files under `frontend/src/pages/` rewritten, new `frontend/src/layouts/AppLayout.tsx`, updated `App.tsx`
- **No backend changes**
- **No API changes**
