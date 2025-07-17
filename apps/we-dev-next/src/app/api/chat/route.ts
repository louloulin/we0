import {promptExtra, ToolInfo} from "./prompt";
import {Messages} from "./action"
import {handleBuilderMode} from "./handlers/builderHandler"
import {handleChatMode} from "./handlers/chatHandler"
import { modelConfig } from "../model/config";

enum ChatMode {
    Chat = "chat",
    Builder = "builder",
}



interface ChatRequest {
    messages: Messages;
    model: string;
    mode: ChatMode;
    otherConfig: promptExtra
    tools?: ToolInfo[]
}

export async function POST(request: Request) {
    try {
        const {
            messages,
            model,
            mode = ChatMode.Builder,
            otherConfig,
            tools,
        } = (await request.json()) as ChatRequest;
        const userId = request.headers.get("userId");

        const result =
            mode === ChatMode.Chat
                ? await handleChatMode(messages, model, userId, tools)
                : await handleBuilderMode(messages, model, userId, otherConfig, tools)

        console.log('API response created successfully');
        return result
    } catch (error) {
        console.error('API route error:', error);

        // 处理流式响应错误
        if (error instanceof Error) {
            if (error.message?.includes("API key")) {
                return new Response("Invalid or missing API key", {status: 401});
            }
            if (error.message?.includes("pipe response")) {
                return new Response("Stream processing error", {status: 500});
            }
            if (error.message?.includes("Maximum segments reached")) {
                return new Response("Response too long", {status: 413});
            }
        }

        return new Response(
            JSON.stringify({
                error: "Internal server error",
                message: error instanceof Error ? error.message : String(error)
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

