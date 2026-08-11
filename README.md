# ResumeGuru 🚀

**ResumeGuru** is an AI-powered interview strategy generation and ATS resume optimization platform. By analyzing a candidate's resume (or self-description) against a targeted Job Description (JD), ResumeGuru leverages Google Gemini Generative AI to deliver personalized interview preparation roadmaps, match scoring, targeted interview questions, skill gap analyses, and ATS-tailored downloadable PDF resumes.

---

## 🌟 Key Features

- **Targeted AI Analysis**: Compares candidate profile and resume text against any target Job Description (JD).
- **Match Score & Feedback**: Instant visual score (0–100%) highlighting candidate suitability for the role.
- **Custom Interview Preparation Roadmap**: Day-by-day actionable study and practice plan built specifically for the position.
- **Technical & Behavioral Questions**: Tailored interview questions complete with interviewer intentions and recommended answers.
- **Skill Gap Assessment**: Highlights missing skills along with severity ratings (low, medium, high).
- **ATS Resume Generator & PDF Export**: Generates an optimized, ATS-friendly resume tailored to the target JD and exports it directly as a styled PDF using Puppeteer.
- **User Authentication**: Secure JWT-based authentication with httpOnly cookie management and token blacklisting.
- **Report History**: Access and review past interview reports and generated strategies anytime.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v7
- **Styling**: SCSS (Vanilla CSS/Sass modular styles)
- **HTTP Client**: Axios (with credentials support)

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB Atlas + Mongoose
- **AI Integration**: `@google/genai` (Google Gemini 3 / Flash models)
- **Validation**: Zod (v4) with native JSON schema generation
- **File Handling & PDF Parsing**: Multer (Memory Storage) + `pdf-parse`
- **PDF Generation**: Puppeteer (Headless Chrome HTML-to-PDF rendering)
- **Auth & Security**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`

---

## 📁 Repository Structure

```text
resumeguru/
├── Backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers (Auth, Interview)
│   │   ├── middlewares/     # Auth & Multer upload middlewares
│   │   ├── models/          # Mongoose schemas (User, InterviewReport, Blacklist)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # AI Service (Gemini API & Puppeteer PDF)
│   │   └── app.js           # Express app setup
│   ├── server.js            # Entry point
│   ├── .env                 # Environment variables
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── features/        # Modular feature directories (Auth, Interview)
│   │   │   ├── auth/        # Login, Register, Auth Context & Hooks
│   │   │   └── interview/   # Home, Interview Report UI, Services & Hooks
│   │   ├── style/           # Global styles & Sass mixins
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Application entry point
│   ├── index.html
│   └── package.json
│
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB** instance (local or MongoDB Atlas connection string)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

---

### 📦 Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/resumeguru.git
cd resumeguru
```

#### 2. Backend Setup
Navigate to the `Backend` directory:
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory with the following variables:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_GENAI_API_KEY=your_gemini_api_key
CORS_ORIGIN=http://localhost:5173
```

Start the backend development server:
```bash
npm run dev
```
The backend server will start at `http://localhost:3000`.

---

#### 3. Frontend Setup
Open a new terminal window and navigate to the `Frontend` directory:
```bash
cd Frontend
npm install
```

(Optional) Create a `.env` file in the `Frontend/` directory:
```env
VITE_API_URL=http://localhost:3000
```

Start the frontend development server:
```bash
npm run dev
```
The frontend application will be running at `http://localhost:5173`.

---

## 🔗 API Endpoints Overview

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login user & issue JWT cookie | Public |
| `GET` | `/api/auth/logout` | Clear token & blacklist JWT | Public |
| `GET` | `/api/auth/get-me` | Retrieve authenticated user profile | Private |

### Interview & Resume Strategy Routes (`/api/interview`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/interview/` | Generate interview report (Accepts `jobDescription`, `selfDescription`, and `resume` file upload) | Private |
| `GET` | `/api/interview/` | Fetch all saved interview reports for logged-in user | Private |
| `GET` | `/api/interview/report/:interviewId` | Fetch single interview report by ID | Private |
| `POST` | `/api/interview/resume/pdf/:interviewReportId` | Generate & download ATS-optimized resume PDF | Private |

---

## 🌍 Deployment Summary

- **Frontend**: Deploy `Frontend/` on **Vercel**(Set build command to `npm run build` and root directory to `Frontend`).
- **Backend**: Deploy `Backend/` on **Render**(Root directory: `Backend`, Start command: `node server.js`).
- **Database**: **MongoDB Atlas**.

---

## 📝 License

This project is open-source and available under the [ISC License](LICENSE).
