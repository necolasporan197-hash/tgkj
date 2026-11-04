<template>
  <view class="page">
    <TgNavBar title="认证中心" />
    <scroll-view scroll-y class="scroll">
      <!-- 状态卡 -->
      <view class="status" :class="auditCls">
        <view class="status__head">
          <text class="status__title">{{ auditText }}</text>
          <text v-if="auditStatus === 'pending'" class="status__tag">审核中</text>
        </view>
        <text class="status__desc">{{ auditDesc }}</text>
        <view v-if="auditStatus !== 'approved'" class="status__btn" @tap="goSubmit('profile')">
          {{ auditStatus === 'pending' ? '查看进度' : (auditStatus === 'rejected' ? '重新认证' : '去认证') }}
        </view>
      </view>

      <!-- 认证类型 -->
      <view class="section-title">认证类型</view>
      <view class="card">
        <view v-for="(it, i) in merged" :key="it.type" class="vitem" @tap="goSubmit(it.type)">
          <view class="vitem__icon">{{ typeEmoji(i) }}</view>
          <view class="vitem__info">
            <text class="vitem__name">{{ it.name }}</text>
            <text class="vitem__desc tg-ellipsis">{{ it.desc }}</text>
          </view>
          <text class="vitem__status" :class="itemCls(it.status)">{{ itemText(it.status) }}</text>
        </view>
      </view>

      <!-- 认证记录 -->
      <view class="section-title">认证记录</view>
      <view class="card">
        <view v-for="r in records" :key="r.id" class="rec">
          <view class="rec__info">
            <text class="rec__name">{{ typeName(r.vtype) }}</text>
            <text class="rec__time">{{ formatTime(r.created_at) }}</text>
            <text v-if="r.status === 'rejected' && r.reject_reason" class="rec__reason">驳回原因：{{ r.reject_reason }}</text>
          </view>
          <text class="rec__status" :class="itemCls(r.status)">{{ itemText(r.status) }}</text>
        </view>
        <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>
        <TgEmpty v-else-if="!records.length" text="暂无认证记录" />
      </view>
      <view class="safe" />
    </scroll-view>
  </view>
</template>

<script>
import { verificationApi } from '@/api'
import { userStore } from '@/store/user'
import { nav } from '@/utils/ui'
import { formatTime } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      types: [],
      status: {},
      records: [],
      loading: false
    }
  },
  computed: {
    auditStatus() {
      return this.status.userAuditStatus || ''
    },
    auditText() {
      const s = this.auditStatus
      if (s === 'approved') return '已认证'
      if (s === 'pending') return '认证审核中'
      if (s === 'rejected') return '认证未通过'
      return '未认证'
    },
    auditCls() {
      const s = this.auditStatus
      if (s === 'approved') return 'is-approved'
      if (s === 'pending') return 'is-pending'
      if (s === 'rejected') return 'is-rejected'
      return 'is-none'
    },
    auditDesc() {
      const s = this.auditStatus
      if (s === 'approved') return '你已通过平台认证，可获得更多曝光与信任'
      if (s === 'pending') return '资料正在审核中，请耐心等待结果'
      if (s === 'rejected') return this.status.auditRemark || '认证未通过，请修改后重新提交'
      return '完成认证可获得更多曝光机会与信任标识'
    },
    merged() {
      const items = this.status.items || []
      return (this.types || []).map((t) => {
        const hit = items.find((i) => i.type === t.type) || {}
        return { ...t, status: hit.status || 'none', rejectReason: hit.rejectReason || '' }
      })
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadAll()
  },
  methods: {
    formatTime,
    typeEmoji(i) {
      const arr = ['📝', '🪪', '🙂', '🎬', '🚗']
      return arr[i % arr.length]
    },
    typeName(type) {
      const t = (this.types || []).find((x) => x.type === type)
      return (t && t.name) || type
    },
    itemText(s) {
      if (s === 'approved') return '已认证'
      if (s === 'pending') return '审核中'
      if (s === 'rejected') return '未通过'
      return '未认证'
    },
    itemCls(s) {
      if (s === 'approved') return 'is-approved'
      if (s === 'pending') return 'is-pending'
      if (s === 'rejected') return 'is-rejected'
      return 'is-none'
    },
    goSubmit(type) {
      const it = (this.merged || []).find((x) => x.type === type)
      if (it && it.status === 'approved') {
        uni.showToast({ title: '该认证已完成', icon: 'none' })
        return
      }
      if (it && it.status === 'pending') {
        uni.showToast({ title: '该认证正在审核中', icon: 'none' })
        return
      }
      nav(`/pages/verification/submit?type=${type}`)
    },
    async loadAll() {
      this.loading = true
      try {
        const [types, status, records] = await Promise.all([
          verificationApi.types(),
          verificationApi.status(),
          verificationApi.records()
        ])
        this.types = types || []
        this.status = status || {}
        this.records = records || []
      } catch (e) {
        /* 失败已提示 */
      } finally {
        this.loading = false
      }
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
.status {
  margin: 20rpx 30rpx 0;
  padding: 44rpx 32rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
}
.status.is-none {
  background: #ff731c;
}
.status.is-pending {
  background: #ffa726;
}
.status.is-approved {
  background: #35b45f;
}
.status.is-rejected {
  background: #f26666;
}
.status__head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.status__title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}
.status__tag {
  margin-left: 16rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 22rpx;
}
.status__desc {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 34rpx;
}
.status__btn {
  margin-top: 28rpx;
  align-self: flex-start;
  padding: 14rpx 40rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #ff731c;
  font-size: 26rpx;
  font-weight: bold;
}
.section-title {
  margin: 32rpx 30rpx 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.card {
  margin: 0 30rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  overflow: hidden;
}
.vitem {
  padding: 28rpx 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f0f1f2;
}
.vitem:last-child {
  border-bottom: none;
}
.vitem__icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: #fff4ec;
  font-size: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vitem__info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.vitem__name {
  font-size: 30rpx;
  color: $tg-text-primary;
}
.vitem__desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $tg-text-tertiary;
}
.vitem__status {
  margin-left: 16rpx;
  font-size: 24rpx;
}
.vitem__status.is-approved,
.rec__status.is-approved {
  color: $tg-approved;
}
.vitem__status.is-pending,
.rec__status.is-pending {
  color: #ffa726;
}
.vitem__status.is-rejected,
.rec__status.is-rejected {
  color: $tg-rejected;
}
.vitem__status.is-none,
.rec__status.is-none {
  color: #ff731c;
}
.rec {
  padding: 28rpx 0;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 2rpx solid #f0f1f2;
}
.rec:last-child {
  border-bottom: none;
}
.rec__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.rec__name {
  font-size: 30rpx;
  color: $tg-text-primary;
}
.rec__time {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $tg-text-placeholder;
}
.rec__reason {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $tg-rejected;
}
.rec__status {
  margin-left: 16rpx;
  font-size: 24rpx;
}
.loading {
  padding: 32rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.safe {
  height: 40rpx;
}
</style>
