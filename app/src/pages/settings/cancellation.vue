<template>
  <view class="page" :class="{ 'page--reason': step === 1 }">
    <!-- activity_cancellationreason.xml：ShapeLinearLayout angle 270（#fff0e9 → #ffffff） -->
    <TgNavBar :title="step === 0 ? '注销账号' : ''" :auto-back="false" @back="onNavBack" />

    <!-- ===== 注销须知（activity_cancellation.xml） ===== -->
    <block v-if="step === 0">
      <scroll-view scroll-y class="scroll">
        <view class="notice">
          <text class="notice__intro">请知悉并谨记：账号注销后，将无法再使用该手机号找回此账号的用户数据（即使你仍使用该手机号重新注册并使用糖果空间），请仔细阅读下述条款后审慎操作：</text>
          <view v-for="(t, i) in terms" :key="i" class="term">
            <text class="term__idx">{{ i + 1 }}</text>
            <text class="term__text" :class="{ 'term__text--warn': i === 5 }">{{ t }}</text>
          </view>
        </view>
        <view class="scroll__pad" />
      </scroll-view>

      <!-- 底部双按钮：login_register_view_white / shape_btn_bg_think -->
      <view class="bar">
        <view class="bar__btn bar__btn--ghost" @tap="step = 1">申请注销</view>
        <view class="bar__btn bar__btn--primary" @tap="onThinkAgain">再考虑一下</view>
      </view>
    </block>

    <!-- ===== 注销原因（activity_cancellationreason.xml + item_logoff_rrason.xml） ===== -->
    <view v-else class="reasons">
      <view v-for="(r, i) in reasons" :key="i" class="reason" @tap="pickReason(r)">
        <text class="reason__text">{{ r }}</text>
        <image
          class="reason__check"
          :class="{ 'reason__check--on': picked === r }"
          :src="picked === r ? '/static/official/icons_check_icon_active.png' : '/static/official/ic_zx_wxz.png'"
          mode="aspectFit"
        />
      </view>
    </view>
  </view>
</template>

<script>
import { cancellationApi } from '@/api'
import { toast, back, confirm } from '@/utils/ui'

/** activity_cancellation.xml 正文条款（第 6 条为红色加粗） */
const TERMS = [
  '账号注销后将无法恢复；',
  '注销后若再次使用相同手机号注册登录糖果空间APP将是全新账号；',
  '注销后，你的全部个人资料和使用记录（包括不限于登记微信号、昵称、头像、消息记录、发布动态内容、相册照片、视频、语音等）均会自糖果空间平台清除，无法找回；',
  '注销后，钱包余额等全部资产将会被清空，同一手机号再次注册无法承继该资产；',
  '注销后，存续期内的会员身份将直接失效，同一手机号再次注册无法承继该权益；',
  '账号一旦注销，同一手机号在 90 日内无法再次进行注册。',
  '账号一旦注销，将无法恢复，请谨慎操作。你在进行注销操作时，即代表同意本注销协议。'
]

export default {
  data() {
    return {
      step: 0,
      terms: TERMS,
      reasons: [],
      picked: '',
      submitting: false
    }
  },
  onLoad() {
    this.loadReasons()
  },
  methods: {
    async loadReasons() {
      try {
        const res = await cancellationApi.reasons()
        this.reasons = (res && res.reasons) || []
      } catch (e) {
        this.reasons = []
      }
    },
    /** 原因步骤返回须知；须知步骤返回上一页 */
    onNavBack() {
      if (this.step === 1) this.step = 0
      else back()
    },
    onThinkAgain() {
      back()
    },
    async pickReason(r) {
      if (this.submitting) return
      const ok = await confirm('确认提交注销申请？提交后账号将进入注销流程。', '注销账号')
      if (!ok) return
      this.picked = r
      this.submitting = true
      try {
        await cancellationApi.submit({ reason: r })
        toast('注销申请已提交，等待审核')
        setTimeout(() => back(), 900)
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
/* ShapeLinearLayout：angle 270 → 自上而下 #fff0e9 → #ffffff */
.page--reason {
  background: linear-gradient(180deg, #fff0e9 0%, #ffffff 100%);
}
.scroll {
  height: calc(100vh - 88rpx);
}

/* ===== 须知 ===== */
.notice {
  margin: 0 30rpx;
}
.notice__intro {
  font-size: 28rpx;
  line-height: 44rpx;
  color: #61605f;
}
.term {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
}
.term__idx {
  flex-shrink: 0;
  width: 30rpx;
  height: 30rpx;
  line-height: 30rpx;
  text-align: center;
  font-size: 22rpx;
  color: #61605f;
  border: 2rpx solid #61605f;
  border-radius: 50%;
}
.term__text {
  flex: 1;
  margin-left: 30rpx;
  font-size: 30rpx;
  line-height: 44rpx;
  color: #30302f;
}
.term__text--warn {
  font-weight: bold;
  color: #ff5e5e;
}
.scroll__pad {
  height: 180rpx;
}

/* ===== 底部按钮（marginBottom 36dip，高 48dip） ===== */
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 72rpx;
  display: flex;
  flex-direction: row;
  background-color: #ffffff;
}
.bar__btn {
  flex: 1;
  height: 96rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.bar__btn--ghost {
  margin-left: 42rpx;
  color: #828282;
  background-color: #ffffff;
  border: 2rpx solid #dddddd;
}
.bar__btn--primary {
  margin-left: 66rpx;
  margin-right: 42rpx;
  color: #ffffff;
  background-color: #ff731c;
}

/* ===== 原因列表 ===== */
.reasons {
  padding-top: 10rpx;
}
/* item_logoff_rrason.xml：行高 54dip，底边 1px #f0f0f0 */
.reason {
  height: 108rpx;
  padding: 0 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
}
.reason__text {
  flex: 1;
  font-size: 32rpx;
  color: #30302f;
}
.reason__check {
  width: 40rpx;
  height: 40rpx;
}
.reason__check--on {
  width: 48rpx;
  height: 48rpx;
}
</style>
