<template>
  <view class="page">
    <!-- detail_title_bar：右区 share(24×29dip) + empty(20dip) + more(ic_profile_syh) -->
    <TgNavBar title="个人详情">
      <template #right>
        <image class="nav__share" src="/static/official/ic_profile_share_n.png" />
        <image class="nav__more" src="/static/official/ic_profile_syh.png" @tap="toReport" />
      </template>
    </TgNavBar>

    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="user">
        <!-- basic_top：450dip(900rpx) 通栏头图 + female_common_info 叠加层 -->
        <view class="top">
          <image class="top__img" :src="avatarUrl" mode="aspectFill" @tap="previewAvatar" />
          <view class="top__shade" />

          <!-- ll_info：白字昵称 17sp bold + 认证 rzbs + 在线胶囊 -->
          <view class="top__info">
            <view class="top__namerow">
              <text class="top__name">{{ user.nickname }}</text>
              <image v-if="user.auditStatus === 'approved'" class="top__rzbs" src="/static/official/rzbs.png" />
              <view class="top__online">
                <image
                  class="top__online-icon"
                  :src="user.online ? '/static/official/ic_home_online_n.png' : '/static/official/ic_home_offline_n.png'"
                />
                <text class="top__online-text">{{ user.online ? '在线' : '离线' }}</text>
              </view>
            </view>
          </view>

          <!-- ll_actions：举报 + 关注（右侧竖排，高 47dip） -->
          <view class="top__actions">
            <view class="top__action" @tap="toReport">
              <image class="top__action-icon" src="/static/official/ic_profile_report.png" />
              <text class="top__action-text">举报</text>
            </view>
            <view class="top__action" @tap="toggleFollow">
              <image
                class="top__action-icon"
                :src="user.followed ? '/static/official/homepage_follow_true.png' : '/static/official/homepage_follow.png'"
              />
              <text class="top__action-text">{{ user.followed ? '已关注' : '关注' }}</text>
            </view>
          </view>
        </view>

        <!-- female_detail_info：15dip(30rpx) 圆角信息面板 -->
        <view class="panel">
          <view class="metarow">
            <image
              class="metarow__sex"
              :src="user.gender === 2 ? '/static/official/ic_female.png' : '/static/official/ic_male.png'"
            />
            <text class="metarow__text">{{ ageText }} · {{ user.city || '未知城市' }} · {{ distText }}</text>
          </view>

          <template v-if="hasProfile">
            <view class="panel__title">个人资料</view>
            <view v-if="user.occupation" class="kv">
              <text class="kv__k">职业</text>
              <text class="kv__v">{{ user.occupation }}</text>
            </view>
            <view v-if="user.height" class="kv">
              <text class="kv__k">身高</text>
              <text class="kv__v">{{ user.height }} cm</text>
            </view>
            <view v-if="user.weight" class="kv">
              <text class="kv__k">体重</text>
              <text class="kv__v">{{ user.weight }} kg</text>
            </view>
            <view v-if="user.bio" class="kv kv--bio">
              <text class="kv__k">简介</text>
              <text class="kv__v">{{ user.bio }}</text>
            </view>
          </template>

          <view class="wechat">
            <text class="wechat__label">微信号</text>
            <view class="wechat__val">
              <text class="wechat__text" :class="{ 'is-locked': user.wechatLocked }">{{ user.wechat || '未填写' }}</text>
              <text v-if="user.wechatLocked" class="wechat__unlock" @tap="unlockWechat">解锁 ›</text>
              <text v-else-if="user.wechat" class="wechat__copy" @tap="copyWechat">复制</text>
            </view>
          </view>
        </view>

        <!-- detail_photo_view：TA的相册 15sp bold #181716 -->
        <view class="sec">
          <view class="sec__head">
            <image class="sec__icon" src="/static/official/homepage_album.png" />
            <text class="sec__title sec__title--album">TA的相册</text>
            <text v-if="user.albumLocked" class="sec__more" @tap="unlockAlbum">立即解锁 ›</text>
          </view>

          <view v-if="albumPhotos.length" class="album">
            <view v-for="(p, i) in albumPhotos" :key="i" class="album__item" @tap="onAlbumTap(i)">
              <image v-if="p" class="album__img" :class="{ 'is-blur': user.albumLocked }" :src="p" mode="aspectFill" />
              <view v-else class="album__img album__img--empty" />
              <view v-if="user.albumLocked" class="album__mask">
                <image class="album__lock" src="/static/official/icons_lock_icon.png" />
              </view>
            </view>
          </view>
          <view v-else class="sec__empty">
            <image class="sec__empty-icon" src="/static/official/ic_profile_xckby.png" />
            <text class="sec__empty-text">相册已上锁，VIP可免费查看</text>
          </view>

          <view class="rnrz">
            <image class="rnrz__icon" src="/static/official/xqy_xcrz.png" />
            <text class="rnrz__text">相册带有“本人”标识的为认证照片</text>
          </view>
        </view>

        <!-- detail_tags：个性标签 16sp bold color_171716 -->
        <view v-if="tags.length" class="sec">
          <view class="sec__head">
            <image class="sec__icon" src="/static/official/homepage_bq.png" />
            <text class="sec__title">个性标签</text>
          </view>
          <view class="tags">
            <text v-for="t in tags" :key="t" class="tags__item">{{ t }}</text>
          </view>
        </view>

        <!-- detail_bottom：动态邀约 16sp bold + 空态 -->
        <view class="sec">
          <view class="sec__head">
            <image class="sec__icon" src="/static/official/homepage_dt.png" />
            <text class="sec__title">动态邀约</text>
          </view>
          <view class="dyn-empty">
            <image class="dyn-empty__icon" src="/static/official/ic_profile_xckby.png" />
            <text class="dyn-empty__text">暂无动态</text>
          </view>
        </view>

        <!-- detail_tip：安全提示 背景 #f8f8f8 -->
        <view class="tip">
          <view class="tip__row">
            <image class="tip__dot" src="/static/official/ic_profile_xinhao.png" />
            <text class="tip__text">请勿通过约会进行不法交易，如被举报核实将被封号处理</text>
          </view>
          <view class="tip__row">
            <image class="tip__dot" src="/static/official/ic_profile_xinhao.png" />
            <text class="tip__text">如对方信息不实或进行广告营销行为，可点击</text>
            <text class="tip__link" @tap="toReport">【快速举报】</text>
          </view>
        </view>
      </block>

      <TgEmpty v-else text="用户不存在或已注销" />
    </scroll-view>

    <!-- 底部操作区：小圆钮 + 实心 #ff731c 主按钮「私聊Ta」 -->
    <view v-if="user" class="foot">
      <template v-if="isSelf">
        <view class="foot__main" @tap="goEdit">
          <text class="foot__main-text">编辑资料</text>
        </view>
      </template>
      <template v-else>
        <view class="foot__op" @tap="toBlack">
          <image class="foot__op-icon" src="/static/official/ic_profile_black.png" />
          <text class="foot__op-text">拉黑</text>
        </view>
        <view class="foot__op" @tap="toGift">
          <image class="foot__op-icon" src="/static/official/ic_bmxq_chat.png" />
          <text class="foot__op-text">送礼</text>
        </view>
        <view class="foot__main" @tap="toChat">
          <image class="foot__main-icon" src="/static/official/ic_profile_chat_n.png" />
          <text class="foot__main-text">私聊Ta</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav, back, confirm, copy, previewImage } from '@/utils/ui'
import { ageOf, formatDistance } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      id: 0,
      user: null,
      loading: true
    }
  },
  computed: {
    isSelf() {
      return !!this.user && Number(this.user.id) === Number(this.store.uid)
    },
    avatarUrl() {
      const a = this.user && this.user.avatar
      if (a) return mediaUrl(a)
      return this.user && this.user.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    ageText() {
      const v = ageOf(this.user)
      return v ? `${v}岁` : '年龄保密'
    },
    distText() {
      return formatDistance(this.user && this.user.distance) || '未知距离'
    },
    tags() {
      return (this.user && this.user.tags) || []
    },
    hasProfile() {
      const u = this.user || {}
      return !!(u.occupation || u.height || u.weight || u.bio)
    },
    albumPhotos() {
      const list = ((this.user && this.user.photos) || []).slice(0, 3)
      if (this.user && this.user.albumLocked) {
        while (list.length < 3) list.push('')
      }
      return list
    }
  },
  onLoad(q) {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.id = Number(q.id) || 0
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        this.user = await userApi.detail(this.id)
      } catch (e) {
        this.user = null
      } finally {
        this.loading = false
      }
    },
    previewAvatar() {
      previewImage([this.avatarUrl], this.avatarUrl)
    },
    onAlbumTap(i) {
      if (this.user.albumLocked) {
        this.unlockAlbum()
        return
      }
      const list = (this.user.photos || []).map((u) => mediaUrl(u))
      previewImage(list, list[i])
    },
    async toggleFollow() {
      try {
        if (this.user.followed) {
          await userApi.unfollow(this.id)
          this.user.followed = false
          toast('已取消关注')
        } else {
          await userApi.follow(this.id)
          this.user.followed = true
          toast('已关注')
        }
      } catch (e) {
        /* 已提示 */
      }
    },
    async unlockAlbum() {
      try {
        await userApi.unlock({ targetId: this.id, unlockType: 'album' })
        toast('解锁成功')
        this.load()
      } catch (e) {
        /* 已提示 */
      }
    },
    async unlockWechat() {
      try {
        await userApi.unlock({ targetId: this.id, unlockType: 'wechat' })
        toast('解锁成功')
        this.load()
      } catch (e) {
        /* 已提示 */
      }
    },
    copyWechat() {
      if (this.user.wechat) copy(this.user.wechat)
    },
    toChat() {
      nav(`/pages/chat/chat?peerId=${this.id}`)
    },
    toGift() {
      nav(`/pages/gift/send?toId=${this.id}`)
    },
    toReport() {
      nav(`/pages/report/report?targetId=${this.id}`)
    },
    async toBlack() {
      const ok = await confirm('确定将该用户加入黑名单吗？加入后将不再看到 TA 的动态和推荐。')
      if (!ok) return
      try {
        await userApi.addBlack(this.id)
        toast('已加入黑名单')
        back()
      } catch (e) {
        /* 已提示 */
      }
    },
    goEdit() {
      nav('/pages/profile/edit')
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f7f7;
}
/* detail_title_bar 右区：share 24×29dip=48×58rpx；share 与 more 间隔 20dip=40rpx */
.nav__share {
  width: 48rpx;
  height: 58rpx;
}
.nav__more {
  width: 48rpx;
  height: 48rpx;
  margin-left: 40rpx;
}
.scroll {
  flex: 1;
  height: 0;
}

/* ---- basic_top：450dip 通栏头图 ---- */
.top {
  position: relative;
  width: 100%;
  height: 900rpx;
  overflow: hidden;
  background: #e9eaec;
}
.top__img {
  width: 100%;
  height: 100%;
}
.top__shade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 360rpx;
  background: rgba(0, 0, 0, 0.22);
}
.top__info {
  position: absolute;
  left: 30rpx;
  right: 220rpx;
  bottom: 200rpx;
}
.top__namerow {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.top__name {
  max-width: 420rpx;
  font-size: 34rpx;
  font-weight: bold;
  color: #ffffff;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.top__rzbs {
  height: 30rpx;
  margin-left: 10rpx;
}
.top__online {
  margin-left: 10rpx;
  height: 30rpx;
  padding: 0 10rpx;
  border-radius: 16rpx;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: row;
  align-items: center;
}
.top__online-icon {
  width: 16rpx;
  height: 16rpx;
  margin-right: 6rpx;
}
.top__online-text {
  font-size: 20rpx;
  color: #ffffff;
}

/* ---- ll_actions：右侧竖排 47dip ---- */
.top__actions {
  position: absolute;
  right: 30rpx;
  bottom: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.top__action {
  width: 120rpx;
  height: 94rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.top__action + .top__action {
  margin-top: 30rpx;
}
.top__action-icon {
  width: 40rpx;
  height: 40rpx;
}
.top__action-text {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #ffffff;
}

/* ---- female_detail_info：圆角 15dip 信息面板 ---- */
.panel {
  position: relative;
  margin-top: -160rpx;
  padding: 30rpx 30rpx 24rpx;
  border-radius: 30rpx 30rpx 0 0;
  background: #ffffff;
}
.metarow {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.metarow__sex {
  width: 18rpx;
  height: 22rpx;
  margin-right: 8rpx;
}
.metarow__text {
  font-size: 22rpx;
  color: #61605f;
}
.panel__title {
  margin-top: 26rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #181716;
}
.kv {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.kv--bio {
  align-items: flex-start;
}
.kv__k {
  width: 110rpx;
  flex-shrink: 0;
  font-size: 26rpx;
  color: #828282;
}
.kv__v {
  flex: 1;
  font-size: 28rpx;
  color: #30302f;
  line-height: 40rpx;
}
.wechat {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.wechat__label {
  font-size: 28rpx;
  color: #61605f;
}
.wechat__val {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.wechat__text {
  font-size: 30rpx;
  color: #30302f;
}
.wechat__text.is-locked {
  color: #b9b9b9;
}
.wechat__unlock {
  margin-left: 16rpx;
  font-size: 26rpx;
  color: #ff731c;
}
.wechat__copy {
  margin-left: 16rpx;
  padding: 4rpx 20rpx;
  border-radius: 22rpx;
  border: 2rpx solid #ff731c;
  font-size: 24rpx;
  color: #ff731c;
}

/* ---- 通栏区块 ---- */
.sec {
  margin-top: 8rpx;
  padding: 30rpx 30rpx 20rpx;
  background: #ffffff;
}
.sec__head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.sec__icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 18rpx;
}
.sec__title {
  font-size: 32rpx;
  font-weight: bold;
  color: #171716;
}
.sec__title--album {
  font-size: 30rpx;
  color: #181716;
}
.sec__more {
  margin-left: auto;
  font-size: 24rpx;
  color: #ff731c;
}
.sec__empty {
  margin-top: 24rpx;
  padding: 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sec__empty-icon {
  width: 82rpx;
  height: 64rpx;
}
.sec__empty-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #f09153;
}

/* ---- 相册 ---- */
.album {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
}
.album__item {
  position: relative;
  flex: 1;
  height: 200rpx;
  margin-right: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f0f1f2;
}
.album__item:last-child {
  margin-right: 0;
}
.album__img {
  width: 100%;
  height: 100%;
  background: #f0f1f2;
}
.album__img.is-blur {
  filter: blur(10rpx);
}
.album__img--empty {
  background: #e9eaec;
}
.album__mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}
.album__lock {
  width: 48rpx;
  height: 48rpx;
}
.rnrz {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.rnrz__icon {
  width: 22rpx;
  height: 22rpx;
  margin-right: 10rpx;
}
.rnrz__text {
  font-size: 22rpx;
  color: #b59881;
}

/* ---- 标签 ---- */
.tags {
  margin-top: 24rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.tags__item {
  height: 52rpx;
  line-height: 52rpx;
  margin: 0 16rpx 16rpx 0;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #f3f3f3;
  font-size: 24rpx;
  color: #61605f;
}

/* ---- 动态邀约空态 ---- */
.dyn-empty {
  margin: 10rpx 28rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dyn-empty__icon {
  width: 82rpx;
  height: 64rpx;
}
.dyn-empty__text {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #b7b7b7;
}

/* ---- 安全提示 ---- */
.tip {
  margin-top: 8rpx;
  padding: 30rpx 30rpx 180rpx;
  background: #f8f8f8;
}
.tip__row {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.tip__dot {
  width: 16rpx;
  height: 16rpx;
  margin-top: 8rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.tip__text {
  font-size: 22rpx;
  color: #b9b9b9;
  line-height: 34rpx;
}
.tip__link {
  font-size: 24rpx;
  color: #61605f;
  line-height: 34rpx;
}

/* ---- 底部操作区 ---- */
.foot {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #f0f0f0;
}
.foot__op {
  margin-right: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.foot__op-icon {
  width: 44rpx;
  height: 44rpx;
}
.foot__op-text {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #9e9e9e;
}
.foot__main {
  flex: 1;
  height: 90rpx;
  border-radius: 36rpx;
  background: #ff731c;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.foot__main-icon {
  width: 52rpx;
  height: 52rpx;
  margin-right: 20rpx;
}
.foot__main-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #ffffff;
}

.loading {
  padding: 60rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 26rpx;
  color: #9e9e9e;
}
</style>
