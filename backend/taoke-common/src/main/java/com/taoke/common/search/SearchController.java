package com.taoke.common.search;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * C 端统一搜索入口 — 全文检索课程、专家等内容，支持高级筛选。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Tag(name = "全文搜索", description = "C 端统一搜索接口（基于 Elasticsearch + IK 中文分词）")
@RestController
@RequiredArgsConstructor
public class SearchController {

    private final SearchIndexService searchIndexService;

    @Public
    @Operation(
            summary = "全文搜索（课程 / 专家）",
            description = """
                    按关键词搜索课程、专家，支持多维度筛选。

                    ### 检索能力

                    - **关键词全文匹配**：使用 IK 中文分词（`ik_max_word` 索引、`ik_smart` 搜索）。
                    - **字段权重**：`title`、`name`、`keywords` 加权（^3/^3/^2），其余字段权重 1。
                    - **高亮**：命中关键词时，主要文本字段返回高亮片段，包裹标签为 `<em>...</em>`，多片段以 `…` 拼接，挂在结果项的 `_highlight` 字段下。
                    - **筛选条件**：均为可选；任意筛选字段间为「AND」关系，`courseType` 内部为「OR」。
                    - **分页**：`page` 从 1 开始；`size` 建议 ≤ 50，避免一次性返回过多。

                    ### 返回结构

                    顶层是统一响应包装 `ApiResponse`，`data` 为分页 `PageResponse<Map<String, Object>>`：

                    ```json
                    {
                      "code": 0,
                      "message": "ok",
                      "data": {
                        "list": [ /* 文档对象数组（结构因 docType 不同） */ ],
                        "total": 128,
                        "page": 1,
                        "size": 20,
                        "totalPages": 7
                      }
                    }
                    ```

                    每个文档对象都至少包含：

                    | 字段 | 类型 | 说明 |
                    | ---- | ---- | ---- |
                    | `docId` | string | ES 文档主键，格式 `{docType}_{id}` |
                    | `docType` | string | `course` / `trainer` |
                    | `id` | int | 业务主键（课程 ID / 专家 ID） |
                    | `createdAt` | string(date-time) | 创建时间 |
                    | `updatedAt` | string(date-time) | 更新时间 |
                    | `_highlight` | object | 命中关键词时存在；key=字段名，value=带 `<em>` 高亮的片段 |

                    **`docType=course` 额外字段（节选）**：

                    | 字段 | 类型 | 说明 |
                    | ---- | ---- | ---- |
                    | `title` | string | 课程标题 |
                    | `intro` | string | 课程简介 |
                    | `keywords` | string | 关键词 |
                    | `highlights` | string | 课程亮点 |
                    | `audience` | string | 适合人群 |
                    | `goodAt` | string | 解决问题 |
                    | `type` | string | 课程子类型：`INTERNAL` / `OPEN_OFFLINE` / `OPEN_ONLINE` |
                    | `categoryId` / `subCategoryId` | int | 分类 ID |
                    | `categoryName` / `subCategoryName` | string | 分类名称 |
                    | `price` | number | 售价（元） |
                    | `durationDays` | int | 授课天数 |
                    | `trainerName` | string | 专家姓名（冗余） |

                    **`docType=trainer` 额外字段（节选）**：

                    | 字段 | 类型 | 说明 |
                    | ---- | ---- | ---- |
                    | `name` | string | 专家姓名 |
                    | `bio` | string | 专家简介 |
                    | `expertiseTags` | string | 擅长领域（拼接文本，便于全文匹配） |
                    | `teachingStyle` | string | 授课风格 |
                    | `provinceId` / `cityId` | int | 所在地区 ID |
                    | `experienceYears` | int | 从业年限 |
                    | `teachingYears` | int | 授课年限 |
                    | `expertiseCategoryIds` | int[] | 擅长领域分类 ID 数组 |

                    ### 调用示例

                    ```bash
                    # 1) 公开课关键词搜索
                    curl '<HOST>/search?keyword=领导力&docType=course&courseType=OPEN_OFFLINE,OPEN_ONLINE&page=1&size=10'

                    # 2) 上海地区、教龄 ≥ 5 年的专家
                    curl '<HOST>/search?docType=trainer&provinceId=310000&minExperienceYears=5'

                    # 3) 价格 0~5000 元、授课 2 天的内训课
                    curl '<HOST>/search?docType=course&courseType=INTERNAL&minPrice=0&maxPrice=5000&durationDays=2'
                    ```

                    ### 错误码

                    | code | 含义 |
                    | ---- | ---- |
                    | `SEARCH_EXECUTE_ERROR` | 底层 ES 查询异常，重试或联系平台 |
                    | `SEARCH_INDEX_ERROR` | 索引读写异常 |

                    > 此接口为开放接口（`@Public`），无需登录态。建议接入方做缓存与限流。
                    """,
            responses = {
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "200",
                            description = "搜索成功，data 为分页结果（list 中元素结构因 docType 不同）",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = ApiResponse.class),
                                    examples = {
                                            @ExampleObject(
                                                    name = "课程结果示例",
                                                    summary = "docType=course 的命中样例",
                                                    value = """
                                                            {
                                                              "code": 0,
                                                              "message": "ok",
                                                              "data": {
                                                                "list": [
                                                                  {
                                                                    "docId": "course_1024",
                                                                    "docType": "course",
                                                                    "id": 1024,
                                                                    "title": "高效领导力实战",
                                                                    "intro": "面向中层管理者的两天工作坊…",
                                                                    "type": "OPEN_OFFLINE",
                                                                    "categoryId": 12,
                                                                    "categoryName": "管理沟通",
                                                                    "price": 4980.00,
                                                                    "durationDays": 2,
                                                                    "trainerName": "张三",
                                                                    "createdAt": "2026-03-12T10:21:33",
                                                                    "_highlight": {
                                                                      "title": "高效<em>领导力</em>实战",
                                                                      "intro": "面向中层管理者的两天工作坊…<em>领导力</em>修炼…"
                                                                    }
                                                                  }
                                                                ],
                                                                "total": 128,
                                                                "page": 1,
                                                                "size": 20,
                                                                "totalPages": 7
                                                              }
                                                            }
                                                            """
                                            ),
                                            @ExampleObject(
                                                    name = "专家结果示例",
                                                    summary = "docType=trainer 的命中样例",
                                                    value = """
                                                            {
                                                              "code": 0,
                                                              "message": "ok",
                                                              "data": {
                                                                "list": [
                                                                  {
                                                                    "docId": "trainer_88",
                                                                    "docType": "trainer",
                                                                    "id": 88,
                                                                    "name": "李四",
                                                                    "bio": "20 年企业管理咨询经验…",
                                                                    "expertiseTags": "战略规划 团队领导力 OKR",
                                                                    "provinceId": 310000,
                                                                    "cityId": 310100,
                                                                    "experienceYears": 20,
                                                                    "teachingYears": 12,
                                                                    "expertiseCategoryIds": [21, 33],
                                                                    "_highlight": {
                                                                      "name": "<em>李四</em>",
                                                                      "expertiseTags": "战略规划 团队<em>领导力</em> OKR"
                                                                    }
                                                                  }
                                                                ],
                                                                "total": 6,
                                                                "page": 1,
                                                                "size": 20,
                                                                "totalPages": 1
                                                              }
                                                            }
                                                            """
                                            )
                                    }
                            )
                    )
            }
    )
    @GetMapping("/search")
    public ApiResponse<PageResponse<Map<String, Object>>> search(@ModelAttribute SearchRequest request) {
        PageResponse<Map<String, Object>> result = searchIndexService.search(request);
        return ApiResponse.ok(result);
    }
}
