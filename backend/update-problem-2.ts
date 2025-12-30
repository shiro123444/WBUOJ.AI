import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 更新题目2的描述
  const problem = await prisma.problem.update({
    where: { number: 2 },
    data: {
      description: `## 题目描述

给定一个二次方程 $ax^2 + bx + c = 0$，其中 $a \\neq 0$，请求出该方程的实数解。

二次方程的判别式为：

$$\\Delta = b^2 - 4ac$$

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
- 输出格式要求保留6位小数`
    }
  })

  console.log('✅ 题目2更新成功:', problem.title)
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })