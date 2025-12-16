"use client";

import { useState, useRef, type DragEvent } from "react";
import { UploadCloud, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImageUploaderProps = {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
};

export default function ImageUploader({
  onImageUpload,
  isProcessing,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    event.target.value = ""; // Reset input
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload(file);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl transition-colors duration-300",
        isDragging
          ? "border-primary bg-accent/20"
          : "border-border bg-card"
      )}
    >
      <div className="text-center space-y-4">
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="text-2xl font-semibold">Upload Your Note Image</h3>
        <p className="text-muted-foreground">
          Drag & drop an image here, or use the buttons below.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            size="lg"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            Upload from Computer
          </Button>
          <Button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            variant="secondary"
            size="lg"
            className="sm:hidden"
          >
            <Camera className="mr-2 h-5 w-5" />
            Use Camera
          </Button>
           <Button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            variant="secondary"
            size="lg"
            className="hidden sm:inline-flex"
          >
            <Camera className="mr-2 h-5 w-5" />
            Use Phone Camera
          </Button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        disabled={isProcessing}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        capture="environment"
        disabled={isProcessing}
      />
    </div>
  );
}
