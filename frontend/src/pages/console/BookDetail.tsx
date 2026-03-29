import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Typography, Spin, Space, Grid, Empty } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, ReadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getBook, downloadBookUrl, type BookDTO } from '../../api/books';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function BookDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReader, setShowReader] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(res => setBook(res.book))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;
  if (!book) return <Empty description="Book not found" />;

  const token = localStorage.getItem('token');
  const pdfUrl = `${downloadBookUrl(book.id)}?access_token=${token}`;

  function handleDownload() {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${book!.title}.pdf`;
    a.click();
  }

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/console/books')}
        style={{ marginBottom: 16 }}
      >
        {t('bookDetail.back')}
      </Button>

      <Card>
        <Title level={4} style={{ marginTop: 0 }}>{book.title}</Title>
        <Descriptions column={isMobile ? 1 : 2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label={t('books.author')}>{book.author}</Descriptions.Item>
          <Descriptions.Item label={t('bookDetail.addedAt')}>
            {new Date(book.create_time).toLocaleDateString()}
          </Descriptions.Item>
          {book.description && (
            <Descriptions.Item label={t('books.description')} span={2}>
              {book.description}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Space wrap>
          <Button type="primary" icon={<ReadOutlined />} onClick={() => setShowReader(!showReader)}>
            {t('bookDetail.readOnline')}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            {t('bookDetail.download')}
          </Button>
        </Space>
      </Card>

      {showReader && (
        <Card style={{ marginTop: 16 }} styles={{ body: { padding: 0 } }}>
          <iframe
            src={pdfUrl}
            style={{
              width: '100%',
              height: isMobile ? '60vh' : '80vh',
              border: 'none',
              borderRadius: 8,
            }}
            title={book.title}
          />
        </Card>
      )}
    </div>
  );
}
