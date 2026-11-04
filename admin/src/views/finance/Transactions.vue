<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-select v-model="query.type" placeholder="全部类型" clearable style="width: 160px" @change="reload">
          <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
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
        <el-button @click="reload">刷新</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div>{{ row.nickname || '-' }}</div>
            <div class="muted">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" effect="light">{{ typeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.title || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="金币" width="100">
          <template #default="{ row }">{{ row.coins }}</template>
        </el-table-column>
        <el-table-column label="变动后余额" width="110">
          <template #default="{ row }">¥{{ row.balance_after }}</template>
        </el-table-column>
        <el-table-column label="变动后金币" width="110">
          <template #default="{ row }">{{ row.coins_after }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'success' ? 'success' : 'info'" effect="plain">
              {{ row.status === 'success' ? '成功' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="170" />
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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { financeApi } from '@/api'

const loading = ref(false)
const rows = ref([])
const total = ref(0)

const query = reactive({ page: 1, pageSize: 20, type: '', keyword: '' })

const typeOptions = [
  { value: 'recharge', label: '充值' },
  { value: 'withdraw', label: '提现' },
  { value: 'withdraw_refund', label: '提现退回' },
  { value: 'coin_in', label: '金币收入' },
  { value: 'coin_out', label: '金币支出' },
  { value: 'reward', label: '奖励' },
  { value: 'unlock', label: '解锁消费' },
  { value: 'adjust', label: '后台调整' },
  { value: 'vip', label: '开通VIP' }
]

const typeText = (t) => typeOptions.find((o) => o.value === t)?.label || t || '-'
const typeTag = (t) =>
  ({
    recharge: 'success',
    withdraw: 'warning',
    withdraw_refund: 'info',
    coin_in: 'primary',
    coin_out: 'danger',
    reward: 'success',
    unlock: 'warning',
    adjust: 'info',
    vip: 'primary'
  }[t] || 'info')

const load = async () => {
  loading.value = true
  try {
    const data = await financeApi.transactions({ ...query })
    rows.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const reload = () => {
  query.page = 1
  load()
}

onMounted(load)
</script>
