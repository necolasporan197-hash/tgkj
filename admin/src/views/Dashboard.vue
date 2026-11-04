<template>
  <div class="page">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">注册用户总数</div>
        <div class="value">{{ stats.user?.total ?? '-' }}</div>
        <div class="sub">今日新增 {{ stats.user?.today ?? 0 }} · 在线 {{ stats.user?.online ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">男女比例</div>
        <div class="value brand">{{ stats.user?.female ?? 0 }} : {{ stats.user?.male ?? 0 }}</div>
        <div class="sub">VIP 用户 {{ stats.user?.vip ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">动态总数</div>
        <div class="value">{{ stats.content?.moments ?? '-' }}</div>
        <div class="sub">今日发布 {{ stats.content?.momentsToday ?? 0 }} · 评论 {{ stats.content?.comments ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">累计充值</div>
        <div class="value brand">¥{{ stats.finance?.totalRecharge ?? 0 }}</div>
        <div class="sub">VIP 收入 ¥{{ stats.finance?.vipRevenue ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已打款提现</div>
        <div class="value">¥{{ stats.finance?.totalWithdrawPaid ?? 0 }}</div>
        <div class="sub">待审 ¥{{ stats.finance?.pendingWithdrawAmount ?? 0 }}（{{ stats.finance?.pendingWithdrawCount ?? 0 }} 笔）</div>
      </div>
      <div class="stat-card">
        <div class="label">待办总量</div>
        <div class="value brand">{{ todoTotal }}</div>
        <div class="sub">审核 / 处理事项</div>
      </div>
    </div>

    <el-row :gutter="14" style="margin-top: 14px">
      <el-col :lg="14" :md="24">
        <div class="page-card">
          <div class="card-title">
            <span>近 7 天趋势</span>
            <el-radio-group v-model="days" size="small" @change="loadTrend">
              <el-radio-button :value="7">7 天</el-radio-button>
              <el-radio-button :value="14">14 天</el-radio-button>
              <el-radio-button :value="30">30 天</el-radio-button>
            </el-radio-group>
          </div>
          <div class="trend">
            <div v-for="d in trend" :key="d.date" class="trend-col">
              <div class="bars">
                <div class="bar reg" :style="{ height: barH(d.register, maxRegister) }" :title="`注册 ${d.register}`" />
                <div class="bar mom" :style="{ height: barH(d.moments, maxMoments) }" :title="`动态 ${d.moments}`" />
              </div>
              <div class="trend-label">{{ d.date.slice(5) }}</div>
              <div class="trend-val">{{ d.register }}/{{ d.moments }}</div>
            </div>
          </div>
          <div class="legend">
            <span><i class="dot reg" />新增注册</span>
            <span><i class="dot mom" />新增动态</span>
          </div>
        </div>
      </el-col>

      <el-col :lg="10" :md="24">
        <div class="page-card">
          <div class="card-title"><span>待办提醒</span></div>
          <div class="todo-list">
            <div v-for="t in todos" :key="t.label" class="todo-item" @click="go(t.path)">
              <span class="todo-label">{{ t.label }}</span>
              <el-badge :value="t.value" :type="t.value > 0 ? 'danger' : 'info'" :show-zero="true" />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="14" style="margin-top: 14px">
      <el-col :lg="8" :md="24">
        <div class="page-card">
          <div class="card-title"><span>最新注册</span><el-link type="primary" @click="go('/users')">全部</el-link></div>
          <div v-for="u in recent.users || []" :key="u.id" class="mini-row">
            <img class="img-thumb" :src="u.avatar" alt="" />
            <div class="mini-main">
              <div>{{ u.nickname }} <el-tag size="small" :type="u.gender === 2 ? 'danger' : 'primary'" effect="plain">{{ u.gender === 2 ? '女' : '男' }}</el-tag></div>
              <div class="muted">{{ u.city || '-' }} · {{ u.created_at }}</div>
            </div>
            <el-tag size="small" :type="auditType(u.audit_status)" effect="light">{{ auditText(u.audit_status) }}</el-tag>
          </div>
        </div>
      </el-col>
      <el-col :lg="8" :md="24">
        <div class="page-card">
          <div class="card-title"><span>最新动态</span><el-link type="primary" @click="go('/moments')">全部</el-link></div>
          <div v-for="m in recent.moments || []" :key="m.id" class="mini-row">
            <img class="img-thumb" :src="firstImage(m.images)" alt="" />
            <div class="mini-main">
              <div class="ellipsis">{{ m.content || '[图片动态]' }}</div>
              <div class="muted">{{ m.nickname }} · {{ m.created_at }}</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :lg="8" :md="24">
        <div class="page-card">
          <div class="card-title"><span>最新提现</span><el-link type="primary" @click="go('/finance/withdrawals')">全部</el-link></div>
          <div v-for="w in recent.withdrawals || []" :key="w.id" class="mini-row">
            <div class="mini-main">
              <div>¥{{ w.amount }} · {{ w.nickname }}</div>
              <div class="muted">{{ w.created_at }}</div>
            </div>
            <el-tag size="small" :type="w.status === 'pending' ? 'warning' : w.status === 'paid' ? 'success' : 'info'" effect="light">
              {{ statusText(w.status) }}
            </el-tag>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '@/api'

const nav = useRouter()
const stats = ref({})
const trend = ref([])
const recent = ref({})
const days = ref(7)

const todoTotal = computed(() => {
  const t = stats.value.todo || {}
  return Object.values(t).reduce((s, v) => s + (Number(v) || 0), 0)
})

const todos = computed(() => {
  const t = stats.value.todo || {}
  return [
    { label: '女性资料待审核', value: t.pendingFemaleAudit || 0, path: '/users/pending-audit' },
    { label: '认证申请待审核', value: t.pendingVerification || 0, path: '/verifications' },
    { label: '动态待审核', value: t.pendingMoment || 0, path: '/moments' },
    { label: '投稿待审核', value: t.pendingSubmission || 0, path: '/submissions' },
    { label: '举报待处理', value: t.pendingReport || 0, path: '/reports' },
    { label: '提现待审核', value: t.pendingWithdraw || 0, path: '/finance/withdrawals' }
  ]
})

const maxRegister = computed(() => Math.max(1, ...trend.value.map((d) => d.register || 0)))
const maxMoments = computed(() => Math.max(1, ...trend.value.map((d) => d.moments || 0)))
const barH = (v, max) => `${Math.max(3, Math.round(((v || 0) / max) * 110))}px`

const firstImage = (s) => {
  try {
    const arr = typeof s === 'string' ? JSON.parse(s || '[]') : s || []
    return arr[0] || ''
  } catch {
    return ''
  }
}
const auditType = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'info')
const auditText = (s) => ({ approved: '已通过', pending: '待审核', rejected: '已驳回' }[s] || s)
const statusText = (s) => ({ pending: '待审核', paid: '已打款', rejected: '已驳回', approved: '已通过' }[s] || s)
const go = (p) => nav.push(p)

const loadTrend = async () => {
  trend.value = await dashboardApi.trend(days.value)
}

onMounted(async () => {
  const [s, r] = await Promise.all([dashboardApi.stats(), dashboardApi.recent()])
  stats.value = s
  recent.value = r
  await loadTrend()
})
</script>

<style scoped>
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 14px;
}
.trend {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 156px;
}
.trend-col {
  flex: 1;
  text-align: center;
}
.bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 116px;
}
.bar {
  width: 10px;
  border-radius: 3px 3px 0 0;
  transition: height 0.25s;
}
.bar.reg,
.dot.reg {
  background: #ff5000;
}
.bar.mom,
.dot.mom {
  background: #00baf2;
}
.trend-label {
  font-size: 11px;
  color: #91979e;
  margin-top: 6px;
}
.trend-val {
  font-size: 11px;
  color: #494949;
}
.legend {
  margin-top: 10px;
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: #787e85;
}
.legend .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 6px;
}
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f5f6f8;
  cursor: pointer;
}
.todo-item:hover {
  background: #fff3ec;
}
.todo-label {
  font-size: 13px;
  color: #494949;
}
.mini-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #edf0f2;
}
.mini-row:last-child {
  border-bottom: none;
}
.mini-main {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
