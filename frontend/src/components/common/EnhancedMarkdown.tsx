import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import type { Components } from 'react-markdown'

interface EnhancedMarkdownProps {
  children: string
  className?: string
  components?: Components
}

// 自定义组件，优化代码块和数学公式的显示
const defaultComponents: Components = {
  // 代码块组件
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    
    // 检查是否为内联代码
    const isInline = !className || !className.includes('language-')
    
    if (isInline) {
      return (
        <code 
          className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" 
          {...props}
        >
          {children}
        </code>
      )
    }

    return (
      <div className="relative group">
        {language && (
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {language}
          </div>
        )}
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    )
  },
  
  // 表格组件
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
        {children}
      </table>
    </div>
  ),
  
  // 表头组件
  th: ({ children }) => (
    <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  
  // 表格单元格组件
  td: ({ children }) => (
    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
      {children}
    </td>
  ),
  
  // 引用块组件
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  
  // 列表组件
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 my-2 ml-4">
      {children}
    </ul>
  ),
  
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 my-2 ml-4">
      {children}
    </ol>
  ),
  
  // 链接组件
  a: ({ href, children }) => (
    <a 
      href={href} 
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  
  // 标题组件
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
      {children}
    </h1>
  ),
  
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
      {children}
    </h2>
  ),
  
  h3: ({ children }) => (
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-3 mb-2">
      {children}
    </h3>
  ),
  
  // 段落组件
  p: ({ children }) => (
    <p className="text-gray-700 dark:text-gray-300 leading-relaxed my-2">
      {children}
    </p>
  ),
}

export function EnhancedMarkdown({ 
  children, 
  className = "prose prose-sm dark:prose-invert max-w-none",
  components = {}
}: EnhancedMarkdownProps) {
  const mergedComponents = { ...defaultComponents, ...components }
  
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        components={mergedComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}