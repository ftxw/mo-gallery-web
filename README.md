<div align="center">

# 📸 MO Gallery

**A modern, feature-rich photo gallery application with integrated backend**

一个现代化的图片画廊应用，前后端集成，支持多种部署方式和存储后端

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-API-orange?style=flat-square)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[English](#features) | [中文](#功能特性)

</div>

---

## ✨ Features

### 📷 Photo Gallery
- **Multiple View Modes** - Grid, Masonry (waterfall), and Timeline views with smooth transitions
- **EXIF Data Extraction** - Automatically extracts camera, lens, aperture, shutter speed, ISO, and more
- **Dominant Color Extraction** - Automatically extracts primary colors from images for beautiful placeholders
- **Album Management** - Organize photos into albums with cover images
- **Batch Upload** - Upload multiple photos with progress tracking and album selection
- **Photo Pagination** - Efficient pagination for large photo collections
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### 📖 Stories / Narratives
- Create photo stories by combining multiple images
- Rich text descriptions with Markdown support
- Beautiful story presentation layout
- Photo management within stories (add/remove photos)

### 👥 Friend Links (They Page)
- Showcase your friends and their websites
- Customizable avatars and descriptions
- Admin management interface for friend links
- Beautiful card-based display layout

### 💬 Comment System
- **Linux DO OAuth Integration** - Seamless authentication with Linux DO accounts
- Comment moderation in admin panel
- Display Linux DO usernames and trust levels
- Optional: Restrict comments to Linux DO users only

### 🔐 Admin Dashboard
- **Photo Management** - Comprehensive photo management with filtering and pagination
- **Reusable Photo Selector** - Modal component for selecting photos across the app
- **Album Management** - Create, edit, and organize albums
- **Story Management** - Create and manage photo stories with photo selection
- **Friend Links Management** - Add, edit, and remove friend links
- **Blog Editor** - Markdown blog post editor with preview
- **System Settings** - Configure site title, description, social links, and more
- **Comment Moderation** - Review and manage user comments
- **Activity Logs** - Track admin actions and system events

### 🏠 Homepage
- **Dynamic Hero Section** - Random hero images from your gallery
- **Particle Effects** - Beautiful animated particle background
- **Auto Carousel** - Automatic image slideshow
- **Scroll Animations** - Smooth scroll-triggered animations

### 🌍 Internationalization
- Chinese (中文) and English support
- Easy to extend for more languages
- Comprehensive i18n coverage across all pages

### 🎨 Theming
- Dark and Light mode support
- Smooth theme transitions
- System preference detection
- Consistent styling across all components

### ☁️ Multiple Storage Backends
- **Local Storage** - Store files on local filesystem
- **GitHub** - Use GitHub repository as storage
- **Cloudflare R2** - S3-compatible object storage

---

## 功能特性

### 📷 照片画廊
- **多种视图模式** - 宫格、瀑布流、时间线视图，支持平滑切换
- **EXIF 信息提取** - 自动提取相机、镜头、光圈、快门、ISO 等信息
- **主色调提取** - 自动提取图片主色调，用于美观的占位符显示
- **相册管理** - 将照片组织到相册中，支持封面图片
- **批量上传** - 支持多图上传，显示上传进度，可选择目标相册
- **照片分页** - 高效的分页加载，适合大量照片
- **响应式设计** - 针对桌面、平板和移动设备优化

### 📖 故事/叙事
- 将多张照片组合成故事
- 支持 Markdown 富文本描述
- 精美的故事展示布局
- 故事内照片管理（添加/移除照片）

### 👥 友链功能（They 页面）
- 展示朋友及其网站
- 可自定义头像和描述
- 后台友链管理界面
- 精美的卡片式展示布局

### 💬 评论系统
- **Linux DO OAuth 集成** - 无缝对接 Linux DO 账号认证
- 后台评论审核
- 显示 Linux DO 用户名和信任等级
- 可选：仅限 Linux DO 用户评论

### 🔐 后台管理系统
- **照片管理** - 全面的照片管理，支持筛选和分页
- **可复用照片选择器** - 模态框组件，可在应用各处选择照片
- **相册管理** - 创建、编辑和组织相册
- **故事管理** - 创建和管理照片故事，支持照片选择
- **友链管理** - 添加、编辑和删除友链
- **博客编辑器** - Markdown 博客编辑器，支持预览
- **系统设置** - 配置站点标题、描述、社交链接等
- **评论审核** - 审核和管理用户评论
- **操作日志** - 追踪管理员操作和系统事件

### 🏠 首页
- **动态英雄区域** - 从图库随机展示英雄图片
- **粒子效果** - 精美的动画粒子背景
- **自动轮播** - 自动图片轮播展示
- **滚动动画** - 平滑的滚动触发动画

### 🌍 多语言支持
- 中文和英文支持
- 易于扩展更多语言
- 全面的国际化覆盖

### 🎨 主题切换
- 深色/浅色模式
- 平滑的主题过渡
- 跟随系统偏好
- 所有组件风格统一

### ☁️ 多种存储后端
- **本地存储** - 存储在本地文件系统
- **GitHub** - 使用 GitHub 仓库作为存储
- **Cloudflare R2** - S3 兼容的对象存储

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **API** | Hono.js |
| **Database ORM** | Prisma |
| **Styling** | Tailwind CSS 4 |
| **Animation** | Framer Motion |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Image Processing** | Sharp, ExifReader |
| **Authentication** | JWT, Linux DO OAuth |
| **State Management** | React Context |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL (production) or SQLite (development)

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/mo-gallery.git
cd mo-gallery

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env file with your settings

# Initialize database
pnpm run prisma:dev

# Start development server
pnpm run dev
```

Visit `http://localhost:3000` to see your gallery!

### Minimal Environment Variables

```env
# Database (SQLite for local development)
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# JWT Secret (change in production!)
JWT_SECRET="your-secret-key"

# Admin credentials (for initial seed)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

---

## ⚙️ Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection URL | `file:./dev.db` or PostgreSQL URL |
| `DIRECT_URL` | Direct database URL (for migrations) | Same as DATABASE_URL |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_USERNAME` | Admin username for seed | `admin` |
| `ADMIN_PASSWORD` | Admin password for seed | `admin123` |
| `NEXT_PUBLIC_ADMIN_LOGIN_URL` | Hidden admin login path | - |
| `SITE_TITLE` | Site title | `MO GALLERY` |
| `CDN_DOMAIN` | CDN domain for assets | - |

### Linux DO OAuth (Optional)

| Variable | Description |
|----------|-------------|
| `LINUXDO_CLIENT_ID` | OAuth Client ID |
| `LINUXDO_CLIENT_SECRET` | OAuth Client Secret |
| `LINUXDO_REDIRECT_URI` | Callback URL (e.g., `https://your-domain.com/login/callback`) |
| `LINUXDO_COMMENTS_ONLY` | Restrict comments to Linux DO users (`true`/`false`) |

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start with PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Docker Build

```bash
# Build image
docker build -t mo-gallery .

# Run container
docker run -p 3000:3000 --env-file .env mo-gallery
```

---

## ▲ Vercel Deployment

1. **Fork** this repository
2. **Import** the project in Vercel
3. **Configure** environment variables (see `.env.example`)
4. **Set** build command to `pnpm run build:vercel`
5. **Use** Neon or Supabase as your database

> ⚠️ **Note**: Local storage is not supported on Vercel. Use GitHub or R2 storage instead.

### Database Options for Vercel

- **[Neon](https://neon.tech/)** - Serverless PostgreSQL (recommended)
- **[Supabase](https://supabase.com/)** - PostgreSQL with additional features
- **[PlanetScale](https://planetscale.com/)** - MySQL-compatible serverless database

---

## 📁 Project Structure

```
mo-gallery-web/
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Prisma model definitions
│   ├── seed.ts              # Database seeding script
│   └── migrations/          # Migration history
├── server/lib/              # Server-side utilities
│   ├── db.ts                # Prisma client singleton
│   ├── jwt.ts               # JWT utilities
│   ├── exif.ts              # EXIF extraction
│   ├── colors.ts            # Dominant color extraction
│   └── storage/             # Storage abstraction layer
│       ├── types.ts         # Interface definitions
│       ├── factory.ts       # Factory function
│       ├── local.ts         # Local storage implementation
│       ├── github.ts        # GitHub storage implementation
│       └── r2.ts            # R2 storage implementation
├── hono/                    # API routes (Hono.js)
│   ├── index.ts             # Route aggregation
│   ├── auth.ts              # Authentication & Linux DO OAuth
│   ├── photos.ts            # Photo management with pagination
│   ├── albums.ts            # Album management
│   ├── stories.ts           # Stories/Narratives
│   ├── blogs.ts             # Blog posts
│   ├── comments.ts          # Comments with user info
│   ├── friends.ts           # Friend links management
│   ├── settings.ts          # System settings
│   └── middleware/          # Auth middleware
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API entry point (Hono integration)
│   │   ├── admin/           # Admin dashboard pages
│   │   │   ├── photos/      # Photo management
│   │   │   ├── albums/      # Album management
│   │   │   ├── friends/     # Friend links management
│   │   │   ├── settings/    # System settings
│   │   │   └── logs/        # Activity logs
│   │   ├── gallery/         # Public gallery page
│   │   ├── story/           # Story pages
│   │   ├── blog/            # Blog pages
│   │   ├── they/            # Friend links page
│   │   └── login/           # Login pages (admin & OAuth callback)
│   ├── components/          # React components
│   │   ├── admin/           # Admin-specific components
│   │   │   ├── PhotoSelectorModal.tsx  # Reusable photo selector
│   │   │   ├── PhotoDetailPanel.tsx    # Photo detail editing
│   │   │   └── AdminSidebar.tsx        # Admin navigation
│   │   ├── gallery/         # Gallery view components
│   │   │   ├── GridView.tsx
│   │   │   ├── MasonryView.tsx
│   │   │   └── TimelineView.tsx
│   │   └── ui/              # Common UI components
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx          # Authentication state
│   │   ├── ThemeContext.tsx         # Theme management
│   │   ├── LanguageContext.tsx      # i18n state
│   │   ├── SettingsContext.tsx      # Site settings
│   │   └── UploadQueueContext.tsx   # Upload queue management
│   └── lib/                 # Frontend utilities
│       ├── api.ts           # API client with auth
│       ├── i18n.ts          # Internationalization strings
│       └── utils.ts         # Helper functions
└── public/                  # Static assets
```

---

## 📝 Development Commands

```bash
# Development
pnpm run dev           # Start development server
pnpm run build         # Build for production
pnpm run start         # Start production server
pnpm run lint          # Run ESLint

# Database
pnpm run prisma:dev      # Create and apply migrations (development)
pnpm run prisma:deploy   # Apply migrations (production)
pnpm run prisma:generate # Generate Prisma client
pnpm run prisma:seed     # Initialize admin account
pnpm run prisma:studio   # Open Prisma Studio
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🔄 Recent Updates

### 2026-01-01
- ✨ **Friend Links** - Added friend links management and public display page (`/they`)
- 🔐 **Linux DO OAuth** - Integrated Linux DO account binding and authentication
- 📸 **Photo Management** - Added pagination, album selection during upload
- 🎨 **Photo Selector Modal** - Reusable component for selecting photos across the app
- 🏠 **Homepage Enhancement** - Dynamic particle effects, auto carousel, random hero images
- 🌐 **i18n Updates** - Comprehensive internationalization for all new features
- 🐛 **Bug Fixes** - Fixed mobile menu state, login page Suspense wrapper

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by MO Gallery Contributors**

[Report Bug](https://github.com/yourusername/mo-gallery/issues) · [Request Feature](https://github.com/yourusername/mo-gallery/issues)

</div>
