<template>
  <view class="page">
    <TgNavBar title="消息通知" bg-color="#ffffff" />

    <!-- ===== 6 项提醒开关（activity_notify_open.xml + layout_check_item.xml） ===== -->
    <view class="list">
      <view
        v-for="(it, i) in items"
        :key="it.key"
        class="check-item"
        :class="{ 'check-item--first': i === 0 }"
        @tap="toggle(it)"
      >
        <text class="check-item__text">{{ it.label }}</text>
        <image
          class="check-item__box"
          :src="it.value ? '/static/official/ic_me_on_n.png' : '/static/official/ic_me_off_n.png'"
          mode="aspectFit"
        />
      </view>
    </view>

    <text class="tips">Tip: 关闭所选通知后，则只在糖果空间APP中显示，不会在外部进行推送。请酌情关闭通知，以免错过重要消息。</text>
  </view>
</template>

<script>
import { notifyApi } from '@/api'

/**
 * 6 项提醒开关 —— 顺序与文案取自 activity_notify_open.xml 的 app:text：
 * 私聊通知 / 同城动态 / 系统消息 / 收益提醒 / 谁看了我 / 报名通知
 */
const ITEMS = [
  { key: 'chat', label: '私聊通知', value: true },
  { key: 'city', label: '同城动态', value: true },
  { key: 'system', label: '系统消息', value: true },
  { key: 'income', label: '收益提醒', value: true },
  { key: 'visitor', label: '谁看了我', value: true },
  { key: 'enroll', label: '报名通知', value: true }
]

export default {
  data() {
    return { items: ITEMS.map((it) => ({ ...it })) }
  },
  onLoad() {
    this.loadDetail()
  },
  methods: {
    async loadDetail() {
      try {
        const res = await notifyApi.detail()
        if (!res) return
        this.items = this.items.map((it) => ({ ...it, value: res[it.key] !== false }))
      } catch (e) {
        /* 请求层已提示 */
      }
    },
    async toggle(it) {
      const next = !it.value
      const prev = it.value
      it.value = next
      try {
        await notifyApi.update({ [it.key]: next })
      } catch (e) {
        it.value = prev
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* activity_notify_open.xml：根布局底色 #f8f8f8 */
.page {
  min-height: 100vh;
  background-color: #f8f8f8;
}

/* ===== 开关行（layout_check_item.xml：高 60dip 白底） ===== */
.check-item {
  position: relative;
  height: 120rpx;
  padding: 0 30rpx;
  background-color: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
/* 首项 marginTop 10dip */
.check-item--first {
  margin-top: 20rpx;
}
/* 底部分割线 0.5dip #f0f0f0 */
.check-item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1rpx;
  background-color: #f0f0f0;
}
.check-item__text {
  font-size: 32rpx;
  color: #30302f;
}
/* checkbox：ic_me_on_n / ic_me_off_n，逻辑尺寸 36×21dip */
.check-item__box {
  width: 72rpx;
  height: 42rpx;
  flex-shrink: 0;
}

/* ===== message_tips：13sp #b9b9b9、margin 15dip/22dip ===== */
.tips {
  display: block;
  margin: 44rpx 30rpx 0;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #b9b9b9;
}
</style>
