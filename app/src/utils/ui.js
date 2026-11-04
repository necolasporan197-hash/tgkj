/** 交互与导航辅助 */

export function toast(title, icon = 'none') {
  uni.showToast({ title: title || '', icon, duration: 1800 })
}

export function loading(title = '加载中') {
  uni.showLoading({ title, mask: true })
}

export function hideLoading() {
  uni.hideLoading()
}

export function confirm(content, title = '提示') {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (r) => resolve(!!r.confirm),
      fail: () => resolve(false)
    })
  })
}

export function nav(url) {
  uni.navigateTo({ url })
}

export function back(delta = 1) {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack({ delta })
  else uni.reLaunch({ url: '/pages/main/main' })
}

export function relaunch(url) {
  uni.reLaunch({ url })
}

export function switchTab(tab) {
  uni.reLaunch({ url: `/pages/main/main?tab=${tab}` })
}

/** 是否已登录，未登录则跳登录页并返回 false */
export function requireLogin() {
  const token = uni.getStorageSync('tggy_token')
  if (!token) {
    uni.reLaunch({ url: '/pages/login/login' })
    return false
  }
  return true
}

/** 读取剪贴板 */
export function copy(text) {
  return new Promise((resolve) => {
    uni.setClipboardData({
      data: String(text || ''),
      success: () => {
        toast('已复制')
        resolve(true)
      },
      fail: () => resolve(false)
    })
  })
}

/** 传入图片/视频列表预览 */
export function previewImage(urls, current) {
  uni.previewImage({ urls, current })
}

/**
 * 获取定位（失败时静默返回城市中心的默认坐标）
 */
export function getLocation() {
  return new Promise((resolve) => {
    uni.getLocation({
      type: 'gcj02',
      success: (r) => resolve({ lat: r.latitude, lng: r.longitude }),
      fail: () => resolve(null)
    })
  })
}

/** 选择图片（H5/App 通用），返回本地路径数组 */
export function chooseImage(count = 1) {
  return new Promise((resolve) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (r) => resolve(r.tempFilePaths || []),
      fail: () => resolve([])
    })
  })
}
