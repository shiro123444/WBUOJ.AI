import type { SupportedLanguage } from '../../types'

interface LanguageOption {
  value: SupportedLanguage
  label: string
  monacoLang: string
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'cpp', label: 'C++', monacoLang: 'cpp' },
  { value: 'python', label: 'Python', monacoLang: 'python' },
  { value: 'java', label: 'Java', monacoLang: 'java' },
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { value: 'go', label: 'Go', monacoLang: 'go' },
]

export const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    // 在这里编写你的代码
    
    return 0;
}`,
  python: `# 在这里编写你的代码

def main():
    pass

if __name__ == "__main__":
    main()`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // 在这里编写你的代码
        
    }
}`,
  javascript: `// 在这里编写你的代码

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    // 处理输入
});`,
  go: `package main

import "fmt"

func main() {
    // 在这里编写你的代码
    
}`,
}

interface LanguageSelectorProps {
  value: SupportedLanguage
  onChange: (language: SupportedLanguage) => void
  disabled?: boolean
  className?: string
}

export function LanguageSelector({
  value,
  onChange,
  disabled = false,
  className = '',
}: LanguageSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SupportedLanguage)}
      disabled={disabled}
      className={`bg-gray-700 text-white text-sm rounded-md px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer min-w-[100px] ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem',
      }}
    >
      {LANGUAGE_OPTIONS.map((lang) => (
        <option 
          key={lang.value} 
          value={lang.value}
          className="bg-gray-700 text-white py-2"
        >
          {lang.label}
        </option>
      ))}
    </select>
  )
}

export function getMonacoLanguage(language: SupportedLanguage): string {
  return LANGUAGE_OPTIONS.find((l) => l.value === language)?.monacoLang || 'plaintext'
}
