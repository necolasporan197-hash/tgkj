<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="title">Banner 管理</span>
        <div class="spacer" />
        <el-button @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">新增 Banner</el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="预览图" width="100">
          <template #default="{ row }">
            <el-image :src="row.image" fit="cover" class="img-thumb" :preview-src-list="[row.image]" preview-teleported />
          </template>
        </el-table-column>
        <el-table-column label="位置" width="110">
          <template #default="{ row }">{{ positionText(row.position) }}</template>
        </el-table-column>
        <el-table-column prop="link" label="跳转链接" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.link || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '上架' : '下架' }}
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

    <el-dialog v-model="visible" :title="form.id ? '编辑 Banner' : '新增 Banner'" width="520px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="位置">
          <el-select v-model="form.position" style="width: 100%">
            <el-option label="首页" value="home" />
            <el-option label="发现" value="discover" />
            <el-option label="我的" value="mine" />
            <el-option label="VIP页" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片">
          <div class="img-field">
            <el-input v-model="form.image" placeholder="粘贴图片 URL" />
            <el-upload :show-file-list="false" :before-upload="handleUpload" accept="image/*">
              <el-button>上传</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item v-if="form.image" label="预览">
          <el-image :src="form.image" fit="cover" class="img-thumb" :preview-src-list="[form.image]" preview-teleported />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.link" placeholder="点击跳转的链接，可留空" />
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
import { operationApi, uploadFile } from '@/api'

const loading = ref(false)
const submitting = ref(false)
const rows = ref([])
const visible = ref(false)

const form = reactive({ id: null, position: 'home', image: '', link: '', sort: 0, status: 1 })

const positionText = (p) => ({ home: '首页', discover: '发现', mine: '我的', vip: 'VIP页' }[p] || p || '-')

const load = async () => {
  loading.value = true
  try {
    rows.value = (await operationApi.banners()) || []
  } finally {
    loading.value = false
  }
}

const reset = () => {
  Object.assign(form, { id: null, position: 'home', image: '', link: '', sort: 0, status: 1 })
}

const openCreate = () => {
  reset()
  visible.value = true
}

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    position: row.position || 'home',
    image: row.image,
    link: row.link || '',
    sort: row.sort || 0,
    status: row.status
  })
  visible.value = true
}

const handleUpload = async (file) => {
  const res = await uploadFile(file)
  form.image = res.url
  ElMessage.success('上传成功')
  return false
}

const submit = async () => {
  if (!form.image) return ElMessage.warning('请上传或填写图片')
  submitting.value = true
  try {
    const payload = {
      position: form.position,
      image: form.image,
      link: form.link,
      sort: form.sort,
      status: form.status
    }
    if (form.id) await operationApi.updateBanner(form.id, payload)
    else await operationApi.createBanner(payload)
    ElMessage.success('已保存')
    visible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

const remove = (row) => {
  ElMessageBox.confirm('确认删除该 Banner？', '删除确认', { type: 'warning' })
    .then(async () => {
      await operationApi.removeBanner(row.id)
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
.img-field {
  display: flex;
  gap: 10px;
  width: 100%;
}
</style>
