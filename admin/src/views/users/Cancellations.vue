<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-radio-group v-model="query.status" @change="search">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">待处理</el-radio-button>
          <el-radio-button value="approved">已注销</el-radio-button>
          <el-radio-button value="rejected">已驳回</el-radio-button>
        </el-radio-group>
        <span class="spacer" />
        <span class="muted">共 {{ total }} 条</span>
        <el-button @click="load">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user">
              <el-avatar :size="30" :src="row.avatar" />
              <div>
                <div>{{ row.nickname || '-' }}</div>
                <div class="muted">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="注销原因" min-width="160" show-overflow-tooltip />
        <el-table-column prop="detail" label="补充说明" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="170" />
        <el-table-column prop="remark" label="处理备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" :disabled="row.status !== 'pending'" @click="review(row, 'approve')">通过注销</el-button>
            <el-button link type="primary" :disabled="row.status !== 'pending'" @click="openReject(row)">驳回</el-button>
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

    <el-dialog v-model="rejectVisible" title="驳回注销申请" width="440px">
      <el-form label-width="90px">
        <el-form-item label="驳回原因">
          <el-input v-model="remark" type="textarea" :rows="3" placeholder="将通知用户" />
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
import { userApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const query = reactive({ status: '' })

const rejectVisible = ref(false)
const current = ref(null)
const remark = ref('')

const statusType = (s) => ({ pending: 'warning', approved: 'danger', rejected: 'info' }[s] || 'info')
const statusText = (s) => ({ pending: '待处理', approved: '已注销', rejected: '已驳回' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await userApi.cancellations({ ...query, page: page.value, pageSize: pageSize.value })
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

const review = (row, action) => {
  ElMessageBox.confirm(`确认通过「${row.nickname || row.phone}」的注销申请？通过后账号将被禁用。`, '注销确认', {
    type: 'warning'
  })
    .then(async () => {
      await userApi.reviewCancellation(row.id, { action, remark: '审核通过，账号已注销' })
      ElMessage.success('已注销')
      await load()
    })
    .catch(() => {})
}

const openReject = (row) => {
  current.value = row
  remark.value = ''
  rejectVisible.value = true
}

const doReject = async () => {
  submitting.value = true
  try {
    await userApi.reviewCancellation(current.value.id, { action: 'reject', remark: remark.value })
    ElMessage.success('已驳回')
    rejectVisible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.user {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
