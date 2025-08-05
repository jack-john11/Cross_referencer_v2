"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { useProjectManagementStore, useCurrentProject } from '@/lib/stores/project-management'
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Form validation schema, identical to the create page for consistency
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

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const projectId = params.id as string
  const { getProject, updateProject, operations } = useProjectManagementStore()
  const currentProject = useCurrentProject()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    mode: 'onChange'
  })

  // Data fetching and form population
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return

      setIsLoading(true)
      try {
        // Prefer using the already loaded currentProject if it matches
        const projectToLoad = currentProject?.id === projectId 
          ? currentProject 
          : await getProject(projectId)

        if (projectToLoad) {
          reset({
            name: projectToLoad.name,
            description: projectToLoad.description || '',
            location: projectToLoad.location,
          })
        } else {
          toast({
            title: 'Error',
            description: 'Project not found.',
            variant: 'destructive',
          })
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to load project:', error)
        toast({
          title: 'Error loading project',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
          variant: 'destructive',
        })
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    loadProject()
  }, [projectId, getProject, reset, router, toast, currentProject])

  const onSubmit = useCallback(async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      await updateProject(projectId, data as any) // TODO: Fix type definition mismatch between form and API
      toast({
        title: "Project Updated",
        description: `"${data.name}" has been updated successfully.`,
        variant: "default",
      })
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error("Failed to update project", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [projectId, updateProject, router, toast])

  const handleCancel = useCallback(() => {
    router.push(`/projects/${projectId}`)
  }, [router, projectId])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
      <Header variant="authenticated" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${projectId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Project</h1>
              <p className="text-muted-foreground mt-1">
                Update the details for your ecological assessment project.
              </p>
            </div>
          </div>

          {/* Edit Form */}
          <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Modify the project information below. Changes will be saved upon submission.
                </CardDescription>
              </CardHeader>
              
              {isLoading ? (
                <CardContent>
                  <div className="flex items-center justify-center p-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="ml-4 text-muted-foreground">Loading project details...</p>
                  </div>
                </CardContent>
              ) : (
                <>
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
                          {watch('name')?.length || 0}/100 characters
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
                          {watch('location')?.length || 0}/200 characters
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
                          {watch('description')?.length || 0}/500 characters
                        </p>
                      </div>
                    </div>

                    {/* Error Display */}
                    {operations.updating.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {operations.updating.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between gap-4">
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
                      disabled={!isDirty || !isValid || isSubmitting}
                      className="min-w-36"
                      aria-label={isSubmitting ? "Saving changes..." : "Save project changes"}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
