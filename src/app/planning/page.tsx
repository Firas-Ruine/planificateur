"use client"

import { useState } from "react"
import { WeekSelector } from "@/components/week-selector"
import { ProductSelector, products } from "@/components/product-selector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ListPlus } from "lucide-react"

// Mock data
const mockTeamMembers = [
  { id: "1", name: "Alex Dubois", avatar: "/placeholder.svg?height=40&width=40", initials: "AD" },
  { id: "2", name: "Marie Laurent", avatar: "/placeholder.svg?height=40&width=40", initials: "ML" },
  { id: "3", name: "Thomas Petit", avatar: "/placeholder.svg?height=40&width=40", initials: "TP" },
  { id: "4", name: "Sophie Martin", avatar: "/placeholder.svg?height=40&width=40", initials: "SM" },
]

interface Objective {
  id: string
  title: string
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  assignee: string
  complexity: string
  criticality: string
}

export default function PlanningPage() {
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  })
  const [selectedProduct, setSelectedProduct] = useState("app-web")
  const [objectives, setObjectives] = useState<Record<string, Objective[]>>({
    "app-web": [
      {
        id: "obj1",
        title: "Refonte de la page d'accueil",
        tasks: [
          {
            id: "task1",
            title: "Maquette design",
            assignee: "1",
            complexity: "medium",
            criticality: "high",
          },
          {
            id: "task2",
            title: "Intégration HTML/CSS",
            assignee: "2",
            complexity: "low",
            criticality: "medium",
          },
        ],
      },
    ],
    "app-mobile": [],
    "arvea-shop": [],
    "arvea-data": [],
  })

  const [newObjectiveTitle, setNewObjectiveTitle] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState("")
  const [newTaskComplexity, setNewTaskComplexity] = useState("medium")
  const [newTaskCriticality, setNewTaskCriticality] = useState("medium")
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null)
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  const handleWeekChange = (startDate: Date, endDate: Date) => {
    setSelectedWeek({ start: startDate, end: endDate })
  }

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId)
  }

  const handleAddObjective = () => {
    if (!newObjectiveTitle.trim()) return

    const newObjective: Objective = {
      id: `obj-${Date.now()}`,
      title: newObjectiveTitle,
      tasks: [],
    }

    setObjectives((prev) => ({
      ...prev,
      [selectedProduct]: [...(prev[selectedProduct] || []), newObjective],
    }))

    setNewObjectiveTitle("")
    setIsObjectiveDialogOpen(false)
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedObjective || !newTaskAssignee) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      assignee: newTaskAssignee,
      complexity: newTaskComplexity,
      criticality: newTaskCriticality,
    }

    setObjectives((prev) => {
      const updatedObjectives = [...(prev[selectedProduct] || [])]
      const objectiveIndex = updatedObjectives.findIndex((obj) => obj.id === selectedObjective)

      if (objectiveIndex !== -1) {
        updatedObjectives[objectiveIndex] = {
          ...updatedObjectives[objectiveIndex],
          tasks: [...updatedObjectives[objectiveIndex].tasks, newTask],
        }
      }

      return {
        ...prev,
        [selectedProduct]: updatedObjectives,
      }
    })

    setNewTaskTitle("")
    setNewTaskAssignee("")
    setIsTaskDialogOpen(false)
  }

  const handleDeleteObjective = (objectiveId: string) => {
    setObjectives((prev) => {
      const updatedObjectives = (prev[selectedProduct] || []).filter((obj) => obj.id !== objectiveId)

      return {
        ...prev,
        [selectedProduct]: updatedObjectives,
      }
    })
  }

  const handleDeleteTask = (objectiveId: string, taskId: string) => {
    setObjectives((prev) => {
      const updatedObjectives = [...(prev[selectedProduct] || [])]
      const objectiveIndex = updatedObjectives.findIndex((obj) => obj.id === objectiveId)

      if (objectiveIndex !== -1) {
        updatedObjectives[objectiveIndex] = {
          ...updatedObjectives[objectiveIndex],
          tasks: updatedObjectives[objectiveIndex].tasks.filter((task) => task.id !== taskId),
        }
      }

      return {
        ...prev,
        [selectedProduct]: updatedObjectives,
      }
    })
  }

  const currentProductName = products.find((p) => p.id === selectedProduct)?.name || ""
  const currentObjectives = objectives[selectedProduct] || []

  const getComplexityBadge = (complexity: string) => {
    switch (complexity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Facile
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Moyenne
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Complexe
          </Badge>
        )
      default:
        return null
    }
  }

  const getCriticalityBadge = (criticality: string) => {
    switch (criticality) {
      case "low":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Basse
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Moyenne
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Haute
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Planification</h1>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <WeekSelector onWeekChange={handleWeekChange} />
          <ProductSelector onProductChange={handleProductChange} />
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{currentProductName}</h2>
        <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un objectif
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel objectif</DialogTitle>
              <DialogDescription>Définissez un objectif pour la semaine sélectionnée.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="objective-title">Titre de l'objectif</Label>
                <Textarea
                  id="objective-title"
                  placeholder="Décrivez l'objectif à atteindre"
                  value={newObjectiveTitle}
                  onChange={(e) => setNewObjectiveTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsObjectiveDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddObjective}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {currentObjectives.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun objectif défini pour ce produit cette semaine.</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsObjectiveDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un objectif
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {currentObjectives.map((objective) => (
            <Card key={objective.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{objective.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteObjective(objective.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Supprimer l'objectif</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {objective.tasks.map((task) => {
                    const assignee = mockTeamMembers.find((m) => m.id === task.assignee)

                    return (
                      <div key={task.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={assignee?.avatar} alt={assignee?.name} />
                            <AvatarFallback>{assignee?.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{assignee?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2">
                            {getComplexityBadge(task.complexity)}
                            {getCriticalityBadge(task.criticality)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(objective.id, task.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Supprimer la tâche</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full" onClick={() => setSelectedObjective(objective.id)}>
                        <ListPlus className="mr-2 h-4 w-4" />
                        Ajouter une tâche
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter une nouvelle tâche</DialogTitle>
                        <DialogDescription>Définissez une tâche pour l'objectif sélectionné.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="task-title">Titre de la tâche</Label>
                          <Input
                            id="task-title"
                            placeholder="Décrivez la tâche à réaliser"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="task-assignee">Membre assigné</Label>
                          <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                            <SelectTrigger id="task-assignee">
                              <SelectValue placeholder="Sélectionner un membre" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockTeamMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="task-complexity">Complexité</Label>
                            <Select value={newTaskComplexity} onValueChange={setNewTaskComplexity}>
                              <SelectTrigger id="task-complexity">
                                <SelectValue placeholder="Complexité" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Facile</SelectItem>
                                <SelectItem value="medium">Moyenne</SelectItem>
                                <SelectItem value="high">Complexe</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="task-criticality">Criticité</Label>
                            <Select value={newTaskCriticality} onValueChange={setNewTaskCriticality}>
                              <SelectTrigger id="task-criticality">
                                <SelectValue placeholder="Criticité" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Basse</SelectItem>
                                <SelectItem value="medium">Moyenne</SelectItem>
                                <SelectItem value="high">Haute</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleAddTask}>Ajouter</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
