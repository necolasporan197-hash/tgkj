<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span>印象标签统计</span>
        <span class="spacer" />
        <el-button @click="load">刷新</el-button>
      </div>
      <div v-if="stats.length" class="tag-list">
        <el-tag v-for="s in stats" :key="s.tag" size="large" effect="light" type="warning">
          {{ s.tag }} · {{ s.c }}
        </el-tag>
      </div>
      <el-empty v-else description="暂无印象标签" />
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title">最近评价记录</div>
      <el-table v-loading="loading" :data="recent" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="fromName" label="评价人" min-width="140" />
        <el-table-column prop="toName" label="被评价人" min-width="140" />
        <el-table-column prop="tag" label="标签" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="评价时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contentApi } from '@/api'

const loading = ref(false)
const stats = ref([])
const recent = ref([])

const load = async () => {
  loading.value = true
  try {
    const data = await contentApi.impressions()
    stats.value = data.stats || []
    recent.value = data.recent || []
  } finally {
    loading.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除「${row.fromName}」对「${row.toName}」的印象「${row.tag}」吗？`, '删除印象', { type: 'warning' })
  await contentApi.removeImpression(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.card-title {
  font-weight: 600;
  margin-bottom: 14px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
