# Admin Dashboard Comprehensive Update Plan

## Current Status
✅ Backend CRUD routes exist for all sections
✅ Basic admin tabs: Overview, Programs, News, Gallery, Contacts, Volunteers, Donations, Newsletter, Users, Settings

## Sections to Add Admin Tabs For:

### 1. **Team Members Tab** ✅ Backend Ready
- Fields: name, role, department, bio, image, email, linkedin, twitter, order
- Actions: Add, Edit, Delete, Reorder
- Features: Image upload, department filtering, social links

### 2. **Impact Stories Tab** ✅ Backend Ready  
- Fields: name, title, story, image, category, impact
- Actions: Add, Edit, Delete, Bulk Delete
- Features: Image upload, rich text editor, category filtering

### 3. **Impact Dashboard Tab** ✅ Backend Ready
- Fields: peopleServed, programsActive, volunteersActive, fundsRaised, communitiesReached, successRate
- Actions: Update stats (single record)
- Features: Number inputs, real-time preview

### 4. **Annual Reports Tab** ✅ Backend Ready
- Fields: title, year, fileUrl, description, fileSize
- Actions: Add, Delete
- Features: File upload, year selector

### 5. **Events Tab** ✅ Backend Ready
- Fields: title, description, date, time, location, image, category, capacity, status
- Actions: Add, Edit, Delete, Bulk Delete
- Features: Image upload, date/time picker, capacity tracking, status management

### 6. **Partners Tab** ✅ Backend Ready
- Fields: name, description, logo, website, category, since
- Actions: Add, Edit, Delete, Bulk Delete
- Features: Logo upload, website link, year selector

### 7. **Volunteer Opportunities Tab** ✅ Backend Ready
- Fields: title, description, requirements[], timeCommitment, location, category, openPositions, benefits[]
- Actions: Add, Edit, Delete
- Features: Array fields, rich text for requirements/benefits

### 8. **FAQ Tab** ✅ Backend Ready
- Fields: question, answer, category, order
- Actions: Add, Edit, Delete, Reorder
- Features: Rich text editor, reordering, category management

### 9. **Resources Tab** ✅ Backend Ready
- Fields: title, description, fileUrl, fileType, fileSize, category
- Actions: Add, Edit, Delete
- Features: File upload, file type detection, size display

### 10. **Donation Impact Section** (in Site Settings)
- Editable impact descriptions in donation page
- Update via Site Settings

## Implementation Steps:

### Phase 1: Add State Management (lines ~75-120)
```typescript
const [team, setTeam] = useState<any[]>([])
const [stories, setStories] = useState<any[]>([])
const [impactStats, setImpactStats] = useState<any>(null)
const [reports, setReports] = useState<any[]>([])
const [events, setEvents] = useState<any[]>([])
const [partners, setPartners] = useState<any[]>([])
const [opportunities, setOpportunities] = useState<any[]>([])
const [faqs, setFAQs] = useState<any[]>([])
const [resources, setResources] = useState<any[]>([])

// Form dialogs
const [showTeamForm, setShowTeamForm] = useState(false)
const [showStoryForm, setShowStoryForm] = useState(false)
const [showImpactStatsForm, setShowImpactStatsForm] = useState(false)
const [showReportForm, setShowReportForm] = useState(false)
const [showEventForm, setShowEventForm] = useState(false)
const [showPartnerForm, setShowPartnerForm] = useState(false)
const [showOpportunityForm, setShowOpportunityForm] = useState(false)
const [showFAQForm, setShowFAQForm] = useState(false)
const [showResourceForm, setShowResourceForm] = useState(false)

// Selection states for bulk operations
const [selectedTeam, setSelectedTeam] = useState<string[]>([])
const [selectedStories, setSelectedStories] = useState<string[]>([])
const [selectedEvents, setSelectedEvents] = useState<string[]>([])
const [selectedPartners, setSelectedPartners] = useState<string[]>([])
const [selectedFAQs, setSelectedFAQs] = useState<string[]>([])
const [selectedResources, setSelectedResources] = useState<string[]>([])
```

### Phase 2: Add Load Functions (after loadData function)
```typescript
const loadTeam = async () => { ... }
const loadStories = async () => { ... }
const loadImpactStats = async () => { ... }
const loadReports = async () => { ... }
const loadEvents = async () => { ... }
const loadPartners = async () => { ... }
const loadOpportunities = async () => { ... }
const loadFAQs = async () => { ... }
const loadResources = async () => { ... }
```

### Phase 3: Add Tab Triggers (in TabsList ~line 900)
```typescript
<TabsTrigger value="team">
  <Users size={16} className="mr-2" />
  Team
</TabsTrigger>
<TabsTrigger value="stories">
  <Heart size={16} className="mr-2" />
  Impact Stories
</TabsTrigger>
// ... all other tabs
```

### Phase 4: Add Tab Content Sections (after existing tabs ~line 1870)
- Each tab with:
  - Header with title and Add button
  - Filter/search if applicable
  - Bulk action buttons
  - Data grid/cards display
  - Empty state
  - Loading state

### Phase 5: Add Form Dialogs (after existing dialogs ~line 2500)
- Each form with:
  - All required fields
  - Image/file upload support
  - Rich text editor where needed
  - Validation
  - Submit handler
  - Cancel/close

### Phase 6: Add CRUD Handlers
```typescript
const handleAddTeam = async () => { ... }
const handleUpdateTeam = async (id, data) => { ... }
const handleDeleteTeam = async (id) => { ... }
// ... for all sections
```

## Features to Include:

### Standard Features (All Tabs):
- ✅ Add new items
- ✅ Edit existing items
- ✅ Delete items
- ✅ View item details
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Success toasts
- ✅ Confirmation dialogs for delete

### Advanced Features (Select Tabs):
- ✅ Bulk delete (where applicable)
- ✅ Bulk status update (events, stories)
- ✅ CSV export (all tabs)
- ✅ Image upload (team, stories, events, partners, gallery)
- ✅ File upload (reports, resources)
- ✅ Rich text editor (stories, FAQs, opportunities)
- ✅ Filtering by category
- ✅ Search functionality
- ✅ Sorting/reordering (team, FAQs)

### Role-Based Access:
- Super Admin: Full access to everything
- Admin: Can manage all content
- Editor: Can add/edit content, cannot delete
- Viewer: Read-only access

## UI Components to Use:
- Card - for displaying items
- Dialog - for add/edit forms
- Button - for actions
- Badge - for status/category
- Tabs - for navigation
- Alert - for confirmations
- toast - for notifications
- ReactQuill - for rich text
- Input/Textarea - for form fields
- Select - for dropdowns
- Checkbox - for bulk selection

## Total Lines of Code Estimate:
- Current file: ~2,500 lines
- After update: ~5,500 lines
- New additions: ~3,000 lines

## Implementation Priority:
1. **HIGH**: Team, Events, Partners (visible on frontend)
2. **HIGH**: Impact Stories, FAQ, Resources  (content-heavy)
3. **MEDIUM**: Volunteer Opportunities, Annual Reports
4. **LOW**: Impact Dashboard Stats (single record)

## Testing Checklist:
- [ ] All tabs load without errors
- [ ] Can add new items in all sections
- [ ] Can edit existing items
- [ ] Can delete items
- [ ] Images upload successfully
- [ ] Files upload successfully
- [ ] Rich text editor works
- [ ] Bulk operations work
- [ ] CSV export works
- [ ] Role permissions enforced
- [ ] All toasts display correctly
- [ ] Empty states show correctly
- [ ] Loading states work
- [ ] Mobile responsive

Would you like me to proceed with the full implementation?
