/** 价格单位统一为：元 / 百万 tokens */

export interface TimePrice {
  input: number
  output: number
}

export interface ModelPricing {
  /** 输入价格（未命中缓存），免费模型为 null */
  input: number | null
  /** 输出价格，免费模型为 null */
  output: number | null
  /** 缓存命中时的输入价格（部分厂商提供） */
  cacheHit?: number | null
  /** 高峰时段价格（部分厂商提供） */
  peak?: TimePrice | null
  /** 空闲时段价格（部分厂商提供） */
  offPeak?: TimePrice | null
}

export type Vendor = 'DeepSeek' | '智谱GLM' | '通义千问' | '豆包' | 'Kimi'

export interface AIModel {
  id: string
  modelName: string
  vendor: Vendor
  /** 上下文窗口，单位 K tokens */
  contextLength: number
  /** 最大输出，单位 K tokens */
  maxOutput: number
  priceList: ModelPricing
  features: string[]
  purchaseUrl: string
  /** 是否限免 / 免费 */
  free?: boolean
  remark?: string
}
