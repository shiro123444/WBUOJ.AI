import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员账号
  const passwordHash = await bcrypt.hash('admin', 10)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@aiclub.com',
      passwordHash: passwordHash,
      role: 'ADMIN',
      bio: '系统管理员',
    },
  })
  
  console.log('✅ 管理员账号创建成功:', admin.username)

  // 创建测试题目 - 经典的 A+B Problem
  const problem = await prisma.problem.upsert({
    where: { number: 1 },
    update: {},
    create: {
      number: 1,
      title: 'A+B Problem',
      description: `## 题目描述

给定两个整数 $a$ 和 $b$，请计算它们的和。

这是一道经典的入门题目，用于测试你的编程环境是否正常工作。

## 提示

- 注意数据范围，确保使用合适的数据类型
- 输入输出格式要严格按照要求`,
      inputFormat: `输入包含两个整数 $a$ 和 $b$，用空格分隔。

其中 $-10^9 \\leq a, b \\leq 10^9$`,
      outputFormat: `输出一个整数，表示 $a + b$ 的结果。`,
      constraints: `- $-10^9 \\leq a, b \\leq 10^9$
- 时间限制：1000ms
- 内存限制：256MB`,
      difficulty: 'EASY',
      timeLimit: 1000,
      memoryLimit: 256,
      createdById: admin.id,
    },
  })

  console.log('✅ 测试题目创建成功:', problem.title)

  // 添加示例
  await prisma.example.deleteMany({ where: { problemId: problem.id } })
  
  await prisma.example.createMany({
    data: [
      {
        problemId: problem.id,
        input: '1 2',
        output: '3',
        explanation: '1 + 2 = 3',
        order: 0,
      },
      {
        problemId: problem.id,
        input: '-5 10',
        output: '5',
        explanation: '-5 + 10 = 5',
        order: 1,
      },
      {
        problemId: problem.id,
        input: '1000000000 1000000000',
        output: '2000000000',
        explanation: '注意大数相加',
        order: 2,
      },
    ],
  })

  console.log('✅ 示例数据创建成功')

  // 添加测试用例
  await prisma.testCase.deleteMany({ where: { problemId: problem.id } })
  
  await prisma.testCase.createMany({
    data: [
      { problemId: problem.id, input: '1 2', expectedOutput: '3', isExample: true, order: 0 },
      { problemId: problem.id, input: '-5 10', expectedOutput: '5', isExample: true, order: 1 },
      { problemId: problem.id, input: '0 0', expectedOutput: '0', isExample: false, order: 2 },
      { problemId: problem.id, input: '-100 -200', expectedOutput: '-300', isExample: false, order: 3 },
      { problemId: problem.id, input: '999999999 1', expectedOutput: '1000000000', isExample: false, order: 4 },
    ],
  })

  console.log('✅ 测试用例创建成功')

  // 添加标签
  await prisma.problemTag.deleteMany({ where: { problemId: problem.id } })
  
  await prisma.problemTag.createMany({
    data: [
      { problemId: problem.id, tag: '入门' },
      { problemId: problem.id, tag: '数学' },
      { problemId: problem.id, tag: '模拟' },
    ],
  })

  console.log('✅ 标签创建成功')
  
  console.log('\n🎉 数据初始化完成！')
  console.log('管理员账号: admin')
  console.log('管理员密码: admin')
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
