import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 获取管理员用户
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' }
  })

  if (!admin) {
    console.error('❌ 管理员用户不存在，请先运行 seed-admin.ts')
    process.exit(1)
  }

  // 创建数学公式题目 - 二次方程求解
  const mathProblem = await prisma.problem.upsert({
    where: { number: 2 },
    update: {},
    create: {
      number: 2,
      title: '二次方程求解',
      description: `## 题目描述

给定一个二次方程 $ax^2 + bx + c = 0$，其中 $a \\neq 0$，请求出该方程的实数解。

二次方程的判别式为：$\\Delta = b^2 - 4ac$

根据判别式的值，我们可以判断方程解的情况：

- 当 $\\Delta > 0$ 时，方程有两个不相等的实数解：
  $$x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a}, \\quad x_2 = \\frac{-b - \\sqrt{\\Delta}}{2a}$$

- 当 $\\Delta = 0$ 时，方程有一个重根：
  $$x = \\frac{-b}{2a}$$

- 当 $\\Delta < 0$ 时，方程无实数解

## 算法思路

1. 计算判别式 $\\Delta = b^2 - 4ac$
2. 根据 $\\Delta$ 的值分情况讨论
3. 使用求根公式计算解

## 注意事项

- 保证 $a \\neq 0$
- 注意浮点数精度问题
- 输出格式要求保留6位小数`,
      inputFormat: `输入一行包含三个实数 $a$、$b$、$c$，用空格分隔，表示二次方程 $ax^2 + bx + c = 0$ 的系数。

保证 $a \\neq 0$，且 $|a|, |b|, |c| \\leq 1000$。`,
      outputFormat: `根据判别式的值输出不同的结果：

- 如果 $\\Delta > 0$，输出两行，每行一个实数，表示两个解。较小的解在前面，保留6位小数。
- 如果 $\\Delta = 0$，输出一行，包含一个实数，表示重根，保留6位小数。
- 如果 $\\Delta < 0$，输出一行 \`No real solution\`。`,
      constraints: `- $a \\neq 0$
- $|a|, |b|, |c| \\leq 1000$
- 时间限制：1000ms
- 内存限制：256MB`,
      difficulty: 'MEDIUM',
      timeLimit: 1000,
      memoryLimit: 256,
      createdById: admin.id,
    },
  })

  console.log('✅ 数学题目创建成功:', mathProblem.title)

  // 添加示例
  await prisma.example.deleteMany({ where: { problemId: mathProblem.id } })
  
  await prisma.example.createMany({
    data: [
      {
        problemId: mathProblem.id,
        input: '1 -3 2',
        output: '1.000000\n2.000000',
        explanation: '方程 $x^2 - 3x + 2 = 0$ 的判别式 $\\Delta = 9 - 8 = 1 > 0$，所以有两个解：$x_1 = 1$，$x_2 = 2$',
        order: 0,
      },
      {
        problemId: mathProblem.id,
        input: '1 -2 1',
        output: '1.000000',
        explanation: '方程 $x^2 - 2x + 1 = 0$ 的判别式 $\\Delta = 4 - 4 = 0$，所以有一个重根：$x = 1$',
        order: 1,
      },
      {
        problemId: mathProblem.id,
        input: '1 0 1',
        output: 'No real solution',
        explanation: '方程 $x^2 + 1 = 0$ 的判别式 $\\Delta = 0 - 4 = -4 < 0$，所以无实数解',
        order: 2,
      },
    ],
  })

  console.log('✅ 数学示例数据创建成功')

  // 添加测试用例
  await prisma.testCase.deleteMany({ where: { problemId: mathProblem.id } })
  
  await prisma.testCase.createMany({
    data: [
      { problemId: mathProblem.id, input: '1 -3 2', expectedOutput: '1.000000\n2.000000', isExample: true, order: 0 },
      { problemId: mathProblem.id, input: '1 -2 1', expectedOutput: '1.000000', isExample: true, order: 1 },
      { problemId: mathProblem.id, input: '1 0 1', expectedOutput: 'No real solution', isExample: true, order: 2 },
      { problemId: mathProblem.id, input: '2 -4 2', expectedOutput: '1.000000', isExample: false, order: 3 },
      { problemId: mathProblem.id, input: '1 -5 6', expectedOutput: '2.000000\n3.000000', isExample: false, order: 4 },
    ],
  })

  console.log('✅ 数学测试用例创建成功')

  // 添加标签
  await prisma.problemTag.deleteMany({ where: { problemId: mathProblem.id } })
  
  await prisma.problemTag.createMany({
    data: [
      { problemId: mathProblem.id, tag: '数学' },
      { problemId: mathProblem.id, tag: '代数' },
      { problemId: mathProblem.id, tag: '二次方程' },
      { problemId: mathProblem.id, tag: '公式' },
    ],
  })

  console.log('✅ 数学标签创建成功')

  // 创建几何题目 - 圆的面积和周长
  const geometryProblem = await prisma.problem.upsert({
    where: { number: 3 },
    update: {},
    create: {
      number: 3,
      title: '圆的面积和周长',
      description: `## 题目描述

给定圆的半径 $r$，请计算圆的面积和周长。

## 数学公式

对于半径为 $r$ 的圆：

- **周长公式**：$C = 2\\pi r$
- **面积公式**：$S = \\pi r^2$

其中 $\\pi \\approx 3.14159265358979323846$

## 几何意义

- 周长是圆的边界长度
- 面积是圆内部区域的大小

## 实现提示

使用数学库中的 $\\pi$ 值，或者使用高精度的 $\\pi$ 近似值。`,
      inputFormat: `输入一行包含一个正实数 $r$，表示圆的半径。

保证 $0 < r \\leq 1000$。`,
      outputFormat: `输出两行：
- 第一行输出圆的周长，保留6位小数
- 第二行输出圆的面积，保留6位小数`,
      constraints: `- $0 < r \\leq 1000$
- 时间限制：1000ms
- 内存限制：256MB
- 使用 $\\pi = 3.14159265358979323846$`,
      difficulty: 'EASY',
      timeLimit: 1000,
      memoryLimit: 256,
      createdById: admin.id,
    },
  })

  console.log('✅ 几何题目创建成功:', geometryProblem.title)

  // 添加几何示例
  await prisma.example.deleteMany({ where: { problemId: geometryProblem.id } })
  
  await prisma.example.createMany({
    data: [
      {
        problemId: geometryProblem.id,
        input: '1',
        output: '6.283185\n3.141593',
        explanation: '半径为1的圆：周长 $C = 2\\pi \\times 1 = 2\\pi$，面积 $S = \\pi \\times 1^2 = \\pi$',
        order: 0,
      },
      {
        problemId: geometryProblem.id,
        input: '2.5',
        output: '15.707963\n19.634954',
        explanation: '半径为2.5的圆：周长 $C = 2\\pi \\times 2.5 = 5\\pi$，面积 $S = \\pi \\times 2.5^2 = 6.25\\pi$',
        order: 1,
      },
    ],
  })

  console.log('✅ 几何示例数据创建成功')

  // 添加几何测试用例
  await prisma.testCase.deleteMany({ where: { problemId: geometryProblem.id } })
  
  await prisma.testCase.createMany({
    data: [
      { problemId: geometryProblem.id, input: '1', expectedOutput: '6.283185\n3.141593', isExample: true, order: 0 },
      { problemId: geometryProblem.id, input: '2.5', expectedOutput: '15.707963\n19.634954', isExample: true, order: 1 },
      { problemId: geometryProblem.id, input: '10', expectedOutput: '62.831853\n314.159265', isExample: false, order: 2 },
      { problemId: geometryProblem.id, input: '0.5', expectedOutput: '3.141593\n0.785398', isExample: false, order: 3 },
    ],
  })

  console.log('✅ 几何测试用例创建成功')

  // 添加几何标签
  await prisma.problemTag.deleteMany({ where: { problemId: geometryProblem.id } })
  
  await prisma.problemTag.createMany({
    data: [
      { problemId: geometryProblem.id, tag: '数学' },
      { problemId: geometryProblem.id, tag: '几何' },
      { problemId: geometryProblem.id, tag: '圆' },
      { problemId: geometryProblem.id, tag: '公式' },
    ],
  })

  console.log('✅ 几何标签创建成功')
  
  console.log('\n🎉 数学题目初始化完成！')
  console.log('已创建题目:')
  console.log('- 题目2: 二次方程求解 (包含复杂数学公式)')
  console.log('- 题目3: 圆的面积和周长 (包含几何公式)')
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })