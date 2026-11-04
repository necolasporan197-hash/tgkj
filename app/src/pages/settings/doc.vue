<template>
  <view class="page">
    <TgNavBar :title="title" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else>
        <!-- web_view_fragment.xml：FrameLayout fill_parent + SimpleWebView fill_parent（通栏白底容器，无卡片圆角/外边距） -->
        <view class="doc">
          <rich-text v-if="isHtml" :nodes="content" />
          <text v-else class="doc__text">{{ content }}</text>
        </view>
        <view class="safe" />
      </block>
    </scroll-view>
  </view>
</template>

<script>
import { configApi } from '@/api'

const TITLES = {
  user: '用户服务协议',
  privacy: '隐私政策',
  about: '关于我们'
}

export default {
  data() {
    return {
      type: 'user',
      title: '用户协议',
      content: '',
      isHtml: false,
      loading: true
    }
  },
  onLoad(q) {
    this.type = (q && q.type) || 'user'
    this.title = TITLES[this.type] || '用户协议'
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const res = await configApi.agreement(this.type)
        let content = ''
        let title = ''
        if (res && typeof res === 'object') {
          content = res.content || ''
          title = res.title || ''
        } else {
          content = res || ''
        }
        this.content = content || '暂无内容'
        if (title) this.title = title
        this.isHtml = /<[a-z][\s\S]*>/i.test(this.content)
      } catch (e) {
        this.content = '内容加载失败，请稍后重试'
        this.isHtml = false
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
.safe {
  height: 40rpx;
}
.doc {
  min-height: 100vh;
  padding: 32rpx 30rpx;
  background: #ffffff;
}
.doc__text {
  font-size: 28rpx;
  line-height: 48rpx;
  color: $tg-text-regular;
  white-space: pre-wrap;
  word-break: break-all;
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
