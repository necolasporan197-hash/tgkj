<template>
  <view class="page">
    <TgNavBar title="谁看过我" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="list.length">
        <view v-for="u in list" :key="u.id" class="uitem">
          <!-- tv_date：居中日期行 12sp #9e9e9e -->
          <text class="uitem__date">{{ timeAgo(u.visitAt) }}</text>
          <view class="uitem__card" @tap="goUser(u.id)">
            <image class="uitem__avatar" :src="avatarOf(u)" mode="aspectFill" />
            <view class="uitem__info">
              <view class="uitem__row">
                <text class="uitem__name">{{ u.nickname }}</text>
                <image v-if="u.isVip" class="uitem__rzbs" src="/static/official/pc_tags_vip_n.png" />
              </view>
              <!-- desc：13sp #9e9e9e，marginTop 13dip -->
              <text class="uitem__desc">刚刚查看过你的资料哦，快去和Ta聊聊~</text>
            </view>
          </view>
        </view>
        <view class="safe" />
      </block>

      <TgEmpty v-else text="还没有人看过你的主页" />
    </scroll-view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { nav } from '@/utils/ui'
import { timeAgo, ageOf, formatDistance } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      list: [],
      loading: true
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
    timeAgo,
    async load() {
      this.loading = true
      try {
        this.list = (await userApi.visitors()) || []
      } catch (e) {
        this.list = []
      } finally {
        this.loading = false
      }
    },
    avatarOf(u) {
      const a = u && u.avatar
      if (a) return mediaUrl(a)
      return u && u.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    ageText(u) {
      const v = ageOf(u)
      return v ? `${v}岁` : '年龄保密'
    },
    distText(d) {
      return formatDistance(d) || '未知距离'
    },
    goUser(id) {
      if (!id) return
      nav(`/pages/user/detail?id=${id}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f7f7;
}
.scroll {
  flex: 1;
  height: 0;
}
.safe {
  height: 40rpx;
}
/* item_user_visit.xml：根 #f7f7f7；tv_date 12sp #9e9e9e 居中，marginTop 12dip=24rpx；
   view_bg 白底 83dip=166rpx、圆角 10dip=20rpx、左右 margin 10dip=20rpx */
.uitem {
  padding-top: 24rpx;
}
.uitem__date {
  display: block;
  text-align: center;
  font-size: 24rpx;
  line-height: 34rpx;
  color: #9e9e9e;
}
.uitem__card {
  height: 166rpx;
  margin: 24rpx 20rpx 0;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.uitem__avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background: #f0f1f2;
}
.uitem__info {
  flex: 1;
  min-width: 0;
  margin-left: 36rpx;
  display: flex;
  flex-direction: column;
}
.uitem__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.uitem__name {
  max-width: 360rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* vip：rzbs 徽标尺寸对齐 rnrz 34×14dip */
.uitem__rzbs {
  width: 68rpx;  /* pc_tags_vip_n 34.0dip×14.0dip */
  height: 28rpx;
  margin-left: 10rpx;
}
/* desc：13sp #9e9e9e，marginTop 13dip=26rpx */
.uitem__desc {
  margin-top: 26rpx;
  font-size: 26rpx;
  color: #9e9e9e;
}
.loading {
  padding: 60rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 26rpx;
  color: $tg-text-tertiary;
}
</style>
