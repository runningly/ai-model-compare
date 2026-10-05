import { useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Button, Input } from '@tarojs/components'
import { getModelById } from '../../api/models'
import type { AIModel } from '../../types/model'
import { useFavoritesStore } from '../../stores/favorites'
import { calcCost, formatCost } from '../../utils/pricing'
import './detail.css'

export default function ModelDetail() {
  const [model, setModel] = useState<AIModel | null>(null)
  const [loading, setLoading] = useState(true)

  const ids = useFavoritesStore((s) => s.ids)
  const toggle = useFavoritesStore((s) => s.toggle)
  const isFav = model ? ids.includes(model.id) : false

  // 价格测算：输入的 token 用量（Input 值恒为 string，计算时再转数字）
  const [inputTokens, setInputTokens] = useState('')
  const [outputTokens, setOutputTokens] = useState('')

  const isFree = !!model && model.priceList.input == null && model.priceList.output == null

  // 两个输入框都为空时展示占位提示，不显示估算结果
  const hasInput = inputTokens !== '' || outputTokens !== ''

  const cost = useMemo(() => {
    const p = model?.priceList
    const i = Number(inputTokens) || 0
    const o = Number(outputTokens) || 0
    const baseInput = calcCost(i, p?.input)
    const baseOutput = calcCost(o, p?.output)
    const total = baseInput != null && baseOutput != null ? baseInput + baseOutput : null
    const peak = p?.peak ? (calcCost(i, p.peak.input) ?? 0) + (calcCost(o, p.peak.output) ?? 0) : null
    const offPeak = p?.offPeak ? (calcCost(i, p.offPeak.input) ?? 0) + (calcCost(o, p.offPeak.output) ?? 0) : null
    return {
      input: formatCost(baseInput),
      output: formatCost(baseOutput),
      total: formatCost(total),
      peak: formatCost(peak),
      offPeak: formatCost(offPeak),
    }
  }, [model, inputTokens, outputTokens])

  const router = Taro.useRouter()

  useLoad(async () => {
    const { id = '' } = router.params
    try {
      // 无 id 时直接判空，避免请求 /api/models/ 误命中列表接口返回数组
      setModel(id ? await getModelById(id) : null)
    } catch {
      setModel(null)
    } finally {
      setLoading(false)
    }
  })

  function fmtPrice(v: number | null | undefined): string {
    return v == null ? '免费' : `¥${v}`
  }

  function toggleFav() {
    if (!model) return
    const willFav = !isFav
    toggle(model.id)
    Taro.showToast({ title: willFav ? '已收藏' : '已取消收藏', icon: 'none' })
  }

  function goBuy() {
    const url = model?.purchaseUrl
    if (!url) return
    if (process.env.TARO_ENV === 'h5') {
      window.open(url, '_blank')
    } else if (process.env.TARO_ENV === 'weapp') {
      // 小程序内无法直接跳转外部网页，复制链接引导用户到浏览器打开
      Taro.setClipboardData({
        data: url,
        success: () => {
          Taro.showToast({ title: '购买链接已复制', icon: 'none' })
        },
      })
    }
  }

  if (loading) {
    return (
      <View className='page empty-page'>
        <Text>加载中...</Text>
      </View>
    )
  }

  if (!model) {
    return (
      <View className='page empty-page'>
        <Text>未找到该模型</Text>
      </View>
    )
  }

  return (
    <View className='page'>
      {/* 模型头部 */}
      <View className='card'>
        <View className='head-row'>
          <Text className='model-name'>{model.modelName}</Text>
          <Text className='vendor-tag'>{model.vendor}</Text>
        </View>
        {model.remark ? <Text className='remark'>{model.remark}</Text> : null}
      </View>

      {/* 定价 */}
      <View className='card'>
        <Text className='card-title'>定价（元 / 百万 tokens）</Text>
        <View className='price-table'>
          <View className='price-tr'>
            <Text className='price-td-label'>输入</Text>
            <Text className='price-td-value'>{fmtPrice(model.priceList.input)}</Text>
          </View>
          <View className='price-tr'>
            <Text className='price-td-label'>输出</Text>
            <Text className='price-td-value'>{fmtPrice(model.priceList.output)}</Text>
          </View>
          {model.priceList.cacheHit != null ? (
            <View className='price-tr'>
              <Text className='price-td-label'>缓存命中</Text>
              <Text className='price-td-value'>{fmtPrice(model.priceList.cacheHit)}</Text>
            </View>
          ) : null}
          {model.priceList.peak ? (
            <View className='price-tr'>
              <Text className='price-td-label'>高峰时段（输入 / 输出）</Text>
              <Text className='price-td-value'>
                {fmtPrice(model.priceList.peak.input)} / {fmtPrice(model.priceList.peak.output)}
              </Text>
            </View>
          ) : null}
          {model.priceList.offPeak ? (
            <View className='price-tr'>
              <Text className='price-td-label'>空闲时段（输入 / 输出）</Text>
              <Text className='price-td-value'>
                {fmtPrice(model.priceList.offPeak.input)} / {fmtPrice(model.priceList.offPeak.output)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 价格测算 */}
      <View className='card'>
        <Text className='card-title'>价格测算</Text>
        {isFree ? (
          <Text className='pcalc-free'>该模型免费，无需测算费用</Text>
        ) : (
          <>
            <View className='pcalc-input-row'>
              <Text className='pcalc-label'>输入 tokens</Text>
              <Input
                className='pcalc-input'
                type='digit'
                placeholder='如 100000'
                value={inputTokens}
                onInput={(e) => {
                  const v = e.detail.value
                  if (/^\d*\.?\d*$/.test(v)) setInputTokens(v)
                }}
              />
            </View>
            <View className='pcalc-input-row'>
              <Text className='pcalc-label'>输出 tokens</Text>
              <Input
                className='pcalc-input'
                type='digit'
                placeholder='如 20000'
                value={outputTokens}
                onInput={(e) => {
                  const v = e.detail.value
                  if (/^\d*\.?\d*$/.test(v)) setOutputTokens(v)
                }}
              />
            </View>
            {hasInput ? (
              <View className='pcalc-result'>
                <View className='price-tr'>
                  <Text className='price-td-label'>输入费用</Text>
                  <Text className='price-td-value'>{cost.input}</Text>
                </View>
                <View className='price-tr'>
                  <Text className='price-td-label'>输出费用</Text>
                  <Text className='price-td-value'>{cost.output}</Text>
                </View>
                <View className='price-tr'>
                  <Text className='price-td-label'>合计</Text>
                  <Text className='price-td-value'>{cost.total}</Text>
                </View>
                {model.priceList.peak ? (
                  <View className='price-tr'>
                    <Text className='price-td-label'>高峰时段合计</Text>
                    <Text className='price-td-value'>{cost.peak}</Text>
                  </View>
                ) : null}
                {model.priceList.offPeak ? (
                  <View className='price-tr'>
                    <Text className='price-td-label'>空闲时段合计</Text>
                    <Text className='price-td-value'>{cost.offPeak}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text className='pcalc-free'>输入 token 用量后自动估算费用</Text>
            )}
          </>
        )}
      </View>

      {/* 模型参数 */}
      <View className='card'>
        <Text className='card-title'>模型参数</Text>
        <View className='param-row'>
          <Text className='param-label'>上下文窗口</Text>
          <Text className='param-value'>{model.contextLength}K tokens</Text>
        </View>
        <View className='param-row'>
          <Text className='param-label'>最大输出</Text>
          <Text className='param-value'>{model.maxOutput}K tokens</Text>
        </View>
      </View>

      {/* 功能特性 */}
      <View className='card'>
        <Text className='card-title'>功能特性</Text>
        <View className='feature-row'>
          {model.features.map((f) => (
            <Text key={f} className='feature-tag'>
              {f}
            </Text>
          ))}
        </View>
      </View>

      {/* 操作按钮 */}
      <View className='btn-row'>
        <Button className='btn btn-ghost' onClick={toggleFav}>
          {isFav ? '取消收藏' : '收藏'}
        </Button>
        <Button className='btn btn-primary' onClick={goBuy}>
          去官网购买
        </Button>
      </View>
    </View>
  )
}
