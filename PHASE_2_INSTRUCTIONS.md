# 🔐 PHASE 2: AUTHENTICATION LAYER - COPILOT INSTRUCTIONS

**Branch:** `copilot/add-authentication`  
**Status:** READY FOR IMPLEMENTATION  
**Priority:** HIGH - Blocks all user features  

---

## 📋 IMPLEMENTATION CHECKLIST

### Step 1: Update Dependencies ✅
**File:** `server/package.json`

Add to `dependencies`:
```json
"bcryptjs": "^2.4.3",
"jsonwebtoken": "^9.0.2"
```

Run: `npm install` in server directory

---

### Step 2: Update userManager.js 
**File:** `server/managers/userManager.js`

**Current file exists but needs enhancement. Replace entire file with:**

```javascript
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = '24h';
const USERS_FILE = path.join(__dirname, '../db/users.json');

class UserManager {
  constructor() {
    this.ensureDefaultUsers();
  }

  /**
   * Load users from JSON file
   */
  loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('Error loading users:', error.message);
      return [];
    }
  }

  /**
   * Save users to JSON file
   */
  saveUsers(users) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error.message);
    }
  }

  /**
   * Ensure default users exist (admin/user for MVP)
   */
  ensureDefaultUsers() {
    const users = this.loadUsers();
    const defaultExists = users.some(u => u.username === 'admin' || u.username === 'user');
    
    if (!defaultExists) {
      const defaultUsers = [
        {
          id: 'admin-001',
          username: 'admin',
          passwordHash: bcrypt.hashSync('admin', 10), // Change in production!
          permissions: ['admin', 'user'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'user-001',
          username: 'user',
          passwordHash: bcrypt.hashSync('user', 10), // Change in production!
          permissions: ['user'],
          createdAt: new Date().toISOString()
        }
      ];
      this.saveUsers(defaultUsers);
    }
  }

  /**
   * Register a new user
   * @param {string} username
   * @param {string} password
   * @returns {object} { success, token, user, error }
   */
  register(username, password) {
    try {
      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      const users = this.loadUsers();
      
      // Check if user already exists
      if (users.some(u => u.username === username)) {
        return {
          success: false,
          error: 'Username already exists'
        };
      }

      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        username,
        passwordHash: bcrypt.hashSync(password, 10),
        permissions: ['user'],
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);

      // Generate JWT
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username, permissions: newUser.permissions },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      return {
        success: true,
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          permissions: newUser.permissions
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login user
   * @param {string} username
   * @param {string} password
   * @returns {object} { success, token, user, error }
   */
  login(username, password) {
    try {
      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      const users = this.loadUsers();
      const user = users.find(u => u.username === username);

      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Verify password
      const validPassword = bcrypt.compareSync(password, user.passwordHash);
      if (!validPassword) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, permissions: user.permissions },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          permissions: user.permissions
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify JWT token
   * @param {string} token
   * @returns {object} { success, decoded, error }
   */
  verify(token) {
    try {
      if (!token) {
        return {
          success: false,
          error: 'No token provided'
        };
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      return {
        success: true,
        decoded
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user by ID
   * @param {string} userId
   * @returns {object} user object
   */
  getById(userId) {
    const users = this.loadUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      // Don't return password hash
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }

  /**
   * Get all users (admin only)
   * @returns {array} users array (without password hashes)
   */
  getAll() {
    const users = this.loadUsers();
    return users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }
}

module.exports = new UserManager();
```

---

### Step 3: Create auth middleware
**File:** `server/middleware/auth.js` (NEW FILE)

```javascript
/**
 * Authentication middleware for protecting routes
 */

const userManager = require('../managers/userManager');

/**
 * Authenticate JWT token from Authorization header
 * Sets req.user if valid
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: true,
      code: 'NO_TOKEN',
      message: 'Access token required',
      status: 401
    });
  }

  const result = userManager.verify(token);
  if (!result.success) {
    return res.status(403).json({
      error: true,
      code: 'INVALID_TOKEN',
      message: result.error,
      status: 403
    });
  }

  req.user = result.decoded;
  next();
};

/**
 * Check if user has required permission
 * @param {array} requiredPermissions - array of permission strings
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        code: 'NOT_AUTHENTICATED',
        message: 'User not authenticated',
        status: 401
      });
    }

    const hasPermission = requiredPermissions.some(perm => 
      req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: true,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to access this resource',
        status: 403
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requirePermission
};
```

---

### Step 4: Create error handler middleware
**File:** `server/middleware/errorHandler.js` (NEW FILE)

```javascript
/**
 * Global error handling middleware
 */

/**
 * Async route wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error handler middleware (must be last)
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Default error response
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: true,
    code,
    message,
    status
  });
};

module.exports = {
  asyncHandler,
  errorHandler
};
```

---

### Step 5: Update server/index.js
**File:** `server/index.js`

Add auth routes and middleware. Replace the route section with:

**BEFORE THE EXISTING ROUTES, ADD:**

```javascript
const { authenticateToken, requirePermission } = require('./middleware/auth');
const { asyncHandler, errorHandler } = require('./middleware/errorHandler');
const userManager = require('./managers/userManager');

// Public routes
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = userManager.register(username, password);
  
  if (!result.success) {
    return res.status(400).json({
      error: true,
      code: 'REGISTRATION_FAILED',
      message: result.error,
      status: 400
    });
  }

  res.json({
    success: true,
    token: result.token,
    user: result.user
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = userManager.login(username, password);
  
  if (!result.success) {
    return res.status(401).json({
      error: true,
      code: 'LOGIN_FAILED',
      message: result.error,
      status: 401
    });
  }

  res.json({
    success: true,
    token: result.token,
    user: result.user
  });
}));

app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Token is invalidated on client side by deleting from localStorage
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = userManager.getById(req.user.userId);
  res.json({
    success: true,
    user
  });
}));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// PROTECT ALL EXISTING ROUTES WITH authenticateToken:
// Wrap all campaign, character, initiative, encounter routes with:
// app.get('/api/campaigns', authenticateToken, asyncHandler(async (req, res) => { ... }))
```

**THEN AT THE VERY END OF FILE, ADD ERROR HANDLER (must be last):**

```javascript
// Error handling middleware (must be last)
app.use(errorHandler);
```

---

### Step 6: Testing Requirements

**Test the following scenarios:**

1. ✅ Register new user with valid credentials
   - POST /api/auth/register { username: "testuser", password: "test123" }
   - Expect: 200, token returned

2. ✅ Register duplicate username
   - POST /api/auth/register { username: "admin", password: "test" }
   - Expect: 400, error message

3. ✅ Login with correct password
   - POST /api/auth/login { username: "user", password: "user" }
   - Expect: 200, token returned

4. ✅ Login with wrong password
   - POST /api/auth/login { username: "user", password: "wrong" }
   - Expect: 401, error message

5. ✅ Access protected route with token
   - GET /api/auth/me with Authorization: Bearer [token]
   - Expect: 200, user data

6. ✅ Access protected route without token
   - GET /api/auth/me without Authorization header
   - Expect: 401, error message

7. ✅ Server startup
   - npm start in server directory
   - Expect: "Server running on port 3001"
   - Expect: Default users (admin/user) created

---

## ✅ Completion Criteria

- [x] bcryptjs and jsonwebtoken added to package.json
- [x] userManager.js implements register, login, verify with bcryptjs hashing
- [x] auth.js middleware protects routes with JWT verification
- [x] errorHandler.js provides standardized error responses
- [x] 7 test scenarios pass without errors
- [x] npm install succeeds (no new vulnerabilities)
- [x] npm start succeeds (server running on 3001)
- [x] All commits made with descriptive messages

**Commit Messages Should Include:**
- Feature added (register/login/verify)
- Middleware type (auth/errorHandler)
- Test results
- Example: "Implement JWT authentication with bcryptjs - all tests passing"

---

## 🚀 When Complete

1. Push branch to GitHub
2. Create Pull Request on GitHub
3. I will validate and merge to main when tests pass

---

**IMPORTANT:** Refer to DESIGN_CONTROL.md Section 2.1-2.3 for detailed specifications.
