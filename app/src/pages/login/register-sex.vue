<template>
  <view class="sex">
    <!-- 官方 profile_sex_fragment 背景为 #fff0e9→#ffffff 线性渐变，本项目禁用 CSS 渐变，改用官方暖色切图 -->
    <image class="sex__bg" src="/static/official/login_bg.png" mode="aspectFill" />

    <view class="sex__status" :style="{ height: statusBar + 'px' }" />
    <!-- 官方 title_bar：visibility=gone，但仍占 44dip=88rpx -->
    <view class="sex__titlebar" />

    <!-- 官方 iv_logo_text：149.0dip×18.0dip / marginTop 50.0dip -->
    <image class="sex__logo" src="/static/official/icons_logo_text.png" mode="aspectFit" />

    <!-- 官方 ll_top_tips：marginTop 24.0dip，app_icon 36.0dip / marginLeft 15.0dip + 气泡高 44.0dip / marginLeft 11.0dip -->
    <view class="sex__tips">
      <image class="sex__tips-icon" src="/static/official/app_icon.png" />
      <view class="sex__tips-bubble">
        <text class="sex__tips-text">为保障你的交友体验，请先确认性别</text>
      </view>
    </view>

    <!-- 官方 ShapeTextView：13.0sp / 高 26.0dip / marginLeft 70.0dip / marginTop 10.0dip / radius 6.0dip / #ffddd7d1 -->
    <view class="sex__warn">
      <text class="sex__warn-text">提示：性别设置后不可更改</text>
    </view>

    <!-- 官方 llTop：marginTop 114.0dip，ll_male / ll_female 各 weight=1 -->
    <view class="sex__top">
      <view class="sex__col" @tap="gender = 1">
        <image
          class="sex__icon"
          :src="gender === 1 ? '/static/official/login_male_xz.png' : '/static/official/login_male.png'"
          mode="aspectFit"
        />
        <text class="sex__label">男</text>
        <image
          class="sex__check"
          :src="gender === 1 ? '/static/official/register_xb_xz.png' : '/static/official/register_xb_wxz.png'"
        />
      </view>
      <view class="sex__col" @tap="gender = 2">
        <image
          class="sex__icon"
          :src="gender === 2 ? '/static/official/login_female_xz.png' : '/static/official/login_female.png'"
          mode="aspectFit"
        />
        <text class="sex__label">女</text>
        <image
          class="sex__check"
          :src="gender === 2 ? '/static/official/register_xb_xz.png' : '/static/official/register_xb_wxz.png'"
        />
      </view>
    </view>

    <!-- 官方 create_info_bottom.xml：marginLeft 15.0dip / marginRight 36.0dip / marginBottom 36.0dip -->
    <view class="sex__bottom">
      <view class="sex__back" @tap="back">
        <image class="sex__back-icon" src="/static/official/pic_register_back.png" mode="aspectFit" />
      </view>
      <!-- 官方 button_ff8800 为渐变，本项目统一改为实心 #ff731c -->
      <view class="sex__btn" @tap="next">下一步</view>
    </view>
  </view>
</template>

<script>
import { toast } from '@/utils/ui'

export default {
  data() {
    return {
      statusBar: 0,
      gender: 0,
      form: {}
    }
  },
  onLoad() {
    try {
      this.statusBar = uni.getSystemInfoSync().statusBarHeight || 0
    } catch (e) {
      this.statusBar = 0
    }
    this.form = uni.getStorageSync('tggy_reg_form') || {}
    if (!this.form.phone) uni.reLaunch({ url: '/pages/login/register' })
  },
  methods: {
    back() {
      uni.navigateBack({ delta: 1 })
    },
    next() {
      if (!this.gender) return toast('请先确认性别')
      uni.setStorageSync('tggy_reg_form', { ...this.form, gender: this.gender })
      uni.navigateTo({ url: '/pages/login/register-info' })
    }
  }
}
</script>

<style lang="scss" scoped>
.sex {
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.sex__bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 700rpx;
  opacity: 0.5;
  pointer-events: none;
}
.sex__status {
  width: 100%;
}
.sex__titlebar {
  height: 88rpx;
}
/* 官方 iv_logo_text：149.0dip×18.0dip = 298×36rpx / marginTop 50.0dip = 100rpx */
.sex__logo {
  position: relative;
  z-index: 2;
  display: block;
  width: 298rpx;
  height: 36rpx;
  margin: 100rpx auto 0;
}
/* 官方 ll_top_tips：marginTop 24.0dip = 48rpx */
.sex__tips {
  position: relative;
  z-index: 2;
  margin-top: 48rpx;
  padding-left: 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* 官方 app_icon：36.0dip = 72rpx / marginLeft 15.0dip = 30rpx（已含于父 paddingLeft） */
.sex__tips-icon {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
}
/* 官方气泡 FrameLayout：高 44.0dip = 88rpx / marginLeft 11.0dip = 22rpx */
.sex__tips-bubble {
  margin-left: 22rpx;
  height: 88rpx;
  padding: 0 6rpx 0 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-image: url('/static/official/zc_regiest_top.9.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
/* 官方 TextView：13.0sp = 26rpx / #30302f */
.sex__tips-text {
  font-size: 26rpx;
  color: #30302f;
}
/* 官方 ShapeTextView 提示：marginLeft 70.0dip = 140rpx / marginTop 10.0dip = 20rpx */
.sex__warn {
  position: relative;
  z-index: 2;
  margin-top: 20rpx;
  padding-left: 140rpx;
  display: flex;
  flex-direction: row;
}
/* 高 26.0dip = 52rpx / radius 6.0dip = 12rpx / 13.0sp = 26rpx / 白字 */
.sex__warn-text {
  height: 52rpx;
  line-height: 52rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  background: #ddd7d1;
  color: #ffffff;
  font-size: 26rpx;
}
/* 官方 llTop：marginTop 114.0dip = 228rpx */
.sex__top {
  position: relative;
  z-index: 2;
  margin-top: 228rpx;
  display: flex;
  flex-direction: row;
}
.sex__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* 官方插画：72.0dip×47.0dip = 144×94rpx */
.sex__icon {
  width: 144rpx;
  height: 94rpx;
}
/* 官方 TextView：17.0sp = 34rpx / #ff212121 / marginTop 18.0dip = 36rpx */
.sex__label {
  margin-top: 36rpx;
  font-size: 34rpx;
  color: #212121;
}
/* 官方 ShapeCheckBox：20.0dip = 40rpx / marginTop 26.0dip = 52rpx */
.sex__check {
  width: 40rpx;
  height: 40rpx;
  margin-top: 52rpx;
}
/* 官方 create_info_bottom：marginLeft 15.0dip = 30rpx / marginRight 36.0dip = 72rpx / marginBottom 36.0dip = 72rpx / 高 50.0dip = 100rpx */
.sex__bottom {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100rpx;
  margin: auto 72rpx 72rpx 30rpx;
}
.sex__back {
  height: 100rpx;
  min-width: 84rpx;
  display: flex;
  align-items: center;
}
/* 官方 bottom_back：pic_register_back 18.0dip×16.0dip = 36×32rpx */
.sex__back-icon {
  width: 36rpx;
  height: 32rpx;
}
/* 官方 next_button：marginLeft 30.0dip = 60rpx / 高 50.0dip = 100rpx / radius 15.0dip = 30rpx / 17.0sp = 34rpx bold */
.sex__btn {
  flex: 1;
  margin-left: 60rpx;
  height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: bold;
}
</style>
