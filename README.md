<div align="center">

<img src="spcet_logo.png" alt="SPCET Logo" width="120"/>

# 🎓 CertiPortal

### Student Certificate Management System

**A modern, role-based platform for requesting, approving, and managing academic certificates — built for colleges & universities.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-certi--portal.vercel.app-4F46E5?style=for-the-badge)](https://certi-portal.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

</div>

---

## 🌐 Live Demo

> **[https://certi-portal.vercel.app/](https://certi-portal.vercel.app/)**

---

## 📖 About the Project

**CertiPortal** is a full-stack web application that digitizes and streamlines the academic certificate request workflow for educational institutions. Students can request certificates online, administrators can review and approve/reject applications, and designated authorities can sign off on multi-level approval chains — all from a single platform.

### The Problem It Solves

Traditional certificate request processes in colleges involve manual paperwork, long queues, and opaque status tracking. CertiPortal replaces this with:

- 🖥️ **Online requests** — No physical visits required
- 🔄 **Real-time status updates** — Students always know where their application stands
- 📋 **Multi-level approvals** — Configurable approval chains (e.g., HOD → Certificate Section → Principal)
- 📄 **PDF generation** — Certificates generated and delivered digitally

---

## ✨ Features

### 👨‍🎓 Student Portal
| Feature | Description |
|---|---|
| 📝 Certificate Requests | Apply for any supported certificate type online |
| 📊 Application Tracking | Real-time status: Pending → Approved / Rejected |
| 📥 My Certificates | View and download all issued certificates as PDF |
| 👤 Profile Management | Manage personal academic details |
| 🔔 Notifications | Get notified on approval decisions |

### 🛡️ Admin Dashboard
| Feature | Description |
|---|---|
| 📋 Applications Management | View, filter, search, and act on all student certificate requests |
| 📄 Template Manager | Upload and manage certificate templates per type |
| 👥 Authority Management | Create and manage authority accounts |
| 🔗 Approval Chain Builder | Configure who approves each certificate type and in what order |
| 📊 Statistics | Overview of total requests, pending, approved, students & authorities |

### 🏛️ Authority Dashboard
| Feature | Description |
|---|---|
| ✅ Certificate Approval | Approve or reject certificates routed through the approval chain |
| 🔔 Notification Bell | Real-time alerts for pending approvals |

---

## 📜 Supported Certificate Types

| Certificate | Route |
|---|---|
| 🏫 Bonafide Certificate | `/student/certificates/bonafide` |
| 🎓 Transfer Certificate (TC) | `/student/certificates/tc` |
| 📅 Attendance Certificate | `/student/certificates/attendance` |
| 🧑‍⚖️ Conduct Certificate | `/student/certificates/conduct` |
| 🏋️ Training Certificate | `/student/certificates/training` |
| 📘 Course Completion Certificate | `/student/certificates/course_completion` |
| 💼 Internship Training Letter | `/student/certificates/internship` |
| 🧩 Custom Certificate (Template-based) | `/student/certificates/custom/:templateId` |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **UI Components** | shadcn/ui, Radix UI, Tailwind CSS |
| **State Management** | TanStack React Query |
| **Forms** | React Hook Form + Zod |
| **Backend / Auth / DB** | Supabase (PostgreSQL + Edge Functions + RLS) |
| **PDF Generation** | jsPDF + html2canvas |
| **Routing** | React Router v6 |
| **Deployment** | Vercel |

---

## 🗂️ Project Structure

```
Certi-Portal/
├── src/
│   ├── pages/
│   │   ├── Login.tsx               # Login page
│   │   ├── Settings.tsx            # User settings
│   │   ├── admin/
│   │   │   └── Dashboard.tsx       # Admin dashboard (requests, templates, authorities, chains)
│   │   ├── authority/
│   │   │   └── Dashboard.tsx       # Authority approval dashboard
│   │   └── student/
│   │       ├── Dashboard.tsx       # Student home
│   │       ├── Applications.tsx    # Application status tracker
│   │       ├── MyCertificates.tsx  # Issued certificates
│   │       ├── Profile.tsx         # Student profile
│   │       ├── Register.tsx        # Student registration
│   │       └── certificates/       # Individual certificate request pages
│   ├── components/
│   │   ├── admin/                  # Admin-specific components
│   │   ├── certificates/           # Certificate rendering components
│   │   ├── forms/                  # Reusable form components
│   │   ├── layout/                 # ProtectedRoute, layouts
│   │   └── ui/                     # shadcn/ui component library
│   ├── hooks/                      # Custom React hooks (useCertificates, etc.)
│   ├── integrations/
│   │   └── supabase/               # Supabase client & type definitions
│   └── lib/                        # Utility functions
├── supabase/
│   ├── functions/                  # Supabase Edge Functions
│   │   ├── approve-certificate/
│   │   ├── create-admin-user/
│   │   ├── generate-certificate/
│   │   └── manage-authority/
│   └── migrations/                 # Database migration SQL files
├── .env.example                    # Environment variable template
├── vercel.json                     # Vercel deployment config
└── package.json
```

---

## 👥 User Roles

| Role | Access |
|---|---|
| `student` | Request certificates, track status, download issued certificates |
| `admin` / `hod` | Full admin dashboard — review requests, manage templates & authorities |
| `authority` | Approve/reject certificates assigned to them via the approval chain |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** >= 18 — [Download](https://nodejs.org/)
- **npm** or **bun**
- A **Supabase** project — [Create one free](https://supabase.com/)

### 1. Clone the Repository

```sh
git clone https://github.com/Pavithran1729/Certi-Portal.git
cd Certi-Portal
```

### 2. Install Dependencies

```sh
npm install
# or
bun install
```

### 3. Configure Environment Variables

```sh
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> 💡 Find these in your Supabase project: **Settings → API**

### 4. Set Up the Database

Run the SQL migrations from the `supabase/migrations/` folder in your Supabase SQL editor, in order.

### 5. Start the Development Server

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ☁️ Deployment (Vercel)

The project is optimized for Vercel deployment.

### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Pavithran1729/Certi-Portal)

### Option B: Manual Deploy

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/)
3. Add environment variables in **Vercel → Project → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

> 💡 **Tip**: Use the [Supabase-Vercel Integration](https://vercel.com/integrations/supabase) to automatically sync environment variables.

---

## 🔒 Security

- **Row Level Security (RLS)** is enforced on all Supabase tables — users can only access their own data
- **Role-based routing** via `ProtectedRoute` prevents unauthorized page access
- **Supabase Auth** handles all authentication (email/password + password reset flow)
- Sensitive keys are never exposed in the frontend; Supabase Edge Functions handle privileged operations

---

## 📦 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is for academic and institutional use. Contact the maintainers for licensing inquiries.

---

<div align="center">

Made with ❤️ for **S.P. Chengalvaraya Naicker Engineering College**

**[🌐 Live App](https://certi-portal.vercel.app/) • [🐛 Report Bug](https://github.com/Pavithran1729/Certi-Portal/issues) • [💡 Request Feature](https://github.com/Pavithran1729/Certi-Portal/issues)**

</div>
