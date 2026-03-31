import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, message, Typography, Spin } from 'antd';
import { getUser, updateUser, RoleOptions } from '../../api/users';

const { Title } = Typography;

export default function UserEditPage() {
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
    }).catch(() => message.error('加载用户信息失败'))
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
      message.success('保存成功');
      navigate('/admin/users');
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;

  return (
    <div>
      <Title level={4}>编辑用户</Title>
      <Card style={{ maxWidth: 500 }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="用户名" name="username">
            <Input disabled />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input disabled />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="选择用户角色">
              {RoleOptions.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="新密码（留空不修改）" name="password">
            <Input.Password placeholder="留空则保持原密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={saving} style={{ marginRight: 8 }}>
              保存
            </Button>
            <Button onClick={() => navigate('/admin/users')}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
