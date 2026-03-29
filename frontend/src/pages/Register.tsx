import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, ConfigProvider, Grid } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { register } from '../api/auth';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  function switchLang() {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  }

  async function handleSubmit(values: { username: string; email: string; password: string }) {
    setLoading(true);
    try {
      await register(values.username, values.email, values.password);
      message.success(t('register.success'));
      navigate('/login');
    } catch {
      message.error(t('register.error'));
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
            <Text type="secondary">{t('register.title')}</Text>
          </div>
          <Form onFinish={handleSubmit} layout="vertical" size="large">
            <Form.Item name="username" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder={t('register.username')} />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
              <Input prefix={<MailOutlined />} placeholder={t('register.email')} />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, min: 6 }]}>
              <Input.Password prefix={<LockOutlined />} placeholder={t('register.password')} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error(t('register.passwordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder={t('register.confirmPassword')} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                {t('register.submit')}
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">{t('register.hasAccount')} </Text>
            <Link to="/login">{t('register.login')}</Link>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}
