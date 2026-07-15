# 全链路优化校验清单

Agent 按优先级逐项勾选；每项改造须对应 SKILL 输出模板中的一条优化条目。

## 1. JPA & MySQL（P0）

- [ ] 全部关联统一 `FetchType.LAZY`；修复循环内访问懒加载导致的 N+1
- [ ] 列表强制三段式：ID 分页 → 批量查主表 → 批量关联；禁止 `Page<Entity>` 直接序列化出库
- [ ] 详情用 `JOIN FETCH` / `@EntityGraph`
- [ ] 查询使用 DTO 投影（Interface Projection 或 JPQL `new`）；禁止返回完整 Entity / 等价 `select *`
- [ ] Entity 补全 `@DynamicInsert`，推荐 `@DynamicUpdate`
- [ ] 分析 SQL：补 `idx_` 索引；消除隐式转换、函数包列、深分页 filesort
- [ ] 批量操作替换循环单条查询/保存；缩小 `@Transactional` 范围（先组装后短事务）
- [ ] 新增索引输出标准 Flyway 脚本 + `_validate_flyway_migration.py` 校验

## 2. Redis 缓存（P0 / P1）

- [ ] 循环读写改为 Pipeline / 批量命令
- [ ] 课程 / 专家 / CMS / 权限等热点数据加缓存（带版本键与 TTL 抖动）
- [ ] 落地穿透（空值短 TTL）、击穿（细粒度锁）、雪崩（TTL 抖动）；缩小 Redisson 锁代码块
- [ ] 大列表只缓存分页 ID + 短 TTL，避免超大 value 序列化

## 3. 跨模块调用（P1）

- [ ] 无依赖串行 API → `CompletableFuture` + 业务线程池并行（事务外）
- [ ] 循环调用 → 批量 api 接口
- [ ] 消息通知、统计、AI 匹配、对账等剥离主链路，MQ 领域事件异步
- [ ] 统一封装调用：超时、降级兜底（复用/扩展 `taoke-common`）

## 4. 代码层（P2）

- [ ] MapStruct 裁剪无用映射、复用 Mapper
- [ ] 消除循环内创建临时大对象
- [ ] 清理循环大对象日志；优化集合遍历与 JSON 序列化
- [ ] IO / 图片等非核心异步；复用 `taoke-common` 工具

## 5. 容器 & JVM（P2）

- [ ] Java 21 ZGC 参数调优，降低 STW
- [ ] 自定义业务线程池；Redis / MQ 连接池；Tomcat 线程与 accept 参数

示例（部署侧，按环境裁剪，勿盲目复制到生产）：

```text
-XX:+UseZGC -XX:+ZGenerational
-Xms2g -Xmx2g
```

## 6. 前端三端配套

- [ ] C 端 Next.js：React Query 预加载、列表懒加载、合并重复请求（pnpm）
- [ ] Admin：虚拟滚动、字典本地缓存、请求合并（bun）
- [ ] UniApp：静态数据本地缓存，聚合零散小接口

## 7. 架构合规（优先整改，等同 P0）

- [ ] 清理 admin 层直接操作 DAO / 跨模块 Entity 写操作
- [ ] 缓存用户角色权限，简化双层校验热点读路径（仍遵守 `@RequireRole` / `@RequirePermission` 不叠加误用；`SUPER_ADMIN` 跳过权限）

## 优化优先级速查

| 级 | 内容 |
|----|------|
| P0 | N+1、无索引慢 SQL、热点无缓存、串行同步调用、架构合规 |
| P1 | 循环 Redis 单操作、主流程同步耗时、事务过大、循环 API |
| P2 | JVM/连接池、低效对象/集合、前端配套 |
| P3 | 容器微调、MQ 批量消费、缓存预热 |
