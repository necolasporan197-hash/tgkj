<template>
  <div class="page">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">待审核笔数</div>
        <div class="value brand">{{ pendingCount }}</div>
        <div class="sub">需尽快处理</div>
      </div>
      <div class="stat-card">
        <div class="label">待审核总金额</div>
        <div class="value">¥{{ pendingAmount }}</div>
        <div class="sub">状态为待审核的提现金额合计</div>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="toolbar">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px" @change="reload">
          <el-option label="待审核" value="pending" />
          <el-option label="已打款" value="paid" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="昵称 / 手机号"
          clearable
          style="width: 220px"
          @keyup.enter="reload"
        />
        <el-button type="primary" @click="reload">查询</el-button>
        <div class="spacer" />
        <el-button @click="loadAll">刷新</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-image :src="row.avatar" fit="cover" class="img-thumb" :preview-src-list="[row.avatar]" preview-teleported />
              <div>
                <div>{{ row.nickname || '-' }}</div>
                <div class="muted">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提现金额" width="110">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="手续费" width="100">
          <template #default="{ row }">¥{{ row.fee }}</template>
        </el-table-column>
        <el-table-column label="实际到账" width="110">
          <template #default="{ row }">¥{{ row.actual_amount }}</template>
        </el-table-column>
        <el-table-column label="收款方式" width="100">
          <template #default="{ row }">{{ accountTypeText(row.account_type) }}</template>
        </el-table-column>
        <el-table-column prop="account_no" label="收款账号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="account_name" label="收款人" width="110" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="170" />
        <el-table-column prop="reviewed_at" label="审核时间" width="170">
          <template #default="{ row }">{{ row.reviewed_at || '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="primary" @click="pay(row)">确认打款</el-button>
              <el-button size="small" type="danger" @click="openReject(row)">驳回</el-button>
            </template>
            <span v-else class="muted">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="load"
          @size-change="reload"
        />
      </div>
    </div>

    <el-dialog v-model="rejectVisible" title="驳回提现" width="440px">
      <el-form label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectRemark" type="textarea" :rows="3" placeholder="请填写驳回原因，将退回用户余额" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="confirmReject">确定驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { financeApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const rows = ref([])
const total = ref(0)
const pendingCount = ref(0)
const pendingAmount = ref(0)
const rejectVisible = ref(false)
const rejectRemark = ref('')
const current = ref(null)

const query = reactive({ page: 1, pageSize: 20, status: '', keyword: '' })

const accountTypeText = (t) => ({ alipay: '支付宝', wechat: '微信', bank: '银行卡' }[t] || t || '-')
const statusText = (s) => ({ pending: '待审核', paid: '已打款', rejected: '已驳回', approved: '已通过' }[s] || s)
const statusType = (s) => ({ pending: 'warning', paid: 'success', rejected: 'danger' }[s] || 'info')

const loadStats = async () => {
  const [s, p] = await Promise.all([
    financeApi.summary(),
    financeApi.withdrawals({ page: 1, pageSize: 1, status: 'pending' })
  ])
  pendingAmount.value = s.pendingWithdraw ?? 0
  pendingCount.value = p.total ?? 0
}

const load = async () => {
  loading.value = true
  try {
    const data = await financeApi.withdrawals({ ...query })
    rows.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const loadAll = async () => {
  query.page = 1
  await Promise.all([load(), loadStats()])
}

const reload = () => {
  query.page = 1
  load()
}

const pay = (row) => {
  ElMessageBox.confirm(`确认向「${row.nickname || row.phone}」打款 ¥${row.actual_amount}？`, '确认打款', {
    type: 'warning'
  })
    .then(async () => {
      await financeApi.reviewWithdrawal(row.id, { action: 'paid' })
      ElMessage.success('已确认打款')
      await loadAll()
    })
    .catch(() => {})
}

const openReject = (row) => {
  current.value = row
  rejectRemark.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectRemark.value.trim()) return ElMessage.warning('请填写驳回原因')
  submitting.value = true
  try {
    await financeApi.reviewWithdrawal(current.value.id, { action: 'reject', remark: rejectRemark.value })
    ElMessage.success('已驳回并退回余额')
    rejectVisible.value = false
    await loadAll()
  } finally {
    submitting.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
