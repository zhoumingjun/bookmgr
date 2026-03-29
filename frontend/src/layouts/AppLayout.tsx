import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Dropdown,
  Button,
  Drawer,
  Grid,
  ConfigProvider,
  theme,
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  GlobalOutlined,
  MenuOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useAuth } from '../auth/AuthContext';

const { Header, Content } = Layout;
const { useBreakpoint } = Grid;

export default function AppLayout() {
  const { t, i18n } = useTranslation();
  const { isAdmin, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Decode username from JWT
  const username = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub?.slice(0, 8) || 'User';
    } catch {
      return 'User';
    }
  }, []);

  const antdLocale = i18n.language === 'zh' ? zhCN : enUS;

  const navItems = useMemo(() => {
    const items = [
      { key: '/console/books', icon: <BookOutlined />, label: t('nav.bookCatalog') },
    ];
    if (isAdmin) {
      items.push(
        { key: '/admin/users', icon: <TeamOutlined />, label: t('nav.userManagement') },
        { key: '/admin/books', icon: <BookOutlined />, label: t('nav.bookManagement') },
      );
    }
    return items;
  }, [isAdmin, t]);

  const selectedKey = navItems.find(item => location.pathname.startsWith(item.key))?.key || navItems[0]?.key;

  function handleNavClick({ key }: { key: string }) {
    navigate(key);
    setDrawerOpen(false);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function switchLang() {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  }

  const userMenuItems = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 500 }}>{username}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {role === 'admin' ? t('user.roleAdmin') : t('user.roleUser')}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('user.logout'),
      onClick: handleLogout,
    },
  ];

  const rightSection = (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
      <Button
        type="text"
        icon={<GlobalOutlined />}
        onClick={switchLang}
        style={{ color: '#fff' }}
      >
        {!isMobile && (i18n.language === 'zh' ? '中文' : 'EN')}
      </Button>
      <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
        <Button type="text" style={{ color: '#fff' }}>
          <UserOutlined />
          {!isMobile && <span style={{ marginLeft: 4 }}>{username}</span>}
          <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
        </Button>
      </Dropdown>
    </div>
  );

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: '#ff6a00',
          borderRadius: 8,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#1a1a1a',
            padding: isMobile ? '0 12px' : '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 48,
            lineHeight: '48px',
          }}
        >
          {isMobile ? (
            <>
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ color: '#fff', marginRight: 8 }}
              />
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, flex: 1 }}>
                {t('app.title')}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 16,
                  marginRight: 32,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => navigate('/console/books')}
              >
                {t('app.title')}
              </div>
              <Menu
                mode="horizontal"
                selectedKeys={[selectedKey]}
                items={navItems}
                onClick={handleNavClick}
                style={{
                  flex: 1,
                  background: 'transparent',
                  borderBottom: 'none',
                  lineHeight: '48px',
                }}
                theme="dark"
              />
            </>
          )}
          {rightSection}
        </Header>

        {isMobile && (
          <Drawer
            title={t('app.title')}
            placement="left"
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            width={260}
            styles={{ body: { padding: 0 } }}
          >
            <Menu
              mode="vertical"
              selectedKeys={[selectedKey]}
              items={[
                ...navItems,
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: t('user.logout') },
              ]}
              onClick={({ key }) => {
                if (key === 'logout') {
                  handleLogout();
                } else {
                  handleNavClick({ key });
                }
              }}
              style={{ border: 'none' }}
            />
          </Drawer>
        )}

        <Content style={{ padding: isMobile ? 12 : 24, flex: 1 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
