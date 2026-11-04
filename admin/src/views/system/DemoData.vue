<template>
  <div class="page">
    <el-alert
      title="演示数据说明"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 14px"
    >
      <template #default>
        生成的演示用户登录密码统一为 123456，其中包含 2 个待审核女性账号用于审核流程演示。
      </template>
    </el-alert>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">用户总数</div>
        <div class="value">{{ stats.users ?? '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">女性用户</div>
        <div class="value brand">{{ stats.female ?? '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">男性用户</div>
        <div class="value">{{ stats.male ?? '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">待审核女性</div>
        <div class="value brand">{{ stats.pendingAudit ?? '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">动态总数</div>
        <div class="value">{{ stats.moments ?? '-' }}</div>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title"><span>生成演示数据</span></div>
      <div class="toolbar" style="margin-bottom: 0">
        <span class="muted">数量</span>
        <el-input-number v-model="count" :min="1" :max="50" />
        <el-button type="primary" :loading="seeding" @click="seed">生成演示数据</el-button>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title"><span>清空演示数据</span></div>
      <el-button type="danger" :loading="clearing" @click="clear">清空演示数据</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { systemApi } from '@/api'

const stats = ref({})
const count = ref(10)
const seeding = ref(false)
const clearing = ref(false)

const loadStats = async () => {
  stats.value = await systemApi.demoStats()
}

const seed = async () => {
  seeding.value = true
  try {
    const res = await systemApi.seedDemo(count.value)
    ElMessage.success(`已生成 ${count.value} 女 + ${count.value} 男 演示数据`)
    stats.value = res?.stats || (await systemApi.demoStats())
  } finally {
    seeding.value = false
  }
}

const clear = async () => {
  await ElMessageBox.confirm('此操作将删除全部用户与动态数据，且不可恢复，确定继续？', '清空演示数据', {
    type: 'warning'
  })
  clearing.value = true
  try {
    const res = await systemApi.clearDemo()
    ElMessage.success('演示数据已清空')
    stats.value = res || (await systemApi.demoStats())
  } finally {
    clearing.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.card-title {
  font-weight: 600;
  margin-bottom: 14px;
}
</style>
