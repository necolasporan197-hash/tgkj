<template>
  <view class="page">
    <TgNavBar title="投稿中心" />
    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <!-- 投稿须知 -->
      <view class="intro">
        <text class="intro__title">投稿须知</text>
        <text v-for="(n, i) in notices" :key="i" class="intro__item">· {{ n }}</text>
      </view>

      <!-- 投稿表单 -->
      <view class="form">
        <textarea
          v-model="content"
          class="form__area"
          :maxlength="1000"
          placeholder="分享你的故事、经验或见闻，内容需为原创…"
          placeholder-class="form__ph"
        />
        <text class="form__count">{{ content.length }}/1000</text>

        <view class="grid">
          <view v-for="(img, i) in images" :key="i" class="grid__item">
            <image class="grid__img" :src="mediaUrl(img)" mode="aspectFill" />
            <view class="grid__del" @tap="removeImage(i)">×</view>
          </view>
          <view v-if="images.length < 9" class="grid__add" @tap="chooseImages">+</view>
        </view>

        <view class="tg-btn form__submit" :class="{ 'tg-btn--disabled': submitting }" @tap="submit">提交投稿</view>
      </view>

      <!-- 我的投稿 -->
      <text class="section">我的投稿</text>
      <view v-if="loadingMine && !list.length" class="loading"><text class="loading__text">加载中…</text></view>
      <block v-else-if="list.length">
        <view v-for="s in list" :key="s.id" class="scard">
          <view class="scard__head">
            <text class="scard__time">{{ formatTime(s.created_at) }}</text>
            <text class="scard__status" :class="'is-' + s.status">{{ statusText(s.status) }}</text>
          </view>
          <text v-if="s.content" class="scard__content">{{ s.content }}</text>
          <view v-if="s.images && s.images.length" class="scard__imgs">
            <image v-for="(img, i) in s.images.slice(0, 3)" :key="i" class="scard__img" :src="mediaUrl(img)" mode="aspectFill" />
          </view>
          <view v-if="s.status === 'rejected' && s.remark" class="scard__remark">
            <text class="scard__remark-text">驳回原因：{{ s.remark }}</text>
          </view>
        </view>
        <view class="loading">
          <text class="loading__text">{{ finished ? '没有更多了' : '上拉加载更多' }}</text>
        </view>
      </block>
      <TgEmpty v-else text="还没有投稿记录" />
      <view class="safe" />
    </scroll-view>
  </view>
</template>

<script>
import { submissionApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, loading, hideLoading, chooseImage } from '@/utils/ui'
import { formatTime } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      notices: [
        '投稿内容需为原创，禁止搬运、抄袭他人作品',
        '内容审核通过后将有机会在平台展示',
        '请勿发布违规、违法或含联系方式的内容',
        '审核结果可在下方「我的投稿」中查看'
      ],
      content: '',
      images: [],
      submitting: false,
      list: [],
      page: 1,
      pageSize: 10,
      loadingMine: false,
      finished: false
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadMine(true)
  },
  methods: {
    mediaUrl,
    formatTime,
    statusText(s) {
      if (s === 'approved') return '已通过'
      if (s === 'rejected') return '未通过'
      return '审核中'
    },
    removeImage(i) {
      this.images.splice(i, 1)
    },
    async chooseImages() {
      const rest = 9 - this.images.length
      if (rest <= 0) {
        toast('最多上传 9 张')
        return
      }
      const paths = await chooseImage(rest)
      if (!paths.length) return
      loading('上传中…')
      try {
        for (const p of paths) {
          const res = await uploadFile(p, 'image')
          const url = res && res.url ? res.url : res
          if (url) this.images.push(url)
        }
      } catch (e) {
        /* 已提示 */
      } finally {
        hideLoading()
      }
    },
    async submit() {
      if (this.submitting) return
      if (!this.content.trim() && !this.images.length) {
        toast('请填写投稿内容')
        return
      }
      this.submitting = true
      try {
        await submissionApi.submit({ content: this.content.trim(), images: this.images })
        toast('投稿成功，等待审核')
        this.content = ''
        this.images = []
        await this.loadMine(true)
      } catch (e) {
        /* 已提示 */
      } finally {
        this.submitting = false
      }
    },
    async loadMine(reset) {
      if (this.loadingMine) return
      if (reset) {
        this.page = 1
        this.finished = false
      }
      this.loadingMine = true
      try {
        const res = await submissionApi.mine({ page: this.page, pageSize: this.pageSize })
        const arr = (res && res.list) || []
        this.list = reset ? arr : this.list.concat(arr)
        this.finished = arr.length < this.pageSize
        if (!this.finished) this.page++
      } catch (e) {
        this.finished = true
      } finally {
        this.loadingMine = false
      }
    },
    loadMore() {
      if (!this.loadingMine && !this.finished) this.loadMine(false)
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
.intro {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #fff5ee;
  display: flex;
  flex-direction: column;
}
.intro__title {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff731c;
}
.intro__item {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 36rpx;
  color: #a06a4c;
}
.form {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.form__area {
  width: 100%;
  height: 320rpx;
  padding: 12rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
  font-size: 28rpx;
  color: #61605f;
}
.form__ph {
  color: #b9b9b9;
  font-size: 28rpx;
}
.form__count {
  margin-top: 12rpx;
  align-self: flex-end;
  font-size: 28rpx;
  color: #b9b9b9;
}
.form__submit {
  margin-top: 120rpx;
  height: 100rpx;
  line-height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}
.grid {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.grid__item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin: 0 12rpx 12rpx 0;
}
.grid__img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: #f0f1f2;
}
.grid__del {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  font-size: 28rpx;
  line-height: 40rpx;
  text-align: center;
}
.grid__add {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
  color: $tg-text-placeholder;
  font-size: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.section {
  margin: 32rpx 30rpx 0;
  font-size: 28rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.scard {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.scard__head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.scard__time {
  font-size: 22rpx;
  color: $tg-text-tertiary;
}
.scard__status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 18rpx;
}
.scard__status.is-pending {
  color: #ffb04b;
  background: #fff6e8;
}
.scard__status.is-approved {
  color: #4cd672;
  background: #eafaf0;
}
.scard__status.is-rejected {
  color: #f26666;
  background: #fdeeee;
}
.scard__content {
  margin-top: 16rpx;
  font-size: 28rpx;
  line-height: 42rpx;
  color: $tg-text-regular;
}
.scard__imgs {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
}
.scard__img {
  width: 150rpx;
  height: 150rpx;
  margin-right: 12rpx;
  border-radius: 12rpx;
  background: #f0f1f2;
}
.scard__remark {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #fdeeee;
}
.scard__remark-text {
  font-size: 24rpx;
  color: #f26666;
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
