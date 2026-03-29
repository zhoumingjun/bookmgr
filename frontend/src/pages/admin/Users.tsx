import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Popconfirm, message, Typography, Grid } from 'antd';
import { useTranslation } from 'react-i18next';
import { listUsers, deleteUser, type UserDTO } from '../../api/users';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [nextToken, setNextToken] = useState('');
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState('');
  const [loading, setLoading] = useState(true);
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

  const columns = [
    { title: t('users.username'), dataIndex: 'username', key: 'username' },
    ...(!isMobile ? [{ title: t('users.email'), dataIndex: 'email', key: 'email' }] : []),
    {
      title: t('users.role'), dataIndex: 'role', key: 'role',
      render: (role: string) => (
        <Tag color={role === 'ROLE_ADMIN' ? 'orange' : 'blue'}>
          {role === 'ROLE_ADMIN' ? t('user.roleAdmin') : t('user.roleUser')}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: t('users.createdAt'), dataIndex: 'create_time', key: 'create_time',
      render: (v: string) => new Date(v).toLocaleDateString(),
    }] : []),
    {
      title: t('users.actions'), key: 'actions',
      render: (_: unknown, record: UserDTO) => (
        <span>
          <Button type="link" size="small" onClick={() => navigate(`/admin/users/${record.id}`)}>
            {t('users.edit')}
          </Button>
          <Popconfirm
            title={t('users.deleteConfirm', { name: record.username })}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>{t('users.delete')}</Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>{t('users.title')}</Title>
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
        <Button disabled={prevTokens.length === 0} onClick={() => {
          const prev = [...prevTokens];
          const token = prev.pop() || '';
          setPrevTokens(prev);
          setCurrentToken(token);
        }}>{t('common.cancel') === '取消' ? '上一页' : 'Previous'}</Button>
        <Button disabled={!nextToken} onClick={() => {
          setPrevTokens(prev => [...prev, currentToken]);
          setCurrentToken(nextToken);
        }}>{t('common.cancel') === '取消' ? '下一页' : 'Next'}</Button>
      </div>
    </div>
  );
}
