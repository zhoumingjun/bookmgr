import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Form, Input, Button, Upload, message, Typography,
  Select, InputNumber, Checkbox, Divider, Alert, Space, Spin,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getBook, updateBook, uploadBookFile } from '../../api/books';
import { listDimensions, type DimensionDTO } from '../../api/dimension';
import type { BookDTO } from '../../api/books';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

export default function BookEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [book, setBook] = useState<BookDTO | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dimensions, setDimensions] = useState<DimensionDTO[]>([]);

  useEffect(() => {
    listDimensions().then(res => setDimensions(res.dimensions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(res => {
        setBook(res.book);
        const b = res.book;
        form.setFieldsValue({
          title: b.title,
          author: b.author,
          description: b.description,
          page_count: b.page_count,
          duration_minutes: b.duration_minutes,
          core_goal: b.core_goal,
          cognitive_level: b.cognitive_level,
          resource_type: b.resource_type,
          has_print: b.has_print,
          has_digital: b.has_digital,
          has_audio: b.has_audio,
          has_video: b.has_video,
          teaching_suggestion: b.teaching_suggestion,
          parent_reading_guide: b.parent_reading_guide,
          recommended_age_min: b.recommended_age_min,
          recommended_age_max: b.recommended_age_max,
          dimension_slugs: b.dimensions?.map(d => d.slug) || [],
        });
      })
      .catch(() => message.error(t('bookEdit.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: Record<string, unknown>) {
    if (!id || !book) return;
    setSaving(true);
    try {
      const mask: string[] = [];
      const fields: Record<string, unknown> = {};

      const fieldsToCheck: Array<{ key: string; value: unknown }> = [
        { key: 'title', value: values.title },
        { key: 'author', value: values.author },
        { key: 'description', value: values.description },
        { key: 'page_count', value: values.page_count },
        { key: 'duration_minutes', value: values.duration_minutes },
        { key: 'core_goal', value: values.core_goal },
        { key: 'cognitive_level', value: values.cognitive_level },
        { key: 'resource_type', value: values.resource_type },
        { key: 'has_print', value: values.has_print },
        { key: 'has_digital', value: values.has_digital },
        { key: 'has_audio', value: values.has_audio },
        { key: 'has_video', value: values.has_video },
        { key: 'teaching_suggestion', value: values.teaching_suggestion },
        { key: 'parent_reading_guide', value: values.parent_reading_guide },
        { key: 'recommended_age_min', value: values.recommended_age_min },
        { key: 'recommended_age_max', value: values.recommended_age_max },
      ];

      for (const { key, value } of fieldsToCheck) {
        const bookVal = (book as unknown as Record<string, unknown>)[key];
        if (value !== bookVal) {
          mask.push(key);
          fields[key] = value;
        }
      }

      // Check dimensions
      const currentDimSlugs = (values.dimension_slugs as string[]) || [];
      const bookDimSlugs = book.dimensions?.map(d => d.slug) || [];
      const dimsChanged = currentDimSlugs.length !== bookDimSlugs.length ||
        !currentDimSlugs.every(s => bookDimSlugs.includes(s));
      if (dimsChanged) {
        mask.push('dimensions');
        fields.dimension_slugs = currentDimSlugs;
      }

      if (mask.length > 0) {
        await updateBook(id, fields, mask);
      }

      if (file) {
        await uploadBookFile(id, file);
      }

      message.success(t('bookEdit.success'));
      navigate('/admin/books');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || t('bookEdit.error'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;

  const topLevelOptions = dimensions.map(d => ({ label: d.name, value: d.slug }));
  const secondLevelOptions = dimensions.flatMap(d =>
    (d.children || []).map(c => ({ label: `  ${c.name}`, value: c.slug, topSlug: d.slug }))
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <Title level={4}>{t('bookEdit.title')}</Title>
      <Card>
        <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark="optional">
          <Alert message="基本信息" type="info" showIcon style={{ marginBottom: 16 }} />
          <Form.Item label="绘本名称" name="title" rules={[{ required: true, message: '请输入绘本名称' }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item label="作者" name="author" rules={[{ required: true, message: '请输入作者' }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item label="绘本简介" name="description">
            <TextArea rows={3} maxLength={4096} showCount />
          </Form.Item>

          <Divider plain>维度分类</Divider>
          <Form.Item label="所属维度分类" name="dimension_slugs" rules={[{ required: true, type: 'array', min: 1 }]}>
            <Select mode="multiple" options={[...topLevelOptions, ...secondLevelOptions]} allowClear />
          </Form.Item>
          <Form.Item label="核心适应目标" name="core_goal" rules={[{ required: true }]}>
            <TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>

          <Divider plain>适配信息</Divider>
          <Space size={16} wrap>
            <Form.Item label="适配认知水平" name="cognitive_level">
              <Select style={{ width: 140 }} options={[
                { label: '轻度', value: '轻度' },
                { label: '中度', value: '中度' },
                { label: '重度', value: '重度' },
              ]} />
            </Form.Item>
            <Form.Item label="资源类型" name="resource_type">
              <Select style={{ width: 140 }} options={[
                { label: '纸版', value: 'print' },
                { label: '电版', value: 'digital' },
                { label: '音频', value: 'audio' },
                { label: '动画', value: 'video' },
              ]} />
            </Form.Item>
            <Form.Item label="推荐最小月龄" name="recommended_age_min">
              <InputNumber min={0} max={216} addonAfter="月龄" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="推荐最大月龄" name="recommended_age_max">
              <InputNumber min={0} max={216} addonAfter="月龄" style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Space size={16} wrap style={{ marginTop: 8 }}>
            <Text strong>可用版本：</Text>
            <Form.Item name="has_print" valuePropName="checked" noStyle>
              <Checkbox>纸版</Checkbox>
            </Form.Item>
            <Form.Item name="has_digital" valuePropName="checked" noStyle>
              <Checkbox>电版</Checkbox>
            </Form.Item>
            <Form.Item name="has_audio" valuePropName="checked" noStyle>
              <Checkbox>音频</Checkbox>
            </Form.Item>
            <Form.Item name="has_video" valuePropName="checked" noStyle>
              <Checkbox>动画</Checkbox>
            </Form.Item>
          </Space>

          <Space size={16} style={{ marginTop: 8 }}>
            <Form.Item label="页数" name="page_count">
              <InputNumber min={0} max={10000} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item label="时长（分钟）" name="duration_minutes">
              <InputNumber min={0} max={1000} style={{ width: 100 }} />
            </Form.Item>
          </Space>

          <Divider plain>使用指导</Divider>
          <Form.Item label="教学使用建议" name="teaching_suggestion">
            <TextArea rows={3} maxLength={4096} showCount />
          </Form.Item>
          <Form.Item label="亲子共读指导" name="parent_reading_guide">
            <TextArea rows={3} maxLength={4096} showCount />
          </Form.Item>

          <Divider plain>媒体文件</Divider>
          <Form.Item label="替换 PDF 文件">
            <Dragger accept=".pdf" maxCount={1} beforeUpload={(f) => { setFile(f); return false; }} onRemove={() => setFile(null)}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">{t('bookEdit.fileTip')}</p>
            </Dragger>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>{t('bookEdit.save')}</Button>
              <Button onClick={() => navigate('/admin/books')}>{t('bookEdit.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
