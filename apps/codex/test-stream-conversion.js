// 测试Mastra Stream到AI SDK Stream的转换
// 这个脚本模拟转换过程并验证输出格式

// 模拟Mastra的textStream
async function* createMockMastraStream() {
  const chunks = ["Hello", " world", "!", " How", " are", " you", " today", "?"];
  for (const chunk of chunks) {
    yield chunk;
    // 模拟异步延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 转换函数（从api-routes.ts复制）
function convertMastraStreamToAISDK(mastraStream) {
  const encoder = new TextEncoder();
  
  const readable = new ReadableStream({
    async start(controller) {
      try {
        // AI SDK数据流协议：发送初始空字符串
        const startData = `0:""\n`;
        controller.enqueue(encoder.encode(startData));
        console.log('发送初始数据:', startData.trim());

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
          console.log('发送文本块:', chunkData.trim());
        }

        // 发送完成标记
        const finishData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
        controller.enqueue(encoder.encode(finishData));
        console.log('发送完成标记:', finishData.trim());
        
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

// 测试函数
async function testStreamConversion() {
  console.log('🧪 开始测试Mastra Stream到AI SDK Stream的转换...\n');

  // 创建模拟的Mastra stream
  const mockMastraStream = {
    textStream: createMockMastraStream()
  };

  // 执行转换
  const response = convertMastraStreamToAISDK(mockMastraStream);
  
  console.log('✅ 转换函数执行成功');
  console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
  
  // 读取流式数据
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  console.log('\n📡 流式数据输出:');
  console.log('==================');
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('读取流式数据时出错:', error);
  } finally {
    reader.releaseLock();
  }
  
  console.log('\n==================');
  console.log('✅ 测试完成！');
}

// 运行测试
testStreamConversion().catch(console.error);
