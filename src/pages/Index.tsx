import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { FileImage, FileText, Upload, Copy, RefreshCcw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

// Set PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const { toast } = useToast();

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

    if (file.type.includes("image")) {
      setFileType("image");
      await extractTextFromImage(file);
    } else if (file.type === "application/pdf") {
      setFileType("pdf");
      await extractTextFromPDF(file);
    } else {
      setIsProcessing(false);
      setError("Unsupported file type. Please upload an image or PDF.");
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

  const extractTextFromImage = async (file: File) => {
    try {
      setProcessingMessage("Processing image...");

      const worker = await createWorker();

      let progressInterval = setInterval(() => {
        setProgress(prev => {
          return prev < 90 ? prev + 5 : prev;
        });
      }, 300);

      const { data } = await worker.recognize(file);

      clearInterval(progressInterval);
      setProgress(100);
      if (data.text.trim() === '') {
        setError("No text could be extracted from this image. Try a clearer image.");
      } else {
        setText(data.text);
      }
      await worker.terminate();
    } catch (error) {
      console.error("Error extracting text from image:", error);
      setError("Failed to process image. Please try another image file.");
      setFileName("");
      setFileType(null);
    } finally {
      setProgress(0);
      setProcessingMessage("");
      setIsProcessing(false);
    }
  };

  const extractTextFromPDF = async (file: File) => {
    try {
      setProcessingMessage("Loading PDF...");
      console.log("Starting PDF extraction");
      
      const arrayBuffer = await file.arrayBuffer();
      console.log("File converted to ArrayBuffer, size:", arrayBuffer.byteLength);
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      console.log("PDF loaded, pages:", pdf.numPages);
      
      let fullText = "";
      const totalPages = pdf.numPages;
      setProcessingMessage(`Extracting text from ${totalPages} page${totalPages > 1 ? 's' : ''}...`);
      
      for (let i = 1; i <= totalPages; i++) {
        setProgress(Math.round((i - 1) / totalPages * 100));
        setProcessingMessage(`Processing page ${i} of ${totalPages}`);
        
        const page = await pdf.getPage(i);
        console.log(`Processing page ${i}`);
        
        const textContent = await page.getTextContent();
        console.log(`Text content retrieved for page ${i}, items:`, textContent.items.length);
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        
        fullText += pageText + "\n\n";
        
        setProgress(Math.round(i / totalPages * 100));
      }
      
      console.log("Text extraction complete, final text length:", fullText.length);
      
      if (fullText.trim() === '') {
        console.log("No text found in PDF");
        setError("No text could be extracted from this PDF. The document may be scanned images or protected.");
        
        toast({
          title: "Scanned PDF detected",
          description: "This appears to be a scanned PDF. Trying OCR to extract text...",
        });
        
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await firstPage.render({
          canvasContext: context!,
          viewport: viewport
        }).promise;
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const imageFile = new File([blob], "pdf-page.png", { type: "image/png" });
            await extractTextFromImage(imageFile);
          }
        }, 'image/png');
      } else {
        setText(fullText.trim());
      }
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      setError("Failed to process PDF. The file may be corrupted or password-protected.");
      setFileName("");
      setFileType(null);
    } finally {
      setProgress(0);
      setProcessingMessage("");
      setIsProcessing(false);
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

  return <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Textify</h1>
          <p className="text-lg text-gray-600">Extract text from images and PDFs with ease</p>
        </header>

        <Card className="p-6 shadow-lg bg-white rounded-xl transition-all duration-300 hover:shadow-xl">
          <div className="mb-8">
            <div onClick={triggerFileInput} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300
                ${fileName && !error ? "border-green-400 bg-green-50" : error ? "border-red-400 bg-red-50" : isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
              
              {error ? <div className="flex flex-col items-center">
                  <div className="rounded-full bg-red-100 p-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-red-700">{error}</p>
                  <p className="text-sm text-gray-500 mt-1">Click to try a different file</p>
                </div> : fileName ? <div className="flex flex-col items-center">
                  {fileType === "image" ? <FileImage size={48} className="text-green-500 mb-3" /> : <FileText size={48} className="text-green-500 mb-3" />}
                  <p className="text-lg font-medium text-gray-900">{fileName}</p>
                  <p className="text-sm text-gray-500 mt-1">Click to change file</p>
                </div> : <div className="flex flex-col items-center">
                  <Upload size={48} className="text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-900">Click to upload a file</p>
                  <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-2">Supports images (JPG, PNG) and PDF files</p>
                </div>}
            </div>
          </div>

          {isProcessing ? <div className="text-center py-12">
              <LoadingSpinner size={36} className="mb-4" />
              <p className="text-lg text-gray-700">{processingMessage || "Extracting text..."}</p>
              <p className="text-sm text-gray-500">This may take a moment depending on the file size</p>
              
              {progress > 0 && <div className="mt-4 w-64 mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out" style={{
                width: `${progress}%`
              }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
                </div>}
            </div> : text ? <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Extracted Text</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy size={16} className="mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RefreshCcw size={16} className="mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="formatted" className="transition-all duration-300">
                <TabsList className="mb-2">
                  <TabsTrigger value="formatted" className="transition-colors duration-200">Formatted</TabsTrigger>
                  <TabsTrigger value="raw" className="transition-colors duration-200">Raw Text</TabsTrigger>
                </TabsList>
                <TabsContent value="formatted" className="mt-0">
                  <div className="bg-gray-50 rounded-lg p-4 min-h-40 max-h-[60vh] overflow-auto whitespace-pre-wrap border border-gray-100 shadow-inner">
                    {text.split('\n').map((line, i) => <p key={i} className={`${line.trim() === "" ? "h-4" : "mb-2"} animate-fadeIn`} style={{
                  animationDelay: `${i * 20}ms`
                }}>{line}</p>)}
                  </div>
                </TabsContent>
                <TabsContent value="raw" className="mt-0">
                  <Textarea value={text} readOnly className="min-h-40 max-h-[60vh]" />
                </TabsContent>
              </Tabs>
            </div> : null}
        </Card>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p className="font-bold">A simple tool to extract text from images and PDFs. No login required.
powered by Riel Tech Indonesia - www.rieltech.id</p>
        </footer>
      </div>
    </div>;
};

export default Index;
