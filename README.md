
# Smart Incentive Recycle Tracker — Phase 1

## What we're building

A recycling platform where users scan QR codes at bins, upload waste images, get AI-powered classification, earn points, and compete on a leaderboard. Phase 1 covers the core loop; Phase 2 (later) adds admin panel, rewards redemption, badges, and advanced gamification.

---

## Features in Phase 1

### 1. Authentication
- Email/password signup and login with Supabase Auth
- Protected routes for authenticated users
- User profile creation on signup (name, avatar)

### 2. Database Setup
Tables:
- **profiles** — name, avatar_url, points, level, streak, last_recycled_at
- **bins** — bin_id, name, location_lat, location_lng, qr_code_data
- **submissions** — user_id, image_url, waste_type, confidence, quantity, bin_id (optional), status (approved/review/rejected), points_awarded, created_at
- **user_roles** — for future admin functionality

RLS policies so users can only read/update their own data and read the leaderboard.

### 3. QR Code Scanner
- Camera-based QR scanner using `html5-qrcode` library
- Scans bin QR codes to extract bin ID and location
- Links the scanned bin to the waste submission
- Fallback: proceed without a bin (manual submission)

### 4. Waste Image Upload + AI Classification
- Image upload with preview (stored in Supabase Storage)
- Edge function calls Lovable AI (Gemini vision) to classify the waste image
- AI returns: waste type (plastic, metal, paper, organic, glass, e-waste) + confidence score
- Auto-approve if confidence > 80%, mark "needs review" if 50-80%, reject if < 50%

### 5. Dynamic Points Engine
- Points calculated as: `base_points * quantity * confidence_multiplier * streak_bonus * bin_bonus`
- Base points vary by waste type (e.g., e-waste = 15, plastic = 5)
- Bin bonus: 1.5x for using an official QR bin
- Streak bonus: increases with consecutive daily recycling
- Points and streak updated on approved submissions

### 6. User Dashboard
- Points total, current level, streak counter
- Environmental impact stats (CO2 saved, kg recycled, trees saved equivalent)
- Recent submission history with status indicators
- Progress bar to next level

### 7. Leaderboard
- Ranked list of users by total points
- Shows name, avatar, points, level, streak
- Real-time updates via Supabase Realtime subscriptions

### 8. Submit Waste Flow
Full user flow:
1. (Optional) Scan QR code at bin
2. Upload waste image
3. Select quantity
4. AI classifies and scores
5. Points awarded (or submission queued for review)
6. Dashboard and leaderboard update

---

## UI Design

- Mobile-first, dark mode by default
- Modern card-based dashboard
- Bottom navigation: Home, Scan, Submit, Leaderboard, Profile
- Green/eco color palette with accent colors per waste type
- Animated progress bars and level indicators

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing / marketing page |
| `/login` | Login form |
| `/signup` | Signup form |
| `/dashboard` | User dashboard with stats |
| `/scan` | QR camera scanner |
| `/submit` | Waste submission form |
| `/leaderboard` | Global leaderboard |
| `/history` | Submission history |

---

## Technical Details

**Edge Functions:**
- `classify-waste` — receives image URL, calls Lovable AI with Gemini vision to identify waste type and confidence, returns classification result
- Points calculation logic runs in the edge function after classification

**Supabase Storage:**
- `waste-images` bucket for uploaded photos

**Realtime:**
- Subscribe to leaderboard changes for live updates

**Libraries to add:**
- `html5-qrcode` for camera QR scanning
- `recharts` for impact charts on dashboard

**Impact formulas (predefined):**
- 1 kg plastic recycled = 1.5 kg CO2 saved
- 1 kg paper recycled = 0.9 kg CO2 saved + 0.017 trees saved
- 1 kg metal recycled = 4.0 kg CO2 saved
- 1 kg organic recycled = 0.5 kg CO2 saved

---

## Phase 2 (future)
- Admin dashboard with submission moderation and AI override
- Rewards catalog and redemption
- Badges and achievements system
- Real-time notifications
- PWA with offline submission caching
