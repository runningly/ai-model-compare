# AI 模型比价 · 前端（client）

AI 模型购买对比工具的前端应用，基于 **uni-app（Vue 3 + Vite + TypeScript + Pinia）**，
编译目标为 **微信小程序** 与 **H5**，对接同仓库的 Express 后端服务（`../server`）。

## 技术栈

| 组件 | 选型 | 说明 |
|---|---|---|
| 框架 | uni-app 3（Vue 3） | 一套代码多端编译（微信小程序 / H5 等） |
| 构建 | Vite 5 + @dcloudio/vite-plugin-uni | 依赖 Node 18+ |
| 语言 | TypeScript 4.9 | `npm run type-check` 做类型检查 |
| 状态管理 | Pinia 3 | 收藏状态：本地乐观更新 + 服务端同步 |
| 网络请求 | uni.request 封装 | 统一 baseURL、10s 超时、loading / silent 模式、统一 toast |

## 目录结构

```
client/
├── src/
│   ├── pages/
│   │   ├── models/
│   │   │   ├── index.vue        # 模型列表页（tab 1：列表 + 搜索 + 厂商筛选 + 收藏）
│   │   │   └── detail.vue       # 模型详情页（定价、特性、官网跳转、收藏）
│   │   └── favorites/
│   │       └── index.vue        # 我的收藏页（tab 2：收藏列表 + 取消收藏）
│   ├── api/
│   │   ├── models.ts            # 模型接口：列表 / 详情
│   │   └── favorites.ts         # 收藏接口：查询 / 添加 / 取消
│   ├── utils/
│   │   └── request.ts           # uni.request 的 Promise 封装
│   ├── config/
│   │   └── env.ts               # 接口基础地址（开发/生产）
│   ├── stores/
│   │   └── favorites.ts         # Pinia 收藏 store（设备 ID + 云端同步）
│   ├── types/
│   │   └── model.ts             # 模型 / 价格类型定义
│   ├── static/                  # 静态资源
│   ├── App.vue                  # 应用入口组件
│   ├── main.ts                  # 入口：挂载 Pinia 等
│   ├── pages.json               # 页面路由 + tabBar 配置
│   ├── manifest.json            # uni-app 应用配置（各端 appid 等）
│   └── uni.scss                 # 全局样式变量
├── index.html
├── vite.config.ts               # 仅注册 uni() 插件
└── package.json
```

## 快速开始

```bash
cd client
npm install

npm run dev:h5            # 浏览器 H5 开发（默认 http://localhost:5173）
npm run dev:mp-weixin     # 微信小程序开发（需用微信开发者工具打开 dist/dev/mp-weixin）
```

**联调注意事项**：
- 开发环境接口直连 `http://localhost:3000`（见 [src/config/env.ts](src/config/env.ts)），需先启动后端：`cd ../server && npm run seed && npm run dev`
- 微信开发者工具需勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
- H5 端由后端 CORS 中间件放行跨域

## 页面与路由

路由与 tabBar 在 [src/pages.json](src/pages.json) 中声明：

| 路径 | 页面 | 说明 |
|---|---|---|
| `pages/models/index` | 模型列表（tab 1） | 搜索、厂商筛选、行内收藏 |
| `pages/favorites/index` | 我的收藏（tab 2） | 收藏的模型列表、取消收藏 |
| `pages/models/detail` | 模型详情 | 定价 / 特性 / 官网购买跳转 |

## 网络请求层

[src/utils/request.ts](src/utils/request.ts) 对 `uni.request` 做了统一封装：

- **统一响应结构**：约定后端返回 `{ code, message, data }`，仅当 HTTP 200 且 `code === 0` 时 resolve 出 `data`
- **10s 超时**：防止请求长时间挂起
- **loading 模式**：`ReqOptions.loading` 传入文案则显示全局 loading（mask 遮罩）
- **silent 模式**：`silent: true` 时失败不弹 toast，由调用方自行兜底（如收藏页启动同步失败回退本地缓存）
- **统一错误提示**：非 0 code / 网络异常统一 `uni.showToast` 提示，无需每个页面重复处理

接口定义集中在 [src/api](src/api)：

```ts
getModels()                          // GET  /api/models
getModelById(id)                     // GET  /api/models/:id
getFavoriteIds(userId)               // GET  /api/favorites?userId=xxx（silent）
addFavorite(userId, modelId)         // POST /api/favorites
removeFavorite(userId, modelId)      // DELETE /api/favorites/:modelId?userId=xxx
```

## 收藏状态管理

[src/stores/favorites.ts](src/stores/favorites.ts) 是 M5 接口联调的核心，设计要点：

- **设备 ID 即用户**：演示阶段无登录体系，首次启动生成本地 `device_id` 并持久化，作为 `userId` 传给后端
- **本地乐观更新**：收藏/取消先改本地 `ids` 并写入本地缓存，再异步请求后端，交互无等待
- **hydrate 云端同步**：进入收藏页时拉取服务端收藏列表对齐本地；失败沿用本地缓存，下次可重试
- **竞态守卫**：`toggleSeq` 计数器避免「同步返回的旧快照覆盖用户刚做的 toggle」，冲突时留待下次同步对齐
- 失败回滚由服务端在下次 hydrate 时自然对齐，本地不强行回滚

## 接口地址配置

[src/config/env.ts](src/config/env.ts)：

```ts
export const BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : ''
```

- 开发环境直连本地 Express 服务
- 生产环境默认空串（同源部署），后端上线后替换为真实域名

## 类型定义

[src/types/model.ts](src/types/model.ts) 与后端 `models` 表字段一一对应：

```ts
interface AIModel {
  id: string
  modelName: string
  vendor: Vendor            // 'DeepSeek' | '智谱GLM' | '通义千问' | '豆包' | 'Kimi'
  contextLength: number     // 上下文，K tokens
  maxOutput: number         // 最大输出，K tokens
  priceList: ModelPricing   // 输入/输出价、缓存价、峰谷价（部分厂商缺失）
  features: string[]
  purchaseUrl: string
  free?: boolean
  remark?: string
}
```

> 价格单位统一为 **元 / 百万 tokens**；`priceList` 因厂商字段不统一，展示时需按字段是否存在做兼容。

## npm scripts

| 命令 | 作用 |
|---|---|
| `npm run dev:h5` | H5 开发 |
| `npm run dev:mp-weixin` | 微信小程序开发 |
| `npm run build:h5` | H5 构建 |
| `npm run build:mp-weixin` | 微信小程序构建 |
| `npm run type-check` | vue-tsc 类型检查 |
| `npm run dev:mp-xxx` / `build:mp-xxx` | 其他平台（支付宝/百度/抖音等），见 package.json |
