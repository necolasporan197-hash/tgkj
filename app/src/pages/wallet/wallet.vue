<template>
  <view class="page">
    <TgNavBar title="我的钱包" />
    <scroll-view scroll-y class="scroll">
      <!-- 余额卡片 -->
      <view class="balance">
        <text class="balance__label">账户余额（元）</text>
        <text class="balance__num">{{ money(ov.balance || 0) }}</text>
        <view class="balance__row">
          <view class="balance__cell" @tap="go('/pages/wallet/coins')">
            <text class="balance__cell-num">{{ thousands(ov.coins || 0) }}</text>
            <text class="balance__cell-label">金币</text>
          </view>
          <view class="balance__cell">
            <text class="balance__cell-num">{{ money(ov.totalWithdraw || 0) }}</text>
            <text class="balance__cell-label">累计提现</text>
          </view>
          <view class="balance__cell">
            <text class="balance__cell-num">{{ money(ov.pendingWithdraw || 0) }}</text>
            <text class="balance__cell-label">提现中</text>
          </view>
        </view>
      </view>

      <!-- 功能入口 -->
      <view class="acts">
        <view class="act" @tap="go('/pages/wallet/withdraw')">
          <view class="act__icon act__icon--tx">提</view>
          <text class="act__text">提现</text>
        </view>
        <view class="act" @tap="toCoins('充值')">
          <view class="act__icon act__icon--cz">充</view>
          <text class="act__text">充值</text>
        </view>
        <view class="act" @tap="toCoins('金币')">
          <view class="act__icon act__icon--jb">金</view>
          <text class="act__text">金币</text>
        </view>
      </view>

      <!-- 最近交易 -->
      <view class="card">
        <view class="card__head">
          <text class="card__title">最近交易</text>
          <text class="card__more" @tap="go('/pages/wallet/transactions')">查看全部 ›</text>
        </view>
        <view v-for="t in recent" :key="t.id" class="tx">
          <view class="tx__info">
            <text class="tx__title tg-ellipsis">{{ t.title || t.remark || '交易' }}</text>
            <text class="tx__time">{{ formatTime(t.created_at) }}</text>
          </view>
          <text class="tx__amount" :class="isIncome(t) ? 'is-in' : 'is-out'">{{ txText(t) }}</text>
        </view>
        <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
        <TgEmpty v-else-if="!recent.length" text="暂无交易记录" />
      </view>

      <view class="tip">100 金币 = 1 元，最低提现 100 元，手续费 5%</view>
      <view class="safe" />
    </scroll-view>
  </view>
</template>

<script>
import { walletApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, nav } from '@/utils/ui'
import { money, thousands, formatTime } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      ov: {},
      recent: [],
      loading: false
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadAll()
  },
  methods: {
    money,
    thousands,
    formatTime,
    go(url) {
      nav(url)
    },
    toCoins() {
      nav('/pages/wallet/coins')
    },
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
    async loadAll() {
      this.loading = true
      try {
        const [ov, tx] = await Promise.all([
          walletApi.overview(),
          walletApi.transactions({ page: 1, pageSize: 5 })
        ])
        this.ov = ov || {}
        this.recent = (tx && tx.list) || []
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.loading = false
      }
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
.balance {
  margin: 20rpx 30rpx 0;
  padding: 44rpx 32rpx 32rpx;
  border-radius: 16rpx;
  background: #ff731c;
  display: flex;
  flex-direction: column;
}
/* balance_fragment.xml：count（金额标签）12sp=24rpx #fff9e9db */
.balance__label {
  font-size: 24rpx;
  color: #f9e9db;
}
.balance__num {
  margin-top: 12rpx;
  font-size: 72rpx;
  font-weight: bold;
  color: #ffffff;
}
.balance__row {
  margin-top: 32rpx;
  display: flex;
  flex-direction: row;
}
.balance__cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.balance__cell-num {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}
.balance__cell-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}
.acts {
  margin: 20rpx 30rpx 0;
  padding: 28rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
}
.act {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.act__icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 38rpx;
  color: #ffffff;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.act__icon--tx {
  background: #ff731c;
}
.act__icon--cz {
  background: #ff731c;
}
.act__icon--jb {
  background: #e7b268;
}
.act__text {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #61605f;
}
.card {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card__title {
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.card__more {
  font-size: 24rpx;
  color: #9e9e9e;
}
.tx {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tx__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.tx__title {
  font-size: 30rpx;
  color: #30302f;
}
.tx__time {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #9e9e9e;
}
.tx__amount {
  margin-left: 20rpx;
  font-size: 34rpx;
  font-weight: bold;
}
.tx__amount.is-in {
  color: $tg-approved;
}
.tx__amount.is-out {
  color: $tg-rejected;
}
.tip {
  margin: 32rpx 30rpx 0;
  font-size: 22rpx;
  color: #9e9e9e;
  text-align: center;
  line-height: 34rpx;
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
