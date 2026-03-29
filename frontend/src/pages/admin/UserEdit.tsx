import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, message, Typography, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { getUser, updateUser } from '../../api/users';

const { Title } = Typography;

export default function UserEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalRole, setOriginalRole] = useState('');

  useEffect(() => {
    if (!id) return;
    getUser(id).then(res => {
      form.setFieldsValue({
        username: res.user.username,
        email: res.user.email,
        role: res.user.role,
      });
      setOriginalRole(res.user.role);
    }).catch(() => message.error(t('userEdit.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: { role: string; password?: string }) {
    if (!id) return;
    setSaving(true);
    try {
      const mask: string[] = [];
      const fields: Record<string, string> = {};
      if (values.role !== originalRole) {
        mask.push('role');
        fields.role = values.role;
      }
      if (values.password) {
        mask.push('password');
        fields.password = values.password;
      }
      if (mask.length > 0) {
        await updateUser(id, fields, mask);
      }
      message.success(t('userEdit.success'));
      navigate('/admin/users');
    } catch {
      message.error(t('userEdit.error'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;

  return (
    <div>
      <Title level={4}>{t('userEdit.title')}</Title>
      <Card style={{ maxWidth: 500 }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label={t('users.username')} name="username">
            <Input disabled />
          </Form.Item>
          <Form.Item label={t('users.email')} name="email">
            <Input disabled />
          </Form.Item>
          <Form.Item label={t('userEdit.role')} name="role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="ROLE_USER">{t('user.roleUser')}</Select.Option>
              <Select.Option value="ROLE_ADMIN">{t('user.roleAdmin')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={t('userEdit.newPassword')} name="password">
            <Input.Password placeholder={t('userEdit.newPasswordPlaceholder')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} style={{ marginRight: 8 }}>
              {t('userEdit.save')}
            </Button>
            <Button onClick={() => navigate('/admin/users')}>{t('userEdit.cancel')}</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
