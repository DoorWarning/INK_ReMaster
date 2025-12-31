# 🎨 INK (아주대학교 만화창작소학회)

>**아주대학교 소프트웨어융합대학 미디어학부 만화 창작 소학회, INK 공식 웹사이트**  

<br/>

<div align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=Tailwind-CSS&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=Express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=MongoDB&logoColor=white" />
</div>

<br/>

## 🔗 배포 주소 (Deployment)
> **Website**: [https://mediaink.vercel.app](https://mediaink.vercel.app)

<br/>

## 📝 프로젝트 소개 (Introduction)

**INK_ReMaster**는 아주대학교 만화 창작 소학회 **INK**의 회원들을 위한 커뮤니티 및 운영 관리 플랫폼입니다.  
기존의 오프라인 중심 활동을 보조하고, 작품 전시(ART/Photo), 공지사항 전달, 회비 내역 공개(Ledger), 행사 일정 관리(Calendar) 등을 웹상에서 통합적으로 관리할 수 있도록 개발되었습니다.

<br/>

## ✨ 주요 기능 (Key Features)

### 🔐 인증 및 사용자 관리 (Authentication)
- **Google OAuth 로그인**: Passport.js를 활용한 소셜 로그인 지원
- **사용자 권한 관리**: 일반 회원(준회원/정회원)과 관리자(Admin) 권한 분리
- **마이페이지**: 내 정보 확인 및 활동 내역 관리

### 🖼️ 갤러리 및 게시판 (Community & Gallery)
- **ART & Photo 갤러리**: 작품 및 행사 사진 업로드/조회 (Masonry 레이아웃)
- **게시판 기능**: 공지사항, 자유 게시글 작성 및 댓글 기능
- **공모전(Contest)**: 학회 내 공모전 개최 및 출품작 투표 시스템

### 📅 일정 및 운영 관리 (Management)
- **캘린더(Calendar)**: 학회 주요 행사 및 일정 시각화
- **회계 장부(Ledger)**: 투명한 회비 운영을 위한 수입/지출 내역 공개 시스템
- **통합 알림**: 주요 공지 및 활동 알림 (Global Alert)

<br/>

## 🛠 기술 스택 (Tech Stack)

### **Client**
| Category | Technology |
| --- | --- |
| **Framework** | ![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black) |
| **Build Tool** | ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white) |
| **State Mgt** | ![Zustand](https://img.shields.io/badge/Zustand-orange?logo=react) |
| **Animation** | `framer-motion` |
| **HTTP Client** | `axios` |

### **Server**
| Category | Technology |
| --- | --- |
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white) |
| **Framework** | ![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white) |
| **ORM** | `Mongoose` |
| **Auth** | `Passport.js` (Google OAuth 2.0), `JWT` |
| **Storage** | `AWS S3` (@aws-sdk/client-s3) |

<br/>

## 📂 프로젝트 구조 (Structure)

```bash
INK_ReMaster/
├── client/                 # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/            # Axios instance
│   │   ├── assets/         # Images, SVGs
│   │   ├── components/     # Reusable Components (Modal, Header, etc.)
│   │   ├── pages/          # Route Pages (Main, Intro, Admin, etc.)
│   │   ├── store/          # Zustand State Stores
│   │   └── ...
│   └── ...
└── server/                 # Backend (Express)
    ├── models/             # Mongoose Schemas (User, Post, Ledger...)
    ├── routes/             # API Routes
    ├── index.js            # Entry Point
    └── passport.js         # Auth Configuration
```

## 🚀 시작하기 (Getting Started)
### 사전 요구사항 (Prerequisites)
- Node.js (v18+)
- MongoDB Atlas Account (or Local MongoDB)

### 설치 및 실행 (Installation)
1. 저장소 클론 (Clone)
```bash
git clone [https://github.com/DoorWarning/INK_ReMaster.git](https://github.com/DoorWarning/INK_ReMaster.git)
cd INK_ReMaster
```

2. 서버 설정 (Server)

```bash
cd server
npm install

# .env 파일 생성 및 설정 (하단 참조)
# npm run dev
```

3. 클라이언트 설정 (Client)

```bash
cd ../client
npm install
npm run dev
```

## 🔐 환경 변수 설정 (.env)
### server 디렉토리 내에 .env 파일을 생성하고 아래 값을 설정해야 합니다.

```bash
PORT=4000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your_session_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS S3 (이미지 업로드용)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-northeast-2
AWS_BUCKET_NAME=your_bucket_name
```