<template>
  <view class="page">
    <TgNavBar title="我的战队" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else>
        <!-- 已加入战队 -->
        <block v-if="mine">
          <view class="tcard">
            <view class="tcard__head">
              <view class="tcard__logo">{{ (mine.name || '战').slice(0, 1) }}</view>
              <view class="tcard__info">
                <text class="tcard__name">{{ mine.name }}</text>
                <text class="tcard__meta">队长：{{ mine.leader && mine.leader.nickname ? mine.leader.nickname : '-' }} · {{ mine.member_count || members.length }} 人</text>
              </view>
              <text class="tcard__role">{{ mine.role === 'leader' ? '队长' : '成员' }}</text>
            </view>

            <view class="tcard__notice">
              <text class="tcard__notice-label">战队公告</text>
              <text class="tcard__notice-text">{{ mine.notice || '队长还没有发布公告' }}</text>
            </view>

            <view v-if="members.length" class="tcard__members">
              <image v-for="m in members.slice(0, 8)" :key="m.id" class="tcard__avatar" :src="avatarOf(m)" mode="aspectFill" />
            </view>

            <view class="tcard__ops">
              <view class="tg-btn tg-btn--plain tcard__op" @tap="openNotice">修改公告</view>
              <view class="tcard__op tcard__op--danger" @tap="leave">退出战队</view>
            </view>
          </view>
        </block>

        <!-- 未加入战队 -->
        <block v-else>
          <view class="create">
            <text class="create__title">还没有加入战队</text>
            <text class="create__desc">创建属于你的战队，和好友一起玩</text>
            <view class="tg-btn create__btn" @tap="openCreate">创建战队</view>
          </view>

          <block v-if="list.length">
            <text class="section">热门战队</text>
            <view class="list">
              <view v-for="t in list" :key="t.id" class="row">
                <view class="row__logo">{{ (t.name || '战').slice(0, 1) }}</view>
                <view class="row__info">
                  <text class="row__name">{{ t.name }}</text>
                  <text class="row__meta">队长：{{ t.leaderName || '-' }} · {{ t.member_count || 0 }} 人</text>
                </view>
                <view class="row__join" @tap="join(t)">加入</view>
              </view>
            </view>
            <view class="safe" />
          </block>

          <TgEmpty v-else text="暂无战队" btn-text="创建战队" @action="openCreate" />
        </block>
      </block>
    </scroll-view>

    <!-- 通用输入弹窗 -->
    <view v-if="showModal" class="mask" @tap="closeModal">
      <view class="dialog" @tap.stop>
        <text class="dialog__title">{{ modalMode === 'create' ? '创建战队' : '修改公告' }}</text>
        <input
          v-model="modalValue"
          class="dialog__input"
          :placeholder="modalMode === 'create' ? '请输入战队名称（30 字内）' : '请输入战队公告（200 字内）'"
          :maxlength="modalMode === 'create' ? 30 : 200"
        />
        <view class="dialog__ops">
          <view class="dialog__btn" @tap="closeModal">取消</view>
          <view class="dialog__btn dialog__btn--primary" @tap="confirmModal">确定</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { teamApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, confirm } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      loading: true,
      mine: null,
      list: [],
      showModal: false,
      modalMode: 'create',
      modalValue: ''
    }
  },
  computed: {
    members() {
      return (this.mine && this.mine.members) || []
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const [mine, list] = await Promise.all([teamApi.mine(), teamApi.list()])
        this.mine = mine || null
        this.list = list || []
      } catch (e) {
        this.mine = null
        this.list = []
      } finally {
        this.loading = false
      }
    },
    avatarOf(u) {
      const a = u && u.avatar
      if (a) return mediaUrl(a)
      return u && u.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    openCreate() {
      this.modalMode = 'create'
      this.modalValue = ''
      this.showModal = true
    },
    openNotice() {
      if (!this.mine || this.mine.role !== 'leader') {
        toast('仅队长可修改公告')
        return
      }
      this.modalMode = 'notice'
      this.modalValue = this.mine.notice || ''
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
    },
    async confirmModal() {
      const value = String(this.modalValue || '').trim()
      if (!value) {
        toast(this.modalMode === 'create' ? '请输入战队名称' : '请输入战队公告')
        return
      }
      try {
        if (this.modalMode === 'create') {
          await teamApi.create({ name: value })
          toast('战队创建成功')
        } else {
          await teamApi.updateNotice(value)
          toast('公告已更新')
        }
        this.showModal = false
        await this.load()
      } catch (e) {
        /* 已提示 */
      }
    },
    async join(t) {
      const ok = await confirm(`确定加入「${t.name}」吗？`)
      if (!ok) return
      try {
        await teamApi.join(t.id)
        toast('加入成功')
        await this.load()
      } catch (e) {
        /* 已提示 */
      }
    },
    async leave() {
      const ok = await confirm('确定要退出战队吗？')
      if (!ok) return
      try {
        await teamApi.leave()
        toast('已退出战队')
        await this.load()
      } catch (e) {
        /* 已提示 */
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
.safe {
  height: 40rpx;
}
.tcard {
  margin: 24rpx 30rpx 0;
  padding: 28rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.tcard__head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tcard__logo {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 44rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tcard__info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}
.tcard__name {
  font-size: 34rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.tcard__meta {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.tcard__role {
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  background: #fff1e9;
  color: #ff731c;
  font-size: 22rpx;
}
.tcard__notice {
  margin-top: 24rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}
.tcard__notice-label {
  font-size: 22rpx;
  color: $tg-text-tertiary;
}
.tcard__notice-text {
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 38rpx;
  color: $tg-text-regular;
}
.tcard__members {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.tcard__avatar {
  width: 56rpx;
  height: 56rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 28rpx;
  background: #f0f1f2;
}
.tcard__ops {
  margin-top: 28rpx;
  display: flex;
  flex-direction: row;
}
.tcard__op {
  flex: 1;
}
.tcard__op--danger {
  margin-left: 24rpx;
  height: 88rpx;
  border-radius: 44rpx;
  color: #f26666;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #f26666;
}
.create {
  margin: 24rpx 30rpx 0;
  padding: 44rpx 30rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.create__title {
  font-size: 32rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.create__desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.create__btn {
  width: 320rpx;
  margin-top: 28rpx;
  height: 100rpx;
  line-height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}
.section {
  margin: 32rpx 30rpx 0;
  font-size: 28rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.list {
  margin: 20rpx 30rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  overflow: hidden;
}
.row {
  padding: 20rpx 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f5f6f8;
}
.row:last-child {
  border-bottom: none;
}
.row__logo {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: #eef1f5;
  color: #ff731c;
  font-size: 36rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.row__info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.row__name {
  font-size: 30rpx;
  color: $tg-text-primary;
}
.row__meta {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $tg-text-tertiary;
}
.row__join {
  height: 60rpx;
  padding: 0 32rpx;
  border-radius: 30rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: #ffffff;
  display: flex;
  flex-direction: column;
}
.dialog__title {
  font-size: 32rpx;
  font-weight: bold;
  color: $tg-text-primary;
  text-align: center;
}
.dialog__input {
  margin-top: 32rpx;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 12rpx;
  background: #f5f6f8;
  font-size: 28rpx;
  color: $tg-text-primary;
}
.dialog__ops {
  margin-top: 32rpx;
  display: flex;
  flex-direction: row;
}
.dialog__btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  background: #f0f1f2;
  color: $tg-text-secondary;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog__btn--primary {
  margin-left: 24rpx;
  background: #ff731c;
  color: #ffffff;
}
</style>
