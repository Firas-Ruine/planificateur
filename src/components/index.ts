// Layout Components
export { AppHeader } from './layout/app-header'
export { AppNavigation } from './layout/app-navigation'
export { AppSidebar } from './layout/app-sidebar'
export { ThemeProvider } from './layout/theme-provider'
export { ToastProvider } from './layout/toast-provider'
export { ErrorBoundary } from './layout/error-boundary'

// Feature Components - Views
export { ObjectivesView } from './features/objectives-view'
export { DashboardView } from './features/dashboard-view'
export { PlansView } from './features/plans-view'

// Feature Components - Planning
export { CloneObjectiveDialog } from './features/planning/clone-objective-dialog'
export { CreateObjectiveDialog } from './features/planning/create-objective-dialog'
export { EditObjectiveDialog } from './features/planning/edit-objective-dialog'
export { EditTaskDialog } from './features/planning/edit-task-dialog'
export { FlagObjectiveDialog } from './features/planning/flag-objective-dialog'
export { DraggableObjective } from './features/planning/draggable-objective'
export { DraggableTaskList } from './features/planning/draggable-task-list'
export { DraggableTask } from './features/planning/draggable-task'

// Feature Components - Dashboard
export { DashboardObjective } from './features/dashboard/dashboard-objective'
export { DashboardTask } from './features/dashboard/dashboard-task'

// Feature Components - Plans
export { PlansList } from './features/plans/plans-list'
export { default as Plans } from './features/plans/plans'

// Feature Components - Debug
export { DebugModal } from './features/debug-modal'

// Shared Components
export { MemberBadge } from './member-badge'
export { MemberFilter } from './member-filter'
export { MemberSelect } from './member-select'
export { MemberSelectionModal } from './member-selection-modal'
export { ComplexityBadge } from './complexity-badge'
export { CriticalityBadge } from './criticality-badge'
export { CompactBadges } from './compact-badges'
export { ObjectiveCategoryBadge } from './objective-category-badge'
export { ProgressBar } from './progress-bar'
export { ConfirmationDialog } from './confirmation-dialog'
export { EmptyState } from './empty-state'
export { ProductSelector } from './product-selector'
export { ProductWeekSelector } from './product-week-selector'
export { WeekSelector } from './week-selector'
export { WeekDataValidator } from './week-data-validator'
export { FirebaseInitializer } from './firebase-initializer'
export { FirebaseStatus } from './firebase-status'
export { UserFilter } from './user-filter'
export { SearchableMemberSelect } from './searchable-member-select'