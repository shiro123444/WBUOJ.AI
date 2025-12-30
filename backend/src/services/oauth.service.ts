import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { generateToken, getTokenExpiration } from '../utils/index.js'
import { AppError } from '../types/index.js'
import type { UserRole } from '../types/index.js'
import type { AuthResponse } from './auth.service.js'

// GitHub OAuth types
interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope: string
}

interface GitHubUserResponse {
  id: number
  login: string
  email: string | null
  avatar_url: string
  name: string | null
}

interface GitHubEmailResponse {
  email: string
  primary: boolean
  verified: boolean
}

export class OAuthService {
  /**
   * Get GitHub OAuth authorization URL
   */
  getGitHubAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: config.github.clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state: this.generateState(),
    })
    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  /**
   * Handle GitHub OAuth callback
   */
  async handleGitHubCallback(code: string): Promise<AuthResponse> {
    // Exchange code for access token
    const tokenResponse = await this.exchangeGitHubCode(code)
    
    // Get user info from GitHub
    const githubUser = await this.getGitHubUser(tokenResponse.access_token)
    
    // Get user email if not provided
    let email = githubUser.email
    if (!email) {
      email = await this.getGitHubPrimaryEmail(tokenResponse.access_token)
    }

    if (!email) {
      throw new AppError(400, 'Unable to get email from GitHub', 'OAUTH_NO_EMAIL')
    }

    // Find or create user
    let user = await prisma.users.findFirst({
      where: {
        OR: [
          { oauthProvider: 'GITHUB', oauthId: String(githubUser.id) },
          { email },
        ],
      },
    })

    if (user) {
      // Update OAuth info if user exists but wasn't linked to GitHub
      if (!user.oauthProvider) {
        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            oauthProvider: 'GITHUB',
            oauthId: String(githubUser.id),
            avatar: user.avatar || githubUser.avatar_url,
            lastLoginAt: new Date(),
          },
        })
      } else {
        // Update last login
        user = await prisma.users.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      }
    } else {
      // Create new user
      const username = await this.generateUniqueUsername(githubUser.login)
      user = await prisma.users.create({
        data: {
          username,
          email,
          passwordHash: '', // OAuth users don't have password
          avatar: githubUser.avatar_url,
          bio: githubUser.name || undefined,
          role: 'STUDENT',
          oauthProvider: 'GITHUB',
          oauthId: String(githubUser.id),
          lastLoginAt: new Date(),
        },
      })
    }

    // Generate JWT token
    const role: UserRole = user.role.toLowerCase() as UserRole
    const token = generateToken(user.id, role)
    const expiresAt = getTokenExpiration()

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role,
        avatar: user.avatar,
      },
      expiresAt,
    }
  }

  /**
   * Exchange GitHub authorization code for access token
   */
  private async exchangeGitHubCode(code: string): Promise<GitHubTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
      }),
    })

    if (!response.ok) {
      throw new AppError(400, 'Failed to exchange GitHub code', 'OAUTH_TOKEN_ERROR')
    }

    const data = await response.json() as GitHubTokenResponse & { error?: string }
    
    if (data.error) {
      throw new AppError(400, `GitHub OAuth error: ${data.error}`, 'OAUTH_TOKEN_ERROR')
    }

    return data
  }

  /**
   * Get GitHub user info
   */
  private async getGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new AppError(400, 'Failed to get GitHub user info', 'OAUTH_USER_ERROR')
    }

    return response.json() as Promise<GitHubUserResponse>
  }

  /**
   * Get GitHub user's primary email
   */
  private async getGitHubPrimaryEmail(accessToken: string): Promise<string | null> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return null
    }

    const emails = await response.json() as GitHubEmailResponse[]
    const primaryEmail = emails.find(e => e.primary && e.verified)
    return primaryEmail?.email || null
  }

  /**
   * Generate a unique username based on GitHub login
   */
  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername
    let counter = 1

    while (true) {
      const existing = await prisma.users.findUnique({
        where: { username },
      })

      if (!existing) {
        return username
      }

      username = `${baseUsername}${counter}`
      counter++

      if (counter > 100) {
        // Fallback to random suffix
        username = `${baseUsername}_${Date.now()}`
        break
      }
    }

    return username
  }

  /**
   * Generate a random state for OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15)
  }
}

export const oauthService = new OAuthService()
