/**
 * 全局用户态（轻量 reactive store，无额外依赖）
 */
import { reactive } from 'vue'
import { authApi, userApi, configApi, messageApi } from '../api'
import { setToken, clearToken, getToken, mediaUrl } from '../api/request'

const PROFILE_KEY = 'tggy_profile'
const LOC_KEY = 'tggy_location'
const CITY_KEY = 'tggy_city'

export const userStore = reactive({
  token: '',
  profile: null,
  appConfig: null,
  city: uni.getStorageSync(CITY_KEY) || '长沙',
  location: uni.getStorageSync(LOC_KEY) || null,
  unread: { chat: 0, system: 0, total: 0 },

  get isLogin() {
    return !!this.token
  },
  get isVip() {
    return !!this.profile?.isVip
  },
  get gender() {
    return this.profile?.gender || 0
  },
  get uid() {
    return this.profile?.id || 0
  },
  get coins() {
    return this.profile?.coins || 0
  },
  get balance() {
    return this.profile?.balance || 0
  },
  get auditStatus() {
    return this.profile?.auditStatus || ''
  },
  get avatar() {
    return mediaUrl(this.profile?.avatar) || '/static/official/bg_avatar_woman.png'
  },
  /** 女性且未通过审核时不可被推荐 */
  get needAudit() {
    return this.profile?.gender === 2 && this.profile?.auditStatus === 'pending'
  },

  restore() {
    this.token = getToken()
    try {
      const p = uni.getStorageSync(PROFILE_KEY)
      if (p) this.profile = typeof p === 'string' ? JSON.parse(p) : p
    } catch (e) {
      this.profile = null
    }
    this.location = uni.getStorageSync(LOC_KEY) || null
  },

  setSession(token, profile) {
    this.token = token || ''
    setToken(token)
    if (profile) {
      this.profile = profile
      uni.setStorageSync(PROFILE_KEY, JSON.stringify(profile))
    }
  },

  async loadAppConfig() {
    try {
      this.appConfig = await configApi.app()
    } catch (e) {
      /* 静默：配置拉取失败不阻塞启动 */
    }
    return this.appConfig
  },

  async login(data) {
    const res = await authApi.login(data)
    this.setSession(res.token, res.user)
    return res
  },

  async loginBySms(data) {
    const res = await authApi.loginBySms(data)
    this.setSession(res.token, res.user)
    return res
  },

  async fetchProfile() {
    if (!this.token) return null
    const p = await userApi.me()
    this.profile = { ...p }
    uni.setStorageSync(PROFILE_KEY, JSON.stringify(p))
    return p
  },

  async fetchUnread() {
    if (!this.token) return
    try {
      this.unread = await messageApi.unread()
    } catch (e) {
      /* 忽略 */
    }
  },

  setCity(city) {
    this.city = city
    uni.setStorageSync(CITY_KEY, city)
  },

  setLocation(loc) {
    this.location = loc
    uni.setStorageSync(LOC_KEY, loc)
  },

  async logout() {
    try {
      await authApi.logout()
    } catch (e) {
      /* 忽略 */
    }
    this.token = ''
    this.profile = null
    this.unread = { chat: 0, system: 0, total: 0 }
    clearToken()
    uni.removeStorageSync(PROFILE_KEY)
    uni.reLaunch({ url: '/pages/login/login' })
  }
})

export default userStore
