<template>
  <view v-if="loading" class="page empty-page">
    <text>加载中...</text>
  </view>

  <view v-else-if="model" class="page">
    <!-- 模型头部 -->
    <view class="card">
      <view class="head-row">
        <text class="model-name">{{ model.modelName }}</text>
        <text class="vendor-tag">{{ model.vendor }}</text>
      </view>
      <text v-if="model.remark" class="remark">{{ model.remark }}</text>
    </view>

    <!-- 定价 -->
    <view class="card">
      <text class="card-title">定价（元 / 百万 tokens）</text>
      <view class="price-table">
        <view class="price-tr">
          <text class="price-td-label">输入</text>
          <text class="price-td-value">{{ fmtPrice(model.priceList.input) }}</text>
        </view>
        <view class="price-tr">
          <text class="price-td-label">输出</text>
          <text class="price-td-value">{{ fmtPrice(model.priceList.output) }}</text>
        </view>
        <view v-if="model.priceList.cacheHit != null" class="price-tr">
          <text class="price-td-label">缓存命中</text>
          <text class="price-td-value">{{ fmtPrice(model.priceList.cacheHit) }}</text>
        </view>
        <view v-if="model.priceList.peak" class="price-tr">
          <text class="price-td-label">高峰时段（输入 / 输出）</text>
          <text class="price-td-value">{{ fmtPrice(model.priceList.peak.input) }} / {{ fmtPrice(model.priceList.peak.output) }}</text>
        </view>
        <view v-if="model.priceList.offPeak" class="price-tr">
          <text class="price-td-label">空闲时段（输入 / 输出）</text>
          <text class="price-td-value">{{ fmtPrice(model.priceList.offPeak.input) }} / {{ fmtPrice(model.priceList.offPeak.output) }}</text>
        </view>
      </view>
    </view>

    <!-- 模型参数 -->
    <view class="card">
      <text class="card-title">模型参数</text>
      <view class="param-row">
        <text class="param-label">上下文窗口</text>
        <text class="param-value">{{ model.contextLength }}K tokens</text>
      </view>
      <view class="param-row">
        <text class="param-label">最大输出</text>
        <text class="param-value">{{ model.maxOutput }}K tokens</text>
      </view>
    </view>

    <!-- 功能特性 -->
    <view class="card">
      <text class="card-title">功能特性</text>
      <view class="feature-row">
        <text v-for="f in model.features" :key="f" class="feature-tag">{{ f }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="btn-row">
      <button class="btn btn-ghost" @click="toggleFav">{{ isFav ? '取消收藏' : '收藏' }}</button>
      <button class="btn btn-primary" @click="goBuy">去官网购买</button>
    </view>
  </view>

  <view v-else class="page empty-page">
    <text>未找到该模型</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getModelById } from '@/api/models'
import type { AIModel } from '@/types/model'
import { useFavoritesStore } from '@/stores/favorites'

const model = ref<AIModel | null>(null)
const loading = ref(true)
const fav = useFavoritesStore()

const isFav = computed(() => (model.value ? fav.has(model.value.id) : false))

onLoad(async (options) => {
  const id = options?.id || ''
  try {
    model.value = await getModelById(id)
  } catch {
    model.value = null
  } finally {
    loading.value = false
  }
})

function fmtPrice(v: number | null | undefined): string {
  return v == null ? '免费' : `¥${v}`
}

function toggleFav() {
  if (!model.value) return
  fav.toggle(model.value.id)
  uni.showToast({ title: isFav.value ? '已收藏' : '已取消收藏', icon: 'none' })
}

function goBuy() {
  const url = model.value?.purchaseUrl
  if (!url) return
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifdef MP-WEIXIN
  // 小程序内无法直接跳转外部网页，复制链接引导用户到浏览器打开
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({ title: '购买链接已复制', icon: 'none' })
    },
  })
  // #endif
}
</script>

<style>
.page {
  padding: 24rpx 24rpx 48rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2329;
}

.vendor-tag {
  font-size: 22rpx;
  color: #3b5bff;
  background-color: rgba(59, 91, 255, 0.08);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.remark {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #8a8f99;
}

.card-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 20rpx;
}

.price-tr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f1f5;
}

.price-tr:last-child {
  border-bottom: none;
}

.price-td-label {
  font-size: 26rpx;
  color: #4e5566;
}

.price-td-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #3b5bff;
}

.param-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.param-label {
  font-size: 26rpx;
  color: #4e5566;
}

.param-value {
  font-size: 26rpx;
  color: #1f2329;
  font-weight: 500;
}

.feature-row {
  display: flex;
  flex-wrap: wrap;
}

.feature-tag {
  font-size: 22rpx;
  color: #4e5566;
  background-color: #f5f6fa;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  margin: 0 12rpx 8rpx 0;
}

.btn-row {
  display: flex;
  gap: 20rpx;
  margin-top: 8rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  border-radius: 16rpx;
  margin: 0;
}

.btn::after {
  border: none;
}

.btn-ghost {
  background-color: #ffffff;
  color: #3b5bff;
  border: 2rpx solid #3b5bff;
}

.btn-primary {
  background-color: #3b5bff;
  color: #ffffff;
}

.empty-page {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
  color: #8a8f99;
  font-size: 26rpx;
}
</style>
