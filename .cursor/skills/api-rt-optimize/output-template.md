# 输出模板（强制）

用户可见交付必须使用下列结构；条目级小节块可复制。

```markdown
# 接口响应速度优化报告 — {接口或范围}

## 1. 瓶颈诊断

| 分段 | 现象 | 证据（路径/SQL） | 占比预估 |
|------|------|------------------|----------|
| 应用编排 | ... | `...java:Lxx` | xx% |
| JPA | ... | ... | xx% |
| MySQL | ... | EXPLAIN ... | xx% |
| Redis | ... | ... | xx% |
| 跨模块 | ... | ... | xx% |
| 前端 | ... | ... | xx% |

缺失输入：{列出未提供的链路耗时/慢SQL等}

## 2. 分级方案

### P0
#### P0-1 {标题}
- **问题代码**：
\`\`\`java
// 改造前
\`\`\`
- **根因**：
- **规范依据**：C2/C3/C5 ...（见 project-constraints.md）
- **改造代码**：
\`\`\`java
// 改造后（可直接复制）
\`\`\`
- **耗时收益**：RT 约 -XXms / DB round-trip -N（预估，需压测复核）
- **业务兼容风险**：{无/低/中/高 + 说明}

### P1 / P2
（同上结构）

## 3. 代码 / 索引 / 配置

### 3.1 Flyway（若有）
路径：`backend/taoke-app/src/main/resources/db/migration/V{N}__add_idx_xxx.sql`

\`\`\`sql
-- 中文注释说明用途
CREATE INDEX idx_xxx_yyy ON table_name (col1, col2);
\`\`\`

### 3.2 应用/缓存/线程池配置（若有）
\`\`\`yaml
# 可复制片段
\`\`\`

## 4. 校验命令

\`\`\`bash
cd backend && mvn -pl taoke-app -am compile
uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>
\`\`\`

## 5. 压测预期

| 指标 | 优化前 | 优化后（预估） | 备注 |
|------|--------|----------------|------|
| P95 RT | | -XX% | 需压测复核 |
| 单请求 DB 查询次数 | | -XX% | |
| TPS | | +XX% | 同机同并发 |

假设：{并发、数据量、缓存冷/热}
```

## 单条优化条目范例（写法标准）

```markdown
#### P0-1 课程列表 N+1
- **问题代码**：
\`\`\`java
for (Course c : page.getContent()) {
    c.getChapters().size(); // 触发懒加载
}
\`\`\`
- **根因**：列表循环访问 LAZY 集合，每条多 1 次 SQL。
- **规范依据**：C5 禁止循环中访问懒加载；列表须三段式 + DTO 投影。
- **改造代码**：分页查 ID → `findAllById` → 批量查 chapters → 组装 `CourseListItemDto`。
- **耗时收益**：100 条列表 DB 从 ~101 次降至 ~3 次；P95 预估 -60%～-80%（预估，需压测复核）。
- **业务兼容风险**：低；响应字段改为 DTO，需核对前端字段名。
```
