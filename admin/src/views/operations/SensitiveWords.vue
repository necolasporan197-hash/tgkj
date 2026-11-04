<template>
  <div class="page">
    <div class="page-card">
      <div class="card-title"><span>批量添加敏感词</span></div>
      <el-input
        v-model="input"
        type="textarea"
        :rows="3"
        placeholder="一行一个词，或用英文/中文逗号分隔"
      />
      <div style="margin-top: 12px">
        <el-button type="primary" :loading="adding" @click="add">添加</el-button>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="toolbar">
        <span class="card-title" style="margin: 0">敏感词列表</span>
        <div class="spacer" />
        <el-input v-model="keyword" placeholder="关键词过滤" clearable style="width: 220px" />
      </div>
      <el-table v-loading="loading" :data="filtered" border stripe>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="word" label="敏感词" min-width="200" />
        <el-table-column prop="created_at" label="添加时间" width="180" />
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
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { operationApi } from '@/api'

const input = ref('')
const keyword = ref('')
const list = ref([])
const loading = ref(false)
const adding = ref(false)

const filtered = computed(() => {
  const k = keyword.value.trim()
  return k ? list.value.filter((w) => (w.word || '').includes(k)) : list.value
})

const load = async () => {
  loading.value = true
  try {
    list.value = await operationApi.sensitiveWords()
  } finally {
    loading.value = false
  }
}

const parseWords = () =>
  input.value
    .split(/[\n,，]/)
    .map((w) => w.trim())
    .filter(Boolean)

const add = async () => {
  const words = parseWords()
  if (!words.length) return ElMessage.warning('请输入敏感词')
  adding.value = true
  try {
    const res = await operationApi.addSensitiveWords(words)
    ElMessage.success(`已添加 ${res?.added ?? 0} 个敏感词`)
    input.value = ''
    await load()
  } finally {
    adding.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确定删除敏感词「${row.word}」？`, '删除确认', { type: 'warning' })
  await operationApi.removeSensitiveWord(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.card-title {
  font-weight: 600;
  margin-bottom: 14px;
}
</style>
