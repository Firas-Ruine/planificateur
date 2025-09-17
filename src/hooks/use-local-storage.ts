"use client"

import { useState, useEffect, useRef } from "react"

// Custom serializer/deserializer to handle Date objects
const serialize = (value: any): string => {
  return JSON.stringify(value, (key, val) => {
    // Identify Date objects and convert them to a special format
    if (val instanceof Date) {
      return { __type: "Date", value: val.toISOString() }
    }
    return val
  })
}

const deserialize = (value: string): any => {
  return JSON.parse(value, (key, val) => {
    // Convert our special format back to Date objects
    if (val && typeof val === "object" && val.__type === "Date") {
      return new Date(val.value)
    }
    return val
  })
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Reference to track if this is the first render
  const isFirstRender = useRef(true)

  // Reference to track the current value to avoid unnecessary state updates
  const valueRef = useRef<T>(initialValue)

  // State to store our value
  // Pass the initialization function to useState so the logic only runs once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      // Get from localStorage
      const item = window.localStorage.getItem(key)
      // Parse stored json or return initialValue
      const value = item ? deserialize(item) : initialValue
      valueRef.current = value
      return value
    } catch (error) {
      // If error, return initialValue
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Optimization: don't write to localStorage on first render
  // if the value is identical to initialValue
  useEffect(() => {
    isFirstRender.current = false
  }, [])

  // Return a wrapped version of useState's setter function
  // that persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Check if the value has actually changed to avoid unnecessary updates
      if (JSON.stringify(valueToStore) === JSON.stringify(valueRef.current)) {
        return // Skip update if value hasn't changed
      }

      // Update ref
      valueRef.current = valueToStore

      // Save state
      setStoredValue(valueToStore)

      // Save to localStorage, but not on first render if value is identical
      if (
        typeof window !== "undefined" &&
        (!isFirstRender.current || JSON.stringify(valueToStore) !== JSON.stringify(initialValue))
      ) {
        window.localStorage.setItem(key, serialize(valueToStore))
      }
    } catch (error) {
      // A more advanced implementation would handle the error
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const newValue = deserialize(event.newValue)
          // Only update if the value has actually changed
          if (JSON.stringify(newValue) !== JSON.stringify(valueRef.current)) {
            valueRef.current = newValue
            setStoredValue(newValue)
          }
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error)
        }
      }
    }

    // Add event listener
    window.addEventListener("storage", handleStorageChange)

    // Clean up event listener
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue]
}
