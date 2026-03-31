# 设计文档：收藏与反馈

## Context

用户个性化功能：收藏绘本、提交阅读反馈和统计数据展示。

## Data Model

### book_favorites 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| user_id | uuid (FK→User) | 用户 |
| book_id | uuid (FK→Book) | 绘本 |
| created_at | timestamp | 收藏时间 |

唯一约束：(user_id, book_id)。

### book_feedbacks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| user_id | uuid (FK→User) | 用户 |
| book_id | uuid (FK→Book) | 绘本 |
| feedback_type | enum | read_start/read_complete/difficulty_rating/use_scenario |
| difficulty_rating | int | 难度评分 1-5（仅 difficulty_rating 类型） |
| use_scenario | string | 使用场景（仅 use_scenario 类型） |
| created_at | timestamp | 提交时间 |

## 聚合统计

详情页展示：
- 收藏总数
- 阅读完成数
- 平均难度评分
