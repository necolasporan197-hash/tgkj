<template>
  <view class="page">
    <TgNavBar title="我的关注" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="list.length">
        <view v-for="u in list" :key="u.id" class="ucard" @tap="goUser(u.id)">
          <image class="ucard__avatar" :src="avatarOf(u)" mode="aspectFill" />
          <view class="ucard__info">
            <view class="ucard__row">
              <text class="ucard__name">{{ u.nickname }}</text>
              <image v-if="u.isVip" class="ucard__rzbs" src="/static/official/pc_tags_vip_n.png" />
            </view>
            <!-- flow_tag：tv_age / tv_work / tv_online 三个独立胶囊 -->
            <view class="ucard__tags">
              <view class="ucard__tag">
                <image
                  class="ucard__tag-icon"
                  :src="u.gender === 2 ? '/static/official/ic_female.png' : '/static/official/ic_male.png'"
                />
                <text class="ucard__tag-text">{{ ageText(u) }}</text>
              </view>
              <view v-if="u.occupation" class="ucard__tag">
                <text class="ucard__tag-text">{{ u.occupation }}</text>
              </view>
              <view class="ucard__tag">
                <text class="ucard__tag-text">{{ u.online ? '在线' : '离线' }}</text>
              </view>
            </view>
            <!-- tv_city：独立城市行 11sp #9e9e9e -->
            <text class="ucard__city">{{ u.city || '未知城市' }}</text>
          </view>
          <view class="ucard__btn" @tap.stop="unfollow(u)">取消关注</view>
        </view>
        <view class="safe" />
      </block>

      <TgEmpty v-else text="还没有关注的人" />
    </scroll-view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav } from '@/utils/ui'
import { ageOf, formatDistance } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      list: [],
      loading: true
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
        this.list = (await userApi.follows()) || []
      } catch (e) {
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
    ageText(u) {
      const v = ageOf(u)
      return v ? `${v}岁` : '年龄保密'
    },
    distText(d) {
      return formatDistance(d) || '未知距离'
    },
    goUser(id) {
      if (!id) return
      nav(`/pages/user/detail?id=${id}`)
    },
    async unfollow(u) {
      try {
        await userApi.unfollow(u.id)
        this.list = this.list.filter((it) => it.id !== u.id)
        toast('已取消关注')
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
/* item_fav_list.xml：整行 99dip 高、白底、底部 1px(#f0f0f0) 分割线、paddingStart 15dip */
.ucard {
  height: 198rpx;
  padding: 0 30rpx;
  background: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background: #f0f1f2;
}
.ucard__info {
  flex: 1;
  min-width: 0;
  margin-left: 36rpx;
  display: flex;
  flex-direction: column;
}
.ucard__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__name {
  max-width: 300rpx;
  padding-top: 6rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* rnrz 标签徽标：34×14dip = 68×28rpx，marginLeft 5dip = 10rpx */
.ucard__rzbs {
  width: 68rpx;  /* pc_tags_vip_n 34.0dip×14.0dip */
  height: 28rpx;
  margin-left: 10rpx;
}
/* flow_tag：tv_age / tv_work / tv_online 三个独立胶囊
   11sp #61605f，高 17dip=34rpx，圆角 5dip=10rpx，底 #f3f3f3，
   左右 padding 7dip=14rpx，水平间距 10dip=20rpx */
.ucard__tags {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__tag {
  height: 34rpx;
  padding: 0 14rpx;
  margin-right: 20rpx;
  border-radius: 10rpx;
  background: #f3f3f3;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__tag:last-child {
  margin-right: 0;
}
.ucard__tag-icon {
  width: 20rpx;
  height: 20rpx;
  margin-right: 4rpx;
}
.ucard__tag-text {
  font-size: 22rpx;
  color: #61605f;
}
/* tv_city：独立城市行 11sp #9e9e9e，marginTop 8dip=16rpx */
.ucard__city {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #9e9e9e;
}
.ucard__btn {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  border: 2rpx solid #e5e5e5;
  color: #61605f;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading {
  padding: 60rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 26rpx;
  color: $tg-text-tertiary;
}
</style>
