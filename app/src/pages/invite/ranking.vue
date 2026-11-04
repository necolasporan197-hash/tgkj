<template>
  <view class="page">
    <TgNavBar title="邀请排行榜" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="list.length">
        <!-- item_invite_top_rank.xml：表头 40dip=80rpx，三列各 weight 3、14sp=28rpx #9e9e9e 居中 -->
        <view class="thead">
          <text class="thead__col">用户</text>
          <text class="thead__col">邀请人数（人）</text>
          <text class="thead__col">奖励金额（元）</text>
        </view>

        <!-- item_invite_rank.xml：左组 weight 3（冠军标 18×22dip + 名次 15sp #f53f00 + 头像 30dip + 昵称 13sp #30302f），中/右列各 weight 2、14sp bold #30302f -->
        <view v-for="(u, i) in list" :key="u.id" class="row" :class="{ 'is-me': u.id === store.uid }">
          <view class="row__user">
            <image v-if="i === 0" class="row__top" src="/static/official/pic_yqyl_gj.png" />
            <text class="row__rank">{{ i + 1 }}</text>
            <image class="row__avatar" :src="avatarOf(u)" mode="aspectFill" />
            <text class="row__name tg-ellipsis">{{ u.nickname }}</text>
          </view>
          <text class="row__num">{{ u.inviteCount }}</text>
          <text class="row__reward">{{ thousands(u.coins) }}</text>
        </view>
        <view class="safe" />
      </block>

      <TgEmpty v-else text="暂无排行数据" />
    </scroll-view>
  </view>
</template>

<script>
import { inviteApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { thousands } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      list: [],
      loading: true
    }
  },
  computed: {
    top3() {
      return this.list.slice(0, 3)
    },
    rest() {
      return this.list.slice(3)
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
        this.list = (await inviteApi.ranking()) || []
      } catch (e) {
        this.list = []
      } finally {
        this.loading = false
      }
    },
    medalColor(i) {
      return ['#e7b268', '#c0c4cc', '#cd9b6a'][i] || '#c8c9cc'
    },
    avatarOf(u) {
      const a = u && u.avatar
      if (a) return mediaUrl(a)
      return '/static/official/bg_avatar_woman.png'
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
.thead {
  height: 80rpx;
  padding: 0 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.thead__col {
  flex: 1;
  font-size: 28rpx;
  color: #9e9e9e;
  text-align: center;
}
.row {
  padding: 20rpx 20rpx 8rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.row.is-me {
  background: #fff5ef;
}
.row__user {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.row__top {
  width: 36rpx;
  height: 44rpx;
  margin-right: 4rpx;
  flex-shrink: 0;
}
.row__rank {
  margin: 0 8rpx 0 6rpx;
  font-size: 30rpx;
  color: #f53f00;
  flex-shrink: 0;
}
.row__avatar {
  width: 60rpx;
  height: 60rpx;
  margin-left: 20rpx;
  border-radius: 30rpx;
  background: #f0f1f2;
  flex-shrink: 0;
}
.row__name {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  font-size: 26rpx;
  color: #30302f;
}
.row__num {
  flex: 2;
  font-size: 28rpx;
  font-weight: bold;
  color: #30302f;
  text-align: center;
}
.row__reward {
  flex: 2;
  font-size: 28rpx;
  font-weight: bold;
  color: #30302f;
  text-align: center;
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
