import { createRouter, createWebHashHistory } from 'vue-router'
import { getToken } from '@/api/request'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '数据看板', icon: 'DataLine' } },

      { path: 'users', name: 'Users', component: () => import('@/views/users/List.vue'), meta: { title: '用户管理', icon: 'User', group: '用户' } },
      { path: 'users/pending-audit', name: 'FemaleAudit', component: () => import('@/views/users/FemaleAudit.vue'), meta: { title: '女性资料审核', icon: 'Stamp', group: '用户' } },
      { path: 'users/photos', name: 'PhotoAudit', component: () => import('@/views/users/PhotoAudit.vue'), meta: { title: '相册审核', icon: 'Picture', group: '用户' } },
      { path: 'users/cancellations', name: 'Cancellations', component: () => import('@/views/users/Cancellations.vue'), meta: { title: '注销审核', icon: 'RemoveFilled', group: '用户' } },
      { path: 'users/:id', name: 'UserDetail', component: () => import('@/views/users/Detail.vue'), meta: { title: '用户详情', hidden: true, group: '用户' } },
      { path: 'verifications', name: 'Verifications', component: () => import('@/views/operations/Verifications.vue'), meta: { title: '认证审核', icon: 'BadgeCheck', group: '用户' } },

      { path: 'moments', name: 'Moments', component: () => import('@/views/content/Moments.vue'), meta: { title: '动态管理', icon: 'ChatDotRound', group: '内容' } },
      { path: 'comments', name: 'Comments', component: () => import('@/views/content/Comments.vue'), meta: { title: '评论管理', icon: 'ChatLineSquare', group: '内容' } },
      { path: 'submissions', name: 'Submissions', component: () => import('@/views/content/Submissions.vue'), meta: { title: '投稿审核', icon: 'EditPen', group: '内容' } },
      { path: 'reports', name: 'Reports', component: () => import('@/views/content/Reports.vue'), meta: { title: '举报处理', icon: 'WarnTriangleFilled', group: '内容' } },
      { path: 'impressions', name: 'Impressions', component: () => import('@/views/content/Impressions.vue'), meta: { title: '印象标签', icon: 'Star', group: '内容' } },

      { path: 'finance/summary', name: 'FinanceSummary', component: () => import('@/views/finance/Summary.vue'), meta: { title: '收入统计', icon: 'TrendCharts', group: '财务' } },
      { path: 'finance/withdrawals', name: 'Withdrawals', component: () => import('@/views/finance/Withdrawals.vue'), meta: { title: '提现审核', icon: 'Money', group: '财务' } },
      { path: 'finance/transactions', name: 'Transactions', component: () => import('@/views/finance/Transactions.vue'), meta: { title: '资金流水', icon: 'Tickets', group: '财务' } },
      { path: 'finance/vip-packages', name: 'VipPackages', component: () => import('@/views/finance/VipPackages.vue'), meta: { title: 'VIP 套餐', icon: 'Present', group: '财务' } },
      { path: 'finance/vip-orders', name: 'VipOrders', component: () => import('@/views/finance/VipOrders.vue'), meta: { title: 'VIP 订单', icon: 'List', group: '财务' } },
      { path: 'finance/gifts', name: 'Gifts', component: () => import('@/views/finance/Gifts.vue'), meta: { title: '礼物管理', icon: 'Sugar', group: '财务' } },
      { path: 'finance/gift-records', name: 'GiftRecords', component: () => import('@/views/finance/GiftRecords.vue'), meta: { title: '赠送记录', icon: 'Files', group: '财务' } },

      { path: 'operations/banners', name: 'Banners', component: () => import('@/views/operations/Banners.vue'), meta: { title: 'Banner 管理', icon: 'PictureFilled', group: '运营' } },
      { path: 'operations/tabs', name: 'Tabs', component: () => import('@/views/operations/Tabs.vue'), meta: { title: '首页 Tab', icon: 'Menu', group: '运营' } },
      { path: 'operations/topics', name: 'Topics', component: () => import('@/views/operations/Topics.vue'), meta: { title: '话题管理', icon: 'CollectionTag', group: '运营' } },
      { path: 'operations/notifications', name: 'Notifications', component: () => import('@/views/operations/Notifications.vue'), meta: { title: '消息推送', icon: 'Bell', group: '运营' } },
      { path: 'operations/service-chats', name: 'AdminServiceChats', component: () => import('@/views/operations/Messages.vue'), meta: { title: '客服会话', icon: 'Service', group: '运营', chatType: 'service' } },
      { path: 'operations/user-chats', name: 'AdminUserChats', component: () => import('@/views/operations/Messages.vue'), meta: { title: '用户会话', icon: 'ChatRound', group: '运营', chatType: 'user' } },
      { path: 'operations/teams', name: 'Teams', component: () => import('@/views/operations/Teams.vue'), meta: { title: '团队管理', icon: 'UserFilled', group: '运营' } },
      { path: 'operations/invites', name: 'Invites', component: () => import('@/views/operations/Invites.vue'), meta: { title: '邀请记录', icon: 'Share', group: '运营' } },
      { path: 'operations/invite-events', name: 'InviteEvents', component: () => import('@/views/operations/InviteEvents.vue'), meta: { title: '邀约管理', icon: 'Promotion', group: '运营' } },
      { path: 'operations/sensitive-words', name: 'SensitiveWords', component: () => import('@/views/operations/SensitiveWords.vue'), meta: { title: '敏感词库', icon: 'Filter', group: '运营' } },
      { path: 'operations/tasks', name: 'Tasks', component: () => import('@/views/operations/Tasks.vue'), meta: { title: '任务中心', icon: 'Medal', group: '运营' } },
      { path: 'operations/feedbacks', name: 'Feedbacks', component: () => import('@/views/operations/Feedbacks.vue'), meta: { title: '意见反馈', icon: 'ChatDotSquare', group: '运营' } },

      { path: 'system/admins', name: 'Admins', component: () => import('@/views/system/Admins.vue'), meta: { title: '管理员', icon: 'Avatar', group: '系统' } },
      { path: 'system/roles', name: 'Roles', component: () => import('@/views/system/Roles.vue'), meta: { title: '角色权限', icon: 'Lock', group: '系统' } },
      { path: 'system/configs', name: 'Configs', component: () => import('@/views/system/Configs.vue'), meta: { title: '系统配置', icon: 'Setting', group: '系统' } },
      { path: 'system/sdk', name: 'SdkConfig', component: () => import('@/views/system/SdkConfig.vue'), meta: { title: 'SDK 配置', icon: 'Connection', group: '系统' } },
      { path: 'system/demo', name: 'DemoData', component: () => import('@/views/system/DemoData.vue'), meta: { title: '演示数据', icon: 'MagicStick', group: '系统' } },
      { path: 'system/admin-logs', name: 'AdminLogs', component: () => import('@/views/system/AdminLogs.vue'), meta: { title: '操作日志', icon: 'Document', group: '系统' } },
      { path: 'system/login-logs', name: 'LoginLogs', component: () => import('@/views/system/LoginLogs.vue'), meta: { title: '登录日志', icon: 'Key', group: '系统' } },
      { path: 'system/db', name: 'DbInfo', component: () => import('@/views/system/DbInfo.vue'), meta: { title: '数据库信息', icon: 'Coin', group: '系统' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to) => {
  const token = getToken()
  if (!to.meta?.public && !token) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.path === '/login' && token) return { path: '/dashboard' }
  return true
})

export default router
