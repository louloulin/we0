/**
 * DeepSeek 真实 API 测试套件
 * 使用真实的 DeepSeek API 密钥进行完整功能测试
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 验证 API 密钥存在
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

// 导入测试目标
import {
  quickClaudeCodeExecution,
  getClaudeCodeFusionStatus
} from '../networks/claude-code-fusion-network';

describe('DeepSeek 真实 API 测试', () => {
  beforeAll(() => {
    console.log('🚀 开始 DeepSeek 真实 API 测试');
    console.log(`🔑 API 密钥状态: ${DEEPSEEK_API_KEY ? '已配置' : '未配置'}`);
    console.log(`🌐 API 端点: ${DEEPSEEK_BASE_URL}`);

    if (!DEEPSEEK_API_KEY) {
      console.warn('⚠️  警告: 未找到 DEEPSEEK_API_KEY，测试可能失败');
    }
  });

  afterAll(() => {
    console.log('✅ DeepSeek 真实 API 测试完成');
  });

  describe('API 连接测试', () => {
    test('应该能够连接到 DeepSeek API', async () => {
      expect(DEEPSEEK_API_KEY).toBeDefined();
      expect(DEEPSEEK_API_KEY).toMatch(/^sk-/);
      expect(DEEPSEEK_BASE_URL).toBe('https://api.deepseek.com/v1');
    });

    test('系统状态应该正确返回', () => {
      const status = getClaudeCodeFusionStatus();

      expect(status).toBeDefined();
      expect(status.system).toBeDefined();
      expect(status.system.name).toBe('Claude Code Fusion Network');
    });
  });

  describe('DeepSeek 代码生成测试', () => {
    test('应该能够生成简单的 TypeScript 函数', async () => {
      const prompt = '创建一个 TypeScript 函数来计算斐波那契数列的第 n 项';

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: false,
        useDeepSeek: true
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      expect(result).toContain('function');
      expect(result.toLowerCase()).toContain('fibonacci');

      console.log('🎯 生成的代码:', result.substring(0, 200) + '...');
    }, 30000);

    test('应该能够生成 React 组件', async () => {
      const prompt = '创建一个 React 函数组件，包含状态管理和事件处理，用于显示用户列表';

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: false,
        useDeepSeek: true
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      expect(result.toLowerCase()).toContain('react');
      expect(result.toLowerCase()).toContain('component');

      console.log('⚛️  生成的 React 组件:', result.substring(0, 300) + '...');
    }, 30000);

    test('应该能够生成 Node.js API 代码', async () => {
      const prompt = '创建一个 Express.js API 路由，实现用户 CRUD 操作，包含输入验证和错误处理';

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: false,
        useDeepSeek: true
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      expect(result.toLowerCase()).toContain('express');
      expect(result.toLowerCase()).toContain('api');

      console.log('🚀 生成的 API 代码:', result.substring(0, 300) + '...');
    }, 30000);
  });

  describe('DeepSeek 思维模式测试', () => {
    test('应该能够进行复杂的架构设计推理', async () => {
      const prompt = '设计一个简单的用户认证系统架构';

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: true,
        useDeepSeek: true
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      expect(result.toLowerCase()).toContain('认证');
      expect(result.toLowerCase()).toContain('系统');

      console.log('🧠 架构设计分析:', result.substring(0, 400) + '...');
    }, 45000);

    test('应该能够进行性能优化分析', async () => {
      const prompt = '分析一个简单 React 应用的性能优化方案';

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: true,
        useDeepSeek: true
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      expect(result.toLowerCase()).toContain('性能');
      expect(result.toLowerCase()).toContain('react');

      console.log('⚡ 性能优化建议:', result.substring(0, 400) + '...');
    }, 45000);
  });

  describe('错误处理测试', () => {
    test('应该能够处理无效输入', async () => {
      const invalidPrompts = ['', '   ', '\n\n\n'];

      for (const prompt of invalidPrompts) {
        const result = await quickClaudeCodeExecution(prompt, {
          thinking: false,
          useDeepSeek: true
        });

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    }, 20000);

    test('应该能够处理正常输入', async () => {
      const prompt = '创建一个简单的 Hello World 函数';

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: false,
        useDeepSeek: true
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      console.log('📝 正常输入测试结果:', result.substring(0, 200) + '...');
    }, 15000);
  });

  describe('性能基准测试', () => {
    test('DeepSeek 响应时间基准', async () => {
      const prompt = '创建一个简单的 JavaScript 函数';
      const startTime = Date.now();

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: false,
        useDeepSeek: true
      });

      const responseTime = Date.now() - startTime;
      console.log(`⚡ DeepSeek 响应时间: ${responseTime}ms`);

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(30000); // 30秒内响应
    }, 35000);

    test('DeepSeek 思维模式响应时间基准', async () => {
      const prompt = '分析一个简单的算法复杂度';
      const startTime = Date.now();

      const result = await quickClaudeCodeExecution(prompt, {
        thinking: true,
        useDeepSeek: true
      });

      const responseTime = Date.now() - startTime;
      console.log(`🧠 DeepSeek 思维模式响应时间: ${responseTime}ms`);

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(45000); // 45秒内响应
    }, 50000);
  });
});
