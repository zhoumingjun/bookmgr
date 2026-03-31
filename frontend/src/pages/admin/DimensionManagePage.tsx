import { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, message, Card, Typography, Space, Alert } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import DimensionTree from '../../components/DimensionTree';
import {
  listDimensions,
  createDimension,
  updateDimension,
  deleteDimension,
  type DimensionDTO,
} from '../../api/dimension';

const { Title } = Typography;
const { TextArea } = Input;

export default function DimensionManagePage() {
  const [dimensions, setDimensions] = useState<DimensionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDimension, setEditDimension] = useState<DimensionDTO | null>(null);
  const [parentSlug, setParentSlug] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  async function loadDimensions() {
    setLoading(true);
    try {
      const res = await listDimensions();
      setDimensions(res.dimensions || []);
    } catch {
      message.error('加载维度列表失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDimensions(); }, []);

  function openCreateModal(parent?: string) {
    setEditDimension(null);
    setParentSlug(parent);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(dim: DimensionDTO) {
    setEditDimension(dim);
    setParentSlug(undefined);
    form.setFieldsValue({
      name: dim.name,
      slug: dim.slug,
      description: '',
      sort_order: dim.sort_order,
    });
    setModalOpen(true);
  }

  async function handleSubmit(values: { name: string; slug: string; description: string; sort_order: number }) {
    setSaveLoading(true);
    try {
      if (editDimension) {
        await updateDimension(editDimension.slug, {
          name: values.name,
          description: values.description,
          sort_order: values.sort_order,
        });
        message.success('更新成功');
      } else {
        await createDimension({
          name: values.name,
          slug: values.slug,
          description: values.description,
          sort_order: values.sort_order,
          parent_slug: parentSlug,
        });
        message.success('创建成功');
      }
      setModalOpen(false);
      loadDimensions();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || '操作失败';
      message.error(msg);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(slug: string) {
    try {
      await deleteDimension(slug);
      message.success('删除成功');
      loadDimensions();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || '删除失败';
      message.error(msg);
    }
  }

  const isEditing = !!editDimension;
  const modalTitle = isEditing ? '编辑维度' : parentSlug ? '添加子分类' : '添加顶级维度';

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>维度分类管理</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadDimensions} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal()}>
              添加顶级维度
            </Button>
          </Space>
        </div>

        <Alert
          message="维度分类说明"
          description="维度用于对绘本进行多维度分类（如身心准备、认知发展、语言表达等）。支持两级分类：一级维度下可添加二级子分类。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <DimensionTree
          dimensions={dimensions}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onAddChild={(slug) => openCreateModal(slug)}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入维度名称' }, { max: 100, message: '最多100个字符' }]}
          >
            <Input placeholder="如：身心准备" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="slug"
            label="标识符（Slug）"
            extra="小写字母、数字、连字符，如 physical-readiness"
            rules={[
              { required: true, message: '请输入标识符' },
              { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: '格式：小写字母、数字、连字符' },
              { max: 50, message: '最多50个字符' },
            ]}
          >
            <Input
              placeholder="如：physical-readiness"
              disabled={isEditing}
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述（可选）"
            rules={[{ max: 500, message: '最多500个字符' }]}
          >
            <TextArea rows={3} placeholder="简要描述该维度的含义" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            name="sort_order"
            label="排序序号"
            extra="数字越小排越前"
            initialValue={0}
          >
            <InputNumber min={0} max={9999} style={{ width: 120 }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saveLoading}>
                {isEditing ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
