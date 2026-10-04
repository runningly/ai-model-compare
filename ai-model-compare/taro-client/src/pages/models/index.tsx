import { useCallback, useMemo, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { getModels } from '../../api/models'
import type { AIModel, Vendor } from '../../types/model'
import './index.css'

type VendorTab = Vendor | '全部'

export default function ModelsIndex() {
  const [keyword, setKeyword] = useState('')
  const [currentVendor, setCurrentVendor] = useState<VendorTab>('全部')

  // 真实接口：加载模型列表（骨架屏为真实 loading）
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // 厂商 chips 跟随接口数据动态生成（后端新增厂商自动出现）
  const vendorTabs = useMemo<VendorTab[]>(
    () => ['全部', ...Array.from(new Set(models.map((m) => m.vendor)))],
    [models]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      setModels(await getModels())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useLoad(() => {
    load()
  })

  const filteredModels = useMemo<AIModel[]>(
    () =>
      models.filter((m) => {
        const matchVendor = currentVendor === '全部' || m.vendor === currentVendor
        const kw = keyword.trim().toLowerCase()
        const matchKeyword = !kw || `${m.modelName}${m.vendor}`.toLowerCase().includes(kw)
        return matchVendor && matchKeyword
      }),
    [models, currentVendor, keyword]
  )

  function fmtPrice(v: number | null | undefined): string {
    return v == null ? '免费' : `¥${v}`
  }

  function goDetail(id: string) {
    Taro.navigateTo({ url: `/pages/models/detail?id=${id}` })
  }

  return (
    <View className='page'>
      {/* 搜索栏 */}
      <View className='search-bar'>
        <Input
          className='search-input'
          placeholder='搜索模型，如 glm、deepseek'
          placeholderStyle='color:#b0b4bf'
          value={keyword}
          onInput={(e) => setKeyword(e.detail.value)}
          confirmType='search'
        />
      </View>

      {/* 厂商筛选 */}
      <ScrollView className='vendor-row' scrollX showScrollbar={false}>
        {vendorTabs.map((v) => (
          <View
            key={v}
            className={`vendor-chip${currentVendor === v ? ' vendor-chip--active' : ''}`}
            onClick={() => setCurrentVendor(v)}
          >
            {v}
          </View>
        ))}
      </ScrollView>

      <View className='unit-note'>价格单位：元 / 百万 tokens（演示快照，以官网为准）</View>

      {/* 骨架屏：加载中 */}
      {loading ? (
        <View className='model-list'>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className='card'>
              <View className='sk sk-name' />
              <View className='sk sk-line' />
              <View className='sk sk-line sk-line--short' />
            </View>
          ))}
        </View>
      ) : loadError ? (
        /* 加载失败：点击重试 */
        <View className='empty' onClick={load}>
          <Text>加载失败，请确认后端服务已启动</Text>
          <Text className='empty-retry'>点击重试</Text>
        </View>
      ) : (
        <View className='model-list'>
          {filteredModels.map((m) => (
            <View key={m.id} className='card' hoverClass='card--hover' onClick={() => goDetail(m.id)}>
              <View className='card-head'>
                <Text className='model-name'>{m.modelName}</Text>
                <Text className='vendor-tag'>{m.vendor}</Text>
              </View>
              <View className='meta-row'>
                <Text className='meta-item'>上下文 {m.contextLength}K</Text>
                <Text className='meta-item'>最大输出 {m.maxOutput}K</Text>
                {m.free ? <Text className='meta-item meta-free'>限免</Text> : null}
              </View>
              <View className='price-row'>
                <View className='price-item'>
                  <Text className='price-label'>输入</Text>
                  <Text className='price-value'>{fmtPrice(m.priceList.input)}</Text>
                </View>
                <View className='price-item'>
                  <Text className='price-label'>输出</Text>
                  <Text className='price-value'>{fmtPrice(m.priceList.output)}</Text>
                </View>
                {m.priceList.cacheHit != null ? (
                  <View className='price-item'>
                    <Text className='price-label'>缓存命中</Text>
                    <Text className='price-value'>{fmtPrice(m.priceList.cacheHit)}</Text>
                  </View>
                ) : null}
              </View>
              <View className='feature-row'>
                {m.features.slice(0, 3).map((f) => (
                  <Text key={f} className='feature-tag'>
                    {f}
                  </Text>
                ))}
              </View>
            </View>
          ))}

          {filteredModels.length === 0 ? (
            <View className='empty'>
              <Text>没有找到匹配的模型</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  )
}
