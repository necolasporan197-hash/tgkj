<template>
  <view class="page">
    <TgNavBar title="邀请好友" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else>
        <!-- 邀请码主卡片 -->
        <view class="hero">
          <text class="hero__label">我的专属邀请码</text>
          <text class="hero__code">{{ info.inviteCode || '——' }}</text>
          <view class="hero__copy" @tap="copyCode">复制邀请码</view>
          <text v-if="info.tip" class="hero__tip">{{ info.tip }}</text>
        </view>

        <!-- 统计 -->
        <view class="stats">
          <view class="stats__item">
            <text class="stats__num">{{ info.inviteCount || 0 }}</text>
            <text class="stats__label">已邀请人数</text>
          </view>
          <view class="stats__line" />
          <view class="stats__item">
            <text class="stats__num">{{ thousands(info.totalCoins || 0) }}</text>
            <text class="stats__label">累计获得金币</text>
          </view>
        </view>

        <!-- 操作 -->
        <view class="actions">
          <view class="tg-btn actions__main" @tap="onInvite">立即邀请</view>
          <view class="tg-btn tg-btn--plain actions__sub" @tap="savePoster">保存海报</view>
        </view>

        <!-- 入口 -->
        <view class="list">
          <view class="sitem" @tap="go('/pages/invite/ranking')">
            <view class="sitem__icon sitem__icon--rank">榜</view>
            <text class="sitem__label">邀请排行榜</text>
            <image class="sitem__arrow" src="/static/official/ic_me_arrow_n.png" />
          </view>
          <view class="sitem" @tap="go('/pages/invite/records')">
            <view class="sitem__icon sitem__icon--rec">录</view>
            <text class="sitem__label">邀请记录</text>
            <image class="sitem__arrow" src="/static/official/ic_me_arrow_n.png" />
          </view>
        </view>

        <!-- 规则 -->
        <view class="rules">
          <text class="rules__title">邀请规则</text>
          <view v-for="(r, i) in rules" :key="i" class="rules__item">
            <text class="rules__dot">{{ i + 1 }}</text>
            <text class="rules__text">{{ r }}</text>
          </view>
        </view>
        <view class="safe" />
      </block>
    </scroll-view>
  </view>
</template>

<script>
import { inviteApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, copy, nav } from '@/utils/ui'
import { thousands } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      loading: true,
      info: {}
    }
  },
  computed: {
    rules() {
      if (Array.isArray(this.info.rules) && this.info.rules.length) return this.info.rules
      return [
        `每成功邀请 1 位好友注册，奖励 ${this.info.rewardPerInvite || 1000} 金币`,
        '好友完成注册并绑定邀请码后奖励自动到账',
        '邀请奖励金币可直接用于解锁与提现兑换',
        '禁止刷量作弊，违规将扣除全部奖励'
      ]
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.load()
  },
  methods: {
    thousands,
    async load() {
      this.loading = true
      try {
        this.info = (await inviteApi.info()) || {}
      } catch (e) {
        this.info = {}
      } finally {
        this.loading = false
      }
    },
    copyCode() {
      if (!this.info.inviteCode) {
        toast(this.info.tip || '完成实名认证后即可获得专属邀请码')
        return
      }
      copy(this.info.inviteCode)
    },
    onInvite() {
      if (!this.info.inviteCode) {
        toast(this.info.tip || '完成实名认证后即可邀请好友')
        return
      }
      try {
        if (uni && typeof uni.share === 'function') {
          uni.share({
            provider: 'weixin',
            scene: 'WXSceneSession',
            type: 0,
            title: '糖果空间',
            summary: `我的邀请码：${this.info.inviteCode}`,
            href: '',
            success: () => {},
            fail: () => toast('请点击右上角分享给好友')
          })
          return
        }
      } catch (e) {
        /* 忽略，走降级 */
      }
      toast('请点击右上角分享给好友')
    },
    savePoster() {
      toast('海报生成中…')
    },
    go(url) {
      nav(url)
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
.hero {
  margin: 24rpx 30rpx 0;
  padding: 44rpx 30rpx 36rpx;
  border-radius: 24rpx;
  background: #ff731c;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero__label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}
.hero__code {
  margin-top: 16rpx;
  font-size: 72rpx;
  font-weight: bold;
  letter-spacing: 8rpx;
  color: #ffffff;
}
.hero__copy {
  margin-top: 24rpx;
  height: 64rpx;
  padding: 0 48rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #ff731c;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero__tip {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}
.stats {
  margin: 24rpx 30rpx 0;
  padding: 32rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.stats__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stats__num {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff731c;
}
.stats__label {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.stats__line {
  width: 2rpx;
  height: 60rpx;
  background: #f0f1f2;
}
.actions {
  margin: 24rpx 30rpx 0;
  display: flex;
  flex-direction: row;
}
.actions__main {
  flex: 1;
  height: 100rpx;
  line-height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}
.actions__sub {
  width: 220rpx;
  margin-left: 24rpx;
}
.list {
  margin: 24rpx 30rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  overflow: hidden;
}
.sitem {
  height: 104rpx;
  padding: 0 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f5f6f8;
}
.sitem:last-child {
  border-bottom: none;
}
.sitem__icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 24rpx;
  border-radius: 12rpx;
  color: #ffffff;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sitem__icon--rank {
  background: #ffb04b;
}
.sitem__icon--rec {
  background: #4cd672;
}
.sitem__label {
  flex: 1;
  font-size: 30rpx;
  color: $tg-text-primary;
}
.sitem__arrow {
  width: 24rpx;
  height: 24rpx;
}
.rules {
  margin: 24rpx 30rpx 0;
  padding: 28rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.rules__title {
  font-size: 30rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.rules__item {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.rules__dot {
  width: 32rpx;
  height: 32rpx;
  margin-right: 16rpx;
  border-radius: 16rpx;
  background: #fff1e9;
  color: #ff731c;
  font-size: 20rpx;
  text-align: center;
  line-height: 32rpx;
  flex-shrink: 0;
}
.rules__text {
  flex: 1;
  font-size: 26rpx;
  line-height: 38rpx;
  color: $tg-text-secondary;
}
.loading {
  padding: 120rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 26rpx;
  color: $tg-text-tertiary;
}
</style>
