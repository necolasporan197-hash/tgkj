<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-radio-group v-model="query.status" @change="search">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">待审核</el-radio-button>
          <el-radio-button value="approved">已通过</el-radio-button>
          <el-radio-button value="rejected">已驳回</el-radio-button>
        </el-radio-group>
        <span class="spacer" />
        <span class="muted">共 {{ total }} 条</span>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand">
              <div class="detail-line"><span class="muted">活动介绍：</span>{{ row.content || '无' }}</div>
              <div v-if="row.tags && row.tags.length" class="detail-line">
                <span class="muted">标签：</span>
                <el-tag v-for="(t, i) in row.tags" :key="i" size="small" class="tag">{{ t }}</el-tag>
              </div>
              <div class="detail-line imgs">
                <span class="muted">图片：</span>
                <template v-if="row.images && row.images.length">
                  <el-image
                    v-for="(img, i) in row.images"
                    :key="i"
                    :src="img"
                    fit="cover"
                    class="img-thumb"
                    :preview-src-list="row.images"
                    :initial-index="i"
                    preview-teleported
                  />
                </template>
                <span v-else class="muted">无</span>
              </div>
              <div v-if="row.reject_reason" class="detail-line">
                <span class="muted">驳回原因：</span>{{ row.reject_reason }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="发起人" min-width="150">
          <template #default="{ row }">
            <div>{{ row.nickname || '-' }}</div>
            <div class="muted">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="theme" label="活动主题" min-width="120" show-overflow-tooltip />
        <el-table-column prop="city" label="城市" width="100">
          <template #default="{ row }">{{ row.city || '-' }}</template>
        </el-table-column>
        <el-table-column prop="event_date" label="活动日期" width="130">
          <template #default="{ row }">{{ row.event_date || '-' }}</template>
        </el-table-column>
        <el-table-column prop="content" label="活动介绍" min-width="200" show-overflow-tooltip />
        <el-table-column label="报名/热度" width="110">
          <template #default="{ row }">{{ row.join_count }} / {{ row.hot }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="auditType(row.status)" effect="light">{{ auditText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.status !== 'pending'" @click="approve(row)">通过</el-button>
            <el-button link type="warning" :disabled="row.status !== 'pending'" @click="openReject(row)">驳回</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
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

    <el-dialog v-model="rejectVisible" title="驳回邀约" width="420px">
      <el-form label-width="70px">
        <el-form-item label="主题">{{ current?.theme }}</el-form-item>
        <el-form-item label="原因">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="primary" @click="doReject">确定</el-button>
      </template>
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
const query = reactive({ status: '' })
const current = ref(null)
const rejectVisible = ref(false)
const rejectReason = ref('')

const auditType = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'info')
const auditText = (s) => ({ approved: '已通过', pending: '待审核', rejected: '已驳回' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await operationApi.inviteEvents({ ...query, page: page.value, pageSize: pageSize.value })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const search = () => {
  page.value = 1
  load()
}

const approve = async (row) => {
  await ElMessageBox.confirm(`确定通过邀约「${row.theme}」吗？`, '提示', { type: 'warning' })
  await operationApi.auditInviteEvent(row.id, { action: 'approve' })
  ElMessage.success('已通过')
  load()
}

const openReject = (row) => {
  current.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}
const doReject = async () => {
  if (!rejectReason.value) return ElMessage.warning('请填写驳回原因')
  await operationApi.auditInviteEvent(current.value.id, { action: 'reject', rejectReason: rejectReason.value })
  ElMessage.success('已驳回')
  rejectVisible.value = false
  load()
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除邀约「${row.theme}」吗？删除后不可恢复。`, '提示', { type: 'warning' })
  await operationApi.removeInviteEvent(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.expand {
  padding: 8px 16px;
  font-size: 13px;
  color: #494949;
}
.detail-line {
  margin-bottom: 8px;
}
.tag {
  margin-right: 6px;
}
.imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
</style>
