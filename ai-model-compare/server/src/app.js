/**
 * 应用入口（Express 服务）
 * -------------------------------------------------
 * 职责：
 *   1. 组装中间件（跨域 CORS、JSON 请求体解析）
 *   2. 挂载业务子路由（/api/models、/api/favorites）
 *   3. 兜底 404 与统一错误处理
 *   4. 启动 HTTP 服务
 *
 * 一次请求的完整链路：
 *   请求 → CORS → JSON 解析 → 匹配业务路由 → （出错?）→ 错误中间件 → JSON 响应
 */
import express from 'express'
import cors from 'cors'
import { modelRouter } from './routes/model.routes.js'
import { favoriteRouter } from './routes/favorite.routes.js'

const app = express()
// 端口：优先读环境变量 PORT（部署时可注入），本地开发默认 3000
const PORT = process.env.PORT || 3000

// 中间件按注册顺序依次执行
app.use(cors()) // 允许跨域：H5 前端与后端端口不同（如 5173 → 3000）时必需
app.use(express.json()) // 解析请求体里的 JSON，挂载到 req.body；表单等其他格式不解析

// 挂载子路由：凡是 /api/models 开头的请求交给 modelRouter，/api/favorites 交给 favoriteRouter
app.use('/api/models', modelRouter)
app.use('/api/favorites', favoriteRouter)

// 兜底 404：前面所有路由都没匹配到时走到这里，统一返回 JSON 格式（而不是 HTML 404 页）
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

/**
 * 统一错误处理中间件（必须声明 4 个参数，Express 靠参数个数识别它是错误处理函数）
 * 路由 / 服务中抛出的异常或 next(err) 都会流转到这里：
 *   - err.status 是业务代码手动设置的（如 400/404），直接透传给前端
 *   - 没有 status 的意外异常统一按 500 处理，且 message 不对外暴露
 *     （避免把内部堆栈信息泄露给前端）
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server error]', err) // 打印到服务端日志，方便排查
  const status = err.status || 500
  const message = status >= 500 ? '服务器内部错误' : err.message
  res.status(status).json({ code: status, message, data: null })
})

// 启动 HTTP 服务并监听端口
app.listen(PORT, () => {
  console.log(`✅ 模型比价 API 已启动: http://localhost:${PORT}`)
})
