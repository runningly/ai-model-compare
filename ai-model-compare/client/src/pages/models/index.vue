<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索模型，如 glm、deepseek"
        placeholder-class="search-ph"
        confirm-type="search"
      />
    </view>

    <!-- 厂商筛选 -->
    <scroll-view class="vendor-row" scroll-x :show-scrollbar="false">
      <view
        v-for="v in vendorTabs"
        :key="v"
        class="vendor-chip"
        :class="{ 'vendor-chip--active': currentVendor === v }"
        @click="currentVendor = v"
      >{{ v }}</view>
    </scroll-view>

    <view class="unit-note">价格单位：元 / 百万 tokens（演示快照，以官网为准）</view>

    <!-- 骨架屏：加载中 -->
    <view v-if="loading" class="model-list">
      <view v-for="i in 4" :key="i" class="card">
        <view class="sk sk-name"></view>
        <view class="sk sk-line"></view>
        <view class="sk sk-line sk-line--short"></view>
      </view>
    </view>

    <!-- 加载失败：点击重试 -->
    <view v-else-if="loadError" class="empty" @click="load">
      <text>加载失败，请确认后端服务已启动</text>
      <text class="empty-retry">点击重试</text>
    </view>

    <!-- 模型列表 -->
    <view v-else class="model-list">
      <view
        v-for="m in filteredModels"
        :key="m.id"
        class="card"
        hover-class="card--hover"
        @click="goDetail(m.id)"
      >
        <view class="card-head">
          <text class="model-name">{{ m.modelName }}</text>
          <text class="vendor-tag">{{ m.vendor }}</text>
        </view>
        <view class="meta-row">
          <text class="meta-item">上下文 {{ m.contextLength }}K</text>
          <text class="meta-item">最大输出 {{ m.maxOutput }}K</text>
          <text v-if="m.free" class="meta-item meta-free">限免</text>
        </view>
        <view class="price-row">
          <view class="price-item">
            <text class="price-label">输入</text>
            <text class="price-value">{{ fmtPrice(m.priceList.input) }}</text>
          </view>
          <view class="price-item">
            <text class="price-label">输出</text>
            <text class="price-value">{{ fmtPrice(m.priceList.output) }}</text>
          </view>
          <view v-if="m.priceList.cacheHit != null" class="price-item">
            <text class="price-label">缓存命中</text>
            <text class="price-value">{{ fmtPrice(m.priceList.cacheHit) }}</text>
          </view>
        </view>
        <view class="feature-row">
          <text v-for="f in m.features.slice(0, 3)" :key="f" class="feature-tag">{{ f }}</text>
        </view>
      </view>

      <view v-if="!filteredModels.length" class="empty">
        <text>没有找到匹配的模型</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getModels } from '@/api/models'
import type { AIModel, Vendor } from '@/types/model'

const keyword = ref('')
type VendorTab = Vendor | '全部'
const currentVendor = ref<VendorTab>('全部')
const vendorTabs: VendorTab[] = ['全部', 'DeepSeek', '智谱GLM', '通义千问', '豆包', 'Kimi']

// 真实接口：加载模型列表（骨架屏为真实 loading）
const models = ref<AIModel[]>([])
const loading = ref(true)
const loadError = ref(false)

async function load() {
  loading.value = true
  loadError.value = false
  try {
    models.value = await getModels()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onLoad(() => {
  load()
})

const filteredModels = computed<AIModel[]>(() =>
  models.value.filter((m) => {
    const matchVendor = currentVendor.value === '全部' || m.vendor === currentVendor.value
    const kw = keyword.value.trim().toLowerCase()
    const matchKeyword = !kw || `${m.modelName}${m.vendor}`.toLowerCase().includes(kw)
    return matchVendor && matchKeyword
  })
)

function fmtPrice(v: number | null | undefined): string {
  return v == null ? '免费' : `¥${v}`
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/models/detail?id=${id}` })
}
</script>

<style>
.page {
  padding: 24rpx 24rpx 48rpx;
}

.search-bar {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.search-input {
  height: 72rpx;
  font-size: 28rpx;
}

.search-ph {
  color: #b0b4bf;
}

.vendor-row {
  margin-top: 20rpx;
  white-space: nowrap;
  width: 100%;
}

.vendor-chip {
  display: inline-block;
  padding: 12rpx 30rpx;
  margin-right: 16rpx;
  background-color: #ffffff;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #4e5566;
}

.vendor-chip--active {
  background-color: #3b5bff;
  color: #ffffff;
}

.unit-note {
  margin: 20rpx 4rpx 16rpx;
  font-size: 22rpx;
  color: #8a8f99;
}

.model-list {
  margin-top: 8rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card--hover {
  opacity: 0.85;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-name {
  font-size: 32rpx;
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

.meta-row {
  display: flex;
  margin-top: 16rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #8a8f99;
  margin-right: 28rpx;
}

.meta-free {
  color: #18a058;
  font-weight: 600;
}

.price-row {
  display: flex;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f1f5;
}

.price-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 22rpx;
  color: #8a8f99;
}

.price-value {
  margin-top: 6rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #3b5bff;
}

.feature-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.feature-tag {
  font-size: 22rpx;
  color: #4e5566;
  background-color: #f5f6fa;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  margin: 0 12rpx 8rpx 0;
}

.empty {
  text-align: center;
  color: #8a8f99;
  padding: 120rpx 0;
  font-size: 26rpx;
}

.empty-retry {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #3b5bff;
}

/* 骨架屏 */
.sk {
  background-color: #eceef2;
  border-radius: 8rpx;
}

.sk-name {
  height: 36rpx;
  width: 40%;
  margin-bottom: 24rpx;
}

.sk-line {
  height: 28rpx;
  width: 80%;
  margin-bottom: 20rpx;
}

.sk-line--short {
  width: 50%;
  margin-bottom: 0;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}

.card .sk {
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}
</style>
