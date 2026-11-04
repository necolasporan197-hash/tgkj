<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 130px">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-select v-model="query.vtype" placeholder="认证类型" clearable style="width: 150px">
          <el-option label="资料认证" value="profile" />
          <el-option label="实名认证" value="idcard" />
          <el-option label="人脸认证" value="face" />
          <el-option label="视频认证" value="video" />
          <el-option label="车辆认证" value="vehicle" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <span class="spacer" />
        <span class="muted">共 {{ total }} 条</span>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user">
              <el-image
                v-if="row.avatar"
                :src="row.avatar"
                fit="cover"
                class="img-thumb"
                :preview-src-list="[row.avatar]"
                preview-teleported
              />
              <div v-else class="img-thumb" />
              <div>
                <div>{{ row.nickname }}</div>
                <div class="muted">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="认证类型" width="110">
          <template #default="{ row }">{{ vtypeText(row.vtype) }}</template>
        </el-table-column>
        <el-table-column prop="real_name" label="真实姓名" width="110" />
        <el-table-column prop="id_number" label="身份证号" min-width="170" />
        <el-table-column label="材料" min-width="180">
          <template #default="{ row }">
            <div class="material">
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
              <el-link v-if="row.video_url" type="primary" :href="row.video_url" target="_blank">查看视频</el-link>
              <span v-if="(!row.images || !row.images.length) && !row.video_url" class="muted">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="auditType(row.status)" effect="light">{{ auditText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reject_reason" label="驳回原因" min-width="140" show-overflow-tooltip />
        <el-table-column prop="created_at" label="提交时间" width="170" />
        <el-table-column prop="reviewed_at" label="审核时间" width="170">
          <template #default="{ row }">{{ row.reviewed_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.status !== 'pending'" @click="approve(row)">通过</el-button>
            <el-button link type="danger" :disabled="row.status !== 'pending'" @click="openReject(row)">驳回</el-button>
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

    <el-dialog v-model="rejectVisible" title="驳回认证" width="420px">
      <el-form label-width="70px">
        <el-form-item label="用户">{{ current?.nickname }}（{{ current?.phone }}）</el-form-item>
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
const query = reactive({ status: '', vtype: '' })
const current = ref(null)
const rejectVisible = ref(false)
const rejectReason = ref('')

const vtypeText = (t) =>
  ({ profile: '资料认证', idcard: '实名认证', face: '人脸认证', video: '视频认证', vehicle: '车辆认证' }[t] || t || '-')
const auditType = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'info')
const auditText = (s) => ({ approved: '已通过', pending: '待审核', rejected: '已驳回' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await operationApi.verifications({ ...query, page: page.value, pageSize: pageSize.value })
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
const reset = () => {
  Object.assign(query, { status: '', vtype: '' })
  search()
}

const approve = async (row) => {
  await ElMessageBox.confirm(`确定通过用户「${row.nickname}」的${vtypeText(row.vtype)}吗？`, '提示', { type: 'warning' })
  await operationApi.auditVerification(row.id, { action: 'approve' })
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
  await operationApi.auditVerification(current.value.id, { action: 'reject', rejectReason: rejectReason.value })
  ElMessage.success('已驳回')
  rejectVisible.value = false
  load()
}

onMounted(load)
</script>

<style scoped>
.user {
  display: flex;
  align-items: center;
  gap: 8px;
}
.material {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
</style>
