<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-select v-model="module" placeholder="全部模块" clearable style="width: 160px" @change="search">
          <el-option v-for="m in modules" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
        <el-input v-model="keyword" placeholder="关键词（动作/目标/管理员）" clearable style="width: 240px" @keyup.enter="search" />
        <el-button type="primary" @click="search">查询</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="admin_name" label="管理员" width="120" />
        <el-table-column prop="module" label="模块" width="110" />
        <el-table-column prop="action" label="动作" min-width="130" />
        <el-table-column prop="target" label="目标" min-width="100" />
        <el-table-column prop="detail" label="详情" min-width="220" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="created_at" label="时间" width="170" />
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { systemApi } from '@/api'

const modules = [
  { label: '认证', value: 'auth' },
  { label: '用户', value: 'users' },
  { label: '内容', value: 'content' },
  { label: '财务', value: 'finance' },
  { label: '运营', value: 'operations' },
  { label: '系统', value: 'system' }
]

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const module = ref('')
const keyword = ref('')

const load = async () => {
  loading.value = true
  try {
    const data = await systemApi.adminLogs({
      page: page.value,
      pageSize: pageSize.value,
      module: module.value || undefined,
      keyword: keyword.value || undefined
    })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const search = () => {
  page.value = 1
  load()
}

onMounted(load)
</script>
