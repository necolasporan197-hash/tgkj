<template>
  <view class="page">
    <TgNavBar title="黑名单" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="list.length">
        <!-- blacklist_item.xml：行高 72dip=144rpx、paddingStart/End 15dip=30rpx；头像 38dip=76rpx + 昵称 #333333（左距 13dip=26rpx，weight 1）+ 实心「移出」钮 62×31dip=124×62rpx、圆角 10dip=20rpx、底 #ff731c、白字 12sp=24rpx -->
        <view v-for="u in list" :key="u.id" class="ucard" @tap="goUser(u.id)">
          <image class="ucard__avatar" :src="avatarOf(u)" mode="aspectFill" />
          <text class="ucard__name">{{ u.nickname }}</text>
          <view class="ucard__btn" @tap.stop="remove(u)">移出</view>
        </view>
        <view class="safe" />
      </block>

      <TgEmpty v-else text="黑名单是空的" />
    </scroll-view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav, confirm } from '@/utils/ui'
import { timeAgo } from '@/utils/format'

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
        this.list = (await userApi.blacklist()) || []
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
    goUser(id) {
      if (!id) return
      nav(`/pages/user/detail?id=${id}`)
    },
    async remove(u) {
      const yes = await confirm(`确定将「${u.nickname}」移出黑名单吗？`)
      if (!yes) return
      try {
        await userApi.removeBlack(u.id)
        this.list = this.list.filter((it) => it.id !== u.id)
        toast('已移出黑名单')
      } catch (e) {
        /* 已提示 */
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
/* blacklist_item.xml：LinearLayout 行高 72dip、paddingLeft/Right 15dip，底部 #f0f0f0 1px 分割线 */
.ucard {
  height: 144rpx;
  padding: 0 30rpx;
  background: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__avatar {
  width: 76rpx;
  height: 76rpx;
  flex-shrink: 0;
  background: #f0f1f2;
}
.ucard__name {
  flex: 1;
  min-width: 0;
  margin-left: 26rpx;
  font-size: 28rpx;
  color: #333333;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* tv_remove：ShapeTextView 62×31dip、圆角 10dip、实心 #ff731c、白字 12sp */
.ucard__btn {
  width: 124rpx;
  height: 62rpx;
  border-radius: 20rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
