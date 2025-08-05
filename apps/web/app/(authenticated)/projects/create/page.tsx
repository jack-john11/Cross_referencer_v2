"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Header } from '@/components/header'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useProjectManagementStore } from '@/lib/stores/project-management'
// Remove conflicting import that's causing type issues
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Form validation schema based on project requirements
const projectFormSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val === '' ? undefined : val),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .trim()
})

type ProjectFormData = z.infer<typeof projectFormSchema>

export default function CreateProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { createProject, operations } = useProjectManagementStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      location: ''
    }
  })

  // Watch form values for real-time character counting
  const nameValue = watch('name')
  const descriptionValue = watch('description')
  const locationValue = watch('location')

  const onSubmit = useCallback(async (data: ProjectFormData) => {
    setIsSubmitting(true)
    
    try {
      // Create project with form data
      const newProject = await createProject({
        name: data.name,
        description: data.description,
        location: data.location
      } as any) // TODO: Fix type definition mismatch between form and API
      
      // Show success toast
      toast({
        title: "Project Created",
        description: `"${data.name}" has been created successfully.`,
        variant: "default"
      })
      
      // Navigate to the new project or dashboard
      router.push(`/dashboard`)
      
    } catch (error) {
      console.error('Failed to create project:', error)
      
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [createProject, router, toast])

  const handleCancel = useCallback(() => {
    if (!isDirty) {
      router.push('/dashboard')
    }
    // If dirty, the ConfirmationDialog will handle the confirmation
  }, [isDirty, router])

  const handleConfirmCancel = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
      <Header variant="authenticated" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
              <p className="text-muted-foreground mt-1">
                Set up a new ecological assessment project
              </p>
            </div>
          </div>

          {/* Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Provide the basic information for your new project. You can always edit these details later.
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* Project Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Project Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Biodiversity Assessment - Smith Creek"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : "name-help"}
                  />
                  <div className="flex justify-between items-center">
                    {errors.name && (
                      <p id="name-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {errors.name.message}
                      </p>
                    )}
                    <p id="name-help" className="text-xs text-muted-foreground ml-auto" aria-live="polite">
                      {nameValue?.length || 0}/100 characters
                    </p>
                  </div>
                </div>

                {/* Location Field */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., Hobart, Tasmania, Australia"
                    {...register('location')}
                    className={errors.location ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.location}
                    aria-describedby={errors.location ? "location-error" : "location-help"}
                  />
                  <div className="flex justify-between items-center">
                    {errors.location && (
                      <p id="location-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {errors.location.message}
                      </p>
                    )}
                    <p id="location-help" className="text-xs text-muted-foreground ml-auto" aria-live="polite">
                      {locationValue?.length || 0}/200 characters
                    </p>
                  </div>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-muted-foreground/70">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the ecological assessment project..."
                    rows={4}
                    {...register('description')}
                    className={errors.description ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? "description-error" : "description-help"}
                  />
                  <div className="flex justify-between items-center">
                    {errors.description && (
                      <p id="description-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {errors.description.message}
                      </p>
                    )}
                    <p id="description-help" className="text-xs text-muted-foreground ml-auto" aria-live="polite">
                      {descriptionValue?.length || 0}/500 characters
                    </p>
                  </div>
                </div>

                {/* Error Display */}
                {operations.creating.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {operations.creating.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex justify-between gap-4">
                <div className="flex gap-2">
                  {isDirty ? (
                    <ConfirmationDialog
                      title="Unsaved Changes"
                      description="You have unsaved changes. Are you sure you want to leave without saving?"
                      confirmText="Leave Without Saving"
                      cancelText="Stay Here"
                      variant="destructive"
                      onConfirm={handleConfirmCancel}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        aria-label="Cancel project creation"
                      >
                        Cancel
                      </Button>
                    </ConfirmationDialog>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      aria-label="Cancel project creation"
                    >
                      Cancel
                    </Button>
                  )}
                  
                  {isDirty && (
                    <ConfirmationDialog
                      title="Clear All Fields"
                      description="Are you sure you want to clear all fields? This will remove all entered information."
                      confirmText="Clear Fields"
                      cancelText="Keep Data"
                      variant="default"
                      onConfirm={handleReset}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSubmitting}
                        aria-label="Clear all form fields"
                      >
                        Clear
                      </Button>
                    </ConfirmationDialog>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="min-w-32"
                  aria-label={isSubmitting ? "Creating project..." : "Create new project"}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                      Create Project
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Project Setup</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use descriptive names that identify the site and assessment type</li>
              <li>• Include key location details to differentiate similar projects</li>
              <li>• The description helps team members understand project scope</li>
              <li>• You can always edit these details later from the project settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}