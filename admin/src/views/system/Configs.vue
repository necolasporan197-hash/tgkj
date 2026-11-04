<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="card-title" style="margin: 0">系统配置</span>
        <div class="spacer" />
        <el-button @click="openCreate">新增配置</el-button>
        <el-button type="primary" :loading="saving" @click="saveAll">保存全部</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="key" label="配置键" min-width="180" />
        <el-table-column label="配置值" min-width="260">
          <template #default="{ row }">
            <el-switch
              v-if="row.key === 'female_audit_required' || row.key === 'captcha_required'"
              :model-value="row.value"
              active-value="1"
              inactive-value="0"
              @update:model-value="(v) => (row.value = v)"
            />
            <el-input-number
              v-else-if="row.key === 'withdraw_fee_rate'"
              :model-value="Number(row.value) || 0"
              :min="0"
              :max="1"
              :step="0.01"
              :precision="2"
              @update:model-value="(v) => (row.value = String(v))"
            />
            <el-input
              v-else-if="row.key === 'notice_text'"
              :model-value="row.value"
              type="textarea"
              :rows="2"
              @update:model-value="(v) => (row.value = v)"
            />
            <el-input v-else :model-value="row.value" @update:model-value="(v) => (row.value = v)" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.remark" />
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="170" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="createVisible" title="新增配置" width="480px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="配置键">
          <el-input v-model="createForm.key" />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input v-model="createForm.value" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { systemApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const creating = ref(false)
const list = ref([])
const createVisible = ref(false)
const createForm = reactive({ key: '', value: '', remark: '' })

const load = async () => {
  loading.value = true
  try {
    const data = await systemApi.configs()
    list.value = data.map((c) => ({ ...c }))
  } finally {
    loading.value = false
  }
}

const saveAll = async () => {
  saving.value = true
  try {
    const items = list.value.map((c) => ({ key: c.key, value: c.value, remark: c.remark || '' }))
    await systemApi.saveConfigs(items)
    ElMessage.success('配置已保存')
    await load()
  } finally {
    saving.value = false
  }
}

const openCreate = () => {
  Object.assign(createForm, { key: '', value: '', remark: '' })
  createVisible.value = true
}

const submitCreate = async () => {
  if (!createForm.key) return ElMessage.warning('配置键必填')
  creating.value = true
  try {
    await systemApi.createConfig({ ...createForm })
    ElMessage.success('已保存')
    createVisible.value = false
    await load()
  } finally {
    creating.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除配置「${row.key}」？`, '删除确认', { type: 'warning' })
  await systemApi.removeConfig(row.key)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.card-title {
  font-weight: 600;
}
</style>
