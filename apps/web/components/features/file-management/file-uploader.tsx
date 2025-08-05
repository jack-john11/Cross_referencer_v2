'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SpecificFileDropzone } from '@/components/ui/specific-file-dropzone'

export function FileUploader({ projectId }: { projectId: string }) {
  const handleFileAccepted = (file: File, documentType: string) => {
    console.log(`File accepted for ${documentType}:`, file.name)
    // Here you could add the file to a global "uploading" list if needed
  }

  const handleFileProcessed = (file: File, documentType: string, success: boolean, error?: string) => {
    console.log(`File processed for ${documentType}:`, {
      fileName: file.name,
      success,
      error,
    })
    // Here you might trigger a refresh of the project's document list
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Documents</CardTitle>
        <CardDescription>
          Upload the required documents for this project. Each section accepts specific file types for automated processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['gov-reports']} className="w-full space-y-4">
          <AccordionItem value="gov-reports">
            <AccordionTrigger>Government Reports</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <SpecificFileDropzone
                documentType="nvr"
                label="Natural Values Report (NVR)"
                description="PDF or CSV for table extraction"
                projectId={projectId}
                accept={{
                  'application/pdf': ['.pdf'],
                  'text/csv': ['.csv'],
                }}
                onFileAccepted={handleFileAccepted}
                onFileProcessed={handleFileProcessed}
              />
              <SpecificFileDropzone
                documentType="pmr"
                label="Protected Matters Report (PMR)"
                description="EPBC Act protected matters search results"
                projectId={projectId}
                accept={{ 'application/pdf': ['.pdf'] }}
                onFileAccepted={handleFileAccepted}
                onFileProcessed={handleFileProcessed}
              />
              <SpecificFileDropzone
                documentType="bvd"
                label="Biodiversity Values Database (BVD)"
                description="Statewide biodiversity database extract"
                projectId={projectId}
                accept={{ 'application/pdf': ['.pdf'] }}
                onFileAccepted={handleFileAccepted}
                onFileProcessed={handleFileProcessed}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="species-data">
            <AccordionTrigger>Species Data</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <SpecificFileDropzone
                documentType="species_list"
                label="Species Observation Data"
                description="Field survey data, monitoring records, etc."
                projectId={projectId}
                accept={{
                  'text/csv': ['.csv'],
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                }}
                onFileAccepted={handleFileAccepted}
                onFileProcessed={handleFileProcessed}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="gis-data">
            <AccordionTrigger>GIS & Spatial Data</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <SpecificFileDropzone
                documentType="gis_shapefile"
                label="Site Boundary Shapefile"
                description="Zipped shapefile with project boundaries"
                projectId={projectId}
                accept={{ 'application/zip': ['.zip'] }}
                onFileAccepted={handleFileAccepted}
                onFileProcessed={handleFileProcessed}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
