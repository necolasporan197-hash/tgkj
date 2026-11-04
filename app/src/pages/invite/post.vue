<template>
  <view class="page">
    <TgNavBar title="发布邀约" />

    <scroll-view scroll-y class="scroll">
      <!-- 活动主题 -->
      <text class="sec sec--topic">活动主题</text>
      <view class="sitem" @tap="pickTheme">
        <text class="sitem__title" :class="{ 'is-ph': !form.theme }">{{ form.theme || '请选择活动主题' }}</text>
        <image class="sitem__arrow" src="/static/official/login_arrow_right.png" />
      </view>

      <!-- 标签 -->
      <text class="sec sec--tags">标签</text>
      <view class="sitem" @tap="tagVisible = true">
        <text class="sitem__title" :class="{ 'is-ph': !form.tags.length }">
          {{ form.tags.length ? form.tags.join('、') : '请选择标签，使用标签更受异性的喜爱～' }}
        </text>
        <text class="sitem__right">{{ form.tags.length }}/3</text>
        <image class="sitem__arrow" src="/static/official/login_arrow_right.png" />
      </view>

      <!-- 城市 -->
      <view class="sitem" @tap="pickCity">
        <text class="sitem__title">城市</text>
        <text class="sitem__right">{{ form.city || '选择城市' }}</text>
        <image class="sitem__arrow" src="/static/official/login_arrow_right.png" />
      </view>

      <!-- 日期 -->
      <picker mode="date" :value="form.eventDate" @change="onDate">
        <view class="sitem">
          <text class="sitem__title">日期</text>
          <text class="sitem__right">{{ form.eventDate || '选择日期' }}</text>
          <image class="sitem__arrow" src="/static/official/login_arrow_right.png" />
        </view>
      </picker>

      <!-- 内容补充 -->
      <view class="secrow">
        <text class="sec sec--inline">内容补充</text>
        <text class="sec__tip">（补充内容需审核通过后才能显示）</text>
      </view>
      <view class="edit">
        <textarea
          v-model="form.content"
          class="edit__ta"
          placeholder="请勿发布低俗、色情交易、或曝光他人隐私的内容~"
          placeholder-class="edit__ph"
          :maxlength="100"
        />
        <text class="edit__num">({{ form.content.length }}/100)</text>
      </view>

      <!-- 上传图片 -->
      <text class="sec sec--upload">上传图片</text>
      <view class="imgs">
        <view v-for="(img, i) in form.images" :key="i" class="imgs__cell">
          <image class="imgs__img" :src="mediaUrl(img)" mode="aspectFill" />
          <image class="imgs__del" src="/static/official/icons_close.png" @tap.stop="removeImage(i)" />
        </view>
        <view v-if="form.images.length < 9" class="imgs__add" @tap="addImage">
          <image class="imgs__add-icon" src="/static/official/my_photos_upload.png" />
        </view>
      </view>
      <view class="tip">
        <image class="tip__icon" src="/static/official/ic_register_xh_n.png" />
        <text class="tip__text">请勿上传裸露低俗的照片</text>
      </view>

      <!-- 报名 -->
      <view class="enroll">
        <text class="enroll__label">报名</text>
        <image
          class="enroll__check"
          :src="form.enrollRequired ? '/static/official/ic_me_on_n.png' : '/static/official/ic_me_off_n.png'"
          @tap="form.enrollRequired = !form.enrollRequired"
        />
      </view>

      <!-- 确定发布（NextButton 315×48dip 圆角 15dip） -->
      <view class="submit" :class="{ 'is-on': canSubmit }" @tap="submit">确定发布</view>
      <view class="pad" />
    </scroll-view>

    <!-- 标签选择弹窗 -->
    <view v-if="tagVisible" class="mask" @tap="tagVisible = false">
      <view class="sheet" @tap.stop>
        <text class="sheet__title">选择标签（最多 3 个）</text>
        <view class="sheet__tags">
          <view
            v-for="t in allTags"
            :key="t"
            class="sheet__tag"
            :class="{ 'is-on': form.tags.includes(t) }"
            @tap="toggleTag(t)"
          >
            {{ t }}
          </view>
        </view>
        <view class="sheet__ok" @tap="tagVisible = false">确定</view>
      </view>
    </view>
  </view>
</template>

<script>
import { inviteEventApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, loading, hideLoading, back, chooseImage } from '@/utils/ui'

const CITIES = ['北京', '上海', '广州', '深圳', '长沙', '成都', '杭州', '重庆', '武汉', '西安', '南京', '苏州']
const TAGS = ['健身', '旅行', '美食', '摄影', '音乐', '电影', '读书', '萌宠', '滑雪', '露营', '探店', '桌游']

export default {
  data() {
    return {
      store: userStore,
      themes: [],
      allTags: TAGS,
      tagVisible: false,
      submitting: false,
      form: {
        theme: '',
        tags: [],
        city: '',
        eventDate: '',
        content: '',
        images: [],
        enrollRequired: true
      }
    }
  },
  computed: {
    canSubmit() {
      return !!this.form.theme && !!this.form.content.trim()
    }
  },
  onLoad() {
    if (!this.store.token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.form.city = this.store.city
    this.loadRules()
  },
  methods: {
    mediaUrl,
    async loadRules() {
      try {
        const r = (await inviteEventApi.rules()) || {}
        this.themes = r.themes || []
      } catch (e) {
        this.themes = []
      }
    },
    pickTheme() {
      if (!this.themes.length) {
        toast('主题加载中，请稍后重试')
        return
      }
      uni.showActionSheet({
        itemList: this.themes,
        success: (r) => {
          this.form.theme = this.themes[r.tapIndex]
        }
      })
    },
    pickCity() {
      uni.showActionSheet({
        itemList: CITIES,
        success: (r) => {
          this.form.city = CITIES[r.tapIndex]
        }
      })
    },
    onDate(e) {
      this.form.eventDate = e.detail.value
    },
    toggleTag(t) {
      const i = this.form.tags.indexOf(t)
      if (i >= 0) {
        this.form.tags.splice(i, 1)
        return
      }
      if (this.form.tags.length >= 3) {
        toast('最多选择 3 个标签')
        return
      }
      this.form.tags.push(t)
    },
    async addImage() {
      const remain = 9 - this.form.images.length
      if (remain <= 0) return
      const paths = await chooseImage(remain)
      if (!paths.length) return
      loading('上传中')
      try {
        for (const p of paths) {
          const r = await uploadFile(p, 'image')
          if (r && r.url) this.form.images.push(r.url)
        }
      } catch (e) {
        /* 已提示 */
      } finally {
        hideLoading()
      }
    },
    removeImage(i) {
      this.form.images.splice(i, 1)
    },
    async submit() {
      if (this.submitting) return
      if (!this.canSubmit) {
        toast(this.form.theme ? '请填写活动介绍' : '请选择活动主题')
        return
      }
      this.submitting = true
      try {
        await inviteEventApi.create({ ...this.form })
        toast('发布成功，审核通过后展示')
        setTimeout(() => back(), 800)
      } catch (e) {
        /* 已提示 */
      } finally {
        this.submitting = false
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
  background: #ffffff;
}
.scroll {
  flex: 1;
  height: 0;
}
.pad {
  height: 60rpx;
}

/* 段落标题 15sp 加粗 #30302f */
.sec {
  display: block;
  margin-left: 30rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
}
.sec--topic {
  margin-top: 32rpx;
}
.sec--tags {
  margin-top: 34rpx;
}
.sec--upload {
  margin-top: 20rpx;
}
.secrow {
  margin-top: 34rpx;
  margin-left: 30rpx;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
}
.sec--inline {
  margin-left: 0;
}
.sec__tip {
  font-size: 26rpx;
  color: #ff5555;
}

/* SimpleItemView 行 */
.sitem {
  height: 100rpx;
  padding: 0 6rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
}
.sitem__title {
  flex: 1;
  font-size: 30rpx;
  color: #181716;
}
.sitem__title.is-ph {
  color: #cecece;
}
.sitem__right {
  font-size: 28rpx;
  color: #828282;
  margin-right: 12rpx;
}
.sitem__arrow {
  width: 24rpx;
  height: 24rpx;
}

/* 内容补充输入框（edit_post_custom：#f9f9f9 圆角 6dip） */
.edit {
  position: relative;
  height: 200rpx;
  margin: 20rpx 30rpx 0;
  padding: 12rpx;
  box-sizing: border-box;
  border-radius: 12rpx;
  background: #f9f9f9;
}
.edit__ta {
  width: 100%;
  height: 150rpx;
  font-size: 28rpx;
  color: #61605f;
  line-height: 40rpx;
}
.edit__ph {
  color: #b9b9b9;
}
.edit__num {
  position: absolute;
  right: 24rpx;
  bottom: 10rpx;
  font-size: 28rpx;
  color: #b9b9b9;
}

/* 上传图片 */
.imgs {
  margin-top: 20rpx;
  padding: 0 20rpx 0 24rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.imgs__cell {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin: 0 12rpx 12rpx 0;
}
.imgs__img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: $tg-bg-gray;
}
.imgs__del {
  position: absolute;
  top: -10rpx;
  right: 2rpx;
  width: 40rpx;
  height: 40rpx;
}
.imgs__add {
  width: 200rpx;
  height: 200rpx;
  margin: 0 12rpx 12rpx 0;
  border-radius: 12rpx;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.imgs__add-icon {
  width: 60rpx;
  height: 60rpx;
}
.tip {
  margin: 30rpx 30rpx 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.tip__icon {
  width: 20rpx;
  height: 20rpx;
  margin-right: 20rpx;
}
.tip__text {
  font-size: 26rpx;
  color: #b9b9b9;
}

/* 报名 */
.enroll {
  height: 100rpx;
  margin: 50rpx 30rpx 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.enroll__label {
  font-size: 30rpx;
  font-weight: bold;
  color: #30302f;
}
.enroll__check {
  width: 60rpx;
  height: 60rpx;
}

/* 确定发布 NextButton */
.submit {
  width: 630rpx;
  height: 96rpx;
  margin: 48rpx auto 60rpx;
  border-radius: 30rpx;
  background: #ffcdb6;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.submit.is-on {
  background: #ff731c;
}

/* 标签弹窗 */
.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  padding: 40rpx 30rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  border-radius: 32rpx 32rpx 0 0;
  background: #ffffff;
}
.sheet__title {
  font-size: 32rpx;
  font-weight: bold;
  color: #30302f;
}
.sheet__tags {
  margin-top: 30rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.sheet__tag {
  margin: 0 20rpx 20rpx 0;
  padding: 14rpx 32rpx;
  border-radius: 32rpx;
  background: #f5f6f8;
  font-size: 28rpx;
  color: #61605f;
}
.sheet__tag.is-on {
  background: rgba(255, 115, 28, 0.12);
  color: #ff731c;
  font-weight: bold;
}
.sheet__ok {
  margin-top: 20rpx;
  height: 96rpx;
  border-radius: 30rpx;
  background: #ff731c;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
