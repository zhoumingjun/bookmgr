import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Spin, Empty, Tag, Grid } from 'antd';
import { HeartOutlined, BookOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { listMyFavorites, type FavoriteBookDTO } from '../../api/favorites';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteBookDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [nextToken, setNextToken] = useState('');
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    listMyFavorites(pageSize, page > 1 ? nextToken : '')
      .then(res => {
        setFavorites(res.favorites);
        setNextToken(res.next_page_token);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <HeartOutlined style={{ fontSize: 24, color: '#ff6a00' }} />
        <Title level={3} style={{ margin: 0 }}>{t('favorites.title', '我的收藏')}</Title>
      </div>

      {favorites.length === 0 ? (
        <Empty description={t('favorites.empty', '暂无收藏')} />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}>
            {favorites.map(fav => (
              <Card
                key={fav.id}
                hoverable
                cover={
                  fav.book.cover_image_url ? (
                    <img
                      src={fav.book.cover_image_url}
                      alt={fav.book.title}
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      height: 160,
                      background: 'linear-gradient(135deg, #ff6a00 0%, #ff9f00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <BookOutlined style={{ fontSize: 40, color: '#fff' }} />
                    </div>
                  )
                }
                onClick={() => navigate(`/console/books/${fav.book.id}`)}
                styles={{ body: { padding: 12 } }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fav.book.title}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  {fav.book.author || '-'}
                </div>
                {fav.book.dimensions && fav.book.dimensions.length > 0 && (
                  <div>
                    {fav.book.dimensions.slice(0, 2).map(d => (
                      <Tag key={d.slug} color="orange" style={{ fontSize: 11 }}>{d.name}</Tag>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>
                  {new Date(fav.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
          {nextToken && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={() => setPage(p => p + 1)}>{t('common.loadMore', '加载更多')}</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
