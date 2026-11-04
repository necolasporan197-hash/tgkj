<template>
  <view class="page">
    <TgNavBar title="交易明细" />
    <view class="tabs">
      <view v-for="t in tabs" :key="t.key" class="tab" @tap="switchTab(t.key)">
        <text class="tab__text" :class="{ 'is-active': filter === t.key }">{{ t.text }}</text>
        <view v-if="filter === t.key" class="tab__line" />
      </view>
    </view>
    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <view class="list">
        <view v-for="tx in filtered" :key="tx.id" class="item">
          <view class="item__info">
            <text class="item__title tg-ellipsis">{{ tx.title || tx.remark || '交易' }}</text>
            <text v-if="tx.remark" class="item__remark tg-ellipsis">{{ tx.remark }}</text>
            <text class="item__time">{{ formatTime(tx.created_at) }}</text>
          </view>
          <text class="item__amount" :class="isIncome(tx) ? 'is-in' : 'is-out'">{{ txText(tx) }}</text>
        </view>
      </view>
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
      <TgEmpty v-else-if="!list.length" text="暂无交易记录" />
      <view v-else-if="finished" class="loading"><text class="loading__text">没有更多了</text></view>
      <view class="safe" />
    </scroll-view>
  </view>
</template>

<script>
import { walletApi } from '@/api'
import { userStore } from '@/store/user'
import { formatTime, money, thousands } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      tabs: [
        { key: 'all', text: '全部' },
        { key: 'income', text: '收入' },
        { key: 'expense', text: '支出' }
      ],
      filter: 'all',
      list: [],
      page: 1,
      pageSize: 20,
      finished: false,
      loading: false
    }
  },
  computed: {
    filtered() {
      if (this.filter === 'income') return this.list.filter((t) => this.isIncome(t))
      if (this.filter === 'expense') return this.list.filter((t) => !this.isIncome(t))
      return this.list
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
    isIncome(t) {
      return Number(t.amount || 0) > 0 || Number(t.coins || 0) > 0
    },
    txText(t) {
      const a = Number(t.amount || 0)
      const c = Number(t.coins || 0)
      const inc = this.isIncome(t) ? '+' : '-'
      if (a !== 0) return `${inc}${money(Math.abs(a))}`
      if (c !== 0) return `${inc}${thousands(Math.abs(c))}`
      return '0.00'
    },
    switchTab(key) {
      if (this.filter === key) return
      this.filter = key
    },
    async load(reset) {
      if (this.loading) return
      if (reset) {
        this.page = 1
        this.finished = false
      }
      this.loading = true
      try {
        const res = await walletApi.transactions({ page: this.page, pageSize: this.pageSize })
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
  background: $tg-bg-page;
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
/* item_user_log_amount.xml / task_log_item.xml / wallet_item.xml：
   行高固定 72dip=144rpx，分割线 #fff7f7f7 */
.item {
  min-height: 144rpx;
  padding: 28rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid #f7f7f7;
}
.item:last-child {
  border-bottom: none;
}
.item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.item__title {
  font-size: 30rpx;
  color: #30302f;
}
.item__remark {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}
.item__time {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #9e9e9e;
}
.item__amount {
  margin-left: 20rpx;
  font-size: 38rpx;
  font-weight: bold;
}
.item__amount.is-in {
  color: $tg-approved;
}
.item__amount.is-out {
  color: $tg-rejected;
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
