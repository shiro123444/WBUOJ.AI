import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

const testContent = `
# 简单数学公式测试

内联公式：$E = mc^2$

块级公式：
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
`

export function SimpleTest() {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <button 
            onClick={() => setShowRaw(!showRaw)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showRaw ? '显示渲染结果' : '显示原始内容'}
          </button>
        </div>
        
        {showRaw ? (
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto">
            {testContent}
          </pre>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {testContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}