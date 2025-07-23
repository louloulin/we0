/**
 * DeepSeek 直接 API 测试
 * 绕过 Mastra 网络，直接测试 DeepSeek 模型集成
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { generateText } from 'ai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入 DeepSeek 模型
import { deepseekChat, deepseekCoder, deepseekReasoner } from '../models/deepseek';

describe('DeepSeek 直接模型测试', () => {
  beforeAll(() => {
    console.log('🚀 开始 DeepSeek 直接模型测试');
    console.log(`🔑 API 密钥状态: ${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}`);
  });

  describe('DeepSeek Chat 模型测试', () => {
    test('应该能够直接调用 DeepSeek Chat', async () => {
      try {
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
      } catch (error) {
        console.error('❌ DeepSeek Chat 调用失败:', error);
        throw error;
      }
    }, 30000);
  });

  describe('DeepSeek Coder 模型测试', () => {
    test('应该能够直接调用 DeepSeek Coder', async () => {
      try {
        const result = await generateText({
          model: deepseekCoder(),
          prompt: '创建一个 TypeScript 函数来计算斐波那契数列的第 n 项',
          maxTokens: 200,
        });

        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);

        // 验证代码生成内容
        expect(result.text.toLowerCase()).toContain('function');
        expect(result.text.toLowerCase()).toContain('fibonacci');

        console.log('✅ DeepSeek Coder 响应:', result.text.substring(0, 200) + '...');
        console.log('📊 使用情况:', result.usage);
      } catch (error) {
        console.error('❌ DeepSeek Coder 调用失败:', error);
        throw error;
      }
    }, 30000);

    test('应该能够生成 React 组件代码', async () => {
      try {
        const result = await generateText({
          model: deepseekCoder(),
          prompt: '创建一个 React 函数组件，显示用户列表，包含状态管理',
          maxTokens: 300,
        });

        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);

        // 验证 React 代码内容（支持中英文）
        expect(result.text.toLowerCase()).toMatch(/(react|组件)/);
        expect(result.text.toLowerCase()).toMatch(/(component|组件|函数组件)/);
        expect(result.text.toLowerCase()).toMatch(/(usestate|状态管理)/);

        // 验证包含代码结构
        expect(result.text).toMatch(/(const|function|=>)/);
        expect(result.text).toMatch(/[\[\{]/); // 包含数组或对象语法

        console.log('✅ React 组件代码:', result.text.substring(0, 300) + '...');
      } catch (error) {
        console.error('❌ React 组件生成失败:', error);
        throw error;
      }
    }, 30000);
  });

  describe('DeepSeek Reasoner 推理模型测试', () => {
    test('应该能够直接调用 DeepSeek Reasoner', async () => {
      try {
        const result = await generateText({
          model: deepseekReasoner(), // 使用实际存在的 reasoner 模型
          prompt: '分析一下微服务架构的优缺点',
          maxTokens: 300,
        });

        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);

        // 验证推理内容（支持中英文）
        expect(result.text.toLowerCase()).toMatch(/(微服务|microservice)/);
        expect(result.text.toLowerCase()).toMatch(/(架构|architecture)/);
        expect(result.text.toLowerCase()).toMatch(/(优点|缺点|advantage|disadvantage)/);

        console.log('✅ DeepSeek Reasoner 推理响应:', result.text.substring(0, 300) + '...');
        console.log('📊 使用情况:', result.usage);
      } catch (error) {
        console.error('❌ DeepSeek Reasoner 调用失败:', error);
        throw error;
      }
    }, 45000);
  });

  describe('性能和错误处理测试', () => {
    test('应该能够处理短提示', async () => {
      try {
        const result = await generateText({
          model: deepseekChat(),
          prompt: 'Hello',
          maxTokens: 50,
        });

        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(0);

        console.log('✅ 短提示响应:', result.text);
      } catch (error) {
        console.error('❌ 短提示处理失败:', error);
        throw error;
      }
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

      try {
        const result = await generateText({
          model: deepseekChat(),
          prompt: longPrompt,
          maxTokens: 500,
        });

        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.text.length).toBeGreaterThan(100);

        console.log('✅ 长提示响应长度:', result.text.length);
        console.log('📊 使用情况:', result.usage);
      } catch (error) {
        console.error('❌ 长提示处理失败:', error);
        throw error;
      }
    }, 60000);

    test('应该能够处理并发请求', async () => {
      const prompts = [
        '创建一个简单的 JavaScript 函数',
        '解释什么是闭包',
        '设计一个 REST API',
        '优化数据库查询',
        '实现用户认证'
      ];

      try {
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
      } catch (error) {
        console.error('❌ 并发请求失败:', error);
        throw error;
      }
    }, 60000);
  });

  describe('模型比较测试', () => {
    test('应该能够比较不同模型的响应', async () => {
      const prompt = '解释什么是递归算法';

      try {
        const [chatResult, coderResult] = await Promise.all([
          generateText({
            model: deepseekChat(),
            prompt,
            maxTokens: 150,
          }),
          generateText({
            model: deepseekCoder(),
            prompt,
            maxTokens: 150,
          })
        ]);

        expect(chatResult).toBeDefined();
        expect(coderResult).toBeDefined();

        console.log('📝 Chat 模型响应长度:', chatResult.text.length);
        console.log('💻 Coder 模型响应长度:', coderResult.text.length);
        
        console.log('Chat 响应预览:', chatResult.text.substring(0, 100) + '...');
        console.log('Coder 响应预览:', coderResult.text.substring(0, 100) + '...');

        // 两个模型都应该有有效响应
        expect(chatResult.text.length).toBeGreaterThan(0);
        expect(coderResult.text.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('❌ 模型比较失败:', error);
        throw error;
      }
    }, 45000);
  });
});
