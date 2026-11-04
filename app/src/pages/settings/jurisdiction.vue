<template>
  <view class="page">
    <TgNavBar :title="step === 0 ? '系统权限管理' : detailTitle" :auto-back="false" @back="onNavBack" />
    <view v-if="step === 0" class="nav-gap" />

    <!-- ===== 系统权限列表（activity_jurisdiction_setting.xml + layout_item_jurisdiction.xml） ===== -->
    <scroll-view v-if="step === 0" scroll-y class="list-scroll">
      <view v-for="it in items" :key="it.key" class="jitem">
        <view class="jitem__row" @tap="openSetting(it)">
          <text class="jitem__title">{{ it.title }}</text>
          <text class="jitem__open">已开启</text>
          <image class="jitem__arrow" src="/static/official/item_view_arrow_gray.webp" mode="aspectFit" />
        </view>
        <view class="jitem__sub" @tap="openRule(it)">
          <text class="jitem__sub-text">{{ it.sub }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- ===== 权限使用规则（activity_jurisdiction_more.xml） ===== -->
    <scroll-view v-else scroll-y class="detail">
      <text class="detail__content">{{ detailText }}</text>
    </scroll-view>
  </view>
</template>

<script>
import { toast, back } from '@/utils/ui'

/**
 * 5 项系统权限 —— 标题取自 activity_jurisdiction_setting.xml 的 app:text；
 * 副标题取自 layout_item_jurisdiction.xml 的「点击查看糖果空间《X访问权限使用规则》」范式。
 */
const ITEMS = [
  {
    key: 'location',
    title: '允许糖果空间访问位置信息',
    sub: '点击查看糖果空间《位置信息访问权限使用规则》',
    rule:
      '为向你推荐附近的用户、展示同城动态以及计算距离，糖果空间会在你使用相关功能时访问你的位置信息。你可以随时在系统设置中关闭该权限，关闭后将无法使用附近的人、同城等功能，但不影响其他功能的使用。我们不会将你的位置信息用于上述目的之外的任何用途。'
  },
  {
    key: 'camera',
    title: '允许糖果空间访问相机权限',
    sub: '点击查看糖果空间《相机访问权限使用规则》',
    rule:
      '当你使用拍摄头像、发布照片或视频等功能时，糖果空间需要访问你的相机权限。你可以随时在系统设置中关闭该权限，关闭后将无法使用拍摄相关功能，但不影响其他功能的使用。你的照片与视频仅用于你主动发起的操作，我们不会在后台擅自调用相机。'
  },
  {
    key: 'device',
    title: '允许糖果空间访问设备信息权限',
    sub: '点击查看糖果空间《设备信息访问权限使用规则》',
    rule:
      '为保障账号安全、识别设备异常以及改进产品体验，糖果空间会读取你的设备型号、操作系统版本、设备标识符等信息。你可以随时在系统设置中关闭该权限，关闭后部分安全校验与体验优化功能可能受限，但不影响基本功能的使用。'
  },
  {
    key: 'storage',
    title: '允许糖果空间访问文件存储权限',
    sub: '点击查看糖果空间《文件存储访问权限使用规则》',
    rule:
      '当你保存图片、从相册上传内容或缓存数据时，糖果空间需要访问你的文件存储权限。你可以随时在系统设置中关闭该权限，关闭后将无法保存图片或从相册上传内容，但不影响其他功能的使用。'
  },
  {
    key: 'mic',
    title: '允许糖果空间访问麦克风',
    sub: '点击查看糖果空间《麦克风访问权限使用规则》',
    rule:
      '当你使用语音消息、语音录制等功能时，糖果空间需要访问你的麦克风权限。你可以随时在系统设置中关闭该权限，关闭后将无法发送语音消息，但不影响文字聊天等其他功能的使用。'
  }
]

export default {
  data() {
    return {
      step: 0,
      items: ITEMS,
      detailTitle: '',
      detailText: ''
    }
  },
  methods: {
    /** 规则步骤返回列表；列表步骤返回上一页 */
    onNavBack() {
      if (this.step === 1) this.step = 0
      else back()
    },
    openSetting() {
      if (typeof uni.openAppAuthorizeSetting === 'function') {
        uni.openAppAuthorizeSetting({
          fail: () => toast('请在系统设置中开启相应权限')
        })
      } else {
        toast('请在系统设置中开启相应权限')
      }
    },
    openRule(it) {
      this.detailTitle = it.title.replace(/^允许糖果空间访问/, '')
      this.detailText = it.rule
      this.step = 1
    }
  }
}
</script>

<style lang="scss" scoped>
/* activity_jurisdiction_setting.xml：根布局底色 #f9f9f9 */
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}
/* TitleBar：marginTop 50dip、marginBottom 10dip、高 50dip */
.nav-gap {
  height: 20rpx;
  flex-shrink: 0;
}
.list-scroll {
  flex: 1;
  height: 0;
}

/* ===== 权限项（layout_item_jurisdiction.xml） ===== */
.jitem__row {
  height: 120rpx;
  padding: 0 30rpx;
  background-color: #ffffff;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.jitem__title {
  flex: 1;
  font-size: 32rpx;
  color: #30302f;
}
.jitem__open {
  padding-right: 12rpx;
  font-size: 26rpx;
  color: #9e9e9e;
}
.jitem__arrow {
  width: 14rpx;
  height: 26rpx;
  flex-shrink: 0;
}
/* subname：42dip 高、底色 #f9f9f9、13sp #b9b9b9 */
.jitem__sub {
  height: 84rpx;
  padding: 0 30rpx;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
}
.jitem__sub-text {
  font-size: 26rpx;
  color: #b9b9b9;
}

/* ===== 规则详情（activity_jurisdiction_more.xml：content 14sp #61605f、padding 15dip） ===== */
.detail {
  flex: 1;
  height: 0;
  background-color: #ffffff;
}
.detail__content {
  display: block;
  padding: 30rpx;
  font-size: 28rpx;
  line-height: 48rpx;
  color: #61605f;
}
</style>
