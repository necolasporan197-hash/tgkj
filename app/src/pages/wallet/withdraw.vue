<template>
  <view class="page">
    <TgNavBar title="提现" />
    <scroll-view scroll-y class="scroll">
      <!-- 可提现余额 -->
      <view class="top">
        <text class="top__label">可提现余额（元）</text>
        <text class="top__num">{{ money(balance) }}</text>
      </view>

      <!-- 金额 -->
      <view class="card">
        <text class="card__title">提现金额</text>
        <view class="amount">
          <text class="amount__unit">¥</text>
          <input
            class="amount__input"
            type="digit"
            placeholder="请输入提现金额"
            placeholder-class="amount__ph"
            :value="amount"
            @input="onAmount"
          />
          <text class="amount__all" @tap="allIn">全部提现</text>
        </view>
        <view class="calc">
          <text class="calc__text">手续费（{{ feeRateText }}）</text>
          <text class="calc__val">¥{{ money(fee) }}</text>
        </view>
        <view class="calc">
          <text class="calc__text">实际到账金额</text>
          <text class="calc__val calc__val--strong">¥{{ money(actual) }}</text>
        </view>
        <text class="hint">最低提现 {{ minAmount }} 元，手续费 {{ feeRateText }}</text>
      </view>

      <!-- 收款方式 -->
      <view class="card">
        <text class="card__title">收款方式</text>
        <view class="chans">
          <view class="chan" :class="{ 'is-active': accountType === 'alipay' }" @tap="accountType = 'alipay'">
            <view class="chan__dot chan__dot--zfb" />
            <text class="chan__text">支付宝</text>
            <view v-if="accountType === 'alipay'" class="chan__tick">✓</view>
          </view>
          <view class="chan" :class="{ 'is-active': accountType === 'wechat' }" @tap="accountType = 'wechat'">
            <view class="chan__dot chan__dot--wx" />
            <text class="chan__text">微信</text>
            <view v-if="accountType === 'wechat'" class="chan__tick">✓</view>
          </view>
        </view>

        <view class="field">
          <text class="field__label">收款账号</text>
          <input
            class="field__input"
            :placeholder="accountType === 'alipay' ? '请输入支付宝账号' : '请输入微信号'"
            placeholder-class="field__ph"
            :value="accountNo"
            @input="accountNo = $event.detail.value"
          />
        </view>
        <view class="field">
          <text class="field__label">收款人姓名</text>
          <input
            class="field__input"
            placeholder="请输入收款人真实姓名"
            placeholder-class="field__ph"
            :value="accountName"
            @input="accountName = $event.detail.value"
          />
        </view>
      </view>

      <!-- 提现记录 -->
      <view class="card">
        <text class="card__title">提现记录</text>
        <view v-for="w in list" :key="w.id" class="wd">
          <view class="wd__info">
            <text class="wd__amount">¥{{ money(w.amount) }}</text>
            <text class="wd__time">{{ formatTime(w.created_at) }}</text>
          </view>
          <view class="wd__right">
            <text class="wd__tag" :class="wStatus(w.status).cls">{{ wStatus(w.status).text }}</text>
            <text class="wd__actual">到账 {{ money(w.actual_amount) }}</text>
          </view>
        </view>
        <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
        <TgEmpty v-else-if="!list.length" text="暂无提现记录" />
      </view>
      <view class="safe" />
    </scroll-view>

    <view class="footer">
      <view class="tg-btn footer__btn" :class="{ 'tg-btn--disabled': !canSubmit || submitting }" @tap="submit">
        确认提现
      </view>
    </view>
  </view>
</template>

<script>
import { walletApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, nav, back } from '@/utils/ui'
import { money, formatTime } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      ov: {},
      amount: '',
      accountType: 'alipay',
      accountNo: '',
      accountName: '',
      list: [],
      loading: false,
      submitting: false
    }
  },
  computed: {
    balance() {
      return Number(this.ov.balance || 0)
    },
    minAmount() {
      return Number(this.ov.withdrawMinAmount || 100)
    },
    feeRate() {
      const r = this.ov.withdrawFeeRate
      return r === undefined || r === null ? 0.05 : Number(r)
    },
    feeRateText() {
      return `${Math.round(this.feeRate * 100)}%`
    },
    amountNum() {
      return Number(this.amount || 0)
    },
    fee() {
      return Number((this.amountNum * this.feeRate).toFixed(2))
    },
    actual() {
      return Math.max(0, Number((this.amountNum - this.fee).toFixed(2)))
    },
    canSubmit() {
      return this.amountNum >= this.minAmount && this.amountNum <= this.balance && !!this.accountNo.trim()
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
    formatTime,
    onAmount(e) {
      this.amount = e.detail.value
    },
    allIn() {
      this.amount = this.balance > 0 ? String(this.balance) : ''
    },
    wStatus(s) {
      if (s === 'pending') return { text: '审核中', cls: 'is-pending' }
      if (s === 'approved') return { text: '已通过', cls: 'is-approved' }
      if (s === 'paid') return { text: '已打款', cls: 'is-paid' }
      if (s === 'rejected') return { text: '已驳回', cls: 'is-rejected' }
      return { text: s || '-', cls: '' }
    },
    async loadAll() {
      this.loading = true
      try {
        const [ov, wd] = await Promise.all([
          walletApi.overview(),
          walletApi.withdrawals({ page: 1, pageSize: 10 })
        ])
        this.ov = ov || {}
        this.list = (wd && wd.list) || []
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.loading = false
      }
    },
    async submit() {
      if (!this.accountNo.trim()) {
        toast('请填写收款账号')
        return
      }
      if (this.amountNum < this.minAmount) {
        toast(`最低提现金额为 ${this.minAmount} 元`)
        return
      }
      if (this.amountNum > this.balance) {
        toast('提现金额不能超过可提现余额')
        return
      }
      if (this.submitting) return
      this.submitting = true
      try {
        await walletApi.withdraw({
          amount: this.amountNum,
          accountType: this.accountType,
          accountNo: this.accountNo.trim(),
          accountName: this.accountName.trim()
        })
        toast('提现申请已提交')
        try {
          await this.store.fetchProfile()
        } catch (e) {
          /* 忽略 */
        }
        setTimeout(() => back(), 800)
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.submitting = false
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
.top {
  margin: 20rpx 30rpx 0;
  padding: 40rpx 32rpx;
  border-radius: 16rpx;
  background: #ff731c;
  display: flex;
  flex-direction: column;
}
/* activity_exchange.xml：ktxian（可提现余额）13sp=26rpx #ffffe9d9；
   txje（金额）30sp=60rpx bold #ffffffff */
.top__label {
  font-size: 26rpx;
  color: #ffe9d9;
}
.top__num {
  margin-top: 12rpx;
  font-size: 60rpx;
  font-weight: bold;
  color: #ffffff;
}
.card {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.card__title {
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.amount {
  margin-top: 24rpx;
  padding-bottom: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f0f0f0;
}
.amount__unit {
  font-size: 40rpx;
  font-weight: bold;
  color: #181716;
}
.amount__input {
  flex: 1;
  min-width: 0;
  margin-left: 12rpx;
  height: 64rpx;
  font-size: 44rpx;
  font-weight: bold;
  color: #181716;
}
.amount__ph {
  font-size: 30rpx;
  font-weight: normal;
  color: #9e9e9e;
}
.amount__all {
  font-size: 26rpx;
  color: #ff731c;
}
.calc {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.calc__text {
  font-size: 26rpx;
  color: #61605f;
}
.calc__val {
  font-size: 26rpx;
  color: #181716;
}
.calc__val--strong {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff731c;
}
.hint {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}
.chans {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
}
.chan {
  flex: 1;
  height: 96rpx;
  margin-right: 20rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
  border: 2rpx solid transparent;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.chan:last-child {
  margin-right: 0;
}
.chan.is-active {
  border-color: #ff731c;
  background: #fff6f1;
}
.chan__dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
}
.chan__dot--zfb {
  background: #1677ff;
}
.chan__dot--wx {
  background: #07c160;
}
.chan__text {
  flex: 1;
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #30302f;
}
.chan__tick {
  font-size: 28rpx;
  color: #ff731c;
  font-weight: bold;
}
.field {
  margin-top: 24rpx;
  height: 96rpx;
  padding: 0 40rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.field__label {
  width: 180rpx;
  font-size: 28rpx;
  color: #30302f;
}
.field__input {
  flex: 1;
  min-width: 0;
  height: 96rpx;
  font-size: 28rpx;
  color: #181716;
}
.field__ph {
  color: #9e9e9e;
}
.wd {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.wd__info {
  display: flex;
  flex-direction: column;
}
.wd__amount {
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
}
.wd__time {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #9e9e9e;
}
.wd__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.wd__tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}
.wd__tag.is-pending {
  color: #ffb020;
  background: rgba(255, 176, 32, 0.12);
}
.wd__tag.is-approved {
  color: $tg-blue;
  background: rgba(0, 128, 255, 0.1);
}
.wd__tag.is-paid {
  color: $tg-approved;
  background: rgba(76, 214, 114, 0.12);
}
.wd__tag.is-rejected {
  color: $tg-rejected;
  background: rgba(242, 102, 102, 0.12);
}
.wd__actual {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9e9e9e;
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
.footer {
  padding: 16rpx 30rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}
.footer__btn {
  width: 100%;
  background: #ff731c;
  border-radius: 30rpx;
}
.safe {
  height: 40rpx;
}
</style>
