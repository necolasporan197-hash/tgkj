<template>
  <div class="page">
    <div class="page-card">
      <el-tabs v-model="tab">
        <el-tab-pane label="邀请记录" name="records">
          <el-table v-loading="loading" :data="list" border stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="邀请人" min-width="160">
              <template #default="{ row }">
                <div>{{ row.inviterName || '-' }}</div>
                <div class="muted">{{ row.inviterPhone || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="被邀请人" min-width="160">
              <template #default="{ row }">
                <div>{{ row.inviteeName || '-' }}</div>
                <div class="muted">{{ row.inviteePhone || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="reward_coins" label="奖励金币" width="110" />
            <el-table-column prop="created_at" label="时间" width="170" />
          </el-table>
          <div class="pager">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              v-model:current-page="page"
              v-model:page-size="pageSize"
              @current-change="load"
              @size-change="load"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="邀请排行榜" name="ranking">
          <el-table v-loading="rankLoading" :data="ranking" border stripe>
            <el-table-column label="排名" width="90">
              <template #default="{ $index }">
                <el-tag :type="rankType($index)" effect="dark">{{ $index + 1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="用户" min-width="200">
              <template #default="{ row }">
                <div class="user-cell">
                  <img class="img-thumb" :src="row.avatar" alt="" />
                  <div>
                    <div>{{ row.nickname || '-' }}</div>
                    <div class="muted">{{ row.phone || '-' }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="inviteCount" label="邀请人数" width="120" />
            <el-table-column prop="coins" label="累计奖励" width="120" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { operationApi } from '@/api'

const tab = ref('records')
const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const rankLoading = ref(false)
const ranking = ref([])

const rankType = (i) => (i === 0 ? 'danger' : i === 1 ? 'warning' : i === 2 ? 'success' : 'info')

const load = async () => {
  loading.value = true
  try {
    const data = await operationApi.invites({ page: page.value, pageSize: pageSize.value })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const loadRanking = async () => {
  rankLoading.value = true
  try {
    ranking.value = await operationApi.inviteRanking()
  } finally {
    rankLoading.value = false
  }
}

onMounted(() => {
  load()
  loadRanking()
})
</script>

<style scoped>
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
