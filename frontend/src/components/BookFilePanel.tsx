import { useEffect, useState, useRef } from 'react';
import { Table, Button, Upload, message, Space, Popconfirm, Tag, Alert, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  listBookFiles,
  uploadBookFile,
  deleteBookFile,
  downloadBookFileUrl,
  formatFileSize,
  type BookFileDTO,
} from '../api/bookfile';

const { Text } = Typography;

interface Props {
  bookId: string;
}

const FILE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  print: { label: '纸版', color: 'blue' },
  digital: { label: '电版', color: 'green' },
  audio: { label: '音频', color: 'orange' },
  video: { label: '动画', color: 'purple' },
};

const FILE_TYPE_OPTIONS = [
  { label: '纸版 (PDF)', value: 'print' },
  { label: '电版 (EPUB/PDF)', value: 'digital' },
  { label: '音频 (MP3/M4A)', value: 'audio' },
  { label: '动画 (MP4)', value: 'video' },
];

export default function BookFilePanel({ bookId }: Props) {
  const [files, setFiles] = useState<BookFileDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState<string>('print');
  const uploadingRef = useRef(false);

  async function loadFiles() {
    setLoading(true);
    try {
      const res = await listBookFiles(bookId);
      setFiles(res.files || []);
    } catch {
      message.error('加载文件列表失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFiles(); }, [bookId]);

  const uploadProps: UploadProps = {
    accept: '.pdf,.epub,.mp3,.m4a,.mp4',
    showUploadList: false,
    beforeUpload: async (file) => {
      if (uploadingRef.current) {
        message.warning('等待上一个文件上传完成');
        return false;
      }

      // Size check: 500MB
      if (file.size > 500 * 1024 * 1024) {
        message.error('文件大小不能超过 500MB');
        return false;
      }

      // Extension check
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const allowedExts = ['.pdf', '.epub', '.mp3', '.m4a', '.mp4'];
      if (!allowedExts.includes(ext)) {
        message.error('不支持的文件类型，仅允许 PDF、EPUB、MP3、M4A、MP4');
        return false;
      }

      uploadingRef.current = true;
      setUploading(true);

      try {
        const buffer = await file.arrayBuffer();
        await uploadBookFile(bookId, fileType as 'print' | 'digital' | 'audio' | 'video', buffer);
        message.success('文件上传成功');
        loadFiles();
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        message.error(err.response?.data?.message || '上传失败');
      } finally {
        uploadingRef.current = false;
        setUploading(false);
      }

      return false; // Prevent default upload
    },
  };

  async function handleDelete(fileId: string) {
    try {
      await deleteBookFile(bookId, fileId);
      message.success('文件已删除');
      loadFiles();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除失败');
    }
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (ft: string) => {
        const info = FILE_TYPE_LABELS[ft] || { label: ft, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      width: 80,
    },
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'original_name',
      ellipsis: true,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => formatFileSize(size),
      width: 100,
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t: string) => new Date(t).toLocaleString(),
      width: 160,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: BookFileDTO) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            href={downloadBookFileUrl(bookId, record.id)}
            target="_blank"
            download={record.original_name}
          >
            下载
          </Button>
          <Popconfirm
            title="确定删除该文件？"
            description="文件将从服务器永久删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap align="end">
        <Text strong>上传新文件：</Text>
        <Upload {...uploadProps}>
          <Button type="primary" icon={<UploadOutlined />} loading={uploading} disabled={uploading}>
            选择文件
          </Button>
        </Upload>
        <select
          value={fileType}
          onChange={e => setFileType(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
        >
          {FILE_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Space>

      <Alert
        message="文件要求"
        description="支持 PDF、EPUB、MP3、M4A、MP4 格式，单个文件最大 500MB。"
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
      />

      <Table
        dataSource={files}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无文件，请点击上方按钮上传' }}
      />
    </div>
  );
}
