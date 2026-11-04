<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <span class="card-title" style="margin: 0">SDK 配置</span>
        <div class="spacer" />
        <el-tag type="info" effect="plain">敏感字段以 **** 掩码显示，未修改时会保留原值</el-tag>
      </div>

      <el-tabs v-loading="loading" v-model="activeTab">
        <el-tab-pane v-for="p in providers" :key="p.key" :name="p.key" :label="p.name">
          <div class="sdk-desc">{{ p.desc }}</div>
          <el-form :model="forms[p.key]" label-width="140px" style="max-width: 680px">
            <el-form-item v-for="f in p.fields" :key="f.key" :label="f.label">
              <el-select v-if="f.type === 'select'" v-model="forms[p.key][f.key]" style="width: 100%">
                <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
              </el-select>
              <el-input
                v-else
                v-model="forms[p.key][f.key]"
                :type="f.secret ? 'password' : 'text'"
                :show-password="f.secret"
                :placeholder="f.secret ? '未配置' : ''"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving === p.key" @click="save(p)">保存</el-button>
              <span class="sdk-time">最近更新：{{ p.updatedAt || '—' }}</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { sdkApi } from '@/api'

const loading = ref(false)
const saving = ref('')
const activeTab = ref('')
const providers = ref([])
const forms = reactive({})

const load = async () => {
  loading.value = true
  try {
    const data = await sdkApi.list()
    providers.value = data.providers || []
    providers.value.forEach((p) => {
      forms[p.key] = { ...p.config }
    })
    if (!activeTab.value && providers.value.length) activeTab.value = providers.value[0].key
  } finally {
    loading.value = false
  }
}

const save = async (p) => {
  saving.value = p.key
  try {
    await sdkApi.save(p.key, forms[p.key])
    ElMessage.success(`${p.name} 配置已保存`)
    await load()
  } finally {
    saving.value = ''
  }
}

onMounted(load)
</script>

<style scoped>
.card-title {
  font-weight: 600;
}
.sdk-desc {
  margin-bottom: 16px;
  color: #909399;
  font-size: 13px;
}
.sdk-time {
  margin-left: 12px;
  color: #909399;
  font-size: 13px;
}
</style>
