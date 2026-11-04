/**
 * 管理端 API 定义 —— 与 backend/src/modules/admin/* 一一对应
 */
import http from './request'

const crud = (base) => ({
  list: (params) => http.get(base, { params }),
  detail: (id) => http.get(`${base}/${id}`),
  create: (data) => http.post(base, data),
  update: (id, data) => http.put(`${base}/${id}`, data),
  remove: (id) => http.delete(`${base}/${id}`)
})

export const authApi = {
  login: (data) => http.post('/admin/auth/login', data),
  profile: () => http.get('/admin/auth/profile'),
  changePassword: (data) => http.post('/admin/auth/password', data),
  logout: () => http.post('/admin/auth/logout')
}

export const dashboardApi = {
  stats: () => http.get('/admin/dashboard/stats'),
  trend: (days = 7) => http.get('/admin/dashboard/trend', { params: { days } }),
  recent: () => http.get('/admin/dashboard/recent')
}

export const userApi = {
  ...crud('/admin/users'),
  audit: (id, data) => http.post(`/admin/users/${id}/audit`, data),
  setStatus: (id, status) => http.post(`/admin/users/${id}/status`, { status }),
  resetPassword: (id, password) => http.post(`/admin/users/${id}/reset-password`, { password }),
  adjust: (id, data) => http.post(`/admin/users/${id}/adjust`, data),
  setVip: (id, data) => http.post(`/admin/users/${id}/vip`, data),
  pendingAudit: (params) => http.get('/admin/users/pending-audit', { params }),
  pendingPhotos: (params) => http.get('/admin/users/photos/pending', { params }),
  auditPhotos: (data) => http.post('/admin/users/photos/audit', data),
  cancellations: (params) => http.get('/admin/users/cancellations', { params }),
  reviewCancellation: (id, data) => http.post(`/admin/users/cancellations/${id}/review`, data)
}

export const contentApi = {
  moments: (params) => http.get('/admin/content/moments', { params }),
  auditMoment: (id, action) => http.post(`/admin/content/moments/${id}/audit`, { action }),
  removeMoment: (id) => http.delete(`/admin/content/moments/${id}`),
  comments: (params) => http.get('/admin/content/comments', { params }),
  removeComment: (id) => http.delete(`/admin/content/comments/${id}`),
  submissions: (params) => http.get('/admin/content/submissions', { params }),
  auditSubmission: (id, data) => http.post(`/admin/content/submissions/${id}/audit`, data),
  reports: (params) => http.get('/admin/content/reports', { params }),
  handleReport: (id, data) => http.post(`/admin/content/reports/${id}/handle`, data),
  impressions: () => http.get('/admin/content/impressions'),
  removeImpression: (id) => http.delete(`/admin/content/impressions/${id}`)
}

export const financeApi = {
  withdrawals: (params) => http.get('/admin/finance/withdrawals', { params }),
  reviewWithdrawal: (id, data) => http.post(`/admin/finance/withdrawals/${id}/review`, data),
  transactions: (params) => http.get('/admin/finance/transactions', { params }),
  summary: () => http.get('/admin/finance/summary'),
  vipPackages: () => http.get('/admin/finance/vip/packages'),
  createVipPackage: (data) => http.post('/admin/finance/vip/packages', data),
  updateVipPackage: (id, data) => http.put(`/admin/finance/vip/packages/${id}`, data),
  removeVipPackage: (id) => http.delete(`/admin/finance/vip/packages/${id}`),
  vipOrders: (params) => http.get('/admin/finance/vip/orders', { params }),
  gifts: () => http.get('/admin/finance/gifts'),
  createGift: (data) => http.post('/admin/finance/gifts', data),
  updateGift: (id, data) => http.put(`/admin/finance/gifts/${id}`, data),
  removeGift: (id) => http.delete(`/admin/finance/gifts/${id}`),
  giftRecords: (params) => http.get('/admin/finance/gift-records', { params })
}

export const operationApi = {
  banners: () => http.get('/admin/operations/banners'),
  createBanner: (data) => http.post('/admin/operations/banners', data),
  updateBanner: (id, data) => http.put(`/admin/operations/banners/${id}`, data),
  removeBanner: (id) => http.delete(`/admin/operations/banners/${id}`),
  tabs: () => http.get('/admin/operations/tabs'),
  createTab: (data) => http.post('/admin/operations/tabs', data),
  updateTab: (id, data) => http.put(`/admin/operations/tabs/${id}`, data),
  removeTab: (id) => http.delete(`/admin/operations/tabs/${id}`),
  topics: () => http.get('/admin/operations/topics'),
  createTopic: (data) => http.post('/admin/operations/topics', data),
  updateTopic: (id, data) => http.put(`/admin/operations/topics/${id}`, data),
  removeTopic: (id) => http.delete(`/admin/operations/topics/${id}`),
  notifications: (params) => http.get('/admin/operations/notifications', { params }),
  push: (data) => http.post('/admin/operations/notifications/push', data),
  teams: (params) => http.get('/admin/operations/teams', { params }),
  teamDetail: (id) => http.get(`/admin/operations/teams/${id}`),
  removeTeam: (id) => http.delete(`/admin/operations/teams/${id}`),
  invites: (params) => http.get('/admin/operations/invites', { params }),
  inviteRanking: () => http.get('/admin/operations/invites/ranking'),
  verifications: (params) => http.get('/admin/operations/verifications', { params }),
  auditVerification: (id, data) => http.post(`/admin/operations/verifications/${id}/audit`, data),
  conversations: (params) => http.get('/admin/operations/conversations', { params }),
  conversationMessages: (id) => http.get(`/admin/operations/conversations/${id}/messages`),
  sendMessage: (data) => http.post('/admin/operations/messages/send', data),
  sensitiveWords: () => http.get('/admin/operations/sensitive-words'),
  addSensitiveWords: (words) => http.post('/admin/operations/sensitive-words', { words }),
  removeSensitiveWord: (id) => http.delete(`/admin/operations/sensitive-words/${id}`),
  tasks: () => http.get('/admin/operations/tasks'),
  createTask: (data) => http.post('/admin/operations/tasks', data),
  updateTask: (id, data) => http.put(`/admin/operations/tasks/${id}`, data),
  removeTask: (id) => http.delete(`/admin/operations/tasks/${id}`),
  feedbacks: (params) => http.get('/admin/operations/feedbacks', { params }),
  replyFeedback: (id, data) => http.post(`/admin/operations/feedbacks/${id}/reply`, data),
  inviteEvents: (params) => http.get('/admin/operations/invite-events', { params }),
  auditInviteEvent: (id, data) => http.post(`/admin/operations/invite-events/${id}/audit`, data),
  removeInviteEvent: (id) => http.delete(`/admin/operations/invite-events/${id}`)
}

export const systemApi = {
  admins: () => http.get('/admin/system/admins'),
  createAdmin: (data) => http.post('/admin/system/admins', data),
  updateAdmin: (id, data) => http.put(`/admin/system/admins/${id}`, data),
  removeAdmin: (id) => http.delete(`/admin/system/admins/${id}`),
  roles: () => http.get('/admin/system/roles'),
  createRole: (data) => http.post('/admin/system/roles', data),
  updateRole: (id, data) => http.put(`/admin/system/roles/${id}`, data),
  removeRole: (id) => http.delete(`/admin/system/roles/${id}`),
  permissions: () => http.get('/admin/system/permissions'),
  configs: () => http.get('/admin/system/configs'),
  saveConfigs: (items) => http.put('/admin/system/configs', { items }),
  createConfig: (data) => http.post('/admin/system/configs', data),
  removeConfig: (key) => http.delete(`/admin/system/configs/${key}`),
  adminLogs: (params) => http.get('/admin/system/logs/admin', { params }),
  loginLogs: (params) => http.get('/admin/system/logs/login', { params }),
  demoStats: () => http.get('/admin/system/demo/stats'),
  seedDemo: (count) => http.post('/admin/system/demo/seed', { count }),
  clearDemo: () => http.post('/admin/system/demo/clear'),
  dbInfo: () => http.get('/admin/system/db/info'),
  vacuum: () => http.post('/admin/system/db/vacuum')
}

/** 第三方 SDK 配置（融云/高德/极光/OpenInstall/腾讯慧眼/支付/短信） */
export const sdkApi = {
  list: () => http.get('/admin/sdk'),
  save: (provider, data) => http.post(`/admin/sdk/${provider}`, data)
}

/** 上传（base64 dataURL） */
export const uploadFile = async (file) => {
  const data = await new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
  const type = file.type?.startsWith('video') ? 'video' : file.type?.startsWith('audio') ? 'audio' : 'image'
  return http.post('/upload', { data, filename: file.name, type })
}
