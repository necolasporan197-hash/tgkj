<template>
  <view class="page">
    <TgNavBar title="会员中心" />
    <scroll-view scroll-y class="scroll">
      <!-- 会员状态卡 -->
      <view class="hero">
        <view class="hero__badge">VIP</view>
        <text class="hero__title">{{ isVip ? '尊贵会员' : '开通会员 · 解锁全部特权' }}</text>
        <text v-if="isVip && expireAt" class="hero__sub">有效期至 {{ formatTime(expireAt) }}</text>
        <text v-else class="hero__sub">尊享 5 大专属特权，畅享无阻</text>
      </view>

      <!-- 套餐 -->
      <view class="section-title">选择套餐</view>
      <view class="pkgs">
        <view
          v-for="p in packages"
          :key="p.id"
          class="pkg"
          :class="{ 'is-active': selectedId === p.id }"
          @tap="select(p)"
        >
          <text v-if="p.tag" class="pkg__tag">{{ p.tag }}</text>
          <text class="pkg__name">{{ p.name }}</text>
          <view class="pkg__price-row">
            <text class="pkg__unit">¥</text>
            <text class="pkg__price">{{ money(p.price) }}</text>
          </view>
          <text v-if="p.origin_price" class="pkg__origin">¥{{ money(p.origin_price) }}</text>
        </view>
      </view>

      <!-- 特权 -->
      <view class="section-title">会员特权</view>
      <view class="privs">
        <view v-for="(pr, i) in privileges" :key="i" class="priv">
          <view class="priv__icon">
            <image v-if="privIcon(pr)" class="priv__img" :src="privIcon(pr)" />
            <text v-else class="priv__emoji">{{ privEmoji(i) }}</text>
          </view>
          <text class="priv__title">{{ pr.title }}</text>
          <text class="priv__desc">{{ pr.desc }}</text>
        </view>
      </view>

      <!-- 开通记录入口 -->
      <view class="entry" @tap="goRecords">
        <text class="entry__text">我的开通记录</text>
        <text class="entry__arrow">›</text>
      </view>
      <view class="safe" />
    </scroll-view>

    <view class="footer">
      <view class="tg-btn footer__btn" :class="{ 'tg-btn--disabled': !selectedId || submitting }" @tap="purchase">
        {{ isVip ? '立即续费' : '立即开通' }}
      </view>
    </view>
  </view>
</template>

<script>
import { vipApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, nav } from '@/utils/ui'
import { money, formatTime } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      packages: [],
      privileges: [],
      selectedId: 0,
      isVip: false,
      expireAt: '',
      loading: false,
      submitting: false
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
    privIcon(pr) {
      const f = pr && pr.icon ? String(pr.icon) : ''
      return /\.(png|jpg|jpeg)$/i.test(f) ? `/static/official/${f}` : ''
    },
    privEmoji(i) {
      const arr = ['👀', '🖼️', '💬', '📣', '✨']
      return arr[i % arr.length]
    },
    async loadAll() {
      this.loading = true
      try {
        const [pkgs, privs, status] = await Promise.all([
          vipApi.packages(),
          vipApi.privileges(),
          vipApi.status()
        ])
        this.packages = pkgs || []
        this.privileges = privs || []
        if (status) {
          this.isVip = !!status.isVip
          this.expireAt = status.expireAt || ''
          if (status.privileges && status.privileges.length) this.privileges = status.privileges
        }
        if (this.packages.length) this.selectedId = this.packages[0].id
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.loading = false
      }
    },
    select(p) {
      this.selectedId = p.id
    },
    goRecords() {
      nav('/pages/wallet/transactions')
    },
    async purchase() {
      if (!this.selectedId) {
        toast('请选择套餐')
        return
      }
      if (this.submitting) return
      this.submitting = true
      try {
        const res = await vipApi.purchase({ packageId: this.selectedId })
        toast(this.isVip ? '续费成功' : '开通成功')
        try {
          await this.store.fetchProfile()
        } catch (e) {
          /* 忽略 */
        }
        const status = await vipApi.status()
        this.isVip = !!status.isVip
        this.expireAt = status.expireAt || (res && res.expireAt) || ''
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
.hero {
  margin: 20rpx 30rpx 0;
  padding: 44rpx 32rpx;
  border-radius: 16rpx;
  background: #4e271b;
  display: flex;
  flex-direction: column;
}
.hero__badge {
  align-self: flex-start;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: #e7b268;
  color: #5a3d10;
  font-size: 20rpx;
  font-weight: bold;
}
.hero__title {
  margin-top: 20rpx;
  font-size: 38rpx;
  font-weight: bold;
  color: #f6e3c4;
}
.hero__sub {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: rgba(246, 227, 196, 0.75);
}
.section-title {
  margin: 32rpx 30rpx 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.pkgs {
  margin: 0 30rpx;
  display: flex;
  flex-direction: row;
}
.pkg {
  position: relative;
  flex: 1;
  margin-right: 20rpx;
  padding: 32rpx 0;
  border-radius: 32rpx;
  background: #f8f8f8;
  border: 4rpx solid #eeeeee;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pkg:last-child {
  margin-right: 0;
}
.pkg.is-active {
  border-color: #fe742f;
  background: #fef6ec;
}
.pkg__tag {
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  padding: 2rpx 12rpx;
  border-radius: 0 16rpx 0 16rpx;
  background: #ff842f;
  color: #ffffff;
  font-size: 20rpx;
}
.pkg__name {
  font-size: 28rpx;
  color: #e47315;
}
.pkg__price-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  margin-top: 16rpx;
  color: #30302f;
}
.pkg__unit {
  font-size: 22rpx;
  margin-bottom: 6rpx;
}
.pkg__price {
  font-size: 36rpx;
  font-weight: bold;
}
.pkg__origin {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #a08b6b;
  text-decoration: line-through;
}
.privs {
  margin: 0 30rpx;
  padding: 24rpx 12rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.priv {
  width: 50%;
  padding: 20rpx 12rpx;
  display: flex;
  flex-direction: column;
}
.priv__icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: #fff4ec;
  display: flex;
  align-items: center;
  justify-content: center;
}
.priv__img {
  width: 44rpx;
  height: 44rpx;
}
.priv__emoji {
  font-size: 36rpx;
}
.priv__title {
  margin-top: 16rpx;
  font-size: 26rpx;
  font-weight: bold;
  color: #896a37;
}
.priv__desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #b1aba0;
  line-height: 32rpx;
}
.entry {
  margin: 24rpx 30rpx 0;
  height: 104rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.entry__text {
  font-size: 30rpx;
  color: #30302f;
}
.entry__arrow {
  font-size: 40rpx;
  color: #b9b9b9;
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
