const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = '24h';
const DB_DIR = path.join(__dirname, '../db');
const USERS_FILE = path.join(DB_DIR, 'users.json');

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function ensureDefaultUsers() {
  ensureDbDir();
  let needsWrite = false;
  let users = [];
  
  if (!fs.existsSync(USERS_FILE)) {
    needsWrite = true;
  } else {
    try {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (!Array.isArray(users)) users = [];
    } catch {
      users = [];
      needsWrite = true;
    }
  }
  
  // Default users for MVP
  const defaultUsers = [
    {
      id: 'admin-001',
      username: 'admin',
      password: bcrypt.hashSync('admin', 10),
      permissions: ['admin', 'user'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-001',
      username: 'user',
      password: bcrypt.hashSync('user', 10),
      permissions: ['user'],
      createdAt: new Date().toISOString()
    }
  ];
  
  defaultUsers.forEach(def => {
    const idx = users.findIndex(u => u.username === def.username);
    if (idx === -1) {
      users.push(def);
      needsWrite = true;
    } else {
      // Update password and permissions for default users
      users[idx].password = def.password;
      users[idx].permissions = def.permissions;
      users[idx].id = def.id;
      needsWrite = true;
    }
  });
  
  if (needsWrite) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }
}

function loadUsers() {
  ensureDefaultUsers();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  ensureDbDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

module.exports = {
  /**
   * Register a new user
   */
  register(username, password) {
    try {
      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      const users = loadUsers();
      
      if (users.some(u => u.username === username)) {
        return {
          success: false,
          error: 'Username already exists'
        };
      }

      const newUser = {
        id: `user-${Date.now()}`,
        username,
        password: bcrypt.hashSync(password, 10),
        permissions: ['user'],
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);

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
  },

  /**
   * Login user
   */
  login(username, password) {
    try {
      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      const users = loadUsers();
      const user = users.find(u => u.username === username);

      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      if (!bcrypt.compareSync(password, user.password)) {
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
  },

  /**
   * Verify JWT token
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
  },

  /**
   * Get user by ID
   */
  getById(userId) {
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  /**
   * Get all users
   */
  getAll() {
    return loadUsers().map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
  }
};
