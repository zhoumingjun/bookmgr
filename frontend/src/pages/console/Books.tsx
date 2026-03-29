import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Pagination, Typography, Empty, Spin } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { listBooks, type BookDTO } from '../../api/books';

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

export default function ConsoleBooksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  // We use token-based pagination from the API but track page number for display
  const [tokenMap, setTokenMap] = useState<Record<number, string>>({ 1: '' });

  async function loadBooks(pageNum: number) {
    setLoading(true);
    try {
      const token = tokenMap[pageNum] || '';
      const res = await listBooks(pageSize, token);
      setBooks(res.books || []);
      if (res.next_page_token) {
        setTokenMap(prev => ({ ...prev, [pageNum + 1]: res.next_page_token }));
        setTotal((pageNum) * pageSize + pageSize); // estimate
      } else {
        setTotal((pageNum - 1) * pageSize + (res.books?.length || 0));
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
                >
                  <div style={{ textAlign: 'center', marginBottom: 16, color: '#ff6a00' }}>
                    <BookOutlined style={{ fontSize: 48 }} />
                  </div>
                  <Meta
                    title={book.title}
                    description={
                      <>
                        <Text type="secondary">{t('catalog.by')}{book.author}</Text>
                        {book.description && (
                          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}>
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
