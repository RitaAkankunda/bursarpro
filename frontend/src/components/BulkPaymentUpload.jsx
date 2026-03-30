import React, { useState } from 'react';
import { Card, Button, Form, Alert, Table, Tag, Spin, Row, Col, Upload, Select } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import './BulkPayment.css';

const BulkPaymentUpload = () => {
  const [file, setFile] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch terms on component mount
  React.useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await api.get('/terms/');
        setTerms(response.data.results || response.data);
      } catch (err) {
        console.error('Error fetching terms:', err);
      }
    };
    fetchTerms();
  }, []);

  const handleFileSelect = (file) => {
    // Validate file type
    const validFormats = ['xlsx', 'xls'];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (!validFormats.includes(fileExtension)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return false;
    }

    setFile(file);
    setError(null);
    return false; // Prevent auto-upload
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!selectedTerm) {
      setError('Please select a term');
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('term_id', selectedTerm);

      const response = await api.post('/bulk-payments/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      setFile(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = `Student ID	Amount	Receipt Number	Payment Method
STU001	5000	RCP001	CASH
STU002	5000	RCP002	BANK_TRANSFER
STU003	5000	RCP003	MOBILE_MONEY`;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(templateData)
    );
    element.setAttribute('download', 'bulk_payment_template.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bulk-payment-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Upload Bulk Payments" bordered={false}>
            {error && <Alert message="Error" description={error} type="error" showIcon closable />}

            <Form layout="vertical">
              {/* Term Selection */}
              <Form.Item label="Select Term" required>
                <Select
                  placeholder="Choose a term"
                  value={selectedTerm}
                  onChange={setSelectedTerm}
                  options={terms.map((term) => ({
                    label: term.name,
                    value: term.id,
                  }))}
                />
              </Form.Item>

              {/* File Upload */}
              <Form.Item label="Excel File" required>
                <Upload
                  maxCount={1}
                  beforeUpload={handleFileSelect}
                  fileList={file ? [{ uid: '-1', name: file.name, status: 'done' }] : []}
                  onRemove={() => setFile(null)}
                >
                  <Button icon={<UploadOutlined />}>
                    Select Excel File (.xlsx or .xls)
                  </Button>
                </Upload>
              </Form.Item>

              {/* File Info */}
              <div className="file-info">
                <p><strong>Supported Formats:</strong> .xlsx, .xls</p>
                <p><strong>Required Columns:</strong></p>
                <ul>
                  <li>Student ID</li>
                  <li>Amount</li>
                  <li>Receipt Number</li>
                  <li>Payment Method</li>
                </ul>
                <p><strong>Valid Payment Methods:</strong> CASH, BANK_TRANSFER, CHEQUE, MOBILE_MONEY</p>
              </div>

              {/* Actions */}
              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleUpload}
                  loading={loading}
                  disabled={!file || !selectedTerm}
                  block
                >
                  Upload & Process
                </Button>
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  onClick={downloadTemplate}
                  block
                  style={{ marginTop: '8px' }}
                >
                  Download Template
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Results Panel */}
        {uploadResult && (
          <Col xs={24} lg={12}>
            <Card title="Upload Results" bordered={false}>
              <div className="results-summary">
                <div className="result-stat">
                  <span className="stat-label">Total Rows</span>
                  <span className="stat-value">{uploadResult.total_rows}</span>
                </div>
                <div className="result-stat success">
                  <CheckCircleOutlined />
                  <span className="stat-label">Successful</span>
                  <span className="stat-value">{uploadResult.successful_payments}</span>
                </div>
                <div className="result-stat error">
                  <ExclamationCircleOutlined />
                  <span className="stat-label">Failed</span>
                  <span className="stat-value">{uploadResult.failed_payments}</span>
                </div>
                <div className="result-stat">
                  <span className="stat-label">Total Amount</span>
                  <span className="stat-value">KES {uploadResult.total_amount}</span>
                </div>
              </div>

              {/* Created Payments Table */}
              {uploadResult.created_payments && uploadResult.created_payments.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Created Payments</h4>
                  <Table
                    dataSource={uploadResult.created_payments}
                    columns={[
                      { title: 'Student', dataIndex: 'student_id', key: 'student_id' },
                      { title: 'Amount', dataIndex: 'amount', key: 'amount' },
                      { title: 'Receipt', dataIndex: 'receipt', key: 'receipt' },
                      {
                        title: 'Status',
                        dataIndex: 'payment_id',
                        key: 'status',
                        render: () => <Tag color="green">Success</Tag>,
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              )}

              {/* Validation Errors */}
              {uploadResult.validation_errors && uploadResult.validation_errors.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Errors</h4>
                  <Alert
                    type="warning"
                    message={`${uploadResult.validation_errors.length} validation error(s)`}
                    description={
                      <ul>
                        {uploadResult.validation_errors.slice(0, 5).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                        {uploadResult.validation_errors.length > 5 && (
                          <li>... and {uploadResult.validation_errors.length - 5} more</li>
                        )}
                      </ul>
                    }
                  />
                </div>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default BulkPaymentUpload;
