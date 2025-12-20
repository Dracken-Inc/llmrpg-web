const request = require('supertest');
const express = require('express');
const userManager = require('../managers/userManager');

// We'll need to import our app, but for now let's create a minimal test app
// In a real scenario, we'd export the app from index.js for testing

describe('Authentication API Integration Tests', () => {
  let app;
  let server;

  beforeAll(() => {
    // Create test Express app with auth routes
    app = express();
    app.use(express.json());

    const { authenticateToken } = require('../middleware/auth');
    const { asyncHandler } = require('../middleware/errorHandler');

    // Auth routes
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

    app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
      const user = userManager.getById(req.user.userId);
      res.json({
        success: true,
        user
      });
    }));
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const uniqueUsername = `testuser${Date.now()}`;
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          password: 'testpassword'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe(uniqueUsername);
      expect(response.body.user.permissions).toContain('user');
    });

    it('should reject registration without username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'testpassword'
        })
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('REGISTRATION_FAILED');
    });

    it('should reject registration without password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
        })
        .expect(400);

      expect(response.body.error).toBe(true);
    });

    it('should reject duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          password: 'test'
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user',
          password: 'user'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('user');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('LOGIN_FAILED');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password'
        })
        .expect(401);

      expect(response.body.error).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'user',
          password: 'user'
        });
      token = response.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('user');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(403);

      expect(response.body.error).toBe(true);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });
});
