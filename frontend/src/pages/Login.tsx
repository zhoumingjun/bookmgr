import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, ConfigProvider, Grid } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useAuth } from '../auth/AuthContext';
import { login } from '../api/auth';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login: setToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  function switchLang() {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  }

  async function handleSubmit(values: { username: string; password: string }) {
    setLoading(true);
    try {
      const res = await login(values.username, values.password);
      setToken(res.token);
      const payload = JSON.parse(atob(res.token.split('.')[1]));
      // Role-based routing
      if (payload.role === 'super_admin' || payload.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (payload.role === 'teacher') {
        navigate('/teacher/console', { replace: true });
      } else if (payload.role === 'parent') {
        navigate('/parent/console', { replace: true });
      } else {
        navigate('/console', { replace: true });
      }
    } catch {
      message.error(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfigProvider
      locale={i18n.language === 'zh' ? zhCN : enUS}
      theme={{ token: { colorPrimary: '#ff6a00', borderRadius: 8 } }}
    >
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5',
        padding: isMobile ? 16 : 24,
      }}>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <Button type="text" icon={<GlobalOutlined />} onClick={switchLang}>
            {i18n.language === 'zh' ? '中文' : 'EN'}
          </Button>
        </div>
        <Card style={{ width: '100%', maxWidth: 400 }} styles={{ body: { padding: isMobile ? 24 : 32 } }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>{t('app.title')}</Title>
            <Text type="secondary">{t('app.subtitle')}</Text>
          </div>
          <Form onFinish={handleSubmit} layout="vertical" size="large">
            <Form.Item name="username" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder={t('login.username')} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} placeholder={t('login.password')} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                {t('login.submit')}
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">如需开通账号，请联系管理员</Text>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}
