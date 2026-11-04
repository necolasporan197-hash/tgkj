<template>
  <view class="info">
    <view class="info__status" :style="{ height: statusBar + 'px' }" />

    <!-- 官方 activity_user_info_create：iv_logo_text 149.0dip×18.0dip / marginTop 50.0dip；tv_skip 13.0sp #ffd2b296 / marginTop 50.0dip / marginRight 15.0dip -->
    <view class="info__head">
      <image class="info__logo" src="/static/official/icons_logo_text.png" mode="aspectFit" />
      <text class="info__skip" @tap="skip">跳过</text>
    </view>

    <scroll-view scroll-y class="info__scroll">
      <!-- 官方 profile_female_basic_fragment 顶部提示：ic_register_xh_n 10.0dip + 13.0sp #ffb9b9b9 -->
      <view v-if="gender === 2" class="info__notice">
        <image class="info__notice-icon" src="/static/official/ic_register_xh_n.png" />
        <text class="info__notice-text">这里上传的头像需要参与认证，请慎重上传！</text>
      </view>

      <!-- 官方「基本信息」16.0sp bold #ff181716 -->
      <text class="info__title">基本信息</text>

      <!-- 官方 profile_male_basic_fragment：126.0dip 方形头像 + pic_xgzl_ghtx 58.0dip×17.0dip -->
      <view v-if="gender === 1" class="info__avatar" @tap="pickAvatar">
        <image class="info__avatar-img" :src="avatarUrl" mode="aspectFill" />
        <image class="info__avatar-tag" src="/static/official/pic_xgzl_ghtx.png" />
      </view>

      <view class="info__card" :class="{ 'info__card--narrow': gender === 2 }">
        <!-- 官方 profile_female_basic_fragment：头像行 54.0dip / 缩略图 33.0dip / marginRight 30.0dip -->
        <view v-if="gender === 2" class="info__row" @tap="pickAvatar">
          <text class="info__label">头像</text>
          <view class="info__right">
            <image class="info__avatar-sm" :src="avatarUrl" mode="aspectFill" />
            <image class="info__arrow" src="/static/official/item_view_arrow_gray.webp" />
          </view>
        </view>

        <!-- 昵称：et_name maxLength 8 / hint 请输入昵称 -->
        <view class="info__row">
          <text class="info__label">昵称</text>
          <input
            class="info__input"
            :value="form.nickname"
            maxlength="8"
            placeholder="请输入昵称"
            placeholder-class="info__ph"
            @input="set('nickname', $event)"
          />
        </view>

        <!-- 年龄：tv_age「请选择年龄」+ item_view_arrow_gray -->
        <picker mode="date" :value="form.birthday" :start="minBirthday" :end="maxBirthday" @change="onBirthday">
          <view class="info__row">
            <text class="info__label">年龄</text>
            <view class="info__right">
              <text class="info__value" :class="{ 'is-ph': !form.birthday }">{{ ageText }}</text>
              <image class="info__arrow" src="/static/official/item_view_arrow_gray.webp" />
            </view>
          </view>
        </picker>

        <!-- 城市（女：位于基本信息卡内） -->
        <view v-if="gender === 2" class="info__row" @tap="pickCity">
          <text class="info__label">城市</text>
          <view class="info__right">
            <text class="info__value" :class="{ 'is-ph': !form.city }">{{ form.city || '请选择所在城市' }}</text>
            <image class="info__arrow" src="/static/official/item_view_arrow_gray.webp" />
          </view>
        </view>
      </view>

      <!-- 官方 profile_female_basic_fragment「社交账号」+ ic_edit_star 提示 + et_wx maxLength 20 -->
      <template v-if="gender === 2">
        <text class="info__title">社交账号</text>
        <view class="info__hint">
          <image class="info__hint-icon" src="/static/official/ic_edit_star.png" />
          <text class="info__hint-text">请正确填写可以增加收益，填写错误的微信将无法通过审核 ~</text>
        </view>
        <view class="info__wx">
          <text class="info__label">微信</text>
          <input
            class="info__input"
            :value="form.wechat"
            maxlength="20"
            placeholder="请输入微信"
            placeholder-class="info__ph"
            @input="set('wechat', $event)"
          />
        </view>
      </template>

      <!-- 官方「更多信息」16.0sp bold -->
      <text class="info__title info__title--more">更多信息</text>

      <view class="info__card" :class="{ 'info__card--narrow': gender === 2 }">
        <!-- 官方 profile_female_basic_fragment 顺序：个性标签 → 职位 → 身高 → 感情状态 -->
        <template v-if="gender === 2">
          <view class="info__row">
            <text class="info__label">个性标签</text>
            <input
              class="info__input"
              :value="tagsText"
              maxlength="40"
              placeholder="请选择个性标签"
              placeholder-class="info__ph"
              @input="onTags"
            />
          </view>

          <view class="info__row">
            <text class="info__label">职位</text>
            <input
              class="info__input"
              :value="form.occupation"
              maxlength="20"
              placeholder="请输入职位"
              placeholder-class="info__ph"
              @input="set('occupation', $event)"
            />
          </view>

          <view class="info__row">
            <text class="info__label">身高</text>
            <input
              class="info__input"
              type="number"
              :value="form.height"
              maxlength="3"
              placeholder="cm"
              placeholder-class="info__ph"
              @input="set('height', $event)"
            />
          </view>

          <!-- 官方 SimpleItemView id=feeling title=感情状态 rightType=arrow rightTextColor=#ff828282 -->
          <view class="info__row" @tap="pickFeeling">
            <text class="info__label">感情状态</text>
            <view class="info__right">
              <text class="info__value" :class="{ 'is-ph': !form.feeling }">{{ form.feeling || '请选择感情状态' }}</text>
              <image class="info__arrow" src="/static/official/item_view_arrow_gray.webp" />
            </view>
          </view>
        </template>

        <!-- 官方 profile_male_basic_fragment 顺序：城市 → 职业 → 个性标签 -->
        <template v-else>
          <view class="info__row" @tap="pickCity">
            <text class="info__label">城市</text>
            <view class="info__right">
              <text class="info__value" :class="{ 'is-ph': !form.city }">{{ form.city || '请选择所在城市' }}</text>
              <image class="info__arrow" src="/static/official/item_view_arrow_gray.webp" />
            </view>
          </view>

          <view class="info__row">
            <text class="info__label">职业</text>
            <input
              class="info__input"
              :value="form.occupation"
              maxlength="20"
              placeholder="请选择你的职业"
              placeholder-class="info__ph"
              @input="set('occupation', $event)"
            />
          </view>

          <view class="info__row">
            <text class="info__label">个性标签</text>
            <input
              class="info__input"
              :value="tagsText"
              maxlength="40"
              placeholder="请选择个性标签"
              placeholder-class="info__ph"
              @input="onTags"
            />
          </view>
        </template>
      </view>

      <view class="info__safe" />
    </scroll-view>

    <!-- 官方 create_info_bottom.xml：marginLeft 15.0dip / marginRight 36.0dip / marginBottom 36.0dip -->
    <view class="info__bottom">
      <view class="info__back" @tap="back">
        <image class="info__back-icon" src="/static/official/pic_register_back.png" mode="aspectFit" />
      </view>
      <!-- 官方 button_ff8800 为渐变，本项目统一改为实心 #ff731c；文案取官方 next_button「开始交友」 -->
      <view class="info__btn" :class="{ 'is-disabled': submitting }" @tap="submit">开始交友</view>
    </view>
  </view>
</template>

<script>
import { authApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, nav, loading, hideLoading, chooseImage } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      statusBar: 0,
      submitting: false,
      pickingCity: false,
      avatarLocal: '',
      tagsText: '',
      gender: 0,
      account: {},
      form: {
        nickname: '',
        avatar: '',
        birthday: '',
        city: '',
        occupation: '',
        wechat: '',
        height: '',
        feeling: ''
      }
    }
  },
  computed: {
    /** 官方年龄范围 18–60 岁 → 生日可选区间 */
    minBirthday() {
      const y = new Date().getFullYear()
      return `${y - 60}-01-01`
    },
    maxBirthday() {
      const y = new Date().getFullYear()
      return `${y - 18}-12-31`
    },
    ageText() {
      if (!this.form.birthday) return '请选择年龄'
      const t = new Date(String(this.form.birthday).replace(/-/g, '/'))
      if (isNaN(t.getTime())) return '请选择年龄'
      const now = new Date()
      let age = now.getFullYear() - t.getFullYear()
      const m = now.getMonth() - t.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < t.getDate())) age--
      return age > 0 && age < 120 ? `${age}岁` : '请选择年龄'
    },
    avatarUrl() {
      if (this.avatarLocal) return this.avatarLocal
      if (this.form.avatar) return mediaUrl(this.form.avatar)
      return this.gender === 2 ? '/static/official/touxiang_female.png' : '/static/official/pic_register_def_n.png'
    }
  },
  onLoad() {
    try {
      this.statusBar = uni.getSystemInfoSync().statusBarHeight || 0
    } catch (e) {
      this.statusBar = 0
    }
    const saved = uni.getStorageSync('tggy_reg_form') || {}
    if (!saved.phone) {
      uni.reLaunch({ url: '/pages/login/register' })
      return
    }
    this.account = saved
    this.gender = Number(saved.gender) || 0
    if (!this.gender) {
      uni.reLaunch({ url: '/pages/login/register-sex' })
      return
    }
    if (this.store.city) this.form.city = this.store.city
  },
  onShow() {
    if (this.pickingCity) {
      this.pickingCity = false
      this.form.city = this.store.city
    }
  },
  methods: {
    set(key, e) {
      this.form[key] = e.detail.value
    },
    onTags(e) {
      this.tagsText = e.detail.value
    },
    onBirthday(e) {
      this.form.birthday = e.detail.value
    },
    pickCity() {
      this.pickingCity = true
      nav('/pages/city/city?pick=1')
    },
    /** 官方 SimpleItemView(id=feeling) 为选择型条目，无默认提示文案 → 用系统选择器承载 */
    pickFeeling() {
      const feelings = ['单身', '恋爱中', '已婚', '保密']
      uni.showActionSheet({
        itemList: feelings,
        success: (res) => {
          this.form.feeling = feelings[res.tapIndex]
        }
      })
    },
    async pickAvatar() {
      const paths = await chooseImage(1)
      if (!paths.length) return
      const path = paths[0]
      loading('上传中…')
      try {
        const res = await uploadFile(path, 'image')
        this.form.avatar = res && res.url ? res.url : res
        this.avatarLocal = path
      } catch (e) {
        /* 已提示 */
      } finally {
        hideLoading()
      }
    },
    back() {
      uni.navigateBack({ delta: 1 })
    },
    async submit() {
      if (this.submitting) return
      if (!String(this.form.nickname || '').trim()) return toast('请填写昵称')
      if (!this.form.birthday) return toast('请选择年龄')
      if (this.gender === 2 && !String(this.form.wechat || '').trim()) return toast('请填写微信')
      const tags = this.tagsText
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8)
      this.submitting = true
      try {
        const r = await authApi.register({
          phone: this.account.phone,
          password: this.account.password,
          smsCode: this.account.smsCode,
          inviteCode: this.account.inviteCode,
          nickname: this.form.nickname.trim(),
          avatar: this.form.avatar,
          gender: this.gender,
          birthday: this.form.birthday,
          city: this.form.city,
          occupation: this.form.occupation,
          wechat: this.form.wechat,
          height: this.form.height,
          feeling: this.form.feeling,
          tags
        })
        this.afterRegister(r)
      } catch (e) {
        /* 已提示 */
      } finally {
        this.submitting = false
      }
    },
    /** 官方 activity_user_info_create「跳过」：不填资料，直接用步骤 1/2 的账号与性别完成注册 */
    async skip() {
      if (this.submitting) return
      this.submitting = true
      try {
        const r = await authApi.register({
          phone: this.account.phone,
          password: this.account.password,
          smsCode: this.account.smsCode,
          inviteCode: this.account.inviteCode,
          gender: this.gender
        })
        this.afterRegister(r)
      } catch (e) {
        /* 已提示 */
      } finally {
        this.submitting = false
      }
    },
    afterRegister(r) {
      uni.removeStorageSync('tggy_reg_form')
      toast(r && r.auditStatus === 'pending' ? '注册成功，资料审核中' : '注册成功')
      setTimeout(() => uni.reLaunch({ url: '/pages/login/login' }), 1200)
    }
  }
}
</script>

<style lang="scss" scoped>
.info {
  min-height: 100vh;
  box-sizing: border-box;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
}
.info__status {
  width: 100%;
}
/* 官方 activity_user_info_create：logo 居中（149.0dip×18.0dip / marginTop 50.0dip）+ tv_skip 同行右对齐 */
.info__head {
  position: relative;
  margin-top: 100rpx;
  height: 36rpx;
}
.info__logo {
  display: block;
  width: 298rpx;
  height: 36rpx;
  margin: 0 auto;
}
/* 官方 tv_skip：13.0sp = 26rpx / #ffd2b296 / marginRight 15.0dip = 30rpx */
.info__skip {
  position: absolute;
  top: 0;
  right: 30rpx;
  font-size: 26rpx;
  color: #d2b296;
}
.info__scroll {
  flex: 1;
  height: 0;
}
/* 官方 profile_female_basic_fragment 提示行：marginLeft 15.0dip / marginTop 24.0dip */
.info__notice {
  display: flex;
  flex-direction: row;
  margin: 48rpx 30rpx 0;
}
/* ic_register_xh_n 10.0dip = 20rpx / marginTop 3.0dip = 6rpx */
.info__notice-icon {
  width: 20rpx;
  height: 20rpx;
  margin-top: 6rpx;
  flex-shrink: 0;
}
/* 13.0sp = 26rpx / #ffb9b9b9 / marginLeft 10.0dip = 20rpx */
.info__notice-text {
  margin-left: 20rpx;
  font-size: 26rpx;
  color: #b9b9b9;
}
/* 官方 section 标题：16.0sp = 32rpx bold #ff181716 / marginLeft 15.0dip = 30rpx / marginTop 15.0dip = 30rpx */
.info__title {
  display: block;
  margin: 30rpx 0 0 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #181716;
}
/* 官方「更多信息」：marginTop 17.0dip = 34rpx / marginBottom 12.0dip = 24rpx */
.info__title--more {
  margin-top: 34rpx;
  margin-bottom: 24rpx;
}
/* 官方 profile_male_basic_fragment：marginLeft 19.0dip / marginTop 15.0dip / marginBottom 20.0dip */
.info__avatar {
  position: relative;
  width: 252rpx;
  height: 252rpx;
  margin: 30rpx 0 40rpx 38rpx;
}
/* 126.0dip = 252rpx / radius 10.0dip = 20rpx */
.info__avatar-img {
  width: 252rpx;
  height: 252rpx;
  border-radius: 20rpx;
  background: #ececec;
}
/* pic_xgzl_ghtx 58.0dip×17.0dip = 116×34rpx / marginRight·Bottom 2.0dip = 4rpx */
.info__avatar-tag {
  position: absolute;
  right: 4rpx;
  bottom: 4rpx;
  width: 116rpx;
  height: 34rpx;
}
/* 官方白卡：radius 10.0dip = 20rpx / 男 marginLeft·Right 7.0dip = 14rpx */
.info__card {
  margin: 30rpx 14rpx 0;
  border-radius: 20rpx;
  background: #ffffff;
  overflow: hidden;
}
/* 官方 profile_female_basic_fragment 卡片：marginLeft·Right 8.0dip = 16rpx */
.info__card--narrow {
  margin-left: 16rpx;
  margin-right: 16rpx;
}
/* 官方行高 54.0dip = 108rpx / paddingLeft·Right 15.0dip = 30rpx */
.info__row {
  box-sizing: border-box;
  height: 108rpx;
  padding: 0 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
/* 官方 label：14.0sp = 28rpx / #ff30302f */
.info__label {
  font-size: 28rpx;
  color: #30302f;
  flex-shrink: 0;
}
.info__right {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  margin-left: 30rpx;
}
/* 官方 value：13.0sp = 26rpx / #ff828282 / paddingRight 5.0dip = 10rpx */
.info__value {
  font-size: 26rpx;
  color: #828282;
  padding-right: 10rpx;
  text-align: right;
}
.info__value.is-ph {
  color: #828282;
}
/* 官方 et_name：13.0sp = 26rpx / #ff828282 / marginLeft 15.0dip = 30rpx / 右对齐 */
.info__input {
  flex: 1;
  margin-left: 30rpx;
  font-size: 26rpx;
  color: #828282;
  text-align: right;
}
.info__ph {
  color: #828282;
  font-size: 26rpx;
}
/* item_view_arrow_gray 7.0dip×13.0dip = 14×26rpx */
.info__arrow {
  width: 14rpx;
  height: 26rpx;
  flex-shrink: 0;
}
/* 女用户头像行缩略图：33.0dip = 66rpx / marginRight 30.0dip = 60rpx */
.info__avatar-sm {
  width: 66rpx;
  height: 66rpx;
  border-radius: 8rpx;
  margin-right: 60rpx;
  background: #ececec;
}
/* 官方「社交账号」提示：marginLeft 15.0dip = 30rpx / marginTop 10.0dip = 20rpx */
.info__hint {
  display: flex;
  flex-direction: row;
  margin: 20rpx 30rpx 0;
}
/* ic_edit_star 10.0dip = 20rpx / marginTop 3.0dip = 6rpx */
.info__hint-icon {
  width: 20rpx;
  height: 20rpx;
  margin-top: 6rpx;
  flex-shrink: 0;
}
/* 12.0sp = 24rpx / #ff9e9e9e / marginLeft 10.0dip = 20rpx */
.info__hint-text {
  margin-left: 20rpx;
  font-size: 24rpx;
  color: #9e9e9e;
}
/* 官方 ll_wx_invalid：高 54.0dip = 108rpx / radius 10.0dip = 20rpx / marginLeft·Right 5.0dip = 10rpx / marginTop 10.0dip = 20rpx */
.info__wx {
  box-sizing: border-box;
  height: 108rpx;
  margin: 20rpx 10rpx 0;
  padding: 0 30rpx;
  border-radius: 20rpx;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.info__safe {
  height: 40rpx;
}
/* 官方 create_info_bottom：marginLeft 15.0dip = 30rpx / marginRight 36.0dip = 72rpx / marginBottom 36.0dip = 72rpx / 高 50.0dip = 100rpx */
.info__bottom {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100rpx;
  margin: 20rpx 72rpx 72rpx 30rpx;
}
.info__back {
  height: 100rpx;
  min-width: 84rpx;
  display: flex;
  align-items: center;
}
/* 官方 bottom_back：pic_register_back 18.0dip×16.0dip = 36×32rpx */
.info__back-icon {
  width: 36rpx;
  height: 32rpx;
}
/* 官方 next_button：marginLeft 30.0dip = 60rpx / 高 50.0dip = 100rpx / radius 15.0dip = 30rpx / 17.0sp = 34rpx bold */
.info__btn {
  flex: 1;
  margin-left: 60rpx;
  height: 100rpx;
  border-radius: 30rpx;
  background: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: bold;
}
.info__btn.is-disabled {
  opacity: 0.5;
}
</style>
