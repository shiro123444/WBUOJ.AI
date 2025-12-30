import { Link } from 'react-router-dom';
import { Chip } from '@heroui/react';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

interface ProblemCardProps {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  description?: string;
}

const difficultyConfig: Record<string, { label: string; dotColor: string; bgColor: string }> = {
  easy: { label: '简单', dotColor: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  medium: { label: '中等', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  hard: { label: '困难', dotColor: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
};

export const ProblemCard = ({ id, title, difficulty, tags, description }: ProblemCardProps) => {
  const normalizedDifficulty = difficulty.toLowerCase();
  const config = difficultyConfig[normalizedDifficulty] || difficultyConfig.easy;

  return (
    <Link to={`/problems/${id}`} className="block group perspective-1000">
      <div className="relative h-48 w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:shadow-lg">
        {/* Front face - Icon */}
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-0 group-hover:opacity-0">
          <div className={`p-4 rounded-2xl ${config.bgColor}`}>
            <CodeBracketIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          {/* Difficulty badge on front */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {config.label}
            </span>
          </div>
          {/* Title preview on front */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
              {title}
            </h3>
          </div>
        </div>

        {/* Back face - Content (rotates in on hover) */}
        <div className="absolute inset-0 p-5 bg-white dark:bg-gray-800 transform origin-bottom transition-all duration-500 ease-out [transform:rotateX(-90deg)] group-hover:[transform:rotateX(0deg)]">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
            <span className="text-xs text-gray-400 font-medium">{config.label}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
            {description || '点击查看题目详情，开始你的算法之旅...'}
          </p>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {tags.slice(0, 3).map(tag => (
              <Chip
                key={tag}
                size="sm"
                variant="flat"
                classNames={{
                  base: 'bg-gray-100 dark:bg-gray-700/60 h-5',
                  content: 'text-xs text-gray-500 dark:text-gray-400 px-1',
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};
