"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { updateTask } from "@/services/firebase-service"
import type { Objective, Task } from "@/types"

interface ObjectiveDetailProps {
  objective: Objective
}

export function ObjectiveDetail({ objective }: ObjectiveDetailProps) {
  const [tasks, setTasks] = useState<Task[]>(objective.tasks)
  const [progress, setProgress] = useState(objective.progress)

  async function handleTaskToggle(task: Task) {
    try {
      const updatedTask = { ...task, completed: !task.completed }
      await updateTask(task.id, { completed: updatedTask.completed })

      // Update local state
      const updatedTasks = tasks.map((t) => (t.id === task.id ? updatedTask : t))
      setTasks(updatedTasks)

      // Calculate new progress
      const completedCount = updatedTasks.filter((t) => t.completed).length
      const newProgress = Math.round((completedCount / updatedTasks.length) * 100)
      setProgress(newProgress)
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{objective.title}</CardTitle>
        <div className="flex items-center mt-2">
          <Progress value={progress} className="h-2 flex-1 mr-4" />
          <span className="text-sm font-medium">{progress}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Description</h3>
          <p className="text-muted-foreground">{objective.description || "No description provided."}</p>

          <h3 className="text-lg font-medium mt-6">Tasks</h3>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">No tasks for this objective.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-2">
                  <Checkbox id={task.id} checked={task.completed} onCheckedChange={() => handleTaskToggle(task)} />
                  <div className="grid gap-1.5">
                    <label
                      htmlFor={task.id}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </label>
                    {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
