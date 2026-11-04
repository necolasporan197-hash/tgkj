<template>
  <div class="login-wrap">
    <div class="login-box">
      <div class="brand">
        <div class="logo-dot" />
        <h1>糖果空间</h1>
        <p>管理后台 · com.sheguo.tggy v4.8.2</p>
      </div>
      <el-form :model="form" @submit.prevent="submit">
        <el-form-item>
          <el-input v-model="form.username" size="large" placeholder="管理员账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            show-password
            placeholder="登录密码"
            :prefix-icon="Lock"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="submit">登 录</el-button>
      </el-form>
      <div class="tip">默认账号 admin / admin123，首次登录后请立即修改密码</div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '@/api'
import { setToken } from '@/api/request'

const nav = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '' })

const submit = async () => {
  if (!form.username || !form.password) return ElMessage.warning('请输入账号与密码')
  loading.value = true
  try {
    const data = await authApi.login({ ...form })
    setToken(data.token)
    ElMessage.success('登录成功')
    nav.push(route.query.redirect || '/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(1200px 600px at 20% 10%, #2b333c 0%, #171d24 60%, #0f1418 100%);
}
.login-box {
  width: 380px;
  padding: 34px 30px 26px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}
.brand {
  text-align: center;
  margin-bottom: 22px;
}
.logo-dot {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--brand);
  margin: 0 auto 12px;
}
.brand h1 {
  margin: 0;
  font-size: 22px;
  color: #171d24;
}
.brand p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #91979e;
}
.submit {
  width: 100%;
  margin-top: 6px;
}
.tip {
  margin-top: 14px;
  font-size: 12px;
  color: #91979e;
  text-align: center;
}
</style>
