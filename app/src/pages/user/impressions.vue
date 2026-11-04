<template>
  <view class="page">
    <TgNavBar title="我的印象" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="list.length">
        <!-- layout_info_tags.xml：高 36dip=72rpx、底 #fff8f3、字 13sp=26rpx #ea9659、paddingLeft 22dip=44rpx -->
        <view class="infobar">
          <text class="infobar__text">收到的印象标签越多，越能提升匹配精准度哦~</text>
        </view>
        <view class="card">
          <text class="card__title">收到的印象</text>
          <text class="card__sub">共 {{ total }} 次评价 · {{ list.length }} 个标签</text>
          <view class="tags">
            <view v-for="it in list" :key="it.tag" class="tags__item">
              <text class="tags__name">{{ it.tag }}</text>
              <text class="tags__count">{{ it.c }}</text>
            </view>
          </view>
        </view>
        <view class="safe" />
      </block>

      <TgEmpty v-else text="还没有收到印象" />
    </scroll-view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'

export default {
  data() {
    return {
      store: userStore,
      list: [],
      loading: true
    }
  },
  computed: {
    total() {
      return this.list.reduce((s, it) => s + (Number(it.c) || 0), 0)
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
    async load() {
      this.loading = true
      try {
        this.list = (await userApi.myImpressions()) || []
      } catch (e) {
        this.list = []
      } finally {
        this.loading = false
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
/* layout_info_tags.xml：整条提示，高 36dip=72rpx、底 #fff8f3、paddingLeft 22dip=44rpx */
.infobar {
  height: 72rpx;
  padding-left: 44rpx;
  background: #fff8f3;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.infobar__text {
  font-size: 26rpx;
  color: #ea9659;
}
.card {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.card__title {
  font-size: 30rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.card__sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.tags {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
/* item_tag.xml：h40dip、圆角 22dip、左右 padding 27dip；未选中底 #f8f8f8/描边 #e9ebf0/字 #61605f */
.tags__item {
  margin: 0 20rpx 20rpx 0;
  padding: 0 54rpx;
  height: 80rpx;
  border-radius: 44rpx;
  background: #f8f8f8;
  border: 2rpx solid #e9ebf0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tags__name {
  font-size: 28rpx;
  color: #61605f;
}
.tags__count {
  margin-left: 10rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 20rpx;
  text-align: center;
  line-height: 32rpx;
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
