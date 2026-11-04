<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="title">赠送记录</span>
        <div class="spacer" />
        <el-button @click="load">刷新</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="fromName" label="赠送人" min-width="130">
          <template #default="{ row }">{{ row.fromName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="toName" label="接收人" min-width="130">
          <template #default="{ row }">{{ row.toName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="gift_name" label="礼物名称" min-width="130">
          <template #default="{ row }">{{ row.gift_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="count" label="数量" width="90" />
        <el-table-column label="消耗金币" width="110">
          <template #default="{ row }">{{ row.coins }} 金币</template>
        </el-table-column>
        <el-table-column label="关联动态 ID" width="120">
          <template #default="{ row }">{{ row.moment_id || '-' }}</template>
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

const load = async () => {
  loading.value = true
  try {
    const data = await financeApi.giftRecords({ ...query })
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
