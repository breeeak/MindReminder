# MindReminder

<div align="center">

![MindReminder Logo](resources/icon.png)

**Intelligent Spaced Repetition Learning Desktop Application**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-39.2-brightgreen.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)

English | [简体中文](./README.md)

</div>

---

## 📖 Introduction

MindReminder is a desktop application designed for self-directed learners, helping users efficiently memorize and review knowledge through scientifically proven **Spaced Repetition** algorithms. The application uses local data storage to ensure complete user control and privacy protection.

### 🎯 Core Problem

Knowledge learners commonly face the "**learn and forget**" pain point. While spaced repetition has been scientifically proven to effectively combat the forgetting curve, there's a lack of desktop tools that truly adapt to individual learning rhythms. Existing tools have fixed review frequencies and cannot flexibly adjust to personal situations.

### 💡 Solution

MindReminder solves these pain points through unique features:

- **🔧 Highly Customizable Review Algorithm** - Supports global and per-item frequency coefficient adjustment (0.5x-1.5x)
- **📅 Calendar-Based Visualization** - Intuitively displays learning trajectory and review plans
- **😊 Humanized Self-Assessment** - Uses emoji (😟→🎯) instead of traditional numeric ratings
- **📊 Predictive Memory Progress** - Tells you when you'll truly master knowledge points
- **🗂️ Three-in-One Management** - Integrates knowledge points, diary, and reminders
- **🔒 Fully Local Storage** - 100% data control, no internet required

---

## ✨ Core Features

### 📚 Intelligent Knowledge Management

- **Question-Based Recording** - Organize knowledge in question format, aligned with active learning principles
- **Tag Classification** - Flexible tagging and categorization system
- **Powerful Search** - Quick knowledge point lookup and filtering
- **Review History** - Complete rating trends and review records

### 🧠 Scientific Review Algorithm

- **Ebbinghaus Forgetting Curve** - Based on research-backed spaced repetition algorithm
- **Dynamic Interval Adjustment** - Automatically adjusts review timing based on ratings
- **Flexible Coefficient Control** - Adjustable global and per-item review frequency
- **Mastery Standard Detection** - Automatically identifies knowledge point mastery level
- **Long-term Review Mechanism** - Periodic review of mastered knowledge

### 📊 Visual Calendar

- **Heatmap Display** - 6-level color intensity reflects learning intensity
- **Multi-View Switching** - Month view, week view, year view
- **Daily Summary** - Today's new, review, and completion statistics
- **Historical Review** - Overview of all learning activities

### 📝 Diary and Reminders

- **Markdown Diary** - Rich text editing for learning reflections
- **Reminder Items** - Manage to-dos and important events
- **Calendar Integration** - Unified display of knowledge, diary, and reminders

### ⚙️ System Integration

- **System Tray** - Minimize to tray for quick access
- **Global Hotkeys** - Quick recording anytime, anywhere
- **Desktop Notifications** - Review reminders and task notifications
- **Auto-Start** - Optional automatic launch
- **Data Backup** - Automatic daily backup, keep 7 days

---

## 🏗️ Technology Stack

### Core Technologies

#### Framework
- **Electron** `39.2.6` - Cross-platform desktop framework
- **Vite** `7.2.6` - Next-generation build tool
- **electron-vite** `5.0.0` - Electron-specific Vite configuration

#### Frontend
- **React** `19.2.1` - UI framework
- **TypeScript** `5.9.3` - Type safety
- **Ant Design** `6.1.0` - UI component library
- **Zustand** `5.0.9` - Lightweight state management

#### Data Storage
- **SQLite** - Local relational database
- **better-sqlite3** `12.5.0` - Node.js SQLite3 binding

#### Utilities
- **dayjs** `1.11.19` - Date handling
- **react-markdown** `10.1.0` - Markdown rendering
- **react-router-dom** `7.10.1` - Routing
- **electron-log** `5.4.3` - Logging system

#### Development Tools
- **ESLint** `9.39.1` - Code linting
- **Prettier** `3.7.4` - Code formatting
- **Vitest** `4.0.15` - Unit testing framework

### Architecture Design

```
┌─────────────────────────────────────────────────────────┐
│                    MindReminder                         │
├─────────────────────────────────────────────────────────┤
│  Renderer Process (React)  │  Main Process (Node.js)    │
│                            │                            │
│  ┌──────────────────┐     │  ┌──────────────────┐     │
│  │   UI Components  │     │  │   IPC Handlers   │     │
│  │   - Calendar     │◄────┼──┤   - Knowledge    │     │
│  │   - Review       │     │  │   - Review       │     │
│  │   - Knowledge    │     │  │   - Statistics   │     │
│  └────────┬─────────┘     │  └────────┬─────────┘     │
│           │               │           │               │
│  ┌────────▼─────────┐     │  ┌────────▼─────────┐     │
│  │  Zustand Stores  │     │  │    Services      │     │
│  │  - State Mgmt    │     │  │  - Business Logic│     │
│  └──────────────────┘     │  └────────┬─────────┘     │
│           │               │           │               │
│  ┌────────▼─────────┐     │  ┌────────▼─────────┐     │
│  │   Context API    │     │  │  Repositories    │     │
│  └──────────────────┘     │  │  - Data Access   │     │
│                            │  └────────┬─────────┘     │
│                            │           │               │
├────────────────────────────┼───────────▼───────────────┤
│  Preload Script (Bridge)   │  ┌──────────────────┐     │
│  - Context Bridge          │  │  SQLite Database │     │
│  - IPC Communication       │  │  - Knowledge     │     │
│                            │  │  - Reviews       │     │
│                            │  │  - Settings      │     │
│                            │  └──────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Core Algorithm

**Spaced Repetition Implementation** (`src/main/algorithms/SpacedRepetitionAlgorithm.ts`)

Based on Ebbinghaus forgetting curve, implements scientific review interval calculation:

```typescript
// Base review intervals (days)
BASE_INTERVALS = [1, 2, 4, 7, 15, 30]

// Rating coefficients
RATING_MULTIPLIERS = {
  1: 0.5,  // 😟 Forgot
  2: 0.7,  // 🤔 Barely remember
  3: 1.0,  // 😐 Remember ok
  4: 1.2,  // 😊 Remember well
  5: 1.5   // 🎯 Very familiar
}

// Next review time = Current time + Base interval × Rating coefficient × Global coefficient × Item coefficient
```

**Features:**
- ✅ 100% unit test coverage
- ✅ Global and per-item frequency coefficients
- ✅ Dynamic interval adjustment
- ✅ Mastery standard detection
- ✅ Long-term review mechanism

---

## 🚀 Quick Start

### Requirements

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **OS**: Windows 10+, macOS 10.14+

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/MindReminder.git
cd MindReminder

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build

```bash
# Type checking
pnpm typecheck

# Build application
pnpm build

# Package for Windows
pnpm build:win

# Package for macOS
pnpm build:mac
```

---

## 📁 Project Structure

```
MindReminder/
├── src/
│   ├── main/                      # Main process code
│   │   ├── algorithms/            # Core algorithms
│   │   │   ├── SpacedRepetitionAlgorithm.ts
│   │   │   └── SpacedRepetitionAlgorithm.test.ts
│   │   ├── database/              # Database layer
│   │   │   ├── DatabaseService.ts
│   │   │   ├── migrations/        # Database migrations
│   │   │   ├── repositories/      # Repository layer
│   │   │   └── types/             # Data type definitions
│   │   ├── services/              # Business logic services
│   │   ├── ipc/                   # IPC handlers
│   │   └── utils/                 # Utility functions
│   │
│   ├── preload/                   # Preload scripts
│   │   ├── index.ts               # Context Bridge definition
│   │   └── index.d.ts             # IPC API type definitions
│   │
│   ├── renderer/                  # Renderer process (React app)
│   │   └── src/
│   │       ├── components/        # UI components
│   │       ├── pages/             # Page components
│   │       ├── stores/            # Zustand state management
│   │       ├── types/             # Type definitions
│   │       ├── styles/            # Style files
│   │       └── theme.ts           # Ant Design theme config
│   │
│   └── common/                    # Shared code
│       └── ipc-channels.ts        # IPC channel constants
│
├── docs/                          # Documentation
│   ├── prd.md                     # Product requirements
│   ├── architecture.md            # Architecture design
│   └── stories/                   # Epic and Story docs
│
├── build/                         # Build resources
├── resources/                     # Application resources
├── scripts/                       # Utility scripts
│
├── electron.vite.config.ts        # Electron Vite config
├── electron-builder.yml           # Package configuration
├── package.json                   # Project configuration
├── tsconfig.json                  # TypeScript config
└── README.md                      # This file
```

---

## 💻 Development Guide

### Development Setup

1. **Install dependencies**
```bash
pnpm install
```

2. **Start development server**
```bash
pnpm dev
```

The application will launch with HMR (Hot Module Replacement) enabled.

### Code Standards

The project uses ESLint and Prettier for code quality:

```bash
# Code linting
pnpm lint

# Code formatting
pnpm format

# Type checking
pnpm typecheck
```

### Naming Conventions

**Database naming** (snake_case)
```sql
-- Table names: singular
knowledge, review_history, diary

-- Column names: lowercase snake_case
created_at, next_review_at, mastery_status
```

**TypeScript code** (camelCase/PascalCase)
```typescript
// Variables, functions: camelCase
const knowledgeList = []
function calculateNextReview() {}

// Types, interfaces, components: PascalCase
interface Knowledge {}
class KnowledgeRepository {}
function ReviewCard() {}

// Constants: UPPER_SNAKE_CASE
const MAX_REVIEW_COUNT = 100
```

**IPC channel naming**
```typescript
// Format: {entity}:{action}
'knowledge:getAll'
'knowledge:create'
'review:submitRating'
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in UI mode
pnpm test:ui

# Run tests once
pnpm test:run
```

### Coverage Requirements

- **Core algorithms** (`SpacedRepetitionAlgorithm`): 100% coverage ✅
- **Repository layer**: >80% coverage
- **Service layer**: >80% coverage
- **Utility functions**: >80% coverage

---

## 📦 Build & Package

### Development Build

```bash
# Build code (no packaging)
pnpm build

# Preview build
pnpm preview
```

### Production Package

**Windows**
```bash
# Build and package Windows installer
pnpm build:win

# Output files
# dist/MindReminder-1.0.0-Setup.exe (installer)
# dist/win-unpacked/ (portable)
```

**macOS**
```bash
# Build and package macOS app
pnpm build:mac

# Output files
# dist/MindReminder-1.0.0.dmg (disk image)
# dist/mac/MindReminder.app (application)
```

**Linux**
```bash
# Build and package Linux app
pnpm build:linux

# Output files
# dist/MindReminder-1.0.0.AppImage
# dist/mindreminder-1.0.0.deb
```

---

## 🗂️ Data Storage

### Data Location

Application data is stored at:

- **Windows**: `%APPDATA%/MindReminder/`
- **macOS**: `~/Library/Application Support/MindReminder/`
- **Linux**: `~/.config/MindReminder/`

### Database Schema

**knowledge** - Knowledge points table
```sql
CREATE TABLE knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  category_id TEXT,
  frequency_coefficient REAL DEFAULT 1.0,
  mastery_status TEXT DEFAULT 'learning',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  next_review_at INTEGER,
  review_count INTEGER DEFAULT 0
)
```

**review_history** - Review history table
```sql
CREATE TABLE review_history (
  id TEXT PRIMARY KEY,
  knowledge_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL,
  next_review_at INTEGER NOT NULL,
  interval_days REAL NOT NULL,
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id)
)
```

### Backup & Recovery

The application supports automatic backups:

- **Auto backup**: Daily automatic database backup
- **Retention**: Keep last 7 days of backups
- **Backup location**: `{data directory}/backups/`
- **Manual backup**: Trigger backup in settings

---

## 🛠️ Troubleshooting

### Common Issues

**Issue: Application won't start**
```bash
# Clean dependencies and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue: Database errors**
```bash
# Windows
.\scripts\clear-database.ps1

# Or manually delete database file
# Windows: %APPDATA%/MindReminder/mindreminder.db
# macOS: ~/Library/Application Support/MindReminder/mindreminder.db
```

**Issue: Build fails**
```bash
# Clean build cache
rm -rf out dist

# Rebuild
pnpm build
```

### Logs

Application logs are located at:

- **Windows**: `%APPDATA%/MindReminder/logs/`
- **macOS**: `~/Library/Logs/MindReminder/`
- **Linux**: `~/.config/MindReminder/logs/`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

### Contribution Process

1. **Fork the project**
2. **Create feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Create Pull Request**

### Development Standards

- ✅ Follow project code standards (ESLint + Prettier)
- ✅ Write clear commit messages
- ✅ Add tests for new features
- ✅ Update relevant documentation
- ✅ Ensure all tests pass
- ✅ Maintain code coverage

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (no functional change)
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Build/tooling

**Example**
```
feat(review): add review statistics chart

- Add monthly review statistics
- Add knowledge mastery pie chart
- Optimize statistics calculation performance

Closes #123
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

This project is built on these excellent open-source projects:

- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Next-generation build tool
- [Ant Design](https://ant.design/) - Enterprise UI design language
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - High-performance SQLite3 binding
- [Zustand](https://github.com/pmndrs/zustand) - Lightweight state management

Special thanks to all contributors!

---

## 📞 Contact

- **Team**: MindReminder Team
- **Email**: your.email@example.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/MindReminder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/MindReminder/discussions)

---

## 🗺️ Roadmap

### Completed ✅
- [x] Project infrastructure
- [x] Knowledge CRUD
- [x] Spaced repetition algorithm
- [x] Review system
- [x] Calendar heatmap
- [x] Diary feature
- [x] Reminders
- [x] Statistics
- [x] Data backup

### In Progress 🚧
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Internationalization

### Planned 📋

**Phase 2 (6-12 months)**
- [ ] Cloud sync
- [ ] Multi-device data sync
- [ ] Data encryption

**Phase 3 (12+ months)**
- [ ] Mobile apps (iOS/Android)
- [ ] Knowledge graph visualization
- [ ] AI-assisted features
- [ ] Community sharing

---

<div align="center">

**If this project helps you, please give it a ⭐️ Star!**

[⬆ Back to top](#mindreminder)

Made with ❤️ by MindReminder Team

</div>
