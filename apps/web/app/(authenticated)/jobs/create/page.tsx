"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Header } from '@/components/header'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
// TODO: Create a job management store
// import { useJobManagementStore } from '@/lib/stores/job-management' 
import { ArrowLeft, Save, AlertCircle, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { SpecificFileDropzone } from '@/components/ui/specific-file-dropzone'
import { JobCreateInput } from 'shared-types' // Adjusted import path

// Form validation schema for the new job functionality
const jobFormSchema = z.object({
  name: z.string()
    .min(1, 'Job name is required')
    .max(100, 'Job name must be less than 100 characters')
    .trim(),
  sourceFile: z.instanceof(File, { message: "Source CSV file is required" }),
  sourceColumn: z.string().min(1, 'Source column is required'),
  referenceFile: z.instanceof(File, { message: "Reference CSV file is required" }),
  referenceColumn: z.string().min(1, 'Reference column is required'),
})

type JobFormData = z.infer<typeof jobFormSchema>

export default function CreateJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  // const { createJob, operations } = useJobManagementStore() // TODO
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue,
    control,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    mode: 'onChange',
  })

  const nameValue = watch('name')

  const onSubmit = useCallback(async (data: JobFormData) => {
    setIsSubmitting(true)
    
    try {
      // TODO: Implement file upload and job creation logic
      console.log('Form Data:', data)
      
      // const newJob = await createJob(data as JobCreateInput)
      
      toast({
        title: "Job Created",
        description: `"${data.name}" has been created successfully.`,
        variant: "default"
      })
      
      router.push(`/dashboard`)
      
    } catch (error) {
      console.error('Failed to create job:', error)
      
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create job. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [/* createJob, */ router, toast])

  const handleCancel = useCallback(() => {
    if (!isDirty) {
      router.push('/dashboard')
    }
  }, [isDirty, router])

  const handleConfirmCancel = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
      <Header variant="authenticated" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Cross-Reference Job</h1>
              <p className="text-muted-foreground mt-1">
                Upload two CSV files and specify columns to find common values.
              </p>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>
                  Provide a name for this job and specify the files and columns to cross-reference.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Job Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Job Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Q1 Customer List vs. Marketing Leads"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Source File Section */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Source File</h3>
                    <div className="space-y-2">
                      <Label htmlFor="sourceFile">Source CSV <span className="text-red-500">*</span></Label>
                      <SpecificFileDropzone
                        fileType="text/csv"
                        onFileChange={(file) => setValue('sourceFile', file, { shouldValidate: true })}
                        control={control}
                        name="sourceFile"
                      />
                       {errors.sourceFile && <p className="text-sm text-red-500">{errors.sourceFile.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourceColumn">Column Name or Index <span className="text-red-500">*</span></Label>
                      <Input
                        id="sourceColumn"
                        placeholder="e.g., 'Email' or 2"
                        {...register('sourceColumn')}
                        className={errors.sourceColumn ? 'border-red-500' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.sourceColumn && <p className="text-sm text-red-500">{errors.sourceColumn.message}</p>}
                    </div>
                  </div>

                  {/* Reference File Section */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Reference File</h3>
                    <div className="space-y-2">
                      <Label htmlFor="referenceFile">Reference CSV <span className="text-red-500">*</span></Label>
                       <SpecificFileDropzone
                        fileType="text/csv"
                        onFileChange={(file) => setValue('referenceFile', file, { shouldValidate: true })}
                        control={control}
                        name="referenceFile"
                      />
                      {errors.referenceFile && <p className="text-sm text-red-500">{errors.referenceFile.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referenceColumn">Column Name or Index <span className="text-red-500">*</span></Label>
                      <Input
                        id="referenceColumn"
                        placeholder="e.g., 'user_email' or 3"
                        {...register('referenceColumn')}
                        className={errors.referenceColumn ? 'border-red-500' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.referenceColumn && <p className="text-sm text-red-500">{errors.referenceColumn.message}</p>}
                    </div>
                  </div>
                </div>
                
              </CardContent>

              <CardFooter className="flex justify-between gap-4 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="min-w-40"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Job...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create and Run Job
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
