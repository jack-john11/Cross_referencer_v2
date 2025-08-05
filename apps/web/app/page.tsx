/**
 * Main EcoloGen page - Fixed to work with enhanced components
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SpecificFileDropzone } from '@/components/ui/specific-file-dropzone'
import { DocumentType } from '@ecologen/shared-types'
import { AIInteractionCallout } from "@/components/ui/ai-interaction-callout"
import { ProgressMonitor } from "@/components/ui/progress-monitor"

const reportSections = [
  "Summary",
  "Introduction",
  "Study Area", 
  "Methods",
  "Findings",
  "Discussion",
  "References"
]

const detailedSectionStructure = {
  "Summary": {
    subsections: [],
    description: "Executive summary of key findings and recommendations"
  },
  "Introduction": {
    subsections: ["Purpose", "Scope", "Limitations", "Permit"],
    description: "Project context, objectives, and regulatory framework"
  },
  "Study Area": {
    subsections: ["Land use proposal", "Overview – cadastral details", "Other site features"],
    description: "Site description, location, and proposed development details"
  },
  "Methods": {
    subsections: [
      "Nomenclature", 
      "Preliminary investigation", 
      "Field assessment", 
      "Vegetation classification",
      "Threatened (and priority) flora",
      "Threatened fauna", 
      "Weed and hygiene issues"
    ],
    description: "Survey methodologies and assessment protocols"
  },
  "Findings": {
    subsections: [
      "Vegetation types",
      "Comments on TASVEG mapping",
      "Vegetation types recorded as part of the present study",
      "Conservation significance of identified vegetation types",
      "Plant species",
      "Threatened flora",
      "Threatened fauna",
      "Other natural values",
      "Weed species",
      "Myrtle wilt",
      "Myrtle rust", 
      "Rootrot pathogen, Phytophthora cinnamomi",
      "Chytrid fungus and other freshwater pathogens",
      "Additional Matters of National Environmental Significance – Threatened Ecological Communities",
      "Additional Matters of National Environmental Significance – Wetlands of International Importance"
    ],
    description: "Detailed survey results and species/habitat assessments"
  },
  "Discussion": {
    subsections: [
      "Summary of key findings",
      "Legislative and policy implications", 
      "Recommendations"
    ],
    description: "Analysis of findings, regulatory compliance, and recommendations"
  },
  "References": {
    subsections: [],
    description: "Citations and bibliography"
  }
}

export default function EcoReportGenerator() {
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Map<DocumentType, File>>(new Map())
  const [selectedAIProvider, setSelectedAIProvider] = useState("openai")

  const handleFileAccepted = (file: File, documentType: DocumentType) => {
    console.log(`${documentType} file selected:`, file.name)
  }

  const handleFileProcessed = (file: File, documentType: DocumentType, success: boolean, error?: string) => {
    if (success) {
      setUploadedFiles(prev => new Map(prev).set(documentType, file))
      console.log(`${documentType} file processed successfully:`, file.name)
    } else {
      console.error(`${documentType} file processing failed:`, error)
      // Remove from uploaded files if it was previously added
      setUploadedFiles(prev => {
        const newMap = new Map(prev)
        newMap.delete(documentType)
        return newMap
      })
    }
  }

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
      <Header />
      <div className="flex-1 grid lg:grid-cols-[360px_1fr_320px] min-h-0">
        {/* Left Sidebar - Generation Progress */}
        <aside className="hidden lg:block bg-background border-r border-border p-4 space-y-4 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold">Generation Progress</h2>
            <p className="text-sm text-muted-foreground">Monitor report generation status and progress.</p>
          </div>
          
          <ProgressMonitor
            id="overall-progress"
            variant="overall"
            title="Overall Progress"
            progress={0}
            state="queued"
            currentOperation="Ready to generate"
          />
          
          <div className="space-y-2">
            <h3 className="text-md font-semibold">Section Progress</h3>
            <Card>
              <CardContent className="p-0">
                {reportSections.slice(0, 6).map((section) => (
                  <ProgressMonitor
                    key={section}
                    id={`section-${section.toLowerCase()}`}
                    variant="section"
                    title={section}
                    progress={0}
                    state="queued"
                    size="sm"
                  />
                ))}
              </CardContent>
            </Card>
          </div>
          
          <ProgressMonitor
            id="realtime-status"
            variant="realtime"
            title="Real-time Status"
            progress={100}
            state="complete"
            currentOperation="System ready"
          />
        </aside>

        {/* Center Panel */}
        <main className="overflow-y-scroll p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Report Generator</h1>
              <p className="text-muted-foreground mt-2">
                Generate comprehensive ecological reports with multi-tier AI assistance
              </p>
            </div>

            {/* Uploaded Files Summary */}
            {uploadedFiles.size > 0 && (
              <Card 
                className="!bg-green-200 !border-green-600 dark:!bg-green-900/20 dark:!border-green-700 shadow-sm"
                style={{ 
                  boxShadow: '0 2px 8px hsl(var(--primary) / 0.1)',
                  borderLeftWidth: '4px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: 'hsl(var(--primary) / 0.6)',
                  backgroundColor: 'rgb(187 247 208)', /* green-200 for light mode */
                  borderColor: 'rgb(22 163 74)' /* green-600 for light mode */
                }}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 !text-green-900 dark:!text-green-100">
                    📁 Uploaded Files Ready for AI Processing
                  </h3>
                  <div className="grid gap-2">
                    {Array.from(uploadedFiles.entries()).map(([docType, file]) => (
                      <div key={docType} className="flex items-center gap-3 text-sm">
                        <Badge 
                          variant="outline" 
                          className="!text-green-900 !border-green-800 dark:!text-green-200 dark:!border-green-600"
                          style={{
                            color: 'rgb(20 83 45)', /* green-900 for light mode */
                            borderColor: 'rgb(22 101 52)' /* green-800 for light mode */
                          }}
                        >
                          {docType.toUpperCase()}
                        </Badge>
                        <span 
                          className="flex-1 truncate font-medium !text-green-950 dark:!text-green-50"
                          style={{ color: 'rgb(5 46 22)' }} /* green-950 for light mode */
                        >
                          {file.name}
                        </span>
                        <span 
                          className="text-xs !text-green-800 dark:!text-green-300"
                          style={{ color: 'rgb(22 101 52)' }} /* green-800 for light mode */
                        >
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                  <p 
                    className="text-xs mt-2 !text-green-900 dark:!text-green-300"
                    style={{ color: 'rgb(20 83 45)' }} /* green-900 for light mode */
                  >
                    Each file type will be processed by the appropriate AI model for optimal extraction.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* AI Clarifications */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">AI Questions & Clarifications</h2>
              
              <Card className="border-dashed border-muted-foreground/30">
                <CardContent className="p-8 text-center">
                  <div className="space-y-2">
                    <div className="h-12 w-12 mx-auto bg-muted rounded-lg flex items-center justify-center">
                      🤖
                    </div>
                    <h3 className="text-lg font-semibold">No AI Questions Yet</h3>
                    <p className="text-muted-foreground">
                      AI clarifications will appear here during report generation
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Sections Preview */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Generated Report Sections</h2>
              
              <div className="grid gap-4">
                {reportSections.map((section, index) => {
                  const sectionData = detailedSectionStructure[section as keyof typeof detailedSectionStructure]
                  
                  return (
                    <Card key={section} className={selectedSections.includes(section) ? "border-primary" : "border-border"}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{section}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {sectionData.description}
                        </p>
                        
                        {sectionData.subsections.length > 0 && (
                          <details className="mt-3">
                            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                              Show subsections ({sectionData.subsections.length})
                            </summary>
                            <div className="mt-2 pl-4 border-l-2 border-muted">
                              {sectionData.subsections.map((subsection, subIndex) => (
                                <div key={subIndex} className="text-xs text-muted-foreground py-1">
                                  • {subsection}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                        
                        {selectedSections.includes(section) && (
                          <div className="mt-3 p-2 bg-primary/10 rounded text-xs text-primary">
                            ✓ Selected for generation
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Generation Controls & Data Sources */}
        <aside className="hidden lg:block bg-background border-l border-border p-4 space-y-4 overflow-y-auto">
          {/* AI Provider Selection */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">AI Model Provider</h2>
            <Card>
              <CardContent className="p-3">
                <Select value={selectedAIProvider} onValueChange={setSelectedAIProvider}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="claude">Anthropic Claude</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Models will be used agentically across all sections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Section Selection */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Select Sections to Generate</h2>
            <Card>
              <CardContent className="p-3 space-y-3">
                {reportSections.map((section, index) => (
                  <div key={section} className="flex items-center justify-between">
                    <Label htmlFor={`toggle-${index}`} className="cursor-pointer text-sm font-normal">
                      {section}
                    </Label>
                    <Switch 
                      id={`toggle-${index}`} 
                      checked={selectedSections.includes(section)}
                      onCheckedChange={() => toggleSection(section)}
                      aria-label={`Toggle ${section}`} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="text-xs text-muted-foreground">
              Selected: {selectedSections.length} of {reportSections.length} sections
            </div>
          </div>

          {/* Data Sources */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <h2 className="text-lg font-semibold">Data Sources</h2>
              <p className="text-sm text-muted-foreground">Upload documents and maps to begin.</p>
            </div>
            
            <Accordion type="multiple" defaultValue={["reports", "species", "maps"]} className="w-full">
              <AccordionItem value="reports">
                <AccordionTrigger>Government Reports</AccordionTrigger>
                <AccordionContent className="space-y-4 overflow-visible">
                  <SpecificFileDropzone
                    documentType="nvr"
                    label="Natural Values Report (NVR)"
                    description="Government-issued natural values assessment (PDF for table extraction or CSV for structured data)"
                    projectId="ecolo-gen-test-project"
                    accept={{
                      "application/pdf": [".pdf"],
                      "text/csv": [".csv"],
                      "application/vnd.ms-excel": [".xls"],
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
                    }}
                    onFileAccepted={handleFileAccepted}
                    onFileProcessed={handleFileProcessed}
                  />
                  
                  <SpecificFileDropzone
                    documentType="pmr"
                    label="Protected Matters Report (PMR)"
                    description="EPBC Act protected matters search results"
                    projectId="ecolo-gen-test-project"
                    accept={{"application/pdf": [".pdf"]}}
                    onFileAccepted={handleFileAccepted}
                    onFileProcessed={handleFileProcessed}
                  />
                  
                  <SpecificFileDropzone
                    documentType="bvd"
                    label="Biodiversity Values Database (BVD)"
                    description="Statewide biodiversity database extract"
                    projectId="ecolo-gen-test-project"
                    accept={{"application/pdf": [".pdf"]}}
                    onFileAccepted={handleFileAccepted}
                    onFileProcessed={handleFileProcessed}
                  />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="species">
                <AccordionTrigger>Species Data</AccordionTrigger>
                <AccordionContent className="space-y-4 overflow-visible">
                  <SpecificFileDropzone
                    documentType="species_list"
                    label="Species Observation Data"
                    description="Field survey data, monitoring records, or species lists"
                    projectId="ecolo-gen-test-project"
                    accept={{
                      "text/csv": [".csv"],
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
                    }}
                    onFileAccepted={handleFileAccepted}
                    onFileProcessed={handleFileProcessed}
                  />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="maps">
                <AccordionTrigger>GIS & Spatial Data</AccordionTrigger>
                <AccordionContent className="space-y-4 overflow-visible">
                  <SpecificFileDropzone
                    documentType="gis_shapefile"
                    label="Site Boundary Shapefile"
                    description="Zipped shapefile containing project site boundaries"
                    projectId="ecolo-gen-test-project"
                    accept={{"application/zip": [".zip"]}}
                    onFileAccepted={handleFileAccepted}
                    onFileProcessed={handleFileProcessed}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {uploadedFiles.size > 0 && (
              <div className="text-xs text-muted-foreground">
                {uploadedFiles.size} file(s) uploaded successfully
                <div className="mt-1 space-y-1">
                  {Array.from(uploadedFiles.entries()).map(([docType, file]) => (
                    <div key={docType} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{docType.toUpperCase()}:</span>
                      <span className="truncate max-w-32 ml-2">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <Button 
              size="lg" 
              className="w-full"
              disabled={selectedSections.length === 0}
            >
              Generate Report
            </Button>
            
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {selectedSections.length > 0 ? (
                <div>
                  <div>Will generate {selectedSections.length} sections</div>
                  {uploadedFiles.size > 0 && (
                    <div className="mt-1">Using {uploadedFiles.size} uploaded file(s)</div>
                  )}
                </div>
              ) : (
                'Select sections to enable generation'
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}