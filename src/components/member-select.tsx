"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Member } from "@/types"

interface MemberSelectProps {
  members: Member[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MemberSelect({
  members,
  value,
  onChange,
  placeholder = "Sélectionner un membre",
  disabled = false,
}: MemberSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sort members alphabetically by name
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))

  // Filter members based on search query
  const filteredMembers = sortedMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedMember = members.find((member) => member.id === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="w-full justify-between bg-white border border-gray-300 rounded-md px-3 py-2 text-left"
      >
        {value && selectedMember ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
              <AvatarFallback>{selectedMember.initials}</AvatarFallback>
            </Avatar>
            <span className="truncate">{selectedMember.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200 flex items-center">
            <Search className="h-4 w-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto py-1">
            {filteredMembers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Aucun membre trouvé.</div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => {
                    onChange(member.id)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.name}</span>
                  </div>
                  {value === member.id && <Check className="h-4 w-4 text-indigo-600" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
