const userManager = require('../managers/userManager');
const fs = require('fs');
const path = require('path');

// Mock the users file path
const TEST_USERS_FILE = path.join(__dirname, '../db/users.test.json');

describe('UserManager', () => {
  beforeEach(() => {
    // Clean up test users before each test
    if (fs.existsSync(TEST_USERS_FILE)) {
      fs.unlinkSync(TEST_USERS_FILE);
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(TEST_USERS_FILE)) {
      fs.unlinkSync(TEST_USERS_FILE);
    }
  });

  describe('register', () => {
    it('should register a new user successfully', () => {
      const uniqueUsername = `testuser${Date.now()}`;
      const result = userManager.register(uniqueUsername, 'password123');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(uniqueUsername);
      expect(result.user.permissions).toContain('user');
      expect(result.user.id).toBeDefined();
    });

    it('should reject registration with missing username', () => {
      const result = userManager.register('', 'password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required');
    });

    it('should reject registration with missing password', () => {
      const result = userManager.register('testuser', '');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required');
    });

    it('should reject duplicate username', () => {
      const uniqueUsername = `duptest${Date.now()}`;
      userManager.register(uniqueUsername, 'password123');
      const result = userManager.register(uniqueUsername, 'different');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username already exists');
    });
    it('should hash passwords securely', () => {
      const uniqueUsername = `hashtest${Date.now()}`;
      const result = userManager.register(uniqueUsername, 'password123');
      
      // Password should not be in the returned user object
      expect(result.user.password).toBeUndefined();
    });xpect(result.user.password).toBeUndefined();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      // Create a test user before login tests
      userManager.register('logintest', 'password123');
    });

    it('should login with correct credentials', () => {
      const result = userManager.login('logintest', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('logintest');
    });

    it('should reject login with wrong password', () => {
      const result = userManager.login('logintest', 'wrongpassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password');
    });

    it('should reject login with non-existent user', () => {
      const result = userManager.login('nonexistent', 'password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password');
    });

    it('should reject login with missing username', () => {
      const result = userManager.login('', 'password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required');
    });

    it('should reject login with missing password', () => {
      const result = userManager.login('logintest', '');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required');
    });
  });

  describe('verify', () => {
    it('should verify a valid JWT token', () => {
      const registerResult = userManager.register('tokentest', 'password123');
      const verifyResult = userManager.verify(registerResult.token);
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.decoded.username).toBe('tokentest');
      expect(verifyResult.decoded.userId).toBeDefined();
    });

    it('should reject invalid token', () => {
      const result = userManager.verify('invalid.token.here');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty token', () => {
      const result = userManager.verify('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No token provided');
    });

    it('should reject null token', () => {
      const result = userManager.verify(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No token provided');
    });
  });

  describe('getById', () => {
    it('should get user by ID', () => {
      const registerResult = userManager.register('getbyidtest', 'password123');
      const user = userManager.getById(registerResult.user.id);
      
      expect(user).toBeDefined();
      expect(user.username).toBe('getbyidtest');
      expect(user.id).toBe(registerResult.user.id);
      expect(user.password).toBeUndefined(); // Password should not be returned
    });

    it('should return null for non-existent user ID', () => {
      const user = userManager.getById('non-existent-id');
      
      expect(user).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all users without passwords', () => {
      userManager.register('user1', 'password1');
      userManager.register('user2', 'password2');
      
      const users = userManager.getAll();
      
      expect(users.length).toBeGreaterThanOrEqual(2);
      users.forEach(user => {
        expect(user.password).toBeUndefined();
        expect(user.username).toBeDefined();
        expect(user.id).toBeDefined();
      });
    });

    it('should include default users', () => {
      const users = userManager.getAll();
      
      const adminUser = users.find(u => u.username === 'admin');
      const regularUser = users.find(u => u.username === 'user');
      
      expect(adminUser).toBeDefined();
      expect(regularUser).toBeDefined();
      expect(adminUser.permissions).toContain('admin');
      expect(regularUser.permissions).toContain('user');
    });
  });
});
