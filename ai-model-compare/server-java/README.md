# AI 模型比价 · 后端服务（server-java）—— Java 版

与 Node 版（`../server`）**功能与行为完全一致**的 Java 实现，同一份需求的两种主流技术栈，供对比学习。
两套服务可同时运行（Node 版 :3000 / Java 版 :8080），接口响应可逐字节 diff。

## 技术栈

| 组件 | 选型 | 说明 |
|---|---|---|
| 语言/运行时 | Java 21（LTS） | 静态类型、编译型语言 |
| Web 框架 | Spring Boot 3.3.5 | Java 后端事实标准（对应 Express） |
| 数据访问 | MyBatis 3.0.3（注解 SQL） | 国内最主流 ORM（对应手写 SQL 的 dao 层） |
| 数据库 | SQLite（sqlite-jdbc） | 与 Node 版同一个数据库引擎，文件相互独立 |
| 构建工具 | Maven 3.9 | 依赖管理 + 构建（对应 npm + package.json） |

## Node vs Java 对照总表（对比学习核心）

| Node 版（server/src） | Java 版（src/main/java/com/aimodel/compare） | 概念对照 |
|---|---|---|
| `app.js`（入口：中间件/路由挂载/错误处理） | `Application.java` + `config/` + `common/GlobalExceptionHandler` | Spring 把入口的职责拆成：启动类 + 配置类 + 全局异常处理器 |
| `app.use(cors())` | `config/CorsConfig.java` | 中间件 → `WebMvcConfigurer` 回接配置 |
| `routes/*.routes.js`（router.get/post） | `controller/`（@GetMapping/@PostMapping） | 声明式路由：方法注解声明路径，参数注解声明来源 |
| `req.query` / `req.params` / `req.body` | `@RequestParam` / `@PathVariable` / `@RequestBody` | 参数解析从"约定式"变成"注解式" |
| `res.json({...})` | 直接 `return ApiResponse.ok(...)` | 返回值自动序列化 JSON |
| `next(err)` + 4 参数错误中间件 | `throw new BusinessException(...)` + `@RestControllerAdvice` | 错误中间件 → AOP 全局异常处理 |
| `services/*.service.js` | `service/`（@Service） | 业务层：一个对象字面量 → 一个 Bean 类 |
| `dao/*.dao.js`（对象 + db.prepare） | `mapper/`（@Mapper 接口 + 注解 SQL） | 只声明接口，实现由 MyBatis 动态代理生成 |
| `rowToModel`（手动字段映射） | `@Results` resultMap + TypeHandler | 行转换从"函数"变成"声明式映射规则" |
| `JSON.parse/JSON.stringify` | `typehandler/JsonMapTypeHandler` 等 | 类型转换收敛为可复用的扩展点 |
| `db.js`（建目录 + 建表 + 连接） | `Application.main`（建目录）+ `config/SchemaInitializer`（建表）+ yml（连接） | 单文件职责拆成三处 |
| `db.transaction(fn)` | `@Transactional`（AOP 声明式事务） | 手动包裹 → 注解自动包裹 |
| `data/models.data.js`（对象字面量） | `seed/ModelData.java`（Map/List 构造） | 动态字面量 → 静态类型构造 |
| `seed/seed.js`（npm run seed） | `seed/SeedRunner.java`（`-Dspring-boot.run.profiles=seed`） | 独立脚本 → Profile 条件装配 |
| `package.json` | `pom.xml` | 依赖与脚本的声明中心 |

## 目录结构

```
server-java/
├── pom.xml                        # Maven 配置（依赖、插件、Java 版本）
├── data/models.db                 # SQLite 数据库文件（首次 seed 自动创建）
└── src/main/
    ├── java/com/aimodel/compare/
    │   ├── Application.java       # 启动类：建 data 目录 → 启动 Spring（对应 app.js 主体）
    │   ├── config/
    │   │   ├── CorsConfig.java    # 跨域放行（对应 app.use(cors())）
    │   │   └── SchemaInitializer.java # 启动建表（对应 db.js 的 db.exec）
    │   ├── common/                # 统一响应 / 业务异常 / 全局异常处理
    │   │   ├── ApiResponse.java
    │   │   ├── BusinessException.java
    │   │   └── GlobalExceptionHandler.java
    │   ├── controller/            # 对应 routes/（ModelController / FavoriteController）
    │   ├── service/               # 对应 services/（ModelService / FavoriteService）
    │   ├── mapper/                # 对应 dao/（ModelMapper / FavoriteMapper，注解 SQL）
    │   ├── entity/Model.java     # 领域对象（对应 rowToModel 的产物）
    │   ├── typehandler/           # JSON/布尔 字段转换器（对应 JSON.parse / !!free）
    │   └── seed/                  # seed 数据 / 事务 / 执行器
    └── resources/application.yml # 端口、数据源、连接池、MyBatis 配置
```

**请求分层流转**：`HTTP 请求 → DispatcherServlet → controller → service → mapper → SQLite → JSON 响应`（与 Node 版三层完全同构）

## 快速开始

```bash
cd server-java

# 1. 灌入演示数据（对应 npm run seed，可重复执行结果一致）
mvn spring-boot:run -Dspring-boot.run.profiles=seed

# 2. 启动服务（对应 npm run dev），端口 8080
mvn spring-boot:run
```

> 首次构建会从 Maven 仓库（已配阿里云镜像）下载依赖并缓存到 `~/.m2`（类似 node_modules，但全局共享、各项目复用）。

验证：

```bash
curl http://localhost:8080/api/models                       # 模型列表
curl "http://localhost:8080/api/models?keyword=glm"          # 关键字筛选（大小写不敏感）
curl http://localhost:8080/api/models/deepseek-chat          # 模型详情
curl "http://localhost:8080/api/favorites?userId=u1"         # 收藏列表
curl -si http://localhost:8080/api/not-exist | head -1       # 未匹配路径 → 404 接口不存在
```

接口请求/响应契约与 Node 版**逐字节一致**（统一 `{code, message, data}` 格式、错误文案、排序规则、幂等语义），API 文档直接查阅 [../server/README.md](../server/README.md)。

## 双端对比验证

```bash
# 同时启动 Node 版（:3000）与 Java 版（:8080），逐接口 diff，期望完全一致：
diff <(curl -s localhost:3000/api/models) <(curl -s localhost:8080/api/models)
```

## 与 Node 版的已知行为差异

| 差异点 | Node 版 | Java 版 | 影响 |
|---|---|---|---|
| 尾斜杠 `/api/models/` | 匹配（Express 默认非严格） | 404 接口不存在（Spring 6 不再匹配尾斜杠） | 正常前端调用不受影响 |
| 空请求体 POST | `req.body` 为 undefined → 400"userId 与 modelId 不能为空" | body 为 null → 400"userId 与 modelId 不能为空"（语义一致） | 无 |
| 依赖安装位置 | 项目内 node_modules | 全局仓库 ~/.m2（各项目共享缓存） | 磁盘占用更低 |

## 关键学习点注释索引

代码内注释按"对应 Node 版某文件"组织，重点推荐按此顺序阅读：

1. [pom.xml](pom.xml) → 对照 `package.json`：坐标、parent、starter、插件
2. [application.yml](src/main/resources/application.yml) → 对照代码里的 `process.env.PORT`：集中式配置
3. [Application.java](src/main/java/com/aimodel/compare/Application.java) → 对照 `app.js`：IoC/组件扫描 vs 手动组装
4. [GlobalExceptionHandler.java](src/main/java/com/aimodel/compare/common/GlobalExceptionHandler.java) → 对照错误中间件：AOP 异常分发
5. [ModelMapper.java](src/main/java/com/aimodel/compare/mapper/ModelMapper.java) → 对照 `model.dao.js`：接口+注解 SQL vs 对象+prepare
6. [JsonMapTypeHandler.java](src/main/java/com/aimodel/compare/typehandler/JsonMapTypeHandler.java) → 对照 `JSON.parse`：框架扩展点思维
7. [ModelData.java](src/main/java/com/aimodel/compare/seed/ModelData.java) → 对照 `models.data.js`：静态类型如何表达动态 JSON
8. [SeedRunner.java](src/main/java/com/aimodel/compare/seed/SeedRunner.java) → 对照 `npm run seed`：Profile 条件装配

> 配置层面的完整差异分析（配置哲学、真实行为差异、工具链）见 [docs/Node与Java配置差异对比.md](docs/Node与Java配置差异对比.md)。
