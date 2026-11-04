<template>
  <view class="page">
    <TgNavBar title="送礼物" />
    <scroll-view scroll-y class="scroll">
      <view class="section-title">选择礼物</view>
      <view class="grid">
        <view
          v-for="g in gifts"
          :key="g.id"
          class="gift"
          :class="{ 'is-active': selectedId === g.id }"
          @tap="select(g)"
        >
          <view class="gift__icon">
            <image v-if="giftIcon(g)" class="gift__img" :src="giftIcon(g)" @error="giftErr(g)" />
            <text v-else class="gift__emoji">{{ giftEmoji(g) }}</text>
          </view>
          <text class="gift__name tg-ellipsis">{{ g.name }}</text>
          <text class="gift__price">{{ thousands(g.coins) }} 金币</text>
        </view>
      </view>

      <!-- 数量 -->
      <view class="card">
        <text class="card__title">赠送数量</text>
        <view class="qty">
          <view class="qty__btn" :class="{ 'is-disabled': count <= 1 }" @tap="minus">－</view>
          <text class="qty__num">{{ count }}</text>
          <view class="qty__btn" @tap="plus">＋</view>
        </view>
        <view class="total" v-if="selected">
          <text class="total__label">合计</text>
          <text class="total__val">{{ thousands(selected.coins * count) }} 金币</text>
        </view>
      </view>
      <view class="safe" />
    </scroll-view>

    <view class="footer">
      <view class="footer__left">
        <text class="footer__label">我的金币：{{ thousands(store.coins) }}</text>
      </view>
      <view class="tg-btn footer__btn" :class="{ 'tg-btn--disabled': !selected || sending }" @tap="send">
        立即赠送
      </view>
    </view>
  </view>
</template>

<script>
import { giftApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav, back } from '@/utils/ui'
import { thousands } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      toId: 0,
      gifts: [],
      selectedId: 0,
      count: 1,
      loading: false,
      sending: false
    }
  },
  computed: {
    selected() {
      return this.gifts.find((g) => g.id === this.selectedId) || null
    }
  },
  onLoad(q) {
    this.toId = Number((q && q.toId) || 0)
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadList()
  },
  methods: {
    thousands,
    giftIcon(g) {
      const icon = g && g.icon ? String(g.icon) : ''
      if (!icon) return ''
      return g._err ? '' : mediaUrl(icon)
    },
    giftErr(g) {
      g._err = true
    },
    giftEmoji(g) {
      const map = { 玫瑰: '🌹', 香水: '🧴', 口红: '💄', 跑车: '🏎️', 游艇: '🛥️' }
      return map[g && g.name] || '🎁'
    },
    select(g) {
      this.selectedId = g.id
    },
    minus() {
      if (this.count > 1) this.count--
    },
    plus() {
      if (this.count < 99) this.count++
    },
    async loadList() {
      this.loading = true
      try {
        this.gifts = (await giftApi.list()) || []
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.loading = false
      }
    },
    async send() {
      if (!this.toId) {
        toast('缺少收礼人')
        return
      }
      if (!this.selected) {
        toast('请选择礼物')
        return
      }
      const total = this.selected.coins * this.count
      if (this.store.coins < total) {
        toast('金币不足，请先充值')
        setTimeout(() => nav('/pages/wallet/coins'), 900)
        return
      }
      if (this.sending) return
      this.sending = true
      try {
        await giftApi.send({ toId: this.toId, giftId: this.selectedId, count: this.count })
        toast('赠送成功')
        try {
          await this.store.fetchProfile()
        } catch (e) {
          /* 忽略 */
        }
        setTimeout(() => back(), 900)
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.sending = false
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
.section-title {
  margin: 24rpx 30rpx 16rpx;
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
.gift {
  width: calc((100% - 40rpx) / 3);
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  padding: 28rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  border: 4rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.gift:nth-child(3n) {
  margin-right: 0;
}
.gift.is-active {
  border-color: #ff731c;
  background: #fff6f1;
}
.gift__icon {
  width: 108rpx;
  height: 108rpx;
  border-radius: 54rpx;
  background: #fff4ec;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.gift__img {
  width: 108rpx;
  height: 108rpx;
}
.gift__emoji {
  font-size: 56rpx;
}
.gift__name {
  margin-top: 16rpx;
  max-width: 180rpx;
  font-size: 28rpx;
  color: #30302f;
}
.gift__price {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #ff731c;
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
.qty {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.qty__btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: #f0f1f2;
  color: #30302f;
  font-size: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty__btn.is-disabled {
  color: #b9b9b9;
  opacity: 0.6;
}
.qty__num {
  min-width: 120rpx;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  color: #30302f;
}
.total {
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.total__label {
  font-size: 28rpx;
  color: #61605f;
}
.total__val {
  font-size: 34rpx;
  font-weight: bold;
  color: #ff731c;
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
  flex: 1;
  min-width: 0;
}
.footer__label {
  font-size: 26rpx;
  color: #61605f;
}
.footer__btn {
  min-width: 280rpx;
  background: #ff731c;
  border-radius: 30rpx;
}
.safe {
  height: 40rpx;
}
</style>
