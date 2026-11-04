<template>
  <view class="page">
    <TgNavBar title="设置" />
    <scroll-view scroll-y class="scroll">
      <!-- setting_layout.xml：扁平 SimpleItemView 列表（无分组标题 / 无卡片） -->
      <block v-for="it in items" :key="it.key">
        <!-- 7dip = 14rpx 灰条分隔（#fff9f9f9） -->
        <view v-if="it.type === 'gap'" class="gap" />
        <view v-else class="sitem" @tap="onItem(it.key)">
          <text class="sitem__title">{{ it.title }}</text>
          <image v-if="it.arrow !== false" class="sitem__arrow" src="/static/official/item_view_arrow_gray.webp" mode="aspectFit" />
        </view>
      </block>
      <text class="revert" @tap="revertAgreement">撤回同意协议</text>
    </scroll-view>

    <!-- 账号信息弹窗（zhxx_simple_item_view：真实展示当前账号资料） -->
    <view v-if="showAccount" class="mask" @tap="showAccount = false">
      <view class="dialog" @tap.stop>
        <text class="dialog__title">账号信息</text>
        <view class="info">
          <view class="info__row">
            <text class="info__label">昵称</text>
            <text class="info__value">{{ profile.nickname || '未设置' }}</text>
          </view>
          <view class="info__row">
            <text class="info__label">账号 ID</text>
            <text class="info__value">{{ profile.id || '-' }}</text>
          </view>
          <view class="info__row">
            <text class="info__label">手机号</text>
            <text class="info__value">{{ profile.phone || '未绑定' }}</text>
          </view>
          <view class="info__row">
            <text class="info__label">邀请码</text>
            <text class="info__value">{{ profile.inviteCode || '-' }}</text>
          </view>
        </view>
        <view class="dialog__btn" @tap="showAccount = false">知道了</view>
      </view>
    </view>
  </view>
</template>

<script>
import { configApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, confirm, nav } from '@/utils/ui'

/**
 * 设置 —— 1:1 官方 setting_layout.xml（ScrollView + 扁平 SimpleItemView 列表）
 * 顺序与官方完全一致；含 2 处 7dip #f9f9f9 分隔条与底部「撤回同意协议」。
 */
const ITEMS = [
  { key: 'young', title: '青少年模式' },
  { key: 'privacy', title: '隐私设置' },
  { key: 'blacklist', title: '黑名单' },
  { key: 'service', title: '常见问题' },
  { key: 'jurisdiction', title: '系统权限管理' },
  { key: 'notify', title: '通知开关' },
  { key: 'feedback', title: '意见反馈' },
  { key: 'gap1', type: 'gap' },
  { key: 'agreement', title: '用户使用协议' },
  { key: 'privacyPolicy', title: '用户隐私政策' },
  { key: 'gap2', type: 'gap' },
  { key: 'logoff', title: '注销账号' },
  { key: 'update', title: '检查新版本' },
  { key: 'account', title: '账号信息', arrow: false },
  { key: 'logout', title: '退出账号' }
]

const ROUTES = {
  young: '/pages/settings/young',
  privacy: '/pages/settings/privacy',
  blacklist: '/pages/user/blacklist',
  service: '/pages/settings/customer',
  jurisdiction: '/pages/settings/jurisdiction',
  notify: '/pages/settings/notify',
  feedback: '/pages/settings/feedback',
  agreement: '/pages/settings/doc?type=user',
  privacyPolicy: '/pages/settings/doc?type=privacy',
  logoff: '/pages/settings/cancellation'
}

export default {
  data() {
    return {
      store: userStore,
      items: ITEMS,
      showAccount: false,
      checking: false
    }
  },
  computed: {
    profile() {
      return this.store.profile || {}
    },
    version() {
      return (this.store.appConfig && this.store.appConfig.version) || '4.8.2'
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    if (!this.store.appConfig) this.store.loadAppConfig()
    this.store.fetchProfile()
  },
  methods: {
    onItem(key) {
      if (ROUTES[key]) {
        nav(ROUTES[key])
        return
      }
      if (key === 'update') this.checkUpdate()
      else if (key === 'account') this.showAccount = true
      else if (key === 'logout') this.logout()
    },
    /** 检查新版本：与后端 /config/app 的版本号比对 */
    async checkUpdate() {
      if (this.checking) return
      this.checking = true
      try {
        const cfg = await configApi.app()
        const latest = cfg && cfg.version ? String(cfg.version) : ''
        if (!latest || latest === this.version) toast('当前已是最新版本')
        else toast(`发现新版本 ${latest}，请前往应用商店更新`)
      } catch (e) {
        /* 请求层已提示 */
      } finally {
        this.checking = false
      }
    },
    async logout() {
      const ok = await confirm('确定要退出登录吗？')
      if (!ok) return
      this.store.logout()
    },
    /** 撤回同意协议：确认后退出账号，需重新同意协议才能继续使用 */
    async revertAgreement() {
      const ok = await confirm('撤回同意后将退出当前账号，且需重新同意协议后才能继续使用，是否继续？')
      if (!ok) return
      this.store.logout()
    }
  }
}
</script>

<style lang="scss" scoped>
/* setting_layout.xml：ScrollView + 白底列表 */
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}
.scroll {
  flex: 1;
  height: 0;
}
/* View height=7dip=14rpx background=#fff9f9f9 */
.gap {
  height: 14rpx;
  background-color: #f9f9f9;
}
/* SimpleItemView：minHeight 60dip（ll_layout）+ 1px divider，左右 style=main_margin 15dip=30rpx */
.sitem {
  position: relative;
  height: 122rpx;
  padding: 0 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* divider_view：1px #fff0f0f0、左右 margin 15dip=30rpx */
.sitem::after {
  content: '';
  position: absolute;
  left: 30rpx;
  right: 30rpx;
  bottom: 0;
  height: 2rpx;
  background-color: #f0f0f0;
  transform: scaleY(0.5);
}
/* title_text_view：14sp #ff494949、gravity center_vertical、marginRight 15dip=30rpx */
.sitem__title {
  flex: 1;
  margin-right: 30rpx;
  font-size: 28rpx;
  color: #494949;
}
/* arrow_image_view：宽 15dip、src item_view_arrow_gray、scaleType centerInside（按资源固有比例） */
.sitem__arrow {
  width: 14rpx;
  height: 26rpx;
  margin-left: 2rpx;
  flex-shrink: 0;
}
/* revert_agreement：14sp #ffbfbec5、居中、marginTop 24dip=48rpx、marginBottom 50dip=100rpx */
.revert {
  display: block;
  margin-top: 48rpx;
  margin-bottom: 100rpx;
  text-align: center;
  font-size: 28rpx;
  color: #bfbec5;
}

/* ===== 账号信息弹窗 ===== */
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
.dialog {
  width: 600rpx;
  padding: 40rpx 32rpx 28rpx;
  border-radius: 20rpx;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}
.dialog__title {
  font-size: 32rpx;
  font-weight: bold;
  color: #181716;
  text-align: center;
}
.info {
  margin-top: 24rpx;
}
.info__row {
  height: 84rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.info__label {
  font-size: 28rpx;
  color: #828282;
}
.info__value {
  font-size: 28rpx;
  color: #30302f;
}
.dialog__btn {
  margin-top: 24rpx;
  height: 88rpx;
  border-radius: 30rpx;
  background-color: #ff731c;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
