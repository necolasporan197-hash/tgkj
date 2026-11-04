<template>
  <!-- activity_new_launch.xml：满屏 ImageView(bg_login_qdy, scaleType=centerCrop)，content 层默认 gone -->
  <view class="launch">
    <image class="launch__bg" src="/static/official/bg_login_qdy.png" mode="aspectFill" />
  </view>
</template>

<script>
import { userStore } from '@/store/user'

export default {
  onLoad() {
    userStore.restore()
    userStore.loadAppConfig()
    setTimeout(() => {
      if (userStore.token) {
        userStore.fetchUnread()
        uni.reLaunch({ url: '/pages/main/main' })
      } else {
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }, 800)
  }
}
</script>

<style lang="scss" scoped>
.launch {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #ff731c;
  overflow: hidden;
}
.launch__bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
}
</style>
