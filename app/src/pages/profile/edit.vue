<template>
  <view class="page">
    <TgNavBar title="编辑资料" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <block v-else>
        <view v-if="Number(form.gender) === 2" class="notice">
          <text class="notice__text">资料变更需重新审核，审核通过后才会对外展示</text>
        </view>

        <view class="card">
          <view class="row" @tap="pickAvatar">
            <text class="row__k">头像</text>
            <view class="row__v row__v--right">
              <image class="avatar" :src="avatarUrl" mode="aspectFill" />
              <image class="row__arrow" src="/static/official/ic_me_arrow_n.png" />
            </view>
          </view>
          <view class="row">
            <text class="row__k">昵称</text>
            <input class="row__input" :value="form.nickname" maxlength="20" placeholder="请输入昵称" placeholder-class="ph" @input="set('nickname', $event)" />
          </view>
          <!-- 性别：官方 profile_sex_fragment.xml 的 llTop 横向并排（ll_male / ll_female 各 weight=1） -->
          <view class="row row--gender">
            <text class="row__k">性别</text>
            <view class="sexrow">
              <view class="sex" @tap="form.gender = 1">
                <image
                  class="sex__img"
                  :src="Number(form.gender) === 1 ? '/static/official/login_male_xz.png' : '/static/official/login_male.png'"
                  mode="aspectFit"
                />
                <text class="sex__text">男</text>
                <image
                  class="sex__check"
                  :src="Number(form.gender) === 1 ? '/static/official/register_xb_xz.png' : '/static/official/register_xb_wxz.png'"
                />
              </view>
              <view class="sex" @tap="form.gender = 2">
                <image
                  class="sex__img"
                  :src="Number(form.gender) === 2 ? '/static/official/login_female_xz.png' : '/static/official/login_female.png'"
                  mode="aspectFit"
                />
                <text class="sex__text">女</text>
                <image
                  class="sex__check"
                  :src="Number(form.gender) === 2 ? '/static/official/register_xb_xz.png' : '/static/official/register_xb_wxz.png'"
                />
              </view>
            </view>
          </view>
          <picker mode="date" :value="form.birthday" :end="today" @change="onBirthday">
            <view class="row">
              <text class="row__k">生日</text>
              <view class="row__v row__v--right">
                <text class="row__text" :class="{ 'is-ph': !form.birthday }">{{ form.birthday || '请选择生日' }}</text>
                <image class="row__arrow" src="/static/official/ic_me_arrow_n.png" />
              </view>
            </view>
          </picker>
          <view class="row" @tap="pickCity">
            <text class="row__k">城市</text>
            <view class="row__v row__v--right">
              <text class="row__text" :class="{ 'is-ph': !form.city }">{{ form.city || '请选择城市' }}</text>
              <image class="row__arrow" src="/static/official/ic_me_arrow_n.png" />
            </view>
          </view>
          <view class="row">
            <text class="row__k">职业</text>
            <input class="row__input" :value="form.occupation" maxlength="20" placeholder="请输入职业" placeholder-class="ph" @input="set('occupation', $event)" />
          </view>
          <view class="row">
            <text class="row__k">身高</text>
            <input class="row__input" type="number" :value="form.height" placeholder="cm" placeholder-class="ph" @input="set('height', $event)" />
          </view>
          <view class="row">
            <text class="row__k">体重</text>
            <input class="row__input" type="number" :value="form.weight" placeholder="kg" placeholder-class="ph" @input="set('weight', $event)" />
          </view>
          <view class="row">
            <text class="row__k">微信号</text>
            <input class="row__input" :value="form.wechat" maxlength="30" placeholder="请输入微信号" placeholder-class="ph" @input="set('wechat', $event)" />
          </view>
        </view>

        <view class="card">
          <text class="card__title">个性标签</text>
          <textarea class="ta" :value="tagsText" maxlength="60" placeholder="用逗号分隔，如：颜值高,温柔体贴" placeholder-class="ph" @input="onTags" />
        </view>

        <view class="card">
          <text class="card__title">个人简介</text>
          <textarea class="ta" :value="form.bio" maxlength="200" placeholder="介绍一下自己吧…" placeholder-class="ph" @input="set('bio', $event)" />
        </view>

        <view class="safe" />
      </block>
    </scroll-view>

    <view class="footbar">
      <view class="footbar__btn" :class="{ 'is-disabled': saving }" @tap="save">保存</view>
    </view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, nav, back, loading, hideLoading, chooseImage } from '@/utils/ui'
import { pad } from '@/utils/format'

export default {
  data() {
    const d = new Date()
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    return {
      store: userStore,
      loading: true,
      saving: false,
      pickingCity: false,
      avatarLocal: '',
      tagsText: '',
      today,
      form: {
        nickname: '',
        avatar: '',
        gender: 0,
        birthday: '',
        city: '',
        occupation: '',
        bio: '',
        height: '',
        weight: '',
        wechat: '',
        tags: []
      }
    }
  },
  computed: {
    avatarUrl() {
      if (this.avatarLocal) return this.avatarLocal
      if (this.form.avatar) return mediaUrl(this.form.avatar)
      return this.store.avatar
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.load()
  },
  onShow() {
    if (this.pickingCity) {
      this.pickingCity = false
      this.form.city = this.store.city
    }
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const p = (await userApi.me()) || {}
        this.form = {
          nickname: p.nickname || '',
          avatar: p.avatar || '',
          gender: Number(p.gender) || 0,
          birthday: p.birthday || '',
          city: p.city || '',
          occupation: p.occupation || '',
          bio: p.bio || '',
          height: p.height || '',
          weight: p.weight || '',
          wechat: p.wechat || '',
          tags: Array.isArray(p.tags) ? p.tags : []
        }
        this.tagsText = this.form.tags.join('，')
      } catch (e) {
        /* 已提示 */
      } finally {
        this.loading = false
      }
    },
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
    async pickAvatar() {
      const paths = await chooseImage(1)
      if (!paths.length) return
      const path = paths[0]
      loading('上传中…')
      try {
        const res = await uploadFile(path, 'image')
        this.form.avatar = res && res.url ? res.url : res
        this.avatarLocal = path
        toast('头像已更新')
      } catch (e) {
        /* 已提示 */
      } finally {
        hideLoading()
      }
    },
    async save() {
      if (this.saving) return
      if (!String(this.form.nickname || '').trim()) {
        toast('请填写昵称')
        return
      }
      const tags = this.tagsText
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8)
      const payload = {
        nickname: this.form.nickname.trim(),
        avatar: this.form.avatar,
        gender: Number(this.form.gender) || 0,
        birthday: this.form.birthday,
        city: this.form.city,
        occupation: this.form.occupation,
        bio: this.form.bio,
        wechat: this.form.wechat,
        tags
      }
      if (this.form.height !== '' && this.form.height != null) payload.height = Number(this.form.height)
      if (this.form.weight !== '' && this.form.weight != null) payload.weight = Number(this.form.weight)
      this.saving = true
      try {
        await userApi.updateMe(payload)
        try {
          await this.store.fetchProfile()
        } catch (e) {
          /* 忽略 */
        }
        toast('保存成功')
        setTimeout(() => back(), 600)
      } catch (e) {
        /* 已提示 */
      } finally {
        this.saving = false
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
  background: #f9f9f9;
}
.scroll {
  flex: 1;
  height: 0;
}
.safe {
  height: 40rpx;
}

/* 对齐 profile_*_basic_fragment.xml：13sp #b9b9b9 提示行 */
.notice {
  margin: 48rpx 30rpx 0;
  padding: 0;
  background: transparent;
}
.notice__text {
  font-size: 26rpx;
  color: #b9b9b9;
}

/* 对齐 ShapeLinearLayout：圆角 10dip(20rpx)，左右 margin 8dip(16rpx) */
.card {
  margin: 20rpx 16rpx 0;
  padding: 0 30rpx;
  border-radius: 20rpx;
  background: #ffffff;
}
/* 小节标题 16sp bold #181716 */
.card__title {
  display: block;
  padding: 30rpx 0 4rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #181716;
}
.row {
  min-height: 108rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2rpx solid #f0f0f0;
}
.row:last-child {
  border-bottom: none;
}
/* 项目名 14sp #30302f */
.row__k {
  width: 150rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #30302f;
}
/* 输入内容 13sp #828282 右对齐 */
.row__input {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  color: #828282;
}
.row__v--right {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
}
.row__text {
  font-size: 26rpx;
  color: #828282;
}
.row__text.is-ph {
  color: #828282;
}
.row__arrow {
  width: 24rpx;
  height: 24rpx;
  margin-left: 12rpx;
}
/* 头像预览 33dip(66rpx) */
.avatar {
  width: 66rpx;
  height: 66rpx;
  border-radius: 8rpx;
  background: #f0f1f2;
}
/* 性别：官方 profile_sex_fragment.xml 的 llTop，横向并排、各 weight=1、列内竖直堆叠 */
.row--gender {
  padding: 24rpx 0;
}
.sexrow {
  flex: 1;
  display: flex;
  flex-direction: row;
}
.sex {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* 插画：官方 male_view / female_view 72dip x 47dip = 144rpx x 94rpx */
.sex__img {
  width: 144rpx;
  height: 94rpx;
}
/* 官方 male_textview：17sp=34rpx #212121，marginTop 18dip=36rpx */
.sex__text {
  margin-top: 36rpx;
  font-size: 34rpx;
  color: #212121;
}
/* 官方 cb_male / cb_female：marginTop 26dip=52rpx */
.sex__check {
  margin-top: 52rpx;
  width: 44rpx;
  height: 44rpx;
}
.ta {
  width: 100%;
  height: 160rpx;
  margin: 16rpx 0 24rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f5f6f8;
  font-size: 28rpx;
  color: $tg-text-primary;
}
.ph {
  color: $tg-text-placeholder;
  font-size: 28rpx;
}
.footbar {
  padding: 16rpx 30rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 2rpx solid #f0f0f0;
}
/* 对齐 next_button.xml + button_ff8800：实心 #ff731c，圆角 15dip(30rpx)，16sp 加粗白字 */
.footbar__btn {
  height: 88rpx;
  border-radius: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
  background: #ff731c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.footbar__btn.is-disabled {
  opacity: 0.5;
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
