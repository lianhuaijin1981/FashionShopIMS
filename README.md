# StyleStock 服装门店进销存系统

> 服装行业门店一体化管理平台，涵盖商品管理、库存管理、销售收银、采购管理、会员管理、数据分析等核心功能。

## 🎯 项目简介

StyleStock 是一套面向服装零售门店的进销存管理系统，采用 React + TypeScript + Tailwind CSS 构建，为门店提供从商品入库到销售收银的完整闭环管理。

## ✨ 核心功能

| 模块 | 功能说明 |
|------|----------|
| **前台收银 (POS)** | 商品扫码/搜索、尺码颜色选择、会员积分、多种支付方式、小票打印 |
| **商品管理** | 商品档案（SKU、规格、颜色/尺码矩阵）、分类管理、价格体系 |
| **库存管理** | 实时库存查询、低库存预警、库存盘点、库间调拨 |
| **采购管理** | 采购计划 → 采购订单 → 采购入库 → 采购退货，全流程管理 |
| **会员管理** | 会员注册、等级管理、积分体系、储值卡、消费记录 |
| **销售记录** | 销售明细查询、退换货处理、销售趋势分析 |
| **数据分析** | 营收概况、门店对比、品类分析、库存分析、排行榜 |
| **系统设置** | 用户管理、权限管理、操作日志、数据备份导出、基础配置 |

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5.9 |
| 构建工具 | Vite 7.2 |
| UI 框架 | Tailwind CSS v3.4 + shadcn/ui (40+ 组件) |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 表单验证 | React Hook Form + Zod |
| 路由 | React Router v7 (HashRouter) |
| 状态管理 | React Context + useReducer |
| 数据存储 | localStorage（当前为模拟数据阶段） |

## 🚀 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

> 默认端口 3000，打开 http://localhost:3000

## 🔐 演示账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | 123456 | 管理员 |
| shop01 | 123456 | 店长 |
| staff01 | 123456 | 店员 |

> 首次登录需要选择门店（总店 / 王府井分店 / 三里屯分店 / 西单分店）

## 📂 项目结构

```
src/
├── components/
│   ├── ui/            # shadcn/ui 通用组件
│   ├── pos/           # POS 收银相关组件
│   ├── purchase/      # 采购管理相关组件
│   ├── sales/         # 销售记录相关组件
│   └── settings/      # 系统设置相关组件
├── context/
│   └── AppContext.tsx # 全局状态管理
├── data/
│   └── mockData.ts    # 模拟数据（正式上线需替换为后端 API）
├── hooks/
│   └── use-mobile.ts  # 移动端检测 Hook
├── lib/
│   └── utils.ts       # 工具函数
├── pages/
│   ├── Home.tsx       # 首页仪表盘
│   ├── Pos.tsx        # 前台收银
│   ├── Inventory.tsx  # 库存管理
│   ├── Products.tsx   # 商品管理
│   ├── Purchase.tsx   # 采购管理
│   ├── Sales.tsx      # 销售记录
│   ├── Members.tsx    # 会员管理
│   ├── Analytics.tsx  # 数据分析
│   ├── Settings.tsx   # 系统设置
│   └── Login.tsx      # 登录页
├── types/
│   └── index.ts       # TypeScript 类型定义
├── App.tsx           # 路由配置
├── main.tsx          # 入口文件
└── index.css         # 全局样式
```

## 🎨 设计系统

- **配色**：品牌色 `#D4853C`（暖橙色）+ 极简中性灰黑色系
- **字体**：Display `Playfair Display` / 正文 `Inter`
- **圆角**：2xl 大卡片 / lg 中元素 / sm 小标签

## 📋 路线图

- [ ] 后端 API 接入（Node.js/Express 或 NestJS）
- [ ] 数据库迁移（PostgreSQL）
- [ ] 真实用户认证（JWT）
- [ ] 多门店连锁支持
- [ ] POS 打印机对接
- [ ] 微信小程序端
- [ ] 数据导出（Excel/PDF）

## 📄 协议

本项目仅供学习与内部使用。