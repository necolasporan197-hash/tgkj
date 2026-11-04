<template>
  <view class="tg-tabbar">
    <view class="tg-tabbar__bar">
      <view
        v-for="(item, idx) in leftTabs"
        :key="item.key"
        class="tg-tabbar__item"
        @tap="$emit('change', item.key)"
      >
        <image class="tg-tabbar__icon" :src="current === item.key ? item.active : item.icon" mode="aspectFit" />
        <text class="tg-tabbar__text" :class="{ 'is-active': current === item.key }">{{ item.text }}</text>
      </view>

      <view class="tg-tabbar__item tg-tabbar__item--invite" @tap="$emit('change', 'invite')">
        <image class="tg-tabbar__invite" src="/static/official/pc_tab_invite_n.webp" mode="aspectFit" />
      </view>

      <view class="tg-tabbar__item" @tap="$emit('change', 'message')">
        <image class="tg-tabbar__icon" :src="current === 'message' ? msgActive : msgIcon" mode="aspectFit" />
        <text class="tg-tabbar__text" :class="{ 'is-active': current === 'message' }">消息</text>
        <view v-if="unread > 0" class="tg-tabbar__dot">
          <text class="tg-tabbar__dot-text">{{ unread > 99 ? '99+' : unread }}</text>
        </view>
      </view>

      <view class="tg-tabbar__item" @tap="$emit('change', 'mine')">
        <image class="tg-tabbar__icon" :src="current === 'mine' ? myActive : myIcon" mode="aspectFit" />
        <text class="tg-tabbar__text" :class="{ 'is-active': current === 'mine' }">我的</text>
      </view>
    </view>
    <view class="tg-tabbar__safe" />
  </view>
</template>

<script>
/**
 * 底部导航 —— 对齐官方 activity_main.xml + main_tab_item.xml
 * TabLayout 高 50dip(100rpx) paddingBottom 4dip(8rpx)，item 高 49dip(98rpx)
 * 图标 22dip(44rpx) marginTop 7dip(14rpx)，文字 10sp(20rpx) 底部居中
 * 文字色 @color/main_item_tab_text：选中 #FF5100 / 未选中 #B9B9B9
 * 红点背景 main_tab_dot：实心 #FF731C + 1dip #FFFFFF 描边 + 圆角 8dip(16rpx)
 * 中间第 3 项为悬浮「邀请」按钮（main_share，75x50dip，padding L/R 15dip）
 */
const BASE = '/static/official/'
export default {
  name: 'TgTabBar',
  props: {
    current: { type: String, default: 'home' },
    unread: { type: Number, default: 0 }
  },
  emits: ['change'],
  data() {
    return {
      myIcon: `${BASE}tabbar_my.png`,
      myActive: `${BASE}tabbar_my_active.png`,
      msgIcon: `${BASE}tabbar_message.png`,
      msgActive: `${BASE}tabbar_message_active.png`,
      leftTabs: [
        { key: 'home', text: '首页', icon: `${BASE}tabbar_home.png`, active: `${BASE}tabbar_home_active.png` },
        { key: 'discover', text: '动态', icon: `${BASE}tabbar_dynamic.png`, active: `${BASE}tabbar_dynamic_active.png` }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.tg-tabbar {
  position: relative;
  width: 100%;
  background: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.tg-tabbar__bar {
  position: relative;
  height: 100rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  padding-bottom: 8rpx;
}
.tg-tabbar__item {
  position: relative;
  flex: 1;
  height: 98rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}
.tg-tabbar__icon {
  width: 44rpx;
  height: 44rpx;
  margin-top: 14rpx;
}
.tg-tabbar__text {
  margin-top: 4rpx;
  font-size: 20rpx;
  line-height: 24rpx;
  color: #b9b9b9;
}
.tg-tabbar__text.is-active {
  color: #ff5100;
}
.tg-tabbar__item--invite {
  justify-content: flex-start;
}
.tg-tabbar__invite {
  width: 150rpx;
  height: 100rpx;
  padding: 0 30rpx;
  box-sizing: border-box;
  margin-top: -14rpx;
}
.tg-tabbar__dot {
  position: absolute;
  top: 8rpx;
  right: 6rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 4rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  background: #ff731c;
  border: 2rpx solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tg-tabbar__dot-text {
  color: #ffffff;
  font-size: 18rpx;
  line-height: 34rpx;
}
.tg-tabbar__safe {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>
