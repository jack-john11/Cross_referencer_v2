"use client"

import type React from "react"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, FileIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

export function FileDropzone({ onFileSelect, selectedFile }: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  })

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect(null)
  }

  return (
    <div
      {...getRootProps()}
      className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
      ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
      ${selectedFile ? "border-solid border-primary/30 bg-card" : ""}`}
    >
      <input {...getInputProps()} />
      {selectedFile ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="h-6 w-6 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate">{selectedFile.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-6 w-6 flex-shrink-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive ? "Drop the file here..." : "Drag & drop or click"}
          </p>
        </div>
      )}
    </div>
  )
}
