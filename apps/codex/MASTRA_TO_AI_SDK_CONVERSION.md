# Mastra Stream 转 AI SDK Stream 转换方案

## 🎯 核心问题解决

### 问题描述
客户端使用AI SDK的`useChat`钩子，期望接收AI SDK标准的数据流格式，但Mastra返回的是不同的流式格式，导致：
```
Error: Failed to parse stream string. Invalid code data.
```

### 解决方案
创建转换函数`convertMastraStreamToAISDK`，将Mastra的`textStream`转换为AI SDK兼容的数据流格式。

## 🔧 转换实现

### AI SDK 数据流协议格式
AI SDK使用特定的数据流协议：
```
0:""                    // 初始空字符串
0:"Hello"               // 文本块，使用 0: 前缀
0:" world"              // 继续的文本块
d:{"finishReason":"stop","usage":{...}}  // 完成标记，使用 d: 前缀
```

### 转换函数实现
```typescript
function convertMastraStreamToAISDK(mastraStream: any) {
  const encoder = new TextEncoder();
  
  const readable = new ReadableStream({
    async start(controller) {
      try {
        // AI SDK数据流协议：发送初始空字符串
        const startData = `0:""\n`;
        controller.enqueue(encoder.encode(startData));

        // 处理Mastra的textStream
        for await (const chunk of mastraStream.textStream) {
          // 转义特殊字符
          const escapedChunk = chunk
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');
          
          // AI SDK格式：文本块使用 0: 前缀
          const chunkData = `0:"${escapedChunk}"\n`;
          controller.enqueue(encoder.encode(chunkData));
        }

        // 发送完成标记
        const finishData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
        controller.enqueue(encoder.encode(finishData));
        
        controller.close();
      } catch (error) {
        console.error('Stream conversion error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorData = `3:${JSON.stringify({ error: errorMessage })}\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

## 🔄 集成方式

### Chat模式集成
```typescript
if (isStreaming) {
  // 使用Mastra原生流式
  const stream = await chatAgent.stream(mastraMessages, {
    memory: {
      resource: userId || 'anonymous',
      thread: `chat_${Date.now()}`,
    },
    maxSteps: 3,
    onStepFinish: ({ text, toolCalls, toolResults }) => {
      console.log('Step completed:', { text, toolCalls, toolResults });
    },
  });

  // 转换为AI SDK格式
  return convertMastraStreamToAISDK(stream);
}
```

### Builder模式集成
```typescript
if (isStreaming) {
  // 使用Mastra原生流式，支持更多步骤
  const stream = await builderAgent.stream(mastraMessages, {
    memory: {
      resource: userId || 'anonymous',
      thread: `builder_${Date.now()}`,
    },
    maxSteps: 5, // 更多步骤用于复杂代码生成
    onStepFinish: ({ text, toolCalls, toolResults }) => {
      console.log('Builder step completed:', { text, toolCalls, toolResults });
    },
  });

  // 转换为AI SDK格式
  return convertMastraStreamToAISDK(stream);
}
```

## 🎯 优势

### 1. 保持Mastra功能
- ✅ 使用Mastra原生的`agent.stream()`
- ✅ 支持多步推理（maxSteps）
- ✅ 支持工具调用和内存管理
- ✅ 支持步骤完成回调

### 2. AI SDK兼容性
- ✅ 完全兼容AI SDK的`useChat`钩子
- ✅ 正确的数据流协议格式
- ✅ 支持错误处理和完成标记

### 3. 最佳实践
- ✅ 正确的字符转义处理
- ✅ 适当的HTTP头设置
- ✅ 错误处理和资源清理

## 🧪 测试验证

### 客户端测试
1. 使用AI SDK的`useChat`钩子
2. 发送流式请求到`/apix/chat`
3. 验证流式数据正确解析
4. 确认无"Failed to parse stream string"错误

### 服务端测试
1. 验证Mastra agent正常工作
2. 确认流式转换正确执行
3. 检查内存和工具调用功能

## 📋 总结

通过这个转换方案，我们成功地：
- 🔧 解决了AI SDK兼容性问题
- 🚀 保持了Mastra的所有高级功能
- 📈 提供了真正的实时流式响应
- 🛡️ 确保了错误处理和稳定性

这个方案让codex项目既能享受Mastra的强大功能，又能与现有的AI SDK客户端完美兼容。
