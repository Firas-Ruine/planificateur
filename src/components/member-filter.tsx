"use client"

import { useState } from "react"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { MemberSelectionModal } from "./member-selection-modal"
import { Loader2 } from "lucide-react"

interface MemberFilterProps {
  members: User[]
  selectedMembers: string[]
  onMemberSelect: (selectedIds: string[]) => void
  isLoading?: boolean
  maxVisible?: number
}

export function MemberFilter({
  members,
  selectedMembers,
  onMemberSelect,
  isLoading = false,
  maxVisible = 5,
}: MemberFilterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get the visible members (first 5 by default)
  const visibleMembers = members.slice(0, maxVisible)
  const hiddenMembersCount = Math.max(0, members.length - maxVisible)

  const handleSelectMember = (memberId: string) => {
    onMemberSelect(
      selectedMembers.includes(memberId)
        ? selectedMembers.filter((id) => id !== memberId)
        : [...selectedMembers, memberId],
    )
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      onMemberSelect([])
    } else {
      onMemberSelect(members.map((member) => member.id))
    }
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium text-gray-700">Filtrer par membre</h3>
          <div className="ml-2 text-sm text-gray-500 flex items-center">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Chargement...
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Filtrer par membre</h3>
        <Button variant="link" className="text-blue-600 p-0 h-auto font-medium" onClick={handleSelectAll}>
          {selectedMembers.length === members.length ? "Désélectionner tout" : "Sélectionner tout"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        {visibleMembers.map((member) => (
          <button
            key={member.id}
            onClick={() => handleSelectMember(member.id)}
            className={`relative rounded-full overflow-hidden w-12 h-12 transition-all ${
              selectedMembers.includes(member.id)
                ? "ring-2 ring-blue-500 ring-offset-2"
                : "opacity-70 hover:opacity-100"
            }`}
            aria-pressed={selectedMembers.includes(member.id)}
            title={member.name}
          >
            {member.avatar ? (
              <img src={member.avatar || "/placeholder.svg"} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                {member.name.charAt(0)}
              </div>
            )}
          </button>
        ))}

        {hiddenMembersCount > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full w-12 h-12 bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            title="Voir plus de membres"
          >
            +{hiddenMembersCount}
          </button>
        )}
      </div>

      <MemberSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        members={members}
        selectedMembers={selectedMembers}
        onSelectMembers={(selectedIds) => {
          onMemberSelect(selectedIds)
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
