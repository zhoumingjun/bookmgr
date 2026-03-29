import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Popconfirm, message, Typography, Grid } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { listBooks, deleteBook, type BookDTO } from '../../api/books';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function BooksPage() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [nextToken, setNextToken] = useState('');
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  async function loadBooks(token: string) {
    setLoading(true);
    try {
      const res = await listBooks(20, token);
      setBooks(res.books || []);
      setNextToken(res.next_page_token || '');
    } catch {
      message.error(t('books.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBooks(currentToken); }, [currentToken]);

  async function handleDelete(id: string) {
    try {
      await deleteBook(id);
      message.success(t('books.deleteSuccess'));
      loadBooks(currentToken);
    } catch {
      message.error(t('books.deleteFailed'));
    }
  }

  const columns = [
    { title: t('books.bookTitle'), dataIndex: 'title', key: 'title' },
    { title: t('books.author'), dataIndex: 'author', key: 'author' },
    ...(!isMobile ? [{
      title: t('books.createdAt'), dataIndex: 'create_time', key: 'create_time',
      render: (v: string) => new Date(v).toLocaleDateString(),
    }] : []),
    {
      title: t('books.actions'), key: 'actions',
      render: (_: unknown, record: BookDTO) => (
        <span>
          <Button type="link" size="small" onClick={() => navigate(`/admin/books/${record.id}`)}>
            {t('books.edit')}
          </Button>
          <Popconfirm
            title={t('books.deleteConfirm', { name: record.title })}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>{t('books.delete')}</Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('books.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/books/new')}>
          {t('books.add')}
        </Button>
      </div>
      <Table
        dataSource={books}
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
