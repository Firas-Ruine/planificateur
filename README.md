# Weekly Planning App

A modern, collaborative weekly planning application built with Next.js, TypeScript, and Firebase. This application helps teams organize their work into weekly objectives and tasks, track progress, and manage team workload efficiently.

## 🚀 Features

### Core Functionality
- **Weekly Planning**: Organize work into weekly objectives and tasks
- **Multi-Product Support**: Manage multiple products/projects simultaneously
- **Team Collaboration**: Assign tasks to team members and track individual progress
- **Progress Tracking**: Real-time progress visualization and statistics
- **Drag & Drop Interface**: Intuitive task and objective reordering
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Views & Navigation
- **Dashboard View**: Overview of weekly progress, statistics, and team performance
- **Objectives View**: Detailed task management with drag-and-drop functionality
- **Plans View**: Weekly plan visualization and sharing capabilities
- **Planning Page**: Create and manage objectives and tasks

### Advanced Features
- **Objective Categorization**: Eisenhower Matrix categorization (Urgent/Important)
- **Task Complexity & Criticality**: Color-coded badges for better prioritization
- **Share Plans**: Generate shareable links for weekly plans
- **PDF Export**: Export plans to PDF format
- **Print Support**: Print-friendly layouts
- **Member Filtering**: Filter views by team members
- **Real-time Updates**: Firebase integration for live collaboration

## 🛠 Tech Stack

### Frontend
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & Database
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Storage** - File storage
- **Mock Data Service** - Fallback for offline development

### State Management & UI
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **@dnd-kit** - Drag and drop functionality
- **Sonner** - Toast notifications
- **React Day Picker** - Date selection

### Additional Libraries
- **jsPDF** - PDF generation
- **html2canvas** - Screenshot capabilities
- **date-fns** - Date manipulation
- **Recharts** - Data visualization

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weekly-planning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Firestore Database
   - Add your web app and copy the configuration
   - Update the environment variables

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗 Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── dashboard/               # Dashboard page
│   ├── planning/                # Planning management page
│   ├── plans/                   # Plans view page
│   ├── shared-plan/             # Shared plan pages
│   └── api/                     # API routes
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   ├── dashboard/               # Dashboard-specific components
│   ├── views/                   # Main view components
│   └── icons/                   # Custom icons
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── lib/                         # Utility libraries
├── services/                     # Data services (Firebase, Mock)
├── types/                        # TypeScript type definitions
└── utils/                        # Utility functions
```

## 📊 Data Models

### Core Types

**Objective**
- Weekly goals with multiple tasks
- Progress tracking
- Categorization (Urgent/Important matrix)
- Team assignment

**Task**
- Individual work items
- Assignee, complexity, criticality
- Completion status
- Position for ordering

**Member**
- Team member information
- Avatar, role, initials
- Task assignment tracking

**Product**
- Project/product containers
- Separate planning contexts

## 🎯 Usage Guide

### Creating Objectives
1. Navigate to the Planning page
2. Select your product and week
3. Click "Add Objective"
4. Fill in objective details and categorization
5. Add tasks with assignees and priorities

### Managing Tasks
- Drag and drop to reorder tasks
- Click on tasks to edit details
- Use checkboxes to mark completion
- Filter by team members

### Viewing Progress
- Dashboard provides weekly statistics
- Progress bars show completion percentages
- Team performance metrics available
- Recent activity tracking

### Sharing Plans
1. Go to Plans view
2. Select the desired week and product
3. Click "Share" to generate a public link
4. Share the link with stakeholders

## 🔧 Configuration

### Firebase Collections
- `products` - Product/project definitions
- `members` - Team member profiles
- `objectives` - Weekly objectives
- `tasks` - Individual tasks
- `weekRanges` - Week definitions
- `complexityLevels` - Task complexity levels
- `criticalityLevels` - Task criticality levels

### Environment Variables
All Firebase configuration is handled through environment variables for security.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Notes

### Mock Data Mode
The app includes a mock data service for offline development. If Firebase connection fails, it automatically falls back to mock data.

### Responsive Design
Built with mobile-first approach using Tailwind CSS breakpoints.

### Performance Optimizations
- Dynamic imports for heavy components
- Memoized components to prevent unnecessary re-renders
- Efficient state management patterns

### Accessibility
- ARIA compliant components from Radix UI
- Keyboard navigation support
- Screen reader friendly

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Issues**
- Verify environment variables are set correctly
- Check Firebase project configuration
- Ensure Firestore rules allow read/write access

**Build Errors**
- Clear `.next` directory and rebuild
- Check for TypeScript errors
- Verify all dependencies are installed

**Performance Issues**
- Check for unnecessary re-renders in React DevTools
- Optimize large lists with virtualization if needed
- Monitor Firebase usage and optimize queries

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Lucide](https://lucide.dev/) for the icon set
- [Firebase](https://firebase.google.com/) for backend services

