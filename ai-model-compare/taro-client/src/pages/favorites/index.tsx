import { useCallback, useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { getModels } from '../../api/models'
import { useFavoritesStore } from '../../stores/favorites'
import type { AIModel } from '../../types/model'
import './index.css'

export default function FavoritesIndex() {
  const ids = useFavoritesStore((s) => s.ids)
  const hydrate = useFavoritesStore((s) => s.hydrate)
  const toggle = useFavoritesStore((s) => s.toggle)

  // 每次进入页面：先同步一次云端收藏，再拉模型列表做过滤
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      await hydrate()
      setModels(await getModels())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [hydrate])

  useDidShow(() => {
    refresh()
  })

  const list = useMemo(() => models.filter((m) => ids.includes(m.id)), [models, ids])

  function fmtPrice(v: number | null | undefined): string {
    return v == null ? '免费' : `¥${v}`
  }

  function remove(id: string) {
    toggle(id)
    Taro.showToast({ title: '已移除收藏', icon: 'none' })
  }

  function goDetail(id: string) {
    Taro.navigateTo({ url: `/pages/models/detail?id=${id}` })
  }

  if (loading) {
    return (
      <View className='page'>
        <View className='empty'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  if (loadError) {
    return (
      <View className='page'>
        <View className='empty' onClick={refresh}>
          <Text>加载失败，请确认后端服务已启动</Text>
          <Text className='empty-sub'>点击重试</Text>
        </View>
      </View>
    )
  }

  if (list.length === 0) {
    return (
      <View className='page'>
        <View className='empty'>
          <Text>还没有收藏的模型</Text>
          <Text className='empty-sub'>在模型详情页点击「收藏」即可添加</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='page'>
      <View className='model-list'>
        {list.map((m) => (
          <View key={m.id} className='card'>
            <View className='card-head' onClick={() => goDetail(m.id)}>
              <Text className='model-name'>{m.modelName}</Text>
              <Text className='vendor-tag'>{m.vendor}</Text>
            </View>
            <View className='price-row'>
              <Text className='price-item'>输入 {fmtPrice(m.priceList.input)}</Text>
              <Text className='price-item'>输出 {fmtPrice(m.priceList.output)}</Text>
            </View>
            <View className='btn-row'>
              <Button className='btn-mini' onClick={() => goDetail(m.id)}>
                查看详情
              </Button>
              <Button className='btn-mini btn-mini--danger' onClick={() => remove(m.id)}>
                移除
              </Button>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
