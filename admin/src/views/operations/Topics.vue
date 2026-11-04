<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="title">话题管理</span>
        <div class="spacer" />
        <el-button @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">新增话题</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑话题' : '新增话题'" width="440px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="话题名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { operationApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const rows = ref([])
const visible = ref(false)

const form = reactive({ id: null, name: '', sort: 0, status: 1 })

const load = async () => {
  loading.value = true
  try {
    rows.value = (await operationApi.topics()) || []
  } finally {
    loading.value = false
  }
}

const reset = () => {
  Object.assign(form, { id: null, name: '', sort: 0, status: 1 })
}

const openCreate = () => {
  reset()
  visible.value = true
}

const openEdit = (row) => {
  Object.assign(form, { id: row.id, name: row.name, sort: row.sort || 0, status: row.status })
  visible.value = true
}

const submit = async () => {
  if (!form.name) return ElMessage.warning('请填写名称')
  submitting.value = true
  try {
    const payload = { name: form.name, sort: form.sort, status: form.status }
    if (form.id) await operationApi.updateTopic(form.id, payload)
    else await operationApi.createTopic(payload)
    ElMessage.success('已保存')
    visible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

const remove = (row) => {
  ElMessageBox.confirm(`确认删除话题「${row.name}」？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await operationApi.removeTopic(row.id)
      ElMessage.success('已删除')
      await load()
    })
    .catch(() => {})
}

onMounted(load)
</script>

<style scoped>
.title {
  font-weight: 600;
}
</style>
