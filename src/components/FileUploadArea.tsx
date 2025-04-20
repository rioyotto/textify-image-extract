
import React from 'react';
import { FileImage, FileText, Upload } from 'lucide-react';

interface FileUploadAreaProps {
  fileName: string;
  error: string;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  fileType: "image" | "pdf" | null;
}

export const FileUploadArea = ({
  fileName,
  error,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
  fileType
}: FileUploadAreaProps) => {
  return (
    <div 
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300
        ${fileName && !error ? "border-green-400 bg-green-50" : 
          error ? "border-red-400 bg-red-50" : 
          isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : 
          "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
    >
      {error ? (
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-red-100 p-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-red-700">{error}</p>
          <p className="text-sm text-gray-500 mt-1">Click to try a different file</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center">
          {fileType === "image" ? 
            <FileImage size={48} className="text-green-500 mb-3" /> : 
            <FileText size={48} className="text-green-500 mb-3" />
          }
          <p className="text-lg font-medium text-gray-900">{fileName}</p>
          <p className="text-sm text-gray-500 mt-1">Click to change file</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload size={48} className="text-gray-400 mb-3" />
          <p className="text-lg font-medium text-gray-900">Click to upload a file</p>
          <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
          <p className="text-xs text-gray-400 mt-2">Supports images (JPG, PNG) and PDF files</p>
        </div>
      )}
    </div>
  );
};
