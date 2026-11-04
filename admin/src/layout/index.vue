<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="logo">
        <span class="dot" />
        <span v-show="!collapsed" class="text">糖果空间 · 后台</span>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="route.path"
          :collapse="collapsed"
          :collapse-transition="false"
          background-color="#171d24"
          text-color="#c9ced4"
          active-text-color="#ff5000"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataLine /></el-icon>
            <template #title>数据看板</template>
          </el-menu-item>
          <el-sub-menu v-for="g in groups" :key="g.name" :index="g.name">
            <template #title>
              <el-icon><component :is="g.icon" /></el-icon>
              <span>{{ g.name }}</span>
            </template>
            <el-menu-item v-for="m in g.items" :key="m.path" :index="m.path">
              <el-icon><component :is="m.icon" /></el-icon>
              <template #title>{{ m.title }}</template>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="header">
        <el-icon class="collapse-btn" @click="collapsed = !collapsed">
          <component :is="collapsed ? 'Expand' : 'Fold'" />
        </el-icon>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>{{ route.meta?.group || '工作台' }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ route.meta?.title || '数据看板' }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="spacer" />
        <el-tag v-if="roleName" type="warning" effect="plain" size="small">{{ roleName }}</el-tag>
        <el-dropdown @command="onCommand">
          <span class="admin-name">
            <el-icon><UserFilled /></el-icon>
            {{ adminName }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password">修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <keep-alive :max="8">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>

    <el-dialog v-model="pwdVisible" title="修改密码" width="420px">
      <el-form label-width="90px">
        <el-form-item label="原密码"><el-input v-model="pwd.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="pwd.newPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="submitPwd">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authApi } from '@/api'
import router from '@/router'

const route = useRoute()
const nav = useRouter()
const collapsed = ref(false)
const adminName = ref('管理员')
const roleName = ref('')
const pwdVisible = ref(false)
const pwdLoading = ref(false)
const pwd = reactive({ oldPassword: '', newPassword: '' })

/** 按 meta.group 聚合菜单 */
const groups = computed(() => {
  const all = router.getRoutes().filter((r) => r.meta?.title && r.meta.group && !r.meta.hidden)
  const map = new Map()
  all.forEach((r) => {
    const g = r.meta.group
    if (!map.has(g)) map.set(g, { name: g, icon: GROUP_ICON[g] || 'Menu', items: [] })
    map.get(g).items.push({ path: `/${r.path.replace(/^\//, '')}`, title: r.meta.title, icon: r.meta.icon })
  })
  return [...map.values()]
})

const GROUP_ICON = { 用户: 'User', 内容: 'ChatDotRound', 财务: 'Money', 运营: 'Operation', 系统: 'Setting' }

const onCommand = async (cmd) => {
  if (cmd === 'password') {
    pwd.oldPassword = ''
    pwd.newPassword = ''
    pwdVisible.value = true
    return
  }
  await ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning' })
  await authApi.logout().catch(() => {})
  localStorage.removeItem('tggy_admin_token')
  nav.push('/login')
}

const submitPwd = async () => {
  if (!pwd.newPassword || pwd.newPassword.length < 6) return ElMessage.warning('新密码至少 6 位')
  pwdLoading.value = true
  try {
    await authApi.changePassword({ ...pwd })
    ElMessage.success('密码已修改，请重新登录')
    pwdVisible.value = false
    localStorage.removeItem('tggy_admin_token')
    nav.push('/login')
  } finally {
    pwdLoading.value = false
  }
}

onMounted(async () => {
  try {
    const p = await authApi.profile()
    adminName.value = p.name || p.username
    roleName.value = p.roleName
  } catch {
    /* 拦截器已处理 */
  }
})
</script>

<style scoped>
.layout {
  height: 100%;
}
.aside {
  background: #171d24;
  transition: width 0.2s;
  overflow: hidden;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  color: #fff;
  font-weight: 700;
  white-space: nowrap;
}
.logo .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--brand);
  flex: none;
}
.aside :deep(.el-menu) {
  border-right: none;
}
.header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-bottom: 1px solid #edf0f2;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #494949;
}
.spacer {
  flex: 1;
}
.admin-name {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #494949;
  font-size: 14px;
  outline: none;
}
.main {
  background: #f5f6f8;
  padding: 0;
}
</style>
