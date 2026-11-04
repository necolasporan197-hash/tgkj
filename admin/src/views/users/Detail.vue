<template>
  <div class="page">
    <div class="page-card">
      <div class="toolbar">
        <el-button @click="goBack">返回</el-button>
        <span class="spacer" />
        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="profile">
        <el-image
          v-if="detail.avatar"
          :src="detail.avatar"
          fit="cover"
          class="big-avatar"
          :preview-src-list="[detail.avatar]"
          preview-teleported
        />
        <div v-else class="big-avatar" />
        <div class="profile-main">
          <div class="name">
            {{ detail.nickname || '未填写昵称' }}
            <el-tag size="small" :type="detail.gender === 2 ? 'danger' : 'primary'" effect="plain">
              {{ detail.gender === 2 ? '女' : '男' }}
            </el-tag>
            <el-tag v-if="detail.isVip" size="small" type="warning" effect="light">VIP</el-tag>
            <el-tag size="small" :type="auditType(detail.auditStatus)" effect="light">{{ auditText(detail.auditStatus) }}</el-tag>
          </div>
          <div class="info-grid">
            <div><span class="muted">ID：</span>{{ detail.id }}</div>
            <div><span class="muted">手机号：</span>{{ detail.phone }}</div>
            <div><span class="muted">年龄：</span>{{ detail.age || '-' }}</div>
            <div><span class="muted">城市：</span>{{ detail.city || '-' }}</div>
            <div><span class="muted">职业：</span>{{ detail.occupation || '-' }}</div>
            <div><span class="muted">微信号：</span>{{ detail.wechat || '-' }}</div>
            <div><span class="muted">金币：</span>{{ detail.coins ?? 0 }}</div>
            <div><span class="muted">余额：</span>¥{{ detail.balance ?? 0 }}</div>
            <div><span class="muted">VIP 到期：</span>{{ detail.vipExpireAt || (detail.isVip ? '已开通' : '-') }}</div>
            <div><span class="muted">邀请码：</span>{{ detail.inviteCode || '-' }}</div>
            <div>
              <span class="muted">邀请人：</span>
              <template v-if="detail.inviter">{{ detail.inviter.nickname }}（{{ detail.inviter.phone }}）</template>
              <template v-else>-</template>
            </div>
            <div><span class="muted">注册时间：</span>{{ detail.createdAt }}</div>
          </div>
          <div class="bio"><span class="muted">简介：</span>{{ detail.bio || '暂无简介' }}</div>
        </div>
      </div>
    </div>

    <div class="stat-grid" style="margin-top: 14px">
      <div class="stat-card">
        <div class="label">动态数</div>
        <div class="value">{{ detail.stats?.moments ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">获赞数</div>
        <div class="value">{{ detail.stats?.likes ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">收到礼物</div>
        <div class="value">{{ detail.stats?.gifts ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已提现</div>
        <div class="value brand">¥{{ detail.stats?.withdrawals ?? 0 }}</div>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title">相册</div>
      <div v-if="detail.photos && detail.photos.length" class="photo-grid">
        <div v-for="p in detail.photos" :key="p.id" class="photo-item">
          <el-image
            :src="p.url"
            fit="cover"
            class="photo"
            :preview-src-list="photoUrls"
            preview-teleported
          />
          <el-tag size="small" :type="auditType(p.audit_status)" effect="light" class="photo-tag">
            {{ auditText(p.audit_status) }}
          </el-tag>
        </div>
      </div>
      <el-empty v-else description="暂无相册" />
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title">认证记录</div>
      <el-table :data="detail.verifications || []" border stripe>
        <el-table-column prop="vtype" label="类型" width="110">
          <template #default="{ row }">{{ vtypeText(row.vtype) }}</template>
        </el-table-column>
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="id_number" label="身份证号" min-width="170" />
        <el-table-column label="材料" min-width="180">
          <template #default="{ row }">
            <div class="material">
              <el-image
                v-for="(img, i) in parseImages(row.images)"
                :key="i"
                :src="img"
                fit="cover"
                class="img-thumb"
                :preview-src-list="parseImages(row.images)"
                :initial-index="i"
                preview-teleported
              />
              <el-link v-if="row.video_url" type="primary" :href="row.video_url" target="_blank">视频</el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="auditType(row.status)" effect="light">{{ auditText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reject_reason" label="驳回原因" min-width="140" show-overflow-tooltip />
        <el-table-column prop="created_at" label="提交时间" width="170" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userApi } from '@/api'

const route = useRoute()
const nav = useRouter()
const detail = ref({})

const auditType = (s) => ({ approved: 'success', pending: 'warning', rejected: 'danger' }[s] || 'info')
const auditText = (s) => ({ approved: '已通过', pending: '待审核', rejected: '已驳回' }[s] || s)
const vtypeText = (t) =>
  ({ profile: '资料认证', idcard: '实名认证', face: '人脸认证', video: '视频认证', vehicle: '车辆认证' }[t] || t || '-')

const photoUrls = computed(() => (detail.value.photos || []).map((p) => p.url))

const parseImages = (s) => {
  try {
    return typeof s === 'string' ? JSON.parse(s || '[]') : s || []
  } catch {
    return []
  }
}

const load = async () => {
  detail.value = await userApi.detail(route.params.id)
}
const goBack = () => nav.back()

onMounted(load)
</script>

<style scoped>
.big-avatar {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  object-fit: cover;
  background: #f0f1f2;
  flex-shrink: 0;
}
.profile {
  display: flex;
  gap: 18px;
}
.profile-main {
  flex: 1;
  min-width: 0;
}
.name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px 16px;
  font-size: 13px;
}
.bio {
  margin-top: 12px;
  font-size: 13px;
  color: #494949;
}
.card-title {
  font-weight: 600;
  margin-bottom: 14px;
}
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.photo-item {
  position: relative;
}
.photo {
  width: 110px;
  height: 110px;
  border-radius: 8px;
  object-fit: cover;
  background: #f0f1f2;
}
.photo-tag {
  position: absolute;
  left: 6px;
  bottom: 6px;
}
.material {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
</style>
