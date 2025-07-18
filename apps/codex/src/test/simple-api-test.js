/**
 * 简单的 API 测试脚本
 * 
 * 测试修复后的 Mastra API 路由
 */

async function testAPI() {
  console.log('🧪 开始测试 API 路由...');
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // 测试状态端点
    console.log('📡 测试状态端点...');
    const statusResponse = await fetch('http://localhost:4111/apix/intelligent-coding/status');
    
    console.log('状态响应:', statusResponse.status);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ 状态端点工作正常:', statusData);
    } else {
      console.log('❌ 状态端点失败:', statusResponse.status, statusResponse.statusText);
    }
    
    // 测试智能编程端点
    console.log('📡 测试智能编程端点...');
    const codingResponse = await fetch('http://localhost:4111/apix/intelligent-coding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: '创建一个简单的 React 计数器组件，包含增加和减少按钮'
          }
        ],
        model: 'deepseek-chat',
        stream: true
      })
    });
    
    console.log('编程响应:', codingResponse.status);
    
    if (codingResponse.ok) {
      console.log('✅ 智能编程端点可访问');
      
      // 读取流式响应
      const reader = codingResponse.body.getReader();
      const decoder = new TextDecoder();
      let chunks = 0;
      
      try {
        let fullContent = '';
        while (chunks < 20) { // 读取更多块来看完整流程
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // 显示有意义的块（包含工具调用信息）
          if (chunk.includes('🔧') || chunk.includes('✅') || chunk.includes('📊') || chunk.includes('```')) {
            console.log(`📦 重要事件 ${chunks + 1}:`, chunk.trim());
          }

          chunks++;
        }

        console.log('✅ 流式响应工作正常');
        console.log('📄 总内容长度:', fullContent.length);

        // 显示最终内容的摘要
        const lines = fullContent.split('\n').filter(line => line.trim());
        console.log('📋 内容摘要:');
        lines.slice(0, 10).forEach((line, i) => {
          console.log(`  ${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
        });

      } finally {
        reader.releaseLock();
      }
    } else {
      console.log('❌ 智能编程端点失败:', codingResponse.status, codingResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAPI();
