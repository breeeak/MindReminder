# Sprint 1 计划

**Sprint编号**: 1
**Sprint目标**: 建立项目技术基础设施，搭建可运行的开发环境
**开始日期**: 2025-12-13
**结束日期**: 2025-12-27 (2周)
**Sprint时长**: 2周
**团队成员**: 开发团队

---

## 🎯 Sprint目标

建立MindReminder项目的完整技术基础设施，包括：
- 使用electron-vite创建项目骨架
- 建立SQLite数据库和数据访问层
- 实现核心复习算法
- 搭建前后端通信架构
- 配置状态管理系统

**成功标准**：
- ✅ 所有Epic 1的6个Story全部完成
- ✅ 应用可以启动并显示基础界面
- ✅ 数据库可以正常读写
- ✅ 复习算法单元测试100%通过
- ✅ 前后端通信正常工作

---

## 📋 Sprint Backlog

### Epic 1: 项目基础设施与开发环境

#### Story 1.1: electron-vite项目初始化
**Story点数**: 5
**优先级**: P0 (最高)
**负责人**: 待分配
**依赖**: 无

**任务拆解**：
1. 执行 `npm create @quick-start/electron` 创建项目
2. 安装依赖并验证启动
3. 集成Ant Design和配置主题
4. 配置TypeScript严格模式
5. 创建项目文档（README）
6. 验证所有AC通过

**验收标准**：
- [x] 项目结构包含main/renderer/preload目录
- [x] pnpm dev能启动并打开窗口
- [x] Ant Design组件可正常使用
- [x] TypeScript编译无错误
- [x] 热重载功能正常

**预计工时**: 4小时

---

#### Story 1.2: SQLite数据库基础设施
**Story点数**: 8
**优先级**: P0
**负责人**: 待分配
**依赖**: Story 1.1

**任务拆解**：
1. 安装better-sqlite3依赖
2. 实现DatabaseService类
3. 配置数据库存储路径（跨平台）
4. 创建迁移机制
5. 编写初始迁移文件（knowledge和review_history表）
6. 实现迁移自动执行
7. 添加错误处理和日志
8. 验证所有AC通过

**验收标准**：
- [x] DatabaseService提供initialize/getConnection/close/runMigrations方法
- [x] 数据库文件正确存储在系统路径
- [x] 初始表和索引正确创建
- [x] 迁移机制支持事务和回滚

**预计工时**: 8小时

---

#### Story 1.3: Repository模式数据访问层
**Story点数**: 8
**优先级**: P0
**负责人**: 待分配
**依赖**: Story 1.2

**任务拆解**：
1. 创建BaseRepository抽象类
2. 定义Knowledge和ReviewHistory类型
3. 实现KnowledgeRepository
4. 实现ReviewRepository
5. 创建Repository工厂
6. 实现数据命名转换（snake_case ↔ camelCase）
7. 编写单元测试
8. 验证所有AC通过

**验收标准**：
- [x] BaseRepository提供通用CRUD方法
- [x] KnowledgeRepository提供搜索和筛选方法
- [x] ReviewRepository提供复习相关查询
- [x] 单元测试覆盖所有方法

**预计工时**: 8小时

---

#### Story 1.4: 复习算法核心框架
**Story点数**: 13
**优先级**: P0
**负责人**: 待分配
**依赖**: Story 1.3

**任务拆解**：
1. 创建SpacedRepetitionAlgorithm类
2. 实现评分系数映射（1-5级评分）
3. 实现艾宾浩斯曲线计算
4. 实现频率系数调整
5. 实现记忆掌握判断逻辑
6. 编写完整单元测试（覆盖率≥90%）
7. 验证算法准确性（NFR-R4）
8. 验证所有AC通过

**验收标准**：
- [x] calculateNextReviewDate正确计算下次复习时间
- [x] getRatingMultiplier返回正确系数
- [x] isKnowledgeMastered正确判断掌握状态
- [x] 单元测试覆盖率≥90%
- [x] 所有测试用例通过

**预计工时**: 12小时

---

#### Story 1.5: IPC通信基础架构
**Story点数**: 8
**优先级**: P0
**负责人**: 待分配
**依赖**: Story 1.3

**任务拆解**：
1. 定义IPC通道枚举
2. 实现Context Bridge（preload）
3. 创建TypeScript类型声明
4. 实现IPC处理器（main进程）
5. 实现错误处理中间件
6. 配置electron-log日志
7. 测试IPC通信
8. 验证所有AC通过

**验收标准**：
- [x] IPC通道枚举完整定义
- [x] Context Bridge安全暴露API
- [x] IPC处理器返回标准化响应
- [x] 错误日志正确记录
- [x] 调用响应时间<200ms

**预计工时**: 8小时

---

#### Story 1.6: Zustand状态管理基础
**Story点数**: 5
**优先级**: P0
**负责人**: 待分配
**依赖**: Story 1.1, 1.5

**任务拆解**：
1. 安装Zustand依赖
2. 创建appStore（应用状态）
3. 创建knowledgeStore（知识点状态）
4. 实现Store操作方法（调用IPC）
5. 集成Redux DevTools
6. 创建示例组件验证
7. 验证所有AC通过

**验收标准**：
- [x] appStore和knowledgeStore正常工作
- [x] 操作方法正确调用IPC接口
- [x] 状态变化自动触发组件重渲染
- [x] Redux DevTools可用

**预计工时**: 6小时

---

## 📊 Sprint容量和工作量

**总Story点数**: 47点

**预计总工时**: 46小时

**Story分布**：
- Story 1.1: 5点 (4h)
- Story 1.2: 8点 (8h)
- Story 1.3: 8点 (8h)
- Story 1.4: 13点 (12h)
- Story 1.5: 8点 (8h)
- Story 1.6: 5点 (6h)

**团队容量**（假设1名全职开发者，2周）：
- 工作日：10天
- 每天可用时间：5小时
- 总容量：50小时

**容量匹配**: ✅ 46小时 < 50小时（合理负载）

---

## 🎯 Sprint依赖关系

```
Story 1.1 (项目初始化)
    ↓
Story 1.2 (数据库) ← Story 1.1
    ↓
Story 1.3 (Repository) ← Story 1.2
    ↓
Story 1.4 (算法) ← Story 1.3
Story 1.5 (IPC) ← Story 1.3
    ↓
Story 1.6 (状态管理) ← Story 1.1, 1.5
```

**关键路径**: 1.1 → 1.2 → 1.3 → 1.4 (总计25h)

**建议实施顺序**：
1. **Week 1 Day 1-2**: Story 1.1 (项目初始化)
2. **Week 1 Day 3-4**: Story 1.2 (数据库基础)
3. **Week 1 Day 5 - Week 2 Day 1**: Story 1.3 (Repository)
4. **Week 2 Day 2-4**: Story 1.4 (算法) + Story 1.5 (IPC) 并行
5. **Week 2 Day 5**: Story 1.6 (状态管理) + Sprint总结

---

## ✅ Definition of Done (完成定义)

每个Story必须满足以下标准才能标记为完成：

### 代码质量
- [x] 所有Acceptance Criteria验证通过
- [x] 代码遵循项目命名规范和架构模式
- [x] TypeScript编译无错误和警告
- [x] ESLint检查通过
- [x] 代码已提交到版本控制

### 测试要求
- [x] 核心算法单元测试覆盖率≥90% (Story 1.4)
- [x] Repository层测试覆盖率≥80% (Story 1.3)
- [x] 手动验收测试通过
- [x] 跨平台测试（Windows/macOS至少一个）

### 文档
- [x] 代码注释完整（复杂逻辑）
- [x] README更新（如有需要）
- [x] 技术决策记录（如有重大变更）

### 集成
- [x] 代码已合并到主分支
- [x] 与其他Story集成测试通过
- [x] 应用可正常启动和运行

---

## 🚧 风险和障碍

### 识别的风险

**R1: 技术栈学习曲线**
- 描述: 团队可能不熟悉Electron/Vite/Zustand
- 影响: 中等
- 缓解措施: 提前学习官方文档，预留缓冲时间

**R2: 跨平台兼容性问题**
- 描述: 数据库路径、系统集成在不同OS可能有差异
- 影响: 中等
- 缓解措施: 使用成熟的跨平台API，尽早测试

**R3: Story 1.4算法实现复杂度**
- 描述: 复习算法是核心，需要100%准确性
- 影响: 高
- 缓解措施: 充足的单元测试，参考PRD和架构文档

**R4: Story间依赖阻塞**
- 描述: 前置Story未完成会阻塞后续Story
- 影响: 高
- 缓解措施: 严格按顺序开发，每日同步进度

---

## 📅 Sprint事件安排

### Sprint Planning (已完成)
- 日期: 2025-12-13
- 参与者: Scrum Master, 开发团队
- 输出: 本Sprint计划文档

### Daily Standup
- 时间: 每日早上10:00
- 时长: 15分钟
- 格式: 
  - 昨天完成了什么？
  - 今天计划做什么？
  - 有什么障碍？

### Sprint Review
- 日期: 2025-12-27
- 时长: 1小时
- 议程:
  - 演示完成的功能
  - 验收每个Story
  - 收集反馈

### Sprint Retrospective
- 日期: 2025-12-27
- 时长: 1小时
- 议程:
  - 什么做得好？
  - 什么需要改进？
  - 下个Sprint的行动项

---

## 📈 度量指标

### 速度跟踪
- 计划点数: 47点
- 实际完成: _待填写_
- 速度: _待计算_

### 燃尽图
- 每日更新剩余Story点数
- 跟踪实际进度vs计划进度

### 质量指标
- 代码覆盖率: 目标≥85%
- 缺陷数: 目标0个阻塞性缺陷
- AC通过率: 目标100%

---

## 🎉 Sprint成功标准

本Sprint被认为成功当且仅当：

1. ✅ **所有6个Story全部完成**（满足DoD）
2. ✅ **应用可启动并显示基础界面**
3. ✅ **数据库读写功能正常**
4. ✅ **复习算法单元测试100%通过**
5. ✅ **前后端IPC通信正常**
6. ✅ **状态管理系统工作正常**
7. ✅ **跨平台兼容性验证通过**（至少Windows或macOS）
8. ✅ **无阻塞性技术债务**

---

## 📝 备注

- 本Sprint是MindReminder项目的第一个Sprint
- Epic 1是整个项目的技术基础，质量至关重要
- 后续Epic 2-5都依赖于本Sprint的成功完成
- 建议每个Story完成后立即验收，避免积压
- 如遇到严重阻塞，立即升级给Scrum Master

---

**计划创建日期**: 2025-12-13
**计划创建者**: Scrum Master
**计划状态**: ✅ 已批准
**下一步**: 开始Story 1.1实施

---

## 快速参考链接

- [Epic 1详细文档](../stories/epic-1-infrastructure.md)
- [架构文档](../architecture.md)
- [PRD文档](../prd.md)
- [实施就绪报告](../implementation-readiness-report-2025-12-13.md)

