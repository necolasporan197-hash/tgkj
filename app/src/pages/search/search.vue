<template>
  <view class="page">
    <TgNavBar title="搜索" />

    <view class="searchbar">
      <image class="searchbar__icon" src="/static/official/ic_search_n.png" />
      <input
        v-model="keyword"
        class="searchbar__input"
        :focus="autoFocus"
        confirm-type="search"
        placeholder="搜索昵称 / 职业 / 城市"
        placeholder-class="searchbar__ph"
        @confirm="onSearch"
      />
      <image v-if="keyword" class="searchbar__clear" src="/static/official/ic_search_del_n.png" @tap="keyword = ''" />
      <text class="searchbar__btn" @tap="onSearch">搜索</text>
    </view>

    <scroll-view scroll-y class="scroll">
      <!-- 未搜索 -->
      <block v-if="!searched">
        <view class="block">
          <text class="block__title">热门搜索</text>
          <view class="tags">
            <text v-for="t in hotTags" :key="t" class="tag" @tap="useTag(t)">{{ t }}</text>
          </view>
        </view>

        <view v-if="history.length" class="block">
          <view class="block__head">
            <text class="block__title">搜索历史</text>
            <text class="block__clear" @tap="clearHistory">清空</text>
          </view>
          <view class="tags">
            <text v-for="(h, i) in history" :key="i" class="tag" @tap="useTag(h)">{{ h }}</text>
          </view>
        </view>
      </block>

      <!-- 搜索结果 -->
      <block v-else>
        <view v-if="loading" class="loading"><text class="loading__text">搜索中…</text></view>

        <block v-else-if="list.length">
          <view v-for="u in list" :key="u.id" class="ucard" @tap="goUser(u.id)">
            <image class="ucard__avatar" :src="avatarOf(u)" mode="aspectFill" />
            <view class="ucard__info">
              <view class="ucard__row">
                <text class="ucard__name">{{ u.nickname }}</text>
                <image v-if="u.isVip" class="ucard__vip" src="/static/official/pc_tags_vip_n.png" />
              </view>
              <view class="ucard__meta">
                <image class="ucard__sex" :src="u.gender === 2 ? '/static/official/new_ic_female.png' : '/static/official/new_ic_home_man.png'" />
                <text class="ucard__meta-text">{{ ageText(u) }}</text>
                <image class="ucard__meta-dian" src="/static/official/new_ic_home_dian.png" />
                <text class="ucard__meta-text">{{ u.city || '未知城市' }}</text>
                <image class="ucard__meta-dian" src="/static/official/new_ic_home_dian.png" />
                <text class="ucard__meta-text">{{ distText(u.distance) }}</text>
              </view>
            </view>
          </view>
          <view class="safe" />
        </block>

        <TgEmpty v-else text="没有找到相关用户" />
      </block>
    </scroll-view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav, confirm } from '@/utils/ui'
import { ageOf, formatDistance } from '@/utils/format'

const HISTORY_KEY = 'tggy_search_history'

export default {
  data() {
    return {
      store: userStore,
      keyword: '',
      autoFocus: true,
      searched: false,
      loading: false,
      list: [],
      hotTags: ['同城交友', '90后', '健身', '旅行', '音乐', '美食', '摄影', '宠物'],
      history: []
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.history = uni.getStorageSync(HISTORY_KEY) || []
  },
  methods: {
    onSearch() {
      const kw = String(this.keyword || '').trim()
      if (!kw) {
        toast('请输入搜索内容')
        return
      }
      this.keyword = kw
      this.saveHistory(kw)
      this.doSearch(kw)
    },
    useTag(t) {
      this.keyword = t
      this.saveHistory(t)
      this.doSearch(t)
    },
    saveHistory(kw) {
      const list = [kw, ...(this.history || []).filter((h) => h !== kw)].slice(0, 10)
      this.history = list
      uni.setStorageSync(HISTORY_KEY, list)
    },
    async clearHistory() {
      const ok = await confirm('确定清空搜索历史吗？')
      if (!ok) return
      this.history = []
      uni.removeStorageSync(HISTORY_KEY)
      toast('已清空')
    },
    async doSearch(kw) {
      this.loading = true
      this.searched = true
      try {
        // 后端 /users/recommend 不支持 keyword 参数，取推荐流后按关键词本地过滤（优雅降级）
        const res = await userApi.recommend({ keyword: kw, page: 1, pageSize: 50 })
        const arr = (res && res.list) || []
        const k = kw.toLowerCase()
        this.list = arr
          .filter((u) => {
            const hay = [u.nickname, u.occupation, u.bio, u.city, ...(u.tags || [])]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            return hay.includes(k)
          })
          .slice(0, 20)
      } catch (e) {
        this.list = []
      } finally {
        this.loading = false
      }
    },
    goUser(id) {
      if (!id) return
      nav(`/pages/user/detail?id=${id}`)
    },
    avatarOf(u) {
      const a = u && u.avatar
      if (a) return mediaUrl(a)
      return u && u.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    ageText(u) {
      const v = ageOf(u)
      return v ? `${v}岁` : '年龄保密'
    },
    distText(d) {
      return formatDistance(d) || '未知距离'
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
.searchbar {
  margin: 20rpx 30rpx 0;
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: 40rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.searchbar__icon {
  width: 34rpx;
  height: 34rpx;
  margin-right: 12rpx;
}
.searchbar__input {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: $tg-text-primary;
}
.searchbar__ph {
  color: $tg-text-placeholder;
  font-size: 26rpx;
}
.searchbar__clear {
  width: 32rpx;
  height: 32rpx;
  margin: 0 12rpx;
}
.searchbar__btn {
  font-size: 28rpx;
  color: #ff731c;
  font-weight: bold;
}
.block {
  margin: 24rpx 30rpx 0;
  padding: 28rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
}
.block__head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.block__title {
  font-size: 28rpx;
  font-weight: bold;
  color: $tg-text-primary;
}
.block__clear {
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.tags {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.tag {
  margin: 0 16rpx 16rpx 0;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  background: #f5f6f8;
  font-size: 26rpx;
  color: $tg-text-regular;
}
.ucard {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
  background: #f0f1f2;
}
.ucard__info {
  flex: 1;
  min-width: 0;
  margin-left: 30rpx;
  margin-right: 10rpx;
  display: flex;
  flex-direction: column;
}
.ucard__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__name {
  max-width: 180rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ucard__vip {
  width: 68rpx;  /* pc_tags_vip_n 34.0dip×14.0dip */
  height: 28rpx;
  margin-left: 16rpx;
}
.ucard__meta {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__sex {
  width: 18rpx;
  height: 22rpx;
  flex-shrink: 0;
}
/* new_ic_home_dian：2dip 分隔点，左右各 2dip 间距 */
.ucard__meta-dian {
  width: 4rpx;
  height: 4rpx;
  margin: 0 4rpx;
  flex-shrink: 0;
}
.ucard__meta-text {
  margin-left: 4rpx;
  font-size: 24rpx;
  color: #434240;
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
