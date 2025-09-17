"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { User } from "@/types/user"

interface MemberSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  members: User[]
  selectedMembers: string[]
  onSelectMembers: (selectedIds: string[]) => void
}

export function MemberSelectionModal({
  isOpen,
  onClose,
  members,
  selectedMembers,
  onSelectMembers,
}: MemberSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      onSelectMembers(selectedMembers.filter((id) => id !== memberId))
    } else {
      onSelectMembers([...selectedMembers, memberId])
    }
  }

  const selectAll = () => {
    onSelectMembers(members.map((member) => member.id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Sélectionner des membres</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="p-1">
          <div className="relative mb-4">
            <Input
              className="w-full pl-10 border-2 rounded-lg"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                  selectedMembers.includes(member.id) ? "bg-gray-100" : ""
                }`}
                onClick={() => toggleMember(member.id)}
              >
                <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                  {member.avatar ? (
                    <img
                      src={member.avatar || "/placeholder.svg"}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="font-medium">{member.name}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button onClick={selectAll}>Sélectionner tout</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
