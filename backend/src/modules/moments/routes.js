/**
 * 动态模块：发布 / 列表 / 详情 / 点赞 / 评论 / 删除 / 举报
 * Base: /api/moments
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, CODE, BizError, paramError, notFound, forbidden } from '../../utils/response.js'
import { authRequired, authOptional } from '../../middleware/auth.js'
import { publicUser, containsSensitive, notify, pageParams } from '../_shared.js'
import { bumpTask } from '../task/routes.js'

const router = Router()

const shape = (m, viewerId) => {
  const author = get('SELECT * FROM users WHERE id = ?', [m.user_id])
  const images = safeJson(m.images)
  return {
    id: m.id,
    content: m.content,
    images,
    mediaType: m.media_type,
    videoUrl: m.video_url,
    audioUrl: m.audio_url,
    audioDuration: m.audio_duration,
    topicId: m.topic_id,
    topicName: m.topic_id ? get('SELECT name FROM topics WHERE id=?', [m.topic_id])?.name : null,
    city: m.city,
    distance: m.distance ?? null,
    likeCount: m.like_count,
    commentCount: m.comment_count,
    viewCount: m.view_count,
    auditStatus: m.audit_status,
    createdAt: m.created_at,
    liked: viewerId ? !!get('SELECT id FROM moment_likes WHERE moment_id=? AND user_id=?', [m.id, viewerId]) : false,
    author: publicUser(author, viewerId)
  }
}

const safeJson = (s) => {
  try {
    return JSON.parse(s || '[]')
  } catch {
    return []
  }
}

/** 动态列表（默认只看已审核通过的） */
router.get(
  '/',
  authOptional,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const me = req.user
    const params = []
    let where = `WHERE status='normal' AND audit_status='approved'`
    if (req.query.topicId) {
      where += ' AND topic_id = ?'
      params.push(Number(req.query.topicId))
    }
    if (req.query.userId) {
      where += ' AND user_id = ?'
      params.push(Number(req.query.userId))
    }
    if (req.query.city) {
      where += ' AND city = ?'
      params.push(req.query.city)
    }
    if (me) {
      where += ' AND user_id NOT IN (SELECT target_id FROM blacklist WHERE user_id=?)'
      params.push(me.id)
    }
    const list = all(`SELECT * FROM moments ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset])
    const total = get(`SELECT COUNT(*) c FROM moments ${where}`, params).c
    return ok(res, pageResult(list.map((m) => shape(m, me?.id)), total, page, pageSize))
  })
)

/** 我发布的动态（含审核状态） */
router.get(
  '/mine',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(`SELECT * FROM moments WHERE user_id=? AND status='normal' ORDER BY id DESC LIMIT ? OFFSET ?`, [
      req.user.id,
      pageSize,
      offset
    ])
    const total = get(`SELECT COUNT(*) c FROM moments WHERE user_id=? AND status='normal'`, [req.user.id]).c
    return ok(res, pageResult(list.map((m) => shape(m, req.user.id)), total, page, pageSize))
  })
)

/** 动态详情（自动+1浏览量） */
router.get(
  '/:id',
  authOptional,
  h((req, res) => {
    const m = get(`SELECT * FROM moments WHERE id=? AND status='normal'`, [Number(req.params.id)])
    if (!m) throw notFound('动态不存在或已删除')
    run('UPDATE moments SET view_count = view_count + 1 WHERE id = ?', [m.id])
    const comments = all(
      `SELECT c.*, u.nickname, u.avatar FROM moment_comments c JOIN users u ON u.id=c.user_id
       WHERE c.moment_id=? AND c.status='normal' ORDER BY c.id ASC LIMIT 200`,
      [m.id]
    ).map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      replyTo: c.reply_to,
      user: { id: c.user_id, nickname: c.nickname, avatar: c.avatar }
    }))
    return ok(res, { ...shape(m, req.user?.id), comments })
  })
)

/** 发布动态（含敏感词拦截） */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { content = '', images = [], mediaType = 'text', videoUrl = '', audioUrl = '', audioDuration = 0, topicId = null } = req.body || {}
    if (!content && !images.length && !videoUrl && !audioUrl) throw paramError('请填写内容或上传素材')
    const hits = containsSensitive(`${content}`)
    if (hits.length) throw new BizError(CODE.BIZ, `内容包含敏感词：${hits.join('、')}`)
    const u = req.user
    const r = run(
      `INSERT INTO moments (user_id, content, images, media_type, video_url, audio_url, audio_duration, topic_id, city, lat, lng, audit_status, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?, 'pending', 'normal', ?)`,
      [
        u.id,
        content,
        JSON.stringify(images || []),
        mediaType,
        videoUrl,
        audioUrl,
        audioDuration,
        topicId,
        u.city,
        u.lat,
        u.lng,
        now()
      ]
    )
    bumpTask(u.id, 'publish_moment', 1)
    return ok(res, { id: Number(r.lastInsertRowid), auditStatus: 'pending' }, '发布成功，审核通过后展示')
  })
)

/** 删除自己的动态 */
router.delete(
  '/:id',
  authRequired,
  h((req, res) => {
    const m = get('SELECT * FROM moments WHERE id=?', [Number(req.params.id)])
    if (!m) throw notFound('动态不存在')
    if (m.user_id !== req.user.id) throw forbidden('只能删除自己的动态')
    run(`UPDATE moments SET status='deleted' WHERE id=?`, [m.id])
    return ok(res, null, '已删除')
  })
)

/** 点赞 / 取消点赞 */
router.post(
  '/:id/like',
  authRequired,
  h((req, res) => {
    const id = Number(req.params.id)
    const m = get('SELECT * FROM moments WHERE id=?', [id])
    if (!m) throw notFound('动态不存在')
    const liked = !!get('SELECT id FROM moment_likes WHERE moment_id=? AND user_id=?', [id, req.user.id])
    tx(() => {
      if (liked) {
        run('DELETE FROM moment_likes WHERE moment_id=? AND user_id=?', [id, req.user.id])
        run('UPDATE moments SET like_count = MAX(0, like_count - 1) WHERE id=?', [id])
      } else {
        run('INSERT INTO moment_likes (moment_id, user_id, created_at) VALUES (?,?,?)', [id, req.user.id, now()])
        run('UPDATE moments SET like_count = like_count + 1 WHERE id=?', [id])
      }
    })
    if (!liked && m.user_id !== req.user.id) {
      notify(m.user_id, '收到新的喜欢', `${req.user.nickname || '有用户'} 喜欢了你的动态`, 'system')
    }
    return ok(res, { liked: !liked, likeCount: get('SELECT like_count c FROM moments WHERE id=?', [id]).c }, liked ? '已取消喜欢' : '已喜欢')
  })
)

/** 评论 */
router.post(
  '/:id/comment',
  authRequired,
  h((req, res) => {
    const id = Number(req.params.id)
    const { content, replyTo = null } = req.body || {}
    if (!content || !String(content).trim()) throw paramError('评论内容不能为空')
    const m = get('SELECT * FROM moments WHERE id=?', [id])
    if (!m) throw notFound('动态不存在')
    const hits = containsSensitive(content)
    if (hits.length) throw new BizError(CODE.BIZ, `评论包含敏感词：${hits.join('、')}`)
    const r = run(
      `INSERT INTO moment_comments (moment_id, user_id, content, reply_to, status, created_at) VALUES (?,?,?,?, 'normal', ?)`,
      [id, req.user.id, String(content).trim().slice(0, 500), replyTo, now()]
    )
    run('UPDATE moments SET comment_count = comment_count + 1 WHERE id=?', [id])
    if (m.user_id !== req.user.id) {
      notify(m.user_id, '收到新的评论', `${req.user.nickname || '有用户'} 评论了你的动态：${String(content).slice(0, 30)}`, 'system')
    }
    return ok(res, { id: Number(r.lastInsertRowid) }, '评论成功')
  })
)

/** 删除评论（作者本人或动态作者） */
router.delete(
  '/comment/:cid',
  authRequired,
  h((req, res) => {
    const c = get('SELECT * FROM moment_comments WHERE id=?', [Number(req.params.cid)])
    if (!c) throw notFound('评论不存在')
    const m = get('SELECT * FROM moments WHERE id=?', [c.moment_id])
    if (c.user_id !== req.user.id && m?.user_id !== req.user.id) throw forbidden('无权删除该评论')
    run(`UPDATE moment_comments SET status='deleted' WHERE id=?`, [c.id])
    run('UPDATE moments SET comment_count = MAX(0, comment_count - 1) WHERE id=?', [c.moment_id])
    return ok(res, null, '已删除')
  })
)

export default router
