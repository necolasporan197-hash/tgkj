<template>
  <div class="page">
    <div class="page-card">
      <div class="card-title"><span>消息推送</span></div>
      <el-form :model="form" label-width="160px" style="max-width: 720px">
        <el-form-item label="推送目标">
          <el-radio-group v-model="form.all">
            <el-radio :value="true">全体用户</el-radio>
            <el-radio :value="false">指定用户ID</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!form.all" label="目标用户ID">
          <el-select
            v-model="form.userIds"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入用户ID后回车添加"
            style="width: 100%"
          >
            <el-option v-for="id in form.userIds" :key="id" :label="id" :value="id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="系统通知" maxlength="50" />
        </el-form-item>
        <el-form-item label="推送内容">
          <el-input v-model="form.content" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="同时发送为聊天消息">
          <el-switch v-model="form.asMessage" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="pushing" @click="submitPush">发送</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title"><span>推送历史</span></div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="接收用户" min-width="120" />
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ntype" label="类型" width="100" />
        <el-table-column label="是否已读" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.is_read ? 'success' : 'info'">{{ row.is_read ? '已读' : '未读' }}</el-tag>
          </template>
        </el-table-column>
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
          @size-change="load"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { operationApi } from '@/api'

const form = reactive({ all: true, userIds: [], title: '', content: '', asMessage: false })
const pushing = ref(false)
const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const load = async () => {
  loading.value = true
  try {
    const data = await operationApi.notifications({ page: page.value, pageSize: pageSize.value })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const submitPush = async () => {
  if (!form.content) return ElMessage.warning('请填写推送内容')
  if (!form.all && !form.userIds.length) return ElMessage.warning('请选择指定用户ID')
  pushing.value = true
  try {
    const res = await operationApi.push({
      userIds: form.userIds,
      all: form.all,
      title: form.title,
      content: form.content,
      asMessage: form.asMessage
    })
    ElMessage.success(`已推送给 ${res?.count ?? 0} 位用户`)
    form.content = ''
    page.value = 1
    await load()
  } finally {
    pushing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.card-title {
  font-weight: 600;
  margin-bottom: 14px;
}
</style>
