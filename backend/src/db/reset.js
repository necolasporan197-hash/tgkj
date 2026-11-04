/**
 * 一键重建演示数据。
 * 用法：node src/db/reset.js [femaleCount=10]
 */
import { initSchema } from './sqlite.js'
import { clearDemoData, seedDemoUsers, demoStats } from './seed.js'

async function main() {
  const count = Math.min(50, Math.max(1, Number(process.argv[2]) || 10))
  initSchema()
  clearDemoData()
  const r = seedDemoUsers(count)
  console.log('演示数据重建完成：', r)
  console.log('当前统计：', demoStats())
  console.log('\n管理后台账号：admin / admin123')
  console.log('演示用户密码：123456（手机号见上方 seed 输出）')
}

main().catch((e) => {
  console.error('重建失败：', e)
  process.exit(1)
})
