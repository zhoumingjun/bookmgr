import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Upload, message, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { createBook, uploadBookFile } from '../../api/books';

const { Title } = Typography;
const { Dragger } = Upload;

export default function BookNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: { title: string; author: string; description?: string }) {
    setSaving(true);
    try {
      const res = await createBook(values.title, values.author, values.description || '');
      if (file) {
        await uploadBookFile(res.book.id, file);
      }
      message.success(t('bookNew.success'));
      navigate('/admin/books');
    } catch {
      message.error(t('bookNew.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Title level={4}>{t('bookNew.title')}</Title>
      <Card style={{ maxWidth: 600 }}>
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item label={t('bookNew.bookTitle')} name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('bookNew.author')} name="author" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('bookNew.description')} name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label={t('bookNew.file')}>
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
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} style={{ marginRight: 8 }}>
              {t('bookNew.submit')}
            </Button>
            <Button onClick={() => navigate('/admin/books')}>{t('bookNew.cancel')}</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
