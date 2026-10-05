/**
 * 模型相关路由（路由层）
 * -------------------------------------------------
 * 职责：定义 HTTP 接口、解析请求参数、调用 service、统一 JSON 响应格式。
 *
 * 统一响应格式约定：{ code, message, data }
 *   - code:    0 表示成功；非 0 为错误码（与 HTTP 状态码保持一致）
 *   - message: 提示信息
 *   - data:    业务数据（无数据时为 null）
 */
import { Router } from 'express'
import { modelService } from '../services/model.service.js'

export const modelRouter = Router()

/**
 * GET /api/models —— 模型列表（支持筛选）
 * 查询参数均为可选：
 *   - keyword: 关键字，模糊匹配模型名 / 厂商
 *   - vendor:  厂商名，精确匹配
 * 示例：GET /api/models?keyword=glm&vendor=智谱GLM
 */
modelRouter.get('/', (req, res) => {
  const { keyword, vendor } = req.query // req.query 是 Express 解析好的查询参数对象
  const data = modelService.list({ keyword, vendor })
  res.json({ code: 0, message: 'ok', data })
})

/**
 * GET /api/models/:id —— 模型详情
 * 路径参数 :id 即模型 id（如 /api/models/deepseek-chat）
 * 模型不存在时返回 404，其余情况返回模型详情
 */
modelRouter.get('/:id', (req, res) => {
  const model = modelService.getById(req.params.id)
  if (!model) {
    return res.status(404).json({ code: 404, message: '模型不存在', data: null })
  }
  res.json({ code: 0, message: 'ok', data: model })
})
