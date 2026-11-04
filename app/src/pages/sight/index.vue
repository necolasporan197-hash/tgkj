<template>
  <view class="page">
    <TgNavBar title="我的视频" bg-color="#ffffff" />

    <!-- 提示行（my_videos_fragment.xml：10dip 图标 + 13sp #b9b9b9） -->
    <view class="hint" @tap="onUpload">
      <image class="hint__icon" src="/static/official/ic_register_xh_n.png" mode="aspectFit" />
      <text class="hint__text">点击上传新视频，长度为3-15秒。涉及违规、敏感内容将被删除哦~</text>
    </view>

    <!-- 视频网格（my_videos_female_item.xml） -->
    <scroll-view scroll-y class="grid-scroll">
      <view class="grid">
        <view v-for="v in list" :key="v.id" class="card">
          <view class="card__inner">
            <image class="card__cover" :src="cover(v)" mode="aspectFill" />
            <view v-if="statusText(v)" class="card__desc">{{ statusText(v) }}</view>
            <image
              class="card__play"
              src="/static/official/url_viewer_video.png"
              mode="aspectFit"
              @tap="preview(v)"
            />
          </view>
          <image
            class="card__del"
            src="/static/official/ic_xgzl_close_n.png"
            mode="aspectFit"
            @tap.stop="onDelete(v)"
          />
        </view>
      </view>

      <TgEmpty v-if="!list.length && loaded" text="还没有上传视频" />
    </scroll-view>
  </view>
</template>

<script>
import { sightApi } from '@/api'
import { mediaUrl, uploadFile } from '@/api/request'
import { userStore } from '@/store/user'
import { toast, confirm, loading, hideLoading, relaunch } from '@/utils/ui'

/** 审核状态 → 底部色条文案（my_videos_female_item.xml 默认「审核中」） */
const STATUS_TEXT = { pending: '审核中', rejected: '未通过', approved: '' }

export default {
  data() {
    return {
      list: [],
      loaded: false,
      uploading: false
    }
  },
  onLoad() {
    if (!userStore.token) return relaunch('/pages/login/login')
    this.loadList()
  },
  onShow() {
    if (userStore.token) this.loadList()
  },
  methods: {
    async loadList() {
      try {
        const res = await sightApi.list({ pageSize: 60 })
        this.list = (res && res.list) || []
      } catch (e) {
        this.list = []
      } finally {
        this.loaded = true
      }
    },
    cover(v) {
      return mediaUrl(v.cover || v.url)
    },
    statusText(v) {
      return STATUS_TEXT[v.audit_status] ?? '审核中'
    },
    preview(v) {
      const url = mediaUrl(v.url)
      if (url) uni.previewImage({ urls: [url] })
    },
    onUpload() {
      if (this.uploading) return
      uni.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 15,
        success: (r) => this.upload(r.tempFilePath, r.duration),
        fail: () => {}
      })
    },
    async upload(path, duration) {
      this.uploading = true
      loading('上传中…')
      try {
        const up = await uploadFile(path, 'video')
        await sightApi.add({ url: up && up.url ? up.url : up, duration: Math.round(duration || 0) })
        toast('已提交，审核后展示')
        this.loadList()
      } catch (e) {
        /* 请求层已提示 */
      } finally {
        this.uploading = false
        hideLoading()
      }
    },
    async onDelete(v) {
      const ok = await confirm('确定删除该视频吗？', '删除视频')
      if (!ok) return
      try {
        await sightApi.remove(v.id)
        toast('已删除')
        this.list = this.list.filter((it) => it.id !== v.id)
      } catch (e) {
        /* 请求层已提示 */
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* my_videos_fragment.xml：根布局白底纵向 */
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

/* 提示行：marginLeft 15dip / marginTop 15dip / marginBottom 12dip */
.hint {
  display: flex;
  flex-direction: row;
  padding: 30rpx 30rpx 24rpx;
  flex-shrink: 0;
}
.hint__icon {
  width: 20rpx;
  height: 20rpx;
  margin-top: 6rpx;
  flex-shrink: 0;
}
.hint__text {
  flex: 1;
  margin-left: 20rpx;
  font-size: 26rpx;
  line-height: 38rpx;
  color: #b9b9b9;
}

/* ===== 网格 ===== */
.grid-scroll {
  flex: 1;
  height: 0;
}
.grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 0 20rpx;
}
/* my_videos_female_item.xml：cardCornerRadius 10dip，marginTop/Right 5dip */
.card {
  position: relative;
  width: 33.333%;
  padding: 10rpx 10rpx 0 0;
  box-sizing: border-box;
}
.card__inner {
  position: relative;
  width: 100%;
  height: 400rpx;
  border-radius: 20rpx;
  overflow: hidden;
  background-color: #f2f2f2;
}
.card__cover {
  width: 100%;
  height: 100%;
}
/* desc：高 39dip，底色 #f2ab3f，15sp 白字居中 */
.card__desc {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 78rpx;
  line-height: 78rpx;
  text-align: center;
  font-size: 30rpx;
  color: #ffffff;
  background-color: #f2ab3f;
}
.card__play {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 88rpx;
  height: 88rpx;
  transform: translate(-50%, -50%);
}
/* delete_view：22dip，右上角 */
.card__del {
  position: absolute;
  right: 20rpx;
  top: 20rpx;
  width: 44rpx;
  height: 44rpx;
}
</style>
