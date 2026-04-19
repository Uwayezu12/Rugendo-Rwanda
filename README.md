# Rugendo Rwanda

**Your Journey, Our Priority**

Rugendo Rwanda is an online intercity bus booking platform for Rwanda. It helps passengers search routes and schedules, book seats, pay digitally, receive a booking token, manage trips, and board through operator validation.

---

## Overview

Rwanda’s intercity bus booking process is often offline, cash-based, and inconvenient. Rugendo Rwanda solves that by providing a modern web platform where passengers can:

- create an account
- search routes and schedules
- choose seats
- pay digitally
- receive a booking token
- manage upcoming and past trips

The platform also includes operator tools for boarding validation and company booking visibility.

---

## Main Features

### Passenger Features

- User registration and login
- Google sign-in and sign-up
- Forgot password and reset password
- Route and trip search
- Schedule selection
- Booking summary and payment flow
- Booking token generation
- My Bookings and Past Trips
- Profile management
- Multilingual interface:
  - English
  - French
  - Kiswahili
  - Kinyarwanda

### Operator Features

- Token/reference-based boarding validation
- Company-scoped booking access
- Company bookings visibility
- Remaining seat visibility per trip
- Operator profile page

### Admin / Platform Features

- Role-based access control
- Company-aware booking management
- Structured backend modules
- Seeded test data for local development

---

## Tech Stack

### Frontend

- React
- React Router
- Tailwind CSS
- Context API for theme, auth, and language handling

### Backend

- Node.js
- Express.js
- Prisma ORM
- MySQL

### Authentication / Email

- Email or phone login support
- Google authentication
- Password reset via email
- Gmail SMTP with app password support for reset emails

---

## Project Structure

```bash
rugendo-rwanda/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   └── ...
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   ├── utils/
│   │   └── ...
│   └── ...
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd rugendo-rwanda
```

### 2. Install dependencies

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd ../backend
npm install
```

---

## Environment Variables

Create a `.env` file inside `backend/`.

Example:

```env
PORT=5000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/rugendo_rwanda"

JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_digit_gmail_app_password
```

### Notes

- `SMTP_PASS` should be a Gmail App Password, not your normal Gmail password.
- `FRONTEND_URL` should match your frontend local/dev URL.

---

## Database Setup

From the `backend/` folder:

```bash
npx prisma migrate dev
npx prisma generate
node prisma/seed.js
```

This will:

- apply migrations
- generate the Prisma client
- seed the database with test users, companies, operators, and bookings

---

## Run the App

### Start backend

From `backend/`:

```bash
npm run dev
```

### Start frontend

From `frontend/`:

```bash
npm run dev
```

---

## Test Accounts

Use the seeded accounts from `prisma/seed.js`.

Typical examples may include:

- operator accounts
- passenger accounts
- sample bookings for testing boarding flow

Check your seed file for the exact current credentials and booking references.

---

## Booking and Boarding Flow

### Passenger flow

1. Register or log in
2. Search a route
3. Select a trip or schedule
4. Review booking details
5. Pay
6. Receive a booking token
7. View booking in My Bookings and Past Trips

### Operator flow

1. Log in as operator
2. Open operator boarding page
3. Enter booking token or reference
4. Validate boarding
5. View company bookings and available seats

---

## Multilingual Support

The application supports:

- `en` — English
- `fr` — French
- `sw` — Kiswahili
- `rw` — Kinyarwanda

Language selection is global and persists using local storage.

---

## Design Notes

- Dark mode uses the project’s dark blue and purple visual identity.
- Light mode is intended to use lighter blue backgrounds for better contrast.
- Public pages, auth pages, passenger pages, and operator pages follow the shared design system.

---

## Development Notes

- Keep backend logic modular.
- Preserve route → controller → service → validator flow.
- Do not hardcode secrets.
- Use environment variables for sensitive config.
- Keep multilingual text in translation utilities and context, not scattered as hardcoded strings.

---

## Current Core Modules

### Backend modules

- Auth
- Bookings
- Payments
- Boarding
- Users / Profiles

### Frontend areas

- Public pages
- Auth pages
- Passenger dashboard and pages
- Operator dashboard and pages
- Shared layouts and components

---

## Future Improvements

- Separate `BOARDED` and `COMPLETED` booking states
- Real-time operator notifications
- QR-based boarding validation
- Expanded admin and super-admin tools
- Reporting and analytics
- Production-grade payment integrations

---

## Problem the Project Solves

Rugendo Rwanda addresses major intercity transport pain points in Rwanda:

- no reliable advance booking
- poor schedule visibility
- cash dependency
- lack of digital receipts and history
- friction for tourists, students, workers, and travelers

The goal is to make bus travel in Rwanda faster, simpler, and more reliable.

---

## License

This project is for educational, MVP, and product development purposes unless your team defines a separate license.

---

## Team

**Rugendo Rwanda**
Online Bus Booking Platform for Rwanda

**Team:** Rugendo Dev Team

---

## Contact

Update this section with your real contact details, domain, or deployment links.

Example:

- Website: `https://rugendorwanda.rw`
- Email: `info@rugendorwanda.rw`
