# 设计文档：绘本审核流程

## Context

绘本审核是质量保障的核心环节。本提案在 Book 实体已有的 status 字段基础上，实现完整的状态机控制和审核记录追踪。

## Book Status 状态机

```
draft ──提交审核──→ pending ──审核通过──→ approved
                          ↘审核拒绝↗
                            rejected
                            │
                     重新提交──→ pending
                                   │
                     超级管理员打回──→ rejected
```

## BookReview 表设计

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| book_id | uuid (FK→Book) | 关联绘本 |
| reviewer_id | uuid (FK→User) | 操作人 |
| action | enum | submit/approve/reject/recall |
| status_from | string | 状态来源 |
| status_to | string | 状态目标 |
| reason | text | 意见/拒绝原因 |
| created_at | timestamp | 操作时间 |

## 权限规则

| 操作 | 可执行角色 |
|------|-----------|
| draft → pending（提交） | Book 创建者 |
| pending → approved/rejected（审核） | admin, super_admin |
| rejected → pending（重新提交） | Book 创建者 |
| pending → draft（撤回） | Book 创建者 |
| approved → rejected（打回） | super_admin 专属 |
