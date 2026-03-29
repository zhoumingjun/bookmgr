import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Typography, Spin, Space, Grid, Empty, InputNumber } from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ReadOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getBook, downloadBookBlob, downloadBookUrl, type BookDTO } from '../../api/books';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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

  // PDF state
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(isMobile ? 0.8 : 1.2);

  const pdfUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : null), [pdfBlob]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(res => setBook(res.book))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReadOnline() {
    if (showReader) {
      setShowReader(false);
      return;
    }
    if (!pdfBlob && id) {
      setPdfLoading(true);
      try {
        const blob = await downloadBookBlob(id);
        setPdfBlob(blob);
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

      {showReader && pdfUrl && (
        <Card style={{ marginTop: 16 }} styles={{ body: { padding: isMobile ? 8 : 16 } }}>
          {/* Controls */}
          <Space
            style={{
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              icon={<LeftOutlined />}
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(p => p - 1)}
            />
            <Space size={4}>
              <InputNumber
                min={1}
                max={numPages || 1}
                value={pageNumber}
                onChange={v => v && setPageNumber(v)}
                style={{ width: 60 }}
                size="small"
              />
              <span>/ {numPages}</span>
            </Space>
            <Button
              icon={<RightOutlined />}
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber(p => p + 1)}
            />
            <Button
              icon={<ZoomOutOutlined />}
              disabled={scale <= 0.5}
              onClick={() => setScale(s => Math.round((s - 0.2) * 10) / 10)}
            />
            <span>{Math.round(scale * 100)}%</span>
            <Button
              icon={<ZoomInOutlined />}
              disabled={scale >= 3}
              onClick={() => setScale(s => Math.round((s + 0.2) * 10) / 10)}
            />
          </Space>

          {/* PDF Viewer */}
          <div style={{ overflow: 'auto', textAlign: 'center' }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              loading={<Spin style={{ marginTop: 48 }} />}
            >
              <Page pageNumber={pageNumber} scale={scale} />
            </Document>
          </div>
        </Card>
      )}
    </div>
  );
}
