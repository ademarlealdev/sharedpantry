<div align="center">
<img width="1200" height="475" alt="SharedPantry Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🏠 SharedPantry
**The elegant, AI-powered grocery shared list for families and households.**

[View Application](https://ai.studio/apps/drive/1ATSmwc-02ci86VI-iAsYi0HVWPp_N8bZ)
</div>

---

## ✨ Features

### 🤝 Seamless Collaboration
- **Shared Pantries**: Create your own pantry or join an existing one using a unique invite code.
- **Real-time Sync**: Everything stays in sync across all devices instantly. See items added by others the moment they appear.
- **Multiple Groups**: Switch between your "Home", "Office", or "Vacation" pantries with a single tap.

### 🤖 Smart AI Integration
- **Gemini-Powered Categorization**: Just type an item name like "Organic Milk" or "Fresh Salmon", and our AI automatically handles the rest.
- **Automatic Icons**: Items are assigned beautiful, relevant icons based on their type.
- **Category Grouping**: Your list is automatically organized by aisle (Produce, Dairy, Bakery, etc.) to make shopping faster.

### 🎨 Premium User Experience
- **Responsive Design**: A sleek, mobile-first interface that looks stunning on phones and expands beautifully to full-width on desktops.
- **Custom Visual Branding**: Features a unique SVG logo and curated sage green color palette.
- **Intuitive Navigation**: Horizontal category selection with click-and-drag support on desktop and smooth touch swiping on mobile.

### 🔐 Security & Management
- **Role-Based Access**: Primary owners can manage members, promote administrators, or remove participants.
- **Secure Authentication**: Robust login, registration, and password recovery flow.
- **Privacy First**: Secure account deletion that removes all your data and access.

---

## 🚀 Local Development

### Prerequisites
- **Node.js**: (Latest LTS recommended)
- **Supabase Account**: For database and authentication features.
- **Google Gemini API Key**: For the AI categorization engine.

### Setup Instructions
1. **Clone & Install**:
   ```bash
   git clone [your-repo-ui]
   cd sharedpantry
   npm install
   ```

2. **Configuration**:
   Create a `.env.local` file and add your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Launch**:
   ```bash
   npm run dev
   ```

---

<div align="center">
Made with ❤️ for modern households.
</div>
