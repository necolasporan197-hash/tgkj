<template>
  <view class="page">
    <TgNavBar title="礼物记录" />
    <view class="tabs">
      <view v-for="t in tabs" :key="t.key" class="tab" @tap="switchTab(t.key)">
        <text class="tab__text" :class="{ 'is-active': tab === t.key }">{{ t.text }}</text>
        <view v-if="tab === t.key" class="tab__line" />
      </view>
    </view>
    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <view class="list">
        <view v-for="r in list" :key="r.id" class="item">
          <image class="item__avatar" :src="avatarOf(r.avatar)" mode="aspectFill" />
          <view class="item__info">
            <text class="item__name tg-ellipsis">{{ r.nickname || '用户' }}</text>
            <text class="item__desc tg-ellipsis">{{ r.gift_name }} × {{ r.count }}</text>
            <text class="item__time">{{ formatTime(r.created_at) }}</text>
          </view>
          <text class="item__coins" :class="tab === 'received' ? 'is-in' : 'is-out'">{{ coinText(r) }}</text>
        </view>
      </view>
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
      <TgEmpty v-else-if="!list.length" :text="tab === 'sent' ? '还没有送出过礼物' : '还没有收到过礼物'" />
      <view v-else-if="finished" class="loading"><text class="loading__text">没有更多了</text></view>
      <view class="safe" />
    </scroll-view>
  </view>
</template>

<script>
import { giftApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { formatTime, thousands } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      tabs: [
        { key: 'sent', text: '送出的' },
        { key: 'received', text: '收到的' }
      ],
      tab: 'sent',
      list: [],
      page: 1,
      pageSize: 20,
      finished: false,
      loading: false
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.load(true)
  },
  methods: {
    formatTime,
    thousands,
    avatarOf(a) {
      return a ? mediaUrl(a) : '/static/official/bg_avatar_woman.png'
    },
    coinText(r) {
      const coins = Number(r.coins || 0)
      if (this.tab === 'received') {
        const income = Math.floor(coins * 0.7)
        return `+${thousands(income)}`
      }
      return `-${thousands(coins)}`
    },
    switchTab(key) {
      if (this.tab === key) return
      this.tab = key
      this.list = []
      this.load(true)
    },
    async load(reset) {
      if (this.loading) return
      if (reset) {
        this.page = 1
        this.finished = false
      }
      this.loading = true
      try {
        const api = this.tab === 'sent' ? giftApi.sent : giftApi.received
        const res = await api({ page: this.page, pageSize: this.pageSize })
        const arr = (res && res.list) || []
        this.list = reset ? arr : this.list.concat(arr)
        this.finished = arr.length < this.pageSize
        if (!this.finished) this.page++
      } catch (e) {
        this.finished = true
      } finally {
        this.loading = false
      }
    },
    loadMore() {
      if (!this.loading && !this.finished) this.load(false)
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
}
.tabs {
  height: 88rpx;
  padding: 0 30rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tab {
  margin-right: 48rpx;
  height: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.tab__text {
  font-size: 28rpx;
  color: #9e9e9e;
}
.tab__text.is-active {
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.tab__line {
  margin-top: 8rpx;
  width: 36rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #ff731c;
}
.scroll {
  flex: 1;
  height: 0;
}
.list {
  margin: 20rpx 30rpx 0;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  overflow: hidden;
}
.item {
  height: 144rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f7f7f7;
}
.item:last-child {
  border-bottom: none;
}
.item__avatar {
  width: 98rpx;
  height: 98rpx;
  border-radius: 49rpx;
  background: #f0f0f0;
}
.item__info {
  flex: 1;
  min-width: 0;
  margin-left: 40rpx;
  display: flex;
  flex-direction: column;
}
.item__name {
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
}
.item__desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #9e9e9e;
}
.item__time {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #9e9e9e;
}
.item__coins {
  margin-left: 20rpx;
  font-size: 34rpx;
  font-weight: bold;
  color: #181716;
}
.item__coins.is-in {
  color: #4cd672;
}
.item__coins.is-out {
  color: #f26666;
}
.loading {
  padding: 32rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 24rpx;
  color: #9e9e9e;
}
.safe {
  height: 40rpx;
}
</style>
