"use client";
import { useState } from "react";

export default function Hello() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setStatus("❌ No file selected");
      return;
    }

    // File size check (optional - adjust as needed)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setStatus("❌ File too large (max 100MB)");
      return;
    }

    try {
      setIsUploading(true);
      setStatus("⏳ Uploading to BNB Greenfield...");
      setUploadedUrl("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`✅ Upload successful!`);
        if (data.txHash) {
          setStatus(prev => `${prev}\n📝 Transaction Hash: ${data.txHash}`);
        }
        if (data.url) {
          setUploadedUrl(data.url);
        }
        
        // Reset file input
        setFile(null);
        if (e.target.reset) e.target.reset();
      } else {
        setStatus(`❌ Upload failed: ${data.error || "Unknown error"}`);
        if (data.details) {
          console.error("Error details:", data.details);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setStatus(`❌ Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload to BNB Greenfield</h1>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={isUploading}
          />
          
          {file && (
            <div className="mt-3 text-sm text-gray-600">
              <p>📄 Selected: {file.name}</p>
              <p>📊 Size: {formatFileSize(file.size)}</p>
              <p>📁 Type: {file.type || "unknown"}</p>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!file || isUploading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !file || isUploading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload to Greenfield"}
        </button>
      </form>
      
      {status && (
        <div className={`mt-6 p-4 rounded-lg ${
          status.includes("✅") ? "bg-green-50 text-green-800" :
          status.includes("❌") ? "bg-red-50 text-red-800" :
          "bg-blue-50 text-blue-800"
        }`}>
          <pre className="whitespace-pre-wrap font-mono text-sm">{status}</pre>
        </div>
      )}
      
      {uploadedUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">File URL:</p>
          <a 
            href={uploadedUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm break-all"
          >
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
}