<template>
  <div class="page">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">待处理举报</div>
        <div class="value brand">{{ pendingCount }}</div>
        <div class="sub">处理完成后请及时反馈</div>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="toolbar">
        <el-radio-group v-model="query.status" @change="search">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">待处理</el-radio-button>
          <el-radio-button value="handled">已处理</el-radio-button>
          <el-radio-button value="rejected">已驳回</el-radio-button>
        </el-radio-group>
        <span class="spacer" />
        <span class="muted">共 {{ total }} 条</span>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="举报人" min-width="140">
          <template #default="{ row }">
            <div>{{ row.reporterName }}</div>
            <div class="muted">{{ row.reporterPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="被举报人" min-width="140">
          <template #default="{ row }">
            <div>{{ row.targetName || '-' }}</div>
            <div class="muted">{{ row.targetPhone || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="举报类型" width="100">
          <template #default="{ row }">{{ typeText(row.target_type) }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="160" show-overflow-tooltip />
        <el-table-column label="图片" width="130">
          <template #default="{ row }">
            <div class="imgs">
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
              <span v-if="!row.images || !row.images.length" class="muted">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="举报时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.status !== 'pending'" @click="openHandle(row)">处理</el-button>
            <el-button link type="danger" :disabled="row.status !== 'pending'" @click="reject(row)">驳回</el-button>
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

    <el-dialog v-model="handleVisible" title="处理举报" width="440px">
      <el-form label-width="110px">
        <el-form-item label="被举报人">{{ current?.targetName || '（动态/评论）' }}</el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleRemark" type="textarea" :rows="3" placeholder="可填写处理说明" />
        </el-form-item>
        <el-form-item label="同时封禁">
          <el-checkbox v-model="banTarget">同时封禁被举报人</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="doHandle">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contentApi } from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pendingCount = ref(0)
const page = ref(1)
const pageSize = ref(20)
const query = reactive({ status: '' })
const current = ref(null)
const handleVisible = ref(false)
const handleRemark = ref('')
const banTarget = ref(false)

const typeText = (t) => ({ user: '用户', moment: '动态', comment: '评论' }[t] || t || '-')
const statusType = (s) => ({ pending: 'warning', handled: 'success', rejected: 'info' }[s] || 'info')
const statusText = (s) => ({ pending: '待处理', handled: '已处理', rejected: '已驳回' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await contentApi.reports({ ...query, page: page.value, pageSize: pageSize.value })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const loadPending = async () => {
  const data = await contentApi.reports({ page: 1, pageSize: 1, status: 'pending' })
  pendingCount.value = data.total
}
const search = () => {
  page.value = 1
  load()
}

const openHandle = (row) => {
  current.value = row
  handleRemark.value = ''
  banTarget.value = false
  handleVisible.value = true
}
const doHandle = async () => {
  await contentApi.handleReport(current.value.id, { action: 'handled', remark: handleRemark.value, banTarget: banTarget.value })
  ElMessage.success('处理完成')
  handleVisible.value = false
  load()
  loadPending()
}

const reject = async (row) => {
  await ElMessageBox.confirm('确定驳回该举报吗？', '提示', { type: 'warning' })
  await contentApi.handleReport(row.id, { action: 'rejected', remark: '' })
  ElMessage.success('已驳回')
  load()
  loadPending()
}

onMounted(() => {
  load()
  loadPending()
})
</script>

<style scoped>
.imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
</style>
