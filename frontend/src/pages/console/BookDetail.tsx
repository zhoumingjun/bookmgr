import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Typography, Spin, Space, Grid, Empty, Tag, Progress, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, ReadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PDFViewer } from '@embedpdf/react-pdf-viewer';
import { getBook, downloadBookBlob, downloadBookUrl, type BookDTO } from '../../api/books';
import { getReadingProgress } from '../../api/progress';

const { Title } = Typography;
const { useBreakpoint } = Grid;

function CoverImage({ url, title }: { url?: string; title: string }) {
  if (url) {
    return <img src={url} alt={title} style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8 }} />;
  }
  return (
    <div style={{ width: '100%', height: 300, background: 'linear-gradient(135deg, #ff6a00 0%, #ff9f00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
      <span style={{ fontSize: 80 }}>📖</span>
    </div>
  );
}

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
  const [progress, setProgress] = useState<{ percent: number; page: number } | null>(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getBook(id).then(res => setBook(res.book)).catch(() => {}),
      getReadingProgress(id).then(p => {
        if (p) setProgress({ percent: p.progress_percent, page: p.last_page });
      }),
    ]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  useEffect(() => {
    if (!showReader || !pdfBlobUrl) {
      setViewerReady(false);
      return;
    }
    const frameId = requestAnimationFrame(() => setViewerReady(true));
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
        message.error('加载失败');
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
  const ageMin = book.recommended_age_min || 0;
  const ageMax = book.recommended_age_max || 216;
  const ageRange = ageMin > 0 || ageMax < 216
    ? `${Math.floor(ageMin / 12)}岁 ~ ${Math.floor(ageMax / 12)}岁`
    : '全部年龄段';

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

      <Card style={{ marginBottom: 16 }}>
        <Space align="start" size={16} style={{ width: '100%' }} wrap>
          <div style={{ flex: '0 0 200px', width: '100%', maxWidth: 220 }}>
            <CoverImage url={book.cover_image_url} title={book.title} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={4} style={{ marginTop: 0 }}>{book.title}</Title>
            <Descriptions column={isMobile ? 1 : 2} size="small">
              <Descriptions.Item label="作者">{book.author || '-'}</Descriptions.Item>
              <Descriptions.Item label="推荐年龄">{ageRange}</Descriptions.Item>
              {book.core_goal && <Descriptions.Item label="核心目标">{book.core_goal}</Descriptions.Item>}
              {book.cognitive_level && <Descriptions.Item label="认知适配">{book.cognitive_level}</Descriptions.Item>}
            </Descriptions>
            {book.description && (
              <p style={{ color: '#666', marginTop: 8 }}>{book.description}</p>
            )}
            {book.dimensions && book.dimensions.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {book.dimensions.map(d => (
                  <Tag key={d.slug} color="orange">{d.name}</Tag>
                ))}
              </div>
            )}

            {progress && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 12, color: '#999' }}>阅读进度：第 {progress.page} 页</span>
                <Progress percent={progress.percent} size="small" showInfo={false} />
              </div>
            )}

            <Space wrap style={{ marginTop: 12 }}>
              <Button type="primary" icon={<ReadOutlined />} onClick={handleReadOnline} loading={pdfLoading}>
                在线阅读
              </Button>
              {book.has_digital && (
                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                  下载
                </Button>
              )}
            </Space>
          </div>
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
