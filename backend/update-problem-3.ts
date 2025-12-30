import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 更新题目3的描述
  const problem = await prisma.problem.update({
    where: { number: 3 },
    data: {
      description: `## 题目描述

给定圆的半径 $r$，请计算圆的面积和周长。

## 数学公式

对于半径为 $r$ 的圆：

- **周长公式**：

$$C = 2\\pi r$$

- **面积公式**：

$$S = \\pi r^2$$

其中 $\\pi \\approx 3.14159265358979323846$

## 几何意义

- 周长是圆的边界长度
- 面积是圆内部区域的大小

## 实现提示

使用数学库中的 $\\pi$ 值，或者使用高精度的 $\\pi$ 近似值。`
    }
  })

  console.log('✅ 题目3更新成功:', problem.title)
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })