import { useEffect, useRef } from 'react'
import katex from 'katex'

export function KatexTest() {
  const inlineRef = useRef<HTMLSpanElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inlineRef.current) {
      katex.render('E = mc^2', inlineRef.current, {
        throwOnError: false,
        displayMode: false
      })
    }

    if (blockRef.current) {
      katex.render('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', blockRef.current, {
        throwOnError: false,
        displayMode: true
      })
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">KaTeX Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Inline Math:</h2>
        <p>
          The famous equation <span ref={inlineRef}></span> shows mass-energy equivalence.
        </p>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Block Math:</h2>
        <div ref={blockRef}></div>
      </div>
    </div>
  )
}
