<template>
  <view class="page">
    <TgNavBar title="送印象" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else>
        <!-- layout_info_tags.xml：高 36dip=72rpx、底 #fff8f3、字 13sp=26rpx #ea9659、paddingLeft 22dip=44rpx -->
        <view class="infobar">
          <text class="infobar__text">请至少选择3个标签，能更好为您进行精准匹配哦~</text>
        </view>
        <view class="card">
          <text class="card__title">选择印象标签</text>
          <text class="card__sub">最多选择 3 个</text>
          <view class="tags">
            <view
              v-for="t in tagOptions"
              :key="t"
              class="tags__item"
              :class="{ 'is-on': isSelected(t) }"
              @tap="toggle(t)"
            >
              {{ t }}
            </view>
          </view>
        </view>

        <view class="card">
          <text class="card__title">补充描述（选填）</text>
          <textarea
            class="ta"
            :value="content"
            maxlength="50"
            placeholder="用一句话描述你对 TA 的印象…"
            placeholder-class="ta__ph"
            @input="onContent"
          />
          <text class="ta__count">{{ content.length }}/50</text>
        </view>

        <view class="safe" />
      </block>
    </scroll-view>

    <view class="footbar">
      <view class="footbar__btn" :class="{ 'is-disabled': submitting }" @tap="submit">提交印象</view>
    </view>
  </view>
</template>

<script>
import { impressionApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, back } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      userId: 0,
      tagOptions: [],
      selected: [],
      content: '',
      loading: true,
      submitting: false
    }
  },
  onLoad(q) {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.userId = Number(q.userId) || 0
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const res = await impressionApi.tags()
        this.tagOptions = Array.isArray(res) ? res : (res && res.list) || []
      } catch (e) {
        this.tagOptions = []
      } finally {
        this.loading = false
      }
    },
    isSelected(t) {
      return this.selected.indexOf(t) >= 0
    },
    toggle(t) {
      const i = this.selected.indexOf(t)
      if (i >= 0) {
        this.selected.splice(i, 1)
        return
      }
      if (this.selected.length >= 3) {
        toast('最多选择 3 个标签')
        return
      }
      this.selected.push(t)
    },
    onContent(e) {
      this.content = e.detail.value
    },
    async submit() {
      if (this.submitting) return
      const content = this.content.trim()
      if (!this.selected.length && !content) {
        toast('请至少选择一个标签')
        return
      }
      const tags = this.selected.slice()
      if (content) tags.push(content)
      this.submitting = true
      try {
        await impressionApi.give({ targetId: this.userId, tags })
        toast('印象已提交')
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
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.tags {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
/* item_tag.xml：h40dip、圆角 22dip、左右 padding 27dip、字 14sp */
.tags__item {
  margin: 0 20rpx 20rpx 0;
  padding: 0 54rpx;
  height: 80rpx;
  border-radius: 44rpx;
  background: #f8f8f8;
  border: 2rpx solid #e9ebf0;
  font-size: 28rpx;
  color: #61605f;
}
/* 选中态（item_tag 的 selected）：底 #fff6f2 / 描边 #ffc0a3 / 字 #ff5e13 */
.tags__item.is-on {
  background: #fff6f2;
  border-color: #ffc0a3;
  color: #ff5e13;
}
.ta {
  margin-top: 20rpx;
  width: 100%;
  height: 200rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f5f6f8;
  font-size: 28rpx;
  color: $tg-text-primary;
}
.ta__ph {
  color: $tg-text-placeholder;
  font-size: 28rpx;
}
.ta__count {
  display: block;
  margin-top: 12rpx;
  text-align: right;
  font-size: 22rpx;
  color: $tg-text-placeholder;
}
.footbar {
  padding: 16rpx 30rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 2rpx solid #f0f1f2;
}
.footbar__btn {
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  color: #ffffff;
  background: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.footbar__btn.is-disabled {
  opacity: 0.5;
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
