# Login & Registration UI

## ✅ Implementation Complete

### Features Implemented:

**🎨 Theme System**
- Primary Color: `#1B4CA1` (Blue)
- Secondary Color: `#F69953` (Orange)
- Configurable theme in [/frontend/src/theme/colors.ts](frontend/src/theme/colors.ts)
- Easy color switching support

**🔐 Authentication Pages**
1. **Login Page** ([/frontend/src/pages/Login.tsx](frontend/src/pages/Login.tsx))
   - Split-screen design (Branding left, Form right)
   - Email/password authentication
   - Remember me checkbox
   - Forgot password link
   - Responsive design (mobile-friendly)

2. **Register Page** ([/frontend/src/pages/Register.tsx](frontend/src/pages/Register.tsx))
   - Full name, email, password fields
   - Password confirmation validation
   - Terms & conditions agreement
   - Stats display (10K+ test cases, 500+ teams, 95% satisfaction)

**🔗 Features Highlights Section**
- AI-Powered Analysis
- Smart Test Cases
- 10x Faster generation
- Compliance Check
- BYOK (Bring Your Own Key)
- Multi-provider AI Support
- Seamless Jira Integration

**🔒 Authentication System**
- JWT token-based authentication
- AuthContext for global state management
- Protected routes
- Auto-redirect to dashboard after login
- Token storage in localStorage
- API integration ready

## 🚀 How to Run

### 1. Start Backend (in terminal 1):
```bash
cd backend
PYTHONPATH=/home/shankarganeshi/PlayGround/AI-Powered-Test-Case-Generator/backend \
  /home/shankarganeshi/PlayGround/AI-Powered-Test-Case-Generator/.venv/bin/uvicorn \
  app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend (in terminal 2):
```bash
cd frontend
npm run dev
```

Frontend will be available at: **http://localhost:3000**

## 📋 Pages

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard (protected)
- `/settings` - Settings (protected)

## 🎨 Theme Customization

To change colors, edit [frontend/src/theme/colors.ts](frontend/src/theme/colors.ts):

```typescript
export const colors = {
  primary: {
    main: '#1B4CA1', // Change this for new primary color
    // ...
  },
  secondary: {
    main: '#F69953', // Change this for new secondary color
    // ...
  },
}
```

## 🔧 Environment Variables

Create `.env` in frontend directory:
```
VITE_API_URL=http://localhost:8000
```

## 📱 Responsive Design

- Desktop: Split-screen layout with branding
- Tablet/Mobile: Full-width form, hidden branding section

## 🧪 Test Credentials

Once backend is running, you can:
1. Register a new account at `/register`
2. Login with your credentials at `/login`
3. Access protected routes after authentication

## ✨ Next Steps

- [ ] Forgot password functionality
- [ ] Email verification
- [ ] Social login (Google, Azure AD)
- [ ] User profile management
- [ ] API key management for LLM providers
