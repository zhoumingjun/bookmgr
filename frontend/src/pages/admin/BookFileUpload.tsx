import { useState } from 'react';
import { Modal, Upload, Select, message, Space, Typography, Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { uploadBookFile } from '../../api/bookfile';

const { Text } = Typography;
const { Dragger } = Upload;

type FileType = 'print' | 'digital' | 'audio' | 'video';

interface Props {
  bookId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FILE_TYPE_OPTIONS = [
  { label: '纸版 (PDF)', value: 'print' },
  { label: '电版 (PDF/EPUB)', value: 'digital' },
  { label: '音频 (MP3/M4A)', value: 'audio' },
  { label: '动画 (MP4)', value: 'video' },
];

export default function BookFileUploadModal({ bookId, open, onClose, onSuccess }: Props) {
  const [fileType, setFileType] = useState<FileType>('print');
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    if (file.size > 500 * 1024 * 1024) {
      message.error('文件大小不能超过 500MB');
      return false;
    }
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const allowedExts = ['.pdf', '.epub', '.mp3', '.m4a', '.mp4'];
    if (!allowedExts.includes(ext)) {
      message.error('不支持的文件类型，仅允许 PDF、EPUB、MP3、M4A、MP4');
      return false;
    }
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      await uploadBookFile(bookId, fileType, buffer);
      message.success('上传成功');
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  }

  return (
    <Modal
      title="上传绘本文件"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Text strong>文件类型：</Text>
          <Select
            value={fileType}
            onChange={v => setFileType(v)}
            options={FILE_TYPE_OPTIONS}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>
        <Alert
          message="文件要求"
          description="支持 PDF、EPUB、MP3、M4A、MP4 格式，单个文件最大 500MB。"
          type="info"
          showIcon
        />
        <Dragger
          accept=".pdf,.epub,.mp3,.m4a,.mp4"
          maxCount={1}
          beforeUpload={handleUpload}
          disabled={uploading}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持 PDF、EPUB、MP3、M4A、MP4，单文件最大 500MB
          </p>
        </Dragger>
      </Space>
    </Modal>
  );
}
