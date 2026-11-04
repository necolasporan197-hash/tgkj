<template>
  <view class="page">
    <TgNavBar title="解锁记录" />
    <scroll-view scroll-y class="scroll">
      <!-- fragment_unlock_log.xml：tv_unlock_log_tip 灰底提示条（11sp=22rpx #9797a1、上下 padding 7dip=14rpx、居中） -->
      <text class="tip">- Tip:仅保留30日内产生的解锁记录 -</text>

      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="list.length">
        <!-- item_unlock_log.xml / layout_unlock_record_preview_static.xml：头像 75dip + 昵称行 + 标签流（8dip 上距）+ 解锁时间行（8dip 上距，前置时钟图标） -->
        <view v-for="r in list" :key="r.id" class="rcard" @tap="goUser(r.target_id)">
          <image class="rcard__avatar" :src="avatarOf(r.avatar)" mode="aspectFill" />
          <view class="rcard__main">
            <text class="rcard__name">{{ r.nickname || '用户已注销' }}</text>
            <view class="rcard__tags">
              <text class="rcard__tag">{{ typeText(r.unlock_type) }}</text>
              <text class="rcard__tag">消耗 {{ thousands(r.coins || 0) }} 金币</text>
            </view>
            <view class="rcard__timerow">
              <view class="rcard__clock" />
              <text class="rcard__time">解锁时间：{{ formatTime(r.created_at) }}</text>
            </view>
          </view>
        </view>
        <view class="safe" />
      </block>

      <TgEmpty v-else text="还没有解锁记录" />
    </scroll-view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { nav } from '@/utils/ui'
import { formatTime, thousands } from '@/utils/format'

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
    formatTime,
    thousands,
    async load() {
      this.loading = true
      try {
        this.list = (await userApi.unlockRecords()) || []
      } catch (e) {
        this.list = []
      } finally {
        this.loading = false
      }
    },
    avatarOf(a) {
      if (a) return mediaUrl(a)
      return '/static/official/bg_avatar_woman.png'
    },
    typeText(t) {
      return t === 'album' ? '解锁私密相册' : '查看微信号'
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
  background: #ffffff;
}
.scroll {
  flex: 1;
  height: 0;
}
.safe {
  height: 40rpx;
}
/* fragment_unlock_log.xml：提示条 11sp #9797a1、底 #f5f5f5、上下 padding 7dip、居中 */
.tip {
  display: block;
  padding: 14rpx 0;
  background: #f5f5f5;
  text-align: center;
  font-size: 22rpx;
  color: #9797a1;
}
/* item_unlock_log.xml：整行 minHeight 99dip=198rpx、padding 12/15dip、底部 #f0f0f0 分割线 */
.rcard {
  min-height: 198rpx;
  padding: 24rpx 30rpx;
  background: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.rcard__avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background: #f0f1f2;
}
.rcard__main {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.rcard__name {
  max-width: 380rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.rcard__tags {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.rcard__tag {
  height: 36rpx;
  padding: 0 14rpx;
  margin-right: 16rpx;
  border-radius: 10rpx;
  background: #f3f3f3;
  font-size: 22rpx;
  color: #61605f;
  display: flex;
  align-items: center;
}
.rcard__tag:last-child {
  margin-right: 0;
}
.rcard__timerow {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* 官方 drawable ic_unlock_time 为 12dip 矢量时钟（#9e9e9e），无 PNG 提取，故以 CSS 等价绘制 */
.rcard__clock {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  margin-right: 8rpx;
  border: 2rpx solid #9e9e9e;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
}
.rcard__clock::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 3rpx;
  width: 2rpx;
  height: 7rpx;
  margin-left: -1rpx;
  background: #9e9e9e;
}
.rcard__clock::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7rpx;
  height: 2rpx;
  margin-top: -1rpx;
  background: #9e9e9e;
}
.rcard__time {
  font-size: 22rpx;
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
