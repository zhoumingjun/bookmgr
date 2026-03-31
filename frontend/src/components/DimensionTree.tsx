import { Tree, Popconfirm, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { DimensionDTO } from '../api/dimension';

interface Props {
  dimensions: DimensionDTO[];
  onEdit: (dim: DimensionDTO) => void;
  onDelete: (slug: string) => void;
  onAddChild: (parentSlug: string) => void;
}

export default function DimensionTree({ dimensions, onEdit, onDelete, onAddChild }: Props) {
  function toTreeNodes(dims: DimensionDTO[]): DataNode[] {
    return dims.map((d) => ({
      key: d.slug,
      title: (
        <Space size="small">
          <span>{d.name}</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={(e) => { e.stopPropagation(); onAddChild(d.slug); }}
            title="添加子分类"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); onEdit(d); }}
            title="编辑"
          />
          <Popconfirm
            title="确定删除该维度？"
            description="删除后无法恢复，请确认。"
            onConfirm={(e) => { e?.stopPropagation(); onDelete(d.slug); }}
            onCancel={(e) => e?.stopPropagation()}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
              title="删除"
            />
          </Popconfirm>
        </Space>
      ),
      children: d.children?.length ? toTreeNodes(d.children) : undefined,
      isLeaf: !d.children?.length,
    }));
  }

  const treeData = toTreeNodes(dimensions);

  if (treeData.length === 0) {
    return (
      <div style={{ color: '#999', textAlign: 'center', padding: '24px' }}>
        暂无维度分类，请点击上方按钮添加
      </div>
    );
  }

  return (
    <Tree
      treeData={treeData}
      defaultExpandAll
      blockNode
      style={{ background: 'transparent' }}
    />
  );
}
