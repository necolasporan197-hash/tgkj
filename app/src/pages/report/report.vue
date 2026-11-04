<template>
  <view class="page">
    <TgNavBar title="举报" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else>
        <!-- 举报原因 -->
        <view class="card">
          <text class="card__title">请选择举报原因</text>
          <view
            v-for="(r, i) in reasons"
            :key="i"
            class="rrow"
            :class="{ 'is-on': selectedIndex === i }"
            @tap="selectReason(i)"
          >
            <text class="rrow__text">{{ r }}</text>
            <image class="rrow__icon" :src="selectedIndex === i ? '/static/official/ic_report_gx_n.png' : '/static/official/ic_report_wgx_n.png'" />
          </view>
        </view>

        <!-- 补充说明 -->
        <view class="card">
          <text class="card__title">补充说明</text>
          <textarea
            v-model="content"
            class="area"
            :maxlength="200"
            placeholder="请补充具体情况，便于我们更快处理（选填）"
            placeholder-class="area__ph"
          />
          <text class="area__count">{{ content.length }}/200</text>
        </view>

        <!-- 证据图片 -->
        <view class="card">
          <text class="card__title">证据截图（选填，最多 3 张）</text>
          <view class="grid">
            <view v-for="(img, i) in images" :key="i" class="grid__item">
              <image class="grid__img" :src="img" mode="aspectFill" />
              <view class="grid__del" @tap="removeImage(i)">×</view>
            </view>
            <view v-if="images.length < 3" class="grid__add" @tap="chooseImages">+</view>
          </view>
        </view>

        <view class="footer">
          <view class="tg-btn" :class="{ 'tg-btn--disabled': selectedIndex < 0 }" @tap="submit">提交举报</view>
        </view>
        <view class="safe" />
      </block>
    </scroll-view>
  </view>
</template>

<script>
import { reportApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, back, loading, hideLoading, chooseImage } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      loading: true,
      submitting: false,
      targetId: '',
      targetType: 'user',
      reasons: [],
      selectedIndex: -1,
      content: '',
      images: []
    }
  },
  onLoad(q) {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.targetId = (q && q.targetId) || ''
    this.targetType = (q && q.targetType) || 'user'
    this.loadReasons()
  },
  methods: {
    async loadReasons() {
      this.loading = true
      try {
        this.reasons = (await reportApi.reasons()) || []
      } catch (e) {
        this.reasons = []
      } finally {
        this.loading = false
      }
    },
    selectReason(i) {
      this.selectedIndex = i
    },
    removeImage(i) {
      this.images.splice(i, 1)
    },
    async chooseImages() {
      const rest = 3 - this.images.length
      if (rest <= 0) {
        toast('最多上传 3 张')
        return
      }
      const paths = await chooseImage(rest)
      if (!paths.length) return
      loading('上传中…')
      try {
        for (const p of paths) {
          const res = await uploadFile(p, 'image')
          const url = res && res.url ? res.url : res
          if (url) this.images.push(mediaUrl(url))
        }
      } catch (e) {
        /* 已提示 */
      } finally {
        hideLoading()
      }
    },
    async submit() {
      if (this.selectedIndex < 0) {
        toast('请选择举报原因')
        return
      }
      if (this.submitting) return
      if (!this.targetId) {
        toast('举报对象不正确')
        return
      }
      this.submitting = true
      const base = this.reasons[this.selectedIndex]
      // 后端接口字段为 reason(字符串)，无独立 content 列，故将补充说明合并进 reason 一并提交
      const reason = this.content.trim() ? `${base}：${this.content.trim()}` : base
      try {
        await reportApi.submit({
          targetId: Number(this.targetId),
          targetType: this.targetType,
          reasonId: this.selectedIndex,
          reason,
          content: this.content.trim(),
          images: this.images
        })
        toast('举报已提交')
        setTimeout(() => back(), 600)
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
.safe {
  height: 40rpx;
}
.card {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.card__title {
  font-size: 32rpx;
  font-weight: bold;
  color: #30302f;
}
.rrow {
  height: 88rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid #f5f6f8;
}
.rrow:last-child {
  border-bottom: none;
}
.rrow__text {
  font-size: 30rpx;
  color: $tg-text-regular;
}
.rrow.is-on .rrow__text {
  color: #ff731c;
  font-weight: bold;
}
.rrow__icon {
  width: 40rpx;
  height: 40rpx;
}
/* user_report_fragment.xml：ShapeEditText 高 110dip=220rpx、padding 8dip=16rpx、13sp=26rpx #30302f、hint #cecece */
.area {
  margin-top: 20rpx;
  width: 100%;
  height: 220rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
  font-size: 26rpx;
  color: #30302f;
}
.area__ph {
  color: #cecece;
  font-size: 26rpx;
}
.area__count {
  margin-top: 12rpx;
  align-self: flex-end;
  font-size: 22rpx;
  color: #cecece;
}
.grid {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
/* upload_images_layout.xml：单格 100dip=200rpx、四角圆角 6dip=12rpx、右间距 6dip=12rpx */
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
.footer {
  margin: 48rpx 30rpx 0;
}
.footer .tg-btn {
  height: 100rpx;
  line-height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  font-size: 34rpx;
  font-weight: bold;
  color: #ffffff;
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
