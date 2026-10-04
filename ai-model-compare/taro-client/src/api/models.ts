import { request } from '../utils/request'
import type { AIModel } from '../types/model'

/** 拉取全部模型列表（搜索/厂商过滤在客户端做） */
export function getModels(): Promise<AIModel[]> {
  return request<AIModel[]>({ url: '/api/models' })
}

/** 按 id 获取模型详情 */
export function getModelById(id: string): Promise<AIModel> {
  return request<AIModel>({ url: `/api/models/${encodeURIComponent(id)}` })
}
