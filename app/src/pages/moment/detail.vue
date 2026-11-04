<template>
  <view class="page">
    <TgNavBar title="动态详情">
      <template #right>
        <text class="nav-report" @tap="goReport">举报</text>
      </template>
    </TgNavBar>

    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="moment">
        <!-- 动态主体：通栏行（对齐官方 item_dynamic.xml，白底整行、无圆角/阴影） -->
        <view class="block">
          <view class="head">
            <image class="head__avatar" :src="avatarOf(moment.author)" mode="aspectFill" @tap="goUser(moment.author.id)" />
            <view class="head__info">
              <view class="head__row">
                <text class="head__name">{{ moment.author.nickname }}</text>
                <image v-if="moment.author.auditStatus === 'approved'" class="head__rz" src="/static/official/rzbs.png" />
              </view>
              <view class="head__meta">
                <image
                  class="head__sex"
                  :src="moment.author.gender === 2 ? '/static/official/ic_female.png' : '/static/official/ic_male.png'"
                />
                <text v-if="ageOf(moment.author)" class="head__meta-text">{{ ageOf(moment.author) }}岁</text>
                <text class="head__meta-text">{{ timeAgo(moment.createdAt) }}</text>
                <text v-if="moment.city" class="head__meta-text">{{ moment.city }}</text>
              </view>
            </view>
            <view class="head__chat" @tap="toChat">私聊</view>
          </view>

          <text v-if="moment.content" class="content">{{ moment.content }}</text>

          <view v-if="moment.images && moment.images.length === 1" class="img-one">
            <image class="img-one__img" :src="mediaUrl(moment.images[0])" mode="widthFix" @tap="preview(0)" />
          </view>
          <view v-else-if="moment.images && moment.images.length" class="imgs">
            <image
              v-for="(img, i) in moment.images"
              :key="i"
              class="imgs__cell"
              :src="mediaUrl(img)"
              mode="aspectFill"
              @tap="preview(i)"
            />
          </view>

          <view v-if="moment.topicName" class="topic"><text class="topic__text">#{{ moment.topicName }}#</text></view>

          <view class="foot">
            <view class="foot__act" @tap="like">
              <image class="foot__icon" :src="moment.liked ? '/static/official/ic_dt_like2_n.png' : '/static/official/ic_dt_like_n.png'" />
              <text class="foot__text" :class="{ 'is-on': moment.liked }">{{ moment.likeCount || 0 }}</text>
            </view>
            <view class="foot__act">
              <image class="foot__icon" src="/static/official/ic_dt_bq_n.png" />
              <text class="foot__text">{{ moment.commentCount || 0 }}</text>
            </view>
          </view>
          <!-- 官方底部分割线：item_dynamic.xml view_line（marginLeft 50dip / 1px / #F0F0F0） -->
          <view class="block__line" />
        </view>

        <!-- 评论区：通栏行 -->
        <view class="block block--comment">
          <text class="ctitle">全部评论（{{ (comments && comments.length) || 0 }}）</text>
          <view v-if="comments && comments.length">
            <view v-for="c in comments" :key="c.id" class="comment">
              <image class="comment__avatar" :src="avatarOf(c.user)" mode="aspectFill" />
              <view class="comment__body">
                <text class="comment__name">{{ c.user.nickname }}</text>
                <text class="comment__text">{{ c.content }}</text>
                <text class="comment__time">{{ timeAgo(c.createdAt) }}</text>
              </view>
              <text v-if="canRemove(c)" class="comment__del" @tap="removeComment(c)">删除</text>
            </view>
          </view>
          <view v-else class="ctitle ctitle--empty"><text class="ctitle__text">还没有评论，快来抢沙发</text></view>
        </view>
      </block>

      <TgEmpty v-else text="动态不存在或已删除" />
      <view class="pad" />
    </scroll-view>

    <!-- 底部评论输入栏 -->
    <view class="bar">
      <input
        v-model="text"
        class="bar__input"
        type="text"
        placeholder="说点什么…"
        placeholder-class="bar__ph"
        :maxlength="500"
        confirm-type="send"
        @confirm="send"
      />
      <view class="bar__send" :class="{ 'is-disabled': sending }" @tap="send">发送</view>
    </view>
  </view>
</template>

<script>
import { momentApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, loading, hideLoading, confirm, nav, previewImage } from '@/utils/ui'
import { timeAgo, ageOf, pad } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      id: 0,
      moment: null,
      comments: [],
      loading: false,
      text: '',
      sending: false
    }
  },
  onLoad(q) {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.id = Number(q.id || 0)
    this.loadDetail()
  },
  methods: {
    mediaUrl,
    timeAgo,
    ageOf,
    avatarOf(u) {
      const a = u && u.avatar ? u.avatar : ''
      return a ? mediaUrl(a) : u && u.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    async loadDetail() {
      this.loading = true
      try {
        const d = await momentApi.detail(this.id)
        this.moment = d
        this.comments = (d && d.comments) || []
      } catch (e) {
        this.moment = null
      } finally {
        this.loading = false
      }
    },
    preview(i) {
      const urls = (this.moment.images || []).map((u) => mediaUrl(u))
      previewImage(urls, urls[i])
    },
    goUser(id) {
      if (!id) return
      nav(`/pages/user/detail?id=${id}`)
    },
    toChat() {
      if (!this.moment || !this.moment.author) return
      nav(`/pages/chat/chat?peerId=${this.moment.author.id}`)
    },
    goReport() {
      nav(`/pages/report/report?targetId=${this.id}&targetType=moment`)
    },
    async like() {
      if (!this.moment) return
      try {
        const r = await momentApi.like(this.id)
        this.moment.liked = r.liked
        this.moment.likeCount = r.likeCount
      } catch (e) {
        /* 已提示 */
      }
    },
    canRemove(c) {
      if (!this.moment) return false
      const uid = this.store.uid
      return c.user.id === uid || (this.moment.author && this.moment.author.id === uid)
    },
    async removeComment(c) {
      const ok = await confirm('确定删除这条评论吗？')
      if (!ok) return
      try {
        await momentApi.removeComment(c.id)
        this.comments = this.comments.filter((it) => it.id !== c.id)
        if (this.moment) this.moment.commentCount = Math.max(0, (this.moment.commentCount || 0) - 1)
        toast('已删除')
      } catch (e) {
        /* 已提示 */
      }
    },
    nowStr() {
      const d = new Date()
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    },
    async send() {
      const content = (this.text || '').trim()
      if (!content || this.sending) return
      this.sending = true
      try {
        const r = await momentApi.comment(this.id, { content })
        const p = this.store.profile || {}
        this.comments.push({
          id: (r && r.id) || Date.now(),
          content,
          createdAt: this.nowStr(),
          replyTo: null,
          user: { id: p.id || 0, nickname: p.nickname || '我', avatar: p.avatar }
        })
        if (this.moment) this.moment.commentCount = (this.moment.commentCount || 0) + 1
        this.text = ''
        toast('评论成功')
      } catch (e) {
        /* 已提示 */
      } finally {
        this.sending = false
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
  padding-top: 20rpx;
  padding-bottom: 120rpx;
}
.nav-report {
  font-size: 28rpx;
  color: $tg-text-tertiary;
}
.loading {
  padding: 60rpx 0;
  display: flex;
  justify-content: center;
}
.loading__text {
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.pad {
  height: 40rpx;
}

/* 通栏行：对齐官方 item_dynamic.xml —— 白底整行（无圆角/无阴影），左右 15dip=30rpx 内边距对齐 */
.block {
  padding: 30rpx 30rpx 0;
  background: #ffffff;
  margin-bottom: 20rpx;
}
/* 评论区同样为通栏行 */
.block--comment {
  padding: 30rpx;
}
/* 官方 item_dynamic.xml 底部分割线 view_line：marginLeft 50dip=100rpx / 1rpx / #F0F0F0 */
.block__line {
  margin-left: 100rpx;
  margin-top: 20rpx;
  height: 1rpx;
  background: #f0f0f0;
}
.head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.head__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: $tg-bg-gray;
}
.head__info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.head__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.head__name {
  font-size: 30rpx;
  font-weight: bold;
  color: #595959;
}
.head__rz {
  height: 28rpx;
  margin-left: 10rpx;
}
.head__meta {
  margin-top: 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* item_dynamic.xml: sexlogo 5×8dip（无 src，由代码按性别设置） */
.head__sex {
  width: 10rpx;
  height: 16rpx;
  margin-right: 4rpx;
  flex-shrink: 0;
}
.head__meta-text {
  font-size: 22rpx;
  color: #9e9e9e;
  margin-right: 16rpx;
}
.head__chat {
  min-width: 100rpx;
  height: 52rpx;
  padding: 0 16rpx;
  border-radius: 20rpx;
  background: #fff9f6;
  border: 2rpx solid $tg-accent;
  color: $tg-accent;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.content {
  margin-left: 100rpx;
  margin-top: 20rpx;
  font-size: 30rpx;
  color: #30302f;
  line-height: 46rpx;
}
.img-one {
  margin-left: 100rpx;
  margin-top: 16rpx;
}
.img-one__img {
  width: 100%;
  border-radius: 12rpx;
  background: $tg-bg-gray;
}
.imgs {
  margin-left: 100rpx;
  margin-top: 16rpx;
  margin-right: -12rpx;
  display: flex;
  flex-wrap: wrap;
}
.imgs__cell {
  width: 200rpx;
  height: 200rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 12rpx;
  background: $tg-bg-gray;
}
.topic {
  margin-left: 100rpx;
  margin-top: 16rpx;
}
.topic__text {
  height: 52rpx;
  padding: 0 18rpx 0 16rpx;
  border-radius: 16rpx;
  background: #f8f8f8;
  font-size: 24rpx;
  color: #61605f;
  display: flex;
  align-items: center;
}
/* 底部操作行：对齐官方 item_dynamic.xml（marginLeft 50dip，无上边框，分割线由 view_line 承担） */
.foot {
  margin-left: 100rpx;
  margin-top: 20rpx;
  margin-bottom: 5rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.foot__act {
  margin-right: 48rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.foot__icon {
  width: 32rpx;
  height: 36rpx;
  margin-right: 8rpx;
}
.foot__text {
  font-size: 24rpx;
  color: #828282;
}
.foot__text.is-on {
  color: $tg-primary;
}

.ctitle {
  font-size: 28rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.ctitle--empty {
  padding: 40rpx 0;
  display: flex;
  justify-content: center;
}
.ctitle__text {
  font-size: 24rpx;
  color: $tg-text-tertiary;
  font-weight: normal;
}
.comment {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.comment__avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: $tg-bg-gray;
}
.comment__body {
  flex: 1;
  min-width: 0;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
}
.comment__name {
  font-size: 26rpx;
  color: #595959;
}
.comment__text {
  margin-top: 6rpx;
  font-size: 28rpx;
  color: $tg-text-primary;
  line-height: 40rpx;
}
.comment__time {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: $tg-text-placeholder;
}
.comment__del {
  margin-left: 12rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  color: $tg-text-tertiary;
}

.bar {
  flex-shrink: 0;
  padding: 16rpx 24rpx;
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.bar__input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 36rpx;
  background: $tg-bg-gray;
  font-size: 28rpx;
  color: $tg-text-primary;
}
.bar__ph {
  color: $tg-text-placeholder;
}
.bar__send {
  margin-left: 20rpx;
  min-width: 128rpx;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: 36rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bar__send.is-disabled {
  opacity: 0.5;
}
</style>
