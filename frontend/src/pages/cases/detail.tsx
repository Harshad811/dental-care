import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ArrowLeft, Check, Circle, User, Stethoscope } from "lucide-react"
import PageHeader from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { casesApi, consultantsApi } from "@/services/endpoints"
import type { Case, PaginatedResponse, ConsultantNote } from "@/types"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive" | "success" | "warning"> = {
  OPEN: "default",
  IN_DIAGNOSIS: "warning",
  IN_TREATMENT: "secondary",
  FOLLOW_UP: "outline",
  CLOSED: "success",
}

const timelineSteps = [
  { key: "CREATED", label: "Created" },
  { key: "DIAGNOSIS", label: "Diagnosis" },
  { key: "TREATMENT_PLAN", label: "Treatment Plan" },
  { key: "PRE_OP", label: "Pre-Op" },
  { key: "TREATMENT", label: "Treatment" },
  { key: "POST_OP", label: "Post-Op" },
  { key: "COMPLETED", label: "Completed" },
]

const statusToStepIndex: Record<string, number> = {
  OPEN: 0,
  IN_DIAGNOSIS: 1,
  IN_TREATMENT: 4,
  FOLLOW_UP: 5,
  CLOSED: 6,
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: caseData, isLoading } = useQuery<Case>({
    queryKey: ["case", id],
    queryFn: () => casesApi.get(id!),
    enabled: !!id,
  })

  const { data: notesData } = useQuery({
    queryKey: ["case-notes", id],
    queryFn: () => consultantsApi.list({ case_id: id }),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Case not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/cases")}>
          Back to Cases
        </Button>
      </div>
    )
  }

  const currentStepIndex = statusToStepIndex[caseData.status] ?? 0
  const notes: ConsultantNote[] = notesData?.items || notesData || []

  return (
    <div className="space-y-6">
      <PageHeader title="">
        <Button variant="outline" onClick={() => navigate("/cases")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">
                  {caseData.patient?.full_name || "Patient"}
                </h2>
                <Badge variant={statusVariant[caseData.status] || "default"}>
                  {caseData.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Case ID: {caseData.id.slice(0, 8)}... | Created{" "}
                {format(new Date(caseData.created_at), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    index < currentStepIndex
                      ? "border-green-500 bg-green-500 text-white"
                      : index === currentStepIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground/50"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 fill-current" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                    index <= currentStepIndex
                      ? "text-foreground"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </span>
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`absolute mt-4 h-0.5 w-full ${
                      index < currentStepIndex
                        ? "bg-green-500"
                        : "bg-muted-foreground/20"
                    }`}
                    style={{
                      width: "calc(100% - 2rem)",
                      marginLeft: "1rem",
                      marginTop: "-0.75rem",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
          <TabsTrigger value="consultant-notes">Consultant Notes</TabsTrigger>
          <TabsTrigger value="pre-op">Pre-Op</TabsTrigger>
          <TabsTrigger value="post-op">Post-Op</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Chief Complaint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{caseData.chief_complaint}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {caseData.diagnosis || "No diagnosis recorded yet."}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Assigned Doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {caseData.doctor?.full_name || "Not assigned"}
                </p>
                {caseData.doctor?.email && (
                  <p className="text-xs text-muted-foreground">{caseData.doctor.email}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" /> Consultant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {caseData.consultant?.full_name || "Not assigned"}
                </p>
                {caseData.consultant?.specialization && (
                  <p className="text-xs text-muted-foreground">
                    {caseData.consultant.specialization}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="treatment-plans" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Treatment plans will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultant-notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Consultant Notes ({notes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No consultant notes yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {note.consultant?.full_name || "Consultant"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), "MMM dd, yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pre-op" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Pre-op information will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post-op" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Post-op information will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Billing information will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
