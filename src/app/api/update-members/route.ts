import { NextResponse } from "next/server"
import { collection, getDocs, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"

// The new members list - sorted alphabetically by name
const newMembers = [
  {
    id: "1",
    name: "Abir Ben Cheikh",
    role: "PROCESS OWNER",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "AB",
  },
  {
    id: "2",
    name: "Ahmed Bouzayana",
    role: "CHIEF SCRUM MASTER",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "AB",
  },
  { id: "3", name: "ALi Benhamed", role: "SYS ADMIN", avatar: "/placeholder.svg?height=40&width=40", initials: "AB" },
  { id: "4", name: "amine kacem", role: "DEVELOPEUR", avatar: "/placeholder.svg?height=40&width=40", initials: "AK" },
  { id: "5", name: "Anouar Hamdaoui", role: "DESIGNER", avatar: "/placeholder.svg?height=40&width=40", initials: "AH" },
  { id: "6", name: "Asma Ayari", role: "DEVELOPEUR", avatar: "/placeholder.svg?height=40&width=40", initials: "AA" },
  {
    id: "7",
    name: "Ben nasr amal",
    role: "DEVELOPEUR",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "BNA",
  },
  { id: "8", name: "Boughanmi Radhouen", role: "QA", avatar: "/placeholder.svg?height=40&width=40", initials: "BR" },
  { id: "9", name: "Fatma Lakhal", role: "RH", avatar: "/placeholder.svg?height=40&width=40", initials: "FL" },
  { id: "10", name: "Firas Ruine", role: "TECH LEAD", avatar: "/placeholder.svg?height=40&width=40", initials: "FR" },
  {
    id: "11",
    name: "Haythem Bekir",
    role: "DEVELOPEUR",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "HB",
  },
  {
    id: "12",
    name: "Haythem Benkhlifa",
    role: "DEVELOPEUR",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "HB",
  },
  { id: "13", name: "Hsouna Rabii", role: "QA", avatar: "/placeholder.svg?height=40&width=40", initials: "HR" },
  { id: "14", name: "Ichraf Moula", role: "DEVELOPEUR", avatar: "/placeholder.svg?height=40&width=40", initials: "IM" },
  {
    id: "15",
    name: "Marwa Boufaied",
    role: "RESPONSABLE FINANCE",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "MB",
  },
  {
    id: "16",
    name: "Med Amine Boutiti",
    role: "DEVELOPEUR",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "MA",
  },
  {
    id: "17",
    name: "Mohamed Nacer Benkhlifa",
    role: "TECH LEAD",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "MNB",
  },
  {
    id: "18",
    name: "Mustapha Majed",
    role: "DEVELOPEUR",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "MM",
  },
  { id: "19", name: "Nourhen Landolsi", role: "QA", avatar: "/placeholder.svg?height=40&width=40", initials: "NL" },
  {
    id: "20",
    name: "Oumaima Chemingui",
    role: "HÔTESSE D'ACCUEIL",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "OC",
  },
  {
    id: "21",
    name: "Oussema Ferjeni",
    role: "DEVELOPEUR",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "OF",
  },
  { id: "22", name: "Riadh Rezig", role: "CEO", avatar: "/placeholder.svg?height=40&width=40", initials: "RR" },
  { id: "23", name: "Safa Mtir", role: "DATA ANALYST", avatar: "/placeholder.svg?height=40&width=40", initials: "SM" },
  { id: "24", name: "Sirine Hamdoun", role: "PO", avatar: "/placeholder.svg?height=40&width=40", initials: "SH" },
  {
    id: "25",
    name: "Skander Belloum",
    role: "DATA ANALYST",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "SB",
  },
  {
    id: "26",
    name: "Sofien Ben Brahim",
    role: "DATA ANALYST",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "SBB",
  },
  {
    id: "27",
    name: "Souad Hamdoun",
    role: "DEVELOPEUR",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "SH",
  },
  { id: "28", name: "Wael Dghais", role: "DEVELOPEUR", avatar: "/placeholder.svg?height=40&width=40", initials: "WD" },
  { id: "29", name: "wala dghaies", role: "QA", avatar: "/placeholder.svg?height=40&width=40", initials: "WD" },
  {
    id: "30",
    name: "Wafa Makhlouf",
    role: "ASSISTANTE DE DIRECTION",
    avatar: "/placeholder.svg?height=40&width=40",
    initials: "WM",
  },
]

export async function POST() {
  try {
    // Check if we can access Firestore
    try {
      await getDocs(collection(db, "members"))
      console.log("Successfully connected to Firestore")
    } catch (error) {
      console.error("Error accessing Firestore:", error)
      return NextResponse.json(
        {
          message: "Cannot access Firestore. Please check your Firebase security rules.",
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    // Use a batch to update all members
    const batch = writeBatch(db)

    // Update each member
    for (const member of newMembers) {
      const memberRef = doc(db, "members", member.id)
      batch.set(memberRef, {
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        initials: member.initials,
        updatedAt: new Date(),
      })
    }

    // Commit the batch
    await batch.commit()
    console.log("Members updated successfully")

    return NextResponse.json({ message: "Members updated successfully" })
  } catch (error) {
    console.error("Error updating members:", error)
    return NextResponse.json(
      {
        message: "Error updating members",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
