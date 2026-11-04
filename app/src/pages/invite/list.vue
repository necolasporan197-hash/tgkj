<template>
  <view class="page">
    <TgNavBar title="邀约" right-text="活动规则" @right="showRules" />

    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <view v-if="loading && !list.length" class="loading"><text class="loading__text">加载中…</text></view>

      <!-- 邀约列表项 —— 对齐官方 item_invite.xml -->
      <view v-for="e in list" :key="e.id" class="iv" @tap="toDetail(e.id)">
        <view class="iv__head">
          <image class="iv__avatar" :src="avatarOf(e.author)" mode="aspectFill" @tap.stop="goUser(e.author)" />
          <view class="iv__hm">
            <view class="iv__row">
              <text class="iv__name">{{ e.author && e.author.nickname }}</text>
              <image v-if="e.author && e.author.auditStatus === 'approved'" class="iv__rz" src="/static/official/rzbs.png" />
            </view>
            <view class="iv__meta">
              <image class="iv__sex" :src="sexIcon(e.author)" />
              <text class="iv__age">{{ ageOf(e.author) }}</text>
              <text class="iv__time">{{ timeAgo(e.createdAt) }}</text>
            </view>
          </view>
          <image class="iv__report" src="/static/official/ic_profile_report.png" @tap.stop="report(e)" />
        </view>

        <text v-if="e.content" class="iv__title">{{ e.content }}</text>

        <view v-if="e.images && e.images.length" class="iv__imgs">
          <image v-for="(img, i) in e.images.slice(0, 3)" :key="i" class="iv__img" :src="mediaUrl(img)" mode="aspectFill" />
        </view>

        <view class="iv__tags">
          <view class="iv__tag">
            <image class="iv__tag-icon" src="/static/official/dt_activity.png" />
            <text class="iv__tag-text">{{ e.theme }}</text>
          </view>
          <view v-if="e.eventDate" class="iv__tag iv__tag--gap">
            <image class="iv__tag-icon" src="/static/official/dt_time.png" />
            <text class="iv__tag-text">{{ e.eventDate }}</text>
          </view>
        </view>

        <view class="iv__hot">
          <view class="iv__hot-tag">
            <image class="iv__hot-bg" src="/static/official/ic_hot_tag1.png" />
            <text class="iv__hot-text">热度·{{ e.hot || 1 }}</text>
          </view>
          <view class="iv__spacer" />
          <view class="iv__join" :class="{ 'is-on': e.joined }" @tap.stop="join(e)">{{ e.joined ? '已报名' : '立即报名' }}</view>
        </view>
        <view class="iv__line" />
      </view>

      <TgEmpty
        v-if="!loading && !list.length"
        text="还没有邀约，快来发起第一个吧"
        btn-text="发布邀约"
        @action="toPost"
      />
      <view v-if="list.length" class="loading">
        <text class="loading__text">{{ finished ? '没有更多了' : '上拉加载更多' }}</text>
      </view>
      <view class="safe" />
    </scroll-view>

    <view class="bar">
      <view class="bar__btn" @tap="toPost">发布邀约</view>
    </view>

    <TgInviteRules v-if="rulesVisible" :rules="rules" @close="rulesVisible = false" />
  </view>
</template>

<script>
import { inviteEventApi, reportApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav } from '@/utils/ui'
import { ageOf, timeAgo } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      list: [],
      page: 1,
      pageSize: 10,
      finished: false,
      loading: false,
      rulesVisible: false,
      rules: []
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadRules()
  },
  onShow() {
    if (this.store.token) this.reload()
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
    async loadRules() {
      try {
        const r = (await inviteEventApi.rules()) || {}
        this.rules = r.rules || []
      } catch (e) {
        this.rules = []
      }
    },
    showRules() {
      if (!this.rules.length) this.loadRules()
      this.rulesVisible = true
    },
    reload() {
      this.page = 1
      this.finished = false
      this.list = []
      this.load()
    },
    async load() {
      if (this.loading || this.finished) return
      this.loading = true
      try {
        const r = (await inviteEventApi.list({ page: this.page, pageSize: this.pageSize, city: this.store.city })) || {}
        const rows = r.list || []
        this.list = this.page === 1 ? rows : this.list.concat(rows)
        this.finished = this.list.length >= (r.total || 0) || rows.length < this.pageSize
      } catch (e) {
        this.finished = true
      } finally {
        this.loading = false
      }
    },
    loadMore() {
      if (this.finished || this.loading) return
      this.page += 1
      this.load()
    },
    toDetail(id) {
      nav(`/pages/invite/detail?id=${id}`)
    },
    toPost() {
      nav('/pages/invite/post')
    },
    goUser(u) {
      if (u && u.id) nav(`/pages/user/detail?id=${u.id}`)
    },
    async join(e) {
      if (e.joined) {
        toast('你已报名该邀约')
        return
      }
      try {
        await inviteEventApi.join(e.id)
        e.joined = true
        e.joinCount = (e.joinCount || 0) + 1
        toast('报名成功')
      } catch (err) {
        /* 已提示 */
      }
    },
    async report(e) {
      try {
        const reasons = (await reportApi.reasons()) || []
        uni.showActionSheet({
          itemList: reasons,
          success: async (r) => {
            try {
              await inviteEventApi.report(e.id, { reason: reasons[r.tapIndex] })
              toast('举报已提交，我们会尽快处理')
            } catch (err) {
              /* 已提示 */
            }
          }
        })
      } catch (err) {
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
.safe {
  height: 40rpx;
}
.loading {
  padding: 40rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 26rpx;
  color: $tg-text-tertiary;
}

/* ---- item_invite.xml 1:1 ---- */
.iv {
  margin: 0 30rpx;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.iv__head {
  position: relative;
  margin-top: 40rpx;
  height: 80rpx;
}
.iv__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: $tg-bg-gray;
}
.iv__hm {
  position: absolute;
  left: 100rpx;
  top: 0;
}
.iv__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.iv__name {
  font-size: 30rpx;
  font-weight: bold;
  color: #595959;
}
.iv__rz {
  width: 28rpx;
  height: 28rpx;
  margin-left: 10rpx;
}
.iv__meta {
  margin-top: 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.iv__sex {
  width: 20rpx;
  height: 20rpx;
}
.iv__age {
  margin-left: 4rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}
.iv__time {
  margin-left: 10rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}
.iv__report {
  position: absolute;
  right: 4rpx;
  top: 0;
  width: 90rpx;
  height: 90rpx;
  padding: 30rpx 20rpx;
  box-sizing: border-box;
}
.iv__title {
  margin: 20rpx 30rpx 0 100rpx;
  font-size: 30rpx;
  color: #30302f;
  line-height: 42rpx;
}
.iv__imgs {
  margin: 20rpx 0 0 100rpx;
  display: flex;
  flex-direction: row;
}
.iv__img {
  width: 160rpx;
  height: 160rpx;
  margin-right: 12rpx;
  border-radius: 12rpx;
  background: $tg-bg-gray;
}
.iv__tags {
  margin: 20rpx 30rpx 30rpx 100rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.iv__tag {
  height: 52rpx;
  padding-right: 18rpx;
  border-radius: 16rpx;
  background: #f8f8f8;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.iv__tag--gap {
  margin-left: 40rpx;
}
.iv__tag-icon {
  width: 18rpx;
  height: 20rpx;
  margin-left: 16rpx;
}
.iv__tag-text {
  margin-left: 8rpx;
  font-size: 24rpx;
  color: #61605f;
}
.iv__hot {
  height: 76rpx;
  margin: 0 30rpx 30rpx 100rpx;
  border-radius: 16rpx;
  background: #fff6f2;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.iv__hot-tag {
  position: relative;
  margin-left: 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.iv__hot-bg {
  width: 96rpx;
  height: 36rpx;
}
.iv__hot-text {
  position: absolute;
  left: 40rpx;
  top: 0;
  height: 36rpx;
  line-height: 36rpx;
  font-size: 22rpx;
  color: #ffffff;
}
.iv__spacer {
  flex: 1;
}
.iv__join {
  width: 128rpx;
  height: 56rpx;
  margin-right: 20rpx;
  border-radius: 20rpx;
  background: linear-gradient(90deg, #ff5e13 0%, #ff8f00 100%);
  color: #ffffff;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.iv__join.is-on {
  background: #ffcdb6;
}
.iv__line {
  height: 1rpx;
  margin-left: 100rpx;
  background: #f0f0f0;
}

.bar {
  flex-shrink: 0;
  padding: 16rpx 30rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}
.bar__btn {
  height: 96rpx;
  border-radius: 30rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
