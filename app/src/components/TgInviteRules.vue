<template>
  <!-- 活动规则弹窗 —— 对齐官方 layout_invite_rules.xml -->
  <view class="rules-mask" @tap="$emit('close')">
    <view class="rules">
      <image class="rules__close" src="/static/official/close.png" @tap.stop="$emit('close')" />
      <view class="rules__card">
        <view class="rules__inner">
          <view class="rules__head">
            <text class="rules__head-text">活动</text>
            <image class="rules__star" src="/static/official/star.png" />
            <text class="rules__head-text">规则</text>
          </view>
          <scroll-view scroll-y class="rules__scroll">
            <view class="rules__body">
              <view v-for="(r, i) in list" :key="i" class="rules__item">
                <text class="rules__dot">{{ i + 1 }}</text>
                <text class="rules__text">{{ r }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 活动规则弹窗
 * 对齐 layout_invite_rules.xml：左右 padding 30dip；CardView 圆角 12dip；
 * 内部边框 1dip #c7a780、圆角 10dip、margin 3dip；标题 17sp #c7a780；
 * 关闭按钮 24dip 位于卡片右上、距离顶部 24dip。
 */
export default {
  name: 'TgInviteRules',
  props: {
    rules: { type: Array, default: () => [] }
  },
  emits: ['close'],
  computed: {
    list() {
      return Array.isArray(this.rules) ? this.rules : []
    }
  }
}
</script>

<style lang="scss" scoped>
.rules-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rules {
  position: relative;
  width: 100%;
  padding: 0 60rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.rules__close {
  position: absolute;
  right: 60rpx;
  top: -88rpx;
  width: 48rpx;
  height: 48rpx;
}
.rules__card {
  width: 100%;
  border-radius: 24rpx;
  background: #ffffff;
  overflow: hidden;
}
.rules__inner {
  margin: 6rpx;
  border: 2rpx solid #c7a780;
  border-radius: 20rpx;
  padding-bottom: 32rpx;
}
.rules__head {
  padding-top: 60rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.rules__head-text {
  font-size: 34rpx;
  color: #c7a780;
}
.rules__star {
  width: 28rpx;
  height: 28rpx;
  margin: 0 12rpx;
}
.rules__scroll {
  margin-top: 26rpx;
  max-height: 700rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
}
.rules__body {
  padding-bottom: 8rpx;
}
.rules__item {
  margin-top: 18rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.rules__dot {
  width: 32rpx;
  height: 32rpx;
  margin-right: 14rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
  background: #fdf1e5;
  color: #c7a780;
  font-size: 20rpx;
  text-align: center;
  line-height: 32rpx;
}
.rules__text {
  flex: 1;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #6b6b6b;
}
</style>
