<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useFavoritesStore } from "@/stores/favorites";

const fav = useFavoritesStore();
onLaunch(() => {
  console.log("App Launch");
  // 启动时从服务端同步收藏（失败静默，回退本地缓存）
  fav.hydrate();
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
page {
  background-color: #f5f6fa;
  color: #1f2329;
  font-size: 28rpx;
}
</style>
