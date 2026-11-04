<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-select v-model="query.auditStatus" placeholder="审核状态" clearable style="width: 140px">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="内容关键词" clearable style="width: 220px" @keyup.enter="search" />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <span class="spacer" />
        <span class="muted">共 {{ total }} 条</span>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="作者" min-width="180">
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
              <div>
                <div>{{ row.nickname }}</div>
                <div class="muted">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="180" show-overflow-tooltip />
        <el-table-column label="图片" min-width="160">
          <template #default="{ row }">
            <div class="imgs">
              <el-image
                v-for="(img, i) in row.images"
                :key="i"
                :src="img"
                fit="cover"
                class="img-thumb"
                :preview-src-list="row.images"
                :initial-index="i"
                preview-teleported
              />
              <span v-if="!row.images || !row.images.length" class="muted">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="话题" width="90">
          <template #default="{ row }">{{ row.topic_id ? `#${row.topic_id}` : '-' }}</template>
        </el-table-column>
        <el-table-column prop="city" label="城市" width="90" show-overflow-tooltip />
        <el-table-column prop="like_count" label="点赞" width="70" />
        <el-table-column prop="comment_count" label="评论" width="70" />
        <el-table-column prop="view_count" label="浏览" width="70" />
        <el-table-column label="审核" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="auditType(row.audit_status)" effect="light">{{ auditText(row.audit_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="audit(row, 'approve')">通过</el-button>
            <el-button link type="warning" @click="audit(row, 'reject')">驳回</el-button>
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contentApi } from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const query = reactive({ auditStatus: '', keyword: '' })

const auditType = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'info')
const auditText = (s) => ({ approved: '已通过', pending: '待审核', rejected: '已驳回' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await contentApi.moments({ ...query, page: page.value, pageSize: pageSize.value })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const search = () => {
  page.value = 1
  load()
}
const reset = () => {
  Object.assign(query, { auditStatus: '', keyword: '' })
  search()
}

const audit = async (row, action) => {
  const tip = action === 'approve' ? '通过' : '驳回'
  await ElMessageBox.confirm(`确定${tip}该动态吗？`, '提示', { type: 'warning' })
  await contentApi.auditMoment(row.id, action)
  ElMessage.success(`已${tip}`)
  load()
}

const remove = async (row) => {
  await ElMessageBox.confirm('确定删除该动态吗？删除后不可恢复。', '删除动态', { type: 'warning' })
  await contentApi.removeMoment(row.id)
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
.imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
</style>
