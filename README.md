# E-LABZ AI Outreach Assistant 🚀

A private, full-stack AI assistant designed for developers to automate and personalize business outreach. Built with **React**, **Supabase**, and **Google Gemini AI**.

## Features
- **Smart Outreach:** Automatically generates personalized emails based on business niche and developer expertise.
- **Context-Aware Chat:** Remembers previous turns to handle corrections and follow-up instructions.
- **Knowledge Base:** Store your portfolio, skills, and contact info in a vector database for the AI to "search" during email drafting.
- **Validation & Safety:** Real-time DNS MX record checks and typo detection (e.g., catching `@gomail.com`) before sending.
- **Email History:** Track every sent email with industry categorization and status.
- **Secure Auth:** Private dashboard locked behind Supabase Authentication.

---

## 🛠 Prerequisites
- **Node.js** (v18+)
- **Supabase CLI**
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
- **SMTP Credentials** (e.g., Gmail App Password or SendGrid)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/dilawar-zeeshan/outreachAI.git
cd outreachAI
```

### 2. Supabase Setup (Backend)
1.  Create a new project on [Supabase.com](https://supabase.com/).
2.  Initialize the database by running the migrations located in `supabase/migrations/`:
    - Link your project: `supabase link --project-ref <your-project-id>`
    - Push migrations: `supabase db push`
3.  Set up Edge Function secrets:
```bash
supabase secrets set GEMINI_API_KEY=your_key_here
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your_email@gmail.com
supabase secrets set SMTP_PASS=your_app_password
supabase secrets set ADMIN_EMAIL=your_email@gmail.com
supabase secrets set SUPABASE_URL=your_project_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Deploy Functions
Deploy the AI and Email logic to Supabase:
```bash
supabase functions deploy chat --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy knowledge --no-verify-jwt
supabase secrets set email-history --no-verify-jwt
```

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📖 How to Use
1. **Login:** Access your dashboard using the email/password you set up in Supabase Auth.
2. **Update Knowledge Base:** Go to the "Knowledge Base" section and add details about your expertise, portfolio, and contact info. These blocks are converted into vectors so the AI can find them later.
3. **Drafting:** Send a message like: *"Send outreach to adam@logistics.com, they are a shipping company."*
4. **Correction:** If you make a typo, just say: *"Actually I meant adam@gmail.com"*. The AI will use context to fix the draft.
5. **Send:** Click "Confirm & Send" once you are happy with the draft.

---

## 🛡 Security
This app is intended for **private use**. Ensure you use a strong password for your Supabase Auth account and never expose your `SUPABASE_SERVICE_ROLE_KEY` in the frontend.

## License
MIT
