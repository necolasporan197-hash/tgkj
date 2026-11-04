<template>
  <view class="tg-empty">
    <image class="tg-empty__img" :src="image" mode="aspectFit" />
    <text class="tg-empty__text">{{ text }}</text>
    <view v-if="btnText" class="tg-empty__btn" @tap="$emit('action')">{{ btnText }}</view>
  </view>
</template>

<script>
/** 空状态 —— 官方 real_empty.png / adapter_empty_view */
export default {
  name: 'TgEmpty',
  props: {
    text: { type: String, default: '暂无数据' },
    btnText: { type: String, default: '' },
    image: { type: String, default: '/static/official/real_empty.png' }
  },
  emits: ['action']
}
</script>

<style lang="scss" scoped>
.tg-empty {
  padding: 120rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tg-empty__img {
  width: 320rpx;
  height: 320rpx;
}
.tg-empty__text {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #91979e;
}
.tg-empty__btn {
  margin-top: 32rpx;
  height: 64rpx;
  padding: 0 44rpx;
  border-radius: 32rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
