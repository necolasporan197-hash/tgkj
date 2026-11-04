<template>
  <view class="page">
    <TgNavBar :title="meta.name || '提交认证'" />
    <scroll-view scroll-y class="scroll">
      <!-- 类型说明 -->
      <view class="intro">
        <view class="intro__icon">{{ typeEmoji }}</view>
        <view class="intro__info">
          <text class="intro__name">{{ meta.name || '认证' }}</text>
          <text class="intro__desc">{{ meta.desc || '请按提示填写并上传资料' }}</text>
        </view>
      </view>

      <!-- 文本表单 -->
      <view v-if="meta.needName || meta.needId" class="card card--form">
        <view v-if="meta.needName" class="field">
          <text class="field__label">真实姓名</text>
          <input
            class="field__input"
            placeholder="请输入真实姓名"
            placeholder-class="field__ph"
            :value="realName"
            @input="realName = $event.detail.value"
          />
        </view>
        <view v-if="meta.needId" class="field">
          <text class="field__label">身份证号</text>
          <input
            class="field__input"
            type="idcard"
            placeholder="请输入身份证号码"
            placeholder-class="field__ph"
            :value="idNumber"
            @input="idNumber = $event.detail.value"
          />
        </view>
      </view>

      <!-- 图片上传 -->
      <view v-if="meta.needImages > 0" class="card">
        <view class="card__head">
          <text class="card__title">上传证件照片</text>
          <text class="card__count">{{ images.length }}/{{ meta.needImages }}</text>
        </view>
        <view class="imgs">
          <view v-for="(img, i) in images" :key="i" class="img">
            <image class="img__pic" :src="mediaUrl(img)" mode="aspectFill" @tap="preview(i)" />
            <view class="img__del" @tap.stop="removeImg(i)">✕</view>
          </view>
          <view v-if="images.length < meta.needImages" class="img img--add" @tap="pickImage">
            <text class="img--add__plus">+</text>
            <text class="img--add__text">上传照片</text>
          </view>
        </view>
        <text class="hint">请上传清晰、完整、无遮挡的照片</text>
      </view>

      <!-- 视频上传 -->
      <view v-if="meta.type === 'video'" class="card">
        <view class="card__head">
          <text class="card__title">上传认证视频</text>
        </view>
        <view v-if="videoUrl" class="video">
          <view class="video__box">
            <text class="video__icon">🎬</text>
            <text class="video__text">视频已上传</text>
          </view>
          <view class="video__del" @tap="videoUrl = ''">删除</view>
        </view>
        <view v-else class="video video--add" @tap="pickVideo">
          <text class="video__icon">＋</text>
          <text class="video__text">点击录制或上传视频</text>
        </view>
        <text class="hint">请录制一段本人出镜的短视频</text>
      </view>
      <view class="safe" />
    </scroll-view>

    <view class="footer">
      <view class="tg-btn footer__btn" :class="{ 'tg-btn--disabled': !canSubmit || submitting }" @tap="submit">
        {{ submitting ? '提交中…' : '提交认证' }}
      </view>
    </view>
  </view>
</template>

<script>
import { verificationApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, back, loading, hideLoading, chooseImage, previewImage } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      vtype: '',
      meta: {},
      realName: '',
      idNumber: '',
      images: [],
      videoUrl: '',
      uploading: false,
      submitting: false
    }
  },
  computed: {
    typeEmoji() {
      const map = { profile: '📝', idcard: '🪪', face: '🙂', video: '🎬', vehicle: '🚗' }
      return map[this.vtype] || '📄'
    },
    canSubmit() {
      const m = this.meta
      if (!m || !m.type) return false
      if (m.needName && !this.realName.trim()) return false
      if (m.needId && !/^\d{15}(\d{2}[0-9Xx])?$/.test(this.idNumber.trim())) return false
      if (m.needImages > 0 && this.images.length < m.needImages) return false
      if (m.type === 'video' && !this.videoUrl) return false
      return true
    }
  },
  onLoad(q) {
    this.vtype = (q && q.type) || ''
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadMeta()
  },
  methods: {
    mediaUrl,
    async loadMeta() {
      try {
        const types = await verificationApi.types()
        this.meta = (types || []).find((t) => t.type === this.vtype) || {}
      } catch (e) {
        /* 失败已提示 */
      }
    },
    preview(i) {
      previewImage(this.images.map((u) => mediaUrl(u)), mediaUrl(this.images[i]))
    },
    removeImg(i) {
      this.images.splice(i, 1)
    },
    async pickImage() {
      if (this.uploading) return
      const remain = this.meta.needImages - this.images.length
      const paths = await chooseImage(remain)
      if (!paths.length) return
      this.uploading = true
      loading('上传中')
      try {
        for (const p of paths) {
          if (this.images.length >= this.meta.needImages) break
          const res = await uploadFile(p, 'image')
          if (res && res.url) this.images.push(res.url)
        }
      } catch (e) {
        toast('上传失败，请重试')
      } finally {
        hideLoading()
        this.uploading = false
      }
    },
    async pickVideo() {
      if (this.uploading) return
      const paths = await chooseImage(1)
      if (!paths.length) return
      this.uploading = true
      loading('上传中')
      try {
        const res = await uploadFile(paths[0], 'video')
        if (res && res.url) this.videoUrl = res.url
      } catch (e) {
        toast('上传失败，请重试')
      } finally {
        hideLoading()
        this.uploading = false
      }
    },
    async submit() {
      if (!this.canSubmit) {
        toast('请完整填写认证资料')
        return
      }
      if (this.submitting) return
      this.submitting = true
      try {
        await verificationApi.submit({
          vtype: this.vtype,
          realName: this.realName.trim(),
          idNumber: this.idNumber.trim(),
          images: this.images,
          videoUrl: this.videoUrl
        })
        toast('提交成功，等待审核')
        setTimeout(() => back(), 900)
      } catch (e) {
        /* 失败已提示 */
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
.intro {
  margin: 20rpx 30rpx 0;
  padding: 28rpx 24rpx;
  border-radius: 16rpx;
  background: #fff1e9;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.intro__icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  background: #ffffff;
  font-size: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.intro__info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.intro__name {
  font-size: 32rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.intro__desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $tg-text-secondary;
  line-height: 34rpx;
}
.card {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card__title {
  font-size: 30rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.card__count {
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
/* activity_idcard_input.xml：字段为 idcard_layout_radius（纯白 + 圆角 26dip=52rpx），
   左右外边距 28dip=56rpx、上下内边距 15dip=30rpx，页底为灰底 */
.card--form {
  margin: 48rpx 56rpx 0;
  padding: 0;
  background: transparent;
}
.field {
  height: 120rpx;
  padding: 0 30rpx;
  border-radius: 52rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 32rpx;
}
.field:last-child {
  margin-bottom: 0;
}
.field__label {
  width: 180rpx;
  font-size: 32rpx;
  color: #303133;
}
.field__input {
  flex: 1;
  min-width: 0;
  height: 120rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #181716;
}
.field__ph {
  color: $tg-text-placeholder;
}
.imgs {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.img {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f0f1f2;
}
.img__pic {
  width: 200rpx;
  height: 200rpx;
}
.img__del {
  position: absolute;
  top: 0;
  right: 0;
  width: 44rpx;
  height: 44rpx;
  border-radius: 0 0 0 12rpx;
  background: rgba(0, 0, 0, 0.55);
  color: #ffffff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img--add {
  border: 2rpx dashed #d9dce0;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.img--add__plus {
  font-size: 56rpx;
  color: #c8c9cc;
  line-height: 56rpx;
}
.img--add__text {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $tg-text-tertiary;
}
.video {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.video--add {
  height: 200rpx;
  border-radius: 12rpx;
  border: 2rpx dashed #d9dce0;
  background: #fafbfc;
  flex-direction: column;
  justify-content: center;
}
.video__box {
  width: 240rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #30302f;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.video__icon {
  font-size: 44rpx;
  color: #ffffff;
}
.video__text {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.video__box .video__text {
  color: rgba(255, 255, 255, 0.9);
}
.video__del {
  margin-left: 24rpx;
  padding: 10rpx 28rpx;
  border-radius: 30rpx;
  border: 2rpx solid $tg-rejected;
  color: $tg-rejected;
  font-size: 24rpx;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: $tg-text-tertiary;
}
.footer {
  padding: 16rpx 30rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
}
.footer__btn {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}
.safe {
  height: 40rpx;
}
</style>
