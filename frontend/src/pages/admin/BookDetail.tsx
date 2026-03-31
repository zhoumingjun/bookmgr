import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Spin, Typography, Divider } from 'antd';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getBook, type BookDTO } from '../../api/books';
import BookFileList from './BookFileList';
import BookFileUpload from './BookFileUpload';

const { Title } = Typography;

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(res => setBook(res.book))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;
  if (!book) return null;

  const versions: string[] = [];
  if (book.has_print) versions.push('纸版');
  if (book.has_digital) versions.push('电版');
  if (book.has_audio) versions.push('音频');
  if (book.has_video) versions.push('动画');

  const ageMin = book.recommended_age_min || 0;
  const ageMax = book.recommended_age_max || 216;
  const ageRange = ageMin > 0 || ageMax < 216
    ? `${Math.floor(ageMin / 12)}岁${ageMin % 12}月 ~ ${Math.floor(ageMax / 12)}岁${ageMax % 12}月`
    : '全部年龄段';

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/books')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{book.title}</Title>
        <Button icon={<EditOutlined />} onClick={() => navigate(`/admin/books/${book.id}`)}>编辑</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="作者">{book.author || '-'}</Descriptions.Item>
          <Descriptions.Item label="认知适配">{book.cognitive_level || '-'}</Descriptions.Item>
          <Descriptions.Item label="资源类型">{book.resource_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="推荐年龄">{ageRange}</Descriptions.Item>
          <Descriptions.Item label="页数">{book.page_count || '-'}</Descriptions.Item>
          <Descriptions.Item label="时长">{book.duration_minutes ? `${book.duration_minutes} 分钟` : '-'}</Descriptions.Item>
          <Descriptions.Item label="可用版本" span={2}>
            {versions.length > 0 ? versions.map(v => <Tag key={v} color="blue">{v}</Tag>) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="核心适应目标" span={2}>{book.core_goal || '-'}</Descriptions.Item>
          <Descriptions.Item label="简介" span={2}>{book.description || '-'}</Descriptions.Item>
          {book.teaching_suggestion && (
            <Descriptions.Item label="教学建议" span={2}>{book.teaching_suggestion}</Descriptions.Item>
          )}
          {book.parent_reading_guide && (
            <Descriptions.Item label="亲子共读指导" span={2}>{book.parent_reading_guide}</Descriptions.Item>
          )}
          {book.dimensions && book.dimensions.length > 0 && (
            <Descriptions.Item label="维度分类" span={2}>
              {book.dimensions.map(d => (
                <Tag key={d.slug}>{d.name}</Tag>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Divider />

      <Card>
        {id && (
          <BookFileList
            bookId={id}
            onRequestUpload={() => setUploadOpen(true)}
            onRefresh={() => {}}
          />
        )}
      </Card>

      {id && (
        <BookFileUpload
          bookId={id}
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
