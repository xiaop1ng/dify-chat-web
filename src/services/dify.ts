import axios from 'axios';
import type { RcFile } from 'antd/es/upload/interface';

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyResponse {
  answer: string;
  conversation_id: string;
  created_at: number;
  id: string;
  inputs: Record<string, any>;
  message_id: string;
  metadata: Record<string, any>;
}

export interface DifyStreamResponse {
  event: 'message' | 'error' | 'done' | 'message_end';
  answer?: string;
  conversation_id?: string;
  created_at?: number;
  id?: string;
  inputs?: Record<string, any>;
  message_id?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    code: string;
  };
}

export interface DifyRequest {
  inputs: Record<string, any>;
  query: string;
  response_mode: 'blocking' | 'streaming';
  conversation_id: string;
  user: string;
  files: string[];
}

interface StreamEvent {
  event: string;
  answer?: string;
  metadata?: {
    retriever_resources?: Array<{
      dataset_name: string;
      document_name: string;
      content: string;
    }>;
  };
}

export class DifyService {
  private baseURL: string;
  private token: string;
  private conversationId: string;

  constructor(endpoint: string, token: string) {
    this.baseURL = endpoint;
    this.token = token;
    this.conversationId = '';
  }

  setConversationId(id: string) {
    this.conversationId = id;
  }

  async chat(message: string, files?: RcFile[]): Promise<DifyResponse> {
    const requestData: DifyRequest = {
      inputs: {},
      query: message,
      response_mode: 'blocking',
      conversation_id: this.conversationId,
      user: 'user_' + Date.now(),
      files: [],
    };

    if (files && Array.isArray(files) && files.length > 0) {
      // 如果有文件，需要先上传文件获取文件ID
      const fileIds = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await axios.post(`${this.baseURL}/files/upload`, formData, {
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          return response.data.id;
        })
      );
      requestData.files = fileIds;
    }

    const response = await axios.post<DifyResponse>(`${this.baseURL}/chat-messages`, requestData, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    // 保存会话ID
    if (response.data.conversation_id) {
      this.conversationId = response.data.conversation_id;
    }

    return response.data;
  }

  async streamChat(
    message: string,
    onMessage: (content: string) => void,
    onError: (error: any) => void,
    files?: RcFile[],
    onComplete?: (parsed?: DifyStreamResponse) => void
  ) {
    const requestData: DifyRequest = {
      inputs: {},
      query: message,
      response_mode:  'streaming', // 'blocking' | 'streaming'
      conversation_id: this.conversationId,
      user: 'user_' + Date.now(),
      files: [],
    };

    if (files && Array.isArray(files) && files.length > 0) {
      // 如果有文件，需要先上传文件获取文件ID
      const fileIds = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await axios.post(`${this.baseURL}/files/upload`, formData, {
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          return response.data.id;
        })
      );
      requestData.files = fileIds;
    }

    try {
      const response = await fetch(`${this.baseURL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        // 处理 blocking 模式的响应
        const data = await response.json();
        if (data.answer) {
          // 直接调用 onMessage 一次，传入完整的 answer
          onMessage(data.answer);
          if (data.conversation_id) {
            this.conversationId = data.conversation_id;
          }
          // 调用 onComplete 时传入完整的响应数据
          onComplete?.({
            event: 'message_end',
            answer: data.answer,
            conversation_id: data.conversation_id,
            created_at: data.created_at,
            id: data.id,
            inputs: data.inputs,
            message_id: data.message_id,
            metadata: data.metadata
          });
        }
        return;
      }

      // 处理 streaming 模式的响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }
            try {
              const parsed = JSON.parse(data) as DifyStreamResponse;
              if (parsed.event === 'message' && parsed.answer) {
                // 处理回车符号，使用 Markdown 换行方式，保留空行
                const processedAnswer = parsed.answer
                  .replace(/\r\n/g, '\n')
                  .replace(/\r/g, '\n')
                  .replace(/\n/g, '\n\n'); // 使用两个换行符作为段落分隔
                // 累加消息内容，确保不会重复添加相同的内容
                if (!accumulatedContent.includes(processedAnswer)) {
                  accumulatedContent += processedAnswer;
                  onMessage(accumulatedContent);
                }
                // 保存会话ID
                if (parsed.conversation_id) {
                  this.conversationId = parsed.conversation_id;
                }
              } else if (parsed.event === 'error' && parsed.error) {
                onError(parsed.error);
              } else if (parsed.event === 'message_end') {
                onComplete?.(parsed);
                return;
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
              onError(e);
            }
          }
        }
      }
    } catch (error) {
      onError(error);
    }
  }
} 