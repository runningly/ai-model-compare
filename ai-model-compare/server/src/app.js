import express from 'express'
import cors from 'cors'
import { modelRouter } from './routes/model.routes.js'
import { favoriteRouter } from './routes/favorite.routes.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/models', modelRouter)
app.use('/api/favorites', favoriteRouter)

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

// 统一错误处理（业务错误可携带 err.status，如 400/404）
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server error]', err)
  const status = err.status || 500
  const message = status >= 500 ? '服务器内部错误' : err.message
  res.status(status).json({ code: status, message, data: null })
})

app.listen(PORT, () => {
  console.log(`✅ 模型比价 API 已启动: http://localhost:${PORT}`)
})
