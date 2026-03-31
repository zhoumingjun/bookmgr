import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Pagination, Typography, Empty, Spin, Tag } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { listBooks, type BookDTO } from '../../api/books';

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

function CoverImage({ url, title }: { url?: string; title: string }) {
  if (url) {
    return <img src={url} alt={title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />;
  }
  return (
    <div style={{ width: '100%', height: 180, background: 'linear-gradient(135deg, #ff6a00 0%, #ff9f00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BookOutlined style={{ fontSize: 48, color: '#fff' }} />
    </div>
  );
}

export default function ConsoleBooksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const [tokenMap, setTokenMap] = useState<Record<number, string>>({ 1: '' });

  async function loadBooks(pageNum: number) {
    setLoading(true);
    try {
      const token = tokenMap[pageNum] || '';
      const res = await listBooks(pageSize, token, undefined, 'approved');
      const filtered = (res.books || []).filter((b: BookDTO) => b.status === 'approved');
      setBooks(filtered);
      if (res.next_page_token) {
        setTokenMap(prev => ({ ...prev, [pageNum + 1]: res.next_page_token }));
        setTotal(pageNum * pageSize + pageSize);
      } else {
        setTotal((pageNum - 1) * pageSize + filtered.length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBooks(page); }, [page]);

  return (
    <div>
      <Title level={4}>{t('catalog.title')}</Title>
      {loading ? (
        <Spin style={{ display: 'block', marginTop: 48 }} />
      ) : books.length === 0 ? (
        <Empty description={t('catalog.empty')} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {books.map(book => (
              <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/console/books/${book.id}`)}
                  style={{ height: '100%' }}
                  cover={<CoverImage url={book.cover_image_url} title={book.title} />}
                >
                  <Meta
                    title={book.title}
                    description={
                      <>
                        <Text type="secondary" style={{ fontSize: 12 }}>{t('catalog.by')}{book.author}</Text>
                        {book.dimensions && book.dimensions.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            {book.dimensions.slice(0, 2).map(d => (
                              <Tag key={d.slug} color="orange" style={{ fontSize: 11 }}>{d.name}</Tag>
                            ))}
                          </div>
                        )}
                        {book.description && (
                          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 6, marginBottom: 0, fontSize: 12 }}>
                            {book.description}
                          </Paragraph>
                        )}
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
