<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="title">任务中心</span>
        <div class="spacer" />
        <el-button @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">新增任务</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="code" label="任务标识" min-width="150" />
        <el-table-column prop="title" label="名称" min-width="140" />
        <el-table-column prop="subtitle" label="副标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="reward_coins" label="奖励金币" width="100" />
        <el-table-column prop="target" label="目标次数" width="100" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type === 'daily' ? 'warning' : 'success'" effect="light">
              {{ row.type === 'daily' ? '每日' : '一次性' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑任务' : '新增任务'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="任务标识">
          <el-input v-model="form.code" :disabled="!!form.id" placeholder="如 daily_checkin" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.title" placeholder="任务名称" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subtitle" placeholder="任务描述" />
        </el-form-item>
        <el-form-item label="奖励金币">
          <el-input-number v-model="form.rewardCoins" :min="0" />
        </el-form-item>
        <el-form-item label="目标次数">
          <el-input-number v-model="form.target" :min="1" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio value="daily">每日</el-radio>
            <el-radio value="once">一次性</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="跳转标识">
          <el-input v-model="form.action" placeholder="如 checkin / publish / invite" />
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

const empty = { id: null, code: '', title: '', subtitle: '', rewardCoins: 0, target: 1, type: 'daily', action: '', sort: 0, status: 1 }
const form = reactive({ ...empty })

const load = async () => {
  loading.value = true
  try {
    rows.value = (await operationApi.tasks()) || []
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, empty)
  visible.value = true
}

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    code: row.code,
    title: row.title,
    subtitle: row.subtitle,
    rewardCoins: row.reward_coins,
    target: row.target,
    type: row.type,
    action: row.action,
    sort: row.sort,
    status: row.status
  })
  visible.value = true
}

const submit = async () => {
  if (!form.code || !form.title) return ElMessage.warning('请填写任务标识与名称')
  submitting.value = true
  try {
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      rewardCoins: form.rewardCoins,
      target: form.target,
      type: form.type,
      action: form.action,
      sort: form.sort,
      status: form.status
    }
    if (form.id) await operationApi.updateTask(form.id, payload)
    else await operationApi.createTask({ ...payload, code: form.code })
    ElMessage.success('已保存')
    visible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

const remove = (row) => {
  ElMessageBox.confirm(`确认删除任务「${row.title}」？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await operationApi.removeTask(row.id)
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
