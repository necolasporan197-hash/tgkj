<template>
  <view class="main">
    <!-- ============ 首页 ============ -->
    <view v-if="tab === 'home'" class="tabpane">
      <view class="home-top" :style="{ paddingTop: statusBar + 'px', height: statusBar * 2 + 88 + 'rpx' }">
        <view class="home-top__tabs">
          <view v-for="(t, i) in homeTabs" :key="t.key" class="home-top__tab" @tap="switchHome(i)">
            <text class="home-top__tab-text" :class="{ 'is-active': homeIndex === i }">{{ t.text }}</text>
            <view v-if="homeIndex === i" class="home-top__indicator" />
          </view>
        </view>
        <!-- fragment_main.xml：search 常显；main_city 仅「推荐」(index 0) 显示（MainFragment.onPageSelected） -->
        <view class="home-top__right">
          <image class="home-top__icon" src="/static/official/ic_nav__search__n.png" @tap="go('/pages/search/search')" />
          <view v-if="homeIndex === 0" class="home-top__city" @tap="go('/pages/city/city')">
            <text class="home-top__city-text">{{ store.city }}</text>
            <image class="home-top__arrow" src="/static/official/ic_nav_arrow_n.png" />
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="scroll" @scrolltolower="loadMoreUser">
        <!-- ll_rnrz 提示条（fragment_main.xml）：文案见 refreshTipContent；「立即认证」仅女用户未认证时显示 -->
        <view class="notice" @tap="onNoticeTap">
          <image class="notice__icon" src="/static/official/ic_home_prompt_n.png" />
          <text class="notice__text">{{ noticeText }}</text>
          <text v-if="noticeNeedAuth" class="notice__btn">立即认证</text>
        </view>

        <!-- 首页推荐流：仅用户卡，按「频道 + 被浏览者性别」决定卡片模式 / 列表模式
             卡片模式：男用户「推荐」→ item_home_two_recommend.xml（StaggeredGrid 2 列瀑布卡）
             列表模式：被浏览者为女 → item_home_female_small.xml（123dip）
                       被浏览者为男 → item_home_male_small.xml（99dip） -->
        <view v-if="isCardMode" class="ucard-list">
          <view v-for="u in users" :key="u.id" class="ucard" @tap="goUser(u.id)">
            <image class="ucard__img" :src="avatarOf(u)" mode="aspectFill" />
            <!-- iv_has_video：官方 data.video_num != 0（home_play_button，右上 6dip） -->
            <image v-if="hasVideo(u)" class="ucard__video" src="/static/official/home_play_button.png" />
            <!-- online：ShapeLinearLayout 15dip 胶囊（solid #40090909）+ online_text 9sp -->
            <view v-if="lastLogOf(u)" class="ucard__online">
              <text class="ucard__online-text">{{ lastLogOf(u) }}</text>
            </view>
            <!-- 底部 75dip 信息条（bg pic_home_mc_n，padding 20/10/10/6dip） -->
            <view class="ucard__bottom">
              <view class="ucard__nickrow">
                <text class="ucard__nick" :style="{ maxWidth: nickMaxWidth(u) + 'rpx' }">{{ nickText(u) }}</text>
                <!-- tv_new_user：官方 isFemale(sex) && isYes(new_user)（25×14dip，左 3dip） -->
                <view v-if="showNewUser(u)" class="ucard__newuser"><text class="ucard__newuser-text">新人</text></view>
                <image v-if="isConfirmed(u)" class="ucard__rnrz" src="/static/official/rzbs.png" />
              </view>
              <!-- age（drawableLeft list_female_tags）· d3 · tag1 · d1 · tag3 -->
              <view class="ucard__tagrow">
                <image class="ucard__age-icon" src="/static/official/list_female_tags.png" />
                <text class="ucard__age">{{ ageOf(u) }}</text>
                <view class="ucard__div" />
                <text class="ucard__t">{{ u.occupation || '未知' }}</text>
                <view class="ucard__div" />
                <text class="ucard__t">{{ cityText(u) }}</text>
              </view>
            </view>
          </view>
        </view>

        <template v-else>
          <!-- 列表模式·被浏览者为女：item_home_female_small.xml（89dip 头像 + 私聊 + 3 张相册缩略图） -->
          <template v-if="viewedIsFemale">
            <view v-for="u in users" :key="u.id" class="urow urow--female" @tap="goUser(u.id)">
              <view class="urow__cover">
                <image class="urow__f-avatar" :src="avatarOf(u)" mode="aspectFill" />
                <!-- tv_new_user：官方 isFemale(sex) && isYes(new_user)（22×14dip，左上 2dip） -->
                <view v-if="showNewUser(u)" class="urow__newuser"><text class="urow__newuser-text">新人</text></view>
                <!-- iv_has_video：官方 video_num != 0（home_play_button，右上 2dip） -->
                <image v-if="hasVideo(u)" class="urow__video" src="/static/official/home_play_button.png" />
              </view>
              <view class="urow__f-main">
                <view class="urow__f-namerow">
                  <text class="urow__name">{{ u.nickname }}</text>
                  <image v-if="isConfirmed(u)" class="urow__rz" src="/static/official/rzbs.png" />
                  <image class="urow__f-chat" src="/static/official/home_chat_msg.png" @tap.stop="toChat(u.id)" />
                </view>
                <view class="urow__tags">
                  <view v-if="ageOf(u)" class="urow__tag">
                    <image class="urow__tag-sex" src="/static/official/ic_home_female.png" />
                    <text class="urow__tag-text">{{ ageOf(u) }}</text>
                  </view>
                  <view v-if="u.occupation" class="urow__tag">
                    <text class="urow__tag-text">{{ u.occupation }}</text>
                  </view>
                  <view v-if="u.online" class="urow__tag">
                    <text class="urow__tag-text">在线</text>
                  </view>
                </view>
                <view class="urow__f-bottom">
                  <view v-if="photosOf(u).length" class="urow__photos">
                    <image v-for="(p, pi) in photosOf(u)" :key="pi" class="urow__photo" :src="mediaUrl(p)" mode="aspectFill" />
                    <!-- tv_add_count：官方 img_num>3 && img_data.length>2 → "+"(img_num-3)，叠于 iv_photo3 -->
                    <view v-if="addCount(u)" class="urow__addcount"><text class="urow__addcount-text">{{ addCount(u) }}</text></view>
                  </view>
                  <text v-if="cityText(u)" class="urow__f-city">{{ cityText(u) }}</text>
                </view>
              </view>
            </view>
          </template>

          <!-- 列表模式·被浏览者为男：item_home_male_small.xml（75dip 头像 + VIP 标 + 关注按钮） -->
          <template v-else>
            <view v-for="u in users" :key="u.id" class="urow urow--male" @tap="goUser(u.id)">
              <image class="urow__m-avatar" :src="avatarOf(u)" mode="aspectFill" />
              <view class="urow__m-main">
                <view class="urow__m-namerow">
                  <text class="urow__name">{{ u.nickname }}</text>
                  <image v-if="u.isVip" class="urow__vip" src="/static/official/pc_tags_vip_n.png" />
                </view>
                <view class="urow__tags">
                  <view v-if="ageOf(u)" class="urow__tag">
                    <image class="urow__tag-sex" src="/static/official/ic_home_man.png" />
                    <text class="urow__tag-text">{{ ageOf(u) }}</text>
                  </view>
                  <view v-if="u.occupation" class="urow__tag">
                    <text class="urow__tag-text">{{ u.occupation }}</text>
                  </view>
                  <view v-if="u.online" class="urow__tag">
                    <text class="urow__tag-text">在线</text>
                  </view>
                </view>
                <view v-if="u.city" class="urow__city">
                  <image class="urow__city-icon" src="/static/official/home_location.png" />
                  <text class="urow__city-text">{{ u.city }}</text>
                </view>
              </view>
              <view class="urow__follow" @tap.stop="toggleFollow(u)">
                <image class="urow__follow-icon" :src="u.followed ? '/static/official/user_detail_follow_active.png' : '/static/official/user_detail_follow.png'" />
              </view>
            </view>
          </template>
        </template>

        <TgEmpty v-if="!userLoading && !users.length" text="当前城市未找到匹配用户" />
        <view v-if="userLoading" class="loading"><text class="loading__text">加载中…</text></view>
        <view v-else-if="users.length" class="loading">
          <text class="loading__text">{{ userFinished ? '没有更多了' : '上拉加载更多' }}</text>
        </view>
        <view class="safe" />
      </scroll-view>
    </view>

    <!-- ============ 动态 ============ -->
    <view v-else-if="tab === 'discover'" class="tabpane">
      <view class="home-top" :style="{ paddingTop: statusBar + 'px', height: statusBar * 2 + 88 + 'rpx' }">
        <view class="home-top__tabs">
          <view
            v-for="(t, i) in dynTabs"
            :key="t.key"
            class="home-top__tab"
            @tap="switchDyn(i)"
          >
            <text class="home-top__tab-text" :class="{ 'is-active': dynIndex === i }">{{ t.text }}</text>
            <view v-if="dynIndex === i" class="home-top__indicator" />
          </view>
        </view>
        <view class="home-top__right">
          <image class="home-top__gender" :src="genderIcon" @tap="toggleGender" />
          <!-- dynamic_main_fragment.xml：dynamic_city 仅「全部」子频道可见（onPageSelected i==0），初值「全国」 -->
          <view v-if="dynIndex === 0" class="home-top__city" @tap="go('/pages/city/city')">
            <text class="home-top__city-text">{{ dynCity }}</text>
            <image class="home-top__arrow" src="/static/official/ic_nav_arrow_n.png" />
          </view>
        </view>
      </view>

      <scroll-view scroll-y class="scroll" @scrolltolower="loadMoreMoment">
        <!-- 动态页顶部轮播（对齐 dynamic_banner.xml：容器 100dip / banner 86dip；dynamic_banner_item.xml：左右 3dip、圆角 10dip） -->
        <view v-if="banners.length" class="banner">
          <swiper
            class="banner__swiper"
            :autoplay="banners.length > 1"
            :interval="4000"
            :circular="true"
            :current="bannerIndex"
            @change="onBannerChange"
          >
            <swiper-item v-for="b in banners" :key="b.id">
              <view class="banner__item">
                <image class="banner__img" :src="mediaUrl(b.image)" mode="aspectFill" @tap="goBanner(b)" />
              </view>
            </swiper-item>
          </swiper>
          <view v-if="banners.length > 1" class="banner__dots">
            <view v-for="(b, i) in banners" :key="i" class="banner__dot" :class="{ 'is-active': bannerIndex === i }" />
          </view>
        </view>

        <view class="pubbar" @tap="addSheet = true">
          <image class="pubbar__icon" src="/static/official/new_ic_home_xj.png" />
          <text class="pubbar__text">分享此刻的心情…</text>
          <text class="pubbar__btn">发布</text>
        </view>

        <view v-for="m in moments" :key="m.id" class="ditem" @tap="go(`/pages/moment/detail?id=${m.id}`)">
          <view class="ditem__head">
            <image class="ditem__avatar" :src="avatarOf(m.author)" mode="aspectFill" @tap.stop="goUser(m.author.id)" />
            <view class="ditem__hm">
              <view class="ditem__row">
                <text class="ditem__name">{{ m.author.nickname }}</text>
                <image v-if="m.author.auditStatus === 'approved'" class="ditem__rz" src="/static/official/rzbs.png" />
              </view>
              <view class="ditem__meta">
                <image
                  class="ditem__sex"
                  :src="m.author.gender === 2 ? '/static/official/ic_female.png' : '/static/official/ic_male.png'"
                />
                <text class="ditem__age">{{ ageOf(m.author) }}</text>
                <!-- item_dynamic.xml：time = "·" + 相对时间；邻圈（hideDate）时置空 -->
                <text v-if="dynIndex === 0" class="ditem__time">·{{ timeAgo(m.createdAt) }}</text>
              </view>
            </view>
            <view class="ditem__chat" @tap.stop="toChat(m.author.id)">私聊</view>
          </view>

          <text v-if="m.content" class="ditem__content">{{ m.content }}</text>
          <view v-if="m.images && m.images.length" class="ditem__imgs">
            <image v-for="(img, i) in m.images.slice(0, 3)" :key="i" class="ditem__img" :src="mediaUrl(img)" mode="aspectFill" />
          </view>
          <!-- item_dynamic.xml：胶囊行 = [dt_activity + label[0]] + [dt_time + city_name] -->
          <view v-if="(m.author.tags && m.author.tags[0]) || m.city" class="ditem__chips">
            <view v-if="m.author.tags && m.author.tags[0]" class="ditem__chip">
              <image class="ditem__chip-icon" src="/static/official/dt_activity.png" />
              <text class="ditem__chip-text">{{ m.author.tags[0] }}</text>
            </view>
            <view v-if="m.city" class="ditem__chip">
              <image class="ditem__chip-icon" src="/static/official/dt_time.png" />
              <text class="ditem__chip-text">{{ m.city }}</text>
            </view>
          </view>

          <!-- item_dynamic.xml：底部仅「点赞（home_selected_like）+ 举报（ic_profile1_syh）」，无评论 -->
          <view class="ditem__foot">
            <view class="ditem__act" @tap.stop="like(m)">
              <image class="ditem__act-icon" :src="m.liked ? '/static/official/dt_like2.png' : '/static/official/dt_like1.png'" />
              <text class="ditem__act-text" :class="{ 'is-on': m.liked }">{{ m.likeCount || 0 }}</text>
            </view>
            <view class="ditem__report" @tap.stop="goReport(m)">
              <image class="ditem__report-icon" src="/static/official/ic_profile1_syh.png" />
            </view>
          </view>
          <view class="ditem__line" />
        </view>

        <TgEmpty v-if="!momentLoading && !moments.length" text="还没有动态，快来发布第一条吧" btn-text="发布动态" @action="go('/pages/moment/publish')" />
        <view class="safe" />
      </scroll-view>
    </view>

    <!-- ============ 消息 ============ -->
    <view v-else-if="tab === 'message'" class="tabpane">
      <view class="msg-head" :style="{ paddingTop: statusBar + 'px' }">
        <text class="msg-head__title">消息</text>
        <view class="msg-head__bar" />
      </view>
      <view class="msg-tip">
        <text class="msg-tip__text">切勿添加对方私发的联系方式，以免造成损失</text>
        <image class="msg-tip__close" src="/static/official/icons_close.png" />
      </view>
      <scroll-view scroll-y class="scroll">
        <view class="quick">
          <view class="quick__item" @tap="go('/pages/message/notification')">
            <image class="quick__icon" src="/static/official/ic_message_tglogo.png" />
            <text class="quick__text">系统通知</text>
            <view v-if="store.unread.system" class="quick__dot" />
          </view>
          <view class="quick__item" @tap="go('/pages/user/visitors')">
            <image class="quick__icon" src="/static/official/ic_message_sklw.png" />
            <text class="quick__text">谁看过我</text>
          </view>
          <view class="quick__item" @tap="go('/pages/user/follows')">
            <image class="quick__icon" src="/static/official/ic_wygz_hxgz.png" />
            <text class="quick__text">我的关注</text>
          </view>
          <view class="quick__item" @tap="go('/pages/user/unlock-records')">
            <image class="quick__icon" src="/static/official/ic_me_unlock_record.png" />
            <text class="quick__text">解锁记录</text>
          </view>
        </view>

        <template v-for="c in conversations" :key="c.id">
          <view v-if="c.peer" class="conv" @tap="toChat(c.peerId)">
            <view class="conv__avatar-wrap">
              <image class="conv__avatar" :src="avatarOf(c.peer)" mode="aspectFill" />
              <view v-if="c.unread" class="conv__badge"><text class="conv__badge-text">{{ c.unread > 99 ? '99+' : c.unread }}</text></view>
            </view>
            <view class="conv__info">
              <text class="conv__name">{{ c.peer.nickname }}</text>
              <text class="conv__last">{{ c.lastContent || '打个招呼吧～' }}</text>
            </view>
            <text class="conv__time">{{ timeAgo(c.lastTime) }}</text>
          </view>
        </template>

        <TgEmpty v-if="!convLoading && !conversations.length" text="还没有消息" btn-text="去逛逛" @action="onTab('home')" />
        <view class="safe" />
      </scroll-view>
    </view>

    <!-- ============ 我的 ============ -->
    <view v-else class="tabpane">
      <scroll-view scroll-y class="scroll mine__page">
        <view class="mine__top">
          <!-- 右上角：修改资料胶囊 + 设置齿轮（new_mine_layout L7-13） -->
          <view class="mine__bar">
            <view class="mine__auth" @tap="go('/pages/profile/edit')">
              <image class="mine__auth-icon" src="/static/official/ic_me_edit_n.png" />
              <text class="mine__auth-text">修改资料</text>
              <image class="mine__auth-arrow" src="/static/official/my_arrow_right.png" />
            </view>
            <image class="mine__setting" src="/static/official/me_setting.png" @tap="go('/pages/settings/index')" />
          </view>

          <!-- 头像 + 昵称 + 年龄/职业/城市（new_mine_layout L15-37） -->
          <view class="mine__info">
            <image class="mine__avatar" :src="store.avatar" mode="aspectFill" @tap="go('/pages/profile/edit')" />
            <view class="mine__uinfo">
              <view class="mine__row">
                <text class="mine__name">{{ profile.nickname || '未登录' }}</text>
                <image v-if="profile.isVip" class="mine__vip" src="/static/official/vip_zx.png" />
              </view>
              <view class="mine__tags">
                <view class="mine__tag mine__tag--age">
                  <image class="mine__tag-sex" :src="profile.gender === 2 ? '/static/official/ic_female.png' : '/static/official/ic_male.png'" />
                  <text class="mine__tag-age">{{ ageOf(profile) }}</text>
                </view>
                <view v-if="profile.occupation" class="mine__tag">
                  <text class="mine__tag-text">{{ profile.occupation }}</text>
                </view>
                <view v-if="profile.city" class="mine__tag">
                  <text class="mine__tag-text">{{ profile.city }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 保留业务提示，按 mine_img_avator 尺寸/色值 -->
          <view v-if="store.needAudit" class="mine__audit">
            <image class="mine__audit-icon" src="/static/official/ic_me_ts.png" />
            <text class="mine__audit-text">资料审核中，审核通过后即可被推荐</text>
          </view>

          <!-- 已关注 / 关注我 / 我赞过（new_mine_layout L43-57） -->
          <view class="mine__stats">
            <view class="mine__stat" @tap="go('/pages/user/follows')">
              <text class="mine__stat-num">{{ (profile.stats && profile.stats.follows) || 0 }}</text>
              <text class="mine__stat-label">已关注</text>
            </view>
            <view class="mine__stat-line" />
            <view class="mine__stat">
              <text class="mine__stat-num">{{ (profile.stats && profile.stats.fans) || 0 }}</text>
              <text class="mine__stat-label">关注我</text>
            </view>
            <view class="mine__stat-line" />
            <view class="mine__stat">
              <text class="mine__stat-num">{{ (profile.stats && profile.stats.likes) || 0 }}</text>
              <text class="mine__stat-label">我赞过</text>
            </view>
          </view>

          <!-- 认证中心 / 开通VIP（new_mine_layout 4.8.2 L76-96） -->
          <view class="mine__entry">
            <view class="mine__entry-card mine__entry-card--auth" @tap="go('/pages/verification/index')">
              <view class="mine__entry-txt mine__entry-txt--auth">
                <text class="mine__entry-title mine__entry-title--auth">认证中心</text>
                <text class="mine__entry-sub mine__entry-sub--auth">完成后更受欢迎哦~</text>
              </view>
              <view class="mine__entry-btn">
                <text class="mine__entry-btn-text">立即认证</text>
              </view>
            </view>
            <view class="mine__entry-gap" />
            <view class="mine__entry-card mine__entry-card--vip" @tap="go('/pages/vip/vip')">
              <view class="mine__entry-txt mine__entry-txt--vip">
                <text class="mine__entry-title mine__entry-title--vip">开通VIP</text>
                <text class="mine__entry-sub mine__entry-sub--vip">专属权益，为你定制</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 保留：邀请好友 / 会员入口 -->
        <view class="mine__cards">
          <view class="mine__card" @tap="go('/pages/invite/invite')">
            <text class="mine__card-num">{{ profile.inviteCode || '-' }}</text>
            <text class="mine__card-label">邀请好友赚金币</text>
          </view>
          <view class="mine__card mine__card--vip" @tap="go('/pages/vip/vip')">
            <text class="mine__card-num">{{ store.isVip ? '会员' : '开通 VIP' }}</text>
            <text class="mine__card-label">解锁全部特权</text>
          </view>
        </view>

        <!-- 保留：金币 / 余额 / 累计收益 -->
        <view class="mine__assets">
          <view class="mine__asset" @tap="go('/pages/wallet/coins')">
            <text class="mine__asset-num">{{ thousands(profile.coins || 0) }}</text>
            <text class="mine__asset-label">金币</text>
          </view>
          <view class="mine__asset" @tap="go('/pages/wallet/wallet')">
            <text class="mine__asset-num">{{ money(profile.balance || 0) }}</text>
            <text class="mine__asset-label">余额（元）</text>
          </view>
          <view class="mine__asset" @tap="go('/pages/wallet/wallet')">
            <text class="mine__asset-num">{{ thousands(totalIncome) }}</text>
            <text class="mine__asset-label">累计收益</text>
          </view>
        </view>

        <!-- 保留：功能列表（mine_white_bg 白卡） -->
        <view class="mine__list">
          <view v-for="it in mineItems" :key="it.label" class="sitem" @tap="go(it.url)">
            <image class="sitem__icon" :src="it.icon" />
            <text class="sitem__label">{{ it.label }}</text>
            <text v-if="it.extra" class="sitem__extra">{{ it.extra }}</text>
            <image class="sitem__arrow" src="/static/official/ic_me_arrow_n.png" />
          </view>
        </view>
        <view class="safe" />
        <view class="safe" />
      </scroll-view>
    </view>

    <TgTabBar :current="tab" :unread="store.unread.chat" @change="onTab" />

    <!-- 发布弹窗 —— 对齐官方 home_add_dialog_fragment.xml（发布动态 / 发布邀约；发视频已隐藏） -->
    <view v-if="addSheet" class="addsheet" @tap="addSheet = false">
      <view class="addsheet__panel" @tap.stop>
        <view class="addsheet__head">
          <view class="addsheet__close" @tap="addSheet = false">
            <image class="addsheet__close-img" src="/static/official/pop_cha.png" />
          </view>
        </view>
        <view class="addsheet__body">
          <view class="addsheet__item" @tap="goAdd('/pages/moment/publish')">
            <image class="addsheet__img" src="/static/official/pic_fbdt.png" mode="aspectFit" />
            <text class="addsheet__label">发布动态</text>
          </view>
          <view class="addsheet__item" @tap="goAdd('/pages/invite/post')">
            <image class="addsheet__img" src="/static/official/pic_fbyy.png" mode="aspectFit" />
            <text class="addsheet__label">发布邀约</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { userApi, momentApi, messageApi, discoverApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl } from '@/api/request'
import { toast, nav } from '@/utils/ui'
import { timeAgo, ageOf, thousands, money, formatDistance } from '@/utils/format'

export default {
  data() {
    return {
      store: userStore,
      tab: 'home',
      statusBar: 0,
      // 首页（homeTabs 见 computed：按登录用户性别分化）
      homeIndex: 0,
      users: [],
      userPage: 1,
      userLoading: false,
      userFinished: false,
      // 当前列表已加载的城市（用于返回首页时判断是否需要按新城市重载）
      loadedCity: '',
      // 动态
      // 发现子频道（官方 DynamicFragmentAdapter：0=全部 / 1=邻圈）
      dynTabs: [
        { key: 'all', text: '全部' },
        { key: 'circle', text: '邻圈' }
      ],
      dynIndex: 0,
      // 发现页城市（官方 dynamic_main_fragment dynamic_city，初值「全国」）
      dynCity: '全国',
      genderFilter: 0,
      moments: [],
      momentPage: 1,
      momentLoading: false,
      momentFinished: false,
      // 动态页轮播
      banners: [],
      bannerIndex: 0,
      // 发布弹窗（home_add_dialog_fragment.xml）
      addSheet: false,
      // 消息
      conversations: [],
      convLoading: false
    }
  },
  computed: {
    profile() {
      return this.store.profile || {}
    },
    verified() {
      return this.profile.auditStatus === 'approved'
    },
    /** ll_rnrz 文案（官方 MainFragment.refreshTipContent）：
     *  浏览异性(男) 或 已认证 → 安全提示；否则 → 认证提示 */
    noticeText() {
      if (this.store.gender !== 2 || this.verified) {
        return '请勿添加他人在聊天中发送的外部联系方式，以免造成隐私泄露、财物受损！'
      }
      return '你还未进行人脸识别认证，认证后可享更多权限哦～'
    },
    /** 「立即认证」按钮：仅女用户未认证时显示（refreshTipContent 中 tvZrrz 的显隐） */
    noticeNeedAuth() {
      return this.store.gender === 2 && !this.verified
    },
    /** 首页频道（官方 MainFragment.MALE_DATA / FEMALE_DATA）：
     *  审核中（onlyCheckIng）→ 仅单个「首页」；女用户 → 仅「推荐」；男用户 → 「推荐/附近/新人」 */
    homeTabs() {
      if (this.store.needAudit) return [{ key: 'recommend', text: '首页' }]
      if (this.store.gender === 2) return [{ key: 'recommend', text: '推荐' }]
      return [
        { key: 'recommend', text: '推荐' },
        { key: 'nearby', text: '附近' },
        { key: 'new', text: '新人' }
      ]
    },
    /** 当前频道 key（homeIndex 越界时兜底到第一个频道） */
    homeKey() {
      const t = this.homeTabs[this.homeIndex] || this.homeTabs[0]
      return t ? t.key : 'recommend'
    },
    /** 卡片模式（item_home_two_recommend 双列瀑布）：男用户「推荐」（官方 HomeRecommendTwoAdapter） */
    isCardMode() {
      return this.store.gender !== 2 && this.homeKey === 'recommend'
    },
    /** 被浏览者性别 = 登录用户异性：女 → female_small；男 → male_small */
    viewedIsFemale() {
      return this.store.gender !== 2
    },
    /** 性别筛选图标（官方 DynamicMainFragment.SEX_LOG：-1→gender_n、1→female_n、0→male_n）
     *  本应用性别编码：2=女、1=男；genderFilter 0=全部 / 2=女 / 1=男 */
    genderIcon() {
      if (this.genderFilter === 2) return '/static/official/ic_home_female_n.png'
      if (this.genderFilter === 1) return '/static/official/ic_home_male_n.png'
      return '/static/official/ic_home_gender_n.png'
    },
    totalIncome() {
      return this.profile.totalIncome || 0
    },
    mineItems() {
      return [
        { label: '我的认证', icon: '/static/official/ic_me_auth.png', url: '/pages/verification/index', extra: this.authText },
        { label: '我的相册', icon: '/static/official/ic_me_pic.png', url: '/pages/user/photos' },
        { label: '我的视频', icon: '/static/official/ic_me_video.png', url: '/pages/sight/index' },
        { label: '我的动态', icon: '/static/official/ic_me_dt_n.png', url: '/pages/moment/mine' },
        { label: '我的印象', icon: '/static/official/ic_me_br.png', url: '/pages/user/impressions' },
        { label: '谁看过我', icon: '/static/official/ic_me_sklw_n.png', url: '/pages/user/visitors' },
        { label: '解锁记录', icon: '/static/official/ic_me_unlock_record.png', url: '/pages/user/unlock-records' },
        { label: '礼物记录', icon: '/static/official/ic_me_yhjf_n.png', url: '/pages/gift/records' },
        { label: '黑名单', icon: '/static/official/ic_profile_black.png', url: '/pages/user/blacklist' },
        { label: '我的战队', icon: '/static/official/mine_femain.png', url: '/pages/team/team' },
        { label: '投稿中心', icon: '/static/official/me_wtg.png', url: '/pages/submission/index' },
        { label: '隐私设置', icon: '/static/official/ic_me_privacy_n.png', url: '/pages/settings/index' },
        { label: '联系客服', icon: '/static/official/ic_me_customer_n.png', url: '/pages/settings/customer' },
        { label: '设置', icon: '/static/official/ic_me_set_n.png', url: '/pages/settings/index' }
      ]
    },
    authText() {
      const s = this.profile.auditStatus
      if (s === 'approved') return '已认证'
      if (s === 'pending') return '审核中'
      if (s === 'rejected') return '未通过'
      return '未认证'
    }
  },
  watch: {
    // 资料就绪后（如女用户资料异步返回）频道数可能变少，需把越界的 homeIndex 归位
    homeTabs() {
      if (this.homeIndex > this.homeTabs.length - 1) {
        this.homeIndex = 0
        this.loadUsers(true)
      }
    }
  },
  onLoad(q) {
    try {
      this.statusBar = uni.getSystemInfoSync().statusBarHeight || 0
    } catch (e) {
      this.statusBar = 0
    }
    this.tab = q.tab || 'home'
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.store.fetchProfile().catch(() => {})
    this.store.fetchUnread()
    // 拉取启动配置（官方 isNewsVip 依赖服务端 homepage_new_user_vague，用于首页新人昵称模糊）
    if (!this.store.appConfig) this.store.loadAppConfig()
    this.ensureLoaded(this.tab)
  },
  onShow() {
    if (this.store.token) this.store.fetchUnread()
    // 从城市选择页返回：城市变化时需按新城市重载首页用户列表
    if (!this.store.token || this.tab !== 'home') return
    if (!this.loadedCity || this.store.city === this.loadedCity) return
    this.loadUsers(true)
  },
  methods: {
    mediaUrl,
    timeAgo,
    ageOf,
    thousands,
    money,
    /** item_dynamic.xml 底部举报入口（ic_profile1_syh） */
    goReport(m) {
      if (!m || !m.id) return
      nav(`/pages/report/report?targetId=${m.id}&targetType=moment`)
    },
    /** item_home_two_recommend.xml：online_text（官方 data.last_log_time） */
    lastLogOf(u) {
      if (!u) return ''
      if (u.online) return '在线'
      return timeAgo(u.lastActiveAt) || ''
    },
    /** 官方 EnumUtil.isFemale(sex)：被浏览者性别（本应用 2=女、1=男） */
    isFemaleU(u) {
      return !!u && u.gender === 2
    },
    /** 官方 EnumUtil.isYes(new_user) */
    isNewUser(u) {
      return !!(u && u.newUser)
    },
    /** 官方 EnumUtil.isYes(is_confirmed)：实名认证标（rnrz / iv_zrrz） */
    isConfirmed(u) {
      return !!(u && u.isConfirmed)
    },
    /** 官方 tv_new_user 显隐：isFemale(sex) && isYes(new_user)（卡片 / 列表一致） */
    showNewUser(u) {
      return this.isFemaleU(u) && this.isNewUser(u)
    },
    /** 官方 iv_has_video：data.video_num != 0 */
    hasVideo(u) {
      return !!(u && u.videoNum)
    },
    /** 官方 HomeRecommendTwoAdapter L81 新人昵称模糊：
     *  isNewsVip（服务端全局开关 homepage_new_user_vague）&& !isVip && isOppositeFemale && new_user */
    blurNewUser(u) {
      const cfg = this.store.appConfig
      return !!(cfg && cfg.homepageNewUserVague) && !this.store.isVip && this.store.gender !== 2 && this.isNewUser(u)
    },
    /** 卡片昵称：模糊时 "*****"（官方 L141） */
    nickText(u) {
      return this.blurNewUser(u) ? '*****' : (u && u.nickname) || ''
    },
    /** 卡片昵称 maxWidth（官方 L155）：80 / 100 / 150dip → 160 / 200 / 300rpx */
    nickMaxWidth(u) {
      if (this.isFemaleU(u) && this.isNewUser(u) && this.isConfirmed(u)) return 160
      if (this.isNewUser(u) || this.isConfirmed(u)) return 200
      return 300
    },
    /** 列表 tv_add_count（官方 L114）：img_num>3 && 可见相册>2 → "+"(img_num-3) */
    addCount(u) {
      if (!u || !(u.imgNum > 3) || this.photosOf(u).length < 3) return ''
      return `+${u.imgNum - 3}`
    },
    /** item_home_two_recommend.xml：tag3（有定位权限时「距离/城市」，否则「城市」） */
    cityText(u) {
      if (!u) return ''
      const d = formatDistance(u.distance)
      return d ? `${d}/${u.city || ''}` : u.city || ''
    },
    avatarOf(u) {
      const a = u && u.avatar ? u.avatar : ''
      return a ? mediaUrl(a) : u && u.gender === 1 ? '/static/official/login_male.png' : '/static/official/bg_avatar_woman.png'
    },
    /** item_home_female_small.xml：flow_photo 最多 3 张相册缩略图 */
    photosOf(u) {
      return (u && u.photos ? u.photos : []).slice(0, 3)
    },
    go(url) {
      nav(url)
    },
    goAdd(url) {
      this.addSheet = false
      nav(url)
    },
    /** ll_rnrz 点击（官方 MainFragment.rnrz）：
     *  男用户(isOppositeFemale) 或 已认证 → return；否则跳认证引导页 */
    onNoticeTap() {
      if (this.store.gender !== 2 || this.verified) return
      this.go('/pages/verification/index')
    },
    goUser(id) {
      if (!id) return
      nav(`/pages/user/detail?id=${id}`)
    },
    toChat(peerId) {
      if (!peerId) return
      nav(`/pages/chat/chat?peerId=${peerId}`)
    },
    onTab(key) {
      if (key === 'invite') {
        // 底部中间为悬浮「邀请」按钮（官方 activity_main.xml main_share / pc_tab_invite_n），
        // 指向邀请好友页，而非邀约活动列表
        nav('/pages/invite/invite')
        return
      }
      this.tab = key
      this.ensureLoaded(key)
    },
    ensureLoaded(key) {
      if (key === 'home' && !this.users.length) this.loadUsers(true)
      if (key === 'discover') {
        this.loadBanners()
        if (!this.moments.length) this.loadMoments(true)
      }
      if (key === 'message' && !this.conversations.length) this.loadConversations()
    },
    // ---- 首页 ----
    switchHome(i) {
      if (this.homeIndex === i) return
      this.homeIndex = i
      this.loadUsers(true)
    },
    async loadUsers(reset) {
      if (this.userLoading) return
      if (reset) {
        this.userPage = 1
        this.userFinished = false
        this.loadedCity = this.store.city
      }
      this.userLoading = true
      try {
        const key = this.homeTabs[this.homeIndex].key
        const params = { page: this.userPage, pageSize: 10, city: this.store.city }
        const list =
          key === 'nearby'
            ? await userApi.nearby(params)
            : await userApi.recommend({ ...params, sort: key === 'new' ? 'new' : '' })
        const arr = (list && list.list) || []
        this.users = reset ? arr : this.users.concat(arr)
        this.userFinished = arr.length < 10
        if (!this.userFinished) this.userPage++
      } catch (e) {
        this.userFinished = true
      } finally {
        this.userLoading = false
      }
    },
    loadMoreUser() {
      if (!this.userLoading && !this.userFinished) this.loadUsers(false)
    },
    async toggleFollow(u) {
      try {
        if (u.followed) await userApi.unfollow(u.id)
        else await userApi.follow(u.id)
        u.followed = !u.followed
        toast(u.followed ? '已关注' : '已取消关注')
      } catch (e) {
        /* 已提示 */
      }
    },
    // ---- 动态 ----
    async loadBanners() {
      if (this.banners.length) return
      try {
        let list = await discoverApi.banners('discover')
        if (!list || !list.length) list = await discoverApi.banners('home')
        this.banners = list || []
      } catch (e) {
        this.banners = []
      }
    },
    onBannerChange(e) {
      this.bannerIndex = e.detail.current
    },
    goBanner(b) {
      if (b && b.link) nav(b.link)
    },
    switchDyn(i) {
      if (this.dynIndex === i) return
      this.dynIndex = i
      this.loadMoments(true)
    },
    toggleGender() {
      // 官方 DynamicFragment#setSexLogoOnclickListener：sexIndex 0→1→2→0
      // 0=全部 / 1=异性 / 2=同性（本应用性别编码 2=女、1=男）
      const opposite = this.store.gender === 2 ? 1 : 2
      const same = this.store.gender === 2 ? 2 : 1
      const cycle = [0, opposite, same]
      const cur = cycle.indexOf(this.genderFilter)
      this.genderFilter = cycle[(cur + 1) % 3]
      this.loadMoments(true)
    },
    async loadMoments(reset) {
      if (this.momentLoading) return
      if (reset) {
        this.momentPage = 1
        this.momentFinished = false
      }
      this.momentLoading = true
      try {
        const key = this.dynTabs[this.dynIndex].key
        const params = { page: this.momentPage, pageSize: 10 }
        // 邻圈（官方 get_type=2）按所选城市过滤；「全国」时不过滤
        if (key === 'circle' && this.dynCity !== '全国') params.city = this.dynCity
        const res = await momentApi.list(params)
        let arr = (res && res.list) || []
        if (this.genderFilter) arr = arr.filter((m) => m.author && m.author.gender === this.genderFilter)
        this.moments = reset ? arr : this.moments.concat(arr)
        this.momentFinished = ((res && res.list) || []).length < 10
        if (!this.momentFinished) this.momentPage++
      } catch (e) {
        this.momentFinished = true
      } finally {
        this.momentLoading = false
      }
    },
    loadMoreMoment() {
      if (!this.momentLoading && !this.momentFinished) this.loadMoments(false)
    },
    async like(m) {
      try {
        const r = await momentApi.like(m.id)
        m.liked = r.liked
        m.likeCount = r.likeCount
      } catch (e) {
        /* 已提示 */
      }
    },
    // ---- 消息 ----
    async loadConversations() {
      this.convLoading = true
      try {
        this.conversations = (await messageApi.conversations()) || []
      } catch (e) {
        this.conversations = []
      } finally {
        this.convLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.main {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $tg-bg-page;
}
.tabpane {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
}
.scroll {
  flex: 1;
  height: 0;
}
.safe {
  height: 40rpx;
}

/* ---- 顶部 tab 栏（对齐 fragment_main.xml） ---- */
.home-top {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  background: #ffffff;
}
.home-top__tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.home-top__tab {
  margin-right: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* home_custom_tab_item.xml + DynamicTabProvider：未选中 15sp，选中 19sp 加粗 */
.home-top__tab-text {
  font-size: 30rpx;
  color: #9e9e9e;
}
.home-top__tab-text.is-active {
  font-size: 38rpx;
  font-weight: bold;
  color: #181716;
}
.home-top__indicator {
  margin-top: 8rpx;
  width: 26rpx;
  height: 8rpx;
  border-radius: 6rpx;
  background: #ff731c;
}
.home-top__right {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.home-top__icon {
  width: 30rpx;
  height: 30rpx;
}
/* dynamic_main_fragment.xml: sexlogo = ic_home_gender_n（13×12dip），padding 10dip 仅作点击热区 */
.home-top__gender {
  width: 26rpx;
  height: 24rpx;
  flex-shrink: 0;
}
.home-top__city {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 48rpx;
}
.home-top__city-text {
  font-size: 26rpx;
  color: #61605f;
}
.home-top__arrow {
  margin-left: 12rpx;
  width: 12rpx;
  height: 8rpx;
}

/* ---- 认证提示条 ll_rnrz（fragment_main.xml） ---- */
.notice {
  margin-top: 10rpx;
  height: 60rpx;
  background: #fff4ed;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.notice__icon {
  width: 20rpx;
  height: 20rpx;
  margin-left: 30rpx;
}
.notice__text {
  flex: 1;
  margin-left: 20rpx;
  margin-right: 20rpx;
  font-size: 24rpx;
  color: #fa8c51;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* 立即认证：main_dingwei_bg 实心 #FF731C 圆角 7dip，10sp 白字，minWidth 54dip */
.notice__btn {
  margin-right: 60rpx;
  min-width: 108rpx;
  height: 46rpx;
  padding: 0 20rpx;
  border-radius: 14rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---- 用户卡·双列瀑布（对齐 item_home_two_recommend.xml） ----
 * StaggeredGridLayoutManager 2 列 + GridSpacingItemDecoration(5dip)：
 * RecyclerView 左右 padding 5dip、列间距 4dip → 卡宽 (750-20-8)/2 = 361rpx
 * 高度 ratio：首项 180:216 → 433rpx；其余 180:240 → 481rpx
 */
.ucard-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 0 10rpx;
  background: #ffffff;
}
.ucard {
  position: relative;
  width: calc(50% - 4rpx);
  height: 481rpx;
  margin-bottom: 4rpx;
  border-radius: 10rpx; /* CardView cardCornerRadius 5dip */
  overflow: hidden;
  background: #f0f1f2;
}
.ucard:nth-child(2n + 1) {
  margin-right: 8rpx;
}
.ucard:nth-child(-n + 2) {
  margin-bottom: 8rpx;
}
.ucard:first-child {
  height: 433rpx;
}
.ucard__img {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
/* online：ShapeLinearLayout 高 15dip / 圆角 4dip / solid #40090909，online_text 9sp */
.ucard__online {
  position: absolute;
  left: 10rpx; /* marginStart 5dip */
  top: 30rpx; /* marginTop 15dip */
  height: 30rpx;
  padding: 0 8rpx; /* online_text marginStart/End 4dip */
  border-radius: 8rpx;
  background: rgba(9, 9, 9, 0.25);
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ucard__online-text {
  font-size: 18rpx;
  color: #ffffff;
}
/* iv_has_video：home_play_button 60px@3x = 20dip，右上 margin 6dip */
.ucard__video {
  position: absolute;
  right: 12rpx;
  top: 12rpx;
  width: 40rpx;
  height: 40rpx;
}
/* 底部信息条：高 75dip / bg pic_home_mc_n / padding 20dip 10dip 10dip 6dip */
.ucard__bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 150rpx;
  box-sizing: border-box;
  padding: 40rpx 20rpx 20rpx 12rpx;
  background-image: url('/static/official/pic_home_mc_n.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  display: flex;
  flex-direction: column;
}
.ucard__nickrow {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 6rpx; /* marginTop 3dip */
  margin-right: 6rpx; /* marginRight 3dip */
  overflow: hidden;
}
.ucard__nick {
  font-size: 30rpx; /* 15sp bold */
  font-weight: bold;
  color: #ffffff;
  line-height: 36rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* tv_new_user：25×14dip 圆角 5dip solid #4D000000，9sp 白字，marginLeft 3dip */
.ucard__newuser {
  width: 50rpx;
  height: 28rpx;
  margin-left: 6rpx;
  border-radius: 10rpx;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ucard__newuser-text {
  font-size: 18rpx;
  color: #ffffff;
}
/* rnrz：34×14dip（rzbs） */
.ucard__rnrz {
  width: 68rpx;
  height: 28rpx;
  margin-left: 6rpx;
  flex-shrink: 0;
}
.ucard__tagrow {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 6rpx; /* marginTop 3dip */
  overflow: hidden;
}
/* age drawableLeft = list_female_tags（14×24px @3x），drawablePadding 1dip */
.ucard__age-icon {
  width: 9rpx;
  height: 16rpx;
  margin-right: 2rpx;
  flex-shrink: 0;
}
.ucard__age {
  font-size: 22rpx; /* 11sp */
  color: #ffffff;
  flex-shrink: 0;
}
/* d3 / d1：1×9dip 白色分隔线，左右 margin 3dip */
.ucard__div {
  width: 2rpx;
  height: 18rpx;
  margin: 0 6rpx;
  background: #ffffff;
  flex-shrink: 0;
}
.ucard__t {
  font-size: 22rpx; /* 11sp */
  color: #ffffff;
  flex-shrink: 0;
}

/* ---- 首页列表模式用户行（官方 item_home_male_small / item_home_female_small） ----
 * 行样式与官方一致：整行白底、底部 1px #F0F0F0 分隔线、左右 padding 由 item 自身提供
 */
.urow {
  background: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
}

/* 被浏览者为女：item_home_female_small.xml（行高 123dip / padding 15dip） */
.urow--female {
  height: 246rpx;
  align-items: center;
  padding: 0 30rpx;
}
.urow__cover {
  position: relative;
  width: 178rpx;
  height: 178rpx;
  flex-shrink: 0;
}
/* iv_cover：89dip，riv_corner_radius 8dip */
.urow__f-avatar {
  width: 178rpx;
  height: 178rpx;
  border-radius: 16rpx;
  background: #f0f1f2;
}
/* tv_new_user：22×14dip 圆角 5dip solid #4D000000，9sp 白字，左上 margin 2dip */
.urow__newuser {
  position: absolute;
  left: 4rpx;
  top: 4rpx;
  width: 44rpx;
  height: 28rpx;
  border-radius: 10rpx;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.urow__newuser-text {
  font-size: 18rpx;
  color: #ffffff;
}
/* iv_has_video：home_play_button 20dip，右上 margin 2dip */
.urow__video {
  position: absolute;
  right: 4rpx;
  top: 4rpx;
  width: 40rpx;
  height: 40rpx;
}
.urow__f-main {
  flex: 1;
  min-width: 0;
  height: 178rpx;
  margin-left: 36rpx;
  display: flex;
  flex-direction: column;
}
.urow__f-namerow {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
/* 官方 female 布局 tv_name 独有 paddingTop 3dip（male 无） */
.urow--female .urow__name {
  padding-top: 6rpx;
}
/* iv_chat：19dip，对齐 tv_name 顶部并贴右 */
.urow__f-chat {
  width: 38rpx;
  height: 38rpx;
  margin-left: auto;
  flex-shrink: 0;
}
/* flow_photo 行：相册缩略图贴左、城市贴右，底对齐 */
.urow__f-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
}
.urow__photos {
  position: relative;
  display: flex;
  flex-direction: row;
}
/* iv_photo1..3：29dip，圆角 5dip，间距 5dip */
.urow__photo {
  width: 58rpx;
  height: 58rpx;
  margin-right: 10rpx;
  border-radius: 10rpx;
  background: #f0f1f2;
}
.urow__photo:last-child {
  margin-right: 0;
}
/* tv_add_count：29×29dip 圆角 5dip solid #80000000，11sp 白字，叠于 iv_photo3 */
.urow__addcount {
  position: absolute;
  right: 0;
  top: 0;
  width: 58rpx;
  height: 58rpx;
  border-radius: 10rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.urow__addcount-text {
  font-size: 22rpx;
  color: #ffffff;
}
/* tv_city：11sp #9E9E9E */
.urow__f-city {
  margin-left: auto;
  font-size: 22rpx;
  color: #9e9e9e;
}

/* 被浏览者为男：item_home_male_small.xml（行高 99dip / paddingStart 15dip paddingEnd 13dip） */
.urow--male {
  height: 198rpx;
  align-items: center;
  padding: 0 26rpx 0 30rpx;
}
/* iv_cover：75dip，riv_corner_radius 8dip */
.urow__m-avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background: #f0f1f2;
}
.urow__m-main {
  flex: 1;
  min-width: 0;
  height: 150rpx;
  margin-left: 36rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.urow__m-namerow {
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* iv_vip：34×14dip，marginLeft 5dip */
.urow__vip {
  width: 68rpx;
  height: 28rpx;
  margin-left: 10rpx;
  flex-shrink: 0;
}
/* tv_city：11sp #9E9E9E，drawableLeft home_location，drawablePadding 5dip */
.urow__city {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.urow__city-icon {
  width: 12rpx;
  height: 14rpx;
  margin-right: 10rpx;
  flex-shrink: 0;
}
.urow__city-text {
  font-size: 22rpx;
  color: #9e9e9e;
}
/* iv_follow：39×39dip（padding 10dip → 图标内容 19dip） */
.urow__follow {
  width: 78rpx;
  height: 78rpx;
  padding: 20rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}
.urow__follow-icon {
  width: 100%;
  height: 100%;
  display: block;
}

/* 两套列表行共用：tv_name 15sp bold #30302F，rzbs 34×14dip */
.urow__name {
  max-width: 320rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.urow__rz {
  width: 68rpx;
  height: 28rpx;
  margin-left: 10rpx;
  flex-shrink: 0;
}
/* flow_tag：horizontalGap 10dip，marginTop 8dip（女行） */
.urow__tags {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* ShapeTextView：高 17dip，圆角 5dip，实心 #F3F3F3，11sp #61605F，左右 padding 7dip */
.urow__tag {
  height: 34rpx;
  padding: 0 14rpx;
  border-radius: 10rpx;
  background: #f3f3f3;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.urow__tag + .urow__tag {
  margin-left: 20rpx;
}
/* tv_age drawableLeft：ic_home_female / ic_home_man，drawablePadding 1dip */
.urow__tag-sex {
  width: 12rpx;
  height: 18rpx;
  margin-right: 2rpx;
  flex-shrink: 0;
}
.urow__tag-text {
  font-size: 22rpx;
  color: #61605f;
}

/* ---- 动态页轮播（dynamic_banner.xml 100dip 容器 / 86dip banner） ---- */
.banner {
  position: relative;
  height: 200rpx;
}
.banner__swiper {
  height: 172rpx;
}
/* dynamic_banner_item.xml：RoundImageView 左右 margin 3dip、四角圆角 10dip、centerCrop */
.banner__item {
  height: 172rpx;
  padding: 0 6rpx;
  box-sizing: border-box;
}
.banner__img {
  width: 100%;
  height: 100%;
  border-radius: 20rpx;
  display: block;
}
.banner__dots {
  position: absolute;
  right: 20rpx;
  bottom: 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.banner__dot {
  width: 10rpx;
  height: 10rpx;
  margin-left: 8rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}
.banner__dot.is-active {
  width: 24rpx;
  border-radius: 6rpx;
  background: #ffffff;
}

/* ---- 动态发布条 ---- */
.pubbar {
  margin: 20rpx 30rpx 0;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.pubbar__icon {
  width: 40rpx;
  height: 40rpx;
}
.pubbar__text {
  flex: 1;
  margin-left: 16rpx;
  font-size: 26rpx;
  color: #c8c9cc;
}
.pubbar__btn {
  padding: 6rpx 24rpx;
  border-radius: 24rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 24rpx;
}

/* ---- 发布弹窗（对齐 home_add_dialog_fragment.xml） ----
 * 根 ShapeLinearLayout angle=270 渐变 #ffe3d6→#ffffff，上左/上右圆角 15dip(30rpx)；
 * 头部 close pop_cha(33×35px→22×24rpx) padding 15dip(30rpx)；
 * 主体 横向 两项 weight 1、marginBottom 27dip(54rpx)；
 * 图 pic_fbdt/pic_fbyy 486×549px→324×366rpx（centerInside）；
 * 文字 14sp bold #ff494949 底部居中、距底 50dip(100rpx)。
 */
.addsheet {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.addsheet__panel {
  width: 100%;
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  background: linear-gradient(180deg, #ffe3d6 0%, #ffffff 50%, #ffffff 100%);
  overflow: hidden;
}
.addsheet__head {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}
.addsheet__close {
  padding: 30rpx;
}
.addsheet__close-img {
  display: block;
  width: 22rpx;
  height: 24rpx;
}
.addsheet__body {
  display: flex;
  flex-direction: row;
  margin-bottom: 54rpx;
}
.addsheet__item {
  position: relative;
  flex: 1;
  height: 366rpx;
}
.addsheet__img {
  position: absolute;
  left: 50%;
  top: 0;
  margin-left: -162rpx;
  width: 324rpx;
  height: 366rpx;
}
.addsheet__label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: bold;
  color: #494949;
}

/* ---- 动态卡（对齐 item_dynamic.xml） ---- */
.ditem {
  margin: 40rpx 30rpx 0;
  background: #ffffff;
}
.ditem__head {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.ditem__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: #f0f1f2;
}
.ditem__hm {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}
.ditem__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ditem__name {
  font-size: 30rpx;
  font-weight: bold;
  color: #595959;
}
.ditem__rz {
  height: 28rpx;
  margin-left: 10rpx;
}
.ditem__meta {
  margin-top: 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* item_dynamic.xml: sexlogo 5×8dip（无 src，由代码按性别设置） */
.ditem__sex {
  width: 10rpx;
  height: 16rpx;
  margin-right: 4rpx;
  flex-shrink: 0;
}
.ditem__age,
.ditem__time {
  font-size: 22rpx;
  color: #9e9e9e;
  margin-right: 16rpx;
}
/* chat：shape 实心 #FFF9F6 + 描边 1px #FF5E13 + 圆角 10dip，11sp #FF5E13，marginRight 15dip */
.ditem__chat {
  min-width: 100rpx;
  height: 52rpx;
  margin-right: 30rpx;
  padding: 0 16rpx;
  border-radius: 20rpx;
  background: #fff9f6;
  border: 2rpx solid #ff5e13;
  color: #ff5e13;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ditem__content {
  margin-left: 100rpx;
  margin-top: 20rpx;
  font-size: 30rpx;
  color: #30302f;
  line-height: 44rpx;
}
.ditem__imgs {
  margin-left: 100rpx;
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
}
.ditem__img {
  flex: 1;
  height: 210rpx;
  margin-right: 12rpx;
  border-radius: 12rpx;
  background: #f0f1f2;
}
.ditem__img:last-child {
  margin-right: 0;
}
/* item_dynamic.xml：胶囊行 marginLeft 50dip / marginTop 10dip，横向排列 */
.ditem__chips {
  margin-left: 100rpx;
  margin-top: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* ShapeLinearLayout 圆角 8dip / 实心 #F8F8F8 / 高 26dip */
.ditem__chip {
  height: 52rpx;
  border-radius: 16rpx;
  background: #f8f8f8;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* dt_activity / dt_time：9dip×10dip，marginLeft 8dip */
.ditem__chip-icon {
  width: 18rpx;
  height: 20rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}
/* 文案 12sp #61605F，marginLeft 4dip / marginRight 9dip */
.ditem__chip-text {
  margin-left: 8rpx;
  margin-right: 18rpx;
  font-size: 24rpx;
  color: #61605f;
}
/* 第二个胶囊 marginLeft 20dip */
.ditem__chip + .ditem__chip {
  margin-left: 40rpx;
}
/* item_dynamic.xml：底部行 marginLeft 50dip / marginBottom 5dip（行高由 report 的 45dip 决定） */
.ditem__foot {
  margin-left: 100rpx;
  margin-top: 10rpx;
  margin-bottom: 10rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* op_like：marginLeft 6dip（在行 50dip 基础上）；home_selected_like 16dip×18dip */
.ditem__act {
  margin-left: 12rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.ditem__act-icon {
  width: 32rpx;
  height: 36rpx;
  margin-right: 8rpx;
}
/* 数量 12sp #828282，marginLeft 4dip */
.ditem__act-text {
  font-size: 24rpx;
  color: #828282;
}
.ditem__act-text.is-on {
  color: #ff731c;
}
/* report：ic_profile1_syh（12×54px），ImageView 高 45dip / padding 10·15dip / marginRight 2dip / alignParentRight */
.ditem__report {
  margin-left: auto;
  margin-right: 4rpx;
  height: 90rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ditem__report-icon {
  width: 7rpx;
  height: 30rpx;
}
.ditem__line {
  margin-left: 100rpx;
  height: 1rpx;
  background: #f0f0f0;
}

/* ---- 消息（对齐 rong_msg_base_fragment.xml） ---- */
.msg-head {
  background: #ffffff;
}
.msg-head__title {
  display: block;
  margin-left: 30rpx;
  margin-top: 20rpx;
  font-size: 38rpx;
  font-weight: bold;
  color: #181716;
}
.msg-head__bar {
  margin-left: 56rpx;
  margin-top: 6rpx;
  width: 26rpx;
  height: 8rpx;
  border-radius: 6rpx;
  background: #ff731c;
}
.msg-tip {
  height: 60rpx;
  margin-top: 8rpx;
  padding: 0 30rpx;
  background: #f7f7f7;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.msg-tip__text {
  flex: 1;
  font-size: 22rpx;
  color: #9797a1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.msg-tip__close {
  width: 24rpx;
  height: 24rpx;
}
.quick {
  margin: 20rpx 30rpx 0;
  padding: 28rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
}
.quick__item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.quick__icon {
  width: 56rpx;
  height: 56rpx;
}
.quick__text {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #494949;
}
.quick__dot {
  position: absolute;
  top: 0;
  right: 40rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 8rpx;
  background: #ff731c;
}
.conv {
  margin: 20rpx 30rpx 0;
  padding: 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.conv__avatar-wrap {
  position: relative;
  width: 96rpx;
  height: 96rpx;
}
.conv__avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: #f0f1f2;
}
.conv__badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 8rpx;
  border-radius: 17rpx;
  background: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.conv__badge-text {
  color: #ffffff;
  font-size: 18rpx;
}
.conv__info {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
}
.conv__name {
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
}
.conv__last {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #91979e;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.conv__time {
  font-size: 22rpx;
  color: #c8c9cc;
}

/* ---- 我的（对齐 new_mine_layout.xml） ---- */
/* NestedScrollView background #fff7f7f7 */
.mine__page {
  background: #f7f7f7;
}
/* LinearLayout layout_marginTop 10dip */
.mine__top {
  position: relative;
  padding-top: 20rpx;
}
/* ll_auth(marginTop 30dip) + view_empty(22dip) + iv_setting(marginTop 37dip, marginRight 15dip) */
.mine__bar {
  position: absolute;
  top: 80rpx;
  right: 30rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
/* ll_auth：solid #ffe8e8e8，radius 8dip，高 33dip，paddingRight 11dip */
.mine__auth {
  height: 66rpx;
  padding-right: 22rpx;
  border-radius: 16rpx;
  background: #e8e8e8;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mine__auth-icon {
  width: 28rpx;
  height: 28rpx;
  margin-left: 28rpx;  /* 14dip */
}
.mine__auth-text {
  margin-left: 10rpx;  /* 5dip */
  font-size: 24rpx;  /* 12sp */
  font-weight: bold;
  color: #181716;
}
.mine__auth-arrow {
  width: 10rpx;  /* 5dip */
  height: 16rpx;  /* 8dip */
  margin-left: 10rpx;  /* 5dip */
}
/* me_setting：marginTop 37dip(相对胶囊 +7dip)，左侧 view_empty 22dip */
.mine__setting {
  width: 44rpx;
  height: 44rpx;
  margin-top: 14rpx;
  margin-left: 44rpx;
}
/* info：marginLeft 15dip marginTop 62dip marginBottom 12dip */
.mine__info {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 124rpx 30rpx 24rpx;
}
/* CircleImageView 59dip + round_borderWidth 2dip #FFFFFF */
.mine__avatar {
  width: 118rpx;
  height: 118rpx;
  box-sizing: border-box;
  border: 4rpx solid #ffffff;
  border-radius: 59rpx;
  background: #f0f1f2;
  flex-shrink: 0;
}
.mine__uinfo {
  flex: 1;
  min-width: 0;
  margin-left: 36rpx;  /* 18dip */
  margin-right: 34rpx;  /* 17dip */
  display: flex;
  flex-direction: column;
}
.mine__row {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mine__name {
  max-width: 340rpx;
  font-size: 34rpx;  /* 17sp */
  font-weight: bold;
  color: #181716;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* touxiang：34.0dip×14.0dip，marginLeft 5dip（vip_zx） */
.mine__vip {
  width: 68rpx;
  height: 28rpx;
  margin-left: 10rpx;
}
/* 年龄/职业/城市行：marginTop 14dip */
.mine__tags {
  margin-top: 28rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* mine_male_age / mine_huise_bg：solid #f0f0f0，radius 5dip，高 19dip，左右 padding 10dip */
.mine__tag {
  height: 38rpx;
  padding: 0 20rpx;
  border-radius: 10rpx;
  background: #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mine__tag + .mine__tag {
  margin-left: 12rpx;  /* 6dip */
}
.mine__tag-sex {
  width: 18rpx;  /* 9dip */
  height: 18rpx;
  margin-right: 6rpx;  /* 3dip */
}
.mine__tag-age {
  font-size: 24rpx;  /* 12sp */
  color: #828282;
}
.mine__tag-text {
  font-size: 22rpx;  /* 11sp */
  color: #877b75;
}
/* mine_img_avator：solid #fbf0e0，radius 6dip，高 36dip，左右 margin 15dip，文案 13sp #cc8a20 */
.mine__audit {
  height: 72rpx;
  margin: 0 30rpx;
  border-radius: 12rpx;
  background: #fbf0e0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mine__audit-icon {
  width: 28rpx;
  height: 28rpx;
  margin-left: 30rpx;  /* 15dip */
}
.mine__audit-text {
  margin-left: 22rpx;  /* 11dip */
  font-size: 26rpx;  /* 13sp */
  color: #cc8a20;
}
/* ll_other：marginTop 10dip，左右 padding 16dip */
.mine__stats {
  margin-top: 20rpx;
  padding: 0 32rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mine__stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mine__stat-num {
  font-size: 32rpx;  /* 16sp */
  font-weight: bold;
  color: #30302f;
}
.mine__stat-label {
  margin-top: 10rpx;  /* 5dip */
  font-size: 22rpx;  /* 11sp */
  color: #61605f;
}
/* 竖分隔线：#ffc9c9c9，1.0dip×19.0dip */
.mine__stat-line {
  width: 2rpx;
  height: 38rpx;
  background: #c9c9c9;
}
/* huiyuan：高 87dip，左右 margin 10dip，marginTop 15dip */
.mine__entry {
  height: 174rpx;
  margin: 30rpx 20rpx 0;
  display: flex;
  flex-direction: row;
}
.mine__entry-card {
  flex: 1;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.mine__entry-card--auth {
  background-image: url('/static/official/pic_me_rzzx.png');
}
.mine__entry-card--vip {
  background-image: url('/static/official/pic_me_vip_female.png');
}
.mine__entry-gap {
  width: 30rpx;  /* 15dip */
}
.mine__entry-txt {
  display: flex;
  flex-direction: column;
}
.mine__entry-txt--auth {
  margin-left: 196rpx;  /* 98dip */
}
.mine__entry-txt--vip {
  margin-left: 114rpx;  /* 57dip */
}
.mine__entry-title {
  font-size: 28rpx;  /* 14sp */
  font-weight: bold;
}
.mine__entry-title--auth {
  font-size: 30rpx;  /* 15sp */
  color: #2e82f3;
}
.mine__entry-title--vip {
  color: #8c3623;
}
.mine__entry-sub {
  margin-top: 16rpx;  /* 8dip */
  font-size: 22rpx;  /* 11sp */
}
.mine__entry-sub--auth {
  margin-top: 20rpx;  /* 10dip */
  font-size: 24rpx;  /* 12sp */
  color: #599bf4;
}
.mine__entry-sub--vip {
  color: #9a4d42;
}
/* tv_auth_action：70×30dip，radius 15dip，solid #ff578df2，白字 11sp bold，marginRight 25dip */
.mine__entry-btn {
  width: 140rpx;
  height: 60rpx;
  margin-left: auto;
  margin-right: 50rpx;
  border-radius: 30rpx;
  background: #578df2;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}
.mine__entry-btn-text {
  font-size: 22rpx;  /* 11sp */
  font-weight: bold;
  color: #ffffff;
}
.mine__cards {
  margin: 30rpx 24rpx 36rpx;
  display: flex;
  flex-direction: row;
  height: 182rpx;
}
.mine__card {
  flex: 1;
  height: 182rpx;
  margin-right: 40rpx;
  background: #ffe6cf url('/static/official/pic_me_invite_n.png') no-repeat center / 100% 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.mine__card:last-child {
  margin-right: 0;
}
.mine__card--vip {
  background-image: url('/static/official/pic_me_walllet_n.png');
}
.mine__card-num {
  margin-left: 114rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}
.mine__card-label {
  margin-left: 114rpx;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}
.mine__assets {
  margin: 20rpx 30rpx 0;
  padding: 28rpx 0;
  border-radius: 16rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
}
.mine__asset {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mine__asset-num {
  font-size: 34rpx;
  font-weight: bold;
  color: #181716;
}
.mine__asset-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #91979e;
}
/* mine_white_bg：solid #ffffff + 1.0dip #ffffff 描边 + radius 7dip，
   marginLeft/Right 10dip，paddingTop 15dip paddingBottom 5dip */
.mine__list {
  margin: 20rpx 20rpx 0;
  padding: 30rpx 0 10rpx;
  border: 2rpx solid #ffffff;
  border-radius: 14rpx;
  background: #ffffff;
  overflow: hidden;
}
/* SimpleItemView：minHeight 61dip，标题 16sp #494949，箭头 15dip，分割线缩进 60dip */
.sitem {
  position: relative;
  min-height: 122rpx;
  padding: 0 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.sitem::after {
  content: '';
  position: absolute;
  left: 120rpx;
  right: 0;
  bottom: 0;
  height: 1rpx;
  background: #f0f0f0;
}
.sitem:last-child::after {
  display: none;
}
.sitem__icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 30rpx;
}
.sitem__label {
  flex: 1;
  font-size: 32rpx;
  color: #494949;
}
.sitem__extra {
  font-size: 28rpx;
  color: #b9b9b9;
  margin-right: 12rpx;
}
.sitem__arrow {
  width: 30rpx;
  height: 30rpx;
}

.loading {
  padding: 32rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading__text {
  font-size: 24rpx;
  color: #91979e;
}
</style>
