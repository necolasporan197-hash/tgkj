<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="title">VIP 套餐</span>
        <div class="spacer" />
        <el-button @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">新增套餐</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="days" label="天数" width="90" />
        <el-table-column label="价格" width="110">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="原价" width="110">
          <template #default="{ row }">¥{{ row.origin_price ?? 0 }}</template>
        </el-table-column>
        <el-table-column prop="tag" label="标签" width="120">
          <template #default="{ row }">{{ row.tag || '-' }}</template>
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

    <el-dialog v-model="visible" :title="form.id ? '编辑套餐' : '新增套餐'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：月度会员" />
        </el-form-item>
        <el-form-item label="天数">
          <el-input-number v-model="form.days" :min="1" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="form.originPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tag" placeholder="如：超值推荐" />
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

const form = reactive({
  id: null,
  name: '',
  days: 30,
  price: 0,
  originPrice: 0,
  tag: '',
  sort: 0,
  status: 1
})

const load = async () => {
  loading.value = true
  try {
    rows.value = (await financeApi.vipPackages()) || []
  } finally {
    loading.value = false
  }
}

const reset = () => {
  Object.assign(form, { id: null, name: '', days: 30, price: 0, originPrice: 0, tag: '', sort: 0, status: 1 })
}

const openCreate = () => {
  reset()
  visible.value = true
}

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    days: row.days,
    price: row.price,
    originPrice: row.origin_price ?? 0,
    tag: row.tag || '',
    sort: row.sort || 0,
    status: row.status
  })
  visible.value = true
}

const submit = async () => {
  if (!form.name || !form.days || !form.price) return ElMessage.warning('请填写名称、天数、价格')
  submitting.value = true
  try {
    if (form.id) {
      await financeApi.updateVipPackage(form.id, {
        name: form.name,
        days: form.days,
        price: form.price,
        origin_price: form.originPrice,
        tag: form.tag,
        sort: form.sort,
        status: form.status
      })
    } else {
      await financeApi.createVipPackage({
        name: form.name,
        days: form.days,
        price: form.price,
        originPrice: form.originPrice,
        tag: form.tag,
        sort: form.sort,
        status: form.status
      })
    }
    ElMessage.success('已保存')
    visible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

const remove = (row) => {
  ElMessageBox.confirm(`确认删除套餐「${row.name}」？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await financeApi.removeVipPackage(row.id)
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
