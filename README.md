# FitGuide - 健身助手

一个轻量级的健身指导网页应用，提供个性化训练计划和饮食建议。

![FitGuide](https://img.shields.io/badge/FitGuide-健身助手-FF6B6B?style=for-the-badge)

## 功能特点

### 🏠 首页
- 用户信息表单（性别、年龄、身高、体重）
- 体型特征评估（骨架、脂肪分布、代谢速度）
- BMI 计算与显示
- 智能体型判断（内胚型/中胚型/外胚型）
- 快速访问训练和饮食计划

### 🏋️ 训练
- Push / Pull / Legs 三分化训练计划
- 每周循环：Push → Pull → Legs → 休息
- 每个动作包含：
  - 动作名称与目标肌群
  - 训练组数、次数、休息时间
  - 动作要点提示
  - B站 / YouTube 视频教学链接
- 当前训练日高亮显示

### 🥗 饮食
- 根据体型定制饮食原则
- 三餐示例（早餐/午餐/晚餐/加餐）
- 每日营养摄入参考（蛋白质计算）

### 👤 我的
- 体重记录与曲线图表
- 目标切换（减脂/维持/增肌）
- 体型类型调整
- 数据本地存储（localStorage）

## 技术栈

- **Vite** - 现代化的构建工具
- **原生 JavaScript** - 无框架依赖
- **CSS3** - 响应式设计，移动端友好
- **localStorage** - 本地数据持久化

## 本地运行

```bash
# 克隆项目后进入目录
cd fitguide

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build
```

## 部署到 GitHub Pages

### 方法一：手动部署

1. 在 GitHub 创建新仓库（如 `fitguide`）
2. 本地初始化 git 并推送：

```bash
cd fitguide
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/fitguide.git
git push -u origin main
```

3. 构建生产版本：

```bash
npm run build
```

4. 将 `dist` 目录内容推送到 `gh-pages` 分支：

```bash
cd dist
git init
git add .
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/你的用户名/fitguide.git
git push -u origin gh-pages --force
```

5. 等待几分钟后访问：`https://你的用户名.github.io/fitguide`

### 方法二：使用 GitHub Actions

1. 在仓库中创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. 推送代码后，GitHub Actions 会自动构建并部署

## 项目结构

```
fitguide/
├── index.html          # HTML 入口
├── package.json        # 项目配置
├── css/
│   └── style.css        # 样式文件
├── js/
│   ├── app.js           # 主应用逻辑
│   ├── data.js          # 动作库和饮食数据
│   └── utils.js         # 工具函数
└── dist/                # 生产构建输出
```

## 体型说明

| 体型 | 特征 | 饮食建议 |
|------|------|----------|
| **内胚型** | 肩窄腰宽，易存储脂肪 | 控制碳水，蛋白质 1.8-2.2g/kg |
| **中胚型** | 肩宽腰细，肌肉易增长 | 均衡饮食，蛋白质 1.4-1.8g/kg |
| **外胚型** | 肩窄四肢长，难长肌肉 | 高碳水，蛋白质 1.6-2g/kg，少食多餐 |

## 训练计划

### Push Day（推）
- 实力举、卧推、哑铃斜推
- 绳索面拉、侧平举、过头臂屈伸

### Pull Day（拉）
- T杠划船、助力引体、单臂哑铃划船
- 直臂下压、二头弯举、农夫行走

### Legs Day（腿）
- 深蹲、罗马尼亚硬拉、保加利亚分腿蹲
- 腿弯举、腿伸展、提踵

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
