<template>
  <view class="page">
    <TgNavBar title="金币中心" />
    <scroll-view scroll-y class="scroll">
      <!-- 金币余额 -->
      <view class="hero">
        <text class="hero__label">我的金币</text>
        <text class="hero__num">{{ thousands(myCoins) }}</text>
        <text class="hero__sub">100 金币 = 1 元</text>
      </view>

      <!-- 套餐 -->
      <view class="section-title">金币套餐</view>
      <view class="grid">
        <view
          v-for="(p, i) in pkgs"
          :key="i"
          class="coin"
          :class="{ 'is-active': selectedIndex === i }"
          @tap="selectedIndex = i"
        >
          <text v-if="i === hotIndex" class="coin__hot">热门</text>
          <text class="coin__num">{{ thousands(p.coins) }}</text>
          <text v-if="p.bonus" class="coin__bonus">赠送 {{ thousands(p.bonus) }}</text>
          <text class="coin__price">¥{{ money(p.price) }}</text>
        </view>
      </view>

      <!-- 金币兑余额 -->
      <view class="card">
        <text class="card__title">金币兑余额</text>
        <view class="ex">
          <input
            class="ex__input"
            type="number"
            placeholder="输入金币数量（100 起兑）"
            placeholder-class="ex__ph"
            :value="exchangeCoins"
            @input="exchangeCoins = $event.detail.value"
          />
          <view class="ex__btn" @tap="doExchange">兑换</view>
        </view>
        <text class="ex__hint">100 金币 = 1 元，最少 100 金币起兑</text>
      </view>
      <view class="safe" />
    </scroll-view>

    <view class="footer">
      <view class="footer__left">
        <text class="footer__label">应付</text>
        <text class="footer__price">¥{{ money(selected ? selected.price : 0) }}</text>
      </view>
      <view class="tg-btn footer__btn" :class="{ 'tg-btn--disabled': selectedIndex < 0 || submitting }" @tap="purchase">
        立即购买
      </view>
    </view>
  </view>
</template>

<script>
import { walletApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, confirm } from '@/utils/ui'
import { money, thousands } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      pkgs: [],
      selectedIndex: -1,
      exchangeCoins: '',
      loading: false,
      submitting: false
    }
  },
  computed: {
    myCoins() {
      return this.store.coins || 0
    },
    hotIndex() {
      return this.pkgs.length > 2 ? 2 : 0
    },
    selected() {
      return this.selectedIndex >= 0 ? this.pkgs[this.selectedIndex] : null
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
    async loadAll() {
      this.loading = true
      try {
        const list = await walletApi.coinPackages()
        this.pkgs = list || []
        if (this.pkgs.length) this.selectedIndex = 0
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.loading = false
      }
    },
    async purchase() {
      if (!this.selected) {
        toast('请选择套餐')
        return
      }
      if (this.submitting) return
      this.submitting = true
      const p = this.selected
      try {
        await walletApi.coinPurchase({ coins: Number(p.coins || 0) + Number(p.bonus || 0), price: p.price })
        toast('购买成功')
        try {
          await this.store.fetchProfile()
        } catch (e) {
          /* 忽略 */
        }
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.submitting = false
      }
    },
    async doExchange() {
      const coins = Math.floor(Number(this.exchangeCoins) || 0)
      if (coins < 100) {
        toast('最少 100 金币起兑')
        return
      }
      if (coins > this.myCoins) {
        toast('金币不足')
        return
      }
      const okConfirm = await confirm(`确认使用 ${thousands(coins)} 金币兑换 ${money(coins / 100)} 元余额？`)
      if (!okConfirm) return
      try {
        await walletApi.exchange(coins)
        toast('兑换成功')
        this.exchangeCoins = ''
        try {
          await this.store.fetchProfile()
        } catch (e) {
          /* 忽略 */
        }
      } catch (e) {
        /* 失败已提示 */
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
.hero {
  margin: 20rpx 30rpx 0;
  padding: 44rpx 32rpx;
  border-radius: 16rpx;
  background: #ff731c;
  display: flex;
  flex-direction: column;
}
.hero__label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}
.hero__num {
  margin-top: 12rpx;
  font-size: 72rpx;
  font-weight: bold;
  color: #ffffff;
}
.hero__sub {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}
.section-title {
  margin: 32rpx 30rpx 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.grid {
  margin: 0 30rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.coin {
  position: relative;
  width: calc((100% - 40rpx) / 3);
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  padding: 32rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  border: 4rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.coin:nth-child(3n) {
  margin-right: 0;
}
.coin.is-active {
  border-color: #ff731c;
  background: #fff6f1;
}
.coin__hot {
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  padding: 2rpx 12rpx;
  border-radius: 0 16rpx 0 16rpx;
  background: #fe742f;
  color: #ffffff;
  font-size: 20rpx;
}
/* charge_coin_item_view.xml：title（果豆数）14sp=28rpx bold #ffe47315；
   newPrice（价格）18sp=36rpx bold #ff30302F */
.coin__num {
  font-size: 28rpx;
  font-weight: bold;
  color: #e47315;
}
.coin__bonus {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #ff731c;
}
.coin__price {
  margin-top: 14rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #30302f;
}
.card {
  margin: 12rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.card__title {
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.ex {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ex__input {
  flex: 1;
  min-width: 0;
  height: 96rpx;
  padding: 0 40rpx;
  border-radius: 16rpx;
  background: #f6f6f6;
  font-size: 28rpx;
  color: #181716;
}
.ex__ph {
  color: #9e9e9e;
}
.ex__btn {
  margin-left: 20rpx;
  height: 96rpx;
  padding: 0 44rpx;
  border-radius: 30rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ex__hint {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}
.footer {
  padding: 16rpx 30rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.footer__left {
  display: flex;
  flex-direction: column;
  margin-right: 24rpx;
}
.footer__label {
  font-size: 22rpx;
  color: #9e9e9e;
}
.footer__price {
  font-size: 34rpx;
  font-weight: bold;
  color: #ff731c;
}
.footer__btn {
  flex: 1;
  background: #ff731c;
  border-radius: 30rpx;
}
.safe {
  height: 40rpx;
}
</style>
