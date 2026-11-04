-- =====================================================================
-- 糖果空间 (com.sheguo.tggy) 逆向重建 —— SQLite 表结构
-- 说明：全部时间字段统一存 'YYYY-MM-DD HH:mm:ss'（北京时间字符串），便于直出。
-- =====================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------- 用户 ----------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  nickname      TEXT,
  avatar        TEXT,
  gender        INTEGER DEFAULT 1,          -- 1=男 2=女
  birthday      TEXT,
  age           INTEGER,
  city          TEXT,
  occupation    TEXT,
  wechat        TEXT,                       -- 微信号（VIP 才可看）
  bio           TEXT,
  height        INTEGER,
  weight        INTEGER,
  feeling       TEXT,                       -- 感情状态（官方 profile_female_basic_fragment，女用户）
  role          INTEGER DEFAULT 1,          -- 1=普通女性 2=普通男性 9=客服
  is_vip        INTEGER DEFAULT 0,
  vip_expire_at TEXT,
  coins         INTEGER DEFAULT 0,          -- 金币
  balance       REAL DEFAULT 0,             -- 余额（元）
  invite_code   TEXT UNIQUE,
  invited_by    INTEGER,
  audit_status  TEXT DEFAULT 'pending',     -- 女性用户：pending/approved/rejected
  audit_remark  TEXT,
  status        TEXT DEFAULT 'active',      -- active/disabled
  online        INTEGER DEFAULT 0,
  new_user      INTEGER DEFAULT 0,          -- 新人（官方 data.new_user，首页「新人」角标/新人栏）
  lat           REAL,
  lng           REAL,
  im_token      TEXT,
  last_active_at TEXT,
  young_model   INTEGER DEFAULT 0,          -- 青少年模式开关（YoungModelActivity）
  young_pwd     TEXT,                       -- 青少年模式 4 位密码（scrypt）
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_city   ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender, audit_status, status);

-- ---------- 管理员 / 角色 ----------
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role_id       INTEGER,
  status        TEXT DEFAULT 'active',
  last_login_at TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  permissions TEXT DEFAULT '[]',            -- JSON 数组
  remark      TEXT,
  created_at  TEXT NOT NULL
);

-- ---------- 用户资料扩展 ----------
CREATE TABLE IF NOT EXISTS user_photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  url        TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',          -- image/video/audio
  cover      TEXT,
  sort       INTEGER DEFAULT 0,
  is_private INTEGER DEFAULT 0,             -- 1=相册（VIP 解锁可见）
  audit_status TEXT DEFAULT 'approved',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_user ON user_photos(user_id);

CREATE TABLE IF NOT EXISTS user_tags (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tag     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tags_user ON user_tags(user_id);

CREATE TABLE IF NOT EXISTS follows (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  target_id  INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, target_id)
);

CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,              -- 访客
  target_id  INTEGER NOT NULL,              -- 被访问者
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visits_target ON visits(target_id);

CREATE TABLE IF NOT EXISTS blacklist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  target_id  INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, target_id)
);

-- ---------- 首页运营 ----------
CREATE TABLE IF NOT EXISTS discover_tabs (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL,
  sort   INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS banners (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  position TEXT DEFAULT 'home',             -- home/discover/mine/vip
  image    TEXT NOT NULL,
  link     TEXT,
  sort     INTEGER DEFAULT 0,
  status   INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- ---------- 动态 ----------
CREATE TABLE IF NOT EXISTS topics (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL,
  sort   INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  content       TEXT,
  images        TEXT DEFAULT '[]',          -- JSON 数组
  media_type    TEXT DEFAULT 'text',        -- text/image/video/audio
  video_url     TEXT,
  audio_url     TEXT,
  audio_duration INTEGER DEFAULT 0,
  topic_id      INTEGER,
  city          TEXT,
  lat           REAL,
  lng           REAL,
  like_count    INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count    INTEGER DEFAULT 0,
  audit_status  TEXT DEFAULT 'approved',    -- pending/approved/rejected
  status        TEXT DEFAULT 'normal',      -- normal/deleted
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_moments_user ON moments(user_id, status);

CREATE TABLE IF NOT EXISTS moment_likes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  moment_id  INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(moment_id, user_id)
);

CREATE TABLE IF NOT EXISTS moment_comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  moment_id  INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  content    TEXT NOT NULL,
  reply_to   INTEGER,
  status     TEXT DEFAULT 'normal',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_moment ON moment_comments(moment_id, status);

-- ---------- 消息 / 会话 ----------
CREATE TABLE IF NOT EXISTS conversations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a       INTEGER NOT NULL,
  user_b       INTEGER NOT NULL,
  last_content TEXT,
  last_time    TEXT,
  unread_a     INTEGER DEFAULT 0,
  unread_b     INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL,
  UNIQUE(user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  conv_id     INTEGER,
  from_id     INTEGER NOT NULL,             -- 0 = 系统
  to_id       INTEGER NOT NULL,
  content     TEXT,
  msg_type    TEXT DEFAULT 'text',          -- text/image/voice/video/system
  extra       TEXT,                          -- JSON
  is_read     INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conv_id, id);
CREATE INDEX IF NOT EXISTS idx_msg_to   ON messages(to_id, is_read);

-- ---------- 钱包 ----------
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  type          TEXT NOT NULL,              -- recharge/withdraw/coin_in/coin_out/reward/unlock
  title         TEXT,
  amount        REAL DEFAULT 0,
  coins         INTEGER DEFAULT 0,
  balance_after REAL DEFAULT 0,
  coins_after   INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'success',
  remark        TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id, created_at);

CREATE TABLE IF NOT EXISTS withdrawals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  amount        REAL NOT NULL,
  fee           REAL DEFAULT 0,
  actual_amount REAL DEFAULT 0,
  account_type  TEXT DEFAULT 'alipay',      -- alipay/wechat/bank
  account_no    TEXT,
  account_name  TEXT,
  status        TEXT DEFAULT 'pending',     -- pending/approved/rejected/paid
  remark        TEXT,
  created_at    TEXT NOT NULL,
  reviewed_at   TEXT,
  reviewer_id   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_withdraw_status ON withdrawals(status, created_at);

-- ---------- VIP ----------
CREATE TABLE IF NOT EXISTS vip_packages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  days        INTEGER NOT NULL,
  price       REAL NOT NULL,
  origin_price REAL,
  tag         TEXT,
  sort        INTEGER DEFAULT 0,
  status      INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS vip_orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  package_id INTEGER NOT NULL,
  amount     REAL NOT NULL,
  days       INTEGER NOT NULL,
  pay_type   TEXT DEFAULT 'alipay',
  status     TEXT DEFAULT 'pending',        -- pending/paid/cancelled
  created_at TEXT NOT NULL,
  paid_at    TEXT
);

CREATE TABLE IF NOT EXISTS unlock_records (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  target_id  INTEGER NOT NULL,
  unlock_type TEXT DEFAULT 'wechat',        -- wechat/album/video
  coins      INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- ---------- 认证 ----------
CREATE TABLE IF NOT EXISTS verifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  vtype         TEXT NOT NULL,              -- profile/idcard/face/video/vehicle
  real_name     TEXT,
  id_number     TEXT,
  images        TEXT DEFAULT '[]',
  video_url     TEXT,
  status        TEXT DEFAULT 'pending',     -- pending/approved/rejected
  reject_reason TEXT,
  created_at    TEXT NOT NULL,
  reviewed_at   TEXT,
  reviewer_id   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_verif_status ON verifications(status, vtype);

-- ---------- 邀请 / 团队 ----------
CREATE TABLE IF NOT EXISTS invite_records (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id   INTEGER NOT NULL,
  invitee_id   INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invite_inviter ON invite_records(inviter_id);

CREATE TABLE IF NOT EXISTS teams (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  leader_id    INTEGER NOT NULL,
  notice       TEXT,
  member_count INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'active',
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id   INTEGER NOT NULL,
  user_id   INTEGER NOT NULL,
  role      TEXT DEFAULT 'member',          -- leader/member
  joined_at TEXT NOT NULL,
  UNIQUE(team_id, user_id)
);

-- ---------- 投稿 ----------
CREATE TABLE IF NOT EXISTS submissions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  title      TEXT,
  content    TEXT,
  images     TEXT DEFAULT '[]',
  status     TEXT DEFAULT 'pending',        -- pending/approved/rejected
  remark     TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

-- ---------- 礼物 / 红包 ----------
CREATE TABLE IF NOT EXISTS gifts (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL,
  icon   TEXT,
  coins  INTEGER NOT NULL,
  sort   INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gift_records (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id    INTEGER NOT NULL,
  to_id      INTEGER NOT NULL,
  gift_id    INTEGER NOT NULL,
  gift_name  TEXT,
  count      INTEGER DEFAULT 1,
  coins      INTEGER DEFAULT 0,
  moment_id  INTEGER,
  created_at TEXT NOT NULL
);

-- ---------- 印象 / 评价 ----------
CREATE TABLE IF NOT EXISTS impressions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,              -- 评价人
  target_id  INTEGER NOT NULL,              -- 被评价人
  tag        TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_impression_target ON impressions(target_id);

-- ---------- 举报 / 客服 ----------
CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  target_id   INTEGER NOT NULL,
  target_type TEXT DEFAULT 'user',          -- user/moment/comment
  target_ref  INTEGER,
  reason      TEXT,
  images      TEXT DEFAULT '[]',
  status      TEXT DEFAULT 'pending',       -- pending/handled/rejected
  remark      TEXT,
  created_at  TEXT NOT NULL,
  handled_at  TEXT
);

-- ---------- 短信 / 图形验证码 ----------
CREATE TABLE IF NOT EXISTS sms_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  scene      TEXT DEFAULT 'login',
  used       INTEGER DEFAULT 0,
  expire_at  TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_codes(phone, scene, used);

-- ---------- 系统 ----------
CREATE TABLE IF NOT EXISTS configs (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  remark     TEXT,
  updated_at TEXT
);

-- 第三方 SDK 配置（按 provider 存一条，config 为扁平字段的 JSON 字符串）
CREATE TABLE IF NOT EXISTS sdk_configs (
  provider   TEXT PRIMARY KEY,              -- rongcloud/amap/jpush/openinstall/tencent-face/payment/sms
  config     TEXT,                          -- JSON
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER DEFAULT 0,             -- 0=全体
  title      TEXT NOT NULL,
  content    TEXT,
  ntype      TEXT DEFAULT 'system',         -- system/audit/order
  is_read    INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_noti_user ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS sensitive_words (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  word       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER,
  admin_name TEXT,
  module     TEXT,
  action     TEXT,
  target     TEXT,
  detail     TEXT,
  ip         TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_time ON admin_logs(created_at);

CREATE TABLE IF NOT EXISTS login_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  phone      TEXT,
  ip         TEXT,
  ua         TEXT,
  success    INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- =====================================================================
-- 以下为按 4.8.2 官方类名（com.sheguo.tggy.*）补齐的模块表
-- =====================================================================

-- ---------- 任务中心（business.main.mine.TaskCenterActivity） ----------
CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL UNIQUE,        -- 任务标识，如 daily_checkin / complete_profile
  title        TEXT NOT NULL,
  subtitle     TEXT,
  icon         TEXT,
  reward_coins INTEGER DEFAULT 0,           -- 完成奖励金币
  target       INTEGER DEFAULT 1,           -- 需完成次数
  type         TEXT DEFAULT 'daily',        -- daily=每日重置 once=一次性
  action       TEXT,                        -- 客户端跳转标识
  sort         INTEGER DEFAULT 0,
  status       INTEGER DEFAULT 1,           -- 1=启用 0=停用
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  task_code  TEXT NOT NULL,
  progress   INTEGER DEFAULT 0,
  status     TEXT DEFAULT 'ongoing',        -- ongoing=进行中 done=可领取 claimed=已领取
  day        TEXT,                          -- 每日任务归属日 yyyy-MM-dd（每日重置）
  claimed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, task_code, day)
);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user ON user_tasks(user_id, day);

-- ---------- 意见反馈（activity.ui.activity.FeedbackActivity） ----------
CREATE TABLE IF NOT EXISTS feedbacks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  content    TEXT NOT NULL,
  images     TEXT,                          -- JSON 数组
  contact    TEXT,
  status     TEXT DEFAULT 'pending',        -- pending=待处理 replied=已回复 closed=已关闭
  reply      TEXT,
  replied_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id, status);

-- ---------- 账号注销（activity.ui.activity.CancellationActivity / CancellationReasonActivity） ----------
CREATE TABLE IF NOT EXISTS cancellations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  reason     TEXT,
  detail     TEXT,
  status     TEXT DEFAULT 'pending',        -- pending=待处理 approved=已注销 rejected=已驳回
  remark     TEXT,
  handled_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cancellations_status ON cancellations(status, user_id);

-- ---------- 隐私权限 / 消息提醒设置（JurisdictionSettingActivity / NotifyOpenActivity） ----------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id        INTEGER PRIMARY KEY,
  allow_nearby   INTEGER DEFAULT 1,         -- 出现在「附近」
  allow_stranger INTEGER DEFAULT 1,         -- 允许陌生人私信
  show_online    INTEGER DEFAULT 1,         -- 显示在线状态
  show_distance  INTEGER DEFAULT 1,         -- 显示距离
  hide_visitors  INTEGER DEFAULT 0,         -- 隐身访问他人主页
  notify_msg     INTEGER DEFAULT 1,
  notify_like    INTEGER DEFAULT 1,
  notify_comment INTEGER DEFAULT 1,
  notify_follow  INTEGER DEFAULT 1,
  notify_system  INTEGER DEFAULT 1,
  notify_chat    INTEGER DEFAULT 1,         -- 私聊通知
  notify_city    INTEGER DEFAULT 1,         -- 同城动态
  notify_income  INTEGER DEFAULT 1,         -- 收益提醒
  notify_visitor INTEGER DEFAULT 1,         -- 谁看了我
  notify_enroll  INTEGER DEFAULT 1,         -- 报名通知
  -- fragment_private_setting.xml（隐私设置）3 项开关
  photo_pay      INTEGER DEFAULT 0,         -- 相册/视频付费查看
  hide_home      INTEGER DEFAULT 0,         -- 在首页和动态隐藏我
  hide_distance  INTEGER DEFAULT 0,         -- 对他人隐藏我的距离
  updated_at     TEXT NOT NULL
);

-- ---------- 邀约活动（invite_post_fragment.xml / item_invite.xml / invite_detail_fragment2.xml） ----------
CREATE TABLE IF NOT EXISTS invite_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,          -- 发起人
  theme           TEXT NOT NULL,             -- 活动主题（THEMES）
  tags            TEXT,                      -- JSON 数组，最多 3 个
  city            TEXT,
  event_date      TEXT,                      -- 活动日期
  content         TEXT,                      -- 活动介绍 / 内容补充
  images          TEXT,                      -- JSON 数组，最多 9 张
  enroll_required INTEGER DEFAULT 1,         -- 是否需要报名
  hot             INTEGER DEFAULT 0,         -- 热度
  join_count      INTEGER DEFAULT 0,         -- 报名人数
  status          TEXT DEFAULT 'pending',    -- pending=审核中 approved=已通过 rejected=已驳回
  reject_reason   TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invite_events_status ON invite_events(status, id);
CREATE INDEX IF NOT EXISTS idx_invite_events_user ON invite_events(user_id);

CREATE TABLE IF NOT EXISTS invite_event_joins (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_invite_event_joins_event ON invite_event_joins(event_id);

