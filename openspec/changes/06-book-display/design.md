# 设计文档：绘本展示浏览

## Context

面向登录用户的绘本浏览和阅读功能。展示已审核通过的绘本，提供卡片列表、详情页和 PDF/EPUB 在线阅读器。

## BookReadingProgress 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| book_id | uuid (FK→Book) | 关联绘本 |
| user_id | uuid (FK→User) | 关联用户 |
| progress_percent | int | 进度百分比 0-100 |
| last_page | int | 最后阅读页码 |
| last_read_at | timestamp | 最后阅读时间 |

唯一约束：(book_id, user_id)。

## 阅读器集成

- **PDF**: pdfjs-dist@^4.0，canvas 渲染，支持 CSS transform 同步字体缩放
- **EPUB**: epubjs@^0.3，WebViews 渲染

## 权限

- 列表/详情/阅读：所有登录用户（teacher, parent, admin）
- 下载：仅 teacher 和 admin（parent 不可下载）
