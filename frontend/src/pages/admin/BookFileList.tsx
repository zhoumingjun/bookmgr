import { useEffect, useState } from 'react';
import { Table, Popconfirm, message, Tag, Space, Button, Spin, Typography } from 'antd';
import { DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { listBookFiles, deleteBookFile, type BookFileDTO } from '../../api/bookfile';

const { Text } = Typography;

const FILE_TYPE_LABELS: Record<string, string> = {
  print: '纸版',
  digital: '电版',
  audio: '音频',
  video: '动画',
};

const FILE_TYPE_COLORS: Record<string, string> = {
  print: 'blue',
  digital: 'green',
  audio: 'orange',
  video: 'purple',
};

interface Props {
  bookId: string;
  onRequestUpload: () => void;
  onRefresh: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BookFileList({ bookId, onRequestUpload, onRefresh }: Props) {
  const [files, setFiles] = useState<BookFileDTO[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function handleDelete(fileId: string) {
    try {
      await deleteBookFile(bookId, fileId);
      message.success('删除成功');
      loadFiles();
      onRefresh();
    } catch {
      message.error('删除失败');
    }
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 90,
      render: (ft: string) => (
        <Tag color={FILE_TYPE_COLORS[ft] || 'default'}>{FILE_TYPE_LABELS[ft] || ft}</Tag>
      ),
    },
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'original_name',
      render: (name: string) => <Text ellipsis style={{ maxWidth: 260 }}>{name}</Text>,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 90,
      render: (size: number) => formatSize(size),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: BookFileDTO) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            href={`/api/v1/books/${bookId}/files/${record.id}`}
            target="_blank"
          >
            下载
          </Button>
          <Popconfirm title="确认删除该文件？" onConfirm={() => handleDelete(record.id)}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong>已上传文件（{files.length}）</Text>
        <Button type="primary" size="small" icon={<UploadOutlined />} onClick={onRequestUpload}>
          上传文件
        </Button>
      </div>
      {loading ? (
        <Spin size="small" />
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
          暂无文件
        </div>
      ) : (
        <Table
          dataSource={files}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 700 }}
        />
      )}
    </div>
  );
}
