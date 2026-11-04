/**
 * 糖果空间 App —— 接口定义（与 backend/src/modules 一一对应）
 * Base Path: /api
 */
import { get, post, put, del } from './request'

/** 认证：验证码 / 短信 / 注册 / 登录 / 令牌 / 密码 */
export const authApi = {
  captcha: () => get('/auth/captcha'),
  sendSms: (data) => post('/auth/sms/send', data),
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  loginBySms: (data) => post('/auth/login/sms', data),
  logout: () => post('/auth/logout'),
  changePassword: (data) => post('/auth/password', data)
}

/** 用户：资料 / 推荐 / 附近 / 详情 / 关注 / 访客 / 黑名单 / 相册 / 解锁 */
export const userApi = {
  me: () => get('/users/me'),
  updateMe: (data) => put('/users/me', data),
  recommend: (params) => get('/users/recommend', params),
  nearby: (params) => get('/users/nearby', params),
  detail: (id) => get(`/users/${id}`),
  follows: () => get('/users/follows'),
  follow: (id) => post(`/users/follow/${id}`),
  unfollow: (id) => del(`/users/follow/${id}`),
  visitors: () => get('/users/visitors'),
  likers: () => get('/users/likers'),
  blacklist: () => get('/users/blacklist'),
  addBlack: (id) => post(`/users/blacklist/${id}`),
  removeBlack: (id) => del(`/users/blacklist/${id}`),
  photos: () => get('/users/photos'),
  addPhoto: (data) => post('/users/photos', data),
  removePhoto: (id) => del(`/users/photos/${id}`),
  unlock: (data) => post('/users/unlock', data),
  unlockRecords: () => get('/users/unlock-records'),
  myImpressions: () => get('/users/me/impressions')
}

/** 首页/发现：Tab / Banner / 话题 / 推荐流 */
export const discoverApi = {
  tabs: () => get('/discover/tabs'),
  banners: (position = 'home') => get('/discover/banners', { position }),
  topics: () => get('/discover/topics'),
  feed: (params) => get('/discover/feed', params)
}

/** 动态 */
export const momentApi = {
  list: (params) => get('/moments', params),
  mine: (params) => get('/moments/mine', params),
  detail: (id) => get(`/moments/${id}`),
  publish: (data) => post('/moments', data),
  remove: (id) => del(`/moments/${id}`),
  like: (id) => post(`/moments/${id}/like`),
  comment: (id, data) => post(`/moments/${id}/comment`, data),
  removeComment: (cid) => del(`/moments/comment/${cid}`)
}

/** 消息 */
export const messageApi = {
  conversations: () => get('/messages/conversations'),
  unread: () => get('/messages/unread'),
  notifications: (params) => get('/messages/notifications', params),
  readNotifications: (id) => post('/messages/notifications/read', id ? { id } : {}),
  chat: (peerId, params) => get(`/messages/chat/${peerId}`, params),
  send: (data) => post('/messages/send', data),
  removeConversation: (id) => del(`/messages/conversations/${id}`)
}

/** 钱包 */
export const walletApi = {
  overview: () => get('/wallet'),
  transactions: (params) => get('/wallet/transactions', params),
  recharge: (data) => post('/wallet/recharge', data),
  withdraw: (data) => post('/wallet/withdraw', data),
  withdrawals: (params) => get('/wallet/withdrawals', params),
  exchange: (coins) => post('/wallet/exchange', { coins }),
  coinPackages: () => get('/wallet/coin-packages'),
  coinPurchase: (data) => post('/wallet/coin-purchase', data)
}

/** VIP */
export const vipApi = {
  packages: () => get('/vip/packages'),
  privileges: () => get('/vip/privileges'),
  status: () => get('/vip/status'),
  purchase: (data) => post('/vip/purchase', data),
  orders: () => get('/vip/orders')
}

/** 认证中心 */
export const verificationApi = {
  types: () => get('/verification/types'),
  status: () => get('/verification/status'),
  submit: (data) => post('/verification/submit', data),
  records: () => get('/verification/records')
}

/** 邀请 */
export const inviteApi = {
  info: () => get('/invite'),
  records: (params) => get('/invite/records', params),
  ranking: () => get('/invite/ranking'),
  check: (code) => get('/invite/check', { code })
}

/** 邀约活动（InviteEvent 发布/列表/详情/报名，对齐 invite_post_fragment.xml / item_invite.xml / invite_detail_fragment2.xml） */
export const inviteEventApi = {
  rules: () => get('/invite-events/rules'),
  list: (params) => get('/invite-events', params),
  mine: (params) => get('/invite-events/mine', params),
  detail: (id) => get(`/invite-events/${id}`),
  create: (data) => post('/invite-events', data),
  join: (id) => post(`/invite-events/${id}/join`),
  report: (id, data) => post(`/invite-events/${id}/report`, data)
}

/** 团队 */
export const teamApi = {
  mine: () => get('/team/mine'),
  list: () => get('/team'),
  create: (data) => post('/team', data),
  join: (id) => post(`/team/${id}/join`),
  leave: () => post('/team/leave'),
  updateNotice: (notice) => put('/team/notice', { notice })
}

/** 投稿 */
export const submissionApi = {
  submit: (data) => post('/submission', data),
  mine: (params) => get('/submission/mine', params)
}

/** 礼物 */
export const giftApi = {
  list: () => get('/gift'),
  send: (data) => post('/gift/send', data),
  sent: (params) => get('/gift/sent', params),
  received: (params) => get('/gift/received', params)
}

/** 印象 */
export const impressionApi = {
  tags: () => get('/impression/tags'),
  give: (data) => post('/impression', data),
  received: () => get('/impression/received'),
  ofUser: (userId) => get(`/impression/${userId}`)
}

/** 举报 */
export const reportApi = {
  reasons: () => get('/report/reasons'),
  submit: (data) => post('/report', data)
}

/** 公共配置 */
export const configApi = {
  app: () => get('/config/app'),
  all: () => get('/config/all'),
  agreement: (type = 'user') => get('/config/agreement', { type }),
  service: () => get('/config/service')
}

/** 任务中心（TaskCenterActivity） */
export const taskApi = {
  list: () => get('/task'),
  checkin: () => post('/task/checkin'),
  claim: (code) => post(`/task/${code}/claim`)
}

/** 在线客服（CustomServiceActivity） */
export const serviceApi = {
  info: () => get('/service'),
  session: () => post('/service/session')
}

/** 意见反馈（FeedbackActivity） */
export const feedbackApi = {
  submit: (data) => post('/feedback', data),
  mine: (params) => get('/feedback/mine', params)
}

/** 账号注销（CancellationActivity / CancellationReasonActivity） */
export const cancellationApi = {
  reasons: () => get('/cancellation/reasons'),
  status: () => get('/cancellation/status'),
  submit: (data) => post('/cancellation', data),
  withdraw: () => post('/cancellation/cancel')
}

/** 隐私与权限设置（JurisdictionSettingActivity / JurisdictionMoreActivity） */
export const jurisdictionApi = {
  detail: () => get('/jurisdiction'),
  update: (data) => put('/jurisdiction', data)
}

/** 消息提醒开关（NotifyOpenActivity） */
export const notifyApi = {
  detail: () => get('/notify'),
  update: (data) => put('/notify', data)
}

/** 我的小视频（MySightRecordActivity） */
export const sightApi = {
  list: (params) => get('/sight', params),
  add: (data) => post('/sight', data),
  remove: (id) => del(`/sight/${id}`)
}

/** 青少年模式（YoungModelActivity / YoungModelPwdFragment / YoungModelPhoneFragment） */
export const youngApi = {
  detail: () => get('/young'),
  open: (password) => post('/young/open', { password }),
  close: (password) => post('/young/close', { password }),
  sms: () => post('/young/sms'),
  reset: (data) => post('/young/reset', data)
}
