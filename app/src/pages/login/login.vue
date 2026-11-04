<template>
  <view class="login">
    <!-- 官方暖色调背景切图（替代 XML 的 fff0e9→ffffff 线性渐变，禁用 CSS 渐变） -->
    <image class="login__bg" src="/static/official/login_bg.png" mode="aspectFill" />

    <!-- 官方 loginBack（返回） -->
    <view class="login__nav" :style="{ paddingTop: statusBar + 'px' }">
      <image class="login__back" src="/static/official/login_fanhui.png" @tap="onBack" />
    </view>

    <!-- 官方 iv_logo_text：149dip×18dip 文字 logo 切图 -->
    <image class="login__logo" src="/static/official/icons_logo_text.png" mode="aspectFit" />

    <!-- 官方 ll_top_tips：app_icon + 气泡提示（zc_regiest_top） -->
    <view class="login__tips">
      <image class="login__tips-icon" src="/static/official/app_icon.png" />
      <view class="login__tips-bubble">
        <text class="login__tips-text">终于等到你了，快来开启愉快的交友旅程</text>
      </view>
    </view>

    <!-- 官方 AccountContentLinearLayout：白色圆角输入卡 -->
    <view class="login__form">
      <!-- 手机号卡：ShapeLinearLayout，56dip 高 / 圆角 15dip -->
      <view class="login__card">
        <image class="login__card-icon" src="/static/official/icons_phone_icon.png" />
        <input v-model="form.phone" class="login__card-input" type="number" maxlength="11" placeholder="请输入手机号" placeholder-class="login__card-ph" />
      </view>

      <!-- 第二卡：随登录方式切换（密码 / 短信验证码） -->
      <view v-if="modeIndex === 0" class="login__card">
        <image class="login__card-icon" src="/static/official/ic_login_mima_n.png" />
        <input
          v-model="form.password"
          class="login__card-input"
          :password="!showPwd"
          placeholder="请输入密码"
          placeholder-class="login__card-ph"
        />
        <image
          class="login__card-eye"
          :src="showPwd ? '/static/official/ic_password_look.png' : '/static/official/ic_password_unlook.png'"
          @tap="showPwd = !showPwd"
        />
      </view>
      <view v-else class="login__card">
        <image class="login__card-icon" src="/static/official/ic_login_tg_n.png" />
        <input v-model="form.smsCode" class="login__card-input" type="number" maxlength="6" placeholder="请输入验证码" placeholder-class="login__card-ph" />
        <text class="login__card-code" :class="{ 'is-disabled': counting }" @tap="sendCode">
          {{ counting ? countdown + 's' : '获取验证码' }}
        </text>
      </view>

      <!-- 图形验证码卡（后台开关控制，保留原有功能） -->
      <view v-if="captchaRequired" class="login__card">
        <input v-model="form.captchaCode" class="login__card-input" maxlength="4" placeholder="请输入图形验证码" placeholder-class="login__card-ph" />
        <image v-if="captchaImage" class="login__captcha" :src="captchaImage" mode="aspectFit" @tap="loadCaptcha" />
        <text v-else class="login__captcha-text" @tap="loadCaptcha">点击获取</text>
      </view>

      <!-- 官方 NextButton：实心 #ff731c 圆角主按钮 -->
      <view class="login__btn" :class="{ 'is-disabled': !canSubmit }" @tap="submit">
        <text class="login__btn-text">{{ modeIndex === 0 ? '登 录' : '登 录 / 注 册' }}</text>
      </view>

      <!-- 官方协议行 checkbox + agreement_view -->
      <view class="login__agree" @tap="agreed = !agreed">
        <image class="login__agree-icon" :src="agreed ? '/static/official/ic_sc_s.png' : '/static/official/ic_sc_uns.png'" />
        <text class="login__agree-text">我已阅读并同意</text>
        <text class="login__agree-link" @tap.stop="openDoc('user')">《用户协议》</text>
        <text class="login__agree-text">和</text>
        <text class="login__agree-link" @tap.stop="openDoc('privacy')">《隐私政策》</text>
      </view>

      <!-- 官方 other_login + icons_login_arrow：切换密码/短信登录 -->
      <view class="login__switch" @tap="modeIndex = modeIndex === 0 ? 1 : 0">
        <text class="login__switch-text">{{ modes[1 - modeIndex] }}</text>
        <image class="login__switch-arrow" src="/static/official/icons_login_arrow.png" />
      </view>

      <!-- 注册 / 忘记密码（保留原功能入口） -->
      <view class="login__links">
        <text class="login__link" @tap="goRegister">注册新账号</text>
        <text class="login__link" @tap="goDoc">忘记密码？</text>
      </view>

      <!-- 第三方登录入口提示 -->
      <view class="login__third">
        <view class="login__third-item" @tap="tipThird('微信')">
          <image class="login__third-icon" src="/static/official/ic_pop_wechat_n.png" />
          <text class="login__third-text">微信</text>
        </view>
        <view class="login__third-item" @tap="tipThird('QQ')">
          <image class="login__third-icon" src="/static/official/ic_pop_qq_n.png" />
          <text class="login__third-text">QQ</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { authApi, configApi } from '@/api'
import { userStore } from '@/store/user'
import { toast } from '@/utils/ui'

export default {
  data() {
    return {
      statusBar: 0,
      modes: ['密码登录', '短信登录'],
      modeIndex: 0,
      showPwd: false,
      agreed: false,
      captchaKey: '',
      captchaImage: '',
      /** 由后台「系统配置 captcha_required」决定，关闭时隐藏验证码输入与校验 */
      captchaRequired: true,
      counting: false,
      countdown: 60,
      timer: null,
      form: { phone: '', password: '', smsCode: '', captchaCode: '' }
    }
  },
  computed: {
    canSubmit() {
      if (!this.agreed) return false
      if (!/^1[3-9]\d{9}$/.test(this.form.phone)) return false
      return this.modeIndex === 0 ? !!this.form.password : !!this.form.smsCode
    }
  },
  onLoad() {
    try {
      this.statusBar = uni.getSystemInfoSync().statusBarHeight || 0
    } catch (e) {
      this.statusBar = 0
    }
    // 已登录直接进入首页
    if (userStore.token) {
      uni.reLaunch({ url: '/pages/main/main' })
      return
    }
    this.loadCaptchaConfig()
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    onBack() {
      uni.reLaunch({ url: '/pages/main/main' })
    },
    /** 读取后台验证码开关（/config/all 为公开接口） */
    async loadCaptchaConfig() {
      try {
        const list = await configApi.all()
        const item = (list || []).find((c) => c.key === 'captcha_required')
        this.captchaRequired = !item || item.value === '1'
      } catch (e) {
        this.captchaRequired = true
      }
      if (this.captchaRequired) this.loadCaptcha()
    },
    async loadCaptcha() {
      try {
        const r = await authApi.captcha()
        this.captchaKey = r.key
        this.captchaImage = this.toImage(r.image)
      } catch (e) {
        this.captchaImage = ''
      }
    },
    toImage(v) {
      if (!v) return ''
      if (String(v).startsWith('data:')) return v
      return `data:image/svg+xml;base64,${v}`
    },
    async sendCode() {
      if (this.counting || this.modeIndex === 0) return
      if (!/^1[3-9]\d{9}$/.test(this.form.phone)) return toast('请输入正确的手机号')
      if (!this.form.captchaCode && this.captchaRequired) return toast('请输入图形验证码')
      try {
        const r = await authApi.sendSms({
          phone: this.form.phone,
          scene: 'login',
          captchaKey: this.captchaKey,
          captchaCode: this.form.captchaCode
        })
        if (r && r.devCode) toast(`验证码：${r.devCode}`)
        else toast('验证码已发送')
        this.counting = true
        this.countdown = 60
        this.timer = setInterval(() => {
          this.countdown--
          if (this.countdown <= 0) {
            clearInterval(this.timer)
            this.counting = false
          }
        }, 1000)
      } catch (e) {
        if (this.captchaRequired) this.loadCaptcha()
      }
    },
    async submit() {
      if (!this.canSubmit) {
        if (!this.agreed) toast('请先阅读并同意用户协议')
        return
      }
      uni.showLoading({ title: '登录中', mask: true })
      try {
        if (this.modeIndex === 0) {
          await userStore.login({
            phone: this.form.phone,
            password: this.form.password,
            captchaKey: this.captchaKey,
            captchaCode: this.form.captchaCode
          })
        } else {
          try {
            await userStore.loginBySms({ phone: this.form.phone, smsCode: this.form.smsCode })
          } catch (e) {
            // 未注册手机号走短信注册
            if (e.code === 1004) {
              uni.hideLoading()
              uni.navigateTo({ url: `/pages/login/register?phone=${this.form.phone}&smsCode=${this.form.smsCode}` })
              return
            }
            throw e
          }
        }
        uni.hideLoading()
        toast('登录成功')
        setTimeout(() => uni.reLaunch({ url: '/pages/main/main' }), 600)
      } catch (e) {
        uni.hideLoading()
        if (this.captchaRequired) this.loadCaptcha()
      }
    },
    goRegister() {
      uni.navigateTo({ url: '/pages/login/register' })
    },
    goDoc() {
      uni.navigateTo({ url: '/pages/settings/doc?type=user' })
    },
    openDoc(type) {
      uni.navigateTo({ url: `/pages/settings/doc?type=${type}` })
    },
    tipThird(name) {
      toast(`${name}登录即将开放`)
    }
  }
}
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: 60rpx;
}
/* 顶部暖色背景切图 */
.login__bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 560rpx;
  opacity: 0.5;
  pointer-events: none;
}
/* 官方 loginBack：marginLeft 20dip=40rpx / marginTop 40dip=80rpx */
.login__nav {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
}
.login__back {
  width: 44rpx;
  height: 44rpx;
  margin: 80rpx 0 0 40rpx;
}
/* 官方 iv_logo_text：149dip×18dip = 298rpx×36rpx，marginTop 50dip=100rpx */
.login__logo {
  position: relative;
  z-index: 2;
  display: block;
  width: 298rpx;
  height: 36rpx;
  margin: 100rpx auto 0;
}
/* 官方 ll_top_tips：marginTop 24dip=48rpx / icon 36dip=72rpx / marginLeft 15dip=30rpx */
.login__tips {
  position: relative;
  z-index: 2;
  margin-top: 48rpx;
  padding-left: 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.login__tips-icon {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
}
/* 官方气泡 FrameLayout：高 44dip=88rpx / marginLeft 11dip=22rpx */
.login__tips-bubble {
  margin-left: 22rpx;
  height: 88rpx;
  padding: 0 22rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-image: url('/static/official/zc_regiest_top.9.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
/* 官方 TextView：13sp=26rpx / #30302f */
.login__tips-text {
  font-size: 26rpx;
  color: #30302f;
}
/* 官方 AccountContentLinearLayout：marginTop 24dip=48rpx */
.login__form {
  position: relative;
  z-index: 2;
  margin-top: 48rpx;
}
/* 官方白色圆角输入卡：高 56dip=112rpx / 圆角 15dip=30rpx /
   marginLeft·Right 30dip=60rpx / paddingLeft 32dip=64rpx / paddingRight 23dip=46rpx */
.login__card {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 112rpx;
  margin: 0 60rpx;
  padding: 0 46rpx 0 64rpx;
  background: #ffffff;
  border-radius: 30rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}
/* 卡片间距：marginTop 30dip=60rpx */
.login__card + .login__card {
  margin-top: 60rpx;
}
/* 行内图标：19dip=38rpx / marginRight 20dip=40rpx */
.login__card-icon {
  width: 38rpx;
  height: 38rpx;
  margin-right: 40rpx;
  flex-shrink: 0;
}
.login__card-input {
  flex: 1;
  font-size: 32rpx;
  color: #30302f;
}
.login__card-ph {
  color: #cecece;
  font-size: 32rpx;
}
.login__card-eye {
  width: 38rpx;
  height: 38rpx;
  margin-left: 20rpx;
  flex-shrink: 0;
}
/* 获取验证码（AccountSendVerificationCodeTextView） */
.login__card-code {
  margin-left: 20rpx;
  font-size: 26rpx;
  color: #ff731c;
  flex-shrink: 0;
}
.login__card-code.is-disabled {
  color: #c8c9cc;
}
.login__captcha {
  width: 180rpx;
  height: 64rpx;
  margin-left: 20rpx;
  border-radius: 8rpx;
  background: #f5f6f8;
  flex-shrink: 0;
}
.login__captcha-text {
  margin-left: 20rpx;
  font-size: 26rpx;
  color: #ff731c;
  flex-shrink: 0;
}
/* 官方 NextButton：marginTop 30dip=60rpx / 实心 #ff731c / 16sp=32rpx 加粗白字 */
.login__btn {
  margin: 60rpx 60rpx 0;
  height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login__btn.is-disabled {
  opacity: 0.5;
}
.login__btn-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}
/* 官方协议行：marginTop 36dip=72rpx / 12sp=24rpx / #9e9e9e */
.login__agree {
  margin-top: 72rpx;
  padding: 0 40rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.login__agree-icon {
  width: 32rpx;
  height: 32rpx;
  margin: 0 10rpx;
  flex-shrink: 0;
}
.login__agree-text {
  font-size: 24rpx;
  color: #9e9e9e;
}
.login__agree-link {
  font-size: 24rpx;
  color: #ff731c;
}
/* 官方 other_login + icons_login_arrow：marginTop 24dip=48rpx / 13sp=26rpx / #ca8160 */
.login__switch {
  margin-top: 48rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.login__switch-text {
  font-size: 26rpx;
  color: #ca8160;
}
.login__switch-arrow {
  width: 24rpx;
  height: 24rpx;
  margin-left: 12rpx;
}
.login__links {
  margin-top: 36rpx;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.login__link {
  margin: 0 30rpx;
  font-size: 24rpx;
  color: #9e9e9e;
}
.login__third {
  margin-top: 60rpx;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.login__third-item {
  margin: 0 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login__third-icon {
  width: 72rpx;
  height: 72rpx;
}
.login__third-text {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #9e9e9e;
}
</style>
