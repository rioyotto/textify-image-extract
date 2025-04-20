
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, RefreshCcw } from 'lucide-react';

interface TextOutputProps {
  text: string;
  onCopy: () => void;
  onReset: () => void;
}

export const TextOutput = ({ text, onCopy, onReset }: TextOutputProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Extracted Text</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy size={16} className="mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCcw size={16} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="formatted" className="transition-all duration-300">
        <TabsList className="mb-2">
          <TabsTrigger value="formatted">Formatted</TabsTrigger>
          <TabsTrigger value="raw">Raw Text</TabsTrigger>
        </TabsList>
        <TabsContent value="formatted" className="mt-0">
          <div className="bg-gray-50 rounded-lg p-4 min-h-40 max-h-[60vh] overflow-auto whitespace-pre-wrap border border-gray-100 shadow-inner">
            {text.split('\n').map((line, i) => (
              <p
                key={i}
                className={`${line.trim() === "" ? "h-4" : "mb-2"} animate-fadeIn`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {line}
              </p>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="raw" className="mt-0">
          <Textarea value={text} readOnly className="min-h-40 max-h-[60vh]" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
