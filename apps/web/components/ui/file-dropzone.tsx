'use client'

import React, { useCallback } from 'react'
import { useDropzone, Accept } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  acceptedFileTypes?: Accept
}

const defaultAcceptedTypes: Accept = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

export function FileDropzone({ onFilesSelected, acceptedFileTypes = defaultAcceptedTypes }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <UploadCloud className="h-10 w-10" />
        <p className="font-semibold">
          {isDragActive ? 'Drop the files here...' : "Drag 'n' drop some files here, or click to select files"}
        </p>
        <p className="text-xs">Accepted types: PDF, Word, Excel, JPG, PNG</p>
      </div>
    </div>
  )
}
