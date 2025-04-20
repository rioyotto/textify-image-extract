
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "@/hooks/use-toast";

// Set PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromImage = async (
  file: File,
  setProgress: (progress: number) => void,
  setProcessingMessage: (message: string) => void
): Promise<string> => {
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
    
    await worker.terminate();
    
    if (data.text.trim() === '') {
      throw new Error("No text could be extracted from this image. Try a clearer image.");
    }
    
    return data.text;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error("Failed to process image. Please try another image file.");
  } finally {
    setProgress(0);
    setProcessingMessage("");
  }
};

export const extractTextFromPDF = async (
  file: File,
  setProgress: (progress: number) => void,
  setProcessingMessage: (message: string) => void
): Promise<string> => {
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
    
    if (fullText.trim() === '') {
      console.log("No text found in PDF");
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
      
      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const imageFile = new File([blob], "pdf-page.png", { type: "image/png" });
            try {
              const text = await extractTextFromImage(imageFile, setProgress, setProcessingMessage);
              resolve(text);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error("Failed to convert PDF to image for OCR"));
          }
        }, 'image/png');
      });
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to process PDF. The file may be corrupted or password-protected.");
  } finally {
    setProgress(0);
    setProcessingMessage("");
  }
};
