# 提案：收藏与反馈 (08-book-feedback)

## 状态

- **状态**: proposed
- **优先级**: P2（第三批次，可选功能）
- **依赖**: 06-book-display

---

## 1. 背景

bookmgr 绘本库面向教师和家长两类用户。随着绘本数量增长，用户希望能够：
- 收藏常用或喜爱的绘本，方便下次快速访问
- 记录阅读进度（开始阅读 / 完成阅读）
- 对绘本难度进行评分，为其他用户提供参考
- 记录使用场景（课堂 / 家庭 / 个训等），辅助教学规划

当前系统仅有基础的绘本浏览和借阅功能，缺少用户个性化数据积累，无法形成数据驱动的教学建议。

---

## 2. 目标

### 功能目标

1. **收藏管理**：用户可收藏/取消收藏绘本，查看自己的收藏列表
2. **多类型反馈**：支持阅读开始、阅读完成、难度评分、使用场景四种反馈类型
3. **反馈统计**：在绘本详情页展示收藏数、阅读完成数、平均难度评分
4. **管理员视角**：管理员可查看所有用户反馈的聚合统计数据

### 非功能目标

- 最小化对现有 API 的破坏性变更
- 复用现有 JWT 鉴权体系
- all-in-one 单二进制，迁移路径平滑（新增 Ent Schema + migration）

---

## 3. MVP 范围

### 包含

- BookFavorite 收藏实体及 CRUD API
- BookFeedback 反馈实体及 CRUD API
- 绘本详情页的统计数字展示
- 「我的收藏」页面（前端）
- 反馈提交表单（前端）
- BDD 测试覆盖（API + E2E）

### 不包含

- 微信/邮件通知
- 个性化推荐算法
- 管理员删除他人反馈
- 反馈编辑（仅支持删除）

---

## 4. 影响范围

### 新增数据库表（2 张）

| 表名 | 说明 |
|------|------|
| `book_favorites` | 用户收藏关系，(user_id, book_id) 唯一约束 |
| `book_feedbacks` | 用户反馈记录，支持多类型 |

### 新增 Ent Schema（2 个）

- `BookFavorite` — 对应 `book_favorites` 表
- `BookFeedback` — 对应 `book_feedbacks` 表

### Proto 新增（2 个服务扩展）

- `BookService.FavoriteBook` — 收藏/取消收藏/查询是否收藏
- `BookService.GetBookFeedback` — 获取反馈统计
- `UserService.ListMyFavorites` — 我的收藏列表
- `UserService.ListMyFeedback` — 我的反馈历史

### 新增 API 前缀

- `POST   /api/v1/books/{book}/favorite`
- `DELETE /api/v1/books/{book}/favorite`
- `GET    /api/v1/books/{book}/favorite`
- `GET    /api/v1/users/me/favorites`
- `POST   /api/v1/books/{book}/feedback`
- `GET    /api/v1/books/{book}/feedback`
- `GET    /api/v1/users/me/feedback`
- `DELETE /api/v1/books/{book}/feedback/{feedback}`

### 前端新页面/组件

- `/console/favorites` — 我的收藏
- `/console/feedback` — 反馈历史
- 绘本详情页增加收藏按钮和统计数字
- 反馈提交弹窗/表单

---

## 5. 验收标准

### 功能验收

- [ ] 用户可收藏绘本，已收藏状态正确反映
- [ ] 重复收藏同一绘本返回 409 Conflict（已存在）
- [ ] 取消收藏后，该绘本不再出现在收藏列表
- [ ] 我的收藏列表支持分页
- [ ] 用户可提交 read_start / read_complete / difficulty_rating / use_scenario 四种反馈
- [ ] difficulty_rating 限制为 1-5，非法值返回 400
- [ ] 绘本详情页显示：收藏数、完成阅读数、平均难度评分
- [ ] 用户只能删除自己的反馈，不能删除他人反馈
- [ ] 管理员可查看所有用户反馈的聚合统计
- [ ] 所有 API 通过 BDD 测试

### 技术验收

- [ ] 新增两张 Ent Schema，通过 `go generate ./ent`
- [ ] Migration SQL 可用 `atlas migrate diff` 生成
- [ ] Proto 文件通过 `buf lint` 和 `buf breaking`
- [ ] all-in-one 二进制包含新表 schema
- [ ] 前端构建通过 `npm run build`

### 约束验收

- [ ] 不引入新的外部依赖
- [ ] 不修改现有 API 的请求/响应结构（仅新增字段）
- [ ] JWT 鉴权覆盖所有新端点
