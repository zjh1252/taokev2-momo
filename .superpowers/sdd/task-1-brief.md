### Task 1: D1 — PublicCourseListCache 城市可缓存

**Files:**
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/support/PublicCourseListCache.java`
- Create: `backend/taoke-course/src/test/java/com/taoke/course/support/PublicCourseListCacheTest.java`

**Interfaces:**
- Consumes: `PublicCourseQuery`（`cityIds`、`enrollStatus`、`size`、`sortBy`、`isOpen`、`page`）
- Produces: `isCacheableDefault` 对单城 + size=10 + ENROLLING 返回 true；`listKey` 区分 city/enroll

- [ ] **Step 1: 写失败单测**

```java
package com.taoke.course.support;

import com.taoke.course.dto.course.PublicCourseQuery;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PublicCourseListCacheTest {

    @Mock StringRedisTemplate stringRedisTemplate;
    @Mock ObjectMapper objectMapper;
    @InjectMocks PublicCourseListCache cache;

    private PublicCourseQuery cityUpcoming(int cityId) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setIsOpen(true);
        q.setPage(1);
        q.setSize(10);
        q.setSortBy("time");
        q.setCityIds(List.of(cityId));
        q.setEnrollStatus("ENROLLING");
        return q;
    }

    @Test
    void isCacheable_singleCityEnrollingSize10() {
        assertTrue(cache.isCacheableDefault(cityUpcoming(2)));
    }

    @Test
    void isCacheable_rejectsMultiCity() {
        PublicCourseQuery q = cityUpcoming(2);
        q.setCityIds(List.of(2, 3));
        assertFalse(cache.isCacheableDefault(q));
    }

    @Test
    void listKey_differsByCity() throws Exception {
        // 通过 put + 捕获 key，或把 listKey 包可见后断言；
        // 实现时用 ReflectionTestUtils / package-visible helper 断言：
        // key(shanghai) != key(beijing)，且均含 city 与 enroll 维
        assertNotEquals(
                invokeListKey(cityUpcoming(2)),
                invokeListKey(cityUpcoming(1)));
    }

    // invokeListKey: 反射调用 private listKey(PublicCourseQuery)
}
```

- [ ] **Step 2: 跑测确认失败**

```bash
cd backend
mvn -pl taoke-course -Dtest=PublicCourseListCacheTest test
```

Expected: FAIL（size 10 / city 仍不可缓存，或 key 相同）

- [ ] **Step 3: 实现缓存条件与 key**

在 `PublicCourseListCache`：

1. `CACHEABLE_SIZES = Set.of(10, 15, 30, 36)`
2. `isCacheableDefault` 中：
   - `cityIds`：`null`/空 **或** `size()==1` 才过；`size()>1` → false
   - `enrollStatus`：`null`/blank **或** `"ENROLLING"`（忽略大小写 trim）才过；其它 → false
3. `listKey(PublicCourseQuery)` 改为包含：
   - `city` 段：无城 → `c0`；单城 → `c{id}`
   - `enroll` 段：空白 → `e_`；否则 `e{normalized}`
   - 形如：`taoke:course:public:list:open:time:p1:s10:c2:eENROLLING`
4. `evictPublicListCaches` **保持**只删无城默认组合（不扫 `c*`）；城市 key 靠 TTL。注意：`listKey(boolean, sort, page, size)` 旧重载用于 evict 时应对齐「无城 + 无 enroll」后缀（`c0:e_`），避免清不到默认 key。

- [ ] **Step 4: 再跑测**

```bash
cd backend
mvn -pl taoke-course -Dtest=PublicCourseListCacheTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/taoke-course/src/main/java/com/taoke/course/support/PublicCourseListCache.java \
        backend/taoke-course/src/test/java/com/taoke/course/support/PublicCourseListCacheTest.java
git commit -m "$(cat <<'EOF'
perf(course): 允许单城公开课列表走 Redis 缓存

城市频道沪/京 SSR 的 cityIds+ENROLLING 查询此前被排除缓存；扩展可缓存条件并在 key 中区分城市与报名状态。
EOF
)"
```

---

