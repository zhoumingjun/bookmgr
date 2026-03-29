## 1. Setup

- [x] 1.1 Install dependencies: `antd`, `react-i18next`, `i18next`
- [x] 1.2 Configure Ant Design theme token: primary color `#ff6a00`, border-radius 8px (Alibaba Cloud style)
- [x] 1.3 Create `frontend/src/styles/global.css`: dark header (`#1a1a1a`), light gray body (`#f5f5f5`), card shadows, typography overrides, responsive breakpoints (768px)
- [x] 1.4 Add viewport meta tag in `index.html` if missing
- [x] 1.5 Verify Vite build works with new dependencies

## 2. i18n

- [x] 2.1 Create `frontend/src/i18n.ts`: i18next config with `zh` and `en` resources, default `zh`, localStorage persistence
- [x] 2.2 Create `frontend/src/locales/zh.json`: Chinese translations for all UI text
- [x] 2.3 Create `frontend/src/locales/en.json`: English translations for all UI text
- [x] 2.4 Wrap app with i18n provider in `main.tsx`

## 3. Layout + Routing

- [x] 3.1 Create `frontend/src/layouts/AppLayout.tsx`: dark header with horizontal Menu (desktop) / hamburger + Drawer (mobile), right-aligned language switcher + user Dropdown (icon-only on mobile). Ant Design ConfigProvider with custom theme token and locale sync. Use `Grid.useBreakpoint()` for responsive logic.
- [x] 3.2 Update `frontend/src/App.tsx`: nest admin and console routes under `<AppLayout>` using React Router `<Outlet />`

## 4. Auth Pages

- [x] 4.1 Rewrite `frontend/src/pages/Login.tsx`: centered Card with Ant Design Form, link to register, all text via `t()`
- [x] 4.2 Create `frontend/src/pages/Register.tsx`: centered Card with Ant Design Form (username, email, password), redirect to login on success

## 5. Admin Pages

- [x] 5.1 Rewrite `frontend/src/pages/admin/Users.tsx`: Ant Design Table with pagination, role Tags, Popconfirm delete; mobile: responsive columns or card-list fallback
- [x] 5.2 Rewrite `frontend/src/pages/admin/UserEdit.tsx`: Ant Design Form with Select for role, password reset; single-column on mobile
- [x] 5.3 Rewrite `frontend/src/pages/admin/Books.tsx`: Ant Design Table with pagination, Popconfirm delete, "Add Book" button; mobile: responsive columns or card-list fallback
- [x] 5.4 Rewrite `frontend/src/pages/admin/BookNew.tsx`: Ant Design Form with Upload for PDF; single-column on mobile
- [x] 5.5 Rewrite `frontend/src/pages/admin/BookEdit.tsx`: Ant Design Form with Upload for replacing PDF; single-column on mobile

## 6. Console Pages

- [x] 6.1 Rewrite `frontend/src/pages/console/Books.tsx`: Ant Design Card grid with auto-fill responsive columns, Pagination
- [x] 6.2 Rewrite `frontend/src/pages/console/BookDetail.tsx`: book metadata + iframe PDF viewer (full-width on mobile) + download button

## 7. Cleanup

- [x] 7.1 Remove unused admin Dashboard page (navigation now in AppLayout)
- [x] 7.2 Remove console Home page (replaced by Books as default console route)

## 8. Verification

- [x] 8.1 `npm run build` succeeds
- [x] 8.2 Docker compose rebuild frontend, verify pages render
- [x] 8.3 Smoke test: switch language → all UI text switches between 中文 and English
- [x] 8.4 Smoke test: admin login → top nav → CRUD flows → user dropdown → logout
- [x] 8.5 Smoke test: user login → browse books → click → PDF renders in iframe → download → logout
- [x] 8.6 Responsive test: Chrome DevTools mobile viewport (375px) → hamburger menu works → forms single-column → tables readable → PDF viewer usable
