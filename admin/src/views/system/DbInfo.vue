<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="card-title" style="margin: 0">数据库信息</span>
        <div class="spacer" />
        <el-button type="primary" :loading="vacuuming" @click="vacuum">压缩数据库</el-button>
      </div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="数据库文件">{{ info.file || '-' }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">
          {{ info.sizeKb ?? 0 }} KB（{{ sizeMb }} MB）
        </el-descriptions-item>
        <el-descriptions-item label="表数量">{{ tables.length }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title"><span>数据表</span></div>
      <el-table v-loading="loading" :data="tables" border stripe>
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="name" label="表名" min-width="220" />
        <el-table-column prop="rows" label="行数" width="140" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { systemApi } from '@/api'

const loading = ref(false)
const vacuuming = ref(false)
const info = ref({})

const tables = computed(() => [...(info.value.tables || [])].sort((a, b) => (b.rows || 0) - (a.rows || 0)))
const sizeMb = computed(() => ((info.value.sizeKb || 0) / 1024).toFixed(2))

const load = async () => {
  loading.value = true
  try {
    info.value = await systemApi.dbInfo()
  } finally {
    loading.value = false
  }
}

const vacuum = async () => {
  await ElMessageBox.confirm('压缩数据库会重建数据库文件，期间可能短暂锁库，确定继续？', '压缩确认', {
    type: 'warning'
  })
  vacuuming.value = true
  try {
    await systemApi.vacuum()
    ElMessage.success('数据库已压缩')
    await load()
  } finally {
    vacuuming.value = false
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
