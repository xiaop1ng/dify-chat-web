import {
  AppstoreAddOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  DislikeOutlined,
  EditOutlined,
  EllipsisOutlined,
  FileSearchOutlined,
  HeartOutlined,
  LikeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ProductOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  ShareAltOutlined,
  SmileOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
} from '@ant-design/x';
import { Avatar, Button, Flex, type GetProp, Space, Spin, message, Select, Modal } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import DifyConfig, { DifyApp } from './components/DifyConfig';
import { DifyService, DifyStreamResponse } from './services/dify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { RcFile } from 'antd/es/upload/interface';
import * as echarts from 'echarts';

const DEFAULT_CONVERSATIONS_ITEMS = [
  {
    key: 'default-0',
    label: 'What is Ant Design X?',
    group: 'Today',
  },
  {
    key: 'default-1',
    label: 'How to quickly install and import components?',
    group: 'Today',
  },
  {
    key: 'default-2',
    label: 'New AGI Hybrid Interface',
    group: 'Yesterday',
  },
];

const HOT_TOPICS = {
  key: '1',
  label: 'Hot Topics',
  children: [
    {
      key: '1-1',
      description: 'What has Ant Design X upgraded?',
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: 'New AGI Hybrid Interface',
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: 'What components are in Ant Design X?',
      icon: <span style={{ color: '#ff8f1f', fontWeight: 700 }}>3</span>,
    },
    {
      key: '1-4',
      description: 'Come and discover the new design paradigm of the AI era.',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>4</span>,
    },
    {
      key: '1-5',
      description: 'How to quickly install and import components?',
      icon: <span style={{ color: '#00000040', fontWeight: 700 }}>5</span>,
    },
  ],
};

const DESIGN_GUIDE = {
  key: '2',
  label: 'Design Guide',
  children: [
    {
      key: '2-1',
      icon: <HeartOutlined />,
      label: 'Intention',
      description: 'AI understands user needs and provides solutions.',
    },
    {
      key: '2-2',
      icon: <SmileOutlined />,
      label: 'Role',
      description: "AI's public persona and image",
    },
    {
      key: '2-3',
      icon: <CommentOutlined />,
      label: 'Chat',
      description: 'How AI Can Express Itself in a Way Users Understand',
    },
    {
      key: '2-4',
      icon: <PaperClipOutlined />,
      label: 'Interface',
      description: 'AI balances "chat" & "do" behaviors.',
    },
  ],
};

const SENDER_PROMPTS: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    description: 'Upgrades',
    icon: <ScheduleOutlined />,
  },
  {
    key: '2',
    description: 'Components',
    icon: <ProductOutlined />,
  },
  {
    key: '3',
    description: 'RICH Guide',
    icon: <FileSearchOutlined />,
  },
  {
    key: '4',
    description: 'Installation Introduction',
    icon: <AppstoreAddOutlined />,
  },
];

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      min-width: 1000px;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
    `,
    // sider 样式
    sider: css`
      background: ${token.colorBgLayout}80;
      width: 280px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      box-sizing: border-box;
    `,
    logo: css`
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 0 24px;
      box-sizing: border-box;
      gap: 8px;
      margin: 24px 0;

      span {
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    addBtn: css`
      background: #1677ff0f;
      border: 1px solid #1677ff34;
      height: 40px;
    `,
    conversations: css`
      flex: 1;
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;

      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    siderFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    // chat list 样式
    chat: css`
      height: 100%;
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding: ${token.paddingLG}px;
      gap: 16px;
    `,
    chatPrompt: css`
      .ant-prompts-label {
        color: #000000e0 !important;
      }
      .ant-prompts-desc {
        color: #000000a6 !important;
        width: 100%;
      }
      .ant-prompts-icon {
        color: #000000a6 !important;
      }
    `,
    chatList: css`
      flex: 1;
      overflow: auto;
      padding-right: 10px;
    `,
    loadingMessage: css`
      background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
    placeholder: css`
      padding-top: 32px;
    `,
    // sender 样式
    sender: css`
      box-shadow: ${token.boxShadow};
      color: ${token.colorText};
    `,
    speechButton: css`
      font-size: 18px;
      color: ${token.colorText} !important;
    `,
    senderPrompt: css`
      color: ${token.colorText};
    `,
    configButton: css`
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1000;
    `,
    appSelector: css`
      margin-bottom: 16px;
    `,
    markdown: css`
      pre {
        background-color: #f6f8fa;
        border-radius: 6px;
        padding: 16px;
        overflow: auto;
      }
      code {
        background-color: #f6f8fa;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: monospace;
      }
      blockquote {
        border-left: 4px solid #dfe2e5;
        padding-left: 16px;
        margin-left: 0;
        color: #6a737d;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
      }
      th, td {
        border: 1px solid #dfe2e5;
        padding: 8px;
      }
      th {
        background-color: #f6f8fa;
      }
    `,
    reference: css`
      margin-top: 8px;
      padding: 8px;
      background: ${token.colorBgLayout};
      border-radius: 4px;
      font-size: 12px;
      color: ${token.colorTextSecondary};
    `,
    referenceTitle: css`
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
      cursor: pointer;
      &:hover {
        color: ${token.colorPrimary};
      }
    `,
    referenceContent: css`
      max-height: 200px;
      overflow-y: auto;
      padding: 8px;
      background: ${token.colorBgContainer};
      border-radius: 4px;
      margin-top: 8px;
    `,
    chart: css`
      width: 100%;
      height: 400px;
      margin: 16px 0;
    `,
  };
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    retriever_resources?: Array<{
      dataset_name: string;
      document_name: string;
      content: string;
    }>;
  };
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

const Independent: React.FC = () => {
  const { styles } = useStyle();
  const abortController = useRef<AbortController>(null);

  // ==================== State ====================
  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS_ITEMS);
  const [curConversation, setCurConversation] = useState(DEFAULT_CONVERSATIONS_ITEMS[0].key);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<GetProp<typeof Attachments, 'items'>>([]);
  const [inputValue, setInputValue] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [difyApps, setDifyApps] = useState<DifyApp[]>(() => {
    const savedApps = localStorage.getItem('difyApps');
    return savedApps ? JSON.parse(savedApps) : [];
  });
  const [currentApp, setCurrentApp] = useState<DifyApp | null>(() => {
    const savedCurrentApp = localStorage.getItem('currentApp');
    return savedCurrentApp ? JSON.parse(savedCurrentApp) : null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReference, setShowReference] = useState<{
    title: string;
    content: string;
  } | null>(null);

  // 保存配置到 localStorage
  const saveConfig = (apps: DifyApp[], currentApp: DifyApp | null) => {
    localStorage.setItem('difyApps', JSON.stringify(apps));
    localStorage.setItem('currentApp', JSON.stringify(currentApp));
  };

  // 更新应用列表时同时保存配置
  const handleAppsChange = (apps: DifyApp[]) => {
    setDifyApps(apps);
    saveConfig(apps, currentApp);
  };

  // 更新当前应用时同时保存配置
  const handleCurrentAppChange = (app: DifyApp | null) => {
    setCurrentApp(app);
    saveConfig(difyApps, app);
  };

  // ==================== Event ====================
  const onSubmit = async (val: string) => {
    if (!val) return;

    if (!currentApp) {
      message.error('请先选择 Dify 应用');
      return;
    }

    if (loading) {
      message.error('请求正在进行中，请等待完成');
      return;
    }

    setLoading(true);
    const difyService = new DifyService(currentApp.endpoint, currentApp.token);

    // 添加用户消息
    const userMessage = { role: 'user' as const, content: val };
    setMessages(prev => [...prev, userMessage]);

    try {
      // 添加一个空的助手消息，用于流式更新
      const assistantMessage = { role: 'assistant' as const, content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      // 处理文件上传
      const files = attachedFiles
        .map(file => file.originFileObj)
        .filter((file): file is RcFile => {
          if (!file) return false;
          return file instanceof File;
        });

      await difyService.streamChat(
        val,
        (content) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = content;
            }
            return newMessages;
          });
        },
        (error) => {
          message.error('请求失败：' + (error.message || '未知错误'));
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = '请求失败，请重试！';
            }
            return newMessages;
          });
          setLoading(false);
        },
        files,
        (parsed?: DifyStreamResponse) => {
          if (parsed?.event === 'message') {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant' && parsed.answer) {
                lastMessage.content = (lastMessage.content || '') + parsed.answer;
              }
              return newMessages;
            });
          } else if (parsed?.event === 'message_end' && parsed.metadata?.retriever_resources) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant') {
                lastMessage.metadata = parsed.metadata;
              }
              return newMessages;
            });
          }
          // 无论是 message_end 事件还是 blocking 模式的响应，都结束 loading 状态
          if (parsed?.event === 'message_end' || parsed?.answer) {
            setLoading(false);
            setAttachedFiles([]);
          }
        }
      );
    } catch (error) {
      message.error('请求失败：' + (error as Error).message);
      setLoading(false);
    }
  };

  // ==================== Nodes ====================
  const chatSider = (
    <div className={styles.sider}>
      {/* 🌟 Logo */}
      <div className={styles.logo}>
        <img
          src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span>Dify AI 助手</span>
      </div>

      {/* 🌟 Dify 应用选择器 */}
      <Select
        className={styles.appSelector}
        placeholder="选择 Dify 应用"
        value={currentApp?.id}
        onChange={(value) => {
          const app = difyApps.find(app => app.id === value);
          handleCurrentAppChange(app || null);
          setMessages([]);
        }}
        options={difyApps.map(app => ({
          label: app.name,
          value: app.id,
        }))}
        style={{ width: '100%' }}
      />

      {/* 🌟 添加会话 */}
      <Button
        onClick={() => {
          const now = dayjs().valueOf().toString();
          setConversations([
            {
              key: now,
              label: `新会话 ${conversations.length + 1}`,
              group: '今天',
            },
            ...conversations,
          ]);
          setCurConversation(now);
          setMessages([]);
        }}
        type="link"
        className={styles.addBtn}
        icon={<PlusOutlined />}
      >
        新建会话
      </Button>

      {/* 🌟 会话管理 */}
      <Conversations
        items={conversations}
        className={styles.conversations}
        activeKey={curConversation}
        onActiveChange={async (val) => {
          setCurConversation(val);
          setMessages(messageHistory?.[val] || []);
        }}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation) => ({
          items: [
            {
              label: '重命名',
              key: 'rename',
              icon: <EditOutlined />,
            },
            {
              label: '删除',
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => {
                const newList = conversations.filter((item) => item.key !== conversation.key);
                const newKey = newList?.[0]?.key;
                setConversations(newList);
                if (conversation.key === curConversation) {
                  setCurConversation(newKey);
                  setMessages(messageHistory?.[newKey] || []);
                }
              },
            },
          ],
        })}
      />

      <div className={styles.siderFooter}>
        <Avatar size={24} />
        <Button type="text" icon={<QuestionCircleOutlined />} />
      </div>
    </div>
  );

  const renderContent = (content: string) => {
    return (
      <div className={styles.markdown}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match?.[1] === 'echarts') {
                return <ChartComponent code={String(children)} />;
              }
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const chatList = (
    <div className={styles.chatList}>
      {messages.length > 0 ? (
        <Bubble.List
          items={messages.map((msg, index) => ({
            ...msg,
            content: msg.role === 'assistant' ? (
              <>
                {renderContent(msg.content)}
                {msg.metadata?.retriever_resources && msg.metadata.retriever_resources.length > 0 && (
                  <div className={styles.reference}>
                    {msg.metadata.retriever_resources.map((resource, index) => (
                      <div key={index} className={styles.referenceTitle} onClick={() => {
                        setShowReference({
                          title: resource.document_name,
                          content: resource.content
                        });
                      }}>
                        <FileTextOutlined />
                        {resource.document_name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : msg.content,
            classNames: {
              content: index === messages.length - 1 && loading ? styles.loadingMessage : '',
            },
            typing: index === messages.length - 1 && loading ? { step: 5, interval: 20, suffix: <>💗</> } : false,
            loading: index === messages.length - 1 && loading,
          }))}
          style={{ height: '100%' }}
          roles={{
            assistant: {
              placement: 'start',
              footer: (
                <div style={{ display: 'flex' }}>
                  <Button type="text" size="small" icon={<ReloadOutlined />} />
                  <Button type="text" size="small" icon={<CopyOutlined />} />
                  <Button type="text" size="small" icon={<LikeOutlined />} />
                  <Button type="text" size="small" icon={<DislikeOutlined />} />
                </div>
              ),
              loadingRender: () => <Spin size="small" />,
            },
            user: { placement: 'end' },
          }}
        />
      ) : (
        <Space direction="vertical" size={16} className={styles.placeholder}>
          <Welcome
            variant="borderless"
            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
            title="欢迎使用 Dify AI 助手"
            description="基于 Dify API 的智能对话助手，为您提供更好的智能体验~"
            extra={
              <Space>
                <Button icon={<ShareAltOutlined />} />
                <Button icon={<EllipsisOutlined />} />
              </Space>
            }
          />
        </Space>
      )}
    </div>
  );

  const senderHeader = (
    <Sender.Header
      title="上传文件"
      open={attachmentsOpen}
      onOpenChange={setAttachmentsOpen}
      styles={{ content: { padding: 0 } }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={(info) => setAttachedFiles(info.fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? { title: '拖拽文件到这里' }
            : {
                icon: <CloudUploadOutlined />,
                title: '上传文件',
                description: '点击或拖拽文件到此处上传',
              }
        }
      />
    </Sender.Header>
  );

  const chatSender = (
    <>
      <Sender
        value={inputValue}
        header={senderHeader}
        onSubmit={() => {
          onSubmit(inputValue);
          setInputValue('');
        }}
        onChange={setInputValue}
        onCancel={() => {
          setLoading(false);
        }}
        prefix={
          <Button
            type="text"
            icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
            onClick={() => setAttachmentsOpen(!attachmentsOpen)}
          />
        }
        loading={loading}
        className={styles.sender}
        allowSpeech
        actions={(_, info) => {
          const { SendButton, LoadingButton, SpeechButton } = info.components;
          return (
            <Flex gap={4}>
              <SpeechButton className={styles.speechButton} />
              {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
            </Flex>
          );
        }}
        placeholder="输入消息或使用技能"
      />
    </>
  );

  useEffect(() => {
    if (messages.length > 0) {
      setMessageHistory(prev => ({
        ...prev,
        [curConversation]: messages,
      }));
    }
  }, [messages, curConversation]);

  const ChartComponent: React.FC<{ code: string }> = ({ code }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
      if (chartRef.current) {
        try {
          const chartOption = JSON.parse(code);
          if (!chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
          }
          chartInstance.current.setOption(chartOption);
        } catch (error) {
          console.error('Error parsing ECharts option:', error);
        }
      }

      return () => {
        if (chartInstance.current) {
          chartInstance.current.dispose();
          chartInstance.current = null;
        }
      };
    }, [code]);

    return <div ref={chartRef} className={styles.chart} />;
  };

  // ==================== Render =================
  return (
    <div className={styles.layout}>
      {chatSider}

      <div className={styles.chat}>
        {chatList}
        {chatSender}
      </div>

      <Button
        className={styles.configButton}
        type="primary"
        icon={<SettingOutlined />}
        onClick={() => setShowConfig(!showConfig)}
      >
        {showConfig ? '关闭配置' : '配置'}
      </Button>

      {showConfig && (
        <DifyConfig
          apps={difyApps}
          onAppsChange={handleAppsChange}
          onClose={() => setShowConfig(false)}
        />
      )}

      <Modal
        title={showReference?.title}
        open={!!showReference}
        onCancel={() => setShowReference(null)}
        footer={null}
        width={800}
      >
        <div className={styles.markdown}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {showReference?.content || ''}
          </ReactMarkdown>
        </div>
      </Modal>
    </div>
  );
};

export default Independent; 