import { useState, useRef } from 'react';
import { useResumeUpload } from '../hooks/useResumeUpload';

export function ResumeUploader({ onUploadComplete }: { onUploadComplete?: (indexId: string) => void }) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadResumes, isUploading, uploadProgress, uploadedData } = useResumeUpload();

  const MAX_FILES = 20;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => {
      const combined = [...prev, ...files];
      return combined.slice(0, MAX_FILES);
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const result = await uploadResumes(selectedFiles);
    if (result && onUploadComplete) {
      onUploadComplete(result.vector_index_id);
    }
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center hover:border-neo-primary transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Upload Icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 mx-auto mb-4 text-base-content/40"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <h3 className="text-lg font-semibold mb-2">
          Upload de Currículos
        </h3>
        
        <p className="text-sm text-base-content/60 mb-4">
          Arraste ou clique para selecionar (até 20 currículos por vez, limite total: 50)
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-outline"
        >
          Selecionar Arquivos
        </button>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Arquivos selecionados ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                {/* File Icon */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-neo-primary"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">{file.name}</span>
                <span className="text-xs badge badge-ghost">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => removeFile(index)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <p className="text-sm text-base-content/60">Enviando currículos...</p>
          <progress 
            className="progress progress-primary w-full" 
            value={uploadProgress} 
            max="100"
          />
          <p className="text-xs text-base-content/40 text-right">{uploadProgress}%</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || isUploading}
        className="btn btn-primary w-full"
      >
        {isUploading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Enviando...
          </>
        ) : (
          `Enviar ${selectedFiles.length} currículo(s)`
        )}
      </button>

      {/* Success Alert */}
      {uploadedData && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Upload concluído!</h3>
            <div className="text-sm">
              {uploadedData.indexed_files} currículos indexados com sucesso
              <div className="text-xs opacity-70 mt-1">
                ID do índice: {uploadedData.vector_index_id}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}