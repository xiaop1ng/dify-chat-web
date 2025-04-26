import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

export interface DifyApp {
  id: string;
  name: string;
  token: string;
  endpoint: string;
}

interface DifyConfigProps {
  apps: DifyApp[];
  onAppsChange: (apps: DifyApp[]) => void;
  onClose: () => void;
}

const DifyConfig: React.FC<DifyConfigProps> = ({ apps, onAppsChange, onClose }) => {
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.validateFields().then((values) => {
      const newApp: DifyApp = {
        id: Date.now().toString(),
        name: values.name,
        token: values.token,
        endpoint: values.endpoint,
      };
      onAppsChange([...apps, newApp]);
      form.resetFields();
      message.success('应用添加成功');
    });
  };

  const handleDelete = (id: string) => {
    onAppsChange(apps.filter(app => app.id !== id));
    message.success('应用删除成功');
  };

  return (
    <Card title="Dify 应用配置">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {apps.map(app => (
          <Card key={app.id} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>应用名称：{app.name}</div>
              <div>API Token：{app.token}</div>
              <div>API Endpoint：{app.endpoint}</div>
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(app.id)}
              >
                删除
              </Button>
            </Space>
          </Card>
        ))}
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="请输入应用名称" />
          </Form.Item>
          <Form.Item
            name="token"
            label="API Token"
            rules={[{ required: true, message: '请输入 API Token' }]}
          >
            <Input.Password placeholder="请输入 API Token" />
          </Form.Item>
          <Form.Item
            name="endpoint"
            label="API Endpoint"
            rules={[{ required: true, message: '请输入 API Endpoint' }]}
          >
            <Input placeholder="请输入 API Endpoint" />
          </Form.Item>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加应用
          </Button>
        </Form>
      </Space>
    </Card>
  );
};

export default DifyConfig; 