<template>
  <view class="page">
    <TgNavBar title="我的动态" />

    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <view v-for="m in list" :key="m.id" class="card" @tap="goDetail(m.id)">
        <view class="card__top">
          <view v-if="m.auditStatus === 'pending'" class="tag tag--pending"><text class="tag__text">审核中</text></view>
          <view v-else-if="m.auditStatus === 'rejected'" class="tag tag--rejected"><text class="tag__text">未通过</text></view>
          <view class="card__spacer" />
          <text class="card__del" @tap.stop="remove(m)">删除</text>
        </view>

        <text v-if="m.content" class="content">{{ m.content }}</text>

        <view v-if="m.images && m.images.length" class="imgs">
          <image v-for="(img, i) in m.images.slice(0, 3)" :key="i" class="imgs__cell" :src="mediaUrl(img)" mode="aspectFill" />
        </view>

        <view v-if="m.topicName" class="topic"><text class="topic__text">#{{ m.topicName }}#</text></view>

        <view class="foot">
          <text class="foot__time">{{ timeAgo(m.createdAt) }}</text>
          <view class="foot__stat">
            <image class="foot__icon" src="/static/official/ic_dt_like_n.png" />
            <text class="foot__num">{{ m.likeCount || 0 }}</text>
          </view>
          <view class="foot__stat">
            <image class="foot__icon" src="/static/official/ic_dt_bq_n.png" />
            <text class="foot__num">{{ m.commentCount || 0 }}</text>
          </view>
        </view>
      </view>

      <TgEmpty
        v-if="!loading && !list.length"
        text="还没有发布过动态"
        btn-text="去发布"
        @action="goPublish"
      />
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
      <view v-else-if="list.length" class="loading">
        <text class="loading__text">{{ finished ? '没有更多了' : '上拉加载更多' }}</text>
      </view>
      <view class="pad" />
    </scroll-view>
  </view>
</template>

<script>
import { momentApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, confirm, nav } from '@/utils/ui'
import { timeAgo } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      list: [],
      page: 1,
      pageSize: 10,
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
    mediaUrl,
    timeAgo,
    async load(reset) {
      if (this.loading) return
      if (reset) {
        this.page = 1
        this.finished = false
      }
      this.loading = true
      try {
        const res = await momentApi.mine({ page: this.page, pageSize: this.pageSize })
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
    goDetail(id) {
      nav(`/pages/moment/detail?id=${id}`)
    },
    goPublish() {
      nav('/pages/moment/publish')
    },
    async remove(m) {
      const ok = await confirm('确定删除这条动态吗？')
      if (!ok) return
      try {
        await momentApi.remove(m.id)
        this.list = this.list.filter((it) => it.id !== m.id)
        toast('已删除')
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
.pad {
  height: 40rpx;
}

.card {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.card__top {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.card__spacer {
  flex: 1;
}
.card__del {
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}
.tag--pending {
  background: rgba(231, 178, 104, 0.15);
}
.tag--pending .tag__text {
  font-size: 22rpx;
  color: #e7b268;
}
.tag--rejected {
  background: rgba(242, 102, 102, 0.12);
}
.tag--rejected .tag__text {
  font-size: 22rpx;
  color: #f26666;
}
.content {
  margin-top: 16rpx;
  font-size: 30rpx;
  color: #30302f;
  line-height: 44rpx;
}
.imgs {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
}
.imgs__cell {
  flex: 1;
  height: 210rpx;
  margin-right: 12rpx;
  border-radius: 10rpx;
  background: $tg-bg-gray;
}
.imgs__cell:last-child {
  margin-right: 0;
}
.topic {
  margin-top: 16rpx;
}
.topic__text {
  height: 52rpx;
  padding: 0 18rpx 0 16rpx;
  border-radius: 16rpx;
  background: #f8f8f8;
  font-size: 24rpx;
  color: #61605f;
  display: flex;
  align-items: center;
}
.foot {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.foot__time {
  flex: 1;
  font-size: 22rpx;
  color: $tg-text-tertiary;
}
.foot__stat {
  margin-left: 32rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.foot__icon {
  width: 32rpx;
  height: 36rpx;
  margin-right: 8rpx;
}
.foot__num {
  font-size: 24rpx;
  color: #828282;
}
.loading {
  padding: 32rpx 0;
  display: flex;
  justify-content: center;
}
.loading__text {
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
</style>
