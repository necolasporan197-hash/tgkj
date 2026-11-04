<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="card-title" style="margin: 0">管理员</span>
        <div class="spacer" />
        <el-button type="primary" @click="openCreate">新增管理员</el-button>
      </div>
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="账号" min-width="130" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="roleName" label="角色" min-width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="170" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="createVisible" title="新增管理员" width="460px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="账号">
          <el-input v-model="createForm.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="createForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="createForm.name" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="createForm.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑管理员" width="460px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="'active'">启用</el-radio>
            <el-radio :value="'disabled'">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="重置密码">
          <el-input v-model="editForm.password" type="password" show-password placeholder="留空则不修改" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">确定</el-button>
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
const list = ref([])
const roles = ref([])
const createVisible = ref(false)
const editVisible = ref(false)
const createForm = reactive({ username: '', password: '', name: '', roleId: null })
const editForm = reactive({ id: null, name: '', roleId: null, status: 'active', password: '' })

const statusType = (s) => (s === 'active' ? 'success' : 'info')
const statusText = (s) => (s === 'active' ? '启用' : '禁用')

const load = async () => {
  loading.value = true
  try {
    list.value = await systemApi.admins()
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  roles.value = await systemApi.roles()
}

const openCreate = () => {
  Object.assign(createForm, { username: '', password: '', name: '', roleId: null })
  createVisible.value = true
}

const submitCreate = async () => {
  if (!createForm.username || !createForm.password) return ElMessage.warning('账号与密码必填')
  saving.value = true
  try {
    await systemApi.createAdmin({ ...createForm })
    ElMessage.success('已新增管理员')
    createVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

const openEdit = (row) => {
  Object.assign(editForm, {
    id: row.id,
    name: row.name || '',
    roleId: row.role_id ?? null,
    status: row.status || 'active',
    password: ''
  })
  editVisible.value = true
}

const submitEdit = async () => {
  saving.value = true
  try {
    await systemApi.updateAdmin(editForm.id, {
      name: editForm.name,
      roleId: editForm.roleId,
      status: editForm.status,
      ...(editForm.password ? { password: editForm.password } : {})
    })
    ElMessage.success('已保存')
    editVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除管理员「${row.username}」？`, '删除确认', { type: 'warning' })
  await systemApi.removeAdmin(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(async () => {
  await Promise.all([load(), loadRoles()])
})
</script>

<style scoped>
.card-title {
  font-weight: 600;
}
</style>
