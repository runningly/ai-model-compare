/** 价格工具：统一单价展示与按 token 用量估算费用（价格单位：元 / 百万 tokens） */

/**
 * 展示单价（元 / 百万 tokens），免费模型返回「免费」
 */
export function formatPrice(v: number | null | undefined): string {
  return v == null ? '免费' : `¥${v}`
}

/**
 * 按 token 用量计算费用：tokens / 1e6 * 单价
 * - unit 为 null（免费）时返回 null
 * - tokens 为 0 时返回 0
 */
export function calcCost(tokens: number, unit: number | null | undefined): number | null {
  if (unit == null) return null
  if (tokens <= 0) return 0
  return (tokens / 1e6) * unit
}

/**
 * 展示金额：先四舍五入消除浮点尾差（如 0.8 * 0.0001 的尾差），再去除多余的 0
 * - 金额 >= 1 元保留 2 位小数
 * - 金额 < 1 元保留至多 4 位小数（如 ¥0.0032）
 */
export function formatCost(v: number | null | undefined): string {
  if (v == null) return '免费'
  if (v === 0) return '¥0.00'
  const rounded = Math.round(v * 1e6) / 1e6
  const fixed = Math.abs(rounded) >= 1 ? rounded.toFixed(2) : rounded.toFixed(4)
  return `¥${Number(fixed)}`
}
