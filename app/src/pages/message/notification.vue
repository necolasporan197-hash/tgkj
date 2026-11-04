<template>
  <view class="page">
    <TgNavBar title="系统通知" right-text="全部已读" @right="readAll" />

    <!-- message_list_header.xml：消息列表顶部提示条，高 30dip=60rpx、底 #fff6f0、字 12sp=24rpx #ad7955 居中 -->
    <view class="mhead">
      <text class="mhead__text">※请勿通过约会进行不法交易，若被举报核实将封号处理</text>
    </view>

    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <view v-for="n in list" :key="n.id" class="item" @tap="onItem(n)">
        <view class="item__dot" :class="{ 'is-hide': n.is_read }" />
        <view class="item__body">
          <view class="item__row">
            <text class="item__title" :class="{ 'is-unread': !n.is_read }">{{ n.title }}</text>
            <text class="item__time">{{ timeAgo(n.created_at) }}</text>
          </view>
          <text class="item__content">{{ n.content }}</text>
        </view>
      </view>

      <TgEmpty v-if="!loading && !list.length" text="暂无通知" />
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
      <view v-else-if="list.length" class="loading">
        <text class="loading__text">{{ finished ? '没有更多了' : '上拉加载更多' }}</text>
      </view>
      <view class="pad" />
    </scroll-view>
  </view>
</template>

<script>
import { messageApi } from '@/api'
import { userStore } from '@/store/user'
import { timeAgo } from '@/utils/format'

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
    timeAgo,
    async load(reset) {
      if (this.loading) return
      if (reset) {
        this.page = 1
        this.finished = false
      }
      this.loading = true
      try {
        const res = await messageApi.notifications({ page: this.page, pageSize: this.pageSize })
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
    async onItem(n) {
      if (n.is_read) return
      try {
        await messageApi.readNotifications(n.id)
        n.is_read = 1
        this.store.fetchUnread()
      } catch (e) {
        /* 已提示 */
      }
    },
    async readAll() {
      const hasUnread = this.list.some((n) => !n.is_read)
      if (!hasUnread) return
      try {
        await messageApi.readNotifications()
        this.list.forEach((n) => {
          n.is_read = 1
        })
        this.store.fetchUnread()
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
  background: #f9f9f9;
}
.scroll {
  flex: 1;
  height: 0;
}
.pad {
  height: 40rpx;
}
/* message_list_header.xml：高 30dip=60rpx、底 #fff6f0、字 12sp=24rpx #ffad7955 居中 */
.mhead {
  height: 60rpx;
  flex-shrink: 0;
  background: #fff6f0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mhead__text {
  font-size: 24rpx;
  color: #ad7955;
}

.item {
  margin: 20rpx 30rpx 0;
  padding: 24rpx 52rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.item__dot {
  width: 16rpx;
  height: 16rpx;
  margin-top: 10rpx;
  margin-right: 16rpx;
  border-radius: 8rpx;
  background: #ff731c;
  flex-shrink: 0;
}
.item__dot.is-hide {
  background: transparent;
}
.item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.item__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.item__title {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}
.item__title.is-unread {
  font-weight: bold;
}
.item__time {
  font-size: 22rpx;
  color: #9e9e9e;
}
.item__content {
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #61605f;
  line-height: 40rpx;
}
.loading {
  padding: 32rpx 0;
  display: flex;
  justify-content: center;
}
.loading__text {
  font-size: 24rpx;
  color: #9e9e9e;
}
</style>
