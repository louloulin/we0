/**
 * DeepSeek 稳定测试套件
 * 只测试确认可用的功能，确保测试稳定性
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { generateText } from 'ai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入 DeepSeek 模型
import { deepseekChat, deepseekCoder } from '../models/deepseek';

describe('DeepSeek 稳定测试', () => {
  beforeAll(() => {
    console.log('🚀 开始 DeepSeek 稳定测试');
    console.log(`🔑 API 密钥状态: ${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}`);
  });

  describe('DeepSeek Chat 模型测试', () => {
    test('应该能够进行基本对话', async () => {
      const result = await generateText({
        model: deepseekChat(),
        prompt: '你好，请简单介绍一下你自己',
        maxTokens: 100,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      console.log('✅ DeepSeek Chat 响应:', result.text.substring(0, 100) + '...');
      console.log('📊 使用情况:', result.usage);
    }, 30000);

    test('应该能够生成 TypeScript 代码', async () => {
      const result = await generateText({
        model: deepseekChat(),
        prompt: '创建一个 TypeScript 函数来计算斐波那契数列的第 n 项',
        maxTokens: 200,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // 验证代码生成内容（支持中英文）
      expect(result.text.toLowerCase()).toMatch(/(function|函数)/);
      expect(result.text.toLowerCase()).toMatch(/(fibonacci|斐波那契)/);

      console.log('✅ TypeScript 代码生成:', result.text.substring(0, 200) + '...');
    }, 30000);

    test('应该能够生成 React 组件', async () => {
      const result = await generateText({
        model: deepseekChat(),
        prompt: '创建一个 React 函数组件，显示用户列表，包含状态管理',
        maxTokens: 300,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // 验证 React 代码内容（支持中英文）
      expect(result.text.toLowerCase()).toMatch(/(react|组件)/);
      expect(result.text.toLowerCase()).toMatch(/(component|组件|函数组件)/);
      expect(result.text.toLowerCase()).toMatch(/(usestate|状态管理|state)/);

      console.log('✅ React 组件代码:', result.text.substring(0, 200) + '...');
    }, 30000);
  });

  describe('DeepSeek Coder 别名测试', () => {
    test('deepseekCoder 别名应该正常工作', async () => {
      const result = await generateText({
        model: deepseekCoder(), // 这实际上调用 deepseek-chat
        prompt: '创建一个简单的 JavaScript 函数来排序数组',
        maxTokens: 150,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // 验证代码内容
      expect(result.text.toLowerCase()).toMatch(/(function|函数|sort|排序)/);
      expect(result.text.toLowerCase()).toMatch(/(array|数组)/);

      console.log('✅ DeepSeek Coder 别名工作正常:', result.text.substring(0, 150) + '...');
    }, 30000);
  });

  describe('性能和并发测试', () => {
    test('应该能够处理短提示', async () => {
      const result = await generateText({
        model: deepseekChat(),
        prompt: 'Hello',
        maxTokens: 50,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      console.log('✅ 短提示响应:', result.text);
    }, 15000);

    test('应该能够处理并发请求', async () => {
      const prompts = [
        '创建一个简单的 JavaScript 函数',
        '解释什么是闭包',
        '设计一个 REST API',
        '优化数据库查询',
        '实现用户认证'
      ];

      const promises = prompts.map(prompt => 
        generateText({
          model: deepseekChat(),
          prompt,
          maxTokens: 100,
        })
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(5);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);
        console.log(`✅ 并发请求 ${index + 1} 完成，长度: ${result.text.length}`);
      });

      console.log('🔄 所有并发请求成功完成');
    }, 60000);
  });

  describe('错误处理测试', () => {
    test('应该能够处理空提示', async () => {
      const result = await generateText({
        model: deepseekChat(),
        prompt: '',
        maxTokens: 50,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      // 空提示可能返回空响应或默认响应
    }, 15000);

    test('应该能够处理长提示', async () => {
      const longPrompt = `
        请详细分析以下技术栈的优缺点：
        1. React + TypeScript + Next.js
        2. Vue.js + TypeScript + Nuxt.js
        3. Angular + TypeScript
        4. Svelte + SvelteKit
        
        请从以下角度分析：
        - 开发体验
        - 性能表现
        - 生态系统
        - 学习曲线
        - 社区支持
      `;

      const result = await generateText({
        model: deepseekChat(),
        prompt: longPrompt,
        maxTokens: 500,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(100);

      console.log('✅ 长提示响应长度:', result.text.length);
    }, 60000);
  });

  describe('模型功能验证', () => {
    test('应该能够进行代码分析', async () => {
      const result = await generateText({
        model: deepseekChat(),
        prompt: '分析这段代码的时间复杂度：for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { console.log(i, j); } }',
        maxTokens: 200,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // 验证分析内容
      expect(result.text.toLowerCase()).toMatch(/(o\(n\^2\)|o\(n²\)|复杂度|complexity)/);

      console.log('✅ 代码分析:', result.text.substring(0, 200) + '...');
    }, 30000);

    test('应该能够提供技术建议', async () => {
      const result = await generateText({
        model: deepseekChat(),
        prompt: '如何优化 React 应用的性能？请提供 3 个具体建议',
        maxTokens: 300,
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);

      // 验证建议内容
      expect(result.text.toLowerCase()).toMatch(/(react|性能|优化|performance)/);
      expect(result.text.toLowerCase()).toMatch(/(memo|usecallback|lazy|虚拟化)/);

      console.log('✅ 技术建议:', result.text.substring(0, 300) + '...');
    }, 30000);
  });

  describe('响应时间基准测试', () => {
    test('简单请求响应时间应该合理', async () => {
      const startTime = Date.now();
      
      const result = await generateText({
        model: deepseekChat(),
        prompt: '创建一个简单的 Hello World 函数',
        maxTokens: 100,
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`⚡ 响应时间: ${responseTime}ms`);
      
      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(30000); // 30秒内响应
    }, 35000);

    test('代码生成响应时间应该合理', async () => {
      const startTime = Date.now();
      
      const result = await generateText({
        model: deepseekCoder(),
        prompt: '创建一个完整的 Express.js API 路由处理用户 CRUD 操作',
        maxTokens: 300,
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`⚡ 代码生成响应时间: ${responseTime}ms`);
      
      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(45000); // 45秒内响应
    }, 50000);
  });
});
