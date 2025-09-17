import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type {
  Product,
  Member,
  Objective,
  Task,
  WeekRange,
  ComplexityLevel,
  CriticalityLevel,
  TeamMember,
} from "@/types"
import {
  getWeekOptions,
  getWeekId,
  getCurrentWeekRange,
  formatDateRange,
  getSpecificCurrentWeek,
  isSameDay,
} from "@/lib/date-utils"

// Add this at the top of the file, after the imports
const DEBUG = true

// Collections
const COLLECTIONS = {
  PRODUCTS: "products",
  MEMBERS: "members",
  OBJECTIVES: "objectives",
  TASKS: "tasks",
  WEEK_RANGES: "weekRanges",
  COMPLEXITY_LEVELS: "complexityLevels",
  CRITICALITY_LEVELS: "criticalityLevels",
}

// Add this function to the firebase-service.ts file to handle timeouts in Firebase operations

/**
 * Wraps a Firebase operation with a timeout to prevent hanging
 * @param operation The Firebase operation to perform
 * @param timeoutMs The timeout in milliseconds
 * @param operationName Name of the operation for logging
 * @returns The result of the operation
 */
async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs = 10000,
  operationName = "Firebase operation",
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  return Promise.race([operation, timeoutPromise])
}

// Produits (Projets)
export async function getProducts(): Promise<Product[]> {
  try {
    const productsCollection = collection(db, COLLECTIONS.PRODUCTS)
    const productsSnapshot = await withTimeout(getDocs(productsCollection), 10000, "Getting products")

    return productsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    )
  } catch (error) {
    console.error("Error getting products:", error)
    // Return empty array instead of throwing
    return []
  }
}

export async function addProduct(product: Omit<Product, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
    ...product,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
  await updateDoc(docRef, {
    ...product,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProduct(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
  await deleteDoc(docRef)
}

// Membres (Utilisateurs)
export async function getMembers(): Promise<Member[]> {
  try {
    const membersCollection = collection(db, COLLECTIONS.MEMBERS)
    const membersSnapshot = await withTimeout(getDocs(membersCollection), 10000, "Getting members")

    return membersSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Member,
    )
  } catch (error) {
    console.error("Error getting members:", error)
    // Return empty array instead of throwing
    return []
  }
}

// Add this function to get team members in the format expected by components
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const members = await getMembers()

    // Transform Member objects to TeamMember format
    return members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      avatarUrl: member.avatar,
      initials: member.initials,
    }))
  } catch (error) {
    console.error("Error getting team members:", error)
    return []
  }
}

export async function addMember(member: Omit<Member, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), {
    ...member,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateMember(id: string, member: Partial<Member>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.MEMBERS, id)
  await updateDoc(docRef, {
    ...member,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteMember(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.MEMBERS, id)
  await deleteDoc(docRef)
}

// Semaines
export async function getWeekRanges(): Promise<WeekRange[]> {
  try {
    const weekRangesCollection = collection(db, COLLECTIONS.WEEK_RANGES)
    const weekRangesSnapshot = await withTimeout(getDocs(weekRangesCollection), 10000, "Getting week ranges")

    return weekRangesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        label: data.label,
      } as WeekRange
    })
  } catch (error) {
    console.error("Error getting week ranges:", error)
    // Return empty array instead of throwing
    return []
  }
}

export async function addWeekRange(weekRange: Omit<WeekRange, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.WEEK_RANGES), {
    startDate: Timestamp.fromDate(weekRange.startDate),
    endDate: Timestamp.fromDate(weekRange.endDate),
    label: weekRange.label,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

// Add this function to the firebase-service.ts file
// This should be placed with the other week-related functions

export async function createWeekRangesFor2025(): Promise<void> {
  const batch = writeBatch(db)
  const weekOptions = getWeekOptions(2025)

  for (const week of weekOptions) {
    const weekId = week.id
    const weekRef = doc(db, COLLECTIONS.WEEK_RANGES, weekId)

    batch.set(weekRef, {
      startDate: Timestamp.fromDate(week.range.start),
      endDate: Timestamp.fromDate(week.range.end),
      label: week.label,
      createdAt: serverTimestamp(),
    })
  }

  await batch.commit()
}

// Niveaux de complexité
export async function getComplexityLevels(): Promise<ComplexityLevel[]> {
  const complexityCollection = collection(db, COLLECTIONS.COMPLEXITY_LEVELS)
  const complexitySnapshot = await getDocs(complexityCollection)
  return complexitySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as ComplexityLevel,
  )
}

// Niveaux de criticité
export async function getCriticalityLevels(): Promise<CriticalityLevel[]> {
  const criticalityCollection = collection(db, COLLECTIONS.CRITICALITY_LEVELS)
  const criticalitySnapshot = await getDocs(criticalityCollection)
  return criticalitySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as CriticalityLevel,
  )
}

// Objectifs
// Modify the getObjectives function to sort by position
export async function getObjectives(productId: string, weekId: string): Promise<Objective[]> {
  console.log(`Getting objectives for product ${productId} and week ${weekId}`)

  try {
    // Create a query that strictly filters by productId and weekId
    const objectivesCollection = collection(db, COLLECTIONS.OBJECTIVES)
    const q = query(objectivesCollection, where("productId", "==", productId), where("weekId", "==", weekId))

    const objectivesSnapshot = await withTimeout(
      getDocs(q),
      15000,
      `Getting objectives for product ${productId} and week ${weekId}`,
    )

    // Map the documents to Objective objects
    const objectives = objectivesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          tasks: [], // Tasks will be loaded separately
        }) as Objective,
    )

    console.log(`Found ${objectives.length} objectives for product ${productId} and week ${weekId}`)

    // Load tasks for each objective
    for (const objective of objectives) {
      try {
        objective.tasks = await withTimeout(
          getTasksForObjective(objective.id),
          10000,
          `Getting tasks for objective ${objective.id}`,
        )
      } catch (error) {
        console.error(`Error loading tasks for objective ${objective.id}:`, error)
        objective.tasks = [] // Set empty tasks array on error
      }
    }

    // Sort objectives by position
    return objectives.sort((a, b) => (a.position || 0) - (b.position || 0))
  } catch (error) {
    console.error(`Error in getObjectives for product ${productId} and week ${weekId}:`, error)
    return [] // Return empty array on error
  }
}

// Add this new function to the firebase-service.ts file

/**
 * Gets objectives for a product and week with exact matching to ensure consistency
 * between the main plans view and the shared plan view
 *
 * @param productId The product ID
 * @param weekId The week ID (can be null if using date range directly)
 * @param startDate The start date of the week (can be null if using weekId directly)
 * @param endDate The end date of the week (can be null if using weekId directly)
 * @returns An array of objectives with their tasks
 */
export async function getObjectivesExact(
  productId: string,
  weekId: string | null,
  startDate: Date | null,
  endDate: Date | null,
): Promise<Objective[]> {
  console.log(`Getting exact objectives for product ${productId} and week ${weekId || "using date range"}`)

  try {
    const objectivesCollection = collection(db, COLLECTIONS.OBJECTIVES)
    let q

    if (weekId) {
      // If we have a weekId, use it for the primary query - strict filtering
      q = query(objectivesCollection, where("productId", "==", productId), where("weekId", "==", weekId))

      console.log(`Querying with strict weekId filter: ${weekId}`)
    } else if (startDate && endDate) {
      // If we have a date range but no weekId, generate a weekId from the date range
      const year = startDate.getFullYear()
      const month = startDate.getMonth() + 1
      const day = startDate.getDate()
      const generatedWeekId = `week-${year}-${month}-${day}`

      console.log(`Generated weekId from date range: ${generatedWeekId}`)
      q = query(objectivesCollection, where("productId", "==", productId), where("weekId", "==", generatedWeekId))
    } else {
      // Fallback to getting objectives for the product with current-week
      console.log(`No weekId or date range provided, using current-week`)
      q = query(objectivesCollection, where("productId", "==", productId), where("weekId", "==", "current-week"))
    }

    const objectivesSnapshot = await withTimeout(
      getDocs(q),
      15000,
      `Getting exact objectives for product ${productId} and week ${weekId || "using date range"}`,
    )

    const objectives = objectivesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          tasks: [], // Tasks will be loaded separately
        }) as Objective,
    )

    console.log(`Found ${objectives.length} objectives with strict filtering`)

    // Load tasks for each objective
    for (const objective of objectives) {
      try {
        objective.tasks = await withTimeout(
          getTasksForObjective(objective.id),
          10000,
          `Getting tasks for objective ${objective.id}`,
        )
      } catch (error) {
        console.error(`Error loading tasks for objective ${objective.id}:`, error)
        objective.tasks = [] // Set empty tasks array on error
      }
    }

    // Sort objectives by position
    return objectives.sort((a, b) => (a.position || 0) - (b.position || 0))
  } catch (error) {
    console.error(
      `Error in getObjectivesExact for product ${productId} and week ${weekId || "using date range"}:`,
      error,
    )
    return []
  }
}

// Add this function to get a single objective by ID
export async function getObjectiveById(id: string): Promise<Objective | null> {
  try {
    const objectiveRef = doc(db, COLLECTIONS.OBJECTIVES, id)
    const objectiveDoc = await getDoc(objectiveRef)

    if (!objectiveDoc.exists()) {
      return null
    }

    return {
      id: objectiveDoc.id,
      ...objectiveDoc.data(),
      tasks: [], // Tasks will be loaded separately
    } as Objective
  } catch (error) {
    console.error(`Error getting objective by ID ${id}:`, error)
    return null
  }
}

// Modify the addObjective function to include position and targetCompletionDate
export async function addObjective(
  objective: Omit<Objective, "id" | "tasks"> & { tasks?: Omit<Task, "id">[] },
): Promise<string> {
  const batch = writeBatch(db)

  // Get the highest position value
  const objectivesCollection = collection(db, COLLECTIONS.OBJECTIVES)
  const q = query(
    objectivesCollection,
    where("productId", "==", objective.productId),
    where("weekId", "==", objective.weekId),
  )
  const objectivesSnapshot = await getDocs(q)

  let maxPosition = 0
  objectivesSnapshot.docs.forEach((doc) => {
    const data = doc.data()
    if (data.position && data.position > maxPosition) {
      maxPosition = data.position
    }
  })

  // Créer l'objectif sans les tâches
  const { tasks, ...objectiveData } = objective
  const objectiveRef = doc(collection(db, COLLECTIONS.OBJECTIVES))
  batch.set(objectiveRef, {
    ...objectiveData,
    position: maxPosition + 1, // Set position to be after the last objective
    progress: 0,
    createdAt: serverTimestamp(),
    targetCompletionDate: objective.targetCompletionDate ? Timestamp.fromDate(objective.targetCompletionDate) : null, // Add target completion date
  })

  // Ajouter les tâches si elles existent
  if (tasks && tasks.length > 0) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const taskRef = doc(collection(db, COLLECTIONS.TASKS))
      batch.set(taskRef, {
        ...task,
        objectiveId: objectiveRef.id,
        position: i, // Set position based on array index
        completed: false,
        createdAt: serverTimestamp(),
      })
    }
  }

  await batch.commit()
  return objectiveRef.id
}

// Modify the updateObjective function to include targetCompletionDate
export async function updateObjective(id: string, objective: Partial<Objective>): Promise<void> {
  const { tasks, ...objectiveData } = objective
  const docRef = doc(db, COLLECTIONS.OBJECTIVES, id)
  await updateDoc(docRef, {
    ...objectiveData,
    updatedAt: serverTimestamp(),
    targetCompletionDate: objective.targetCompletionDate ? Timestamp.fromDate(objective.targetCompletionDate) : null, // Add target completion date
  })
}

export async function deleteObjective(id: string): Promise<void> {
  const batch = writeBatch(db)

  // Supprimer l'objectif
  const objectiveRef = doc(db, COLLECTIONS.OBJECTIVES, id)
  batch.delete(objectiveRef)

  // Supprimer toutes les tâches associées
  const tasks = await getTasksForObjective(id)
  for (const task of tasks) {
    const taskRef = doc(db, COLLECTIONS.TASKS, task.id)
    batch.delete(taskRef)
  }

  await batch.commit()
}

// Tâches
// Modify the getTasksForObjective function to sort by position
export async function getTasksForObjective(objectiveId: string): Promise<Task[]> {
  try {
    const tasksCollection = collection(db, COLLECTIONS.TASKS)
    const q = query(tasksCollection, where("objectiveId", "==", objectiveId))

    const tasksSnapshot = await withTimeout(getDocs(q), 10000, `Getting tasks for objective ${objectiveId}`)

    const tasks = tasksSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Task,
    )

    // Always sort by position
    return tasks.sort((a, b) => (a.position || 0) - (b.position || 0))
  } catch (error) {
    console.error(`Error getting tasks for objective ${objectiveId}:`, error)
    // Return empty array instead of throwing
    return []
  }
}

// Modify the addTask function to include position
export async function addTask(task: Omit<Task, "id">): Promise<string> {
  // Get the highest position value for tasks in this objective
  const tasksCollection = collection(db, COLLECTIONS.TASKS)
  const q = query(tasksCollection, where("objectiveId", "==", task.objectiveId))
  const tasksSnapshot = await getDocs(q)

  let maxPosition = 0
  tasksSnapshot.docs.forEach((doc) => {
    const data = doc.data()
    if (data.position && data.position > maxPosition) {
      maxPosition = data.position
    }
  })

  const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
    ...task,
    position: task.position !== undefined ? task.position : maxPosition + 1, // Use provided position or set to be after the last task
    completed: false,
    createdAt: serverTimestamp(),
  })

  // Mettre à jour la progression de l'objectif
  await updateObjectiveProgress(task.objectiveId)

  return docRef.id
}

export async function updateTask(id: string, task: Partial<Task>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TASKS, id)
  await updateDoc(docRef, {
    ...task,
    updatedAt: serverTimestamp(),
  })

  // Si on a modifié le statut de complétion, mettre à jour la progression
  if (task.completed !== undefined) {
    const taskDoc = await getDoc(docRef)
    const taskData = taskDoc.data()
    if (taskData) {
      await updateObjectiveProgress(taskData.objectiveId)
    }
  }
}

export async function deleteTask(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TASKS, id)

  // Récupérer l'objectiveId avant de supprimer
  const taskDoc = await getDoc(docRef)
  const taskData = taskDoc.data()
  const objectiveId = taskData?.objectiveId

  await deleteDoc(docRef)

  // Mettre à jour la progression de l'objectif
  if (objectiveId) {
    await updateObjectiveProgress(objectiveId)
  }
}

// Fonction utilitaire pour mettre à jour la progression d'un objectif
async function updateObjectiveProgress(objectiveId: string): Promise<void> {
  const tasks = await getTasksForObjective(objectiveId)

  if (tasks.length === 0) {
    // Pas de tâches, progression à 0
    const objectiveRef = doc(db, COLLECTIONS.OBJECTIVES, objectiveId)
    await updateDoc(objectiveRef, { progress: 0 })
    return
  }

  const completedTasks = tasks.filter((task) => task.completed).length
  const progress = Math.round((completedTasks / tasks.length) * 100)

  const objectiveRef = doc(db, COLLECTIONS.OBJECTIVES, objectiveId)
  await updateDoc(objectiveRef, {
    progress,
    updatedAt: serverTimestamp(),
  })
}

// Statistiques
export async function getStatistics(productId: string, weekId: string) {
  const objectives = await getObjectives(productId, weekId)

  const totalObjectives = objectives.length
  const totalTasks = objectives.reduce((acc, obj) => acc + obj.tasks.length, 0)
  const completedTasks = objectives.reduce((acc, obj) => acc + obj.tasks.filter((task) => task.completed).length, 0)
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Statistiques par membre
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

// Update the initializeDefaultData function to include 2025 weeks
export async function initializeDefaultData() {
  try {
    if (DEBUG) console.log("Starting initialization of default data...")

    // Check if we can access Firestore first
    try {
      const testQuery = await getDocs(collection(db, COLLECTIONS.PRODUCTS))
      if (DEBUG) console.log("Successfully connected to Firestore")
    } catch (error) {
      console.error("Error accessing Firestore:", error)
      throw new Error("Cannot access Firestore. Please check your Firebase security rules.")
    }

    // Vérifier si les données existent déjà
    const productsSnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS))
    if (!productsSnapshot.empty) {
      if (DEBUG) console.log("Data already exists, skipping initialization")
      return // Données déjà initialisées
    }

    if (DEBUG) console.log("Creating batch for default data...")
    const batch = writeBatch(db)

    // Produits par défaut
    const products = [
      { id: "app-web", name: "Application Web (ARVEA International)" },
      { id: "app-mobile", name: "Application Mobile (ARVEA Business)" },
      { id: "arvea-shop", name: "ARVEA Shop (Le site e-commerce)" },
      { id: "arvea-data", name: "ARVEA DATA DRIVEN" },
    ]

    if (DEBUG) console.log("Adding default products...")
    products.forEach((product) => {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id)
      batch.set(docRef, {
        name: product.name,
        createdAt: serverTimestamp(),
      })
    })

    // Membres par défaut - sorted alphabetically by name
    // Members with S3 URLs
    const members = [
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

    if (DEBUG) console.log("Adding default members...")
    members.forEach((member) => {
      const docRef = doc(db, COLLECTIONS.MEMBERS, member.id)
      batch.set(docRef, {
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        initials: member.initials,
        createdAt: serverTimestamp(),
      })
    })

    // Niveaux de complexité
    const complexityLevels = [
      { id: "low", name: "Facile", color: "green" },
      { id: "medium", name: "Moyenne", color: "blue" },
      { id: "high", name: "Élevée", color: "orange" },
      { id: "critical", name: "Critique", color: "red" },
    ]

    if (DEBUG) console.log("Adding complexity levels...")
    complexityLevels.forEach((level) => {
      const docRef = doc(db, COLLECTIONS.COMPLEXITY_LEVELS, level.id)
      batch.set(docRef, {
        name: level.name,
        color: level.color,
        createdAt: serverTimestamp(),
      })
    })

    // Niveaux de criticité
    const criticalityLevels = [
      { id: "low", name: "Basse", color: "green" },
      { id: "medium", name: "Moyenne", color: "yellow" },
      { id: "high", name: "Haute", color: "red" },
      { id: "critical", name: "Critique", color: "purple" },
    ]

    if (DEBUG) console.log("Adding criticality levels...")
    criticalityLevels.forEach((level) => {
      const docRef = doc(db, COLLECTIONS.CRITICALITY_LEVELS, level.id)
      batch.set(docRef, {
        name: level.name,
        color: level.color,
        createdAt: serverTimestamp(),
      })
    })

    // Current week (we'll add all 2025 weeks after the initial batch)
    const currentWeekRange = getCurrentWeekRange()
    const currentWeekId = getWeekId(new Date())
    const weekRef = doc(db, COLLECTIONS.WEEK_RANGES, currentWeekId)

    if (DEBUG) console.log("Adding current week...")
    batch.set(weekRef, {
      startDate: Timestamp.fromDate(currentWeekRange.start),
      endDate: Timestamp.fromDate(currentWeekRange.end),
      label: formatDateRange(currentWeekRange),
      createdAt: serverTimestamp(),
    })

    if (DEBUG) console.log("Committing batch...")
    await batch.commit()

    // Now add all 2025 weeks in a separate batch
    if (DEBUG) console.log("Adding all 2025 weeks...")
    await createWeekRangesFor2025()

    if (DEBUG) console.log("Default data initialized successfully!")
  } catch (error) {
    console.error("Error initializing default data:", error)
    throw error
  }
}

// Add these functions to your firebase-service.ts file

export async function updateObjectivePositions(objectives: Objective[]): Promise<void> {
  const batch = writeBatch(db)

  objectives.forEach((objective) => {
    const objectiveRef = doc(db, COLLECTIONS.OBJECTIVES, objective.id)
    batch.update(objectiveRef, {
      position: objective.position,
      updatedAt: serverTimestamp(),
    })
  })

  // Use try-catch to handle potential errors
  try {
    await batch.commit()
  } catch (error) {
    console.error("Error updating objective positions:", error)
    throw error // Re-throw to handle in the component
  }
}

// Add these functions to your firebase-service.ts file

export async function updateTaskPositions(tasks: Task[]): Promise<void> {
  const batch = writeBatch(db)

  tasks.forEach((task) => {
    const taskRef = doc(db, COLLECTIONS.TASKS, task.id)
    batch.update(taskRef, {
      position: task.position,
      updatedAt: serverTimestamp(),
    })
  })

  // Use try-catch to handle potential errors
  try {
    await batch.commit()
  } catch (error) {
    console.error("Error updating task positions:", error)
    throw error // Re-throw to handle in the component
  }
}

export async function verifyAndCorrectWeekRanges(): Promise<void> {
  try {
    console.log("Verifying and correcting week ranges...")

    const weekRanges = await getWeekRanges()
    const generatedWeekOptions = getWeekOptions()

    // Check for missing week ranges
    const missingWeekRanges = generatedWeekOptions.filter((generatedWeek) => {
      return !weekRanges.some((week) => week.id === generatedWeek.id)
    })

    if (missingWeekRanges.length > 0) {
      console.warn(`Found ${missingWeekRanges.length} missing week ranges. Adding them...`)
      const batch = writeBatch(db)

      missingWeekRanges.forEach((week) => {
        const weekRef = doc(db, COLLECTIONS.WEEK_RANGES, week.id)
        batch.set(weekRef, {
          startDate: Timestamp.fromDate(week.range.start),
          endDate: Timestamp.fromDate(week.range.end),
          label: week.label,
          createdAt: serverTimestamp(),
        })
      })

      await batch.commit()
      console.log("Missing week ranges added successfully.")
    } else {
      console.log("No missing week ranges found.")
    }

    // Check for incorrect week ranges (e.g., incorrect labels)
    const incorrectWeekRanges = weekRanges.filter((week) => {
      const generatedWeek = generatedWeekOptions.find((w) => w.id === week.id)
      return generatedWeek && week.label !== generatedWeek.label
    })

    if (incorrectWeekRanges.length > 0) {
      console.warn(`Found ${incorrectWeekRanges.length} incorrect week ranges. Correcting them...`)
      const batch = writeBatch(db)

      incorrectWeekRanges.forEach((week) => {
        const generatedWeek = generatedWeekOptions.find((w) => w.id === week.id)
        if (generatedWeek) {
          const weekRef = doc(db, COLLECTIONS.WEEK_RANGES, week.id)
          batch.update(weekRef, {
            label: generatedWeek.label,
            updatedAt: serverTimestamp(),
          })
        }
      })

      await batch.commit()
      console.log("Incorrect week ranges corrected successfully.")
    } else {
      console.log("No incorrect week ranges found.")
    }

    console.log("Week range verification and correction complete.")
  } catch (error) {
    console.error("Error verifying and correcting week ranges:", error)
  }
}

export async function ensureSpecificWeekExists(): Promise<void> {
  try {
    console.log("Ensuring specific week (March 17-23, 2025) exists...")

    const specificWeek = getSpecificCurrentWeek()
    const weekRanges = await getWeekRanges()

    const hasSpecificWeek = weekRanges.some(
      (week) =>
        week.id === specificWeek.id ||
        (isSameDay(week.startDate, specificWeek.range.start) && isSameDay(week.endDate, specificWeek.range.end)),
    )

    if (!hasSpecificWeek) {
      console.warn("Specific week (March 17-23, 2025) not found. Adding it...")

      const weekRef = doc(db, COLLECTIONS.WEEK_RANGES, specificWeek.id)
      await updateDoc(weekRef, {
        startDate: Timestamp.fromDate(specificWeek.range.start),
        endDate: Timestamp.fromDate(specificWeek.range.end),
        label: specificWeek.label,
        createdAt: serverTimestamp(),
      })

      console.log("Specific week (March 17-23, 2025) added successfully.")
    } else {
      console.log("Specific week (March 17-23, 2025) already exists.")
    }
  } catch (error) {
    console.error("Error ensuring specific week exists:", error)
  }
}

// Add this function to get plans data
export async function getPlans(productId: string, weekId: string): Promise<Plan[]> {
  try {
    console.log(`Getting plans for product ${productId} and week ${weekId}`)

    // Get objectives for the product and week
    const objectives = await getObjectives(productId, weekId)

    // Group tasks by assignee to create plans
    const plansByAssignee: Record<string, Plan> = {}

    // Process each objective and its tasks
    objectives.forEach((objective) => {
      objective.tasks.forEach((task) => {
        if (task.assignee) {
          // Initialize plan for this assignee if it doesn't exist
          if (!plansByAssignee[task.assignee]) {
            plansByAssignee[task.assignee] = {
              assigneeId: task.assignee,
              tasks: [],
              completedTasks: 0,
              totalTasks: 0,
              progress: 0,
            }
          }

          // Add task to the plan
          plansByAssignee[task.assignee].tasks.push({
            ...task,
            objectiveTitle: objective.title,
            objectiveId: objective.id,
          })

          // Update task counts
          plansByAssignee[task.assignee].totalTasks++
          if (task.completed) {
            plansByAssignee[task.assignee].completedTasks++
          }
        }
      })
    })

    // Calculate progress for each plan
    Object.values(plansByAssignee).forEach((plan) => {
      plan.progress = plan.totalTasks > 0 ? Math.round((plan.completedTasks / plan.totalTasks) * 100) : 0
    })

    return Object.values(plansByAssignee)
  } catch (error) {
    console.error(`Error getting plans for product ${productId} and week ${weekId}:`, error)
    return []
  }
}

// Add the Plan interface to the file
export interface Plan {
  assigneeId: string
  tasks: (Task & { objectiveTitle: string; objectiveId: string })[]
  completedTasks: number
  totalTasks: number
  progress: number
}

// Add these functions to the firebase-service.ts file

// Flag an objective
export async function flagObjective(objectiveId: string, description: string): Promise<void> {
  const objectiveRef = doc(db, COLLECTIONS.OBJECTIVES, objectiveId)

  await updateDoc(objectiveRef, {
    flag: {
      isFlagged: true,
      description,
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
}

// Remove flag from an objective
export async function unflagObjective(objectiveId: string): Promise<void> {
  const objectiveRef = doc(db, COLLECTIONS.OBJECTIVES, objectiveId)

  await updateDoc(objectiveRef, {
    flag: {
      isFlagged: false,
      description: "",
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
}

// Add this function to clone an objective to another week
export async function cloneObjective(objectiveId: string, targetWeekId: string): Promise<string | null> {
  try {
    console.log(`Cloning objective ${objectiveId} to week ${targetWeekId}`)

    // Get the source objective
    const sourceObjective = await getObjectiveById(objectiveId)
    if (!sourceObjective) {
      console.error(`Source objective ${objectiveId} not found`)
      return null
    }

    // Get the tasks for the source objective
    const sourceTasks = await getTasksForObjective(objectiveId)

    // Create a new objective without the id, tasks, and with the new weekId
    const { id, tasks, progress, createdAt, updatedAt, targetCompletionDate, flag, ...objectiveData } = sourceObjective

    // Get the highest position for objectives in the target week to position the clone correctly
    const objectivesCollection = collection(db, COLLECTIONS.OBJECTIVES)
    const q = query(
      objectivesCollection,
      where("productId", "==", sourceObjective.productId),
      where("weekId", "==", targetWeekId),
    )
    const objectivesSnapshot = await getDocs(q)
    
    let maxPosition = 0
    objectivesSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.position > maxPosition) {
        maxPosition = data.position
      }
    })

    // Create the cloned objective with properly handled fields
    const objectiveToAdd: Omit<Objective, "id" | "tasks"> = {
      ...objectiveData,
      weekId: targetWeekId,
      progress: 0, // Reset progress for the new objective
      position: maxPosition + 1, // Position the clone at the end
    }

    // Handle targetCompletionDate properly - don't pass it if it doesn't exist
    if (targetCompletionDate) {
      (objectiveToAdd as any).targetCompletionDate =
        targetCompletionDate instanceof Date ? targetCompletionDate : (targetCompletionDate as any)?.toDate?.() || null
    }

    // Handle flag properly - create a new flag object if it exists and is flagged
    if (flag && flag.isFlagged) {
      (objectiveToAdd as any).flag = {
        isFlagged: flag.isFlagged,
        description: flag.description || "",
      }
    }

    // Create the cloned objective
    const clonedObjectiveId = await addObjective(objectiveToAdd)

    // Clone all tasks
    if (sourceTasks.length > 0) {
      const batch = writeBatch(db)

      for (let i = 0; i < sourceTasks.length; i++) {
        const { id, completed, createdAt, updatedAt, ...taskData } = sourceTasks[i]

        const taskRef = doc(collection(db, COLLECTIONS.TASKS))
        batch.set(taskRef, {
          ...taskData,
          objectiveId: clonedObjectiveId,
          position: i,
          completed: false, // Reset completion status
          createdAt: serverTimestamp(),
        })
      }

      await batch.commit()
    }

    return clonedObjectiveId
  } catch (error) {
    console.error("Error cloning objective:", error)
    return null
  }
}

// Add this function to get all available weeks
export async function getAllWeekRanges(): Promise<WeekRange[]> {
  try {
    const weekRangesCollection = collection(db, COLLECTIONS.WEEK_RANGES)
    const weekRangesSnapshot = await withTimeout(getDocs(weekRangesCollection), 10000, "Getting all week ranges")

    const weekRanges = weekRangesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        label: data.label,
      } as WeekRange
    })

    // Sort weeks by start date (newest first)
    return weekRanges.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  } catch (error) {
    console.error("Error getting all week ranges:", error)
    return []
  }
}
