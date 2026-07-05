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
  { time: '08:00', text: '我在窗台看云，顺便晒晒毛。', done: true },
  { time: '09:30', text: '吃了一小碗早饭，心满意足。', done: true },
  { time: '10:00', text: '正在整理旧信件，翻到好多回忆。', done: true },
  { time: '12:00', text: '午后小睡，梦里都是暖暖的。', done: false },
  { time: '15:00', text: '想去货架那边挑点小零食。', done: false },
  { time: '17:30', text: '坐在地毯上等你回家。', done: false },
  { time: '20:00', text: '和你说说今天发生的事。', done: false },
]

// "记忆"收藏夹里的信件
export type Letter = {
  id: string
  title: string
  date: string
  preview: string
  body: string
}

export const LETTERS: Letter[] = [
  {
    id: 'l1',
    title: '第一次见面',
    date: '春天 · 第 1 天',
    preview: '那天你推开门，我就决定留下来陪你了。',
    body: '那天你推开门，阳光正好洒在地毯上。我从沙发后面探出头，你笑了。从那一刻起，这个房间就有了我们两个的味道。谢谢你把我带回家。',
  },
  {
    id: 'l2',
    title: '下雨的午后',
    date: '春天 · 第 12 天',
    preview: '外面在下雨，我们一起听雨声，很安心。',
    body: '外面淅淅沥沥地下着雨，你在窗边看书，我趴在你腿上。雨声很轻，你的呼吸很稳。那一刻我觉得，只要有你在，什么天气都很温柔。',
  },
  {
    id: 'l3',
    title: '你加班的夜晚',
    date: '夏天 · 第 40 天',
    preview: '你回来得很晚，我一直守着那盏小灯。',
    body: '你回来得很晚，我一直守在门口的小灯下没有睡。看到你疲惫的样子，我蹭了蹭你的脚踝。别太累了，家永远为你留着灯。',
  },
  {
    id: 'l4',
    title: '一起看的第一场雪',
    date: '冬天 · 第 200 天',
    preview: '窗外飘起了雪，我们看了好久好久。',
    body: '窗外飘起了今年的第一场雪，白白的、静静的。你抱着我站在窗边，我们看了好久好久，谁都没有说话。有些幸福，是不需要语言的。',
  },
]

// "商店"里的可爱小物
export type ShopItem = {
  id: string
  name: string
  desc: string
  price: number
  emojiColor: string
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 's1', name: '小鱼干零食', desc: '猫咪最爱的香脆小鱼干，元气满满。', price: 12, emojiColor: '#e8a87c' },
  { id: 's2', name: '毛线球玩具', desc: '软软的毛线球，可以陪它玩一下午。', price: 18, emojiColor: '#d98ea0' },
  { id: 's3', name: '暖阳软垫', desc: '放在窗台的柔软坐垫，晒太阳专用。', price: 45, emojiColor: '#e6c88a' },
  { id: 's4', name: '手写信纸', desc: '给记忆收藏夹添一封新的信。', price: 9, emojiColor: '#c9b79c' },
  { id: 's5', name: '小盆栽', desc: '给房间添一抹绿意，猫咪也喜欢。', price: 28, emojiColor: '#8fb07a' },
  { id: 's6', name: '铃铛项圈', desc: '走起路来叮当响的可爱项圈。', price: 22, emojiColor: '#e0b04a' },
]
