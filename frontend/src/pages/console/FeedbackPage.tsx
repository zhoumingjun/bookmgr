import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Spin, Empty, Tag, Grid, Rate } from 'antd';
import { MessageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { listMyFeedback, type BookFeedbackDTO } from '../../api/favorites';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const FEEDBACK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  read_start: { label: '开始阅读', color: 'blue' },
  read_complete: { label: '阅读完成', color: 'green' },
  difficulty_rating: { label: '难度评分', color: 'orange' },
  use_scenario: { label: '使用场景', color: 'purple' },
};

function FeedbackCard({ fb, onClick }: { fb: BookFeedbackDTO; onClick: () => void }) {
  const typeInfo = FEEDBACK_TYPE_LABELS[fb.feedback_type] || { label: fb.feedback_type, color: 'default' };

  return (
    <Card
      hoverable
      onClick={onClick}
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(fb.created_at).toLocaleDateString()}
            </Text>
          </div>

          {fb.feedback_type === 'read_start' && (
            <div style={{ color: '#1890ff' }}>
              <CheckCircleOutlined /> 开始阅读
            </div>
          )}

          {fb.feedback_type === 'read_complete' && (
            <div style={{ color: '#52c41a' }}>
              <CheckCircleOutlined /> 阅读完成
            </div>
          )}

          {fb.feedback_type === 'difficulty_rating' && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>难度评分</Text>
              <Rate disabled value={fb.difficulty_rating} style={{ fontSize: 14 }} />
              <Text style={{ marginLeft: 8, fontSize: 12 }}>{fb.difficulty_rating}/5</Text>
            </div>
          )}

          {fb.feedback_type === 'use_scenario' && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>使用场景：</Text>
              <Text>{fb.use_scenario}</Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function FeedbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<BookFeedbackDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [nextToken, setNextToken] = useState('');
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    listMyFeedback(pageSize, page > 1 ? nextToken : '')
      .then(res => {
        setFeedbacks(res.feedbacks);
        setNextToken(res.next_page_token);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <MessageOutlined style={{ fontSize: 24, color: '#ff6a00' }} />
        <Title level={3} style={{ margin: 0 }}>{t('feedback.title', '我的反馈')}</Title>
      </div>

      {feedbacks.length === 0 ? (
        <Empty description={t('feedback.empty', '暂无反馈记录')} />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}>
            {feedbacks.map(fb => (
              <FeedbackCard
                key={fb.id}
                fb={fb}
                onClick={() => navigate(`/console/books/${fb.book_id}`)}
              />
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
