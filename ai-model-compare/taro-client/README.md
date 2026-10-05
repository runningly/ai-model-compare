# AI 模型比价 · Taro 版（taro-client）

基于 **Taro 4.3 + React 18 + TypeScript + Zustand** 的跨端实现，与同级目录的 `client`（uni-app Vue3 版）功能完全对齐，共用同一套 Express 后端（`../server`），用于跨端框架对比学习。

## 技术栈与 uni-app 版对照

| 维度 | client（uni-app） | taro-client（Taro） |
| --- | --- | --- |
| UI 框架 | Vue 3 | React 18 |
| 构建 | Vite 5 | Webpack 5 |
| 状态管理 | Pinia | Zustand |
| 请求封装 | `uni.request` | `Taro.request` |
| 页面生命周期 | `onLoad` / `onShow` | `useLoad` / `useDidShow` |
| 跨端条件编译 | `#ifdef H5` / `#ifdef MP-WEIXIN` | `process.env.TARO_ENV` 分支 |
| 样式 | rpx | rpx（`designWidth: 750`，样式从 uni-app 版原样复用） |

## 目录结构

```
taro-client/
├── config/                  # Taro 构建配置（dev / prod）
├── src/
│   ├── api/                 # 接口模块：models / favorites
│   ├── config/env.ts        # BASE_URL（dev: http://localhost:3000）
│   ├── pages/
│   │   ├── models/          # 列表页 + 详情页（detail）
│   │   └── favorites/       # 收藏页
│   │   ├── stores/favorites.ts  # Zustand 收藏 store（乐观更新 + 云端同步）
│   │   ├── types/model.ts       # AIModel 等类型定义
│   │   ├── utils/request.ts     # Taro.request Promise 封装
│   │   ├── utils/pricing.ts     # 价格工具：费用计算 / 格式化（价格测算、对比表共用）
│   ├── app.ts               # 应用入口（启动时 hydrate 收藏）
│   └── app.config.ts        # 页面路由 + tabBar
└── package.json
```

## 快速开始

```bash
# 1. 先启动后端（见 ../server，端口 3000）
cd ../server && npm run dev

# 2. 安装依赖并启动 H5 开发服务（端口 10086）
npm install
npm run dev:h5

# 3. 微信小程序
npm run dev:weapp    # watch 模式，产物在 dist/
npm run build:weapp   # 生产构建
```

> 微信开发者工具导入 `dist/` 目录后即可请求 `localhost`（`project.config.json` 已配置 `urlCheck: false` 关闭域名校验）。

## 页面与功能

- **模型列表**（tabBar 首页）：真实接口加载 + 骨架屏、失败重试；关键字搜索（模型名/厂商，不区分大小写）、厂商 chips（由接口数据动态生成）、价格单位「元 / 百万 tokens」
- **模型详情**（非 tab 页，`?id=xxx`）：定价表（输入/输出/缓存命中/高峰/空闲时段）、**价格测算器**（输入/输出 token 用量实时估算费用，含高峰/空闲时段合计、免费模型提示、空输入占位）、模型参数、功能特性；收藏乐观更新 + toast；「去官网购买」H5 直接 `window.open`，小程序复制链接到剪贴板
- **我的收藏**（tabBar）：每次 `useDidShow` 先同步云端再拉列表过滤；**收藏 ≥2 个模型时顶部展示价格对比表**（模型/输入/输出/缓存/上下文横向对比，缓存缺失显示 `-`）；空态引导、失败重试、查看详情/移除

## 后端接口约定

统一响应 `{ code, message, data }`，`code === 0` 为成功；CORS 全局放开。

| 接口 | 说明 |
| --- | --- |
| `GET /api/models` | 全部模型列表（过滤在客户端做） |
| `GET /api/models/:id` | 模型详情（404 模型不存在） |
| `GET /api/favorites?userId=` | 收藏的模型 id 数组 |
| `POST /api/favorites` | 添加收藏 `{ userId, modelId }` |
| `DELETE /api/favorites/:modelId?userId=` | 取消收藏（幂等） |

## 收藏同步机制

演示阶段无登录体系，用本地生成的 `device_id`（storage 持久化）标识用户：

- **hydrate**：App 启动 / 进入收藏页时从服务端拉取收藏列表；失败静默回退本地缓存（storage key：`favorite_model_ids`），下次可重试（单例 Promise 防并发）
- **toggle**：先乐观更新本地并持久化，再异步调 add/remove 接口；失败提示由 request 层统一弹出，本地与服务端差异在下次 hydrate 时对齐

## 开发备注

- 生产 `BASE_URL` 为空（TODO：部署后端后替换为真实域名）
- tsc 校验：`npx tsc --noEmit`（`skipLibCheck` 已开启）
- 价格为演示快照数据，以各厂商官网为准
