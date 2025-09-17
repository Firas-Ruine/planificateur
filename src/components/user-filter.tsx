"use client"

import type React from "react"

import { useState, useEffect, memo, useMemo, useCallback } from "react"
import type { Member } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, X, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserFilterProps {
  users: Member[]
  selectedUsers: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

// Function to consistently select the same 5 users
const getInitialVisibleUsers = (users: Member[], count = 5): Member[] => {
  if (users.length <= count) return users

  // Sort by ID to ensure consistent selection across reloads
  // This is a deterministic way to get the "same random" users each time
  const sortedUsers = [...users].sort((a, b) => a.id.localeCompare(b.id))
  return sortedUsers.slice(0, count)
}

export const UserFilter = memo(function UserFilter({ users, selectedUsers, onSelectionChange }: UserFilterProps) {
  // Use local state to track selected users
  const [localSelectedUsers, setLocalSelectedUsers] = useState<string[]>(selectedUsers)
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Get the initial 5 visible users
  const initialVisibleUsers = useMemo(() => getInitialVisibleUsers(users), [users])

  // Calculate remaining users count
  const remainingCount = users.length - initialVisibleUsers.length

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users

    return users.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [users, searchTerm])

  // Only update local state when the prop changes from outside
  useEffect(() => {
    setLocalSelectedUsers(selectedUsers)
  }, [selectedUsers])

  // Handle toggling a user selection
  const toggleUser = useCallback(
    (userId: string) => {
      const newSelection = localSelectedUsers.includes(userId)
        ? localSelectedUsers.filter((id) => id !== userId)
        : [...localSelectedUsers, userId]

      // Update local state
      setLocalSelectedUsers(newSelection)

      // Notify parent component
      onSelectionChange(newSelection)
    },
    [localSelectedUsers, onSelectionChange],
  )

  // Handle selecting all users
  const selectAll = useCallback(() => {
    if (localSelectedUsers.length === users.length) {
      // If all are selected, deselect all
      setLocalSelectedUsers([])
      onSelectionChange([])
    } else {
      // Otherwise, select all
      const allUserIds = users.map((user) => user.id)
      setLocalSelectedUsers(allUserIds)
      onSelectionChange(allUserIds)
    }
  }, [localSelectedUsers.length, users, onSelectionChange])

  // Handle opening the expanded view
  const handleExpandClick = useCallback(() => {
    setIsExpanded(true)
  }, [])

  // Handle closing the expanded view
  const handleCloseExpanded = useCallback(() => {
    setIsExpanded(false)
    setSearchTerm("")
  }, [])

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-700">Filtrer par membre</h3>
        <button onClick={selectAll} className="text-sm text-indigo-600 hover:text-indigo-800" type="button">
          {localSelectedUsers.length === users.length ? "Désélectionner tout" : "Sélectionner tout"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Display initial visible users */}
        {initialVisibleUsers.map((user) => (
          <TooltipProvider key={user.id} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggleUser(user.id)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                    localSelectedUsers.includes(user.id)
                      ? "border-indigo-500 ring-2 ring-indigo-200"
                      : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}
                  aria-pressed={localSelectedUsers.includes(user.id)}
                  aria-label={`Filtrer par ${user.name}`}
                >
                  <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-full h-full object-cover" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{user.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Show "+X" button if there are remaining users */}
        {remainingCount > 0 && (
          <button
            onClick={handleExpandClick}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
            aria-label="Afficher plus d'utilisateurs"
          >
            +{remainingCount}
          </button>
        )}
      </div>

      {/* Expanded view dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sélectionner des membres</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher un membre..."
              className="pl-9"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-center py-4 text-gray-500">Aucun membre trouvé</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer ${
                      localSelectedUsers.includes(user.id) ? "bg-indigo-50" : ""
                    }`}
                    onClick={() => toggleUser(user.id)}
                  >
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden mr-3">
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="flex-grow">{user.name}</span>
                    {localSelectedUsers.includes(user.id) && <Check className="h-5 w-5 text-indigo-600" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCloseExpanded}>
              Fermer
            </Button>
            <Button onClick={selectAll}>
              {localSelectedUsers.length === users.length ? "Désélectionner tout" : "Sélectionner tout"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})
