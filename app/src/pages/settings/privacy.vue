<template>
  <view class="page">
    <TgNavBar title="隐私设置" bg-color="#f4f4f4" />
    <scroll-view scroll-y class="scroll">
      <!-- 我的相册/视频 -->
      <text class="group">我的相册/视频</text>
      <view class="card">
        <view class="row" @tap="toggle('photoPay')">
          <text class="row__title">相册/视频付费查看</text>
          <image class="row__box" :src="boxIcon(state.photoPay)" mode="aspectFit" />
        </view>
      </view>

      <!-- 隐身 -->
      <text class="group">隐身</text>
      <view class="card">
        <view class="row" @tap="toggle('hideHome')">
          <text class="row__title">在首页和动态隐藏我</text>
          <image class="row__box" :src="boxIcon(state.hideHome)" mode="aspectFit" />
        </view>
        <view class="row row--last" @tap="toggle('hideDistance')">
          <text class="row__title">对他人隐藏我的距离</text>
          <image class="row__box" :src="boxIcon(state.hideDistance)" mode="aspectFit" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { jurisdictionApi } from '@/api'

/**
 * 隐私设置（谁可以看我）—— 1:1 官方 fragment_private_setting.xml
 * 3 项开关：相册/视频付费查看、在首页和动态隐藏我、对他人隐藏我的距离
 * 开关图标：select_box_private.xml → ic_yssz_on_n（选中）/ ic_yssz_off_n（未选中）
 */
const BOX_ON = '/static/official/ic_yssz_on_n.png'
const BOX_OFF = '/static/official/ic_yssz_off_n.png'

export default {
  data() {
    return {
      state: {
        photoPay: false,
        hideHome: false,
        hideDistance: false
      },
      saving: false
    }
  },
  onLoad() {
    this.loadDetail()
  },
  methods: {
    boxIcon(on) {
      return on ? BOX_ON : BOX_OFF
    },
    async loadDetail() {
      try {
        const res = await jurisdictionApi.detail()
        if (!res) return
        this.state = {
          photoPay: res.photoPay === true,
          hideHome: res.hideHome === true,
          hideDistance: res.hideDistance === true
        }
      } catch (e) {
        /* 请求层已提示 */
      }
    },
    async toggle(key) {
      if (this.saving) return
      const next = !this.state[key]
      const prev = this.state[key]
      this.state[key] = next
      this.saving = true
      try {
        await jurisdictionApi.update({ [key]: next })
      } catch (e) {
        this.state[key] = prev
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* fragment_private_setting.xml：根布局底色 #fff4f4f4 */
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f4f4f4;
}
.scroll {
  flex: 1;
  height: 0;
}
/* 分组标题：15sp #ff9e9e9e、高 36dip、左右 margin 15dip */
.group {
  display: block;
  height: 72rpx;
  line-height: 72rpx;
  margin: 0 30rpx;
  font-size: 30rpx;
  color: #9e9e9e;
}
/* 白色卡片（color_FFFFFF） */
.card {
  background-color: #ffffff;
}
/* SimpleItemView：ll_layout minHeight 60dip、style=main_margin（左右 15dip） */
.row {
  height: 120rpx;
  padding: 0 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
/* divider_view：1px、左右 margin 15dip */
.row::after {
  content: '';
  position: absolute;
  left: 30rpx;
  right: 30rpx;
  bottom: 0;
  height: 2rpx;
  background-color: #ededed;
  transform: scaleY(0.5);
}
.row--last::after {
  display: none;
}
/* title_text_view：14sp #ff494949 */
.row__title {
  flex: 1;
  font-size: 28rpx;
  color: #494949;
}
/* select_box_view：宽 24dip；图标 ic_yssz_on_n / ic_yssz_off_n 固有 36×21dip */
.row__box {
  width: 72rpx;
  height: 42rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}
</style>
