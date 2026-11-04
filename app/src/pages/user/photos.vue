<template>
  <view class="page">
    <TgNavBar title="我的相册" right-text="上传" @right="addPhotos" />
    <scroll-view scroll-y class="scroll">
      <view v-if="loading" class="loading"><text class="loading__text">加载中…</text></view>

      <template v-else-if="!photos.length">
        <TgEmpty text="还没有上传照片" btn-text="上传照片" @action="addPhotos" />
      </template>

      <view v-else class="wrap">
        <view class="grid">
          <view class="grid__item grid__item--add" @tap="addPhotos">
            <image class="grid__add" src="/static/official/icon_add.png" />
            <text class="grid__add-text">上传</text>
          </view>
          <view v-for="(p, i) in photos" :key="p.id" class="grid__item" @tap="preview(i)">
            <image class="grid__img" :src="urlOf(p.url)" mode="aspectFill" />
            <view v-if="p.audit_status === 'pending'" class="grid__badge"><text class="grid__badge-text">审核中</text></view>
            <view class="grid__del" @tap.stop="removeItem(p)">
              <image class="grid__del-icon" src="/static/official/photo_close.png" />
            </view>
          </view>
        </view>
        <text class="tip">照片需经平台审核通过后展示，最多可上传 9 张/次</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { userApi } from '@/api'
import { userStore } from '@/store/user'
import { mediaUrl, uploadFile } from '@/api/request'
import { toast, loading, hideLoading, confirm, previewImage, chooseImage } from '@/utils/ui'

export default {
  data() {
    return {
      store: userStore,
      photos: [],
      loading: true,
      uploading: false
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
    urlOf(u) {
      return mediaUrl(u)
    },
    async load() {
      this.loading = true
      try {
        this.photos = (await userApi.photos()) || []
      } catch (e) {
        this.photos = []
      } finally {
        this.loading = false
      }
    },
    async addPhotos() {
      if (this.uploading) return
      const paths = await chooseImage(9)
      if (!paths.length) return
      this.uploading = true
      loading('上传中…')
      let ok = 0
      try {
        for (const p of paths) {
          const res = await uploadFile(p, 'image')
          const url = res && res.url ? res.url : res
          await userApi.addPhoto({ url, mediaType: 'image' })
          ok++
        }
      } catch (e) {
        /* 已提示 */
      } finally {
        hideLoading()
        this.uploading = false
      }
      if (ok) toast(`已上传 ${ok} 张，等待审核`)
      this.load()
    },
    preview(i) {
      const urls = this.photos.map((p) => this.urlOf(p.url))
      previewImage(urls, urls[i])
    },
    async removeItem(p) {
      const yes = await confirm('确定删除这张照片吗？')
      if (!yes) return
      try {
        await userApi.removePhoto(p.id)
        this.photos = this.photos.filter((it) => it.id !== p.id)
        toast('已删除')
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
.wrap {
  padding: 24rpx 24rpx 40rpx;
}
.grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.grid__item {
  position: relative;
  width: 219rpx;
  height: 219rpx;
  margin: 0 16rpx 16rpx 0;
  border-radius: 20rpx;
  overflow: hidden;
  background: #ffffff;
}
.grid__item:nth-child(3n) {
  margin-right: 0;
}
.grid__img {
  width: 100%;
  height: 100%;
  background: #f0f1f2;
}
.grid__item--add {
  border: 2rpx dashed #d5d7da;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.grid__add {
  width: 56rpx;
  height: 56rpx;
}
.grid__add-text {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $tg-text-tertiary;
}
.grid__badge {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 38rpx;
  background: rgba(37, 37, 37, 0.13);
  display: flex;
  align-items: center;
  justify-content: center;
}
.grid__badge-text {
  font-size: 22rpx;
  color: #ffffff;
}
.grid__del {
  position: absolute;
  top: 0;
  right: 0;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}
.grid__del-icon {
  width: 36rpx;
  height: 36rpx;
}
.tip {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: $tg-text-placeholder;
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
