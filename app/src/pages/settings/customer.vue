<template>
  <view class="page">
    <TgNavBar title="联系客服" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else>
        <!-- 客服信息 -->
        <view class="head">
          <image class="head__icon" src="/static/official/pic_kf_tb.png" />
          <view class="head__info">
            <text class="head__name">糖果空间客服</text>
            <text class="head__time">工作时间：{{ service.workTime || '09:00-21:00' }}</text>
          </view>
        </view>

        <image v-if="qrcode" class="qrcode" :src="qrcode" mode="aspectFit" />

        <!-- 联系方式 -->
        <view class="list">
          <view class="sitem" @tap="copyWechat">
            <image class="sitem__icon" src="/static/official/ic_kf_wechat.png" />
            <text class="sitem__label">复制客服微信</text>
            <text class="sitem__extra">{{ service.wechat || '未设置' }}</text>
            <image class="sitem__arrow" src="/static/official/ic_me_arrow_n.png" />
          </view>
          <view class="sitem" @tap="callPhone">
            <image class="sitem__icon" src="/static/official/ic_login_phone_n.png" />
            <text class="sitem__label">拨打客服电话</text>
            <text class="sitem__extra">{{ service.phone || '未设置' }}</text>
            <image class="sitem__arrow" src="/static/official/ic_me_arrow_n.png" />
          </view>
          <view class="sitem" @tap="copyQQ">
            <image class="sitem__icon" src="/static/official/ic_pop_qq_n.png" />
            <text class="sitem__label">客服 QQ</text>
            <text class="sitem__extra">{{ service.qq || '未设置' }}</text>
            <image class="sitem__arrow" src="/static/official/ic_me_arrow_n.png" />
          </view>
        </view>

        <!-- total_custom_service.xml：ShapeLinearLayout 圆角 15dip=30rpx 白底，标题 17sp=34rpx bold #30302f 内嵌卡内（左边距 25dip=50rpx） -->
        <view class="faq">
          <text class="faq__title">常见问题</text>
          <view class="faq__list">
            <!-- item_custom_service_total.xml：行高 54dip=108rpx；序号图标 18dip=36rpx + 内容 14sp=28rpx bold #30302f + 箭头 ygkf_arrow_right -->
            <view v-for="(f, i) in faqs" :key="i" class="faq__item">
              <view class="faq__q" @tap="toggle(i)">
                <image class="faq__icon" src="/static/official/ic_question_first.png" />
                <text class="faq__q-text">{{ f.q }}</text>
                <image class="faq__arrow" :class="{ 'is-open': openIndex === i }" src="/static/official/ygkf_arrow_right.png" />
              </view>
              <text v-if="openIndex === i" class="faq__a">{{ f.a }}</text>
            </view>
          </view>
        </view>
        <view class="safe" />
      </block>
    </scroll-view>
  </view>
</template>

<script>
import { configApi } from '@/api'
import { mediaUrl } from '@/api/request'
import { toast, copy } from '@/utils/ui'

export default {
  data() {
    return {
      loading: true,
      service: {},
      openIndex: -1,
      faqs: [
        { q: '如何开通 VIP？', a: '进入「我的 → 开通 VIP」，选择套餐并完成支付即可解锁全部会员特权。' },
        { q: '金币怎么获得？', a: '可通过邀请好友注册、完成平台活动或充值获得，邀请 1 位好友可得 1000 金币。' },
        { q: '提现多久到账？', a: '提交提现申请后，平台将在 1-3 个工作日内审核并打款至你绑定的账户。' }
      ]
    }
  },
  computed: {
    qrcode() {
      return this.service.qrcode ? mediaUrl(this.service.qrcode) : ''
    }
  },
  onLoad() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        this.service = (await configApi.service()) || {}
      } catch (e) {
        this.service = {}
      } finally {
        this.loading = false
      }
    },
    copyWechat() {
      if (!this.service.wechat) {
        toast('暂无客服微信')
        return
      }
      copy(this.service.wechat)
    },
    callPhone() {
      if (!this.service.phone) {
        toast('暂无客服电话')
        return
      }
      uni.makePhoneCall({
        phoneNumber: String(this.service.phone),
        fail: () => copy(this.service.phone)
      })
    },
    copyQQ() {
      if (!this.service.qq) {
        toast('暂无客服 QQ')
        return
      }
      copy(this.service.qq)
    },
    toggle(i) {
      this.openIndex = this.openIndex === i ? -1 : i
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
.head {
  margin: 24rpx 30rpx 0;
  padding: 32rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.head__icon {
  width: 96rpx;
  height: 96rpx;
}
.head__info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}
.head__name {
  font-size: 32rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.head__time {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.qrcode {
  width: 320rpx;
  height: 320rpx;
  margin: 24rpx auto 0;
  border-radius: 16rpx;
  background: #ffffff;
}
.list {
  margin: 24rpx 30rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  overflow: hidden;
}
.sitem {
  height: 104rpx;
  padding: 0 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f5f6f8;
}
.sitem:last-child {
  border-bottom: none;
}
.sitem__icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 24rpx;
}
.sitem__label {
  flex: 1;
  font-size: 28rpx;
  color: #4b4b4b;
}
.sitem__extra {
  font-size: 26rpx;
  color: $tg-text-tertiary;
  margin-right: 12rpx;
}
.sitem__arrow {
  width: 24rpx;
  height: 24rpx;
}
.faq {
  margin: 24rpx 30rpx 0;
  border-radius: 30rpx;
  background: #ffffff;
  overflow: hidden;
}
.faq__title {
  display: block;
  margin: 40rpx 0 20rpx 50rpx;
  font-size: 34rpx;
  font-weight: bold;
  color: #30302f;
}
.faq__list {
  padding: 0 30rpx 28rpx;
}
.faq__item {
  border-bottom: 1rpx solid #f0f0f0;
}
.faq__item:last-child {
  border-bottom: none;
}
.faq__q {
  height: 108rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.faq__icon {
  width: 36rpx;
  height: 36rpx;
  flex-shrink: 0;
}
.faq__q-text {
  flex: 1;
  min-width: 0;
  margin-left: 30rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #30302f;
}
.faq__arrow {
  width: 24rpx;
  height: 24rpx;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.faq__arrow.is-open {
  transform: rotate(90deg);
}
.faq__a {
  display: block;
  padding: 0 0 24rpx 66rpx;
  font-size: 28rpx;
  line-height: 40rpx;
  color: #494949;
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
