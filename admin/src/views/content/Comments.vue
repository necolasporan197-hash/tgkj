<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span>评论列表</span>
        <span class="spacer" />
        <span class="muted">共 {{ total }} 条</span>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="评论者" min-width="170">
          <template #default="{ row }">
            <div class="author">
              <el-image
                v-if="row.avatar"
                :src="row.avatar"
                fit="cover"
                class="img-thumb"
                :preview-src-list="[row.avatar]"
                preview-teleported
              />
              <div v-else class="img-thumb" />
              <span>{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="momentContent" label="所属动态" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="评论时间" width="170" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pager"
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="load"
        @size-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contentApi } from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const load = async () => {
  loading.value = true
  try {
    const data = await contentApi.comments({ page: page.value, pageSize: pageSize.value })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const remove = async (row) => {
  await ElMessageBox.confirm('确定删除该评论吗？', '删除评论', { type: 'warning' })
  await contentApi.removeComment(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.author {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
