import express from 'express'
import cors from 'cors'
import { modelRouter } from './routes/model.routes.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/models', modelRouter)

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

// 统一错误处理
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server error]', err)
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
})

app.listen(PORT, () => {
  console.log(`✅ 模型比价 API 已启动: http://localhost:${PORT}`)
})
