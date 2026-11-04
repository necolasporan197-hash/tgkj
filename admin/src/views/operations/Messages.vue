<template>
  <div class="page">
    <div class="msg-layout">
      <div class="page-card conv-panel">
        <div class="card-title">
          <span>{{ isService ? '客服会话' : '用户会话' }}</span>
        </div>
        <el-scrollbar height="560px">
          <div
            v-for="c in conversations"
            :key="c.id"
            class="conv-item"
            :class="{ active: current && current.id === c.id }"
            @click="selectConv(c)"
          >
            <div class="conv-title">{{ c.nameA }} ↔ {{ c.nameB }}</div>
            <div class="muted ellipsis">{{ c.last_content || '[暂无消息]' }}</div>
            <div class="muted">{{ c.last_time || '-' }}</div>
          </div>
          <el-empty v-if="!conversations.length" :description="isService ? '暂无客服会话' : '暂无用户会话'" />
        </el-scrollbar>
        <div class="pager">
          <el-pagination
            background
            small
            layout="total, prev, pager, next"
            :total="total"
            :page-size="pageSize"
            v-model:current-page="page"
            @current-change="load"
          />
        </div>
      </div>

      <div class="page-card chat-panel">
        <div class="card-title">
          <span>{{ current ? `${current.nameA} ↔ ${current.nameB}` : '请选择会话' }}</span>
          <span v-if="current" class="muted chat-kind">{{ isService ? '客服会话' : '用户会话（只读监控）' }}</span>
        </div>

        <el-scrollbar v-if="current" height="460px">
          <div v-for="m in messages" :key="m.id" class="bubble-row" :class="{ system: m.from_id === 0 }">
            <div class="bubble">
              <div class="bubble-meta">{{ senderName(m.from_id) }} · {{ m.created_at }}</div>
              <div class="bubble-body">{{ m.content }}</div>
            </div>
          </div>
          <el-empty v-if="!messages.length" description="暂无消息" />
        </el-scrollbar>
        <el-empty v-else description="请选择左侧会话" />

        <div v-if="current && isService" class="send-bar">
          <el-input v-model="text" placeholder="以客服身份回复该用户" @keyup.enter="send" />
          <el-button type="primary" :loading="sending" @click="send">回复</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { operationApi } from '@/api'

const route = useRoute()
const chatType = computed(() => route.meta?.chatType || 'service')
const isService = computed(() => chatType.value === 'service')

const conversations = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const current = ref(null)
const messages = ref([])
const text = ref('')
const sending = ref(false)
let timer = null

/** 客服会话的对端：非 role=9 的那一方 */
const peerId = computed(() => {
  if (!current.value) return null
  return current.value.roleA === 9 ? current.value.user_b : current.value.user_a
})

const load = async () => {
  const data = await operationApi.conversations({ page: page.value, pageSize: pageSize.value, type: chatType.value })
  conversations.value = data.list || []
  total.value = data.total || 0
}

const loadMessages = async () => {
  if (!current.value) return
  messages.value = await operationApi.conversationMessages(current.value.id)
}

const selectConv = async (c) => {
  current.value = c
  text.value = ''
  await loadMessages()
}

const senderName = (fromId) => {
  if (fromId === 0) return '系统'
  if (!current.value) return `用户 ${fromId}`
  if (fromId === current.value.user_a) return current.value.roleA === 9 ? `${current.value.nameA}（客服）` : current.value.nameA
  if (fromId === current.value.user_b) return current.value.roleB === 9 ? `${current.value.nameB}（客服）` : current.value.nameB
  return `用户 ${fromId}`
}

const send = async () => {
  if (!current.value || !isService.value) return
  if (!text.value) return ElMessage.warning('请输入回复内容')
  sending.value = true
  try {
    await operationApi.sendMessage({ toId: peerId.value, content: text.value, asService: true })
    ElMessage.success('已回复')
    text.value = ''
    await loadMessages()
    await load()
  } finally {
    sending.value = false
  }
}

const refresh = async () => {
  await load()
  await loadMessages()
}

onMounted(async () => {
  await load()
  timer = setInterval(refresh, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.msg-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 14px;
}
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 14px;
}
.chat-kind {
  font-weight: 400;
  font-size: 12px;
}
.conv-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 6px;
  background: #f7f8fa;
}
.conv-item:hover,
.conv-item.active {
  background: var(--brand-light);
}
.conv-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bubble-row {
  display: flex;
  margin-bottom: 12px;
}
.bubble-row.system {
  justify-content: center;
}
.bubble {
  max-width: 70%;
  background: #f5f6f8;
  border-radius: 8px;
  padding: 8px 12px;
}
.bubble-row.system .bubble {
  background: #fff3ec;
  text-align: center;
}
.bubble-meta {
  font-size: 11px;
  color: #91979e;
  margin-bottom: 4px;
}
.bubble-body {
  font-size: 13px;
  color: #171d24;
  white-space: pre-wrap;
  word-break: break-word;
}
.send-bar {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
</style>
