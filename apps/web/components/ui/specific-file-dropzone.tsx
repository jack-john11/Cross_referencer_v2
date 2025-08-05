/**
 * Specific File Dropzone - Individual dropzone for specific document types
 * Each dropzone is labeled and categorized for proper AI processing
 */

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, AlertCircle, CheckCircle, Clock, Zap, Brain, FileText, Database, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from './progress'
import { Badge } from './badge'
import { Card, CardContent } from './card'
import { DocumentType } from '@ecologen/shared-types'
import { uploadFile, UploadProgress } from '@/lib/services/file-upload'

interface SpecificFileDropzoneProps {
  documentType: DocumentType
  label: string
  description: string
  projectId: string
  accept?: Record<string, string[]>
  maxSize?: number
  onFileAccepted?: (file: File, documentType: DocumentType) => void
  onFileProcessed?: (file: File, documentType: DocumentType, success: boolean, error?: string) => void
  className?: string
}

interface FileProgress extends UploadProgress {
  file: File
  message?: string
  autoHideTimeout?: NodeJS.Timeout
}

export function SpecificFileDropzone({
  documentType,
  label,
  description,
  projectId,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB
  onFileAccepted,
  onFileProcessed,
  className
}: SpecificFileDropzoneProps) {
  const [fileProgress, setFileProgress] = useState<FileProgress | null>(null)

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (fileProgress?.autoHideTimeout) {
        clearTimeout(fileProgress.autoHideTimeout)
      }
    }
  }, [fileProgress?.autoHideTimeout])

  const handleFileUpload = useCallback(async (file: File) => {
    onFileAccepted?.(file, documentType)

    setFileProgress({
      file,
      progress: 0,
      stage: 'uploading',
      message: `Uploading ${file.name}...`
    })

    try {
      const result = await uploadFile(
        file,
        documentType,
        projectId,
        (progress) => {
          // Only update progress if it's not an error state
          // Let the result handling below manage errors to avoid duplicates
          if (progress.stage !== 'error') {
            setFileProgress(prev => prev ? {
              ...prev,
              ...progress
            } : null)
          }
        }
      )

      // Handle the final result
      if (result.success) {
        console.log('Upload successful:', result)
        
        // Update progress to show completion
        setFileProgress(prev => {
          if (!prev) return null
          
          // Clear any existing timeout
          if (prev.autoHideTimeout) {
            clearTimeout(prev.autoHideTimeout)
          }
          
          const newProgress = {
            ...prev,
            stage: 'complete' as const,
            progress: 100,
            message: `Successfully processed ${file.name}`,
            processingResult: result.data?.processingResult
          }
          
          // Auto-hide success message after 8 seconds
          const timeout = setTimeout(() => {
            setFileProgress(null)
          }, 8000)
          
          return { ...newProgress, autoHideTimeout: timeout }
        })
        
        onFileProcessed?.(file, documentType, true)
      } else {
        console.error('Upload failed:', result.error)
        const errorType = result.errorType || 'unknown'
        
        setFileProgress(prev => {
          if (!prev) return null
          
          // Clear any existing timeout
          if (prev.autoHideTimeout) {
            clearTimeout(prev.autoHideTimeout)
          }
          
          const newProgress = {
            ...prev,
            stage: 'error' as const,
            error: result.error || 'Upload failed',
            errorType,
            progress: 0  // Reset progress on error
          }
          
          // Auto-hide for file type errors after 5 seconds
          if (errorType === 'file_type') {
            const timeout = setTimeout(() => {
              setFileProgress(null)
            }, 5000)
            return { ...newProgress, autoHideTimeout: timeout }
          }
          
          // Don't auto-hide for extraction errors - leave them visible
          return newProgress
        })
        
        onFileProcessed?.(file, documentType, false, result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      const errorType = (error as any)?.errorType || 'unknown'
      
      setFileProgress(prev => {
        if (!prev) return null
        
        // Clear any existing timeout
        if (prev.autoHideTimeout) {
          clearTimeout(prev.autoHideTimeout)
        }
        
        const newProgress = {
          ...prev,
          stage: 'error' as const,
          error: errorMessage,
          errorType,
          progress: 0  // Reset progress on error
        }
        
        // Auto-hide for file type errors after 5 seconds
        if (errorType === 'file_type') {
          const timeout = setTimeout(() => {
            setFileProgress(null)
          }, 5000)
          return { ...newProgress, autoHideTimeout: timeout }
        }
        
        // Don't auto-hide for extraction errors - leave them visible
        return newProgress
      })
      
      onFileProcessed?.(file, documentType, false, errorMessage)
    }
  }, [documentType, onFileAccepted, onFileProcessed, projectId])

  const retryUpload = useCallback(() => {
    if (fileProgress?.file) {
      console.log('Retrying upload for file:', fileProgress.file.name)
      handleFileUpload(fileProgress.file)
    }
  }, [fileProgress?.file, handleFileUpload])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0] // Only take the first file for specific dropzones
    await handleFileUpload(file)
  }, [handleFileUpload])

  const isProcessing = fileProgress?.stage === 'uploading' || fileProgress?.stage === 'processing'
  
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false, // Only one file per specific dropzone
    maxFiles: 1,
    disabled: isProcessing, // Disable during upload/processing
    noClick: isProcessing,  // Disable click-to-open during processing
    noKeyboard: isProcessing // Disable keyboard access during processing
  })

  const getDocumentIcon = () => {
    const baseClasses = "h-10 w-10 transition-colors duration-300"
    
    switch (documentType) {
      case 'nvr':
      case 'pmr':
      case 'bvd':
        return <FileText className={cn(baseClasses, 
          fileProgress?.stage === 'complete' ? "text-emerald-600" :
          fileProgress?.stage === 'error' ? "text-red-500" :
          isProcessing ? "text-muted-foreground animate-pulse" :
          "text-orange-600 group-hover:text-orange-700"
        )} />
      case 'species_list':
        return <Database className={cn(baseClasses,
          fileProgress?.stage === 'complete' ? "text-emerald-600" :
          fileProgress?.stage === 'error' ? "text-red-500" :
          isProcessing ? "text-muted-foreground animate-pulse" :
          "text-green-600 group-hover:text-green-700"
        )} />
      case 'gis_shapefile':
        return <Map className={cn(baseClasses,
          fileProgress?.stage === 'complete' ? "text-emerald-600" :
          fileProgress?.stage === 'error' ? "text-red-500" :
          isProcessing ? "text-muted-foreground animate-pulse" :
          "text-purple-600 group-hover:text-purple-700"
        )} />
      default:
        return <File className={cn(baseClasses, "text-muted-foreground")} />
    }
  }

  const getProcessingBadge = () => {
    if (!fileProgress) return null
    
    switch (fileProgress.stage) {
      case 'uploading':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400">
            <Upload className="h-3 w-3 mr-1" />
            Uploading
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600 dark:text-purple-400 dark:border-purple-400">
            <Brain className="h-3 w-3 mr-1" />
            AI Processing
          </Badge>
        )
      case 'complete':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
    }
  }

  const getExpectedContent = () => {
    switch (documentType) {
      case 'nvr':
        return 'Natural Values Report - Contains threatened flora/fauna data tables'
      case 'pmr':
        return 'Preliminary Move Report - Contains protected matters assessment data'
      case 'bvd':
        return 'Biodiversity Values Database - Contains habitat and species records'
      case 'species_list':
        return 'Species observation data in CSV/Excel format'
      case 'gis_shapefile':
        return 'Geographic boundary data for site assessment'
      default:
        return 'Document for ecological assessment'
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Card className={cn(
        "transition-all duration-300 border-0 shadow-sm",
        isDragActive && "shadow-lg",
        fileProgress?.stage === 'complete' && "shadow-md",
        fileProgress?.stage === 'error' && "shadow-sm"
      )}>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "group border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 relative",
              isProcessing 
                ? "border-muted-foreground/20 bg-muted/30 cursor-not-allowed opacity-70"
                : "cursor-pointer",
              !isProcessing && isDragActive 
                ? "border-primary/60 bg-primary/8 shadow-lg" 
                : !isProcessing && fileProgress?.stage === 'complete'
                ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/30 shadow-md"
                : !isProcessing && fileProgress?.stage === 'error'
                ? "border-red-300 bg-red-50/50 dark:border-red-600 dark:bg-red-950/20"
                : !isProcessing && "border-primary/30 bg-background hover:border-primary/50 hover:bg-primary/3 hover:shadow-md"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-3">
              {/* Icon and Status */}
              <div className="flex items-center justify-center gap-2">
                {getDocumentIcon()}
                {getProcessingBadge()}
              </div>
              
              {/* Label and Description */}
              <div>
                <h4 className="font-semibold text-sm">{label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
              
              {/* Current Status */}
              {fileProgress ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-32">{fileProgress.file.name}</span>
                    <span>{fileProgress.stage === 'error' ? '0' : Math.round(fileProgress.progress)}%</span>
                  </div>
                  <Progress 
                    value={fileProgress.stage === 'error' ? 0 : fileProgress.progress} 
                    className={cn(
                      "h-1.5",
                      fileProgress.stage === 'complete' && "bg-green-100 dark:bg-green-900/50",
                      fileProgress.stage === 'error' && "bg-red-100 dark:bg-red-900/50"
                    )}
                  />
                  {fileProgress.message && fileProgress.stage !== 'error' && (
                    <div className="space-y-1">
                      <div className={cn(
                        "text-xs",
                        fileProgress.stage === 'complete' && "text-green-700 dark:text-green-400",
                        fileProgress.stage === 'uploading' && "text-blue-700 dark:text-blue-400",
                        fileProgress.stage === 'processing' && "text-purple-700 dark:text-purple-400"
                      )}>
                        {fileProgress.message}
                      </div>
                      {fileProgress.stage === 'complete' && (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground italic">
                            Click to upload a different file to overwrite
                          </div>
                          
                          {/* Display extracted table results */}
                          {fileProgress.processingResult && (
                            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                              <div className="text-xs font-medium text-green-800 dark:text-green-400 mb-1">
                                📊 Extraction Results
                              </div>
                              {fileProgress.processingResult.tables && fileProgress.processingResult.tables.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="text-xs text-green-700 dark:text-green-300">
                                    Found {fileProgress.processingResult.tables.length} table(s) with {' '}
                                    {fileProgress.processingResult.tables.reduce((sum: number, table: any) => sum + (table.record_count || 0), 0)} species records
                                  </div>
                                  
                                  {/* Data Quality Score */}
                                  {fileProgress.processingResult.validation && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className={
                                        fileProgress.processingResult.validation.qualityScore >= 80 
                                          ? "text-green-700 dark:text-green-300" 
                                          : fileProgress.processingResult.validation.qualityScore >= 50
                                          ? "text-amber-700 dark:text-amber-300"
                                          : "text-red-700 dark:text-red-300"
                                      }>
                                        Quality: {fileProgress.processingResult.validation.qualityScore}%
                                      </span>
                                      {fileProgress.processingResult.validation.qualityScore >= 80 && <span>✅</span>}
                                      {fileProgress.processingResult.validation.qualityScore >= 50 && fileProgress.processingResult.validation.qualityScore < 80 && <span>⚠️</span>}
                                      {fileProgress.processingResult.validation.qualityScore < 50 && <span>❌</span>}
                                    </div>
                                  )}
                                  
                                  {/* Tables Summary */}
                                  {fileProgress.processingResult.tables.slice(0, 2).map((table: any, idx: number) => (
                                    <div key={idx} className="text-xs text-green-600 dark:text-green-400">
                                      • {table.tableName || `Table ${idx + 1}`}: {table.record_count || 0} records
                                      {table.validation && (
                                        <span className="text-muted-foreground ml-1">
                                          ({Math.round(table.validation.completenessScore || 0)}% complete)
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {fileProgress.processingResult.tables.length > 2 && (
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                      • ... and {fileProgress.processingResult.tables.length - 2} more tables
                                    </div>
                                  )}
                                  
                                  {/* Validation Warnings */}
                                  {fileProgress.processingResult.validation?.warnings && 
                                   fileProgress.processingResult.validation.warnings.length > 0 && (
                                    <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                                      {fileProgress.processingResult.validation.warnings.slice(0, 2).map((warning: string, idx: number) => (
                                        <div key={idx}>⚠️ {warning}</div>
                                      ))}
                                      {fileProgress.processingResult.validation.warnings.length > 2 && (
                                        <div>... and {fileProgress.processingResult.validation.warnings.length - 2} more warnings</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-amber-700 dark:text-amber-400">
                                  ⚠️ No tables detected in this document
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {fileProgress.error && fileProgress.stage === 'error' && (
                    <div className="space-y-2">
                      <div className={cn(
                        "text-xs transition-opacity duration-300",
                        fileProgress.errorType === 'file_type' && "text-orange-700 dark:text-orange-400",
                        fileProgress.errorType === 'extraction' && "text-red-700 dark:text-red-400",
                        fileProgress.errorType === 'network' && "text-blue-700 dark:text-blue-400",
                        (!fileProgress.errorType || fileProgress.errorType === 'unknown') && "text-red-700 dark:text-red-400"
                      )}>
                        {fileProgress.errorType === 'file_type' && '⚠️ '}
                        {fileProgress.errorType === 'extraction' && '❌ '}
                        {fileProgress.errorType === 'network' && '🌐 '}
                        {fileProgress.error}
                      </div>
                      
                      {/* Show retry button for extraction and network errors */}
                      {(fileProgress.errorType === 'extraction' || fileProgress.errorType === 'network') && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            retryUpload()
                          }}
                          className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                        >
                          Try Again
                        </button>
                      )}
                      
                      {/* Show helpful hint for file type errors */}
                      {fileProgress.errorType === 'file_type' && (
                        <div className="text-xs text-muted-foreground italic">
                          This message will disappear in a few seconds...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isProcessing 
                    ? "text-muted-foreground" 
                    : isDragActive 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-primary/80"
                )}>
                  {isProcessing 
                    ? "Processing file..." 
                    : isDragActive 
                    ? "Drop file here" 
                    : "Click to browse or drag file here"
                  }
                </div>
              )}
              
              {/* Expected Content Info */}
              <div className="text-xs text-muted-foreground/70 italic border-t border-muted/20 pt-2 mt-1">
                Expected: {getExpectedContent()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Rejection Errors */}
      {fileRejections.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <CardContent className="p-2">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs font-medium">File rejected:</span>
            </div>
            {fileRejections.map(({ file, errors }) => (
              <div key={file.name} className="text-xs text-red-700 dark:text-red-400 mt-1">
                {file.name}: {errors.map(e => e.message).join(', ')}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}