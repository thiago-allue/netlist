// src/pages/UploadPage.jsx

// Drag-and-drop uploader with inline validation feedback.


import { Upload, Button, Card, List, Typography, Space, Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useUploadNetlist } from '../hooks/useNetlists';
import StatusBadge from '../components/StatusBadge';
import { useState } from 'react';

const { Dragger } = Upload;
const { Text } = Typography;

export default function UploadPage() {
  const upload = useUploadNetlist();

  // Persist the most recent validation result so we can render feedback.
  const [result, setResult] = useState(null); // {status, violations}

  // Props consumed by AntD's <Upload.Dragger>
  const props = {
    name: 'file',
    accept: '.json',
    multiple: false,

    // Custom request lets us use React Query instead of the default Ajax upload.
    customRequest: ({ file, onSuccess, onError }) => {
      const form = new FormData();
      form.append('file', file);

      upload.mutate(form, {
        onSuccess: data => {

          // Save server response for UI rendering.
          setResult(data);
          onSuccess();
        },
        onError: err => {

          // Surface backend validation message (if any).
          setResult({ error: err.response?.data?.detail || 'Upload failed' });
          onError();
        },
      });
    },
  };

  return (
    <Card title="Upload Netlist" style={{ maxWidth: 600, margin: '2rem auto' }}>

      {/* Drag-and-drop zone */}
      <Dragger {...props} disabled={upload.isLoading} showUploadList={false}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag JSON file to this area
        </p>
        <p className="ant-upload-hint">
          The file is validated immediately after upload.
        </p>
      </Dragger>

      {/* Inline feedback panel */}
      <div style={{ marginTop: 24 }}>
        {upload.isLoading && <Alert message="Uploading…" type="info" />}
        {result?.error && <Alert message={result.error} type="error" showIcon />}

        {/* Result present and no error */}
        {result && !result.error && (
          <>
            <Space>
              <Text strong>Validation:</Text>
              <StatusBadge status={result.status} />
            </Space>

            {/* Detailed rule violations */}
            {result.violations?.length > 0 && (
              <List
                size="small"
                header={<Text type="danger">Violations ({result.violations.length})</Text>}
                bordered
                dataSource={result.violations}
                style={{ marginTop: 12 }}
                renderItem={v => (
                  <List.Item>
                    <Text code>{v.rule}</Text>&nbsp;– {v.message}
                    {v.location && <Text type="secondary"> ({v.location})</Text>}
                  </List.Item>
                )}
              />
            )}

            {/* Success banner */}
            {result.status === 'valid' && (
              <Alert
                style={{ marginTop: 12 }}
                type="success"
                message="Netlist passed all checks! 🎉"
                showIcon
              />
            )}
          </>
        )}
      </div>
    </Card>
  );
}
