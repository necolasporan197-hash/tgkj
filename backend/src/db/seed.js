/**
 * 种子数据 —— 系统必需数据（管理员/套餐/礼物/配置）与演示数据（一键生成/清空）。
 */
import { all, get, run, count, tx } from './sqlite.js'
import { hashPassword, genInviteCode } from '../utils/crypto.js'
import { now } from '../utils/datetime.js'
import { SDK_PROVIDERS, defaultConfig } from '../config/sdk.js'

/** 常用城市 —— 与前端 pages/city/city.vue、pages/invite/post.vue 保持一致（12 城） */
const CITIES = ['北京', '上海', '广州', '深圳', '长沙', '成都', '杭州', '重庆', '武汉', '西安', '南京', '苏州']
const NICK_F = ['晚风', '清欢', '南栀', '小鹿', '初雪', '糖糖', '微光', '温屿']
const NICK_M = ['长风', '子墨', '南辰', '亦白', '清尘', '木易', '斯年', '青衫']
/** 演示图资源：由后端 /uploads/demo 静态托管，取代 text_to_image 首帧「生成中」占位 */
const DEMO_IMG = '/uploads/demo'
/** 头像（[0]=女 / [1]=男） */
const AVATARS = [`${DEMO_IMG}/a0.jpg`, `${DEMO_IMG}/a1.jpg`]
/** 相册 / 动态 / 邀约配图（不足时循环复用） */
const PHOTOS = [
  `${DEMO_IMG}/moment.jpg`,
  `${DEMO_IMG}/album1.jpg`,
  `${DEMO_IMG}/album2.jpg`,
  `${DEMO_IMG}/album3.jpg`
]
const TAGS = ['健身', '旅行', '美食', '摄影', '音乐', '电影', '读书', '萌宠', '滑雪', '露营']

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rndInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
/** 相对今天偏移 days 天的日期（yyyy-MM-dd），用于邀约活动日期 */
const futureDate = (days) => {
  const d = new Date(Date.now() + days * 86400000)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ==================== 系统必需 ====================
export function seedAdmin() {
  run(
    `INSERT INTO admins (username, password_hash, name, role_id, status, created_at) VALUES (?,?,?,?,?,?)`,
    ['admin', hashPassword('admin123'), '超级管理员', 1, 'active', now()]
  )
  run(`INSERT INTO roles (name, code, permissions, remark, created_at) VALUES (?,?,?,?,?)`, [
    '超级管理员',
    'super',
    JSON.stringify(['*']),
    '拥有全部权限',
    now()
  ])
  run(`INSERT INTO roles (name, code, permissions, remark, created_at) VALUES (?,?,?,?,?)`, [
    '运营',
    'operator',
    JSON.stringify(['user:read', 'moment:audit', 'verification:audit', 'withdraw:audit']),
    '仅可审核与查看',
    now()
  ])
  run(`INSERT INTO roles (name, code, permissions, remark, created_at) VALUES (?,?,?,?,?)`, [
    '客服',
    'service',
    JSON.stringify(['user:read', 'message:send', 'report:read']),
    '客服角色',
    now()
  ])
}

export function seedBaseData() {
  tx(() => {
    run(`INSERT INTO vip_packages (name, days, price, origin_price, tag, sort, status) VALUES (?,?,?,?,?,?,?)`, ['1个月VIP', 30, 68, 98, '', 1, 1])
    run(`INSERT INTO vip_packages (name, days, price, origin_price, tag, sort, status) VALUES (?,?,?,?,?,?,?)`, ['3个月VIP', 90, 168, 294, '热销', 2, 1])
    run(`INSERT INTO vip_packages (name, days, price, origin_price, tag, sort, status) VALUES (?,?,?,?,?,?,?)`, ['12个月VIP', 365, 498, 1176, '超值', 3, 1])

    const gifts = [
      ['玫瑰', `${DEMO_IMG}/rose.jpg`, 10],
      ['香水', `${DEMO_IMG}/perfume.jpg`, 50],
      ['口红', `${DEMO_IMG}/lipstick.jpg`, 88],
      ['跑车', `${DEMO_IMG}/car.jpg`, 520],
      ['游艇', `${DEMO_IMG}/yacht.jpg`, 1314]
    ]
    gifts.forEach(([name, icon, coins], i) =>
      run(`INSERT INTO gifts (name, icon, coins, sort, status) VALUES (?,?,?,?,1)`, [name, icon, coins, i + 1])
    )

    ;['推荐', '附近', '新用户', '高颜值'].forEach((name, i) =>
      run(`INSERT INTO discover_tabs (name, sort, status) VALUES (?,?,1)`, [name, i + 1])
    )
    ;['日常分享', '恋爱日记', '旅行打卡', '美食探店'].forEach((name, i) =>
      run(`INSERT INTO topics (name, sort, status, created_at) VALUES (?,?,1,?)`, [name, i + 1, now()])
    )
    ;['加微信', '约炮', '裸聊', '微商', '刷单'].forEach((w) =>
      run(`INSERT INTO sensitive_words (word, created_at) VALUES (?,?)`, [w, now()])
    )

    const cfgs = [
      ['app_name', '糖果空间', '应用名称'],
      ['withdraw_min_amount', '100', '最低提现金额（元）'],
      ['withdraw_fee_rate', '0.05', '提现手续费率'],
      ['invite_reward_coins', '1000', '邀请一人奖励金币'],
      ['female_audit_required', '1', '女性用户是否需人工审核'],
      ['wechat_unlock_coins', '200', '查看微信号所需金币'],
      ['album_unlock_coins', '500', '解锁私密相册所需金币'],
      ['notice_text', '禁止发布色情、赌博等违法违规内容', '首页公告'],
      ['customer_service_wechat', 'tangguo_kf', '客服微信']
    ]
    cfgs.forEach(([k, v, remark]) => run(`INSERT INTO configs (key, value, remark, updated_at) VALUES (?,?,?,?)`, [k, v, remark, now()]))

    run(`INSERT INTO banners (position, image, link, sort, status, created_at) VALUES (?,?,?,?,1,?)`, [
      'home',
      `${DEMO_IMG}/banner.jpg`,
      '',
      1,
      now()
    ])
  })
}

/**
 * 任务中心 / 客服等 4.8.2 新增模块的基础数据（幂等：各自为空时才写入）。
 * 独立于 seedBaseData，避免老库因 vip_packages 非空而漏种。
 */
export function seedModuleData() {
  tx(() => {
    if (!count('SELECT COUNT(*) AS c FROM tasks')) {
      const tasks = [
        ['daily_checkin', '每日签到', '每天签到领金币', 20, 1, 'daily', 'checkin', 1],
        ['complete_profile', '完善资料', '补全头像与资料，提高曝光', 100, 1, 'once', 'profile', 2],
        ['publish_moment', '发布动态', '发布 1 条动态', 30, 1, 'daily', 'publish', 3],
        ['invite_friend', '邀请好友', '成功邀请 1 位好友', 1000, 1, 'once', 'invite', 4]
      ]
      tasks.forEach(([code, title, subtitle, reward, target, type, action, sort]) =>
        run(
          `INSERT INTO tasks (code, title, subtitle, reward_coins, target, type, action, sort, status, created_at) VALUES (?,?,?,?,?,?,?,?,1,?)`,
          [code, title, subtitle, reward, target, type, action, sort, now()]
        )
      )
    }
    // 客服系统账号（role=9）：供 CustomServiceActivity 会话对端使用
    if (!count(`SELECT COUNT(*) AS c FROM users WHERE role=9`)) {
      const t = now()
      run(
        `INSERT INTO users (phone, nickname, avatar, gender, role, bio, audit_status, status, created_at, updated_at)
         VALUES (?,?,?,2,9,?, 'approved', 'active', ?, ?)`,
        [
          '10000000',
          '糖果空间客服',
          `${DEMO_IMG}/a0.jpg`,
          '官方客服，工作时间 09:00 - 21:00',
          t,
          t
        ]
      )
    }
    // 邀约活动示例（invite_events，审核通过后可见）
    if (!count('SELECT COUNT(*) AS c FROM invite_events')) {
      const authors = all(`SELECT id, city FROM users WHERE role<>9 AND status='active' ORDER BY id LIMIT 4`)
      const samples = [
        ['运动健身', ['羽毛球', '周末'], '周末想去体育馆打羽毛球，找一个水平差不多的球友，打完一起吃个饭～'],
        ['美食探店', ['探店', '火锅'], '发现一家评分很高的川菜馆，一个人吃没意思，找同城小伙伴一起去打卡。'],
        ['观影', ['电影', '悬疑'], '最近上映的悬疑片口碑不错，想约个人一起看，看完可以聊聊剧情。'],
        ['旅行出游', ['周边游', '露营'], '打算周末去郊外露营，缺个搭子，装备我这边齐全，你人来就行。']
      ]
      authors.forEach((u, i) => {
        const [theme, tags, content] = samples[i % samples.length]
        const t = now()
        run(
          `INSERT INTO invite_events (user_id, theme, tags, city, event_date, content, images, enroll_required, hot, join_count, status, created_at)
           VALUES (?,?,?,?,?,?,?,1,?,?, 'approved', ?)`,
          [
            u.id,
            theme,
            JSON.stringify(tags),
            u.city || CITIES[4],
            futureDate(i + 3),
            content,
            JSON.stringify([PHOTOS[i % PHOTOS.length]]),
            10 + i * 3,
            i,
            t
          ]
        )
      })
    }
  })
}

/** 第三方 SDK 初始配置（官方版本反编译值） */
export function seedSdkConfigs() {
  tx(() => {
    SDK_PROVIDERS.forEach((p) =>
      run(`INSERT INTO sdk_configs (provider, config, updated_at) VALUES (?,?,?)`, [
        p.key,
        JSON.stringify(defaultConfig(p)),
        now()
      ])
    )
  })
}

// ==================== 演示数据（可一键清空/重建） ====================
/** 需要清理的业务表（不含系统配置类） */
const DEMO_TABLES = [
  'moment_comments', 'moment_likes', 'moments', 'team_members', 'teams',
  'invite_records', 'unlock_records', 'wallet_transactions', 'withdrawals', 'vip_orders',
  'gift_records', 'impressions', 'reports', 'blacklist', 'visits', 'follows',
  'messages', 'conversations', 'verifications', 'submissions', 'user_tags', 'user_photos',
  'notifications', 'login_logs', 'sms_codes', 'user_tasks', 'feedbacks', 'cancellations', 'user_settings', 'users'
]

export function clearDemoData() {
  tx(() => {
    DEMO_TABLES.forEach((t) => run(`DELETE FROM ${t}`))
    run(`DELETE FROM sqlite_sequence`)
  })
}

/**
 * 生成演示用户。count 为女性数量，男性数量 = count。
 * 女性默认 approved（可被推荐），并随机留 2 个 pending 供审核演示。
 */
export function seedDemoUsers(count = 10) {
  const created = []
  tx(() => {
    for (let i = 0; i < count; i += 1) {
      created.push(insertUser({ gender: 2, idx: i, city: CITIES[i % CITIES.length] }))
    }
    for (let i = 0; i < count; i += 1) {
      created.push(insertUser({ gender: 1, idx: i, city: CITIES[i % CITIES.length] }))
    }
    // 两个待审核女性
    for (let i = 0; i < 2; i += 1) {
      const u = insertUser({ gender: 2, idx: count + i, audit: 'pending', city: CITIES[(count + i) % CITIES.length] })
      created.push(u)
      run(`INSERT INTO verifications (user_id, vtype, images, status, created_at) VALUES (?,?,?,?,?)`, [
        u.id,
        'face',
        JSON.stringify([AVATARS[0]]),
        'pending',
        now()
      ])
    }
    // 动态
    const femaleIds = created.filter((u) => u.gender === 2 && u.audit_status === 'approved').map((u) => u.id)
    const maleIds = created.filter((u) => u.gender === 1).map((u) => u.id)
    const topicIds = all('SELECT id FROM topics').map((t) => t.id)
    for (let i = 0; i < 30; i += 1) {
      const uid = femaleIds.length ? rnd(femaleIds) : rnd(maleIds)
      run(
        `INSERT INTO moments (user_id, content, images, media_type, topic_id, city, lat, lng, like_count, view_count, audit_status, status, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,'approved','normal',?)`,
        [
          uid,
          rnd(['今天天气真好，出来走走～', '有人一起看电影吗？', '周末爬山打卡！', '新学的菜，卖相还行吧', '好想去旅行✈️', '今天心情不错']),
          JSON.stringify([rnd(PHOTOS)]),
          'image',
          rnd(topicIds),
          rnd(CITIES),
          31.2 + Math.random(),
          121.4 + Math.random(),
          rndInt(0, 300),
          rndInt(10, 2000),
          now()
        ]
      )
    }
    // 钱包流水
    created.forEach((u) => {
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, amount, coins, balance_after, coins_after, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
        [u.id, 'recharge', '充值', 100, 0, 100, u.coins || 0, 'success', now()]
      )
    })
    // 邀约活动（统计口径：每个常用城市各 1 条，保证首页/列表默认城市非空）
    const inviteSamples = [
      ['运动健身', ['羽毛球', '周末'], '周末想去体育馆打羽毛球，找一个水平差不多的球友，打完一起吃个饭～'],
      ['美食探店', ['探店', '火锅'], '发现一家评分很高的川菜馆，一个人吃没意思，找同城小伙伴一起去打卡。'],
      ['观影', ['电影', '悬疑'], '最近上映的悬疑片口碑不错，想约个人一起看，看完可以聊聊剧情。'],
      ['旅行出游', ['周边游', '露营'], '打算周末去郊外露营，缺个搭子，装备我这边齐全，你人来就行。'],
      ['咖啡下午茶', ['咖啡', '聊天'], '找个人喝杯咖啡聊聊天，工作日午后有空的朋友约起来。'],
      ['跑步打卡', ['跑步', '夜跑'], '夜跑搭子在哪里，沿江跑五公里，配速六分半左右。']
    ]
    CITIES.forEach((city, i) => {
      const author = get(`SELECT id FROM users WHERE role<>9 AND status='active' AND audit_status='approved' AND city=? ORDER BY id LIMIT 1`, [city])
      if (!author) return
      const [theme, tags, content] = inviteSamples[i % inviteSamples.length]
      run(
        `INSERT INTO invite_events (user_id, theme, tags, city, event_date, content, images, enroll_required, hot, join_count, status, created_at)
         VALUES (?,?,?,?,?,?,?,1,?,?, 'approved', ?)`,
        [author.id, theme, JSON.stringify(tags), city, futureDate(3 + i), content, JSON.stringify([PHOTOS[i % PHOTOS.length]]), 10 + i * 3, i, now()]
      )
    })
  })
  return { total: created.length, female: count, male: count, pending: 2 }
}

function insertUser({ gender, idx, audit, city: cityOverride }) {
  const isFemale = gender === 2
  // 顺序分配未被占用的号码：首次生成仍为 13910000000，重复生成时自动跳过已占用号段，
  // 避免触发 users.phone 唯一约束（演示数据支持反复「添加」）。
  const prefix = isFemale ? '139' : '138'
  let n = 10000000 + idx + (isFemale ? 0 : 500000)
  let phone = ''
  do {
    phone = `${prefix}${String(n).slice(-8)}`
    n += 1
  } while (get('SELECT id FROM users WHERE phone=?', [phone]))
  const nickname = isFemale ? `${rnd(NICK_F)}${idx + 1}` : `${rnd(NICK_M)}${idx + 1}`
  const avatar = isFemale ? AVATARS[0] : AVATARS[1]
  const auditStatus = audit || 'approved'
  const city = cityOverride || rnd(CITIES)
  const code = genInviteCode()
  const t = now()
  // 新人标记（官方 data.new_user：首页「新人」栏 / 新人角标）；约 1/3 演示用户为新人
  const newUser = idx % 3 === 0 ? 1 : 0
  const r = run(
    `INSERT INTO users (phone, password_hash, nickname, avatar, gender, birthday, age, city, occupation, bio,
      role, coins, balance, invite_code, audit_status, status, online, lat, lng, last_active_at, new_user,
      audio_url, audio_duration, show_audio, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      phone,
      hashPassword('123456'),
      nickname,
      avatar,
      gender,
      `${rndInt(1990, 2003)}-0${rndInt(1, 9)}-1${rndInt(0, 9)}`,
      rndInt(20, 33),
      city,
      rnd(['设计师', '教师', '医生', '程序员', '销售', '运营']),
      rnd(['喜欢安静，也喜欢热闹', '希望遇到有趣的灵魂', '简单点，活法简单点', '认真生活，认真爱']),
      isFemale ? 1 : 2,
      rndInt(0, 20000),
      rndInt(0, 500),
      code,
      auditStatus,
      'active',
      rndInt(0, 1),
      31.2 + Math.random(),
      121.4 + Math.random(),
      t,
      newUser,
      // 语音条（官方 DetailAudio）：仅女用户带「TA的声音」
      isFemale ? `${DEMO_IMG}/voice.mp3` : '',
      isFemale ? 6 : 0,
      isFemale ? 1 : 0,
      t,
      t
    ]
  )
  const uid = Number(r.lastInsertRowid)
  // 标签
  const picked = new Set()
  while (picked.size < 3) picked.add(rnd(TAGS))
  picked.forEach((tag) => run(`INSERT INTO user_tags (user_id, tag) VALUES (?,?)`, [uid, tag]))
  // 相册：约 1/3 用户 >3 张（触发官方 tv_add_count「+N」）；约 1/4 用户含视频（触发 iv_has_video）
  const photoTotal = idx % 3 === 0 ? 6 : idx % 3 === 1 ? 4 : 3
  const hasVideo = idx % 4 === 0
  for (let i = 0; i < photoTotal; i += 1) {
    const isVideo = hasVideo && i === photoTotal - 1
    run(`INSERT INTO user_photos (user_id, url, media_type, sort, is_private, audit_status, created_at) VALUES (?,?,?,?,?,?,?)`, [
      uid,
      isVideo ? `${DEMO_IMG}/moment.jpg` : PHOTOS[i % PHOTOS.length],
      isVideo ? 'video' : 'image',
      i,
      i === 2 ? 1 : 0,
      'approved',
      t
    ])
  }
  return { id: uid, phone, gender, audit_status: auditStatus }
}

export const demoStats = () => ({
  users: count('SELECT COUNT(*) AS c FROM users'),
  female: count('SELECT COUNT(*) AS c FROM users WHERE gender=2'),
  male: count('SELECT COUNT(*) AS c FROM users WHERE gender=1'),
  pendingAudit: count(`SELECT COUNT(*) AS c FROM users WHERE gender=2 AND audit_status='pending'`),
  moments: count('SELECT COUNT(*) AS c FROM moments')
})

export { get }

// ---------------- CLI ----------------
// 直接 `node src/db/seed.js` 时提示使用 reset.js（避免误清库）
import { pathToFileURL } from 'node:url'
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('请使用：node src/db/reset.js [数量]  进行一键重建演示数据')
}
