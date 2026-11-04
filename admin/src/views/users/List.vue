<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="手机号 / 昵称 / ID" clearable style="width: 200px" @keyup.enter="search" />
        <el-select v-model="query.gender" placeholder="性别" clearable style="width: 110px">
          <el-option label="男" value="1" />
          <el-option label="女" value="2" />
        </el-select>
        <el-select v-model="query.auditStatus" placeholder="审核状态" clearable style="width: 130px">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-select v-model="query.status" placeholder="账号状态" clearable style="width: 130px">
          <el-option label="正常" value="active" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
        <el-input v-model="query.city" placeholder="城市" clearable style="width: 130px" @keyup.enter="search" />
        <el-select v-model="query.isVip" placeholder="是否 VIP" clearable style="width: 120px">
          <el-option label="仅 VIP" value="1" />
          <el-option label="非 VIP" value="0" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <span class="spacer" />
        <span class="muted">当前筛选结果 {{ total }} 条</span>
      </div>

      <el-table v-loading="loading" :data="list" row-key="id" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="头像" width="70">
          <template #default="{ row }">
            <el-image
              v-if="row.avatar"
              :src="row.avatar"
              fit="cover"
              class="img-thumb"
              :preview-src-list="[row.avatar]"
              preview-teleported
            />
            <div v-else class="img-thumb" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="110" show-overflow-tooltip />
        <el-table-column label="性别" width="70">
          <template #default="{ row }">{{ row.gender === 2 ? '女' : '男' }}</template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="70" />
        <el-table-column prop="city" label="城市" width="90" show-overflow-tooltip />
        <el-table-column prop="occupation" label="职业" width="100" show-overflow-tooltip />
        <el-table-column prop="coins" label="金币" width="80" />
        <el-table-column label="余额" width="90">
          <template #default="{ row }">¥{{ row.balance ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="VIP" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.isVip" type="warning" size="small" effect="light">{{ row.vipExpireAt || '长期' }}</el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="auditType(row.auditStatus)" effect="light">{{ auditText(row.auditStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'" effect="light">
              {{ row.status === 'active' ? '正常' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="detail(row)">详情</el-button>
            <el-button
              v-if="row.gender === 2 && row.auditStatus === 'pending'"
              link
              type="primary"
              @click="openAudit(row)"
            >
              审核
            </el-button>
            <el-button link type="primary" @click="toggleStatus(row)">{{ row.status === 'active' ? '禁用' : '启用' }}</el-button>
            <el-button link type="primary" @click="resetPwd(row)">重置密码</el-button>
            <el-button link type="primary" @click="openAdjust(row)">调整</el-button>
            <el-button v-if="row.isVip" link type="danger" @click="cancelVip(row)">取消VIP</el-button>
            <el-button v-else link type="primary" @click="grantVip(row)">开通VIP</el-button>
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

    <el-dialog v-model="auditVisible" title="女性资料审核" width="420px">
      <el-form label-width="70px">
        <el-form-item label="用户">{{ current?.nickname }}（{{ current?.phone }}）</el-form-item>
        <el-form-item label="备注">
          <el-input v-model="auditRemark" type="textarea" :rows="3" placeholder="驳回时请填写原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button @click="doAudit('reject')">驳回</el-button>
        <el-button type="primary" @click="doAudit('approve')">通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustVisible" title="调整金币 / 余额" width="420px">
      <el-form label-width="90px">
        <el-form-item label="用户">{{ current?.nickname }}（{{ current?.phone }}）</el-form-item>
        <el-form-item label="金币增减">
          <el-input-number v-model="adjust.coins" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="余额增减">
          <el-input-number v-model="adjust.amount" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="adjust.remark" type="textarea" :rows="2" placeholder="可填写调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="doAdjust">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '@/api'

const nav = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const query = reactive({ keyword: '', gender: '', auditStatus: '', status: '', city: '', isVip: '' })

const current = ref(null)
const auditVisible = ref(false)
const auditRemark = ref('')
const adjustVisible = ref(false)
const adjust = reactive({ coins: 0, amount: 0, remark: '' })

const auditType = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'info')
const auditText = (s) => ({ approved: '已通过', pending: '待审核', rejected: '已驳回' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const data = await userApi.list({ ...query, page: page.value, pageSize: pageSize.value })
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
  Object.assign(query, { keyword: '', gender: '', auditStatus: '', status: '', city: '', isVip: '' })
  search()
}

const detail = (row) => nav.push(`/users/${row.id}`)

const openAudit = (row) => {
  current.value = row
  auditRemark.value = ''
  auditVisible.value = true
}
const doAudit = async (action) => {
  if (action === 'reject' && !auditRemark.value) return ElMessage.warning('请填写驳回原因')
  await userApi.audit(current.value.id, { action, remark: auditRemark.value })
  ElMessage.success(action === 'approve' ? '已通过' : '已驳回')
  auditVisible.value = false
  load()
}

const toggleStatus = async (row) => {
  const next = row.status === 'active' ? 'disabled' : 'active'
  await ElMessageBox.confirm(`确定要${next === 'disabled' ? '禁用' : '启用'}用户「${row.nickname}」吗？`, '提示', { type: 'warning' })
  await userApi.setStatus(row.id, next)
  ElMessage.success('操作成功')
  load()
}

const resetPwd = async (row) => {
  const { value } = await ElMessageBox.prompt('请输入新密码', '重置密码', {
    inputValue: '123456',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
  await userApi.resetPassword(row.id, value || '123456')
  ElMessage.success('密码已重置')
}

const openAdjust = (row) => {
  current.value = row
  adjust.coins = 0
  adjust.amount = 0
  adjust.remark = ''
  adjustVisible.value = true
}
const doAdjust = async () => {
  if (!adjust.coins && !adjust.amount) return ElMessage.warning('请填写调整的金币或金额')
  await userApi.adjust(current.value.id, { coins: adjust.coins, amount: adjust.amount, remark: adjust.remark })
  ElMessage.success('调整成功')
  adjustVisible.value = false
  load()
}

const grantVip = async (row) => {
  await ElMessageBox.confirm(`确定为用户「${row.nickname}」开通 30 天 VIP 吗？`, '开通 VIP', { type: 'warning' })
  await userApi.setVip(row.id, { days: 30 })
  ElMessage.success('已开通 VIP')
  load()
}
const cancelVip = async (row) => {
  await ElMessageBox.confirm(`确定取消用户「${row.nickname}」的 VIP 吗？`, '取消 VIP', { type: 'warning' })
  await userApi.setVip(row.id, { cancel: true })
  ElMessage.success('已取消 VIP')
  load()
}

onMounted(load)
</script>
