<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-radio-group v-model="query.status" @change="search">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="pending">待处理</el-radio-button>
          <el-radio-button value="replied">已回复</el-radio-button>
          <el-radio-button value="closed">已关闭</el-radio-button>
        </el-radio-group>
        <span class="spacer" />
        <span class="muted">共 {{ total }} 条</span>
        <el-button @click="load">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="140">
          <template #default="{ row }">
            <div>{{ row.nickname || '-' }}</div>
            <div class="muted">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="240" show-overflow-tooltip />
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
        <el-table-column prop="contact" label="联系方式" width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openReply(row)">回复</el-button>
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

    <el-dialog v-model="replyVisible" title="回复反馈" width="480px">
      <el-form label-width="90px">
        <el-form-item label="反馈内容">
          <div class="ellipsis">{{ current?.content }}</div>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="replyText" type="textarea" :rows="4" placeholder="将推送给用户站内通知" />
        </el-form-item>
        <el-form-item label="处理状态">
          <el-radio-group v-model="replyStatus">
            <el-radio value="replied">已回复</el-radio>
            <el-radio value="closed">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReply">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { operationApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const query = reactive({ status: '' })

const replyVisible = ref(false)
const current = ref(null)
const replyText = ref('')
const replyStatus = ref('replied')

const statusType = (s) => ({ pending: 'warning', replied: 'success', closed: 'info' }[s] || 'info')
const statusText = (s) => ({ pending: '待处理', replied: '已回复', closed: '已关闭' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await operationApi.feedbacks({ ...query, page: page.value, pageSize: pageSize.value })
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

const openReply = (row) => {
  current.value = row
  replyText.value = row.reply || ''
  replyStatus.value = row.status === 'closed' ? 'closed' : 'replied'
  replyVisible.value = true
}

const submitReply = async () => {
  submitting.value = true
  try {
    await operationApi.replyFeedback(current.value.id, { reply: replyText.value, status: replyStatus.value })
    ElMessage.success('已处理')
    replyVisible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.ellipsis {
  max-width: 340px;
  word-break: break-all;
}
</style>
