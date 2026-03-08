import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UploadFile.css';

export default function UploadFile({ onUploadSuccess, uploadUrl = 'http://localhost:1080/upload' }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [frequencyThreshold, setFrequencyThreshold] = useState('0.00');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop event
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            validateAndSetFile(file);
        }
    };

    // Handle file selection from input
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            validateAndSetFile(file);
        }
    };

    // Validate file type and set file
    const validateAndSetFile = (file) => {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            setSelectedFile(file);
            setUploadStatus('');
        } else {
            setUploadStatus('Please select a valid JSON file');
            setSelectedFile(null);
        }
    };

    // Open file browser
    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    // Upload file to server
    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Please select a file first');
            return;
        }

        // Check file size and show detailed info
        const fileSizeMB = selectedFile.size / (1024 * 1024);
        const fileSizeBytes = selectedFile.size;
        
        console.log(`File details:`, {
            name: selectedFile.name,
            size: fileSizeBytes,
            sizeMB: fileSizeMB.toFixed(2),
            type: selectedFile.type
        });

        if (fileSizeMB > 50) {
            setUploadStatus(`Large file detected: ${fileSizeMB.toFixed(1)}MB. Upload may take several minutes.`);
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadStatus(`Preparing to upload ${fileSizeMB.toFixed(1)}MB file...`);

        const formData = new FormData();
        formData.append('file', selectedFile);

        // Log FormData size (approximation)
        console.log('FormData created for file:', selectedFile.name, 'Size:', fileSizeBytes, 'bytes');

        const startTime = Date.now();
        
        try {
            
            const response = await axios.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 1800000, // 30 minutes timeout for very large files
                maxContentLength: 2048 * 1024 * 1024, // 2GB max
                maxBodyLength: 2048 * 1024 * 1024, // 2GB max
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    const uploadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
                    const totalMB = (progressEvent.total / (1024 * 1024)).toFixed(1);
                    
                    setUploadProgress(progress);
                    setUploadStatus(`Uploading... ${progress}% (${uploadedMB}/${totalMB} MB)`);
                    
                    console.log(`Upload progress: ${progress}%, ${progressEvent.loaded}/${progressEvent.total} bytes`);
                },
            });

            const endTime = Date.now();
            const uploadTimeSeconds = ((endTime - startTime) / 1000).toFixed(1);
            
            console.log('Upload completed:', {
                responseStatus: response.status,
                responseHeaders: response.headers,
                uploadTime: uploadTimeSeconds + 's',
                responseDataSize: JSON.stringify(response.data || {}).length
            });

            setUploadProgress(100);
            setUploadStatus(`Upload completed! (${uploadTimeSeconds}s, ${fileSizeMB.toFixed(1)}MB)`);
            
            // Extract filename without extension for navigation
            const filename = selectedFile.name.replace(/\.[^/.]+$/, "");
            
            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }
            
            // Navigate to /file/{filename} after successful upload
            navigate(`/file/${filename}?n=${frequencyThreshold}`);
        } catch (error) {
            const endTime = Date.now();
            const uploadTimeSeconds = ((endTime - startTime) / 1000).toFixed(1);
            
            console.error('Upload error after', uploadTimeSeconds + 's:', {
                error: error.message,
                code: error.code,
                response: error.response?.status,
                config: {
                    timeout: error.config?.timeout,
                    maxContentLength: error.config?.maxContentLength
                }
            });
            
            if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_ABORTED') {
                setUploadStatus(`Connection failed after ${uploadTimeSeconds}s. File may be too large for server.`);
            } else if (error.code === 'ECONNABORTED') {
                setUploadStatus(`Upload timeout after ${uploadTimeSeconds}s. Try splitting file or check server limits.`);
            } else if (error.response?.status === 413) {
                setUploadStatus(`File rejected: ${fileSizeMB.toFixed(1)}MB exceeds server limit.`);
            } else if (error.response?.status === 502 || error.response?.status === 504) {
                setUploadStatus(`Server timeout after ${uploadTimeSeconds}s processing ${fileSizeMB.toFixed(1)}MB file.`);
            } else if (error.response) {
                setUploadStatus(`Upload failed: ${error.response.status} - ${error.response.statusText} (${uploadTimeSeconds}s)`);
            } else {
                setUploadStatus(`Upload failed after ${uploadTimeSeconds}s. File: ${fileSizeMB.toFixed(1)}MB`);
            }
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Remove selected file
    const removeFile = () => {
        setSelectedFile(null);
        setUploadStatus('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <div className="process-tree-title">OCPTreeGen</div>
            <div className="upload-file-container">
                <div className="upload-file-header">
                    <h2>📁 Upload OCEL 2.0 event logs file</h2>
                    <p>Select or drag and drop your JSON file to upload</p>
                </div>

            <div 
                className={`upload-drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="file-input-hidden"
                />

                {!selectedFile ? (
                    <div className="upload-prompt">
                        <div className="upload-icon">📤</div>
                        <h3>Drop your JSON file here</h3>
                        <p>or <span className="browse-link">browse files</span></p>
                        <small>Only JSON files are supported</small>
                    </div>
                ) : (
                    <div className="file-preview">
                        <div className="file-info">
                            <div className="file-icon">📄</div>
                            <div className="file-details">
                                <h4>{selectedFile.name}</h4>
                                <p>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <button 
                                className="remove-file-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile();
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {uploadProgress > 0 && uploading && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {uploadStatus && (
                <div className={`upload-status ${uploadStatus.includes('success') ? 'success' : uploadStatus.includes('failed') || uploadStatus.includes('timeout') || uploadStatus.includes('rejected') ? 'error' : 'info'}`}>
                    {uploadStatus}
                </div>
            )}

            <div style={{ margin: '20px 0', textAlign: 'center' }}>
                <label style={{ marginRight: '10px', fontWeight: 'bold' }} title="Frequencies below this value will be removed">Noise Reduction Threshold:</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={frequencyThreshold}
                    onChange={(e) => setFrequencyThreshold(e.target.value)}
                    style={{ 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc',
                        width: '100px'
                    }}
                />
            </div>

            <div className="upload-actions">
                <button 
                    className="upload-btn"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                >
                    {uploading ? '⏳ Uploading...' : '🚀 Upload File'}
                </button>
                
                {selectedFile && (
                    <button 
                        className="clear-btn"
                        onClick={removeFile}
                    >
                        🗑️ Clear
                    </button>
                )}
            </div>
        </div>
        </div>
    );
}
