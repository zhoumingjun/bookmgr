import { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Space, Typography, Modal, Input, Popconfirm, Spin } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { approveBook, rejectBook } from '../../api/reviews';
import { listBooks } from '../../api/books';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ReviewManagePage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadPendingBooks() {
    setLoading(true);
    try {
      // Use the admin books list with status=pending filter
      const res = await listBooks(100, '');
      // Filter to pending only
      const pending = (res.books || []).filter((b: unknown) => (b as { status?: string }).status === 'pending');
      setBooks(pending);
    } catch {
      message.error('加载待审核列表失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPendingBooks(); }, []);

  async function handleApprove(bookId: string) {
    setSubmitting(true);
    try {
      await approveBook(bookId);
      message.success('已通过');
      loadPendingBooks();
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(bookId: string) {
    if (!rejectReason.trim()) {
      message.error('请填写拒绝原因');
      return;
    }
    setSubmitting(true);
    try {
      await rejectBook(bookId, rejectReason);
      message.success('已拒绝');
      setRejectModal(null);
      setRejectReason('');
      loadPendingBooks();
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      title: '绘本名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: unknown) => (
        <Button type="link" onClick={() => navigate(`/admin/books/detail/${(record as { id: string }).id}`)}>
          {title || '-'}
        </Button>
      ),
    },
    { title: '作者', dataIndex: 'author', key: 'author', width: 120 },
    {
      title: '认知等级',
      dataIndex: 'cognitive_level',
      key: 'cognitive_level',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '可用版本',
      key: 'versions',
      width: 150,
      render: (_: unknown, record: unknown) => {
        const r = record as { has_print?: boolean; has_digital?: boolean; has_audio?: boolean; has_video?: boolean };
        const versions: string[] = [];
        if (r.has_print) versions.push('纸版');
        if (r.has_digital) versions.push('电版');
        if (r.has_audio) versions.push('音频');
        if (r.has_video) versions.push('动画');
        return versions.length > 0 ? versions.map(v => <Tag key={v} color="blue">{v}</Tag>) : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: string) => <Tag color={s === 'pending' ? 'orange' : 'default'}>{s}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: unknown) => {
        const bookId = (record as { id: string }).id;
        return (
          <Space>
            <Popconfirm
              title="确认通过该绘本？"
              onConfirm={() => handleApprove(bookId)}
              okText="通过"
              cancelText="取消"
            >
              <Button type="primary" size="small" icon={<CheckOutlined />} loading={submitting}>
                通过
              </Button>
            </Popconfirm>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => setRejectModal(bookId)}
            >
              拒绝
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>绘本审核</Title>
        <Button onClick={loadPendingBooks}>刷新</Button>
      </div>

      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={books}
          columns={columns}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: '暂无待审核绘本' }}
        />
      )}

      <Modal
        title="拒绝原因"
        open={!!rejectModal}
        onCancel={() => { setRejectModal(null); setRejectReason(''); }}
        onOk={() => rejectModal && handleReject(rejectModal)}
        confirmLoading={submitting}
        okText="确认拒绝"
        cancelText="取消"
      >
        <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 16 }}>
          <Text>请填写拒绝原因，将告知提交者：</Text>
          <TextArea
            rows={4}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="例如：内容不符合平台规范..."
            maxLength={2000}
          />
        </Space>
      </Modal>
    </div>
  );
}
