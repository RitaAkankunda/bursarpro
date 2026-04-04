import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle2, Download, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BulkImportModal = ({ isOpen, onClose, type = 'students', onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        toast.success('File selected: ' + droppedFile.name);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        toast.success('File selected: ' + selectedFile.name);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const downloadTemplate = () => {
    const templates = {
      students: 'Name,Parent Phone,Class Level\nJohn Doe,+256700123456,Primary 1\nJane Smith,+256700123457,Primary 2',
      fees: 'Term,Class Level,Amount\nTerm 1 2026,Primary 1,500000\nTerm 1 2026,Primary 2,550000',
      'fee-structures': 'Term,Class Level,Amount\nTerm 1 2026,Primary 1,500000\nTerm 1 2026,Primary 2,550000',
      payments: 'Receipt,Student Name,Amount,Payment Date,Method\nREC-001,John Doe,500000,2026-04-01,CASH\nREC-002,Jane Smith,550000,2026-04-02,MOBILE_MONEY'
    };

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(templates[type])}`);
    element.setAttribute('download', `${type}-template.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      let endpoint = '';
      if (type === 'students') endpoint = '/students/bulk-import/';
      else if (type === 'fees' || type === 'fee-structures') endpoint = '/fee-structures/bulk-import/';
      else if (type === 'payments') endpoint = '/payments/bulk-import/';

      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResults(res.data);
      toast.success(`Successfully imported ${res.data.success_count} ${type}`);
      onSuccess?.();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || `Failed to import ${type}`;
      toast.error(errorMsg);
      setResults({ error: errorMsg, success_count: 0, errors: err.response?.data?.errors || [] });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Upload size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                <p className="text-xs text-blue-50 opacity-80 mt-1">Upload a CSV file to import multiple records</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {!results ? (
              <>
                {/* Template Download */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900">CSV Format Required</p>
                    <p className="text-xs text-blue-700 mt-1">Download a template to see the expected format</p>
                    <button
                      onClick={downloadTemplate}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 underline"
                    >
                      Download Template →
                    </button>
                  </div>
                </div>

                {/* File Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative p-8 border-2 border-dashed rounded-2xl transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-gray-100 rounded-xl w-fit mx-auto">
                      <Upload size={24} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {file ? `Selected: ${file.name}` : 'Drag and drop your CSV file here'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">or click to browse</p>
                    </div>
                  </div>
                </div>

                {/* Preview Stats */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 rounded-xl"
                  >
                    <p className="text-sm font-bold text-gray-700">
                      📄 File: <span className="text-gray-600">{file.name}</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Size: {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </motion.div>
                )}

                {/* Notes */}
                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                  <p className="font-bold text-gray-700">📋 Requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>File must be in CSV format</li>
                    <li>First row should contain column headers</li>
                    <li>Check template for required columns</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Import
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Results */}
                <div className={`p-6 rounded-2xl ${results.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-start gap-3">
                    {results.error ? (
                      <AlertCircle size={24} className="text-red-600 mt-1 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 size={24} className="text-green-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${results.error ? 'text-red-900' : 'text-green-900'}`}>
                        {results.error ? 'Import Failed' : 'Import Successful!'}
                      </p>
                      <p className={`text-sm mt-2 ${results.error ? 'text-red-700' : 'text-green-700'}`}>
                        {results.error || `Successfully imported ${results.success_count} ${type}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {results.errors && results.errors.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-bold text-red-900">Errors:</p>
                    {results.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-700">
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setResults(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors"
                  >
                    Import Another
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkImportModal;
