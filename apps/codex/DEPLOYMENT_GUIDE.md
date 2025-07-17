# Workflow System Deployment Guide

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
# Required API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional (for RAG features)
OPENAI_API_KEY=your_openai_api_key_here

# Database (for workflow persistence)
DATABASE_URL=file:storage.db
# For production, use a proper database:
# DATABASE_URL=postgresql://user:password@host:port/database
# DATABASE_AUTH_TOKEN=your_auth_token  # For Turso/LibSQL cloud

# Server Configuration
PORT=4111
NODE_ENV=production
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm run dev
```

The server will start at `http://localhost:4111`

## 🔑 API Key Setup

### DeepSeek API Key (Required)
1. Visit [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. Create an account and generate an API key
3. Add to `.env` as `DEEPSEEK_API_KEY`

### Anthropic API Key (Required for Vision)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key
3. Add to `.env` as `ANTHROPIC_API_KEY`

### OpenAI API Key (Optional for RAG)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Generate an API key
3. Add to `.env` as `OPENAI_API_KEY`

## 📡 API Endpoints

### Workflow Execution

#### Builder Workflow (Code Generation)
```bash
POST http://localhost:4111/api/workflows/builderWorkflow/run
Content-Type: application/json

{
  "inputData": {
    "messages": [
      {
        "role": "user",
        "content": "Create a React component for a todo list"
      }
    ],
    "model": "deepseek-chat",
    "otherConfig": {
      "isBackEnd": false,
      "type": "other"
    }
  }
}
```

#### Chat Workflow (Conversational AI)
```bash
POST http://localhost:4111/api/workflows/chatWorkflow/run
Content-Type: application/json

{
  "inputData": {
    "messages": [
      {
        "role": "user",
        "content": "Explain machine learning in simple terms"
      }
    ],
    "model": "deepseek-chat"
  }
}
```

### Streaming Execution
```bash
POST http://localhost:4111/api/workflows/chatWorkflow/stream
Content-Type: application/json

{
  "inputData": {
    "messages": [
      {
        "role": "user",
        "content": "Tell me a story about AI"
      }
    ],
    "model": "deepseek-chat"
  }
}
```

### List Available Workflows
```bash
GET http://localhost:4111/api/workflows
```

## 🧪 Testing

### Run Structure Tests
```bash
NODE_ENV=development npx tsx test-workflow-structure.js
```

### Run API Tests (requires API keys)
```bash
node test-workflows.js
```

### Test Individual Workflows
```bash
NODE_ENV=development npx tsx test-workflow-execution.js
```

## 🏗️ Production Deployment

### 1. Environment Configuration
```bash
NODE_ENV=production
PORT=4111
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. Build for Production
```bash
npm run build
```

### 3. Start Production Server
```bash
npm start
```

### 4. Health Check
```bash
curl http://localhost:4111/api
# Should return: "Hello to the Mastra API!"
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "API key not configured" Error
- **Cause**: Missing or invalid API keys
- **Solution**: Check `.env` file and ensure all required keys are set
- **Test**: `echo $DEEPSEEK_API_KEY` should show your key

#### 2. "Cannot find package '@mastra/rag'" Error
- **Cause**: Missing dependencies
- **Solution**: Run `npm install @mastra/rag`

#### 3. Workflow Not Found (404)
- **Cause**: Workflow not registered or server not started
- **Solution**: Check `src/mastra/index.ts` for workflow registration

#### 4. Database Connection Issues
- **Cause**: Invalid DATABASE_URL or permissions
- **Solution**: Check database configuration and permissions

### Debug Mode
```bash
DEBUG=mastra:* npm run dev
```

### Logs Location
- Development: Console output
- Production: Check your process manager logs

## 📊 Monitoring

### Health Endpoints
- `GET /api` - Basic health check
- `GET /api/workflows` - List registered workflows

### Metrics to Monitor
- Response times for workflow execution
- Error rates by workflow type
- API key usage and limits
- Database connection status

## 🔒 Security

### API Key Security
- Never commit API keys to version control
- Use environment variables for all secrets
- Rotate API keys regularly
- Monitor API usage for anomalies

### Network Security
- Use HTTPS in production
- Implement rate limiting
- Add authentication if needed
- Monitor for unusual traffic patterns

## 🚀 Scaling

### Horizontal Scaling
- The system is stateless and can be scaled horizontally
- Use a load balancer to distribute requests
- Ensure shared database access for workflow persistence

### Performance Optimization
- Enable response caching for repeated requests
- Use connection pooling for database
- Monitor and optimize model selection logic
- Implement request queuing for high load

## 📞 Support

### Getting Help
1. Check this deployment guide
2. Review the workflow system report
3. Check server logs for error details
4. Test with the provided test scripts

### Common Commands
```bash
# Check server status
curl http://localhost:4111/api

# List workflows
curl http://localhost:4111/api/workflows

# Test with mock data
NODE_ENV=development npm run dev

# View logs
tail -f logs/server.log  # If using file logging
```

---

**Ready for Production**: ✅  
**Next Steps**: Configure API keys → Deploy → Monitor
