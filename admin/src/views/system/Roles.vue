<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="card-title" style="margin: 0">角色权限</span>
        <div class="spacer" />
        <el-button type="primary" @click="openCreate">新增角色</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="code" label="标识" min-width="120" />
        <el-table-column label="权限" min-width="260">
          <template #default="{ row }">
            <template v-if="row.permissions.includes('*')">
              <el-tag size="small" type="success">全部权限</el-tag>
            </template>
            <template v-else>
              <el-tag v-for="p in row.permissions" :key="p" size="small" effect="plain" style="margin: 2px">
                {{ permName(p) }}
              </el-tag>
              <span v-if="!row.permissions.length" class="muted">无</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑角色' : '新增角色'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="标识">
          <el-input v-model="form.code" :disabled="!!form.id" placeholder="英文标识，如 operator" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
        <el-form-item label="权限">
          <el-tag v-if="allPerm" type="success" style="margin-bottom: 8px">全部权限</el-tag>
          <el-checkbox-group v-model="form.permissions" :disabled="allPerm">
            <el-checkbox v-for="p in permList" :key="p.code" :value="p.code">{{ p.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { systemApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const permList = ref([])
const visible = ref(false)
const form = reactive({ id: null, name: '', code: '', remark: '', permissions: [] })

const allPerm = computed(() => form.permissions.includes('*'))
const permName = (code) => permList.value.find((p) => p.code === code)?.name || code

const parsePerms = (raw) => {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw || []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const load = async () => {
  loading.value = true
  try {
    const data = await systemApi.roles()
    list.value = data.map((r) => ({ ...r, permissions: parsePerms(r.permissions) }))
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(form, { id: null, name: '', code: '', remark: '', permissions: [] })
  visible.value = true
}

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    remark: row.remark || '',
    permissions: [...row.permissions]
  })
  visible.value = true
}

const submit = async () => {
  if (!form.name || !form.code) return ElMessage.warning('角色名称与标识必填')
  saving.value = true
  try {
    if (form.id) {
      await systemApi.updateRole(form.id, { name: form.name, permissions: form.permissions, remark: form.remark })
    } else {
      await systemApi.createRole({
        name: form.name,
        code: form.code,
        permissions: form.permissions,
        remark: form.remark
      })
    }
    ElMessage.success('已保存')
    visible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」？`, '删除确认', { type: 'warning' })
  await systemApi.removeRole(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(async () => {
  permList.value = await systemApi.permissions()
  await load()
})
</script>

<style scoped>
.card-title {
  font-weight: 600;
}
</style>
