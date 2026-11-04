<script>
import { userStore } from './store/user'

export default {
  onLaunch() {
    userStore.restore()
    userStore.loadAppConfig()
    if (userStore.token) userStore.fetchUnread()
  },
  onShow() {},
  onHide() {}
}
</script>

<style lang="scss">
/**
 * 全局样式 —— 设计基线来自官方 APK（res/values/colors.xml、dimens.xml）
 * 单位统一 rpx（750 设计稿），圆角/间距档位与 src/design/tokens.js 一致。
 */
page {
  background-color: $tg-bg-page;
  color: $tg-text-primary;
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
}

view,
text,
image,
scroll-view,
swiper,
input,
textarea,
button {
  box-sizing: border-box;
}

image {
  display: block;
}

/* ---------- 通用原子类 ---------- */
.tg-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tg-col {
  display: flex;
  flex-direction: column;
}
.tg-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.tg-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tg-flex1 {
  flex: 1;
  min-width: 0;
}
.tg-ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tg-ellipsis2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 主按钮（官方 button_ff8800：实心 #ff731c / corners 15dip=30rpx / NextButton 高 48dip=96rpx / 文字 16sp bold） */
.tg-btn {
  height: 96rpx;
  border-radius: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: #ff731c;
}
.tg-btn--plain {
  background: #ffffff;
  color: $tg-primary;
  border: 2rpx solid $tg-primary;
}
.tg-btn--gray {
  background: $tg-bg-gray;
  color: $tg-text-secondary;
}
.tg-btn--disabled {
  opacity: 0.5;
}

/* 白色大圆角卡片 */
.tg-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
}

/* 分割线 */
.tg-divider {
  height: 2rpx;
  background-color: $tg-divider;
  transform: scaleY(0.5);
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}
</style>
