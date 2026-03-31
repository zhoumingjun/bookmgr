import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Popconfirm, message, Typography, Grid, Modal, Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { listUsers, deleteUser, createUser, RoleOptions, getRoleLabel, getRoleColor, type UserDTO } from '../../api/users';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [nextToken, setNextToken] = useState('');
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  async function loadUsers(token: string) {
    setLoading(true);
    try {
      const res = await listUsers(20, token);
      setUsers(res.users || []);
      setNextToken(res.next_page_token || '');
    } catch {
      message.error(t('users.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(currentToken); }, [currentToken]);

  async function handleDelete(id: string) {
    try {
      await deleteUser(id);
      message.success(t('users.deleteSuccess'));
      loadUsers(currentToken);
    } catch {
      message.error(t('users.deleteFailed'));
    }
  }

  async function handleCreate(values: { username: string; email: string; role: string; password?: string }) {
    setCreateLoading(true);
    try {
      const res = await createUser(values);
      setCreateModalOpen(false);
      form.resetFields();
      message.success(t('users.createSuccess'));
      if (res.generated_password) {
        message.info(`初始密码：${res.generated_password}，请告知用户`);
      }
      loadUsers(currentToken);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || t('users.createFailed');
      message.error(msg);
    } finally {
      setCreateLoading(false);
    }
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    ...(!isMobile ? [{ title: '邮箱', dataIndex: 'email', key: 'email' }] : []),
    {
      title: '角色', dataIndex: 'role', key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: '创建时间', dataIndex: 'create_time', key: 'create_time',
      render: (v: string) => new Date(v).toLocaleDateString(),
    }] : []),
    {
      title: '操作', key: 'actions',
      render: (_: unknown, record: UserDTO) => (
        <span>
          <Button type="link" size="small" onClick={() => navigate(`/admin/users/${record.id}`)}>
            编辑
          </Button>
          <Popconfirm
            title={`确认删除用户 "${record.username}" 吗？`}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>用户管理</Title>
        <Button type="primary" onClick={() => setCreateModalOpen(true)}>
          创建用户
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size={isMobile ? 'small' : 'middle'}
        scroll={isMobile ? { x: 480 } : undefined}
      />

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button
          disabled={prevTokens.length === 0}
          onClick={() => {
            const prev = [...prevTokens];
            const token = prev.pop() || '';
            setPrevTokens(prev);
            setCurrentToken(token);
          }}
        >
          上一页
        </Button>
        <Button
          disabled={!nextToken}
          onClick={() => {
            setPrevTokens(prev => [...prev, currentToken]);
            setCurrentToken(nextToken);
          }}
        >
          下一页
        </Button>
      </div>

      <Modal
        title="创建用户"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }, { pattern: /^[a-zA-Z0-9_-]{3,64}$/, message: '用户名由3-64位字母、数字、下划线或连字符组成' }]}
          >
            <Input placeholder="如：teacher_zhang" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="如：zhang@school.edu.cn" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择用户角色">
              {RoleOptions.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="password"
            label="初始密码（留空则自动生成）"
          >
            <Input.Password placeholder="留空则自动生成12位随机密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={createLoading} block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
