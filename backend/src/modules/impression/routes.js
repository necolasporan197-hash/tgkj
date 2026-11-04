/**
 * 印象模块：给他人贴印象标签 / 我收到的印象
 * Base: /api/impression
 */
import { Router } from 'express'
import { all, get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'

const router = Router()

export const PRESET_TAGS = [
  '颜值高', '幽默风趣', '温柔体贴', '靠谱', '会聊天', '有品味',
  '阳光开朗', '成熟稳重', '细心', '有趣', '事业心强', '有教养'
]

/** 预设标签 */
router.get('/tags', h((req, res) => ok(res, PRESET_TAGS)))

/** 给某人添加印象 */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { targetId, tags = [] } = req.body || {}
    const tid = Number(targetId)
    if (!tid || tid === req.user.id) throw paramError('目标用户不正确')
    if (!tags.length) throw paramError('请至少选择一个标签')
    const exists = get('SELECT id FROM impressions WHERE user_id=? AND target_id=?', [req.user.id, tid])
    if (exists) throw new BizError(CODE.CONFLICT, '你已经评价过 TA 了')
    tags.slice(0, 6).forEach((tag) => {
      run(`INSERT INTO impressions (user_id, target_id, tag, created_at) VALUES (?,?,?,?)`, [req.user.id, tid, String(tag).slice(0, 12), now()])
    })
    return ok(res, null, '印象已提交')
  })
)

/** 我收到的印象统计 */
router.get(
  '/received',
  authRequired,
  h((req, res) => {
    const stats = all(`SELECT tag, COUNT(*) c FROM impressions WHERE target_id=? GROUP BY tag ORDER BY c DESC`, [req.user.id])
    const givers = all(
      `SELECT DISTINCT u.id, u.nickname, u.avatar FROM impressions i JOIN users u ON u.id=i.user_id WHERE i.target_id=? LIMIT 50`,
      [req.user.id]
    )
    return ok(res, { stats, total: stats.reduce((s, t) => s + t.c, 0), givers })
  })
)

/** 某人收到的印象 */
router.get(
  '/:userId',
  authRequired,
  h((req, res) =>
    ok(res, all(`SELECT tag, COUNT(*) c FROM impressions WHERE target_id=? GROUP BY tag ORDER BY c DESC`, [Number(req.params.userId)]))
  )
)

export default router
