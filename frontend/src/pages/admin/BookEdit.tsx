import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Form, Input, Button, message, Typography,
  Select, InputNumber, Checkbox, Divider, Alert, Space, Spin, Tabs,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { getBook, updateBook } from '../../api/books';
import { listDimensions } from '../../api/dimension';
import BookFilePanel from '../../components/BookFilePanel';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function BookEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dimensions, setDimensions] = useState<{ name: string; slug: string; children?: { name: string; slug: string }[] }[]>([]);
  const [initialValues, setInitialValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    listDimensions().then(res => setDimensions(res.dimensions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(res => {
        const b = res.book;
        const vals = {
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
          dimension_slugs: b.dimensions?.map((d: { slug: string }) => d.slug) || [],
        };
        setInitialValues(vals);
        form.setFieldsValue(vals);
      })
      .catch(() => message.error(t('bookEdit.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(values: Record<string, unknown>) {
    if (!id) return;
    setSaving(true);
    try {
      const mask: string[] = [];
      const fields: Record<string, unknown> = {};
      const iv = initialValues;

      const stringFields = ['title', 'author', 'description', 'core_goal', 'cognitive_level', 'resource_type', 'teaching_suggestion', 'parent_reading_guide'];
      for (const f of stringFields) {
        if (values[f] !== iv[f]) { mask.push(f); fields[f] = values[f]; }
      }
      const numberFields = ['page_count', 'duration_minutes', 'recommended_age_min', 'recommended_age_max'];
      for (const f of numberFields) {
        if (values[f] !== iv[f]) { mask.push(f); fields[f] = values[f]; }
      }
      const boolFields = ['has_print', 'has_digital', 'has_audio', 'has_video'];
      for (const f of boolFields) {
        if (values[f] !== iv[f]) { mask.push(f); fields[f] = values[f]; }
      }

      const dims = (values.dimension_slugs as string[]) || [];
      const origDims = (iv.dimension_slugs as string[]) || [];
      if (dims.length !== origDims.length || !dims.every((d: string) => origDims.includes(d))) {
        mask.push('dimensions');
        fields.dimension_slugs = dims;
      }

      if (mask.length > 0) {
        await updateBook(id, fields, mask);
      }

      message.success(t('bookEdit.success'));
      
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
    (d.children || []).map(c => ({ label: `  ${c.name}`, value: c.slug }))
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <Title level={4}>{t('bookEdit.title')}</Title>
      <Card>
        <Tabs
          defaultActiveKey="basic"
          onChange={() => {}}
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  requiredMark="optional"
                  
                  onFinish={handleSave}
                >
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
                    <Form.Item label="认知水平" name="cognitive_level">
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
                    <Form.Item label="最小月龄" name="recommended_age_min">
                      <InputNumber min={0} max={216} addonAfter="月龄" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item label="最大月龄" name="recommended_age_max">
                      <InputNumber min={0} max={216} addonAfter="月龄" style={{ width: 140 }} />
                    </Form.Item>
                  </Space>

                  <Space size={16} wrap style={{ marginTop: 8 }}>
                    <Text strong>可用版本：</Text>
                    <Form.Item name="has_print" valuePropName="checked" noStyle><Checkbox>纸版</Checkbox></Form.Item>
                    <Form.Item name="has_digital" valuePropName="checked" noStyle><Checkbox>电版</Checkbox></Form.Item>
                    <Form.Item name="has_audio" valuePropName="checked" noStyle><Checkbox>音频</Checkbox></Form.Item>
                    <Form.Item name="has_video" valuePropName="checked" noStyle><Checkbox>动画</Checkbox></Form.Item>
                  </Space>

                  <Space size={16} style={{ marginTop: 8 }}>
                    <Form.Item label="页数" name="page_count"><InputNumber min={0} max={10000} style={{ width: 100 }} /></Form.Item>
                    <Form.Item label="时长（分钟）" name="duration_minutes"><InputNumber min={0} max={1000} style={{ width: 100 }} /></Form.Item>
                  </Space>

                  <Divider plain>使用指导</Divider>
                  <Form.Item label="教学建议" name="teaching_suggestion">
                    <TextArea rows={3} maxLength={4096} showCount />
                  </Form.Item>
                  <Form.Item label="亲子共读" name="parent_reading_guide">
                    <TextArea rows={3} maxLength={4096} showCount />
                  </Form.Item>

                  <Form.Item style={{ marginTop: 24 }}>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={saving}>{t('bookEdit.save')}</Button>
                      <Button onClick={() => navigate('/admin/books')}>{t('bookEdit.cancel')}</Button>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'files',
              label: '媒体文件',
              children: id ? <BookFilePanel bookId={id} /> : null,
            },
          ]}
        />
      </Card>
    </div>
  );
}
