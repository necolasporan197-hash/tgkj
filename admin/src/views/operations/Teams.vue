<template>
  <div class="page">
    <div class="page-card">
      <div class="card-title"><span>团队管理</span></div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="团队名称" min-width="140" />
        <el-table-column label="队长" min-width="160">
          <template #default="{ row }">
            <div>{{ row.leaderName || '-' }}</div>
            <div class="muted">{{ row.leaderPhone || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="member_count" label="成员数" width="90" />
        <el-table-column prop="notice" label="公告" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewMembers(row)">查看成员</el-button>
            <el-button link type="danger" @click="dissolve(row)">解散团队</el-button>
          </template>
        </el-table-column>
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
          @size-change="load"
        />
      </div>
    </div>

    <el-dialog v-model="memberVisible" :title="`团队成员 - ${detail.name || ''}`" width="720px">
      <el-table :data="detail.members || []" border stripe>
        <el-table-column label="头像" width="70">
          <template #default="{ row }">
            <img class="img-thumb" :src="row.avatar" alt="" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.role === 'leader' ? 'warning' : 'info'" effect="plain">
              {{ row.role === 'leader' ? '队长' : '成员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="joined_at" label="加入时间" width="170" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { operationApi } from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const memberVisible = ref(false)
const detail = reactive({ name: '', members: [] })

const statusType = (s) => ({ active: 'success', disabled: 'info' }[s] || 'info')
const statusText = (s) => ({ active: '正常', disabled: '已禁用' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await operationApi.teams({ page: page.value, pageSize: pageSize.value })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const viewMembers = async (row) => {
  const data = await operationApi.teamDetail(row.id)
  detail.name = data.name || row.name
  detail.members = data.members || []
  memberVisible.value = true
}

const dissolve = async (row) => {
  await ElMessageBox.confirm(`确定解散团队「${row.name}」？该操作不可恢复。`, '解散确认', { type: 'warning' })
  await operationApi.removeTeam(row.id)
  ElMessage.success('已解散')
  await load()
}

onMounted(load)
</script>

<style scoped>
.card-title {
  font-weight: 600;
  margin-bottom: 14px;
}
</style>
