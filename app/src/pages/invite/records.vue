<template>
  <view class="page">
    <TgNavBar title="邀请记录" />
    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <view v-if="loading && !list.length" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="list.length">
        <view class="list">
          <view v-for="r in list" :key="r.id" class="row">
            <image class="row__avatar" :src="avatarOf(r)" mode="aspectFill" />
            <view class="row__info">
              <text class="row__name">{{ r.nickname }}</text>
              <text class="row__time">{{ formatTime(r.created_at) }} 注册</text>
            </view>
            <text class="row__coin">+{{ r.reward_coins || 1000 }}</text>
          </view>
        </view>
        <view class="loading">
          <text class="loading__text">{{ finished ? '没有更多了' : '上拉加载更多' }}</text>
        </view>
        <view class="safe" />
      </block>

      <TgEmpty v-else text="还没有邀请记录" btn-text="去邀请" @action="goInvite" />
    </scroll-view>
  </view>
</template>

<script>
import { inviteApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { nav } from '@/utils/ui'
import { formatTime } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      list: [],
      page: 1,
      pageSize: 20,
      loading: false,
      finished: false
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
    async load(reset) {
      if (this.loading) return
      if (reset) {
        this.page = 1
        this.finished = false
      }
      this.loading = true
      try {
        const res = await inviteApi.records({ page: this.page, pageSize: this.pageSize })
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
    },
    goInvite() {
      nav('/pages/invite/invite')
    },
    avatarOf(r) {
      const a = r && r.avatar
      if (a) return mediaUrl(a)
      return r && r.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
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
.list {
  margin: 24rpx 30rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  overflow: hidden;
}
/* item_user_log_amount.xml / invite_detail_item.xml：行高固定 72dip=144rpx */
.row {
  height: 144rpx;
  padding: 0 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f5f6f8;
}
.row:last-child {
  border-bottom: none;
}
/* 官方头像节点 50dip=100rpx，圆形 */
.row__avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  background: #f0f1f2;
}
.row__info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
/* item_invite.xml：昵称 15sp=30rpx bold color_595959 */
.row__name {
  font-size: 30rpx;
  font-weight: bold;
  color: #595959;
}
/* 官方次行 13sp=26rpx */
.row__time {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: $tg-text-tertiary;
}
/* item_user_log_amount.xml：金额 19sp=38rpx */
.row__coin {
  font-size: 38rpx;
  font-weight: bold;
  color: #4cd672;
}
.loading {
  padding: 32rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
</style>
