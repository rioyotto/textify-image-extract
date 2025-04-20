
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FileUploadArea } from "@/components/FileUploadArea";
import { TextOutput } from "@/components/TextOutput";
import { extractTextFromImage, extractTextFromPDF } from "@/utils/fileProcessing";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"image" | "pdf" | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    setText("");
    setError("");
    setFileName(file.name);
    setIsProcessing(true);

    try {
      if (file.type.includes("image")) {
        setFileType("image");
        const extractedText = await extractTextFromImage(file, setProgress, setProcessingMessage);
        setText(extractedText);
      } else if (file.type === "application/pdf") {
        setFileType("pdf");
        const extractedText = await extractTextFromPDF(file, setProgress, setProcessingMessage);
        setText(extractedText);
      } else {
        throw new Error("Unsupported file type. Please upload an image or PDF.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setFileName("");
      setFileType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      processFile(files[0]);
    }
  };

  const handleReset = () => {
    setText("");
    setFileName("");
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out';
    toast.textContent = 'Text copied to clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Textify</h1>
          <p className="text-lg text-gray-600">Extract text from images and PDFs with ease</p>
        </header>

        <Card className="p-6 shadow-lg bg-white rounded-xl transition-all duration-300 hover:shadow-xl">
          <div className="mb-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            <FileUploadArea
              fileName={fileName}
              error={error}
              isDragging={isDragging}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              fileType={fileType}
            />
          </div>

          {isProcessing ? (
            <div className="text-center py-12">
              <LoadingSpinner size={36} className="mb-4" />
              <p className="text-lg text-gray-700">{processingMessage || "Extracting text..."}</p>
              <p className="text-sm text-gray-500">This may take a moment depending on the file size</p>
              
              {progress > 0 && (
                <div className="mt-4 w-64 mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
                </div>
              )}
            </div>
          ) : text ? (
            <TextOutput
              text={text}
              onCopy={copyToClipboard}
              onReset={handleReset}
            />
          ) : null}
        </Card>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p className="font-bold">
            A simple tool to extract text from images and PDFs. No login required.
            powered by Riel Tech Indonesia - www.rieltech.id
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
