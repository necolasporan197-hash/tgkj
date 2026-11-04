/**
 * 设计令牌 —— 100% 抽取自官方 APK（com.sheguo.tggy v4.8.2）反编译产物：
 *   D:\decompiled\ui_extract\app-guanwang-release-full-decompiled.zip → res/values/colors.xml
 * 任何颜色不得凭空新增，只能引用本文件。
 */
export const colors = {
  // 品牌主色（官方 button_ff8800.xml / main_tab_dot.xml 统一样式色 #FF731C）
  primary: '#FF731C',
  primaryDark: '#FF5100',
  primaryDeep: '#A32902',
  primaryLight: '#FFFF884B',
  accent: '#FF5E13', // tag_text_color_select

  // 辅助色（home_text_color_skyblue / setting_quality_blue）
  sky: '#00BAF2',
  blue: '#0080FF',
  gold: '#E7B268',
  goldLight: '#EDBB81',

  // 文本（home_title1 / home_sort_describe_color / setting_tips_color）
  textPrimary: '#171D24',
  textRegular: '#494949',
  textSecondary: '#787E85',
  textTertiary: '#91979E',
  textPlaceholder: '#C8C9CC',
  textDisabled: '#C1C7CE',
  textInverse: '#FFFFFF',

  // 背景与分割
  bg: '#FFFFFF',
  bgGray: '#F0F1F2', // verify_background
  bgPage: '#F5F6F8', // color_F5F6F8
  bgCard: '#FFFFFF',
  titleBar: '#FFFFFF', // title_bar
  divider: '#E5E5E5', // idcard_line_color / color_sight_divider_line
  border: '#EDF0F2', // qua_param_line_color
  lineLight: '#E8E9EB', // title_line_color

  // 状态
  approved: '#4CD672',
  rejected: '#F26666',
  pendingBg: '#FFFEFC',
  pendingText: '#B59881',

  // 基础
  black: '#000000',
  white: '#FFFFFF',
  transparent: 'transparent',
  mask: 'rgba(0,0,0,0.6)', // pickerview_bgColor_overlay
  shadow: 'rgba(0,0,0,0.08)'
}

/** 字号（官方 sp 值，uni-app 中按 rpx 等比换算：1sp ≈ 2rpx @750 设计稿） */
export const fontSizes = {
  h1: 44,
  h2: 36,
  h3: 32,
  title: 32,
  body: 28,
  sub: 26,
  caption: 24,
  tiny: 22
}

/** 圆角（官方 round_button / gradient_button 取值） */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999
}

/** 间距（官方 dimens.xml 常用档位，单位 rpx） */
export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 56
}

/** 头部高度（官方 title_bar / detail_title_bar），单位 rpx */
export const layout = {
  navBarHeight: 88,
  tabBarHeight: 100,
  pagePadding: 30
}

export default { colors, fontSizes, radius, spacing, layout }
