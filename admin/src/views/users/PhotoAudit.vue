<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-button type="primary" :disabled="!selected.length" @click="batchAudit('approve')">批量通过</el-button>
        <el-button type="danger" plain :disabled="!selected.length" @click="batchAudit('reject')">批量驳回</el-button>
        <span class="spacer" />
        <span class="muted">已选 {{ selected.length }} 张 · 待审核 {{ total }} 张</span>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe @selection-change="onSelect">
        <el-table-column type="selection" width="46" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="照片" width="110">
          <template #default="{ row }">
            <el-image
              :src="row.url"
              fit="cover"
              class="img-thumb"
              :preview-src-list="[row.url]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="用户昵称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">{{ mediaText(row.media_type) }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="auditType(row.audit_status)" effect="light">{{ auditText(row.audit_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="auditOne(row, 'approve')">通过</el-button>
            <el-button link type="danger" @click="auditOne(row, 'reject')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="load"
        @size-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selected = ref([])

const mediaText = (t) => ({ image: '图片', video: '视频', audio: '音频' }[t] || t || '图片')
const auditType = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'info')
const auditText = (s) => ({ approved: '已通过', pending: '待审核', rejected: '已驳回' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await userApi.pendingPhotos({ page: page.value, pageSize: pageSize.value })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const onSelect = (rows) => {
  selected.value = rows
}

const auditOne = async (row, action) => {
  const tip = action === 'approve' ? '通过' : '驳回'
  await ElMessageBox.confirm(`确定${tip}该照片吗？`, '提示', { type: 'warning' })
  await userApi.auditPhotos({ idsList: [row.id], action })
  ElMessage.success(`已${tip}`)
  load()
}

const batchAudit = async (action) => {
  const tip = action === 'approve' ? '通过' : '驳回'
  await ElMessageBox.confirm(`确定批量${tip}已选的 ${selected.value.length} 张照片吗？`, '提示', { type: 'warning' })
  await userApi.auditPhotos({ idsList: selected.value.map((r) => r.id), action })
  ElMessage.success(`已${tip}`)
  load()
}

onMounted(load)
</script>
