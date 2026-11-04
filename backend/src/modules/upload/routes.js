/**
 * 上传模块：接受 base64 dataURL，落盘到 UPLOAD_DIR 并返回公网地址。
 * Base: /api/upload
 * 说明：生产建议前置 Nginx/OSS，本实现零依赖可直接跑通全链路。
 */
import { Router } from 'express'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { h, ok, paramError, CODE, BizError } from '../../utils/response.js'
import { env } from '../../config/env.js'
import { authRequired } from '../../middleware/auth.js'

const router = Router()

const MIME_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav'
}

const MAX_BYTES = 20 * 1024 * 1024 // 单文件 20MB

router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { data, filename = '', type = 'image' } = req.body || {}
    if (!data || typeof data !== 'string') throw paramError('缺少文件数据')
    const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(data)
    if (!m) throw new BizError(CODE.PARAM, '文件格式不正确，需为 base64 dataURL')
    const [, mime, b64] = m
    const buf = Buffer.from(b64, 'base64')
    if (buf.length > MAX_BYTES) throw new BizError(CODE.PARAM, '文件过大，请压缩后再上传（≤20MB）')
    const ext = MIME_EXT[mime] || extname(filename) || '.bin'
    const sub = type === 'video' ? 'video' : type === 'audio' ? 'audio' : 'image'
    const dir = resolve(env.uploadDir, sub)
    mkdirSync(dir, { recursive: true })
    const name = `${Date.now()}_${randomBytes(4).toString('hex')}${ext}`
    writeFileSync(resolve(dir, name), buf)
    return ok(res, { url: `${env.publicBaseUrl}/uploads/${sub}/${name}`, size: buf.length, mime }, '上传成功')
  })
)

export default router
