import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Button, Upload, message, Typography, Spin } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getBook, updateBook, uploadBookFile, type BookDTO } from '../../api/books';

const { Title } = Typography;
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

  useEffect(() => {
    if (!id) return;
    getBook(id).then(res => {
      setBook(res.book);
      form.setFieldsValue({
        title: res.book.title,
        author: res.book.author,
        description: res.book.description,
      });
    }).catch(() => message.error(t('bookEdit.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: { title: string; author: string; description?: string }) {
    if (!id || !book) return;
    setSaving(true);
    try {
      const mask: string[] = [];
      if (values.title !== book.title) mask.push('title');
      if (values.author !== book.author) mask.push('author');
      if ((values.description || '') !== book.description) mask.push('description');

      if (mask.length > 0) {
        await updateBook(id, values, mask);
      }
      if (file) {
        await uploadBookFile(id, file);
      }
      message.success(t('bookEdit.success'));
      navigate('/admin/books');
    } catch {
      message.error(t('bookEdit.error'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;

  return (
    <div>
      <Title level={4}>{t('bookEdit.title')}</Title>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label={t('bookEdit.bookTitle')} name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('bookEdit.author')} name="author" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('bookEdit.description')} name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label={t('bookEdit.replaceFile')}>
            <Dragger
              accept=".pdf"
              maxCount={1}
              beforeUpload={(f) => { setFile(f); return false; }}
              onRemove={() => setFile(null)}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">{t('bookEdit.fileTip')}</p>
            </Dragger>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} style={{ marginRight: 8 }}>
              {t('bookEdit.save')}
            </Button>
            <Button onClick={() => navigate('/admin/books')}>{t('bookEdit.cancel')}</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
