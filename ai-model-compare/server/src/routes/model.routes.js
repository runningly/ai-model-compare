import { Router } from 'express'
import { modelService } from '../services/model.service.js'

export const modelRouter = Router()

/** GET /api/models?keyword=glm&vendor=DeepSeek —— 模型列表 */
modelRouter.get('/', (req, res) => {
  const { keyword, vendor } = req.query
  const data = modelService.list({ keyword, vendor })
  res.json({ code: 0, message: 'ok', data })
})

/** GET /api/models/:id —— 模型详情 */
modelRouter.get('/:id', (req, res) => {
  const model = modelService.getById(req.params.id)
  if (!model) {
    return res.status(404).json({ code: 404, message: '模型不存在', data: null })
  }
  res.json({ code: 0, message: 'ok', data: model })
})
