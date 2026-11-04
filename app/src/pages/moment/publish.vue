<template>
  <view class="page">
    <TgNavBar title="发布动态" />

    <scroll-view scroll-y class="scroll">
      <view class="card">
        <textarea
          v-model="content"
          class="editor"
          placeholder="分享此刻的心情…"
          placeholder-class="editor__ph"
          :maxlength="1000"
          auto-height
        />
        <view class="editor__count"><text class="editor__count-text">{{ content.length }}/1000</text></view>

        <!-- 图片九宫格 -->
        <view class="imgs">
          <view v-for="(img, i) in images" :key="i" class="imgs__cell">
            <image class="imgs__img" :src="mediaUrl(img)" mode="aspectFill" @tap="preview(i)" />
            <image class="imgs__del" src="/static/official/icons_close.png" @tap.stop="removeImage(i)" />
          </view>
          <view v-if="images.length < 9" class="imgs__add" @tap="addImage">
            <image class="imgs__add-icon" src="/static/official/icon_add.png" />
            <text class="imgs__add-text">{{ images.length }}/9</text>
          </view>
        </view>
      </view>

      <!-- 话题 -->
      <view class="card">
        <text class="label">选择话题</text>
        <scroll-view scroll-x class="topics">
          <view
            v-for="t in topics"
            :key="t.id"
            class="topics__item"
            :class="{ 'is-on': topicId === t.id }"
            @tap="toggleTopic(t)"
          >
            <text class="topics__text">#{{ t.name }}#</text>
          </view>
        </scroll-view>
      </view>

      <!-- 城市 -->
      <view class="card city">
        <image class="city__icon" src="/static/official/home_location.png" />
        <text class="city__text">{{ store.city }}</text>
      </view>

      <view class="pad" />
    </scroll-view>

    <view class="bar">
      <view class="bar__btn" :class="{ 'is-disabled': !canSubmit || submitting }" @tap="submit">发布</view>
    </view>
  </view>
</template>

<script>
import { momentApi, discoverApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, loading, hideLoading, back, previewImage, chooseImage } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      content: '',
      images: [],
      topics: [],
      topicId: null,
      submitting: false
    }
  },
  computed: {
    canSubmit() {
      return !!this.content.trim() || this.images.length > 0
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadTopics()
  },
  methods: {
    mediaUrl,
    async loadTopics() {
      try {
        this.topics = (await discoverApi.topics()) || []
      } catch (e) {
        this.topics = []
      }
    },
    toggleTopic(t) {
      this.topicId = this.topicId === t.id ? null : t.id
    },
    async addImage() {
      const remain = 9 - this.images.length
      if (remain <= 0) return
      const paths = await chooseImage(remain)
      if (!paths.length) return
      loading('上传中')
      try {
        for (const p of paths) {
          const r = await uploadFile(p, 'image')
          if (r && r.url) this.images.push(r.url)
        }
      } catch (e) {
        /* 已提示 */
      } finally {
        hideLoading()
      }
    },
    removeImage(i) {
      this.images.splice(i, 1)
    },
    preview(i) {
      const urls = this.images.map((u) => mediaUrl(u))
      previewImage(urls, urls[i])
    },
    async submit() {
      if (this.submitting || !this.canSubmit) return
      this.submitting = true
      try {
        await momentApi.publish({
          content: this.content.trim(),
          images: this.images,
          topicId: this.topicId,
          city: this.store.city,
          mediaType: 'text'
        })
        toast('发布成功，审核通过后展示')
        setTimeout(() => back(), 800)
      } catch (e) {
        /* 已提示 */
      } finally {
        this.submitting = false
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
.editor {
  width: 100%;
  min-height: 500rpx;
  font-size: 28rpx;
  color: #666666;
  line-height: 40rpx;
}
.editor__ph {
  color: #cccccc;
}
.editor__count {
  margin-top: 8rpx;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}
.editor__count-text {
  font-size: 28rpx;
  color: #cccccc;
}

.imgs {
  margin-top: 20rpx;
  display: flex;
  flex-wrap: wrap;
}
.imgs__cell {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin: 0 12rpx 12rpx 0;
}
.imgs__img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: $tg-bg-gray;
}
.imgs__del {
  position: absolute;
  top: -10rpx;
  right: 2rpx;
  width: 40rpx;
  height: 40rpx;
}
.imgs__add {
  width: 200rpx;
  height: 200rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 12rpx;
  background: $tg-bg-gray;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.imgs__add-icon {
  width: 56rpx;
  height: 56rpx;
}
.imgs__add-text {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $tg-text-tertiary;
}

.label {
  font-size: 28rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.topics {
  margin-top: 20rpx;
  white-space: nowrap;
  width: 100%;
}
.topics__item {
  display: inline-block;
  margin-right: 16rpx;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  background: $tg-bg-gray;
}
.topics__item.is-on {
  background: rgba(255, 80, 0, 0.1);
}
.topics__text {
  font-size: 26rpx;
  color: $tg-text-secondary;
}
.topics__item.is-on .topics__text {
  color: $tg-primary;
  font-weight: bold;
}

.city {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.city__icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 12rpx;
}
.city__text {
  font-size: 28rpx;
  color: $tg-text-primary;
}

.bar {
  flex-shrink: 0;
  padding: 16rpx 30rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}
.bar__btn {
  height: 88rpx;
  border-radius: 44rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bar__btn.is-disabled {
  opacity: 0.5;
}
</style>
