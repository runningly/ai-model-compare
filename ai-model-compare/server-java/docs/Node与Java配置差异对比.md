# Node 版 vs Java 版 配置差异对比

> 本文对照 `server`（Node.js + Express）与 `server-java`（Spring Boot + MyBatis）两套后端的**配置差异**。
> 两套服务功能与接口行为完全一致，差异集中在"配置写在哪、怎么写、什么时候生效"。

---

## 1. 配置哲学总览

| | Node 版 | Java 版 |
|---|---|---|
| 哲学 | **代码即配置**：没有独立配置文件，一切写在代码里 | **约定优于配置 + 集中配置**：能省的自动装配省掉，可变的集中到 `application.yml` |
| 看配置的方式 | 通读代码（`app.use()` 注册顺序即生效顺序） | 打开 [application.yml](../src/main/resources/application.yml) 一屏看全 |
| 框架默认值 | Express 几乎零默认值，一切显式挂载 | Spring Boot 大量默认值，只覆盖需要改的 |

一图概括两者的配置流转：

```
Node 版：  代码 ──→ app.use(cors) → app.use(json) → app.use(路由) → 监听端口
                    （顺序敏感，错了就出 bug）

Java 版：  application.yml ──┐
           注解 (@Configuration/@Bean) ──┼──→ 自动装配(IoC 容器) → DispatcherServlet
           约定默认值 ────────┘
                    （顺序无关，装配交给框架）
```

---

## 2. 配置文件对照

| Node 版 | Java 版 | 说明 |
|---|---|---|
| `package.json` | `pom.xml` | 依赖声明 + 命令入口的"户口本" |
| `package-lock.json` | 无（parent BOM 仲裁版本） | 依赖版本锁定策略不同，见 §4.1 |
| `src/app.js`（端口、中间件、路由挂载） | `application.yml` + `config/` 配置类 | 运行期配置的载体 |
| `src/dao/db.js`（建目录、建表、连接） | `application.yml`（数据源）+ `Application.main`（建目录）+ `SchemaInitializer`（建表） | 单文件职责拆成三处 |

### pom.xml 关键结构（对照 package.json）

```xml
<parent>spring-boot-starter-parent 3.3.5</parent>  <!-- 版本管家：统一仲裁 300+ 依赖版本 -->
<properties><java.version>21</java.version></properties>
<dependencies>
  spring-boot-starter-web        <!-- ≈ express + 内嵌 Tomcat + Jackson，无需写版本号 -->
  mybatis-spring-boot-starter 3.0.3  <!-- parent 不管的依赖要自己写版本 -->
  sqlite-jdbc 3.46.1.3
</dependencies>
```

- **starter（起步依赖）**：Spring Boot 独有的"场景打包"概念——一个 starter 聚合一类场景全部依赖，如 `spring-boot-starter-web` = Web MVC + 内嵌 Tomcat + JSON 序列化
- **parent BOM**：类似"官方维护的版本管家"，子项目引依赖不用写版本号，且保证组合经过兼容性测试
- npm 没有对应机制：`express` 只包含 express 自身，中间件（cors、body-parser）要逐个手动安装

---

## 3. 逐项配置对照表

| 配置项 | Node 版（server/src） | Java 版（server-java） |
|---|---|---|
| **端口** | `app.js`：`process.env.PORT \|\| 3000` | yml：`server.port: 8080`；命令行 `--server.port=9090` 覆盖 |
| **JSON 请求体解析** | `app.use(express.json())` 手动注册 | 自动装配（Jackson HttpMessageConverter），**零代码零配置** |
| **CORS 跨域** | `app.use(cors())`，默认放行所有来源 | [CorsConfig.java](../src/main/java/com/aimodel/compare/config/CorsConfig.java) 实现 `WebMvcConfigurer` 显式声明 |
| **统一响应格式** | 每个路由手写 `res.json({ code, message, data })` | [ApiResponse.java](../src/main/java/com/aimodel/compare/common/ApiResponse.java) + `@JsonPropertyOrder` 锁定字段顺序 |
| **错误处理** | 4 参数错误中间件（靠参数个数识别） | `@RestControllerAdvice`（AOP 切面，按异常类型分发） |
| **数据库连接** | `db.js`：`new Database(path)`，天然单连接 | yml：`jdbc:sqlite:data/models.db` + Hikari 连接池（`maximum-pool-size: 1`，见 §5.1） |
| **建表时机** | `db.js` 被 import 时立即执行（模块副作用） | `SchemaInitializer` 的 `@PostConstruct`（Bean 初始化后） |
| **snake_case → camelCase** | `rowToModel()` 手动逐字段转换 | `map-underscore-to-camel-case: true` + `@Results` 显式 resultMap |
| **字段类型转换**（JSON/布尔） | `JSON.parse` / `!!row.free` 写在 DAO | 3 个 TypeHandler 类，由 MyBatis 自动调用 |
| **事务** | `db.transaction(fn)` 手动包裹 | `@Transactional` 注解（AOP 自动包裹） |
| **seed 触发** | `npm run seed`（独立入口脚本，跑完退出） | `--spring.profiles.active=seed`（`@Profile` 条件装配，同一入口） |
| **开发热重载** | `node --watch`（内置） | 无内置（需重启或另装 spring-boot-devtools） |
| **依赖安装位置** | 项目内 `node_modules/`（每项目一份） | 全局 `~/.m2/` 仓库（所有项目共享缓存） |

---

## 4. 仅"写法差异"的项（行为一致）

### 4.1 依赖版本锁定策略

| | Node | Java/Maven |
|---|---|---|
| 直接依赖 | `package.json` 写语义版本（`^4.21.2`） | `pom.xml` 写精确版本，parent 管的可不写 |
| 传递依赖锁定 | `package-lock.json` 逐层精确锁死 | 无 lock 文件，parent BOM 统一仲裁 |
| 还原构建 | `npm ci` 按 lock 精确还原 | 按坐标 + BOM 解析（同版本库组合固定） |

两种思路解决同一个"依赖地狱"问题：npm 靠**事后锁文件**，Maven 靠**事前版本仲裁**。

### 4.2 命令体系

| 日常操作 | Node | Java |
|---|---|---|
| 安装依赖 | `npm install` | （首次构建自动下载到 ~/.m2） |
| 开发启动 | `npm run dev` | `mvn spring-boot:run` |
| 生产启动 | `npm start` | `java -jar target/xxx.jar`（需先 `mvn package`） |
| 灌数据 | `npm run seed` | `mvn spring-boot:run -Dspring-boot.run.profiles=seed` |

- npm scripts = **任意 shell 命令的别名**，纯约定
- Maven 命令绑定**构建生命周期**（compile → test → package → install），`spring-boot:run` 是插件 goal
- 首次构建需配国内镜像（已配好 `~/.m2/settings.xml` 阿里云镜像），否则下载极慢

---

## 5. 两处"真实行为差异"（重点关注）

### 5.1 数据库连接模型：单连接 vs 连接池

```
Node 版                              Java 版
better-sqlite3                       HikariCP 连接池
┌──────────────┐                     ┌──────────────────┐
│  同步 API     │  天然单连接          │ 默认 10 个连接     │ ← SQLite 库级单写者
│  new Database │  无"池"的概念        │ 并发写 → SQLITE_  │   多连接并发写库
└──────────────┘                     │        BUSY 报错  │   直接 database is locked
                                     └──────────────────┘
                                     必须显式：hikari.maximum-pool-size: 1
                                     （人工模拟 Node 版的单连接行为）
```

**这是 Java 框架默认值与 SQLite 特性冲突的典型案例**——用 MySQL/PostgreSQL 时连接池是性能必需，但 SQLite 的单写者模型要求压成 1。

### 5.2 数据库文件路径的锚定基准

| | Node 版 | Java 版 |
|---|---|---|
| 路径写法 | `path.resolve(__dirname, '../../data')` | `jdbc:sqlite:data/models.db`（相对路径） |
| 锚定基准 | **源码目录**（`__dirname` / `import.meta.url` 推导） | **启动时的工作目录**（CWD） |
| 换目录启动 | db 文件永远在 `server/data/`，不受影响 | 从别的目录 `java -jar` → 在那个目录**新建一个空库**（数据"消失"） |
| 生产建议 | — | 用绝对路径或环境变量注入：`jdbc:sqlite:${DB_PATH}` |

### 5.3 其他已验证的行为差异清单

| 场景 | Node 版 | Java 版 |
|---|---|---|
| `GET /api/models/`（尾斜杠） | 200 正常返回（Express 默认非严格匹配） | 404"接口不存在"（Spring 6 默认不匹配尾斜杠） |
| POST 空 body / 无 Content-Type | `req.body` 为 undefined → 400"userId 与 modelId 不能为空" | body 为 null → 400 同文案（行为一致） |
| POST 非法 JSON body | 400 + body-parser 的英文错误详情 | 400 + 统一中文文案"请求体不是合法的 JSON" |

---

## 6. 工具链与环境差异

| | Node 版 | Java 版 |
|---|---|---|
| 运行时 | Node.js 18+（V8 解释执行） | JDK 21（编译为字节码，JIT 运行） |
| 本机安装位置 | 系统 Node | 免安装包：`Project/tools/jdk-21.0.12.1+1` 与 `tools/apache-maven-3.9.9` |
| 环境变量 | 无需 | `JAVA_HOME` + `PATH`（见下方持久化配置） |

**本机已配置** `~/.zshrc`（新开终端即可直接使用 `java` / `mvn`），内容如下：

```bash
export JAVA_HOME=/Users/youlee/Desktop/Project/tools/jdk-21.0.12.1+1/Contents/Home
export PATH=$JAVA_HOME/bin:/Users/youlee/Desktop/Project/tools/apache-maven-3.9.9/bin:$PATH
```

> macOS 的 JDK 压缩包解压后是 `jdk-21.0.x/Contents/Home` 的 bundle 结构（Linux 是平铺目录），
> `JAVA_HOME` 必须指向 `Contents/Home`，否则 `mvn` 报 `No JAVA_HOME` 或找不到 `javac`。

---

## 7. 快速启动对照

```bash
# Node 版（端口 3000）
cd server
npm run seed      # 灌数据（data/models.db）
npm run dev       # 热重载启动

# Java 版（端口 8080）
cd server-java
mvn spring-boot:run -Dspring-boot.run.profiles=seed   # 灌数据（data/models.db，跑完自动退出）
mvn spring-boot:run                                    # 启动

# 双端同时运行，逐接口 diff 验证一致性
diff <(curl -s localhost:3000/api/models) <(curl -s localhost:8080/api/models)
```

## 相关文档

- [server-java/README.md](../README.md) —— 分层结构与概念映射总表、启动方式
- [server/README.md](../../server/README.md) —— Node 版说明与 API 文档
- [server/docs/数据库字段说明.md](../../server/docs/数据库字段说明.md) —— 数据库结构（两版共用同一 schema）
