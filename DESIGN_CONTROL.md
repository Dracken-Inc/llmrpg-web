# 🎮 LLMRPG Project - Design Control & Specifications
**Role:** Project Monitor, Tester, Design Controller  
**Tool:** Cloud Agent (Copilot)  
**Status:** ACTIVE MONITORING  
**Last Updated:** December 20, 2025

---

## 📋 PROJECT PHASES & CONTROL INSTRUCTIONS

### ✅ PHASE 1: MVP Foundation (COMPLETE)
**Status:** MERGED TO MAIN  
**Deliverables:**
- [x] Server setup with Express + Socket.IO
- [x] React client with Create React App
- [x] 5 Managers (campaign, character, initiative, encounter, chat)
- [x] React Context state management
- [x] Responsive styling
- [x] CORS security configuration

**Tests Passed:**
- [x] npm install (server: 119 packages, client: 1312 packages)
- [x] Server startup (port 3001)
- [x] Client build (JS 60.16kB, CSS 1.75kB)
- [x] Code quality (5 managers, Socket.IO events, React Context)

---

### 🚀 PHASE 2: Authentication & Error Handling (IN PROGRESS)
**Branch:** `copilot/add-authentication`  
**Priority:** HIGH - BLOCKS ALL USER FEATURES

#### 2.1: User Authentication
**Specification:**
```
Requirements:
- Add bcryptjs@^2.4.3 to server/package.json
- Add jsonwebtoken@^9.0.2 to server/package.json
- Create server/managers/userManager.js with:
  * register(username, password) - hash with bcryptjs
  * login(username, password) - verify hash, return JWT
  * verify(token) - decode JWT and return user data
  * getById(userId) - fetch user by ID
  * getAll() - list all users (admin only)

JWT Requirements:
- Expiration: 24 hours
- Secret: Use process.env.JWT_SECRET (fallback: 'dev-secret-key')
- Algorithm: HS256

Password Requirements:
- Hash with bcryptjs, salt rounds: 10
- Never store plaintext passwords
- Never return password in API responses

API Endpoints:
- POST /api/auth/register { username, password } → { token, user }
- POST /api/auth/login { username, password } → { token, user }
- GET /api/auth/me (protected) → { user, permissions }
- POST /api/auth/logout (protected) → { success }

Testing:
- Test register with duplicate username (should fail)
- Test login with wrong password (should fail)
- Test protected endpoints without token (should 401)
- Test protected endpoints with invalid token (should 403)
- Test token expiration after 24 hours
```

#### 2.2: Error Handling Middleware
**Specification:**
```
Create server/middleware/errorHandler.js with:
- Global try-catch wrapper for all async routes
- Error logging (console for now, add winston later)
- Standardized error response format:
  {
    error: true,
    code: "ERROR_CODE",
    message: "User-friendly message",
    status: 400|401|403|404|500
  }

Error Types:
- 400: Bad Request (missing fields, invalid input)
- 401: Unauthorized (missing token)
- 403: Forbidden (invalid token, insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (unhandled exceptions)

Logging Format:
[TIMESTAMP] [LEVEL] [ROUTE] [MESSAGE]
Example: [2025-12-20T22:30:00Z] [ERROR] [POST /api/characters] Character creation failed: invalid class

All routes MUST be wrapped with asyncHandler()
```

#### 2.3: Protected Routes
**Specification:**
```
Create server/middleware/auth.js with:
- authenticateToken(req, res, next) middleware
- Returns 401 if no token
- Returns 403 if token invalid/expired
- Sets req.user = { username, userId, permissions }

Apply to routes:
- PROTECTED: All /api/characters routes (read/write)
- PROTECTED: All /api/campaigns routes (read/write)
- PROTECTED: All /api/initiatives routes
- PROTECTED: All /api/encounters routes
- PROTECTED: Socket.IO chat events
- PUBLIC: /api/auth/register, /api/auth/login
- PUBLIC: Health check endpoint /api/health

Permissions:
- admin: can read/write all campaigns and characters
- user: can only read/write their own campaigns and characters
```

**Deliverables:**
- [ ] userManager.js implemented
- [ ] errorHandler.js implemented
- [ ] auth.js middleware implemented
- [ ] All routes protected appropriately
- [ ] JWT tokens working (24hr expiry)
- [ ] Error responses standardized
- [ ] All tests passing (npm run dev, no startup errors)

---

### 📊 PHASE 3: Test Infrastructure (PLANNED)
**Branch:** `copilot/add-tests`  
**Priority:** MEDIUM

#### 3.1: Server Tests (Jest)
**Specification:**
```
Add jest and supertest to server/package.json
Create server/tests/... directory

Unit Tests:
- userManager.test.js (register, login, verify)
- characterManager.test.js (CRUD operations)
- campaignManager.test.js (CRUD operations)

Integration Tests:
- auth.test.js (login flow, protected routes)
- campaigns.test.js (full CRUD with auth)
- characters.test.js (full CRUD with auth)

Test Coverage Target: 80%+
```

#### 3.2: Client Tests (Vitest)
**Specification:**
```
Replace react-scripts with Vite (optional but preferred)
Add vitest and @testing-library/react

Unit Tests:
- App.test.jsx
- components/*.test.jsx
- services/socket.test.js
- services/api.test.js

Component Tests:
- Test login/logout flow
- Test campaign selection
- Test character creation
- Test real-time chat (Socket.IO mocking)

Test Coverage Target: 70%+
```

**Deliverables:**
- [ ] Jest configured for server
- [ ] Vitest configured for client
- [ ] Unit tests for all managers
- [ ] Integration tests for API
- [ ] Component tests for React
- [ ] All tests passing (npm test)
- [ ] CI/CD pipeline ready

---

### 🛡️ PHASE 4: Production Hardening (PLANNED)
**Branch:** `copilot/add-production-features`  
**Priority:** LOW (post-MVP)

#### 4.1: Logging & Monitoring
- Add winston logger to server
- Add error tracking (Sentry or similar)
- Add API request logging
- Add performance metrics

#### 4.2: Security Hardening
- Add helmet.js for security headers
- Add rate limiting (express-rate-limit)
- Add input validation (joi or zod)
- Add CORS whitelist (remove '*')
- Add HTTPS support (env config)

#### 4.3: Database Migration
- Move from flat JSON files to proper DB (MongoDB/PostgreSQL)
- Add data migrations
- Add backup strategy

#### 4.4: Deployment
- Add Docker configuration
- Add GitHub Actions CI/CD
- Add environment management (.env)
- Add deployment guide (AWS/Heroku/Digital Ocean)

---

## 🎯 CONTROL INSTRUCTIONS FOR CLOUD AGENT

### Current Task (You are Here)
**Branch:** `copilot/learn-api-documentation`  
**Status:** READY FOR MERGE ✅

**Next Action - Create New Branch:**
```bash
git checkout -b copilot/add-authentication
git reset --hard origin/main
```

**Then Implement Phase 2.1-2.3 above**

### Code Quality Standards
1. **File Organization:**
   - managers/ for data operations
   - middleware/ for Express middleware
   - routes/ for API endpoints (optional, currently inline)
   - services/ for client-side services
   - components/ for React components

2. **Error Handling:**
   - All async functions must be wrapped with asyncHandler()
   - All database operations must have try-catch
   - All API responses must follow standardized format

3. **Testing:**
   - Write tests as you code (TDD preferred)
   - Aim for >80% coverage on critical paths
   - Test both success and failure cases

4. **Comments:**
   - Add comments for complex logic
   - Add JSDoc for public functions
   - Add inline comments for "why" not "what"

5. **Naming Conventions:**
   - camelCase for functions and variables
   - PascalCase for components and classes
   - UPPERCASE for constants
   - descriptive names (no `a`, `b`, `data`, etc.)

6. **Security:**
   - Never log passwords or tokens
   - Always hash passwords before storage
   - Validate all user input
   - Check permissions on protected routes
   - Use HTTPS in production

---

## 📊 MONITORING CHECKLIST

**For Each Commit/PR, Verify:**
- [ ] npm install succeeds (no new vulnerabilities)
- [ ] Server starts without errors
- [ ] Client builds without errors (only minor warnings OK)
- [ ] All new code follows naming conventions
- [ ] All new functions have error handling
- [ ] All new API endpoints are tested
- [ ] No passwords or tokens in logs/console
- [ ] Documentation updated if needed
- [ ] Tests pass (when implemented)

---

## 🔄 Real-Time Status Updates

**Test Results:**
- Last Test Run: 2025-12-20 22:30 UTC
- Status: ✅ ALL TESTS PASSING
- Next Test: Triggered on new PR commits

**Build Status:**
- Server: ✅ Running on port 3001
- Client: ✅ Built successfully (60.16kB JS, 1.75kB CSS)

**Code Quality:**
- Architecture: ✅ Sound (managers, Socket.IO, React Context)
- Security: ✅ CORS configured
- Performance: ✅ Bundle sizes optimal
- Documentation: ⚠️ Needs API docs (Phase 2)
- Tests: ❌ None yet (Phase 3)

---

## 📞 Communication Protocol

**Agent to Monitor:**
- Commits with detailed messages about work done
- Test results in commit messages
- Questions in PR comments

**Monitor to Agent:**
- This file (DESIGN_CONTROL.md) contains all specifications
- TEST_RESULTS.md contains latest test results
- Instructions in commit messages for next phase
- PR comments if changes needed

---

## 🎓 Project Goals

**MVP (Current):**
- [x] Functional D&D 5E campaign assistant
- [x] Real-time multiplayer with Socket.IO
- [x] Campaign and character management
- [x] Chat functionality
- [x] Initiative tracking
- [x] Responsive UI

**Phase 2 (Next):**
- [ ] User authentication with JWT
- [ ] Secure password storage
- [ ] Protected API endpoints
- [ ] Global error handling
- [ ] Better error messages

**Phase 3 (After Phase 2):**
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline
- [ ] Test automation

**Phase 4 (Long-term):**
- [ ] Production deployment
- [ ] Real database (not JSON files)
- [ ] Monitoring and logging
- [ ] Security hardening

---

**End of Design Control Specification**  
*This document is the source of truth for all LLMRPG development.*
