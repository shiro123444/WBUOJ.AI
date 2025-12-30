import { EnhancedMarkdown } from '../components/common'

const mathTestContent = `# 数学公式渲染测试

## 内联数学公式

这是一个内联数学公式：$E = mc^2$，爱因斯坦的质能方程。

另一个例子：当 $a \\neq 0$ 时，二次方程 $ax^2 + bx + c = 0$ 的解为：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

## 块级数学公式

### 二次方程求根公式

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

### 积分公式

$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

### 矩阵

$$\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}$$

### 求和公式

$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$

### 极限

$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$

## 代码块测试

\`\`\`cpp
#include <iostream>
#include <cmath>

int main() {
    double a, b, c;
    std::cin >> a >> b >> c;
    
    double delta = b * b - 4 * a * c;
    
    if (delta > 0) {
        double x1 = (-b + sqrt(delta)) / (2 * a);
        double x2 = (-b - sqrt(delta)) / (2 * a);
        std::cout << std::min(x1, x2) << std::endl;
        std::cout << std::max(x1, x2) << std::endl;
    } else if (delta == 0) {
        double x = -b / (2 * a);
        std::cout << x << std::endl;
    } else {
        std::cout << "No real solution" << std::endl;
    }
    
    return 0;
}
\`\`\`

## 表格测试

| 函数 | 导数 | 积分 |
|------|------|------|
| $x^n$ | $nx^{n-1}$ | $\\frac{x^{n+1}}{n+1}$ |
| $e^x$ | $e^x$ | $e^x$ |
| $\\sin x$ | $\\cos x$ | $-\\cos x$ |
| $\\cos x$ | $-\\sin x$ | $\\sin x$ |

## 复杂公式

### 泰勒级数

$$e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!} = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\cdots$$

### 欧拉公式

$$e^{i\\pi} + 1 = 0$$

### 傅里叶变换

$$\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} dx$$
`

export function MathTest() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <EnhancedMarkdown>{mathTestContent}</EnhancedMarkdown>
      </div>
    </div>
  )
}