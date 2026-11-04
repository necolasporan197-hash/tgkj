<template>
  <view class="page">
    <TgNavBar :title="peer.nickname || '聊天'">
      <template #right>
        <text v-if="peer.id" class="nav-online" :class="{ 'is-on': peer.online }">{{ peer.online ? '在线' : '离线' }}</text>
      </template>
    </TgNavBar>

    <scroll-view
      scroll-y
      class="scroll"
      :scroll-into-view="scrollInto"
      :scroll-with-animation="true"
      @scrolltoupper="loadOlder"
    >
      <view v-if="loading && !messages.length" class="loading"><text class="loading__text">加载中…</text></view>
      <view v-else-if="!messages.length" class="loading"><text class="loading__text">还没有消息，打个招呼吧～</text></view>

      <view v-for="m in messages" :key="m.id" :id="'m' + m.id" class="msg" :class="{ 'msg--mine': m.mine }">
        <image class="msg__avatar" :src="m.mine ? myAvatar : avatarOf(peer)" mode="aspectFill" />
        <view class="msg__bubble" :class="{ 'msg__bubble--mine': m.mine }">
          <text class="msg__text">{{ m.content }}</text>
        </view>
      </view>
      <view class="pad" />
    </scroll-view>

    <view v-if="!canSend" class="tip" @tap="goVip">
      <image class="tip__icon" src="/static/official/ic_chat_warning.png" />
      <text class="tip__text">今日免费私信已用完，开通 VIP 可无限畅聊</text>
    </view>

    <view class="bar">
      <input
        v-model="text"
        class="bar__input"
        type="text"
        :disabled="!canSend"
        placeholder="发送消息…"
        placeholder-class="bar__ph"
        confirm-type="send"
        @confirm="send"
      />
      <view class="bar__send" :class="{ 'is-disabled': !canSend || sending || !text.trim() }" @tap="send">发送</view>
    </view>
  </view>
</template>

<script>
import { messageApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast } from '@/utils/ui'
import { pad } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      peerId: 0,
      peer: {},
      messages: [],
      canSend: true,
      page: 1,
      pageSize: 50,
      finished: false,
      loading: false,
      text: '',
      sending: false,
      scrollInto: ''
    }
  },
  computed: {
    myAvatar() {
      return this.store.avatar || '/static/official/bg_avatar_woman.png'
    }
  },
  onLoad(q) {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.peerId = Number(q.peerId || 0)
    this.load(true)
  },
  methods: {
    mediaUrl,
    avatarOf(u) {
      const a = u && u.avatar ? u.avatar : ''
      return a ? mediaUrl(a) : u && u.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    async load(reset) {
      if (this.loading) return
      if (reset) this.finished = false
      this.loading = true
      try {
        const p = reset ? 1 : this.page
        const res = await messageApi.chat(this.peerId, { page: p, pageSize: this.pageSize })
        const arr = (res && res.list) || []
        this.peer = (res && res.peer) || {}
        if (typeof (res && res.canSend) === 'boolean') this.canSend = res.canSend
        if (reset) this.messages = arr
        else this.messages = arr.concat(this.messages)
        this.finished = arr.length < this.pageSize
        this.page = p + 1
        if (reset) this.scrollToBottom()
      } catch (e) {
        this.finished = true
      } finally {
        this.loading = false
      }
    },
    loadOlder() {
      if (!this.loading && !this.finished) this.load(false)
    },
    scrollToBottom() {
      const last = this.messages[this.messages.length - 1]
      if (!last) return
      this.$nextTick(() => {
        this.scrollInto = ''
        this.$nextTick(() => {
          this.scrollInto = `m${last.id}`
        })
      })
    },
    nowStr() {
      const d = new Date()
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    },
    async send() {
      const content = (this.text || '').trim()
      if (!this.canSend || this.sending || !content) return
      this.sending = true
      try {
        const r = await messageApi.send({ toId: this.peerId, content, msgType: 'text' })
        this.messages.push({
          id: (r && r.id) || Date.now(),
          fromId: this.store.uid,
          toId: this.peerId,
          content,
          msgType: 'text',
          extra: null,
          isRead: false,
          createdAt: this.nowStr(),
          mine: true
        })
        this.text = ''
        this.scrollToBottom()
        this.store.fetchUnread()
      } catch (e) {
        /* 已提示 */
      } finally {
        this.sending = false
      }
    },
    goVip() {
      uni.navigateTo({ url: '/pages/vip/vip' })
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f9;
}
.scroll {
  flex: 1;
  height: 0;
  padding: 20rpx 24rpx;
}
.pad {
  height: 20rpx;
}
.nav-online {
  font-size: 24rpx;
  color: $tg-text-placeholder;
}
.nav-online.is-on {
  color: $tg-approved;
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

.msg {
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.msg--mine {
  flex-direction: row-reverse;
}
.msg__avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: $tg-bg-gray;
  flex-shrink: 0;
}
.msg__bubble {
  max-width: 70%;
  margin: 0 16rpx;
  padding: 18rpx 24rpx;
  border-radius: 16rpx 16rpx 16rpx 0;
  background: #ffffff;
}
.msg__bubble--mine {
  border-radius: 16rpx 16rpx 0 16rpx;
  background: #ff731c;
}
.msg__text {
  font-size: 30rpx;
  color: #30302f;
  line-height: 44rpx;
  word-break: break-all;
}
.msg__bubble--mine .msg__text {
  color: #ffffff;
}

.tip {
  flex-shrink: 0;
  padding: 16rpx 24rpx;
  background: #fff4ed;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tip__icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 12rpx;
}
.tip__text {
  flex: 1;
  font-size: 24rpx;
  color: #fa8c51;
}

.bar {
  flex-shrink: 0;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 2rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.bar__input {
  flex: 1;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 30rpx;
  background: #f5f6f8;
  font-size: 30rpx;
  color: #30302f;
}
.bar__ph {
  color: #cecece;
}
.bar__send {
  margin-left: 20rpx;
  min-width: 128rpx;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 30rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bar__send.is-disabled {
  opacity: 0.5;
}
</style>
