/**
 * 第三方 SDK 元数据 —— 后台「SDK 配置」页面的唯一真源。
 * - fields 为扁平字段定义（label/type/secret/options）
 * - default 为官方版本 (app-guanwang-release v4.8.2) 反编译提取的初始值
 *   secret=true 的字段在接口返回时会被掩码，前端提交掩码值时不覆盖原值。
 */
export const SDK_PROVIDERS = [
  {
    key: 'rongcloud',
    name: '融云 IM',
    desc: '即时通讯服务（私聊/会话）',
    fields: [
      { key: 'appKey', label: 'App Key', secret: false, default: 'n19jmcy5nav49' },
      { key: 'appSecret', label: 'App Secret', secret: true, default: '' },
      { key: 'dataCenter', label: '数据中心', type: 'select', options: ['cn', 'sg', 'us'], default: 'cn' }
    ]
  },
  {
    key: 'amap',
    name: '高德地图',
    desc: '定位与位置服务',
    fields: [
      { key: 'androidKey', label: 'Android Key', secret: false, default: '5ccc023176199c49a98288215b8890e5' },
      { key: 'webKey', label: 'Web Key', secret: false, default: '5ccc023176199c49a98288215b8890e5' },
      { key: 'iosKey', label: 'iOS Key', secret: false, default: '5ccc023176199c49a98288215b8890e5' }
    ]
  },
  {
    key: 'jpush',
    name: '极光推送',
    desc: '消息推送服务',
    fields: [
      { key: 'appKey', label: 'App Key', secret: false, default: 'e548dfc3f1fbcde546de0315' },
      { key: 'masterSecret', label: 'Master Secret', secret: true, default: '' },
      { key: 'channel', label: '渠道', secret: false, default: 'developer-default' }
    ]
  },
  {
    key: 'openinstall',
    name: 'OpenInstall',
    desc: 'App 安装来源追踪',
    fields: [
      { key: 'appKey', label: 'App Key', secret: false, default: 'qcx0cl' },
      { key: 'appSecret', label: 'App Secret', secret: true, default: '' }
    ]
  },
  {
    key: 'tencent-face',
    name: '腾讯云慧眼',
    desc: '活体检测 / 身份认证',
    fields: [
      { key: 'appId', label: 'App ID', secret: false, default: '100034' },
      { key: 'secretKey', label: 'Secret Key', secret: true, default: '660346260f8a841a04ec2a56815b421b' },
      { key: 'region', label: '地域', type: 'select', options: ['ap-guangzhou', 'ap-beijing', 'ap-shanghai'], default: 'ap-guangzhou' }
    ]
  },
  {
    key: 'payment',
    name: '支付配置',
    desc: '微信支付 / 支付宝',
    fields: [
      { key: 'wechatAppId', label: '微信 App ID', secret: false, default: '' },
      { key: 'wechatMchId', label: '微信商户号', secret: false, default: '' },
      { key: 'wechatApiKey', label: '微信 API 密钥', secret: true, default: '' },
      { key: 'alipayAppId', label: '支付宝 App ID', secret: false, default: '' },
      { key: 'alipayPrivateKey', label: '支付宝私钥', secret: true, default: '' },
      { key: 'alipayPublicKey', label: '支付宝公钥', secret: true, default: '' }
    ]
  },
  {
    key: 'sms',
    name: '短信服务',
    desc: '验证码短信下发',
    fields: [
      { key: 'provider', label: '服务商', type: 'select', options: ['console', 'huyi', 'aliyun'], default: 'console' },
      { key: 'apiId', label: 'API ID', secret: false, default: '' },
      { key: 'apiKey', label: 'API Key', secret: true, default: '' },
      { key: 'signName', label: '短信签名', secret: false, default: '糖果空间' },
      { key: 'templateCode', label: '模板编号', secret: false, default: '' }
    ]
  }
]

export const findProvider = (key) => SDK_PROVIDERS.find((p) => p.key === key) || null

/** 某 provider 的初始配置对象 */
export const defaultConfig = (provider) =>
  Object.fromEntries(provider.fields.map((f) => [f.key, f.default ?? '']))
