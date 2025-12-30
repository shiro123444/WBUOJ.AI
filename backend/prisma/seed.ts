import { PrismaClient, Difficulty, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.users.upsert({
    where: { email: 'admin@aiclub.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'admin@aiclub.com',
      username: 'admin',
      password_hash: adminPassword,
      role: UserRole.ADMIN,
      updated_at: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const testUser = await prisma.users.upsert({
    where: { email: 'test@aiclub.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'test@aiclub.com',
      username: 'testuser',
      password_hash: userPassword,
      role: UserRole.STUDENT,
      updated_at: new Date(),
    },
  });
  console.log('✅ Test user created:', testUser.username);

  // Create problems
  const problemsData = [
    {
      title: '两数之和',
      description: `# 两数之和

给定一个整数数组 \`nums\` 和一个整数目标值 \`target\`，请你在该数组中找出和为目标值 \`target\` 的那两个整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

你可以按任意顺序返回答案。

## 示例 1：
\`\`\`
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。
\`\`\`

## 示例 2：
\`\`\`
输入：nums = [3,2,4], target = 6
输出：[1,2]
\`\`\``,
      difficulty: Difficulty.EASY,
      input_format: '第一行包含两个整数 n 和 target\n第二行包含 n 个整数',
      output_format: '输出两个整数，表示答案的下标',
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
      tags: ['数组', '哈希表'],
    },
    {
      title: '最长回文子串',
      description: `# 最长回文子串

给你一个字符串 \`s\`，找到 \`s\` 中最长的回文子串。

如果字符串的反序与原始字符串相同，则该字符串称为回文字符串。

## 示例 1：
\`\`\`
输入：s = "babad"
输出："bab"
解释："aba" 同样是符合题意的答案。
\`\`\`

## 示例 2：
\`\`\`
输入：s = "cbbd"
输出："bb"
\`\`\``,
      difficulty: Difficulty.MEDIUM,
      input_format: '一行字符串 s',
      output_format: '输出最长回文子串',
      constraints: '1 <= s.length <= 1000\ns 仅由数字和英文字母组成',
      tags: ['字符串', '动态规划'],
    },
    {
      title: '接雨水',
      description: `# 接雨水

给定 \`n\` 个非负整数表示每个宽度为 \`1\` 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

## 示例 1：
\`\`\`
输入：height = [0,1,0,2,1,0,1,3,2,1,2,1]
输出：6
解释：上面是由数组 [0,1,0,2,1,0,1,3,2,1,2,1] 表示的高度图，在这种情况下，可以接 6 个单位的雨水。
\`\`\`

## 示例 2：
\`\`\`
输入：height = [4,2,0,3,2,5]
输出：9
\`\`\``,
      difficulty: Difficulty.HARD,
      input_format: '第一行一个整数 n\n第二行 n 个整数表示高度',
      output_format: '输出能接的雨水量',
      constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
      tags: ['栈', '双指针', '动态规划'],
    },
  ];

  for (const problemData of problemsData) {
    const { tags, ...data } = problemData;
    const problem = await prisma.problems.create({
      data: {
        id: randomUUID(),
        ...data,
        created_by_id: admin.id,
        updated_at: new Date(),
      },
    });
    
    // Create tags
    for (const tag of tags) {
      await prisma.problem_tags.create({
        data: {
          id: randomUUID(),
          problem_id: problem.id,
          tag,
        },
      });
    }
    
    // Create example test case
    await prisma.examples.create({
      data: {
        id: randomUUID(),
        problem_id: problem.id,
        input: problem.difficulty === 'EASY' ? '4 9\n2 7 11 15' : 
               problem.difficulty === 'MEDIUM' ? 'babad' : '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        output: problem.difficulty === 'EASY' ? '0 1' : 
                problem.difficulty === 'MEDIUM' ? 'bab' : '6',
        order: 0,
      },
    });
    
    console.log('✅ Problem created:', problem.title);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
