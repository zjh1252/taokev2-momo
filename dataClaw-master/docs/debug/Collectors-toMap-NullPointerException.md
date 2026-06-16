# Collectors.toMap() NullPointerException 问题分析与修复指南

## 问题概述

`java.lang.NullPointerException` 在使用 `Collectors.toMap()` 时发生，原因是该方法不允许 value 为 `null`。

### 错误堆栈示例

```
java.lang.NullPointerException
        at java.base/java.util.HashMap.merge(HashMap.java:1363)
        at java.base/java.util.stream.Collectors.lambda$toMap$68(Collectors.java:1636)
        at com.taoke.course.search.CourseDocumentProvider.buildDocuments(CourseDocumentProvider.java:87)
```

---

## 根本原因

`Collectors.toMap()` 内部使用 `HashMap.merge()` 方法，该方法明确禁止 value 为 `null`：

```java
// HashMap.merge() 源码片段
if (value == null) {
    throw new NullPointerException();
}
```

当映射函数（如 `Trainer::getName`）返回 `null` 时，就会抛出 `NullPointerException`。

---

## 项目中发现的问题清单

### 🔴 高风险（已确认存在 null 值可能）

| 文件 | 行号 | 代码 | 风险分析 |
|------|------|------|----------|
| `CourseDocumentProvider.java` | 87 | `Trainer::getName` | Trainer.name 字段可空（无 nullable=false） |
| `CourseDocumentProvider.java` | 103 | `Category::getName` | Category.name 虽有 nullable=false，但需确认数据一致性 |
| `CategoryServiceImpl.java` | 50 | `Category::getName` | 同上 |

### 🟡 中风险（需要验证）

| 文件 | 行号 | 代码 | 风险分析 |
|------|------|------|----------|
| `TrainerDocumentProvider.java` | 94 | `Region::getName` | Region.name 有 nullable=false，风险较低 |

### 🟢 低风险（value 是实体对象，不会为 null）

以下位置使用 `Function.identity()` 或映射到实体对象，风险较低：

- `TrainerServiceImpl.java:95`
- `LearningService.java:73, 78, 129`
- `AdminTrainerService.java:83, 85`
- `AdminInstitutionService.java:82, 84`
- `AdminInstitutionEmployeeService.java:108, 110`
- `AdminEnterpriseBuyerService.java:82, 84`
- `AdminEnterpriseAgentService.java:91, 93`
- `AdminCourseService.java:77, 169`
- `AdminAssistantService.java:85, 87`
- `AdminAgentService.java:86, 88`
- `AdminTrainerHighlightController.java:55`
- `AdminTrainerCaseController.java:54`

---

## 受影响的实体字段分析

### Trainer 实体

```java
// Trainer.java:37-38
@Column(name = "name", length = 100)  // 注意：没有 nullable=false
private String name;
```

**结论：** `name` 字段在数据库层面允许为 null，是当前问题的根源。

### Category 实体

```java
// Category.java:32-33
@Column(name = "name", nullable = false, length = 100)
private String name;
```

**结论：** 虽然有 `nullable=false`，但如果存在历史数据或手动修改过数据库，仍可能有 null 值。

### Region 实体

```java
// Region.java:29-30
@Column(name = "name", nullable = false, length = 765)
private String name;
```

**结论：** 风险较低，但仍建议做防护。

---

## 解决方案

### 方案 1：使用 Collectors.toMap() 时手动处理 null（推荐）

```java
// 修改前
trainerNameMap = trainerService.findByIds(trainerIds).stream()
        .collect(Collectors.toMap(Trainer::getId, Trainer::getName, (a, b) -> a));

// 修改后
trainerNameMap = trainerService.findByIds(trainerIds).stream()
        .collect(Collectors.toMap(
                Trainer::getId,
                t -> t.getName() != null ? t.getName() : "",  // 或其他默认值
                (a, b) -> a
        ));
```

### 方案 2：使用 Map.putIfAbsent 或 forEach 循环

```java
Map<Integer, String> trainerNameMap = new HashMap<>();
for (Trainer trainer : trainerService.findByIds(trainerIds)) {
    String name = trainer.getName();
    if (name != null) {
        trainerNameMap.put(trainer.getId(), name);
    }
    // 或者：
    // trainerNameMap.put(trainer.getId(), name != null ? name : "");
}
```

### 方案 3：封装工具方法

```java
public class StreamUtils {
    
    /**
     * 安全的 toMap，允许 value 为 null
     */
    public static <T, K, V> Map<K, V> toMapSafe(
            Stream<T> stream,
            Function<? super T, ? extends K> keyMapper,
            Function<? super T, ? extends V> valueMapper
    ) {
        Map<K, V> map = new HashMap<>();
        stream.forEach(t -> {
            K key = keyMapper.apply(t);
            V value = valueMapper.apply(t);
            map.put(key, value);  // HashMap 允许 value 为 null
        });
        return map;
    }
    
    /**
     * 安全的 toMap，允许 value 为 null，支持冲突合并
     */
    public static <T, K, V> Map<K, V> toMapSafe(
            Stream<T> stream,
            Function<? super T, ? extends K> keyMapper,
            Function<? super T, ? extends V> valueMapper,
            BinaryOperator<V> mergeFunction
    ) {
        Map<K, V> map = new HashMap<>();
        stream.forEach(t -> {
            K key = keyMapper.apply(t);
            V value = valueMapper.apply(t);
            map.merge(key, value, mergeFunction);
        });
        return map;
    }
}
```

使用方式：

```java
trainerNameMap = StreamUtils.toMapSafe(
        trainerService.findByIds(trainerIds).stream(),
        Trainer::getId,
        Trainer::getName,
        (a, b) -> a
);
```

---

## 需要修复的文件清单

### 优先级 1（当前报错的位置）

1. **`CourseDocumentProvider.java:87`**
   - 问题：`Trainer::getName` 可能返回 null
   - 建议：使用默认空字符串 `""` 或 `"未知讲师"`

2. **`CourseDocumentProvider.java:103`**
   - 问题：`Category::getName` 理论上不应为 null，但需防护
   - 建议：使用默认空字符串 `""`

3. **`CategoryServiceImpl.java:50`**
   - 问题：同上
   - 建议：使用默认空字符串 `""`

### 优先级 2（预防性修复）

4. **`TrainerDocumentProvider.java:94`**
   - 问题：`Region::getName` 虽有 nullable=false，但为保险起见
   - 建议：添加 null 防护

---

## 数据库数据检查建议

在修复代码前，建议检查数据库中的脏数据：

```sql
-- 检查 name 为 null 的讲师
SELECT id, user_id, name, status FROM user_trainers WHERE name IS NULL OR name = '';

-- 检查 name 为 null 的分类
SELECT id, type, name FROM sys_categories WHERE name IS NULL OR name = '';

-- 检查 name 为 null 的行政区划
SELECT id, code, name FROM common_regions WHERE name IS NULL OR name = '';
```

---

## 最佳实践总结

1. **永远不要假设** `Collectors.toMap()` 的 value 不为 null
2. **优先使用方案 1**（简单直接）或方案 3（可复用）
3. **数据库约束不能替代代码防护**，即使字段有 `nullable=false`
4. **对于 String 类型**，可以考虑统一使用空字符串 `""` 代替 `null`
5. **在代码审查中**，注意检查 `Collectors.toMap()` 的使用

---

## 参考链接

- [OpenJDK Bug: Collectors.toMap fails on null values](https://bugs.openjdk.org/browse/JDK-8148463)
- [StackOverflow: NullPointerException in Collectors.toMap](https://stackoverflow.com/questions/42589232/collectors-tomap-nullpointerexception)
