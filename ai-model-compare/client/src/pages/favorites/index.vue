<template>
  <view class="page">
    <view v-if="loading" class="empty">
      <text>加载中...</text>
    </view>

    <view v-else-if="loadError" class="empty" @click="refresh">
      <text>加载失败，请确认后端服务已启动</text>
      <text class="empty-sub">点击重试</text>
    </view>

    <view v-else-if="list.length" class="model-list">
      <view v-for="m in list" :key="m.id" class="card">
        <view class="card-head" @click="goDetail(m.id)">
          <text class="model-name">{{ m.modelName }}</text>
          <text class="vendor-tag">{{ m.vendor }}</text>
        </view>
        <view class="price-row">
          <text class="price-item">输入 {{ fmtPrice(m.priceList.input) }}</text>
          <text class="price-item">输出 {{ fmtPrice(m.priceList.output) }}</text>
        </view>
        <view class="btn-row">
          <button class="btn-mini" @click="goDetail(m.id)">查看详情</button>
          <button class="btn-mini btn-mini--danger" @click="remove(m.id)">移除</button>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text>还没有收藏的模型</text>
      <text class="empty-sub">在模型详情页点击「收藏」即可添加</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getModels } from '@/api/models'
import { useFavoritesStore } from '@/stores/favorites'
import type { AIModel } from '@/types/model'

const fav = useFavoritesStore()

// 每次进入页面：先同步一次云端收藏，再拉模型列表做过滤
const models = ref<AIModel[]>([])
const loading = ref(true)
const loadError = ref(false)

async function refresh() {
  loading.value = true
  loadError.value = false
  try {
    await fav.hydrate()
    models.value = await getModels()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onShow(refresh)

const list = computed(() => models.value.filter((m) => fav.ids.includes(m.id)))

function fmtPrice(v: number | null | undefined): string {
  return v == null ? '免费' : `¥${v}`
}

function remove(id: string) {
  fav.toggle(id)
  uni.showToast({ title: '已移除收藏', icon: 'none' })
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/models/detail?id=${id}` })
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

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-name {
  font-size: 30rpx;
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

.price-row {
  display: flex;
  margin-top: 16rpx;
}

.price-item {
  font-size: 26rpx;
  color: #4e5566;
  margin-right: 32rpx;
}

.btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
}

.btn-mini {
  height: 60rpx;
  line-height: 60rpx;
  font-size: 24rpx;
  padding: 0 28rpx;
  border-radius: 12rpx;
  margin: 0;
  background-color: rgba(59, 91, 255, 0.08);
  color: #3b5bff;
}

.btn-mini::after {
  border: none;
}

.btn-mini--danger {
  background-color: #f5f6fa;
  color: #8a8f99;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
  color: #8a8f99;
  font-size: 28rpx;
}

.empty-sub {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #b0b4bf;
}
</style>
