<template>
  <div class="page">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">累计充值</div>
        <div class="value brand">¥{{ summary.recharge ?? 0 }}</div>
        <div class="sub">用户充值到账总额</div>
      </div>
      <div class="stat-card">
        <div class="label">已打款提现</div>
        <div class="value">¥{{ summary.withdrawn ?? 0 }}</div>
        <div class="sub">手续费 ¥{{ summary.withdrawnFee ?? 0 }}</div>
      </div>
      <div class="stat-card">
        <div class="label">VIP 收入</div>
        <div class="value brand">¥{{ summary.vipRevenue ?? 0 }}</div>
        <div class="sub">已支付 VIP 订单金额</div>
      </div>
      <div class="stat-card">
        <div class="label">待审核提现</div>
        <div class="value">¥{{ summary.pendingWithdraw ?? 0 }}</div>
        <div class="sub">尚未处理的提现金额</div>
      </div>
      <div class="stat-card">
        <div class="label">礼物消耗金币</div>
        <div class="value">{{ summary.giftCoins ?? 0 }} 金币</div>
        <div class="sub">赠送礼物累计消耗</div>
      </div>
      <div class="stat-card">
        <div class="label">金币流通量</div>
        <div class="value brand">{{ summary.coinCirculation ?? 0 }} 金币</div>
        <div class="sub">全站用户金币余额合计</div>
      </div>
    </div>

    <div class="page-card" style="margin-top: 14px">
      <div class="card-title"><span>指标口径说明</span></div>
      <ul class="notes">
        <li><b>累计充值</b>：全部类型为 recharge 的资金流水金额之和。</li>
        <li><b>已打款提现</b>：状态为 paid 的提现申请金额之和；手续费为其中的 fee 合计。</li>
        <li><b>VIP 收入</b>：状态为 paid 的 VIP 订单金额之和。</li>
        <li><b>待审核提现</b>：状态为 pending 的提现申请金额之和，需及时处理。</li>
        <li><b>礼物消耗金币</b>：全部礼物赠送记录消耗的金币总数。</li>
        <li><b>金币流通量</b>：全站用户当前金币余额合计，反映平台内未消耗金币规模。</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { financeApi } from '@/api'

const summary = ref({})

onMounted(async () => {
  summary.value = await financeApi.summary()
})
</script>

<style scoped>
.card-title {
  font-weight: 600;
  margin-bottom: 14px;
}
.notes {
  margin: 0;
  padding-left: 18px;
  color: #494949;
  font-size: 13px;
  line-height: 2;
}
.notes b {
  color: #171d24;
}
</style>
