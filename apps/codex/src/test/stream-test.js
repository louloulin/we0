/**
 * 流式响应测试脚本
 * 
 * 测试修复后的 Mastra vNext Agent Network 流式响应
 */

async function testStreamingAPI() {
  console.log('🧪 开始测试流式响应 API...');
  
  try {
    const response = await fetch('http://localhost:4111/api/apix/intelligent-coding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: '创建一个简单的 React 计数器组件'
          }
        ],
        model: 'deepseek-chat',
        stream: true
      })
    });

    console.log('📡 响应状态:', response.status);
    console.log('📡 响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 错误:', errorText);
      return;
    }

    if (!response.body) {
      console.error('❌ 没有响应体');
      return;
    }

    console.log('✅ 开始读取流式响应...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ 流式响应完成');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        
        // 显示接收到的数据块
        console.log('📦 接收数据块:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
      }
    } finally {
      reader.releaseLock();
    }
    
    console.log('📊 总接收内容长度:', accumulatedContent.length);
    console.log('📄 前500字符:', accumulatedContent.substring(0, 500));
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testStreamingAPI();
