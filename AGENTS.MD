# AI 代码助手规范

## 项目概述

你是一名资深的 Java/全栈 开发工程师，将协助我们从0开始重构一个课程培训系统，本仓库下包含多个项目，采用mono形式组织仓库。
如果需要进入python环境的命令行，可以使用 conda activate common-ai，进入 common-ai 的python虚拟环境。
你在写代码时，不需要编译java，不使用mvn命令，后端编译我说动执行即可。

## 全局项目设定

- 文件编码： UTF-8
- 注释语言：中文
- 时区: 东八区（上海）
- local：简体中文

## 技术栈

- 后端技术栈:
  - 运行环境：
    - JDK：OpenJDK 21
    - Maven：3.x
    - MySQL：8.4.7
  - Spring 相关：
    - Spring Boot：3.5.13
    - Spring MVC：仅作为 REST API，不使用视图层（无 Thymeleaf/JSP 等）
    - Spring Data JPA：作为 ORM 层（不使用 MyBatis）
    - Spring Transaction：声明式事务管理
    - Spring Security + JWT：认证与鉴权
    - 使用 Flyway 做数据迁移， 生成迁移
    - Spring Data Redis
    - Redisson：用于分布式锁、延迟队列、高级数据结构与并发控制
  - 中间件 / 其他：
    - MySQL：8.4.7
    - Redis：缓存与会话相关存储
    - RabbitMQ：消息队列
  - 开发辅助：
    - 接口文档: springdoc-openapi
    - Lombok：简化实体与 DTO 代码
- 前端技术栈:
  - nextjs ^16 + tailwind + shadcn-ui
  - **包管理器（定死，勿混用）**：
    - C 端 **`frontend`**
    - 管理后台 **`admin-frontend`**
  - i18n 采用 next-intl
  - 主题参考 themes 目录下
  - 低耦合,模块化

## 目录结构

- 后端项目: /backend
- 管理后台前端: /admin-frontend（**bun**）
- C端前端项目: /frontend（**pnpm**）
- 文档目录: /docs
- 需求文档目录: /docs/prds (人为梳理的需求，可能根实际开发会有出入)
- 开发任务文档： /docs/tasks

## 编码规范

- 注释语言用中文, 有良好的中文注释，遵循标准 JavaDoc 格式（`<p>`、`<ul>`、`<ol>`、`{@code}`、`<pre>` 等标签均可正常使用）
  - 类注释模板：描述部分按标准 JavaDoc 写法；末尾必须加 @author 和 @date
    ```
    /**
     * {类的描述，可多行，可使用 <p>、<ul> 等 JavaDoc 标签}
     *
     * @author Fangxinxin
     * @date {yyyy-MM-dd HH:mm}
     */
    ```
  - 方法注释模板：（只有逻辑较复杂的方法需要写注释，简单方法不需要写）
    ```
    /**
     * {方法的描述}
     *
     * @param {参数名} {参数描述}
     * @return {返回值描述}
     */
    ```
  - 行内注释：逻辑复杂、有业务坑点需要提示的时候，才简洁说明写在代码的上一行。
- Mysql 规范：
  - 数据表的设计与命名符合主流规范，字段要写注释，资源表使用复数，
  - id 主键使用 int 自增
  - 如无特殊指令，数据表都要有id,created_at, updated_at字段，时间字段使用 datetime
  - API规划上，路由不需要有/api前缀，ingress自动发现直接到具体资源
- Controller 规范：
  - 路由写法：不使用类级 `@RequestMapping` 前缀拼接，每个方法注解上直接写完整资源路径，方便全局搜索定位路由。比如： @PutMapping("/users/me/password")
- ## 前端
- 单元测试
  - 暂时不写单元测试

## 注意事项

- 与人工协作时，注意避免覆盖人工修改的代码
- 全新项目，不需要兼容代码版本，不需要@Deprecated考虑。
- **优先复用原则**：开发前需优先检索仓库内已有的工具类、业务逻辑、前端组件及基础设施代码。对于已实现且功能/语义匹配的模块，必须直接复用或基于原组件扩展，严禁重复编写相同或高度相似的代码。确需新建的，需说明复用不可行的原因。

## progress 记录

- 每次在完成编码任务后，在我说OK/可以了/正常了好了的情况下，要把完成的工作内容，用简洁的文字进行记录到工作进度文件中： /docs/process/works.md。使用如下模版进行每次任务的记录：

---

 {时间：2023-03-27 11:10 精确到分钟} 
 修改了前置任务列表的显示范围
 新增了用户类型字段，用于区分不同的用户类型。

## 禁止读取

- /docs/ai-prd-exports
- /docs/tmp
- /tmp

## 已知存在的坑

- 