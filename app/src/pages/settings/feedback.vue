<template>
  <view class="page">
    <TgNavBar title="意见反馈" :back-icon="'/static/official/title_bar_back_black.png'" />

    <!-- 输入区（edit_post_custom：160dip 高、圆角 6dip、#f9f9f9） -->
    <view class="editor">
      <textarea
        v-model="content"
        class="editor__input"
        :maxlength="100"
        placeholder="请填写您的宝贵意见，感谢您的支持~"
        placeholder-class="editor__ph"
        :show-confirm-bar="false"
      />
      <text class="editor__count">{{ content.length }}/100</text>
    </view>

    <!-- NextButton：高 50dip、圆角 15dip、实心 #ff731c -->
    <view class="tg-btn submit" :class="{ 'tg-btn--disabled': !canSubmit }" @tap="onSubmit">提交</view>
  </view>
</template>

<script>
import { feedbackApi } from '@/api'
import { toast } from '@/utils/ui'

export default {
  data() {
    return { content: '', submitting: false }
  },
  computed: {
    canSubmit() {
      return this.content.trim().length >= 5 && !this.submitting
    }
  },
  methods: {
    async onSubmit() {
      const text = this.content.trim()
      if (text.length < 5) return toast('请至少填写 5 个字的反馈内容')
      if (this.submitting) return
      this.submitting = true
      try {
        await feedbackApi.submit({ content: text })
        toast('反馈已提交，感谢你的建议')
        this.content = ''
        setTimeout(() => uni.navigateBack({ delta: 1 }), 900)
      } catch (e) {
        /* 请求层已提示 */
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: #ffffff;
}

/* activity_feedback.xml：margin 25dip/15dip，高 160dip，padding 6dip，圆角 6dip */
.editor {
  position: relative;
  margin: 50rpx 30rpx 0;
  height: 320rpx;
  padding: 12rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}
.editor__input {
  width: 100%;
  height: 100%;
  font-size: 28rpx;
  line-height: 40rpx;
  color: #61605f;
}
.editor__ph {
  font-size: 28rpx;
  color: #b9b9b9;
}
/* supplement_number：14sp #ffb9b9b9，右下角 */
.editor__count {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  font-size: 28rpx;
  color: #b9b9b9;
}

/* NextButton：marginTop 60dip、左右 30dip、高 50dip */
.submit {
  height: 100rpx;
  margin: 120rpx 60rpx 0;
}
</style>
