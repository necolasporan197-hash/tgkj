<template>
  <view class="page">
    <!-- 全屏底图（对齐 task_center_fragment.xml 的 bg_rwzx） -->
    <image class="page__bg" src="/static/official/bg_rwzx.png" mode="scaleToFill" />

    <!-- 顶部栏（对齐 activity_task_center.xml） -->
    <view class="header">
      <view class="header__back" @tap="goBack">
        <image class="header__back-icon" src="/static/official/homepage_arrow1.png" mode="aspectFit" />
      </view>
      <view class="header__tabs">
        <view class="header__tab" @tap="switchTab(0)">
          <text class="header__tab-title">任务中心</text>
          <view v-show="tab === 0" class="header__indicator" />
        </view>
        <view class="header__spacing" />
        <view class="header__tab" @tap="switchTab(1)">
          <text class="header__tab-sub">我的道具</text>
          <view v-show="tab === 1" class="header__indicator" />
        </view>
      </view>
      <image class="header__jfsm" src="/static/official/bg_jfsm.png" mode="scaleToFill" @tap="showRule" />
    </view>

    <scroll-view scroll-y class="scroll">
      <!-- ===== 任务中心 ===== -->
      <block v-if="tab === 0">
        <view class="hero">
          <image class="hero__title" src="/static/official/pic_rwzx.png" mode="aspectFit" />
          <image class="hero__illu" src="/static/official/bg2_rwzx.png" mode="aspectFit" />
        </view>

        <!-- 果豆余额（bg_kuang1，marginTop 162dip、高 132dip） -->
        <view class="balance">
          <image class="balance__bg" src="/static/official/bg_kuang1.png" mode="scaleToFill" />
          <text class="balance__num">{{ coins }}</text>
          <text class="balance__label">果豆余额</text>
          <view class="balance__btn" @tap="goCoin">
            <image class="balance__btn-bg" src="/static/official/pic_button_hqgd.png" mode="scaleToFill" />
            <text class="balance__btn-text">获取果豆</text>
          </view>
          <view class="balance__detail" @tap="goDetail">
            <text class="balance__detail-text">果豆明细</text>
            <image class="balance__arrow" src="/static/official/ic_task_detail_arrow.png" mode="aspectFit" />
          </view>
        </view>

        <!-- 任务列表（bg_kuang2 标题底图 + 白色圆角卡） -->
        <view class="panel">
          <image class="panel__bg" src="/static/official/bg_kuang2.png" mode="scaleToFill" />
          <view class="panel__card">
            <view v-for="t in list" :key="t.code" class="task">
              <view class="task__icon">
                <image class="task__coin" src="/static/official/jfrw_coin.png" mode="aspectFit" />
                <text class="task__jf">+{{ t.rewardCoins }}</text>
              </view>
              <view class="task__info">
                <text class="task__title">{{ t.title }}</text>
                <text class="task__desc">{{ t.subtitle }}</text>
              </view>
              <view class="task__action" :class="{ 'task__action--done': t.status === 'claimed' }" @tap="onAction(t)">
                <text class="task__action-text">{{ actionText(t) }}</text>
              </view>
            </view>
          </view>
        </view>
      </block>

      <!-- ===== 我的道具 ===== -->
      <view v-else class="props">
        <TgEmpty text="暂无道具" />
      </view>

      <view class="safe" />
    </scroll-view>
  </view>
</template>

<script>
import { taskApi } from '@/api'
import { userStore } from '@/store/user'
import { toast, nav, back } from '@/utils/ui'

/** item_rv_task.xml 行动按钮文案（按任务 action 映射） */
const ACTION_TEXT = { checkin: '去签到', profile: '去完善', publish: '去发布', invite: '去邀请' }

export default {
  data() {
    return {
      store: userStore,
      tab: 0,
      list: []
    }
  },
  computed: {
    coins() {
      return this.store.coins
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadList()
    this.store.fetchProfile()
  },
  methods: {
    goBack() {
      back()
    },
    switchTab(i) {
      this.tab = i
    },
    async loadList() {
      try {
        const res = await taskApi.list()
        this.list = (res && res.list) || []
      } catch (e) {
        this.list = []
      }
    },
    /** 按钮文案：已完成 / 领取 / 去完成 */
    actionText(t) {
      if (t.status === 'claimed') return '已完成'
      if (t.status === 'done') return '领取'
      return ACTION_TEXT[t.action] || '去完成'
    },
    onAction(t) {
      if (t.status === 'claimed') return
      if (t.status === 'done') return this.claim(t)
      return this.goTask(t)
    },
    async claim(t) {
      try {
        const res = await taskApi.claim(t.code)
        toast(res && res.coins ? `领取成功，+${res.coins} 果豆` : '领取成功')
        this.loadList()
        this.store.fetchProfile()
      } catch (e) {
        /* 请求层已提示 */
      }
    },
    async goTask(t) {
      if (t.action === 'checkin') {
        try {
          const res = await taskApi.checkin()
          toast(res && res.coins ? `签到成功，+${res.coins} 果豆` : '签到成功')
          this.loadList()
          this.store.fetchProfile()
        } catch (e) {
          /* 请求层已提示 */
        }
        return
      }
      const map = {
        profile: '/pages/profile/edit',
        publish: '/pages/moment/publish',
        invite: '/pages/invite/invite'
      }
      const url = map[t.action]
      if (url) nav(url)
    },
    goCoin() {
      nav('/pages/wallet/coins')
    },
    goDetail() {
      nav('/pages/wallet/transactions')
    },
    showRule() {
      toast('完成任务可获得果豆，果豆可用于兑换礼物')
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background-color: #fdf3ee;
}
.page__bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.scroll {
  position: relative;
  height: 100vh;
  z-index: 1;
}
.safe {
  height: 40rpx;
}

/* ===== 顶部栏：51dip 高，marginTop 30dip ===== */
.header {
  position: fixed;
  left: 0;
  right: 0;
  top: 60rpx;
  height: 102rpx;
  z-index: 20;
}
.header__back {
  position: absolute;
  left: 0;
  top: 0;
  width: 76rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* iv_back：38×40dip 容器、scaleType=center → 切图按原始尺寸 8×13dip 居中 */
.header__back-icon {
  width: 16rpx;
  height: 26rpx;
}
.header__tabs {
  position: absolute;
  left: 76rpx;
  top: 16rpx;
  height: 76rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.header__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header__tab-title {
  height: 50rpx;
  line-height: 50rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #181716;
}
.header__tab-sub {
  height: 50rpx;
  line-height: 50rpx;
  font-size: 28rpx;
  color: #9b7459;
}
.header__indicator {
  width: 36rpx;
  height: 8rpx;
  margin-top: 6rpx;
  border-radius: 4rpx;
  background-color: #ff731c;
}
.header__spacing {
  width: 60rpx;
  height: 2rpx;
}
.header__jfsm {
  position: absolute;
  right: 0;
  top: 28rpx;
  width: 148rpx;
  height: 74rpx;
}

/* ===== 装饰区（承载 iv_task_title / iv_task_illustration 的绝对定位） ===== */
.hero {
  position: relative;
  height: 324rpx;
}
.hero__title {
  position: absolute;
  left: 54rpx;
  top: 188rpx;
  width: 410rpx;
  height: 158rpx;
}
.hero__illu {
  position: absolute;
  right: 0;
  top: 180rpx;
  width: 404rpx;
  height: 178rpx;
}

/* ===== 果豆余额卡 ===== */
.balance {
  position: relative;
  height: 264rpx;
}
.balance__bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.balance__num {
  position: absolute;
  left: 128rpx;
  top: 62rpx;
  font-size: 52rpx;
  line-height: 74rpx;
  color: #653202;
}
.balance__label {
  position: absolute;
  left: 108rpx;
  top: 156rpx;
  font-size: 26rpx;
  line-height: 36rpx;
  color: #8b735c;
}
.balance__btn {
  position: absolute;
  left: 472rpx;
  top: 60rpx;
  width: 184rpx;
  height: 96rpx;
}
.balance__btn-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.balance__btn-text {
  position: relative;
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: bold;
  color: #ffffff;
}
.balance__detail {
  position: absolute;
  left: 508rpx;
  top: 166rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.balance__detail-text {
  font-size: 24rpx;
  line-height: 32rpx;
  color: #8b735c;
}
.balance__arrow {
  width: 10rpx;
  height: 14rpx;
  margin-left: 10rpx;
}

/* ===== 任务列表 ===== */
.panel {
  position: relative;
  margin: 9rpx 9rpx 0;
}
.panel__bg {
  display: block;
  width: calc(100% - 22rpx);
  height: 146rpx;
  margin: 0 auto;
}
.panel__card {
  position: relative;
  margin-top: -11rpx;
  padding: 0 11rpx 60rpx;
  background-color: #ffffff;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  box-shadow: 0 12rpx 11rpx #e2d5c3;
}
/* item_rv_task.xml：行高 72dip */
.task {
  height: 144rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.task__icon {
  width: 90rpx;
  height: 116rpx;
  margin-left: 34rpx;
  padding: 16rpx 0;
  border-radius: 18rpx;
  background-color: #faf9ed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.task__coin {
  width: 40rpx;
  height: 40rpx;
}
.task__jf {
  font-size: 26rpx;
  line-height: 30rpx;
  color: #3b1f0c;
}
.task__info {
  flex: 1;
  min-width: 0;
  margin-left: 30rpx;
  display: flex;
  flex-direction: column;
}
.task__title {
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.task__desc {
  margin-top: 12rpx;
  margin-right: 24rpx;
  font-size: 24rpx;
  color: #9e9e9e;
}
.task__action {
  width: 128rpx;
  height: 64rpx;
  margin-right: 30rpx;
  border-radius: 18rpx;
  background-color: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.task__action--done {
  background-color: #d8d8d8;
}
.task__action-text {
  font-size: 26rpx;
  font-weight: bold;
  color: #ffffff;
}

/* ===== 我的道具 ===== */
.props {
  padding-top: 200rpx;
}
</style>
