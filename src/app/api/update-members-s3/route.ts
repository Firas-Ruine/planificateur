import { NextResponse } from "next/server"
import { collection, getDocs, doc, writeBatch, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// The new members list with S3 URLs
const newMembers = [
  {
    id: "1",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/abir.jpg",
    initials: "AB",
    name: "Abir Ben Cheikh",
    role: "PROCESS OWNER",
  },
  {
    id: "2",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/ahmed.jpg",
    initials: "AB",
    name: "Ahmed Bouzayana",
    role: "CHIEF SCRUM MASTER",
  },
  {
    id: "3",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Ali+ben+Hamed.png",
    initials: "AB",
    name: "ALi Benhamed",
    role: "SYS ADMIN",
  },
  {
    id: "4",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/amine+kacem.png",
    initials: "AK",
    name: "amine kacem",
    role: "DEVELOPEUR",
  },
  {
    id: "5",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/anouar-hamdaoui.jpg",
    initials: "AH",
    name: "Anouar Hamdaoui",
    role: "DESIGNER",
  },
  {
    id: "6",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Amal(1).jpg",
    initials: "AA",
    name: "Asma Ayari",
    role: "DEVELOPEUR",
  },
  {
    id: "7",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Amal.jpg",
    initials: "BNA",
    name: "Ben nasr amal",
    role: "DEVELOPEUR",
  },
  {
    id: "8",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Radhouen.jpg",
    initials: "BR",
    name: "Boughanmi Radhouen",
    role: "QA",
  },
  {
    id: "9",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/fatma+lakhal.jpg",
    initials: "FL",
    name: "Fatma Lakhal",
    role: "RH",
  },
  {
    id: "10",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/firas.jpg",
    initials: "FR",
    name: "Firas Ruine",
    role: "TECH LEAD",
  },
  {
    id: "11",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/haythem.jpg",
    initials: "HB",
    name: "Haythem Bekir",
    role: "DEVELOPEUR",
  },
  {
    id: "12",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/Haythem.png",
    initials: "HB",
    name: "Haythem Benkhlifa",
    role: "DEVELOPEUR",
  },
  {
    id: "13",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/rabii.jpeg",
    initials: "HR",
    name: "Hsouna Rabii",
    role: "QA",
  },
  {
    id: "14",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/ichraf.jpg",
    initials: "IM",
    name: "Ichraf Moula",
    role: "DEVELOPEUR",
  },
  {
    id: "15",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/marwa.jpg",
    initials: "MB",
    name: "Marwa Boufaied",
    role: "RESPONSABLE FINANCE",
  },
  {
    id: "16",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/boutiti.jpg",
    initials: "MA",
    name: "Med Amine Boutiti",
    role: "DEVELOPEUR",
  },
  {
    id: "17",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/naceurr.jpg",
    initials: "MNB",
    name: "Mohamed Nacer Benkhlifa",
    role: "TECH LEAD",
  },
  {
    id: "18",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/mustapha.jpg",
    initials: "MM",
    name: "Mustapha Majed",
    role: "DEVELOPEUR",
  },
  {
    id: "19",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/nourhen.jpg",
    initials: "NL",
    name: "Nourhen Landolsi",
    role: "QA",
  },
  {
    id: "20",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/oumaima.jpg",
    initials: "OC",
    name: "Oumaima Chemingui",
    role: "HÔTESSE D'ACCUEIL",
  },
  {
    id: "21",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/ouss.png",
    initials: "OF",
    name: "Oussema Ferjeni",
    role: "DEVELOPEUR",
  },
  {
    id: "22",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/riadh+(1).jpg",
    initials: "RR",
    name: "Riadh Rezig",
    role: "CEO",
  },
  {
    id: "23",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/safa.jpg",
    initials: "SM",
    name: "Safa Mtir",
    role: "DATA ANALYST",
  },
  {
    id: "24",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/syrine.jpg",
    initials: "SH",
    name: "Syrine Hamdoun",
    role: "PO",
  },
  {
    id: "25",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/skander.jpg",
    initials: "SB",
    name: "Skander Belloum",
    role: "DATA ANALYST",
  },
  {
    id: "26",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/sofien+ben+brahem.jpg",
    initials: "SBB",
    name: "Sofien Ben Brahim",
    role: "DATA ANALYST",
  },
  {
    id: "27",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/souad.png",
    initials: "SH",
    name: "Souad Hamdoun",
    role: "DEVELOPEUR",
  },
  {
    id: "28",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/wael.jpg",
    initials: "WD",
    name: "Wael Dghais",
    role: "DEVELOPEUR",
  },
  {
    id: "29",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/walaa.jpg",
    initials: "WD",
    name: "wala dghaies",
    role: "QA",
  },
  {
    id: "30",
    avatar: "https://arveatest.s3.eu-west-3.amazonaws.com/photo-team/wafa.jpg",
    initials: "WM",
    name: "Wafa Makhlouf",
    role: "ASSISTANTE DE DIRECTION",
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
        updatedAt: serverTimestamp(),
      })
    }

    // Commit the batch
    await batch.commit()
    console.log("Members updated successfully with S3 URLs")

    return NextResponse.json({ message: "Members updated successfully with S3 URLs" })
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
