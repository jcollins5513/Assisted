# 📁 Project File Structure

## 🚗 Car Sales AI Assistant

```
Assisted-1/
├── 📄 master-plan.md                    # High-level project roadmap
├── 📄 granular-plan.md                  # Session-specific task breakdown
├── 📄 filestructure.md                  # This file - tracks project structure
├── 📁 .cursor/                          # Cursor IDE configuration
│   └── 📁 rules/                        # Cursor rules and documentation
│       └── 📄 start-of-project.mdc      # Project initialization rules
├── 📁 .git/                             # Git version control
└── 📁 ✅ frontend/                      # React/Next.js frontend application
    ├── 📄 .env.local                   # Frontend environment (API base URL)
    ├── 📄 Dockerfile                    # Frontend Docker configuration
    ├── 📁 src/
    │   ├── 📁 app/                      # Next.js app directory
    │   │   ├── 📄 page.tsx              # Main page (redirects to dashboard)
    │   │   ├── 📄 layout.tsx            # Root layout
    │   │   ├── 📄 favicon.ico           # App icon
    │   │   ├── 📄 globals.css           # Global styles
    │   │   ├── 📁 dashboard/            # Main dashboard
    │   │   │   └── 📄 page.tsx          # Dashboard home page
    │   │   ├── 📁 sales-training/       # Sales training module
    │   │   │   └── 📄 page.tsx          # Sales training page
    │   │   ├── 📁 content-creator/      # Content creation module
    │   │   │   └── 📄 page.tsx          # Content creator page
    │   │   ├── 📁 remote-execution/     # Remote execution module
    │   │   │   └── 📄 page.tsx          # Remote execution page
    │   │   ├── 📁 settings/             # User settings
    │   │   │   └── 📄 page.tsx          # Settings page
    │   │   └── 📁 help/                 # Help and documentation
    │   │       └── 📄 page.tsx          # Help center page
    │   ├── 📁 components/               # Reusable UI components
    │   │   ├── 📁 layout/               # Layout components
    │   │   │   ├── 📄 DashboardLayout.tsx # Main dashboard layout
    │   │   │   ├── 📄 Sidebar.tsx       # Navigation sidebar
    │   │   │   └── 📄 Header.tsx        # Page header with breadcrumbs
    │   │   ├── 📁 dashboard/            # Dashboard-specific components
    │   │   │   ├── 📄 QuickAccessCards.tsx # Quick access cards
    │   │   │   └── 📄 DashboardWidgets.tsx # Performance widgets
    │   │   ├── 📄 VoiceRecorder.tsx     # Voice recording component
    │   │   ├── 📄 ConversationDashboard.tsx # Conversation analysis
    │   │   ├── 📁 content/              # Content creation components
    │   │   │   ├── 📄 TemplateSelector.tsx
    │   │   │   ├── 📄 ImageUploader.tsx
    │   │   │   ├── 📄 ContentGenerator.tsx
    │   │   │   ├── 📄 ContentPreview.tsx
    │   │   │   └── 📄 SocialMediaPublisher.tsx
    │   │   └── 📁 remote/               # Remote execution components
    │   │       ├── 📄 ConnectionManager.tsx
    │   │       ├── 📄 ScriptExecutor.tsx
    │   │       ├── 📄 ExecutionMonitor.tsx
    │   │       ├── 📄 BackgroundRemoval.tsx
    │   │       ├── 📄 FileTransfer.tsx        # NEW: File transfer UI
    │   │       ├── 📄 QualityReview.tsx       # NEW: Quality review UI
    │   │       └── 📄 ErrorMonitor.tsx        # NEW: Error monitoring UI
    │   ├── 📁 hooks/                    # Custom React hooks
    │   │   ├── 📄 useVoiceRecorder.ts
    │   │   ├── 📄 useApi.ts             # API call hooks
    │   │   └── 📄 useAuth.ts            # Authentication hooks
    │   ├── 📁 services/                 # API and external service integrations
    │   │   ├── 📄 audioStreamService.ts
    │   │   ├── 📄 conversationAnalysisService.ts
    │   │   ├── 📄 api.ts                # Main API service layer
    │   │   └── 📄 auth.ts               # Authentication service
    │   ├── 📁 utils/                    # Utility functions
    │   │   ├── 📄 errorHandler.ts       # Error handling utilities
    │   │   └── 📄 performance.ts        # Performance monitoring
    │   ├── 📁 types/                    # TypeScript type definitions
    │   └── 📁 styles/                   # CSS/styling files
    ├── 📄 package.json                  # Frontend dependencies
    ├── 📄 tsconfig.json                 # TypeScript configuration
    └── 📄 next.config.js                # Next.js configuration
└── 📁 ✅ backend/                       # Node.js/Express backend API
    ├── 📄 .env                          # Backend environment (JWT, DB, CORS)
    ├── 📄 Dockerfile                    # Backend Docker configuration
    ├── 📁 src/
    │   ├── 📄 server.ts                 # Main server file
    │   ├── 📁 controllers/              # Request handlers
    │   ├── 📁 models/                   # Database models
    │   │   ├── 📄 User.ts
    │   │   └── 📄 Conversation.ts
    │   ├── 📁 routes/                   # API route definitions
    │   │   ├── 📄 auth.ts
    │   │   ├── 📄 users.ts
    │   │   ├── 📄 conversations.ts
    │   │   ├── 📄 content.ts
     │   │   ├── 📄 uploads.ts
     │   │   ├── 📄 remote-execution.ts
     │   │   └── 📄 quality.ts            # NEW: Quality assessment routes
    │   ├── 📁 middleware/               # Express middleware
    │   │   ├── 📄 auth.ts
    │   │   └── 📄 errorHandler.ts
    │   ├── 📁 services/                 # Business logic services
    │   │   ├── 📄 remoteExecutionService.ts
    │   │   ├── 📄 apiService.ts         # Main API service layer
     │   │   ├── 📄 conversationAnalysisService.ts # Server-side analysis
     │   │   ├── 📄 realtimeSttWhisper.ts # Whisper.cpp streaming bridge
     │   │   ├── 📄 conversationStore.ts  # Persist transcripts/analysis
    │   │   ├── 📄 authService.ts        # Authentication service
    │   │   ├── 📄 fileTransferService.ts      # NEW: File transfer service
    │   │   └── 📄 qualityAssessmentService.ts # NEW: Quality assessment service
    │   ├── 📁 utils/                    # Utility functions
    │   ├── 📁 config/                   # Configuration files
    │   └── 📁 types/                    # TypeScript type definitions
    ├── 📄 package.json                  # Backend dependencies
    └── 📄 server.js                     # Main server file
└── 📁 ✅ shared/                        # Shared code between frontend/backend
    ├── 📁 types/                        # Shared TypeScript types
    └── 📁 utils/                        # Shared utility functions
└── 📁 ✅ docs/                          # Project documentation
    ├── 📁 user-manual/                  # User documentation
    │   ├── 📄 getting-started.md        # Getting started guide
    │   ├── 📄 sales-training-guide.md   # Sales training module guide
    │   ├── 📄 content-creator-guide.md  # Content creation workflow
    │   ├── 📄 remote-execution-guide.md # Remote processing guide
    │   ├── 📄 troubleshooting.md        # Common issues and solutions
    │   └── 📄 faq.md                    # Frequently asked questions
    └── 📁 technical/                    # Technical documentation
        ├── 📄 api-reference.md          # Complete API documentation
        ├── 📄 architecture.md           # System architecture overview
        ├── 📄 database-schema.md        # Database design and relationships
        ├── 📄 deployment.md             # Deployment procedures and configuration
        ├── 📄 security.md               # Security protocols and compliance
        ├── 📄 performance.md            # Performance optimization guidelines
        └── 📄 code-style-guide.md       # Code documentation and style standards
└── 📁 ✅ scripts/                       # Build and deployment scripts
    ├── 📄 background-removal.ps1        # PowerShell script for background removal (rembg)
    ├── 📄 backgroundremover-cli.ps1     # NEW: PowerShell wrapper for nadermx BackgroundRemover
    └── 📄 deploy.sh                     # Deployment automation script
├── 📄 docker-compose.yml                # Docker Compose configuration
├── 📄 nginx.conf                        # Nginx reverse proxy configuration
├── 📄 env.example                       # Environment variables template
├── 📄 .gitignore                        # Git ignore rules
└── 📄 README.md                         # Main project documentation
```

## 📊 Structure Legend
- 📄 File
- 📁 Directory
- [PLANNED] Not yet created
- ✅ Completed
- 🔄 In Progress

## 📈 Recent Additions
- `scripts/backgroundremover-cli.ps1` - Wrapper to run nadermx BackgroundRemover CLI with batch/video options
- `backend/src/services/fileTransferService.ts` - File transfer queue with progress and retries
- `backend/src/services/qualityAssessmentService.ts` - Quality assessment with scoring and suggestions
- `frontend/src/components/remote/FileTransfer.tsx` - File transfer UI
- `frontend/src/components/remote/QualityReview.tsx` - Quality review UI
- `frontend/src/components/remote/ErrorMonitor.tsx` - Error monitoring UI
- `backend/src/routes/quality.ts` - Quality assessment REST API routes
- `backend/src/services/realtimeSttWhisper.ts` - Whisper.cpp integration for streaming STT
- `backend/src/services/conversationStore.ts` - JSON-backed conversation event store
- `backend/src/services/conversationAnalysisService.ts` - Server-side analysis

---

*This file is automatically updated as new files and directories are added to the project.*
