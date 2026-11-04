<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span>待审核女性资料</span>
        <el-tag type="warning" effect="light">{{ total }} 人</el-tag>
        <span class="spacer" />
        <el-button @click="load">刷新</el-button>
      </div>

      <el-empty v-if="!loading && !list.length" description="暂无待审核资料" />

      <el-row v-else :gutter="14">
        <el-col v-for="u in list" :key="u.id" :lg="8" :md="12" :sm="24" style="margin-bottom: 14px">
          <div class="audit-card">
            <div class="head">
              <el-image
                v-if="u.avatar"
                :src="u.avatar"
                fit="cover"
                class="avatar"
                :preview-src-list="[u.avatar]"
                preview-teleported
              />
              <div v-else class="avatar" />
              <div class="head-main">
                <div class="name">{{ u.nickname || '未填写昵称' }}</div>
                <div class="muted">{{ u.age || '-' }} 岁 · {{ u.city || '未知城市' }} · {{ u.occupation || '未填写职业' }}</div>
                <div class="muted">{{ u.phone }}</div>
              </div>
            </div>
            <div class="bio">{{ u.bio || '暂无简介' }}</div>
            <div v-if="u.tags && u.tags.length" class="tags">
              <el-tag v-for="t in u.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
            </div>
            <div class="album">
              <template v-if="u.photos && u.photos.length">
                <el-image
                  v-for="(p, i) in u.photos"
                  :key="i"
                  :src="p.url"
                  fit="cover"
                  class="photo"
                  :preview-src-list="photoUrls(u.photos)"
                  :initial-index="i"
                  preview-teleported
                />
              </template>
              <span v-else class="muted">暂无相册</span>
            </div>
            <div class="actions">
              <el-button type="primary" @click="approve(u)">通过</el-button>
              <el-button type="danger" plain @click="openReject(u)">驳回</el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-pagination
        class="pager"
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="load"
        @size-change="load"
      />
    </div>

    <el-dialog v-model="rejectVisible" title="驳回资料" width="420px">
      <el-form label-width="70px">
        <el-form-item label="用户">{{ current?.nickname }}（{{ current?.phone }}）</el-form-item>
        <el-form-item label="原因">
          <el-input v-model="rejectRemark" type="textarea" :rows="3" placeholder="请填写驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="primary" @click="doReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '@/api'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const current = ref(null)
const rejectVisible = ref(false)
const rejectRemark = ref('')

const photoUrls = (photos) => (photos || []).map((p) => p.url)

const load = async () => {
  loading.value = true
  try {
    const data = await userApi.pendingAudit({ page: page.value, pageSize: pageSize.value })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const approve = async (u) => {
  await ElMessageBox.confirm(`确定通过用户「${u.nickname}」的资料审核吗？`, '提示', { type: 'warning' })
  await userApi.audit(u.id, { action: 'approve', remark: '' })
  ElMessage.success('已通过')
  load()
}

const openReject = (u) => {
  current.value = u
  rejectRemark.value = ''
  rejectVisible.value = true
}
const doReject = async () => {
  if (!rejectRemark.value) return ElMessage.warning('请填写驳回原因')
  await userApi.audit(current.value.id, { action: 'reject', remark: rejectRemark.value })
  ElMessage.success('已驳回')
  rejectVisible.value = false
  load()
}

onMounted(load)
</script>

<style scoped>
.audit-card {
  height: 100%;
  border: 1px solid #edf0f2;
  border-radius: 10px;
  padding: 14px;
}
.head {
  display: flex;
  gap: 12px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  background: #f0f1f2;
  flex-shrink: 0;
}
.head-main {
  min-width: 0;
}
.name {
  font-size: 15px;
  font-weight: 600;
}
.bio {
  margin: 10px 0;
  font-size: 13px;
  color: #494949;
  min-height: 38px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.album {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 56px;
  align-items: center;
}
.photo {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  background: #f0f1f2;
}
.actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.actions .el-button {
  flex: 1;
}
</style>
