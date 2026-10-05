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

    <!-- 价格测算 -->
    <view class="card">
      <text class="card-title">价格测算</text>
      <template v-if="isFree">
        <text class="pcalc-free">该模型免费，无需测算费用</text>
      </template>
      <template v-else>
        <view class="pcalc-input-row">
          <text class="pcalc-label">输入 tokens</text>
          <input class="pcalc-input" type="digit" placeholder="如 100000" :value="inputTokens" @input="onInputTokens" />
        </view>
        <view class="pcalc-input-row">
          <text class="pcalc-label">输出 tokens</text>
          <input class="pcalc-input" type="digit" placeholder="如 20000" :value="outputTokens" @input="onOutputTokens" />
        </view>
        <view v-if="hasInput" class="pcalc-result">
          <view class="price-tr">
            <text class="price-td-label">输入费用</text>
            <text class="price-td-value">{{ cost.input }}</text>
          </view>
          <view class="price-tr">
            <text class="price-td-label">输出费用</text>
            <text class="price-td-value">{{ cost.output }}</text>
          </view>
          <view class="price-tr">
            <text class="price-td-label">合计</text>
            <text class="price-td-value">{{ cost.total }}</text>
          </view>
          <view v-if="model.priceList.peak" class="price-tr">
            <text class="price-td-label">高峰时段合计</text>
            <text class="price-td-value">{{ cost.peak }}</text>
          </view>
          <view v-if="model.priceList.offPeak" class="price-tr">
            <text class="price-td-label">空闲时段合计</text>
            <text class="price-td-value">{{ cost.offPeak }}</text>
          </view>
        </view>
        <text v-else class="pcalc-free">输入 token 用量后自动估算费用</text>
      </template>
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
import { calcCost, formatCost } from '@/utils/pricing'

const model = ref<AIModel | null>(null)
const loading = ref(true)
const fav = useFavoritesStore()

const isFav = computed(() => (model.value ? fav.has(model.value.id) : false))

// 价格测算：输入的 token 用量（input 值恒为 string，计算时再转数字）
const inputTokens = ref('')
const outputTokens = ref('')

const isFree = computed(() => {
  const p = model.value?.priceList
  return !!p && p.input == null && p.output == null
})

const cost = computed(() => {
  const p = model.value?.priceList
  const i = Number(inputTokens.value) || 0
  const o = Number(outputTokens.value) || 0
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
})

// 两个输入框都为空时展示占位提示，不显示估算结果
const hasInput = computed(() => inputTokens.value !== '' || outputTokens.value !== '')

// 仅允许数字与一个小数点，避免 H5 端输入字母等非法字符
function onInputTokens(e: { detail: { value: string } }) {
  const v = e.detail.value
  if (/^\d*\.?\d*$/.test(v)) inputTokens.value = v
}

function onOutputTokens(e: { detail: { value: string } }) {
  const v = e.detail.value
  if (/^\d*\.?\d*$/.test(v)) outputTokens.value = v
}

onLoad(async (options) => {
  const id = options?.id || ''
  try {
    // 无 id 时直接判空，避免请求 /api/models/ 误命中列表接口返回数组
    model.value = id ? await getModelById(id) : null
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

/* 价格测算 */
.pcalc-free {
  font-size: 26rpx;
  color: #8a8f99;
}

.pcalc-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.pcalc-label {
  width: 180rpx;
  font-size: 26rpx;
  color: #4e5566;
}

.pcalc-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #1f2329;
  background-color: #f5f6fa;
  border-radius: 12rpx;
}

.pcalc-result {
  margin-top: 8rpx;
}

</style>
