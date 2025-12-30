import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // AI
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || 'sk-9702ca0162624f45845b5d5534050fa5',
  aiDailyLimit: parseInt(process.env.AI_DAILY_LIMIT || '20', 10),

  // OAuth
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },

  // Judge (Hydro Judge)
  judge: {
    // 评测机认证密钥
    secret: process.env.JUDGE_SECRET || 'judge-secret-key',
    // 测试数据存储路径
    testDataPath: process.env.JUDGE_TEST_DATA_PATH || './test-data',
    // 默认时间限制 (ms)
    defaultTimeLimit: parseInt(process.env.JUDGE_DEFAULT_TIME_LIMIT || '1000', 10),
    // 默认内存限制 (MB)
    defaultMemoryLimit: parseInt(process.env.JUDGE_DEFAULT_MEMORY_LIMIT || '256', 10),
    // 支持的语言
    supportedLanguages: ['cc.cc17o2', 'py.py3', 'java', 'js.node', 'go'],
  },
}
