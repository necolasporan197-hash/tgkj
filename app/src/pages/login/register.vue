<template>
  <view class="reg">
    <TgNavBar title="注册" />
    <scroll-view scroll-y class="reg__scroll">
      <!-- 步骤 1/3 · 账号：手机号 + 图形验证码 + 短信验证码 + 密码（官方 mobile_login_fragment 手机号/验证码；密码为本项目账号体系） -->
      <view class="reg__form">
        <view class="reg__field">
          <image class="reg__icon" src="/static/official/ic_login_phone_n_login.png" />
          <input v-model="form.phone" class="reg__input" type="number" maxlength="11" placeholder="手机号" placeholder-class="reg__ph" />
        </view>
        <view v-if="captchaRequired" class="reg__field">
          <input v-model="form.captchaCode" class="reg__input reg__input--cap" maxlength="4" placeholder="图形验证码" placeholder-class="reg__ph" />
          <image v-if="captchaImage" class="reg__captcha" :src="captchaImage" mode="aspectFit" @tap="loadCaptcha" />
          <text v-else class="reg__code" @tap="loadCaptcha">点击获取</text>
        </view>
        <view class="reg__field">
          <image class="reg__icon" src="/static/official/ic_login_tg_n.png" />
          <input v-model="form.smsCode" class="reg__input" type="number" maxlength="6" placeholder="短信验证码" placeholder-class="reg__ph" />
          <text class="reg__code" :class="{ 'is-disabled': counting }" @tap="sendCode">{{ counting ? countdown + 's' : '获取验证码' }}</text>
        </view>
        <view class="reg__field">
          <image class="reg__icon" src="/static/official/ic_login_mima_n.png" />
          <input v-model="form.password" class="reg__input" password placeholder="设置密码（至少 6 位）" placeholder-class="reg__ph" />
        </view>
        <view class="reg__field">
          <image class="reg__icon" src="/static/official/ic_register_tag_n.png" />
          <input v-model="form.inviteCode" class="reg__input" maxlength="10" placeholder="邀请码（选填）" placeholder-class="reg__ph" />
        </view>
      </view>

      <view class="reg__check" @tap="agreed = !agreed">
        <image class="reg__check-icon" :src="agreed ? '/static/official/ic_sc_s.png' : '/static/official/ic_sc_uns.png'" />
        <text class="reg__check-text">我已阅读并同意</text>
        <text class="reg__link" @tap.stop="openDoc('user')">《用户协议》</text>
        <text class="reg__check-text">和</text>
        <text class="reg__link" @tap.stop="openDoc('privacy')">《隐私政策》</text>
      </view>

      <!-- 官方 create_info_bottom.xml：实心 #ff731c / 圆角 15dip / 高 50dip / 17sp bold -->
      <view class="reg__btn" :class="{ 'is-disabled': !canSubmit }" @tap="next">下一步</view>
      <view class="reg__safe" />
    </scroll-view>
  </view>
</template>

<script>
import { authApi, configApi } from '@/api'
import { toast } from '@/utils/ui'

export default {
  data() {
    return {
      agreed: false,
      counting: false,
      countdown: 60,
      timer: null,
      captchaRequired: true,
      captchaKey: '',
      captchaImage: '',
      form: {
        phone: '',
        smsCode: '',
        password: '',
        inviteCode: '',
        captchaCode: ''
      }
    }
  },
  computed: {
    canSubmit() {
      return (
        this.agreed &&
        /^1[3-9]\d{9}$/.test(this.form.phone) &&
        this.form.smsCode &&
        this.form.password &&
        this.form.password.length >= 6
      )
    }
  },
  onLoad(q) {
    if (q.phone) this.form.phone = q.phone
    if (q.smsCode) this.form.smsCode = q.smsCode
    this.loadCaptchaConfig()
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
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
        this.captchaImage = String(r.image || '').startsWith('data:') ? r.image : `data:image/svg+xml;base64,${r.image}`
      } catch (e) {
        this.captchaImage = ''
      }
    },
    async sendCode() {
      if (this.counting) return
      if (!/^1[3-9]\d{9}$/.test(this.form.phone)) return toast('请输入正确的手机号')
      if (this.captchaRequired && !this.form.captchaCode) return toast('请输入图形验证码')
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
    /** 暂存账号信息 → 进入步骤 2（性别确认） */
    next() {
      if (!this.canSubmit) {
        if (!this.agreed) return toast('请先阅读并同意用户协议')
        return toast('请完善账号信息')
      }
      uni.setStorageSync('tggy_reg_form', {
        phone: this.form.phone,
        smsCode: this.form.smsCode,
        password: this.form.password,
        inviteCode: this.form.inviteCode
      })
      uni.navigateTo({ url: '/pages/login/register-sex' })
    },
    openDoc(type) {
      uni.navigateTo({ url: `/pages/settings/doc?type=${type}` })
    }
  }
}
</script>

<style lang="scss" scoped>
.reg {
  min-height: 100vh;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
}
.reg__scroll {
  flex: 1;
  height: 0;
}

/* 账号行：官方 item_input_view.xml，白色圆角 15dip=30rpx，高 56dip=112rpx */
.reg__form {
  margin: 48rpx 30rpx 0;
}
.reg__field {
  height: 112rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 60rpx 0 54rpx;
  background: #ffffff;
  border-radius: 30rpx;
}
.reg__field + .reg__field {
  margin-top: 24rpx;
}
/* 图标 19dip=38rpx，左内边距 27dip=54rpx */
.reg__icon {
  width: 38rpx;
  height: 38rpx;
  flex-shrink: 0;
}
.reg__input {
  flex: 1;
  margin-left: 40rpx;
  font-size: 34rpx;
  color: #30302f;
}
.reg__ph {
  color: #cecece;
  font-size: 34rpx;
}
.reg__code {
  font-size: 26rpx;
  color: #ff5e13;
}
.reg__code.is-disabled {
  color: #c8c9cc;
}
.reg__input--cap {
  margin-left: 0;
}
.reg__captcha {
  width: 180rpx;
  height: 64rpx;
  border-radius: 8rpx;
  background: #f5f6f8;
}

.reg__check {
  margin: 28rpx 30rpx 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
}
.reg__check-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}
.reg__check-text {
  font-size: 24rpx;
  color: #9e9e9e;
}
.reg__link {
  font-size: 24rpx;
  color: #ff731c;
}

/* 主按钮：官方 create_info_bottom.xml，实心 #ff731c，圆角 15dip=30rpx，高 50dip=100rpx，17sp=34rpx */
.reg__btn {
  margin: 60rpx 30rpx 0;
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
.reg__btn.is-disabled {
  opacity: 0.5;
}
.reg__safe {
  height: 72rpx;
}
</style>
