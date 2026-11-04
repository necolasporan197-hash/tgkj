<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="title">礼物管理</span>
        <div class="spacer" />
        <el-button @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">新增礼物</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="图标" width="90">
          <template #default="{ row }">
            <el-image
              v-if="row.icon"
              :src="row.icon"
              fit="cover"
              class="img-thumb"
              :preview-src-list="[row.icon]"
              preview-teleported
            />
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="金币价格" width="110">
          <template #default="{ row }">{{ row.coins }} 金币</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '上架' : '下架' }}
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

    <el-dialog v-model="visible" :title="form.id ? '编辑礼物' : '新增礼物'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：玫瑰花" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="粘贴图片 URL" />
        </el-form-item>
        <el-form-item label="金币价格">
          <el-input-number v-model="form.coins" :min="1" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" />
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
import { financeApi } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const rows = ref([])
const visible = ref(false)

const form = reactive({ id: null, name: '', icon: '', coins: 1, sort: 0, status: 1 })

const load = async () => {
  loading.value = true
  try {
    rows.value = (await financeApi.gifts()) || []
  } finally {
    loading.value = false
  }
}

const reset = () => {
  Object.assign(form, { id: null, name: '', icon: '', coins: 1, sort: 0, status: 1 })
}

const openCreate = () => {
  reset()
  visible.value = true
}

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    icon: row.icon || '',
    coins: row.coins,
    sort: row.sort || 0,
    status: row.status
  })
  visible.value = true
}

const submit = async () => {
  if (!form.name || !form.coins) return ElMessage.warning('请填写名称与金币价格')
  submitting.value = true
  try {
    const payload = {
      name: form.name,
      icon: form.icon,
      coins: form.coins,
      sort: form.sort,
      status: form.status
    }
    if (form.id) await financeApi.updateGift(form.id, payload)
    else await financeApi.createGift(payload)
    ElMessage.success('已保存')
    visible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

const remove = (row) => {
  ElMessageBox.confirm(`确认删除礼物「${row.name}」？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await financeApi.removeGift(row.id)
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
