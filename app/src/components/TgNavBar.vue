<template>
  <view class="tg-navbar" :style="{ background: bgColor }">
    <view class="tg-navbar__status" :style="{ height: statusBarHeight + 'px' }" />
    <view class="tg-navbar__bar">
      <view class="tg-navbar__left" @tap="onBack">
        <image v-if="showBack" class="tg-navbar__back" :src="backIcon" mode="aspectFit" />
        <text v-else-if="leftText" class="tg-navbar__left-text">{{ leftText }}</text>
      </view>
      <text class="tg-navbar__title" :style="{ color: color }">{{ title }}</text>
      <view class="tg-navbar__right">
        <text v-if="rightText" class="tg-navbar__right-text" :style="{ color: color }" @tap="$emit('right')">{{ rightText }}</text>
        <slot name="right" />
      </view>
    </view>
    <view v-if="divider" class="tg-navbar__divider" />
  </view>
</template>

<script>
/**
 * 自定义导航栏 —— 对齐官方 title_bar.xml
 * 高度 44dip(88rpx)，标题 18sp 加粗，左侧 17sp(minWidth 44dip)，右侧 14sp 加粗
 * 文字色统一 @color/title_bar_color = #ff181716
 */
export default {
  name: 'TgNavBar',
  props: {
    title: { type: String, default: '' },
    showBack: { type: Boolean, default: true },
    leftText: { type: String, default: '' },
    rightText: { type: String, default: '' },
    bgColor: { type: String, default: '#FFFFFF' },
    color: { type: String, default: '#181716' },
    divider: { type: Boolean, default: false },
    backIcon: { type: String, default: '/static/official/ic_profile_fh_n.png' },
    /** 是否由组件自动返回；置 false 时仅派发 back 事件，由页面自行处理（如 step 子页回退） */
    autoBack: { type: Boolean, default: true }
  },
  emits: ['right', 'back'],
  data() {
    return { statusBarHeight: 0 }
  },
  created() {
    try {
      const info = uni.getSystemInfoSync()
      this.statusBarHeight = info.statusBarHeight || 0
    } catch (e) {
      this.statusBarHeight = 0
    }
  },
  methods: {
    onBack() {
      this.$emit('back')
      if (!this.autoBack) return
      const pages = getCurrentPages()
      if (this.showBack && pages.length > 1) uni.navigateBack({ delta: 1 })
      else if (this.showBack) uni.reLaunch({ url: '/pages/main/main' })
    }
  }
}
</script>

<style lang="scss" scoped>
.tg-navbar {
  position: relative;
  width: 100%;
  z-index: 20;
}
.tg-navbar__bar {
  position: relative;
  height: 88rpx;
  display: flex;
  align-items: center;
}
.tg-navbar__left {
  position: absolute;
  left: 0;
  top: 0;
  height: 88rpx;
  min-width: 88rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
}
.tg-navbar__back {
  width: 36rpx;
  height: 36rpx;
}
.tg-navbar__left-text {
  font-size: 34rpx;
  color: #181716;
}
.tg-navbar__title {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  pointer-events: none;
}
.tg-navbar__right {
  position: absolute;
  right: 0;
  top: 0;
  height: 88rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
}
.tg-navbar__right-text {
  font-size: 28rpx;
  font-weight: bold;
}
.tg-navbar__divider {
  height: 2rpx;
  background-color: #eeeeee;
  transform: scaleY(0.5);
}
</style>
