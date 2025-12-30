import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateToken, verifyToken } from '../utils/jwt.js'
import type { UserRole } from '../types/index.js'

/**
 * Property-Based Tests for Authentication Module
 * 
 * **Property 1: 认证与权限一致性**
 * **Validates: Requirements 1.1, 1.2**
 * 
 * For any valid user credentials, after login the system should create a session,
 * and the permissions in the session should match the user's role
 * (student role gets student permissions, admin role gets admin permissions).
 * 
 * These tests verify the core authentication logic without requiring a database:
 * - Password hashing and verification
 * - JWT token generation with correct role
 * - Token verification returns correct role
 */

// Arbitrary for generating valid passwords (6-100 chars, printable ASCII)
const passwordArb = fc.string({ minLength: 6, maxLength: 50 })
  .filter(s => s.length >= 6 && /^[\x20-\x7E]+$/.test(s))

// Arbitrary for user roles
const roleArb = fc.constantFrom('student' as UserRole, 'admin' as UserRole)

// Arbitrary for user IDs (CUID-like format)
const userIdArb = fc.string({ minLength: 20, maxLength: 30 })
  .filter(s => /^[a-zA-Z0-9]+$/.test(s))

describe('Auth Service - Property Based Tests', () => {
  /**
   * Feature: ai-club-oj-system, Property 1: 认证与权限一致性
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any password, hashing then comparing with the same password should return true.
   * This is a round-trip property for password verification.
   */
  it('Property 1: Password hash round-trip - correct password always verifies', async () => {
    await fc.assert(
      fc.asyncProperty(
        passwordArb,
        async (password) => {
          // Hash the password
          const hash = await hashPassword(password)
          
          // Verify the same password matches
          const isValid = await comparePassword(password, hash)
          
          expect(isValid).toBe(true)
          return true
        }
      ),
      { numRuns: 20 } // Reduced due to bcrypt being intentionally slow
    )
  }, 30000) // 30 second timeout for bcrypt operations

  /**
   * Feature: ai-club-oj-system, Property 1: 认证与权限一致性
   * **Validates: Requirements 1.1**
   * 
   * For any two different passwords, hashing one and comparing with the other should return false.
   */
  it('Property 1: Password hash - wrong password never verifies', async () => {
    await fc.assert(
      fc.asyncProperty(
        passwordArb,
        passwordArb,
        async (correctPassword, wrongPassword) => {
          // Skip if passwords happen to be the same
          if (correctPassword === wrongPassword) return true

          // Hash the correct password
          const hash = await hashPassword(correctPassword)
          
          // Verify wrong password does not match
          const isValid = await comparePassword(wrongPassword, hash)
          
          expect(isValid).toBe(false)
          return true
        }
      ),
      { numRuns: 20 } // Reduced due to bcrypt being intentionally slow
    )
  }, 30000) // 30 second timeout for bcrypt operations

  /**
   * Feature: ai-club-oj-system, Property 1: 认证与权限一致性
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any user ID and role, generating a token and verifying it should return
   * the same user ID and role. This ensures role consistency in authentication.
   */
  it('Property 1: JWT token round-trip - role in token matches original role', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        roleArb,
        async (userId, role) => {
          // Generate token with user ID and role
          const token = generateToken(userId, role)
          
          // Verify token
          const decoded = verifyToken(token)
          
          // **Key Property**: Role in decoded token matches original role
          expect(decoded.userId).toBe(userId)
          expect(decoded.role).toBe(role)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 1: 认证与权限一致性
   * **Validates: Requirements 1.2**
   * 
   * For any user, student role should map to 'student' permission,
   * and admin role should map to 'admin' permission.
   */
  it('Property 1: Role mapping consistency - student gets student, admin gets admin', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        roleArb,
        async (userId, role) => {
          const token = generateToken(userId, role)
          const decoded = verifyToken(token)
          
          // Verify role mapping is consistent
          if (role === 'student') {
            expect(decoded.role).toBe('student')
          } else if (role === 'admin') {
            expect(decoded.role).toBe('admin')
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 1: 认证与权限一致性
   * **Validates: Requirements 1.1**
   * 
   * For any password, each hash should be unique (due to salt).
   * Hashing the same password twice should produce different hashes.
   */
  it('Property 1: Password hashes are unique due to salting', async () => {
    await fc.assert(
      fc.asyncProperty(
        passwordArb,
        async (password) => {
          // Hash the same password twice
          const hash1 = await hashPassword(password)
          const hash2 = await hashPassword(password)
          
          // Hashes should be different (due to random salt)
          expect(hash1).not.toBe(hash2)
          
          // But both should verify correctly
          expect(await comparePassword(password, hash1)).toBe(true)
          expect(await comparePassword(password, hash2)).toBe(true)
          
          return true
        }
      ),
      { numRuns: 10 } // Reduced due to bcrypt being intentionally slow (4 hash operations per run)
    )
  }, 60000) // 60 second timeout for multiple bcrypt operations
})
