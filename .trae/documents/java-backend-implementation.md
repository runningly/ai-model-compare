# Java 版「AI 模型比价」后端实施计划

## Context

用户（前端开发者，正在对比学习后端技术）要求把现有的 Node.js 后端（`ai-model-compare/server`，Express + better-sqlite3 + SQLite）用 **Java 主流框架**重写一遍，**功能与行为完全一致**，便于逐文件对比学习。

已确认选型：**Spring Boot 3.3.5 + MyBatis（注解 SQL）+ Maven + SQLite**，JDK 21，项目位于 `ai-model-compare/server-java`（与 `server` 平级），端口 **8080**（与 Node 版 3000 同时运行互不干扰）。

已验证：本机为 **Intel x86_64**（i7-1068NG7，无 arm64），JDK 必须下载 mac/**x64** 版；本机无 Java/Maven/Homebrew，需下载免安装压缩包。

## 行为契约（必须与 Node 版逐条一致）

- 统一响应 `{code, message, data}`，字段顺序 code→message→data；成功 `code:0, message:"ok"`
- 业务错误文案逐字一致：`缺少 userId 参数`、`userId 与 modelId 不能为空`、`模型不存在`、`接口不存在`、`服务器内部错误`（5xx 隐藏内部信息）
- SQL 逐字照抄（`INSERT OR IGNORE`、`INSERT OR REPLACE`、`datetime('now','localtime')`、`ORDER BY vendor, id`、`ORDER BY created_at DESC, model_id`）
- 模型列表过滤在 **Service 内存**中做（vendor 精确匹配 + keyword 小写包含匹配 modelName+vendor），不改成 SQL WHERE
- 未匹配路径 → HTTP 404 + `{"code":404,"message":"接口不存在","data":null}`
- seed：清空后事务性批量写入，幂等，`--spring.profiles.active=seed` 触发后退出

## 目录结构（镜像 Node 分层）

```
server-java/
├── pom.xml
├── README.md                          # 含 Node vs Java 分层对照表（对比学习核心）
└── src/main/
    ├── java/com/aimodel/compare/
    │   ├── Application.java          # 启动类：先建 data 目录再 run；@MapperScan
    │   ├── config/
    │   │   ├── CorsConfig.java       # 全开放 CORS（对应 app.use(cors())）
    │   │   └── SchemaInitializer.java # @PostConstruct 建表（DDL 从 db.js 复制）
    │   ├── common/
    │   │   ├── ApiResponse.java      # @JsonPropertyOrder({code,message,data})
    │   │   ├── BusinessException.java # 带 status 的业务异常（对应 fail()）
    │   │   └── GlobalExceptionHandler.java # 业务错误透传 / NoResourceFoundException→接口不存在 / 兜底500
    │   ├── controller/               # 对应 routes/
    │   │   ├── ModelController.java   # GET /api/models、GET /api/models/{id}
    │   │   └── FavoriteController.java # GET/POST /api/favorites、DELETE /api/favorites/{modelId}
    │   ├── service/                  # 对应 services/
    │   │   ├── ModelService.java     # 内存 stream filter（逻辑逐行翻译）
    │   │   └── FavoriteService.java  # 校验 + BusinessException
    │   ├── mapper/                   # 对应 dao/，注解 SQL
    │   │   ├── ModelMapper.java      # @Results resultMap 复用（对应 rowToModel）
    │   │   └── FavoriteMapper.java   # 3 条 SQL，多参数必须 @Param
    │   ├── entity/Model.java         # camelCase 字段；priceList 用 Map<String,Object>；@JsonPropertyOrder
    │   ├── typehandler/
    │   │   ├── JsonMapTypeHandler.java         # price_list JSON ↔ Map
    │   │   ├── JsonStringListTypeHandler.java # features JSON ↔ List<String>
    │   │   └── IntegerBooleanTypeHandler.java  # free 0/1 ↔ Boolean
    │   └── seed/
    │       ├── ModelData.java        # 10 条演示数据（glm-4.5-flash 的 null 价格用 LinkedHashMap）
    │       ├── SeedService.java      # @Transactional：clear + 批量 insert
    │       └── SeedRunner.java       # @Profile("seed") CommandLineRunner，跑完退出
    └── resources/application.yml
```

## 关键技术决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| MyBatis 映射 | 注解 SQL（非 XML） | SQL 打开即见，与 Node dao 常量对照；本项目无动态 SQL 需求 |
| pom 依赖 | spring-boot-starter-web + mybatis-spring-boot-starter 3.0.3 + sqlite-jdbc 3.46.1.3 | 3.0.x 才兼容 Boot 3（jakarta）；不引入 JPA（Hibernate 无 SQLite 方言）；不用 Lombok（学习期手写 getter/setter） |
| priceList 类型 | Map<String,Object> | 厂商结构不统一，Map = JS 对象心智 |
| POST body | `@RequestBody(required=false) Map<String,String>` | 对应 `req.body \|\| {}`，空 body 也走 400 文案 |
| 数据源 | `jdbc:sqlite:data/models.db` 相对路径 + `hikari.maximum-pool-size: 1` | SQLite 单写者，模拟 better-sqlite3 单连接，防 SQLITE_BUSY |
| ApiResponse | 泛型 + @JsonPropertyOrder | 锁定 JSON 字段顺序，保证与 Node 版 diff 一致 |
| 404 兜底 | 处理 NoResourceFoundException（Boot 3.2+） | 否则返回 Spring 默认错误体，违反契约 |
| 建目录时机 | main() 中 SpringApplication.run 之前 | Hikari 首次连接早于普通 bean 初始化 |

## 已识别坑点

1. JDK 下载用 mac/**x64**（本机 Intel）；解压后 JAVA_HOME 指向 `jdk-21.x/Contents/Home`（macOS bundle 结构）
2. glm-4.5-flash 的 `priceList:{input:null,output:null}` 不能用 `Map.of`（禁 null），用 LinkedHashMap
3. 多参数 Mapper 方法漏 @Param 会绑定失败
4. @Transactional 自调用失效：SeedRunner 必须注入独立 SeedService 调用
5. Jackson 勿配 NON_NULL（null 价格必须输出 `"input":null`）
6. 尾斜杠行为差异：Spring 6 不匹配 `/api/models/`（Node 匹配），README 标注即可
7. 首次构建下载依赖慢：配 `~/.m2/settings.xml` 阿里云镜像

## 实施步骤

1. **环境搭建**：下载 Temurin JDK 21 (mac/x64) + Maven 3.9.x 免安装包到 `Project/tools/`，解压，本会话内用绝对路径直接调用验证（java -version / mvn -v），并配好 `~/.m2/settings.xml` 阿里云镜像
2. **项目骨架**：pom.xml + Application.java + application.yml，`mvn compile` 通过
3. **公共层**：ApiResponse、BusinessException、GlobalExceptionHandler、CorsConfig
4. **数据层**：SchemaInitializer（DDL 照抄 db.js）、Model 实体、3 个 TypeHandler、2 个 Mapper
5. **业务层 + 接口层**：2 个 Service + 2 个 Controller（错误文案照抄 Node 版）
6. **seed**：ModelData（10 条数据照抄 models.data.js）、SeedService、SeedRunner
7. **运行验证**：见下
8. **README.md**：技术栈、启动方式、Node vs Java 分层对照表、概念映射（中间件↔AOP/Advice、req.body↔@RequestBody、JSON.parse↔TypeHandler 等）

## 验证方案

Node 版（3000）与 Java 版（8080）同时运行，逐接口 diff，期望逐字节一致：

```bash
# 先灌数据：cd server-java && mvn spring-boot:run -Dspring-boot.run.profiles=seed
# 再启动：mvn spring-boot:run

diff <(curl -s localhost:3000/api/models) <(curl -s localhost:8080/api/models)        # 全量+排序+字段映射
diff <(curl -s "localhost:3000/api/models?keyword=GLM") <(curl -s "localhost:8080/api/models?keyword=GLM")  # 大小写不敏感
diff <(curl -s localhost:3000/api/models/not-exist) <(curl -s localhost:8080/api/models/not-exist)  # 404 模型不存在
diff <(curl -s localhost:3000/api/not-exist) <(curl -s localhost:8080/api/not-exist)  # 404 接口不存在(JSON)
# 收藏全流程：400 缺 userId → 404 模型不存在 → 400 参数为空 → 添加成功 → 重复添加幂等 → 列表 → 删除幂等
# 状态码抽查、字段顺序抽查（['code','message','data']）、CORS 预检
```
