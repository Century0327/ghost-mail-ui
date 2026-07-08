// 治愈系陪伴猫的全部文案与数据。所有内容都是第一人称的猫咪口吻，温柔可爱。

// 点击猫时，随机弹出的一句对话（尖角对话气泡）
export const CAT_SAYINGS: string[] = [
  '你回来啦，我等你好久了喵～',
  '今天也要开开心心的哦！',
  '要不要一起晒晒太阳？',
  '我刚刚打了个小盹，梦到你了。',
  '窗外的云好软，像棉花糖。',
  '摸摸头就会很有精神喵。',
  '肚子有点饿了，不过陪你更重要。',
  '慢慢来，我一直都在这儿。',
  '今天辛苦啦，坐下来歇会儿吧。',
  '我把最舒服的位置留给你咯。',
]

// 猫自己冒出的想法（圆圈想法气泡），第一人称的心情/日程碎片
export const CAT_THOUGHTS: string[] = [
  '今天想睡个懒觉…',
  '好想吃小鱼干呀。',
  '阳光刚好，适合发呆。',
  '要不要整理一下旧信件呢？',
  '不知道今天会不会有新客人。',
  '尾巴痒痒的，想找个地方蹭一蹭。',
  '窗台是我今天的观景台。',
  '好像该给花浇水了。',
]

// 一天的详细日程时间线，第一人称
export type ScheduleItem = {
  time: string
  text: string
  done: boolean
}

export const SCHEDULE: ScheduleItem[] = [
  { time: '08:00', text: '在窗台看云，顺便晒晒毛。', done: false },
  { time: '09:30', text: '准备吃一小碗早饭。', done: false },
  { time: '10:00', text: '整理旧信件，翻翻回忆。', done: false },
  { time: '12:00', text: '午后小睡，梦里都是暖暖的。', done: false },
  { time: '15:00', text: '想去货架那边挑点小零食。', done: false },
  { time: '17:30', text: '坐在地毯上等你回家。', done: false },
  { time: '20:00', text: '和你说说今天发生的事。', done: false },
]

// "记忆"收藏夹里的信件
export type LetterCategory = 'all' | 'favorite' | 'event'

export type Letter = {
  id: string
  title: string
  date: string
  preview: string
  body: string
  image?: string // 可选图片
  category: LetterCategory // 分类
}

export const LETTERS: Letter[] = [
  {
    id: 'l1',
    title: '第一次见面',
    date: '春天 · 第 1 天',
    preview: '那天你推开门，我就决定留下来陪你了。',
    body: '那天你推开门，阳光正好洒在地毯上。我从沙发后面探出头，你笑了。从那一刻起，这个房间就有了我们两个的味道。谢谢你把我带回家。',
    image: '/room/item-fish.png',
    category: 'favorite',
  },
  {
    id: 'l2',
    title: '下雨的午后',
    date: '春天 · 第 12 天',
    preview: '外面在下雨，我们一起听雨声，很安心。',
    body: '外面淅淅沥沥地下着雨，你在窗边看书，我趴在你腿上。雨声很轻，你的呼吸很稳。那一刻我觉得，只要有你在，什么天气都很温柔。',
    image: '/room/item-yarn.png',
    category: 'all',
  },
  {
    id: 'l3',
    title: '你加班的夜晚',
    date: '夏天 · 第 40 天',
    preview: '你回来得很晚，我一直守着那盏小灯。',
    body: '你回来得很晚，我一直守在门口的小灯下没有睡。看到你疲惫的样子，我蹭了蹭你的脚踝。别太累了，家永远为你留着灯。',
    image: '/room/item-plant.png',
    category: 'all',
  },
  {
    id: 'l4',
    title: '一起看的第一场雪',
    date: '冬天 · 第 200 天',
    preview: '窗外飘起了雪，我们看了好久好久。',
    body: '窗外飘起了今年的第一场雪，白白的、静静的。你抱着我站在窗边，我们看了好久好久，谁都没有说话。有些幸福，是不需要语言的。',
    image: '/room/item-cushion.png',
    category: 'favorite',
  },
  {
    id: 'l5',
    title: '新年烟火大会',
    date: '活动 · 限定',
    preview: '天空中绽放的烟火，是我们要一起看的风景。',
    body: '新年的钟声敲响，烟火在夜空中绽放成各种形状。你抱起我站在窗台上，我们一起数着那些光芒。你说这是新一年的愿望，而我只想每年的此刻都能和你一起度过。',
    image: '/room/cat.png',
    category: 'event',
  },
]

// "商店"里的可爱小物
export type ShopItem = {
  id: string
  name: string
  desc: string
  price: number
  emojiColor: string
  image?: string // 可选像素图片路径
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 's1', name: '小鱼干零食', desc: '猫咪最爱的香脆小鱼干，元气满满。', price: 12, emojiColor: '#e8a87c', image: '/room/item-fish.png' },
  { id: 's2', name: '毛线球玩具', desc: '软软的毛线球，可以陪它玩一下午。', price: 18, emojiColor: '#d98ea0', image: '/room/item-yarn.png' },
  { id: 's3', name: '暖阳软垫', desc: '放在窗台的柔软坐垫，晒太阳专用。', price: 45, emojiColor: '#e6c88a', image: '/room/item-cushion.png' },
  { id: 's4', name: '手写信纸', desc: '给记忆收藏夹添一封新的信。', price: 9, emojiColor: '#c9b79c', image: '/room/letter.png' },
  { id: 's5', name: '小盆栽', desc: '给房间添一抹绿意，猫咪也喜欢。', price: 28, emojiColor: '#8fb07a', image: '/room/item-plant.png' },
  { id: 's6', name: '铃铛项圈', desc: '走起路来叮当响的可爱项圈。', price: 22, emojiColor: '#e0b04a' },
]

// ========== 角色系统 ==========

// 性格标签
export type PersonalityTag = {
  id: string
  label: string
  color: string // 标签颜色
}

export const PERSONALITY_TAGS: PersonalityTag[] = [
  { id: 'p1', label: '温柔', color: '#e0598b' },
  { id: 'p2', label: '活泼', color: '#f4b740' },
  { id: 'p3', label: '慵懒', color: '#9b6bd6' },
  { id: 'p4', label: '调皮', color: '#3e9bd6' },
  { id: 'p5', label: '高冷', color: '#315476' },
  { id: 'p6', label: '呆萌', color: '#4fb360' },
  { id: 'p7', label: '傲娇', color: '#e0823e' },
  { id: 'p8', label: '治愈', color: '#3eb489' },
]

// 角色定义
export type Character = {
  id: string
  name: string
  image: string
  bio: string // 简介
  personalities: string[] // 性格标签ID列表
  statName: string // 数值名称，如"哈气值"、"好感度"
  statMax: number // 最大数值
  isOfficial: boolean // 是否官方角色
  isPublic: boolean // 是否公开
  creatorId?: string // 创建者ID
  creatorName?: string // 创建者名称
}

// 官方角色
export const OFFICIAL_CHARACTERS: Character[] = [
  {
    id: 'kitty',
    name: 'Kitty',
    image: '/room/cat.png',
    bio: '一只活泼可爱的三花猫，好奇心旺盛，喜欢探索房间的每个角落。永远元气满满！',
    personalities: ['p2', 'p6', 'p8'],
    statName: '元气值',
    statMax: 100,
    isOfficial: true,
    isPublic: true,
  },
  {
    id: 'maodie',
    name: '耄聋',
    image: '/room/cat.png',
    bio: '一只温柔的老猫，喜欢静静地看着窗外的风景，偶尔会想起过去的岁月。',
    personalities: ['p5', 'p7', 'p1'],
    statName: '好感度',
    statMax: 100,
    isOfficial: true,
    isPublic: true,
  },
  {
    id: 'puppy',
    name: '豆豆',
    image: '/room/puppy.png',
    bio: '活泼的小狗，总是充满活力。喜欢玩耍和被摸摸头。',
    personalities: ['p2', 'p6', 'p4'],
    statName: '活力值',
    statMax: 100,
    isOfficial: true,
    isPublic: true,
  },
  {
    id: 'foxy',
    name: '小狐',
    image: '/room/foxy.png',
    bio: '神秘的小狐狸，外表高冷内心温暖。喜欢安静的夜晚。',
    personalities: ['p5', 'p7', 'p1'],
    statName: '信任度',
    statMax: 100,
    isOfficial: true,
    isPublic: true,
  },
  {
    id: 'birb',
    name: '咕咕',
    image: '/room/birb.png',
    bio: '可爱的小鸟，喜欢唱歌和站在窗口看风景。偶尔会飞到你的肩膀上。',
    personalities: ['p2', 'p6', 'p8'],
    statName: '快乐值',
    statMax: 100,
    isOfficial: true,
    isPublic: true,
  },
]

// 公开角色（占位）
export const PUBLIC_CHARACTERS: Character[] = [
  // 用户创建的公开角色将从数据库加载
]
