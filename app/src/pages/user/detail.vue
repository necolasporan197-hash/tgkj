<template>
  <view class="page">
    <!-- detail_title_bar：share(24×29dip) + empty(20dip) + more(ic_profile_syh) -->
    <TgNavBar title="个人详情">
      <template #right>
        <image class="nav__share" src="/static/official/ic_profile_share_n.png" />
        <image class="nav__more" src="/static/official/ic_profile_syh.png" @tap="toggleMore" />
      </template>
    </TgNavBar>

    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else-if="user">
        <!-- ============ 被浏览者为女 → detail_female_basic.xml ============ -->
        <view v-if="viewedIsFemale" class="ftop">
          <image class="ftop__img" :src="avatarUrl" mode="aspectFill" @tap="previewAvatar" />
          <view class="ftop__shade" />

          <!-- female_detail_info：透明叠层，位于头图 370dip 处（昵称白字 17sp + 深色标签胶囊） -->
          <view class="finfo">
            <view class="finfo__head">
              <text class="finfo__name">{{ user.nickname }}</text>
              <image v-if="user.isConfirmed" class="finfo__rzbs" src="/static/official/rzbs.png" />
              <view v-if="lastLogText" class="finfo__online">
                <text class="finfo__online-text">{{ lastLogText }}</text>
              </view>
            </view>
            <view class="flabels">
              <view v-for="(l, i) in femaleLabels" :key="i" class="flabel">
                <image
                  v-if="l.icon"
                  class="flabel__icon"
                  :src="l.icon"
                  :style="{ width: l.iw + 'rpx', height: l.ih + 'rpx' }"
                />
                <text class="flabel__text">{{ l.text }}</text>
              </view>
            </view>
          </view>

          <!-- ll_actions：右侧竖排 47dip（评价 / 关注） -->
          <view class="factions">
            <view class="faction" @tap="toEvaluate">
              <image class="faction__icon" src="/static/official/ic_profile_pj_n.png" />
              <text class="faction__text">评价</text>
            </view>
            <view class="faction" @tap="toggleFollow">
              <image
                class="faction__icon"
                :src="user.followed ? '/static/official/homepage_follow_true.png' : '/static/official/ic_pj.png'"
              />
              <text class="faction__text">{{ user.followed ? '已关注' : '关注' }}</text>
            </view>
          </view>
        </view>

        <!-- ============ 被浏览者为男 → detail_male_basic.xml ============ -->
        <block v-else-if="viewedIsMale">
          <!-- detail_male_basic_top：高=屏宽×285/375 = 570rpx，100dip 圆形头像 -->
          <view class="mtop">
            <view class="mtop__blur">
              <image class="mtop__bg" :src="avatarUrl" mode="aspectFill" />
            </view>
            <view class="mtop__mask" />
            <image class="mtop__avatar" :src="avatarUrl" mode="aspectFill" @tap="previewAvatar" />
          </view>

          <!-- common_info_view：白底圆角 15dip，marginTop 250dip -->
          <view class="mcard">
            <view class="mcard__head">
              <text class="mcard__name">{{ user.nickname }}</text>
              <image
                v-if="user.isConfirmed || user.isVip"
                class="mcard__rnrz"
                src="/static/official/ic_tags_rnrz_n.png"
              />
              <view v-if="lastLogText" class="mcard__online" :class="{ 'is-on': user.online }">
                <text class="mcard__online-text">{{ lastLogText }}</text>
              </view>
              <view class="mcard__follow" @tap="toggleFollow">
                <image
                  class="mcard__follow-icon"
                  :src="user.followed ? '/static/official/homepage_follow_true.png' : '/static/official/homepage_follow.png'"
                />
                <text class="mcard__follow-text">{{ user.followed ? '已关注' : '关注' }}</text>
              </view>
            </view>
            <view class="mlabels">
              <view v-for="(l, i) in maleLabels" :key="i" class="mlabel">
                <image
                  v-if="l.icon"
                  class="mlabel__icon"
                  :src="l.icon"
                  :style="{ width: l.iw + 'rpx', height: l.ih + 'rpx' }"
                />
                <text class="mlabel__text">{{ l.text }}</text>
              </view>
            </view>
          </view>
        </block>

        <!-- ============ 公共：相册 detail_photo_view ============ -->
        <view class="content">
          <view class="photo">
            <view class="photo__title">
              <image class="photo__title-icon" src="/static/official/homepage_album.png" />
              <text class="photo__title-text">相册</text>
            </view>

            <view class="photo__body">
              <view v-if="user.albumLocked" class="privacy">
                <image class="privacy__icon" src="/static/official/ic_profile_axs_n.png" />
                <text class="privacy__tips">相册已上锁，VIP可免费查看</text>
                <view class="privacy__btn" @tap="unlockAlbum">
                  <text class="privacy__btn-text">立即解锁</text>
                </view>
                <view class="privacy__count">
                  <text class="privacy__count-text">( </text>
                  <template v-if="user.videoNum">
                    <image class="privacy__video-icon" src="/static/official/icon_video.png" />
                    <text class="privacy__count-text"> 视频*{{ user.videoNum }} 丨 </text>
                  </template>
                  <image class="privacy__photo-icon" src="/static/official/icon_pohoto.png" />
                  <text class="privacy__count-text"> 照片*{{ user.photoCount }} )</text>
                </view>
              </view>
              <view v-else-if="albumPhotos.length" class="album">
                <view v-for="(p, i) in albumPhotos" :key="i" class="album__item" @tap="onAlbumTap(i)">
                  <image class="album__img" :src="p" mode="aspectFill" />
                </view>
              </view>
              <view v-else class="photo__empty">
                <image class="photo__empty-icon" src="/static/official/ic_profile_xckby.png" />
              </view>
            </view>

            <view v-if="user.isConfirmed" class="rnrz">
              <image class="rnrz__icon" src="/static/official/xqy_xcrz.png" />
              <text class="rnrz__text">带有“本人”标识的为认证照片~</text>
            </view>
          </view>

          <view class="gap" />

          <!-- detail_tags：个性标签 -->
          <view v-if="tags.length" class="tags-sec">
            <view class="sec__head">
              <image class="sec__icon" src="/static/official/homepage_bq.png" />
              <text class="sec__title">个性标签</text>
            </view>
            <view class="tags">
              <text
                v-for="(t, i) in tags"
                :key="i"
                class="tags__item"
                :style="{ background: tagBg(i), color: tagColor(i) }"
                >{{ t }}</text
              >
            </view>
          </view>

          <view class="gap" />
        </view>

        <!-- ============ 公共：动态邀约 detail_bottom ============ -->
        <view class="dyn-sec">
          <view class="sec__head">
            <image class="sec__icon" src="/static/official/homepage_dt.png" />
            <text class="sec__title">动态邀约</text>
          </view>
          <view class="dyn-empty">
            <image class="dyn-empty__icon" src="/static/official/empty_default_empty.png" />
            <text class="dyn-empty__text">暂无动态</text>
          </view>
        </view>

        <!-- ============ 公共：安全提示 detail_tip ============ -->
        <view class="tip" :class="{ 'tip--inset': viewedIsMale }">
          <view class="tip__row tip__row--first">
            <image class="tip__dot" src="/static/official/ic_profile_xinhao.png" />
            <text class="tip__text"> 请勿通过约会进行不法交易，如被举报核实将被封号处理</text>
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

    <!-- ============ 底部操作区 ============ -->
    <template v-if="user">
      <view v-if="isSelf" class="foot foot--self">
        <view class="foot__edit" @tap="goEdit"><text class="foot__edit-text">编辑资料</text></view>
      </view>

      <!-- 女：微信圆钮(64×45dip) + 私聊Ta(45dip, radius 18dip) -->
      <view v-else-if="viewedIsFemale" class="foot foot--f">
        <view v-if="user.wechat || user.wechatLocked" class="foot__wechat" @tap="onWechatTap">
          <image class="foot__wechat-icon" src="/static/official/hagepage_wechat.png" />
        </view>
        <view class="foot__chat" @tap="toChat">
          <image class="foot__chat-icon" src="/static/official/ic_profile_chat_n.png" />
          <text class="foot__chat-text">私聊Ta</text>
        </view>
      </view>

      <!-- 男：仅 私聊Ta(48dip, radius 15dip) -->
      <view v-else class="foot foot--m">
        <view class="foot__chat foot__chat--m" @tap="toChat">
          <image class="foot__chat-icon" src="/static/official/ic_profile_chat_n.png" />
          <text class="foot__chat-text foot__chat-text--m">私聊Ta</text>
        </view>
      </view>
    </template>

    <!-- ============ 顶栏 more 弹层 user_detail_report.xml（124dip 宽） ============ -->
    <view v-if="moreOpen" class="pop-mask" @tap="closeMore" />
    <view v-if="moreOpen" class="pop" :style="{ top: navBottom + 'px' }">
      <view class="pop__row pop__row--report" @tap="onPopReport">
        <image class="pop__icon" src="/static/official/ic_profile_report.png" />
        <text class="pop__text">举报</text>
      </view>
      <view class="pop__divider" />
      <view class="pop__row pop__row--black" @tap="onPopBlack">
        <image class="pop__icon" src="/static/official/ic_profile_black.png" />
        <text class="pop__text">拉黑</text>
      </view>
    </view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav, back, confirm, copy, previewImage } from '@/utils/ui'
import { ageOf, formatDistance, timeAgo } from '@/utils/format'

const TAGS_BG_COLOR = ['#FFF3E5', '#ECF3E0', '#FFF3F1', '#ECF2FF', '#F2EDFF', '#FFF7DC']
const TAGS_TEXT_COLOR = ['#F46B0F', '#78C115', '#EE4D24', '#4C85FF', '#6E51C1', '#D8A511']

export default {
  data() {
    return {
      store: userStore,
      id: 0,
      user: null,
      loading: true,
      moreOpen: false,
      navBottom: 0
    }
  },
  computed: {
    isSelf() {
      return !!this.user && Number(this.user.id) === Number(this.store.uid)
    },
    /** 被浏览者为女（我方编码 2=女）→ DetailFemaleFragment */
    viewedIsFemale() {
      return !!this.user && this.user.gender === 2
    },
    /** 被浏览者为男（我方编码 1=男）→ DetailMaleFragment */
    viewedIsMale() {
      return !!this.user && this.user.gender === 1
    },
    avatarUrl() {
      const a = this.user && this.user.avatar
      if (a) return mediaUrl(a)
      return this.user && this.user.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    ageText() {
      const v = ageOf(this.user)
      return v ? `${v}岁` : ''
    },
    distText() {
      return formatDistance(this.user && this.user.distance) || ''
    },
    lastLogText() {
      const u = this.user
      if (!u) return ''
      if (u.online) return '在线'
      return timeAgo(u.lastActiveAt) || ''
    },
    /** 女详情页标签（detail_male_basic_item_view）：年龄(带图标) / 城市[ | 距离] / 身高cm / 职业 / 感情状态 */
    femaleLabels() {
      const u = this.user || {}
      const list = []
      if (this.ageText) list.push({ text: this.ageText, icon: '/static/official/list_female_tags.png', iw: 19, ih: 32 })
      let city = u.city || ''
      if (this.distText) city = city ? `${city} | ${this.distText}` : this.distText
      if (city) list.push({ text: city, icon: '', iw: 0, ih: 0 })
      if (u.height) list.push({ text: `${u.height}cm`, icon: '', iw: 0, ih: 0 })
      if (u.occupation) list.push({ text: u.occupation, icon: '', iw: 0, ih: 0 })
      if (u.feeling) list.push({ text: u.feeling, icon: '', iw: 0, ih: 0 })
      return list
    },
    /** 男详情页标签（detail_female_basic_item_view）：年龄 / 城市 / 距离 / 职业，均带图标 */
    maleLabels() {
      const u = this.user || {}
      const list = []
      if (this.ageText) list.push({ text: this.ageText, icon: '/static/official/homepage_male.png', iw: 10, ih: 18 })
      if (u.city) list.push({ text: u.city, icon: '/static/official/homepage_city.png', iw: 18, ih: 18 })
      if (this.distText && !this.isSelf)
        list.push({ text: this.distText, icon: '/static/official/homepage_location.png', iw: 16, ih: 18 })
      if (u.occupation) list.push({ text: u.occupation, icon: '/static/official/homepag_work.png', iw: 12, ih: 18 })
      return list
    },
    tags() {
      return (this.user && this.user.tags) || []
    },
    albumPhotos() {
      return ((this.user && this.user.photos) || []).slice(0, 6)
    }
  },
  onLoad(q) {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    const sys = uni.getSystemInfoSync()
    this.navBottom = (sys.statusBarHeight || 0) + Math.round((88 * sys.screenWidth) / 750)
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
    tagBg(i) {
      return TAGS_BG_COLOR[i % TAGS_BG_COLOR.length]
    },
    tagColor(i) {
      return TAGS_TEXT_COLOR[i % TAGS_TEXT_COLOR.length]
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
    toggleMore() {
      this.moreOpen = !this.moreOpen
    },
    closeMore() {
      this.moreOpen = false
    },
    onPopReport() {
      this.moreOpen = false
      this.toReport()
    },
    onPopBlack() {
      this.moreOpen = false
      this.toBlack()
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
    onWechatTap() {
      if (this.user.wechatLocked) {
        this.unlockWechat()
        return
      }
      if (this.user.wechat) copy(this.user.wechat)
    },
    toChat() {
      nav(`/pages/chat/chat?peerId=${this.id}`)
    },
    toEvaluate() {
      nav(`/pages/user/impression-give?userId=${this.id}`)
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
/* detail_title_bar 右区：share 24×24dip=48rpx；more ic_profile_syh 4×18dip=8×36rpx */
.nav__share {
  width: 48rpx;
  height: 48rpx;
}
.nav__more {
  width: 8rpx;
  height: 36rpx;
  margin-left: 40rpx;
}
.scroll {
  flex: 1;
  height: 0;
}

/* ============ 女：basic_top 450dip（900rpx） ============ */
.ftop {
  position: relative;
  width: 100%;
  height: 900rpx;
  overflow: hidden;
  background: #e9eaec;
}
.ftop__img {
  width: 100%;
  height: 100%;
}
/* female_common_info：透明 → #bf000000 的整幅渐变遮罩（官方即渐变） */
.ftop__shade {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.75) 100%);
}
/* female_detail_info：叠层顶部 370dip（740rpx），透明无底色 */
.finfo {
  position: absolute;
  left: 0;
  right: 0;
  top: 740rpx;
}
.finfo__head {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 30rpx;
  margin-right: 30rpx;
}
.finfo__name {
  max-width: 420rpx;
  font-size: 34rpx;
  font-weight: bold;
  color: #ffffff;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.finfo__rzbs {
  height: 28rpx;
  margin-left: 10rpx;
}
.finfo__online {
  margin-left: 10rpx;
  height: 30rpx;
  padding: 0 10rpx;
  border-radius: 16rpx;
  background: #4d000000;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.finfo__online-text {
  font-size: 20rpx;
  color: #ffffff;
}
.flabels {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  overflow: hidden;
  margin-top: 16rpx;
  padding-left: 30rpx;
}
/* detail_male_basic_item_view：19dip 高 / radius 12dip / #59000000 / 12sp 白字 */
.flabel {
  flex-shrink: 0;
  height: 38rpx;
  margin-right: 20rpx;
  margin-bottom: 30rpx;
  border-radius: 24rpx;
  background: #59000000;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.flabel__icon {
  margin-left: 14rpx;
}
.flabel__text {
  font-size: 24rpx;
  color: #ffffff;
  margin-left: 8rpx;
  margin-right: 14rpx;
}
/* ll_actions：贴右，距底 100dip（200rpx） */
.factions {
  position: absolute;
  right: 0;
  bottom: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
/* ic_profile_pjk 47dip 圆形按钮 */
.faction {
  width: 94rpx;
  height: 94rpx;
  background-image: url('/static/official/ic_profile_pjk.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.faction + .faction {
  margin-top: 30rpx;
}
.faction__icon {
  width: 34rpx;
  height: 40rpx;
}
.faction__text {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #ffffff;
}

/* ============ 男：detail_male_basic_top 570rpx + 100dip 头像 ============ */
.mtop {
  position: relative;
  width: 100%;
  height: 570rpx;
  overflow: hidden;
  background: #e9eaec;
}
.mtop__blur {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
}
.mtop__bg {
  width: 100%;
  height: 100%;
  filter: blur(24rpx);
  transform: scale(1.15);
}
.mtop__mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: #b3000000;
}
.mtop__avatar {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 200rpx;
  height: 200rpx;
  margin-left: -100rpx;
  margin-top: -100rpx;
  border-radius: 50%;
  border: 6rpx solid #ffffff;
  box-sizing: border-box;
  background: #e9eaec;
}

/* common_info_view：白底圆角 15dip，上叠 70rpx */
.mcard {
  position: relative;
  margin-top: -70rpx;
  padding: 36rpx 30rpx 12rpx;
  border-radius: 30rpx;
  background: #ffffff;
}
.mcard__head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mcard__name {
  max-width: 320rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #30302f;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mcard__rnrz {
  height: 28rpx;
  margin-left: 10rpx;
}
.mcard__online {
  margin-left: 10rpx;
  height: 30rpx;
  padding: 0 10rpx;
  border-radius: 16rpx;
  background: #ffc7c7c7;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mcard__online.is-on {
  background: #ffdbfff0;
}
.mcard__online-text {
  font-size: 20rpx;
  color: #ffffff;
}
.mcard__online.is-on .mcard__online-text {
  color: #ff49c190;
}
.mcard__follow {
  margin-left: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mcard__follow-icon {
  width: 34rpx;
  height: 32rpx;
}
.mcard__follow-text {
  margin-left: 12rpx;
  font-size: 22rpx;
  color: #ff61605f;
}
/* detail_female_basic_item_view：26dip 高 / radius 8dip / #fff3f3f3 / 12sp #ff61605f */
.mlabels {
  margin-top: 30rpx;
  margin-bottom: 12rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.mlabel {
  height: 52rpx;
  margin-right: 30rpx;
  margin-bottom: 30rpx;
  border-radius: 16rpx;
  background: #fff3f3f3;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mlabel__icon {
  margin-left: 20rpx;
}
.mlabel__text {
  font-size: 24rpx;
  color: #ff61605f;
  margin-left: 8rpx;
  margin-right: 20rpx;
}

/* ============ 公共：相册（detail_photo_view） ============ */
.content {
  background: #ffffff;
}
.photo {
  padding-top: 40rpx;
}
.photo__title {
  padding: 0 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.photo__title-icon {
  width: 30rpx;
  height: 30rpx;
  margin-right: 18rpx;
}
.photo__title-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #181716;
}
.photo__body {
  position: relative;
  margin-top: 24rpx;
  padding: 0 30rpx;
}
.album {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.album__item {
  width: 222rpx;
  height: 294rpx;
  margin-right: 12rpx;
  margin-bottom: 12rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f0f1f2;
}
.album__item:nth-child(3n) {
  margin-right: 0;
}
.album__img {
  width: 100%;
  height: 100%;
  background: #f0f1f2;
}
/* 未解锁：pic_profile_xcs_n 卡片 */
.privacy {
  padding-bottom: 40rpx;
  border-radius: 12rpx;
  background-image: url('/static/official/pic_profile_xcs_n.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.privacy__icon {
  margin-top: 72rpx;
  width: 144rpx;
  height: 106rpx;
}
.privacy__tips {
  margin-top: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #f09153;
}
.privacy__btn {
  margin-top: 40rpx;
  width: 212rpx;
  height: 76rpx;
  background-image: url('/static/official/pic_ljjs.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}
.privacy__btn-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff731c;
}
.privacy__count {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.privacy__count-text {
  font-size: 22rpx;
  color: #ffd38f63;
}
.privacy__video-icon {
  width: 22rpx;
  height: 18rpx;
  margin-top: 4rpx;
}
.privacy__photo-icon {
  width: 22rpx;
  height: 16rpx;
  margin-top: 2rpx;
}
.photo__empty {
  padding: 40rpx 58rpx 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo__empty-icon {
  width: 508rpx;
  height: 192rpx;
}
.rnrz {
  margin-top: 12rpx;
  margin-bottom: 30rpx;
  padding: 0 30rpx;
  height: 44rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.rnrz__icon {
  width: 86rpx;
  height: 30rpx;
  margin-right: 10rpx;
}
.rnrz__text {
  font-size: 22rpx;
  color: #b59881;
}
.gap {
  height: 16rpx;
  background: #f7f7f7;
}

/* ============ 公共：个性标签 ============ */
.tags-sec {
  padding: 44rpx 0 0 30rpx;
  background: #ffffff;
}
.sec__head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.sec__icon {
  width: 30rpx;
  height: 30rpx;
  margin-right: 18rpx;
}
.sec__title {
  font-size: 32rpx;
  font-weight: bold;
  color: #171716;
}
.tags {
  margin-top: 24rpx;
  padding-bottom: 10rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.tags__item {
  margin: 0 30rpx 30rpx 0;
  padding: 14rpx 40rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
}

/* ============ 公共：动态邀约 ============ */
.dyn-sec {
  padding: 40rpx 30rpx 0;
  background: #ffffff;
}
.dyn-empty {
  margin: 20rpx 58rpx 40rpx;
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

/* ============ 公共：安全提示 ============ */
.tip {
  margin-top: 16rpx;
  padding-left: 30rpx;
  padding-bottom: 180rpx;
  background: #fff8f8f8;
}
.tip--inset {
  margin-left: 30rpx;
  margin-right: 30rpx;
}
.tip__row {
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tip__row--first {
  margin-top: 30rpx;
  align-items: flex-start;
}
.tip__dot {
  width: 16rpx;
  height: 16rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}
.tip__row--first .tip__dot {
  margin-top: 8rpx;
}
.tip__text {
  font-size: 22rpx;
  color: #b9b9b9;
}
.tip__link {
  font-size: 24rpx;
  color: #61605f;
}

/* ============ 底部操作区 ============ */
.foot {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 0 calc(20rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  background-image: url('/static/official/bg_profile_ditu_n.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
.foot--self {
  padding-left: 30rpx;
  padding-right: 30rpx;
}
.foot__edit {
  flex: 1;
  height: 90rpx;
  border-radius: 36rpx;
  background: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.foot__edit-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #ffffff;
}
/* 女：微信圆钮 64×45dip，radius 24dip，左 30dip */
.foot__wechat {
  width: 128rpx;
  height: 90rpx;
  margin-left: 60rpx;
  margin-bottom: 14rpx;
  border-radius: 48rpx;
  background: #fff3f3f3;
  display: flex;
  align-items: center;
  justify-content: center;
}
.foot__wechat-icon {
  width: 72rpx;
  height: 72rpx;
}
/* 女：私聊Ta 高 45dip，radius 18dip，左 45dip 右 33dip */
.foot__chat {
  flex: 1;
  height: 90rpx;
  margin-left: 90rpx;
  margin-right: 66rpx;
  border-radius: 36rpx;
  background: #ff731c;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
/* 男：私聊Ta 高 48dip，radius 15dip，左右 30dip */
.foot--m {
  padding-left: 60rpx;
  padding-right: 60rpx;
}
.foot__chat--m {
  margin-left: 0;
  margin-right: 0;
  height: 96rpx;
  border-radius: 30rpx;
}
.foot__chat-icon {
  width: 52rpx;
  height: 52rpx;
}
.foot__chat-text {
  margin-left: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #ffffff;
}
.foot__chat-text--m {
  font-size: 32rpx;
}

/* ============ 顶栏 more 弹层 ============ */
.pop-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
}
.pop {
  position: fixed;
  right: 60rpx;
  z-index: 21;
  width: 248rpx;
  background-image: url('/static/official/bg_report_pop.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
}
.pop__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.pop__row--report {
  height: 106rpx;
}
.pop__row--black {
  height: 86rpx;
}
.pop__icon {
  width: 32rpx;
  height: 32rpx;
}
.pop__text {
  margin-left: 20rpx;
  font-size: 26rpx;
  color: #ffffff;
}
.pop__divider {
  height: 1px;
  margin: 0 20rpx;
  background: #ffa9a9a9;
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
