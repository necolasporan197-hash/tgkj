<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="title">VIP 订单</span>
        <div class="spacer" />
        <el-button @click="load">刷新</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div>{{ row.nickname || '-' }}</div>
            <div class="muted">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="packageName" label="套餐名称" min-width="140">
          <template #default="{ row }">{{ row.packageName || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="days" label="天数" width="90" />
        <el-table-column label="支付方式" width="110">
          <template #default="{ row }">{{ payTypeText(row.pay_type) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="170" />
        <el-table-column label="支付时间" width="170">
          <template #default="{ row }">{{ row.paid_at || '-' }}</template>
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
          @size-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { financeApi } from '@/api'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })

const payTypeText = (t) => ({ alipay: '支付宝', wechat: '微信', bank: '银行卡' }[t] || t || '-')
const statusText = (s) => ({ pending: '待支付', paid: '已支付', cancelled: '已取消' }[s] || s)
const statusType = (s) => ({ pending: 'warning', paid: 'success', cancelled: 'info' }[s] || 'info')

const load = async () => {
  loading.value = true
  try {
    const data = await financeApi.vipOrders({ ...query })
    rows.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.title {
  font-weight: 600;
}
</style>
