import {v4 as uuidv4} from "uuid"
import {Messages, StreamingOptions, streamTextFn} from "../action"
import {CONTINUE_PROMPT, ToolInfo} from "../prompt"
import {deductUserTokens, estimateTokens} from "@/utils/tokens"
import SwitchableStream from "../switchable-stream"
import {tool} from "ai";
import {jsonSchemaToZodSchema} from "@/app/api/chat/utils/json2zod";


const MAX_RESPONSE_SEGMENTS = 2;

export async function handleChatMode(
    messages: Messages,
    model: string,
    userId: string | null,
    tools?: ToolInfo[],
): Promise<Response> {
    try {
        const stream = new SwitchableStream()
        let toolList = {};
        if (tools && tools.length > 0) {
            toolList = tools.reduce((obj, {name, ...args}) => {
                obj[name] = tool({
                    id: args.id,
                    description: args.description,
                    parameters: jsonSchemaToZodSchema(args.parameters),
                    execute: async (input: any) => {
                        return input;
                    }
                });
                return obj;
            }, {});
        }
        const options: StreamingOptions = {
            tools: toolList,
            toolCallStreaming: true,
            onError: (error: any) => {
                console.error('Streaming error:', error);
                const uuid = uuidv4()
                const msg = error?.errors?.[0]?.responseBody;
                // 确保流被正确关闭
                stream.close();
                throw new Error(`${msg || JSON.stringify(error)} logid ${uuid}`)
            },
            onFinish: async (response) => {
                try {
                    const {text: content, finishReason} = response

                    if (finishReason !== "length") {
                        const tokens = estimateTokens(content)
                        if (userId) {
                            await deductUserTokens(userId, tokens)
                        }
                        stream.close();
                        return;
                    }

                    if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
                        stream.close();
                        throw Error("Cannot continue message: Maximum segments reached")
                    }

                    messages.push({id: uuidv4(), role: "assistant", content})
                    messages.push({id: uuidv4(), role: "user", content: CONTINUE_PROMPT})
                } catch (error) {
                    console.error('onFinish error:', error);
                    stream.close();
                    throw error;
                }
            },

        }

        const result = await streamTextFn(messages, options, model)
        return result.toDataStreamResponse({
            sendReasoning: true,
        })
    } catch (error) {
        console.error('handleChatMode error:', error);
        throw error;
    }
}
