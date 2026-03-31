import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Upload, message, Typography,
  Select, InputNumber, Checkbox, Alert, Divider, Space,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { createBook, uploadBookFile } from '../../api/books';
import { listDimensions, type DimensionDTO } from '../../api/dimension';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

export default function BookNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dimensions, setDimensions] = useState<DimensionDTO[]>([]);

  useEffect(() => {
    listDimensions().then(res => setDimensions(res.dimensions || [])).catch(() => {});
  }, []);

  // Build top-level + children options
  const topLevelOptions = dimensions.map(d => ({ label: d.name, value: d.slug }));
  const secondLevelOptions = dimensions.flatMap(d =>
    (d.children || []).map(c => ({
      label: `  ${c.name}`,
      value: c.slug,
      topSlug: d.slug,
    }))
  );

  async function handleSubmit(values: Record<string, unknown>) {
    setSaving(true);
    try {
      const params = {
        title: values.title as string,
        author: (values.author as string) || '',
        description: (values.description as string) || '',
        page_count: values.page_count as number,
        duration_minutes: values.duration_minutes as number,
        core_goal: (values.core_goal as string) || '',
        cognitive_level: (values.cognitive_level as string) || '',
        resource_type: (values.resource_type as string) || 'print',
        has_print: !!(values.has_print),
        has_digital: !!(values.has_digital),
        has_audio: !!(values.has_audio),
        has_video: !!(values.has_video),
        teaching_suggestion: (values.teaching_suggestion as string) || '',
        parent_reading_guide: (values.parent_reading_guide as string) || '',
        recommended_age_min: (values.recommended_age_min as number) || 0,
        recommended_age_max: (values.recommended_age_max as number) || 216,
        dimension_slugs: (values.dimension_slugs as string[]) || [],
      };

      const res = await createBook(params);
      if (file) {
        await uploadBookFile(res.book.id, file);
      }
      message.success(t('bookNew.success'));
      navigate('/admin/books');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || t('bookNew.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <Title level={4}>{t('bookNew.title')}</Title>
      <Card>
        <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark="optional">
          {/* 基本信息 */}
          <Alert message="基本信息" type="info" showIcon style={{ marginBottom: 16 }} />
          <Form.Item label="绘本名称" name="title" rules={[{ required: true, message: '请输入绘本名称' }]}>
            <Input placeholder="如：我爱学校" maxLength={200} />
          </Form.Item>
          <Form.Item label="作者" name="author" rules={[{ required: true, message: '请输入作者' }]}>
            <Input placeholder="如：李明" maxLength={100} />
          </Form.Item>
          <Form.Item label="绘本简介" name="description">
            <TextArea rows={3} placeholder="简要描述绘本内容" maxLength={4096} showCount />
          </Form.Item>

          {/* 维度分类 */}
          <Divider plain>维度分类</Divider>
          <Form.Item
            label="所属维度分类（必填）"
            name="dimension_slugs"
            rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个维度分类' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择一级维度或二级子分类"
              options={[...topLevelOptions, ...secondLevelOptions]}
              allowClear
            />
          </Form.Item>
          <Form.Item
            label="核心适应目标（必填）"
            name="core_goal"
            rules={[{ required: true, message: '请填写核心适应目标' }]}
          >
            <TextArea rows={3} placeholder="描述该绘本的核心适应目标，如：帮助新生适应校园作息时间" maxLength={1000} showCount />
          </Form.Item>

          {/* 适配信息 */}
          <Divider plain>适配信息</Divider>
          <Space size={16} wrap>
            <Form.Item label="适配认知水平" name="cognitive_level">
              <Select
                placeholder="选择认知水平"
                style={{ width: 140 }}
                options={[
                  { label: '轻度', value: '轻度' },
                  { label: '中度', value: '中度' },
                  { label: '重度', value: '重度' },
                ]}
              />
            </Form.Item>
            <Form.Item label="资源类型" name="resource_type">
              <Select
                placeholder="选择资源类型"
                style={{ width: 140 }}
                options={[
                  { label: '纸版', value: 'print' },
                  { label: '电版', value: 'digital' },
                  { label: '音频', value: 'audio' },
                  { label: '动画', value: 'video' },
                ]}
              />
            </Form.Item>
            <Form.Item label="推荐最小月龄" name="recommended_age_min" initialValue={0}>
              <InputNumber min={0} max={216} addonAfter="月龄" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="推荐最大月龄" name="recommended_age_max" initialValue={216}>
              <InputNumber min={0} max={216} addonAfter="月龄" style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Space size={16} wrap style={{ marginTop: 8 }}>
            <Text strong>可用版本：</Text>
            <Form.Item name="has_print" valuePropName="checked" initialValue={false} noStyle>
              <Checkbox>纸版</Checkbox>
            </Form.Item>
            <Form.Item name="has_digital" valuePropName="checked" initialValue={false} noStyle>
              <Checkbox>电版</Checkbox>
            </Form.Item>
            <Form.Item name="has_audio" valuePropName="checked" initialValue={false} noStyle>
              <Checkbox>音频</Checkbox>
            </Form.Item>
            <Form.Item name="has_video" valuePropName="checked" initialValue={false} noStyle>
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

          {/* 使用指导 */}
          <Divider plain>使用指导</Divider>
          <Form.Item label="教学使用建议" name="teaching_suggestion">
            <TextArea rows={3} placeholder="建议在开学第一周使用，配合校园参观活动" maxLength={4096} showCount />
          </Form.Item>
          <Form.Item label="亲子共读指导" name="parent_reading_guide">
            <TextArea rows={3} placeholder="家长可以在家模拟学校作息时间" maxLength={4096} showCount />
          </Form.Item>

          {/* 媒体文件（由 Feature 04 处理，此处仅展示） */}
          <Divider plain>媒体文件</Divider>
          <Form.Item label="PDF 文件">
            <Dragger
              accept=".pdf"
              maxCount={1}
              beforeUpload={(f) => { setFile(f); return false; }}
              onRemove={() => setFile(null)}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">{t('bookNew.fileTip')}</p>
            </Dragger>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t('bookNew.submit')}
              </Button>
              <Button onClick={() => navigate('/admin/books')}>{t('bookNew.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
