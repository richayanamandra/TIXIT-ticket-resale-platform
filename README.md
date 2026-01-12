🎟️ TixIt – Secure Ticket Resale MERN Platform

TixIt is a full-stack MERN web application designed for secure buying and reselling of event tickets.
Beyond typical CRUD functionality, TixIt implements real-world security controls and exploit mitigations based on OWASP Top 10, making it both a functional platform and a security-focused academic project.

🏗️ Tech Stack
Frontend

React.js (SPA)

React Router

HTML, CSS, JavaScript

Backend

Node.js

Express.js

MongoDB + Mongoose

Security Libraries & Tools

Helmet (CSP + secure HTTP headers)

sanitize-html (XSS mitigation)

express-rate-limit (brute-force protection)

express-validator + Joi (input validation)

jsonwebtoken (JWT authentication)

bcryptjs (password hashing)

cors (secure CORS policy)

Passport Google OAuth2.0

Custom NoSQL injection filter

🔐 Security Features Implemented

TixIt is designed as a secure-by-default MERN platform, implementing:

✔ XSS Prevention

sanitize-html

CSP via Helmet

Safe rendering & word-break handling

✔ NoSQL Injection Defense

Custom $ & . operator stripping middleware

Strong schema validation with Joi

✔ Authentication Security

JWT-based auth

Token verification middleware

Google OAuth login

Password hashing (bcrypt)

✔ Brute-force & Abuse Protection

express-rate-limit on:

Login

Signup

Ticket creation

✔ Secure Password Change

Requires current password

Verifies user identity via JWT

Re-hashes new password

Rotates JWT after change

✔ CORS Hardening

Only allows the frontend origin

Prevents unauthorized cross-origin API access

✔ Secure Input Validation

express-validator (auth routes)

Joi schema validation (ticket routes)

🎯 Functional Features
✔ User Registration & Login

Email/password or Google OAuth

JWT-based session handling

✔ Ticket Selling

Secure form

Sanitized descriptions

Validated price/date formats

✔ Ticket Browsing

Fetches all listings

Seller reference populated with safe user fields

✔ Profile Controls

Change password modal

Smooth popup UI


All vulnerabilities were identified, replicated, and fixed as part of the project.

⚙️ Installation & Setup
1. Clone the Repository
git clone https://github.com/richayanamandra/TIXIT-ticket-resale-platform.git
cd TIXIT-ticket-resale-platform

2. Backend Setup
cd server
npm install
npm start


You need a .env file containing:

MONGO_URI=...
JWT_SECRET=...
SESSION_SECRET=...
CLIENT_ROOT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

3. Frontend Setup
cd ../client
npm install
npm start


Frontend starts at:

http://localhost:3000

🧠 Project Motivation

This project was developed to:

Gain hands-on experience with full-stack development

Understand real-world web security vulnerabilities

Practice exploit simulation and mitigation

Implement OWASP Top 10 controls in a working app

Build a robust portfolio project showcasing secure programming

📅 Timeline

Initial implementation: July 2025

Security hardening + exploit simulations: Nov 2025

Final submission for course: Nov 2025

📌 Status

✅ Fully functional
🔐 Security-hardened
📘 Documented with exploit simulations
🚀 Ready for academic submission

Future improvements:

Deployment on Render/Netlify

Role-based access

Payment gateway integration

Logging & monitoring

👤 Author

Richa Yanamandra
B.Tech CSE (2023–2027)
