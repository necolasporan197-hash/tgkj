<template>
  <view class="page">
    <TgNavBar title="选择城市" />
    <scroll-view scroll-y class="scroll">
      <!-- 当前定位城市（整行） -->
      <view v-if="located" class="locate" @tap="pick(store.city)">
        <image class="locate__icon" src="/static/official/my_location_icon.png" />
        <text class="locate__label">当前定位城市</text>
        <text class="locate__city">{{ store.city }}</text>
      </view>

      <view class="section">常用城市</view>
      <view class="list">
        <view
          v-for="(c, i) in cities"
          :key="c"
          class="list__item"
          :class="{ 'is-active': c === store.city, 'is-last': i === cities.length - 1 }"
          @tap="pick(c)"
        >
          <text class="list__text">{{ c }}</text>
        </view>
      </view>
      <view class="safe" />
    </scroll-view>
  </view>
</template>

<script>
import { userStore } from '@/store/user'
import { getLocation } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      located: false,
      pickMode: '',
      cities: ['北京', '上海', '广州', '深圳', '长沙', '成都', '杭州', '重庆', '武汉', '西安', '南京', '苏州']
    }
  },
  onLoad(q) {
    this.pickMode = q && q.pick ? String(q.pick) : ''
    this.ready()
  },
  methods: {
    async ready() {
      const loc = await getLocation()
      if (loc) this.located = true
    },
    pick(city) {
      if (!city) return
      this.store.setCity(city)
      try {
        const ch = this.getOpenerEventChannel && this.getOpenerEventChannel()
        if (ch && ch.emit) ch.emit('picked', city)
      } catch (e) {
        /* H5 等平台可能不支持事件通道，静默忽略 */
      }
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $tg-bg-page;
}
.scroll {
  flex: 1;
  height: 0;
}
.safe {
  height: 40rpx;
}

/* 当前定位城市行 —— 官方 45dip 行高 = 90rpx */
.locate {
  height: 90rpx;
  padding: 0 30rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
}
.locate__icon {
  width: 36rpx;
  height: 36rpx;
}
.locate__label {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #61605f;
}
.locate__city {
  margin-left: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #ff731c;
}

/* 分组标题 */
.section {
  padding: 24rpx 30rpx 12rpx;
  font-size: 24rpx;
  color: #9e9e9e;
}

/* 纵向列表 —— 官方 list_choose_item_view：每项一整行 */
.list {
  background: #ffffff;
}
.list__item {
  height: 90rpx;
  padding: 0 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #f0f0f0;
}
.list__item.is-last {
  border-bottom: none;
}
.list__text {
  font-size: 30rpx;
  color: #61605f;
}
.list__item.is-active .list__text {
  color: #ff5001;
  font-weight: bold;
}
</style>
