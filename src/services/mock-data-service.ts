import type { Product, Member, Objective, Task, WeekRange, Stats } from "@/types"
import { getWeekOptions } from "@/lib/date-utils"
import { getSpecificCurrentWeek } from "@/lib/date-utils"
import { isSameDay } from "date-fns"

// Mock products
const mockProducts: Product[] = [
  { id: "app-web", name: "Application Web (ARVEA International)" },
  { id: "app-mobile", name: "Application Mobile (ARVEA Business)" },
  { id: "arvea-shop", name: "ARVEA Shop (Le site e-commerce)" },
  { id: "arvea-data", name: "ARVEA DATA DRIVEN" },
]

// Mock members with S3 URLs - sorted alphabetically by name
const mockMembers: Member[] = [
  {
    id: "1",
    name: "Abir Ben Cheikh",
    role: "PROCESS OWNER",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/abir.jpg",
    initials: "AB",
  },
  {
    id: "2",
    name: "Ahmed Bouzayana",
    role: "CHIEF SCRUM MASTER",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/ahmed.jpg",
    initials: "AB",
  },
  {
    id: "3",
    name: "ALi Benhamed",
    role: "SYS ADMIN",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Ali+ben+Hamed.png",
    initials: "AB",
  },
  {
    id: "4",
    name: "amine kacem",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/amine+kacem.png",
    initials: "AK",
  },
  {
    id: "5",
    name: "Anouar Hamdaoui",
    role: "DESIGNER",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/anouar-hamdaoui.jpg",
    initials: "AH",
  },
  {
    id: "6",
    name: "Asma Ayari",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Amal(1).jpg",
    initials: "AA",
  },
  {
    id: "7",
    name: "Ben nasr amal",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Amal.jpg",
    initials: "BNA",
  },
  {
    id: "8",
    name: "Boughanmi Radhouen",
    role: "QA",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Radhouen.jpg",
    initials: "BR",
  },
  {
    id: "9",
    name: "Fatma Lakhal",
    role: "RH",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/fatma+lakhal.jpg",
    initials: "FL",
  },
  {
    id: "10",
    name: "Firas Ruine",
    role: "TECH LEAD",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/firas.jpg",
    initials: "FR",
  },
  {
    id: "11",
    name: "Haythem Bekir",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/haythem.jpg",
    initials: "HB",
  },
  {
    id: "12",
    name: "Haythem Benkhlifa",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Haythem.png",
    initials: "HB",
  },
  {
    id: "13",
    name: "Hsouna Rabii",
    role: "QA",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/rabii.jpeg",
    initials: "HR",
  },
  {
    id: "14",
    name: "Ichraf Moula",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/ichraf.jpg",
    initials: "IM",
  },
  {
    id: "15",
    name: "Marwa Boufaied",
    role: "RESPONSABLE FINANCE",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/marwa.jpg",
    initials: "MB",
  },
  {
    id: "16",
    name: "Med Amine Boutiti",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/boutiti.jpg",
    initials: "MA",
  },
  {
    id: "17",
    name: "Mohamed Nacer Benkhlifa",
    role: "TECH LEAD",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/naceurr.jpg",
    initials: "MNB",
  },
  {
    id: "18",
    name: "Mustapha Majed",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/mustapha.jpg",
    initials: "MM",
  },
  {
    id: "19",
    name: "Nourhen Landolsi",
    role: "QA",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/nourhen.jpg",
    initials: "NL",
  },
  {
    id: "20",
    name: "Oumaima Chemingui",
    role: "HÔTESSE D'ACCUEIL",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/oumaima.jpg",
    initials: "OC",
  },
  {
    id: "21",
    name: "Oussema Ferjeni",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/ouss.png",
    initials: "OF",
  },
  {
    id: "22",
    name: "Riadh Rezig",
    role: "CEO",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/riadh+(1).jpg",
    initials: "RR",
  },
  {
    id: "23",
    name: "Safa Mtir",
    role: "DATA ANALYST",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/safa.jpg",
    initials: "SM",
  },
  {
    id: "24",
    name: "Syrine Hamdoun",
    role: "PO",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/syrine.jpg",
    initials: "SH",
  },
  {
    id: "25",
    name: "Skander Belloum",
    role: "DATA ANALYST",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/skander.jpg",
    initials: "SB",
  },
  {
    id: "26",
    name: "Sofien Ben Brahim",
    role: "DATA ANALYST",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/sofien+ben+brahem.jpg",
    initials: "SBB",
  },
  {
    id: "27",
    name: "Souad Hamdoun",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/souad.png",
    initials: "SH",
  },
  {
    id: "28",
    name: "Wael Dghais",
    role: "DEVELOPEUR",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/wael.jpg",
    initials: "WD",
  },
  {
    id: "29",
    name: "wala dghaies",
    role: "QA",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/walaa.jpg",
    initials: "WD",
  },
  {
    id: "30",
    name: "Wafa Makhlouf",
    role: "ASSISTANTE DE DIRECTION",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/wafa.jpg",
    initials: "WM",
  },
]

// Generate all 2025 weeks for mock data
const generateMockWeekRanges = (): WeekRange[] => {
  const weekRanges = getWeekOptions(2025).map((week) => ({
    id: week.id,
    startDate: week.range.start,
    endDate: week.range.end,
    label: week.label,
  }))

  // Ensure our specific week (March 17-23, 2025) is included
  const specificWeek = getSpecificCurrentWeek()
  const hasSpecificWeek = weekRanges.some(
    (week) =>
      week.id === specificWeek.id ||
      (isSameDay(week.startDate, specificWeek.range.start) && isSameDay(week.endDate, specificWeek.range.end)),
  )

  if (!hasSpecificWeek) {
    console.log("Adding specific week (March 17-23, 2025) to mock data")
    weekRanges.push({
      id: specificWeek.id,
      startDate: specificWeek.range.start,
      endDate: specificWeek.range.end,
      label: specificWeek.label,
    })
  }

  return weekRanges
}

// Mock week ranges
const mockWeekRanges: WeekRange[] = generateMockWeekRanges()

// Mock objectives with tasks
const mockObjectives: Record<string, Objective[]> = {
  "app-web": [
    {
      id: "obj1",
      productId: "app-web",
      weekId: "current-week",
      title: "Refonte de la page d'accueil",
      progress: 50,
      tasks: [
        {
          id: "task1",
          objectiveId: "obj1",
          title: "Maquette design",
          assignee: "4",
          complexity: "medium",
          criticality: "high",
          completed: true,
        },
        {
          id: "task2",
          objectiveId: "obj1",
          title: "Intégration HTML/CSS",
          assignee: "2",
          complexity: "low",
          criticality: "medium",
          completed: false,
        },
      ],
    },
    {
      id: "obj2",
      productId: "app-web",
      weekId: "current-week",
      title: "Optimisation des performances",
      progress: 0,
      tasks: [
        {
          id: "task3",
          objectiveId: "obj2",
          title: "Audit de performance",
          assignee: "3",
          complexity: "medium",
          criticality: "medium",
          completed: false,
        },
      ],
    },
  ],
  "app-mobile": [
    {
      id: "obj3",
      productId: "app-mobile",
      weekId: "current-week",
      title: "Nouvelle fonctionnalité de notification",
      progress: 33,
      tasks: [
        {
          id: "task4",
          objectiveId: "obj3",
          title: "Conception de l'interface",
          assignee: "4",
          complexity: "medium",
          criticality: "medium",
          completed: true,
        },
        {
          id: "task5",
          objectiveId: "obj3",
          title: "Implémentation backend",
          assignee: "3",
          complexity: "high",
          criticality: "high",
          completed: false,
        },
        {
          id: "task6",
          objectiveId: "obj3",
          title: "Tests utilisateurs",
          assignee: "5",
          complexity: "low",
          criticality: "medium",
          completed: false,
        },
      ],
    },
  ],
  "arvea-shop": [],
  "arvea-data": [],
}

// Mock data service functions
export async function getMockProducts(): Promise<Product[]> {
  return mockProducts
}

export async function getMockMembers(): Promise<Member[]> {
  return mockMembers
}

// Add this function to ensure the specific week is included in mock data
function ensureSpecificWeekExists(weekRanges: WeekRange[]): WeekRange[] {
  // Import the specific week details from date-utils
  const specificWeek = getSpecificCurrentWeek()

  // Check if the specific week already exists
  const hasSpecificWeek = weekRanges.some(
    (week) =>
      week.id === specificWeek.id ||
      (isSameDay(week.startDate, specificWeek.range.start) && isSameDay(week.endDate, specificWeek.range.end)),
  )

  if (!hasSpecificWeek) {
    console.log("Adding specific week (March 17-23, 2025) to mock data")
    weekRanges.push({
      id: specificWeek.id,
      startDate: specificWeek.range.start,
      endDate: specificWeek.range.end,
      label: specificWeek.label,
    })
  }

  return weekRanges
}

// Update the getMockWeekRanges function to include the specific week
export async function getMockWeekRanges(): Promise<WeekRange[]> {
  // Generate mock week ranges
  const weekRanges = generateMockWeekRanges()

  // Ensure the specific week exists
  return ensureSpecificWeekExists(weekRanges)
}

// Update the getMockObjectives function to better handle the current week

// Modify the getMockObjectives function to better handle "current-week":

// Update the getMockObjectives function to sort by position
export async function getMockObjectives(productId: string, weekId: string): Promise<Objective[]> {
  console.log(`Getting mock objectives for product ${productId} and week ${weekId}`)

  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // For the specific week (March 17-23, 2025), return all 11 objectives
  if (weekId === "week-2025-3-17" || weekId === "current-week") {
    console.log(`Returning all 11 objectives for ${weekId}`)

    // Generate 11 objectives with tasks
    const objectives: Objective[] = []

    for (let i = 1; i <= 11; i++) {
      const objective: Objective = {
        id: `obj-${i}-${weekId}`,
        title: `Objective ${i} for ${weekId}`,
        description: `This is a mock objective ${i} for testing the shared plan functionality`,
        productId,
        weekId,
        progress: Math.floor(Math.random() * 100),
        position: i,
        tasks: [],
      }

      // Add 2-5 tasks per objective
      const taskCount = 2 + Math.floor(Math.random() * 4)
      for (let j = 1; j <= taskCount; j++) {
        objective.tasks.push({
          id: `task-${i}-${j}-${weekId}`,
          title: `Task ${j} for Objective ${i}`,
          description: `This is a mock task for testing`,
          objectiveId: objective.id,
          assignee: `${((i + j) % 30) + 1}`, // Assign to a random team member
          complexity: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as any,
          criticality: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as any,
          completed: Math.random() > 0.5,
          position: j,
        })
      }

      objectives.push(objective)
    }

    return objectives
  }

  // For other weeks, return a smaller set of objectives
  const objectives: Objective[] = []

  for (let i = 1; i <= 5; i++) {
    const objective: Objective = {
      id: `obj-${i}-${weekId}`,
      title: `Objective ${i} for ${weekId}`,
      description: `This is a mock objective ${i} for testing`,
      productId,
      weekId,
      progress: Math.floor(Math.random() * 100),
      position: i,
      tasks: [],
    }

    // Add 1-3 tasks per objective
    const taskCount = 1 + Math.floor(Math.random() * 3)
    for (let j = 1; j <= taskCount; j++) {
      objective.tasks.push({
        id: `task-${i}-${j}-${weekId}`,
        title: `Task ${j} for Objective ${i}`,
        description: `This is a mock task for testing`,
        objectiveId: objective.id,
        assignee: `${((i + j) % 30) + 1}`, // Assign to a random team member
        complexity: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as any,
        criticality: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as any,
        completed: Math.random() > 0.5,
        position: j,
      })
    }

    objectives.push(objective)
  }

  return objectives
}

export async function getMockStatistics(productId: string, weekId: string): Promise<Stats> {
  const objectives = mockObjectives[productId] || []

  const totalObjectives = objectives.length
  const totalTasks = objectives.reduce((acc, obj) => acc + obj.tasks.length, 0)
  const completedTasks = objectives.reduce((acc, obj) => acc + obj.tasks.filter((task) => task.completed).length, 0)
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Member stats
  const memberStats: Record<string, { total: number; completed: number }> = {}

  objectives.forEach((obj) => {
    obj.tasks.forEach((task) => {
      if (task.assignee) {
        memberStats[task.assignee] = memberStats[task.assignee] || { total: 0, completed: 0 }
        memberStats[task.assignee].total += 1
        if (task.completed) {
          memberStats[task.assignee].completed += 1
        }
      }
    })
  })

  return {
    totalObjectives,
    totalTasks,
    completedTasks,
    globalProgress,
    memberStats,
  }
}

// Mock CRUD operations
// Modify the addMockObjective function to include position
export async function addMockObjective(objective: Omit<Objective, "id" | "tasks">): Promise<string> {
  const id = `obj-${Date.now()}`

  // Get the highest position value for objectives in this product and week
  let maxPosition = 0
  if (mockObjectives[objective.productId]) {
    mockObjectives[objective.productId].forEach((obj) => {
      if (obj.position !== undefined && obj.position > maxPosition) {
        maxPosition = obj.position
      }
    })
  }

  const newObjective: Objective = {
    id,
    ...objective,
    position: objective.position !== undefined ? objective.position : maxPosition + 1, // Use provided position or set to be after the last objective
    tasks: [],
    progress: 0,
    targetCompletionDate: objective.targetCompletionDate || null, // Add target completion date
  }

  if (!mockObjectives[objective.productId]) {
    mockObjectives[objective.productId] = []
  }

  mockObjectives[objective.productId].push(newObjective)
  return id
}

export async function updateMockObjective(objectiveId: string, objectiveUpdate: Partial<Objective>): Promise<void> {
  // Find and update the objective
  for (const productId in mockObjectives) {
    const objectiveIndex = mockObjectives[productId].findIndex((obj) => obj.id === objectiveId)
    if (objectiveIndex !== -1) {
      mockObjectives[productId][objectiveIndex] = {
        ...mockObjectives[productId][objectiveIndex],
        ...objectiveUpdate,
      }
      return
    }
  }
}

export async function deleteMockObjective(objectiveId: string): Promise<void> {
  for (const productId in mockObjectives) {
    mockObjectives[productId] = mockObjectives[productId].filter((obj) => obj.id !== objectiveId)
  }
}

// Modify the addMockTask function to include position
export async function addMockTask(task: Omit<Task, "id">): Promise<string> {
  const id = `task-${Date.now()}`

  // Find the objective
  let objective
  for (const productId in mockObjectives) {
    objective = mockObjectives[productId].find((obj) => obj.id === task.objectiveId)
    if (objective) break
  }

  // Get the highest position value for tasks in this objective
  let maxPosition = 0
  if (objective && objective.tasks) {
    objective.tasks.forEach((t) => {
      if (t.position !== undefined && t.position > maxPosition) {
        maxPosition = t.position
      }
    })
  }

  const newTask: Task = {
    id,
    ...task,
    position: task.position !== undefined ? task.position : maxPosition + 1, // Use provided position or set to be after the last task
    completed: false,
  }

  // Find the objective and add the task
  for (const productId in mockObjectives) {
    const objective = mockObjectives[productId].find((obj) => obj.id === task.objectiveId)
    if (objective) {
      objective.tasks.push(newTask)

      // Update progress
      const completedTasks = objective.tasks.filter((t) => t.completed).length
      objective.progress = Math.round((completedTasks / objective.tasks.length) * 100)
      break
    }
  }

  return id
}

export async function updateMockTask(id: string, taskUpdate: Partial<Task>): Promise<void> {
  // Find and update the task
  for (const productId in mockObjectives) {
    for (const objective of mockObjectives[productId]) {
      const taskIndex = objective.tasks.findIndex((t) => t.id === id)
      if (taskIndex !== -1) {
        objective.tasks[taskIndex] = {
          ...objective.tasks[taskIndex],
          ...taskUpdate,
        }

        // Update progress
        const completedTasks = objective.tasks.filter((t) => t.completed).length
        objective.progress = Math.round((completedTasks / objective.tasks.length) * 100)
        return
      }
    }
  }
}

export async function deleteMockTask(id: string): Promise<void> {
  // Find and delete the task
  for (const productId in mockObjectives) {
    for (const objective of mockObjectives[productId]) {
      const initialLength = objective.tasks.length
      objective.tasks = objective.tasks.filter((t) => t.id !== id)

      // If we removed a task, update the progress
      if (objective.tasks.length < initialLength) {
        const completedTasks = objective.tasks.filter((t) => t.completed).length
        objective.progress =
          objective.tasks.length > 0 ? Math.round((completedTasks / objective.tasks.length) * 100) : 0
        return
      }
    }
  }
}

// Add these functions to your mock-data-service.ts file

export async function updateMockObjectivePositions(objectives: Objective[]): Promise<void> {
  // Update positions in the mock data
  for (const objective of objectives) {
    for (const productId in mockObjectives) {
      const objectiveIndex = mockObjectives[productId].findIndex((obj) => obj.id === objective.id)
      if (objectiveIndex !== -1) {
        mockObjectives[productId][objectiveIndex].position = objective.position
      }
    }
  }

  // Return a resolved promise to match the Firebase interface
  return Promise.resolve()
}

export async function updateMockTaskPositions(tasks: Task[]): Promise<void> {
  // Group tasks by objective to make updates more efficient
  const tasksByObjective: Record<string, Task[]> = {}

  tasks.forEach((task) => {
    if (!tasksByObjective[task.objectiveId]) {
      tasksByObjective[task.objectiveId] = []
    }
    tasksByObjective[task.objectiveId].push(task)
  })

  // Update positions in the mock data
  for (const objectiveId in tasksByObjective) {
    const tasksToUpdate = tasksByObjective[objectiveId]

    for (const productId in mockObjectives) {
      const objective = mockObjectives[productId].find((obj) => obj.id === objectiveId)
      if (objective) {
        tasksToUpdate.forEach((task) => {
          const taskIndex = objective.tasks.findIndex((t) => t.id === task.id)
          if (taskIndex !== -1) {
            objective.tasks[taskIndex].position = task.position
          }
        })
      }
    }
  }

  // Return a resolved promise to match the Firebase interface
  return Promise.resolve()
}

// Mock clone objective function
export async function cloneMockObjective(objectiveId: string, targetWeekId: string): Promise<string | null> {
  try {
    console.log(`Cloning mock objective ${objectiveId} to week ${targetWeekId}`)

    // Find the source objective across all products
    let sourceObjective: any = null
    let sourceProductId: string | null = null

    for (const productId in mockObjectives) {
      const objective = mockObjectives[productId].find((obj) => obj.id === objectiveId)
      if (objective) {
        sourceObjective = objective
        sourceProductId = productId
        break
      }
    }

    if (!sourceObjective || !sourceProductId) {
      console.error(`Source objective ${objectiveId} not found`)
      return null
    }

    // Create a new objective ID
    const clonedObjectiveId = `obj-${Date.now()}`

    // Get max position for the target week in the same product
    const productObjectives = mockObjectives[sourceProductId] || []
    const targetWeekObjectives = productObjectives.filter((obj) => obj.weekId === targetWeekId)
    let maxPosition = 0
    targetWeekObjectives.forEach((obj) => {
      if (obj.position > maxPosition) {
        maxPosition = obj.position
      }
    })

    // Clone the objective
    const clonedObjective = {
      ...sourceObjective,
      id: clonedObjectiveId,
      weekId: targetWeekId,
      progress: 0, // Reset progress
      position: maxPosition + 1, // Position at the end
      tasks: sourceObjective.tasks.map((task: any, index: number) => ({
        ...task,
        id: `task-${Date.now()}-${index}`,
        objectiveId: clonedObjectiveId,
        completed: false, // Reset completion status
        position: index,
      })),
    }

    // Add to mock data
    if (!mockObjectives[sourceProductId]) {
      mockObjectives[sourceProductId] = []
    }
    mockObjectives[sourceProductId].push(clonedObjective)

    console.log("Mock objective cloned successfully:", clonedObjectiveId)
    return clonedObjectiveId
  } catch (error) {
    console.error("Error cloning mock objective:", error)
    return null
  }
}
