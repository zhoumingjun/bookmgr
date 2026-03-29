import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Typography, Spin, Space, Grid, Empty } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, ReadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import { getBook, downloadBookBlob, downloadBookUrl, type BookDTO } from '../../api/books';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function BookDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReader, setShowReader] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(res => setBook(res.book))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Delay mounting PDFViewer until container is in the DOM and laid out
  useEffect(() => {
    if (!showReader || !pdfBlobUrl) {
      setViewerReady(false);
      return;
    }
    // Wait for the container div to be laid out before mounting the viewer
    const frameId = requestAnimationFrame(() => {
      setViewerReady(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, [showReader, pdfBlobUrl]);

  async function handleReadOnline() {
    if (showReader) {
      setShowReader(false);
      return;
    }
    if (!pdfBlobUrl && id) {
      setPdfLoading(true);
      try {
        const blob = await downloadBookBlob(id);
        setPdfBlobUrl(URL.createObjectURL(blob));
      } catch {
        // ignore
      } finally {
        setPdfLoading(false);
      }
    }
    setShowReader(true);
  }

  function handleDownload() {
    if (!book) return;
    const token = localStorage.getItem('token');
    const url = `${downloadBookUrl(book.id)}?access_token=${token}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title}.pdf`;
    a.click();
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;
  if (!book) return <Empty description="Book not found" />;

  const pdfLocale = i18n.language === 'zh' ? 'zh-CN' : 'en';

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
          <Button
            type="primary"
            icon={<ReadOutlined />}
            onClick={handleReadOnline}
            loading={pdfLoading}
          >
            {t('bookDetail.readOnline')}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            {t('bookDetail.download')}
          </Button>
        </Space>
      </Card>

      {showReader && pdfBlobUrl && (
        <div style={{ marginTop: 16, height: isMobile ? '60vh' : '80vh', width: '100%' }}>
          {viewerReady ? (
            <PDFViewer
              config={{
                src: pdfBlobUrl,
                tabBar: 'never',
                theme: { preference: 'light' },
                i18n: { defaultLocale: pdfLocale },
              }}
            />
          ) : (
            <Spin style={{ display: 'block', marginTop: 48 }} />
          )}
        </div>
      )}
    </div>
  );
}
