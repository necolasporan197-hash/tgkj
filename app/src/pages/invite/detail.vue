<template>
  <view class="page">
    <TgNavBar title="邀约详情">
      <template #right>
        <image class="nav-report" src="/static/official/ic_profile_report.png" @tap="report" />
      </template>
    </TgNavBar>

    <scroll-view scroll-y class="scroll">
      <block v-if="detail.id">
        <!-- 封面 186dip -->
        <view class="hero">
          <image v-if="coverUrl" class="hero__cover" :src="coverUrl" mode="aspectFill" />
          <view v-else class="hero__cover hero__cover--empty" />
          <view class="hero__hot">
            <image class="hero__hot-bg" src="/static/official/ic_hot_tag1.png" />
            <text class="hero__hot-text">热度·{{ detail.hot || 1 }}</text>
          </view>
        </view>

        <!-- 卡片（radius 12dip，marginTop 162dip 与封面叠加） -->
        <view class="card">
          <!-- 用户信息 -->
          <view class="uinfo">
            <image class="uinfo__avatar" :src="avatarOf(detail.author)" mode="aspectFill" @tap="goUser(detail.author)" />
            <view class="uinfo__hm">
              <view class="uinfo__row">
                <text class="uinfo__name">{{ detail.author && detail.author.nickname }}</text>
                <image v-if="detail.author && detail.author.auditStatus === 'approved'" class="uinfo__rz" src="/static/official/rzbs.png" />
              </view>
              <view class="uinfo__meta">
                <image class="uinfo__sex" :src="sexIcon(detail.author)" />
                <text class="uinfo__age">{{ ageOf(detail.author) }}</text>
                <text class="uinfo__time">{{ timeAgo(detail.createdAt) }}</text>
              </view>
            </view>
          </view>

          <!-- 信息块 #f7f7f7 圆角 10dip -->
          <view class="info">
            <view class="info__row">
              <image class="info__icon" src="/static/official/ic_bmxq_zt.png" />
              <text class="info__label">主题：</text>
              <text class="info__value info__value--ml">{{ detail.theme }}</text>
            </view>
            <view class="info__row info__row--top">
              <image class="info__icon info__icon--top" src="/static/official/ic_bmxq_xq.png" />
              <text class="info__label">详情：</text>
              <text class="info__value info__value--ml">{{ detail.content }}</text>
            </view>
            <view v-if="detail.eventDate" class="info__row">
              <image class="info__icon" src="/static/official/ic_bmxq_time.png" />
              <text class="info__label">日期：</text>
              <text class="info__value info__value--ml">{{ detail.eventDate }}</text>
            </view>
            <view v-if="detail.city" class="info__row">
              <image class="info__icon" src="/static/official/ic_bmxq_city.png" />
              <text class="info__label">城市：</text>
              <text class="info__value info__value--ml">{{ detail.city }}</text>
            </view>
            <view class="info__row info__row--top">
              <image class="info__icon info__icon--top" src="/static/official/ic_bmxq_ybm.png" />
              <text class="info__label">已报名：</text>
              <view class="joins">
                <image
                  v-for="j in detail.joins"
                  :key="j.id"
                  class="joins__avatar"
                  :src="avatarOf(j)"
                  mode="aspectFill"
                  @tap="goUser(j)"
                />
                <text v-if="!detail.joins || !detail.joins.length" class="joins__empty">暂无</text>
              </view>
            </view>
          </view>
        </view>

        <view class="pad" />
      </block>

      <view v-else-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
    </scroll-view>

    <!-- 报名按钮 309×50dip 圆角 15dip -->
    <view v-if="detail.id" class="foot">
      <view
        class="foot__btn"
        :class="{ 'is-on': canJoin }"
        @tap="join"
      >
        {{ detail.joined ? '已报名' : '报名' }}
      </view>
    </view>

    <TgInviteRules v-if="rulesVisible" :rules="rules" @close="rulesVisible = false" />
  </view>
</template>

<script>
import { inviteEventApi, reportApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast } from '@/utils/ui'
import { ageOf, timeAgo } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      id: 0,
      detail: {},
      loading: true,
      rulesVisible: false,
      rules: []
    }
  },
  computed: {
    coverUrl() {
      const imgs = this.detail.images || []
      return imgs.length ? mediaUrl(imgs[0]) : ''
    },
    canJoin() {
      return !!this.detail.id && !this.detail.joined
    }
  },
  onLoad(opt) {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.id = Number((opt && opt.id) || 0)
    this.load()
  },
  methods: {
    ageOf,
    timeAgo,
    mediaUrl,
    avatarOf(u) {
      return (u && mediaUrl(u.avatar)) || '/static/official/bg_avatar_woman.png'
    },
    sexIcon(u) {
      return u && u.gender === 2 ? '/static/official/ic_female.png' : '/static/official/ic_male.png'
    },
    async load() {
      if (!this.id) {
        this.loading = false
        return
      }
      this.loading = true
      try {
        this.detail = (await inviteEventApi.detail(this.id)) || {}
      } catch (e) {
        this.detail = {}
      } finally {
        this.loading = false
      }
    },
    goUser(u) {
      if (u && u.id) uni.navigateTo({ url: `/pages/user/detail?id=${u.id}` })
    },
    async join() {
      if (!this.detail.id) return
      if (this.detail.joined) {
        toast('你已报名该邀约')
        return
      }
      try {
        await inviteEventApi.join(this.detail.id)
        toast('报名成功')
        this.load()
      } catch (e) {
        /* 已提示 */
      }
    },
    async report() {
      if (!this.detail.id) return
      try {
        const reasons = (await reportApi.reasons()) || []
        uni.showActionSheet({
          itemList: reasons,
          success: async (r) => {
            try {
              await inviteEventApi.report(this.detail.id, { reason: reasons[r.tapIndex] })
              toast('举报已提交，我们会尽快处理')
            } catch (e) {
              /* 已提示 */
            }
          }
        })
      } catch (e) {
        /* 忽略 */
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
.pad {
  height: 200rpx;
}
.nav-report {
  width: 44rpx;
  height: 44rpx;
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

/* ---- 封面 186dip ---- */
.hero {
  position: relative;
  width: 100%;
  height: 372rpx;
}
.hero__cover {
  width: 100%;
  height: 372rpx;
  display: block;
}
.hero__cover--empty {
  background: #ededed;
}
.hero__hot {
  position: absolute;
  left: 30rpx;
  top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.hero__hot-bg {
  width: 96rpx;
  height: 36rpx;
}
.hero__hot-text {
  position: absolute;
  left: 40rpx;
  top: 0;
  height: 36rpx;
  line-height: 36rpx;
  font-size: 22rpx;
  color: #ffffff;
}

/* ---- 卡片 ---- */
.card {
  position: relative;
  margin: -48rpx 12rpx 0;
  border-radius: 24rpx;
  background: #ffffff;
  padding-bottom: 40rpx;
}
.uinfo {
  position: relative;
  margin: 40rpx 36rpx 0;
  height: 80rpx;
}
.uinfo__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: $tg-bg-gray;
}
.uinfo__hm {
  position: absolute;
  left: 100rpx;
  top: 0;
}
.uinfo__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.uinfo__name {
  font-size: 30rpx;
  font-weight: bold;
  color: #595959;
}
.uinfo__rz {
  width: 28rpx;
  height: 28rpx;
  margin-left: 10rpx;
}
.uinfo__meta {
  margin-top: 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.uinfo__sex {
  width: 20rpx;
  height: 20rpx;
}
.uinfo__age {
  margin-left: 4rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}
.uinfo__time {
  margin-left: 10rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}

/* ---- 信息块 ---- */
.info {
  margin: 36rpx 16rpx 0;
  padding: 40rpx 28rpx;
  border-radius: 20rpx;
  background: #f7f7f7;
}
.info__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.info__row--top {
  align-items: flex-start;
}
.info__row + .info__row {
  margin-top: 36rpx;
}
.info__icon {
  width: 28rpx;
  height: 28rpx;
}
.info__icon--top {
  margin-top: 8rpx;
}
.info__label {
  margin-left: 18rpx;
  font-size: 26rpx;
  font-weight: bold;
  color: #9e9e9e;
}
.info__value {
  font-size: 26rpx;
  font-weight: bold;
  color: #30302f;
}
.info__value--ml {
  margin-left: 20rpx;
  flex: 1;
}
.joins {
  margin-left: 16rpx;
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}
.joins__avatar {
  width: 48rpx;
  height: 48rpx;
  margin: 0 14rpx 8rpx 0;
  border-radius: 24rpx;
  background: $tg-bg-gray;
}
.joins__empty {
  font-size: 26rpx;
  color: #9e9e9e;
}

/* ---- 报名按钮 ---- */
.foot {
  flex-shrink: 0;
  padding: 16rpx 0 calc(78rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}
.foot__btn {
  width: 618rpx;
  height: 100rpx;
  border-radius: 30rpx;
  background: #ffcdb6;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.foot__btn.is-on {
  background: #ff731c;
}
</style>
