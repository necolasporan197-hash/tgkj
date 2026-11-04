<template>
  <view class="page" :class="{ 'page--gradient': step === 2 }">
    <!-- title_bar.xml：44dip 高、标题 18sp bold #181716 -->
    <TgNavBar
      :title="navTitle"
      :bg-color="step === 2 ? 'transparent' : '#FFFFFF'"
      :auto-back="false"
      @back="onNavBack"
    />

    <!-- ===== fragment_young_main.xml：青少年模式主页 ===== -->
    <view v-if="step === 0" class="main">
      <image class="main__pic" src="/static/official/pic_tuan.png" mode="widthFix" />
      <text class="main__desc">在青少年模式中，我们选择了一批适合青少年观看的内容，且无法进行充值、购买、内容发布等操作</text>
      <view class="main__spacer" />
      <view v-if="!enabled" class="sbtn sbtn--outline" @tap="dialog = true">开启青少年模式</view>
      <view v-else class="sbtn sbtn--gradient" @tap="dialog = true">关闭青少年模式</view>
    </view>

    <!-- ===== fragment_young_model_pwd.xml：设置/输入密码 ===== -->
    <view v-else-if="step === 1" class="form">
      <text class="form__title">{{ pwdMode === 'open' ? '设置密码' : '输入密码' }}</text>
      <text class="form__sub">{{ pwdMode === 'open' ? '请设置密码，用于开启/关闭青少年模式' : '请输入密码以关闭青少年模式' }}</text>

      <view class="pwd" @tap="focusPwd">
        <view v-for="n in 4" :key="n" class="pwd__box">{{ pwd[n - 1] || '' }}</view>
        <input
          class="pwd__input"
          :focus="pwdFocus"
          type="number"
          :maxlength="4"
          :value="pwd"
          @input="onPwdInput"
          @blur="pwdFocus = false"
        />
      </view>

      <view class="next" :class="{ 'next--disabled': pwd.length < 4 || submitting }" @tap="submitPwd">确定</view>
      <view class="forget" @tap="toPhone">
        <text class="forget__text">忘记密码</text>
        <image class="forget__icon" src="/static/official/ic_login_jt.png" mode="aspectFit" />
      </view>
    </view>

    <!-- ===== fragment_young_model_phone.xml：手机号验证（渐变根背景，官方原值） ===== -->
    <view v-else class="form">
      <text class="form__title">手机号验证</text>
      <text class="form__sub">需使用当前手机号完成验证</text>

      <view class="field">
        <image class="field__icon" src="/static/official/ic_login_phone_n.png" mode="aspectFit" />
        <input class="field__input" :value="phone" disabled placeholder="请输入手机号" placeholder-class="ph" />
      </view>

      <view class="field">
        <image class="field__icon field__icon--code" src="/static/official/ic_login_mima_n.png" mode="aspectFit" />
        <input
          class="field__input"
          v-model="smsCode"
          type="number"
          :maxlength="6"
          placeholder="请输入验证码"
          placeholder-class="ph"
        />
        <text class="field__send" :class="{ 'is-disabled': countdown > 0 || sending }" @tap="sendSms">
          {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
        </text>
      </view>

      <view class="next" :class="{ 'next--disabled': !canReset || submitting }" @tap="submitReset">确定</view>
    </view>

    <!-- ===== young_model_dialog_fragment.xml：确认弹窗 ===== -->
    <view v-if="dialog" class="mask" @tap="dialog = false">
      <view class="dialog" @tap.stop>
        <image class="dialog__pic" src="/static/official/pic_pop_young.png" mode="widthFix" />
        <text class="dialog__title">青少年模式</text>
        <text class="dialog__desc">在青少年模式中，无法进行充值、购买等操作，无法使用发布内容等功能</text>
        <view v-if="!enabled" class="sbtn sbtn--outline sbtn--dlg" @tap="confirmOpen">开启青少年模式</view>
        <view v-else class="next next--dlg" @tap="confirmClose">关闭青少年模式</view>
        <image class="dialog__close" src="/static/official/ic_pop_lose_n.png" mode="aspectFit" @tap="dialog = false" />
      </view>
    </view>
  </view>
</template>

<script>
import { youngApi } from '@/api'
import { toast, back } from '@/utils/ui'

/**
 * 青少年模式 —— 1:1 官方 YoungModelActivity 体系
 *   step 0：fragment_young_main.xml（pic_tuan + 说明 + 开启/关闭按钮）
 *   step 1：fragment_young_model_pwd.xml（4 位密码；开启=设置密码，关闭=输入密码）
 *   step 2：fragment_young_model_phone.xml（忘记密码 → 短信验证 → 重设密码）
 *   弹窗 ：young_model_dialog_fragment.xml（pic_pop_young 确认弹窗）
 * 关闭流程需校验密码 → youngApi.close；忘记密码 → youngApi.sms + youngApi.reset
 */
export default {
  data() {
    return {
      step: 0,
      dialog: false,
      enabled: false,
      hasPwd: false,
      phone: '',
      pwdMode: 'open',
      pwd: '',
      pwdFocus: false,
      smsCode: '',
      countdown: 0,
      sending: false,
      submitting: false,
      timer: null
    }
  },
  computed: {
    navTitle() {
      if (this.step === 1) return this.pwdMode === 'open' ? '设置密码' : '输入密码'
      if (this.step === 2) return '手机号验证'
      return '青少年模式'
    },
    canReset() {
      return this.smsCode.length >= 4 && this.pwd.length === 4
    }
  },
  onLoad() {
    this.loadDetail()
  },
  onUnload() {
    this.clearTimer()
  },
  methods: {
    async loadDetail() {
      try {
        const res = await youngApi.detail()
        if (!res) return
        this.enabled = res.enabled === true
        this.hasPwd = res.hasPwd === true
        this.phone = res.phone || ''
      } catch (e) {
        /* 请求层已提示 */
      }
    },
    /** step 子页回退：2→1→0，主页面则退出 */
    onNavBack() {
      if (this.step === 2) this.step = 1
      else if (this.step === 1) this.step = 0
      else back()
    },
    focusPwd() {
      this.pwdFocus = false
      this.$nextTick(() => {
        this.pwdFocus = true
      })
    },
    onPwdInput(e) {
      this.pwd = String(e.detail.value || '').replace(/\D/g, '').slice(0, 4)
    },
    /** 弹窗确认开启 → 进入设置密码 */
    confirmOpen() {
      this.dialog = false
      this.pwd = ''
      this.pwdMode = 'open'
      this.step = 1
      this.focusPwd()
    },
    /** 弹窗确认关闭 → 进入输入密码 */
    confirmClose() {
      this.dialog = false
      this.pwd = ''
      this.pwdMode = 'close'
      this.step = 1
      this.focusPwd()
    },
    /** 设置密码页「确定」 */
    async submitPwd() {
      if (this.pwd.length !== 4 || this.submitting) return
      this.submitting = true
      try {
        if (this.pwdMode === 'open') {
          await youngApi.open(this.pwd)
          this.enabled = true
          this.hasPwd = true
          toast('青少年模式已开启')
        } else {
          await youngApi.close(this.pwd)
          this.enabled = false
          toast('青少年模式已关闭')
        }
        this.step = 0
        this.pwd = ''
      } catch (e) {
        /* 请求层已提示 */
      } finally {
        this.submitting = false
      }
    },
    /** 忘记密码 → 手机号验证 */
    toPhone() {
      this.smsCode = ''
      this.pwd = ''
      this.step = 2
    },
    async sendSms() {
      if (this.countdown > 0 || this.sending) return
      this.sending = true
      try {
        const res = await youngApi.sms()
        this.startCountdown(60)
        if (res && res.devCode) toast(`验证码：${res.devCode}`)
        else toast('验证码已发送')
      } catch (e) {
        /* 请求层已提示 */
      } finally {
        this.sending = false
      }
    },
    startCountdown(sec) {
      this.countdown = sec
      this.clearTimer()
      this.timer = setInterval(() => {
        this.countdown -= 1
        if (this.countdown <= 0) this.clearTimer()
      }, 1000)
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      if (this.countdown < 0) this.countdown = 0
    },
    /** 手机号验证页「确定」→ 短信校验后重设 4 位密码 */
    async submitReset() {
      if (!this.canReset || this.submitting) return
      this.submitting = true
      try {
        await youngApi.reset({ smsCode: this.smsCode, password: this.pwd })
        this.hasPwd = true
        toast('密码已重设')
        this.pwdMode = this.enabled ? 'close' : 'open'
        this.pwd = ''
        this.smsCode = ''
        this.step = 1
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
/* fragment_young_main.xml / fragment_young_model_pwd.xml：根布局默认白底 */
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}
/* fragment_young_model_phone.xml：ShapeLinearLayout angle=270，start #fffff0e9 → end #ffffffff
   （官方 XML 自带渐变，按原值 1:1 还原） */
.page--gradient {
  background: linear-gradient(180deg, #fff0e9 0%, #ffffff 100%);
}

/* ===== 主页 ===== */
.main {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* pic_tuan 786×591px（xxhdpi 3x）→ 262×197dip → 524rpx 等比宽 */
.main__pic {
  width: 524rpx;
  margin-top: 18rpx;
}
/* 说明文案：15sp #30302f、宽 328dip=656rpx、marginTop 45dip=90rpx、weight 1 */
.main__desc {
  width: 656rpx;
  margin-top: 90rpx;
  font-size: 30rpx;
  color: #30302f;
  text-align: center;
  line-height: 48rpx;
}
.main__spacer {
  flex: 1;
}

/* ShapeTextView：fill_parent 除左右 30dip=60rpx、高 50dip=100rpx、圆角 15dip=30rpx、粗体居中 */
.sbtn {
  width: 630rpx;
  height: 100rpx;
  margin-bottom: 90rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
}
/* sb_open / tv_open：solid #f9f9f9 + stroke #dddddd 1dip + 文字 #61605f */
.sbtn--outline {
  background-color: #f9f9f9;
  border: 2rpx solid #dddddd;
  color: #61605f;
}
/* sb_close：渐变 #ff5000 → #ff7f00，白字（官方 XML 自带渐变，按原值 1:1 还原） */
.sbtn--gradient {
  background: linear-gradient(90deg, #ff5000 0%, #ff7f00 100%);
  color: #ffffff;
}

/* ===== 表单（设置密码 / 手机号验证） ===== */
.form {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* tv_title1：16sp bold #181716、paddingLeft 30dip=60rpx、marginTop 20dip=40rpx */
.form__title {
  align-self: flex-start;
  padding-left: 60rpx;
  margin-top: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #181716;
}
/* title2：14sp #828282、marginLeft 30dip=60rpx、marginTop 10dip=20rpx */
.form__sub {
  align-self: flex-start;
  height: 40rpx;
  line-height: 40rpx;
  margin-left: 60rpx;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #828282;
}

/* MNPasswordEditText：高 60dip=120rpx、左右 margin 30dip=60rpx；
   单格 background #f9f9f9 + border #e8ebef 1dip + radius 10dip=20rpx + item_margin 20dip=40rpx */
.pwd {
  position: relative;
  width: 630rpx;
  height: 120rpx;
  margin-top: 60rpx;
  display: flex;
  flex-direction: row;
}
.pwd__box {
  flex: 1;
  height: 120rpx;
  background-color: #f9f9f9;
  border: 2rpx solid #e8ebef;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #181716;
}
.pwd__box + .pwd__box {
  margin-left: 40rpx;
}
/* 透明输入层：承接输入与聚焦，不参与视觉 */
.pwd__input {
  position: absolute;
  left: 0;
  top: 0;
  width: 630rpx;
  height: 120rpx;
  opacity: 0;
}

/* next_button：style=next_button_style（宽 315dip=630rpx、高 50dip=100rpx、居中），marginTop 36dip=72rpx */
.next {
  width: 630rpx;
  height: 100rpx;
  margin-top: 72rpx;
  border-radius: 30rpx;
  background-color: #ff731c;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.next--disabled {
  opacity: 0.5;
}
/* tv_pwd1：15sp #dc835a、marginTop 24dip=48rpx、drawableRight ic_login_jt + padding 6dip=12rpx */
.forget {
  margin-top: 48rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.forget__text {
  font-size: 30rpx;
  color: #dc835a;
}
.forget__icon {
  width: 12rpx;
  height: 22rpx;
  margin-left: 12rpx;
}

/* 输入框：高 56dip=112rpx、白底、radius 15dip=30rpx、左右 margin 30dip=60rpx、
   paddingLeft 32dip=64rpx、paddingRight 23dip=46rpx */
.field {
  width: 630rpx;
  height: 112rpx;
  margin-top: 60rpx;
  padding-left: 64rpx;
  padding-right: 46rpx;
  background-color: #ffffff;
  border-radius: 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* ic_login_phone_n 14×18dip=28×36rpx、marginRight 20dip=40rpx */
.field__icon {
  width: 28rpx;
  height: 36rpx;
  margin-right: 40rpx;
  flex-shrink: 0;
}
/* ic_login_mima_n 14×21dip=28×42rpx */
.field__icon--code {
  height: 42rpx;
}
.field__input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #30302f;
}
.ph {
  color: #cecece;
}
/* send_verification_code_view：13sp #ff5e13、paddingLeft/Right 10dip=20rpx */
.field__send {
  padding-left: 20rpx;
  padding-right: 20rpx;
  font-size: 26rpx;
  color: #ff5e13;
  flex-shrink: 0;
}
.field__send.is-disabled {
  color: #cecece;
}

/* ===== 弹窗（young_model_dialog_fragment.xml） ===== */
.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
/* CardView：宽 330dip=660rpx、圆角 15dip=30rpx、elevation 0 */
.dialog {
  position: relative;
  width: 660rpx;
  border-radius: 30rpx;
  background-color: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dialog__pic {
  width: 660rpx;
}
/* title：18sp bold #30302f、marginTop 8dip=16rpx、居中 */
.dialog__title {
  margin-top: 16rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #30302f;
  text-align: center;
}
/* 正文容器：paddingLeft/Right 23dip=46rpx、marginTop 12dip=24rpx */
.dialog__desc {
  margin: 24rpx 46rpx 0;
  font-size: 28rpx;
  color: #787776;
  text-align: center;
  line-height: 44rpx;
}
/* tv_open：高 48dip=96rpx、marginTop 24dip=48rpx、marginBottom 40dip=80rpx、radius 15dip=30rpx */
.sbtn--dlg {
  width: auto;
  height: 96rpx;
  margin: 48rpx 46rpx 80rpx;
  font-size: 32rpx;
}
/* close：NextButton 高 48dip=96rpx、marginTop 24dip、marginBottom 40dip、nextBg button_ff8800、nextSize 16sp */
.next--dlg {
  width: auto;
  height: 96rpx;
  margin: 48rpx 46rpx 80rpx;
  font-size: 32rpx;
}
/* close_dialog：ic_pop_lose_n 39×39px=26×26rpx、padding 15dip=30rpx、右上角 */
.dialog__close {
  position: absolute;
  right: 0;
  top: 0;
  width: 26rpx;
  height: 26rpx;
  padding: 30rpx;
}
</style>
