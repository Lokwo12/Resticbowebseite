const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'EnhancedAdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const tabsToExtract = [
  { tab: 'news', name: 'NewsTab', title: 'News' },
  { tab: 'gallery', name: 'GalleryTab', title: 'Gallery' },
  { tab: 'team', name: 'TeamTab', title: 'Team' },
  { tab: 'contacts', name: 'ContactsTab', title: 'Contacts' },
  { tab: 'volunteers', name: 'VolunteersTab', title: 'Volunteers' },
  { tab: 'donations', name: 'DonationsTab', title: 'Donations' },
  { tab: 'subscribers', name: 'SubscribersTab', title: 'Subscribers' },
  { tab: 'stories', name: 'StoriesTab', title: 'Stories' },
  { tab: 'impact', name: 'ImpactStatsTab', title: 'Impact Stats' },
  { tab: 'reports', name: 'ReportsTab', title: 'Reports' },
  { tab: 'events', name: 'EventsTab', title: 'Events' },
  { tab: 'partners', name: 'PartnersTab', title: 'Partners' },
  { tab: 'opportunities', name: 'OpportunitiesTab', title: 'Opportunities' },
  { tab: 'faqs', name: 'FaqsTab', title: 'FAQs' },
  { tab: 'resources', name: 'ResourcesTab', title: 'Resources' },
  { tab: 'pages', name: 'PagesTab', title: 'Pages' }
];

let importsToAdd = [];
let modifications = [];

for (let i = 0; i < tabsToExtract.length; i++) {
  const current = tabsToExtract[i];
  const next = tabsToExtract[i + 1];
  
  const startMarker = `            {/* ${current.title} Management */}`;
  const endMarker = next ? `            {/* ${next.title} Management */}` : `            {/* Form Dialogs`; // End of the switch block
  
  const startIndex = content.indexOf(startMarker);
  let endIndex = -1;
  
  if (endMarker === `            {/* Form Dialogs`) {
     const temp = content.indexOf(`{/* Form Dialogs from AdminFormDialogs */}`);
     if (temp !== -1) {
         // The block ends before the closing `}` of the main container, around line 4650
         // Let's just find the last `)}` before the Form Dialogs
         const subContent = content.substring(startIndex, temp);
         const lastClose = subContent.lastIndexOf(')}');
         endIndex = startIndex + lastClose + 2;
     }
  } else {
     endIndex = content.indexOf(endMarker);
  }
  
  if (startIndex !== -1 && endIndex !== -1) {
    console.log(`Extracting ${current.name}...`);
    const block = content.substring(startIndex, endIndex);
    
    // Create Component
    const compContent = `import React from 'react';
import { Newspaper, Plus, Trash2, Edit, X, Eye, FileText, Image as ImageIcon, Users, MessageSquare, Calendar, Handshake, Target, HelpCircle, BookOpen, Globe, Mail, Heart, Send, Clock, Badge, ChevronRight, TrendingUp, Download, Shield, EyeOff, User, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/button';

export function ${current.name}(props: any) {
  const { 
    news, setNews, selectedNews, setSelectedNews, handleBulkDeleteNews, handleDeleteNews, setShowNewsForm,
    gallery, setGallery, selectedGallery, setSelectedGallery, handleBulkDeleteGallery, handleDeleteGallery, setShowGalleryForm,
    team, setTeam, selectedTeam, setSelectedTeam, handleBulkDeleteTeam, handleDeleteTeam, setShowTeamForm,
    contacts, setContacts, selectedContacts, setSelectedContacts, handleBulkDeleteContacts, handleDeleteContact,
    volunteers, setVolunteers, selectedVolunteers, setSelectedVolunteers, handleBulkDeleteVolunteers, handleDeleteVolunteer,
    donations, setDonations, selectedDonations, setSelectedDonations, handleBulkDeleteDonations, handleDeleteDonation,
    subscribers, setSubscribers, selectedSubscribers, setSelectedSubscribers, handleBulkDeleteSubscribers, handleDeleteSubscriber,
    stories, setStories, selectedStories, setSelectedStories, handleBulkDeleteStories, handleDeleteStory, setShowStoryForm,
    events, setEvents, selectedEvents, setSelectedEvents, handleBulkDeleteEvents, handleDeleteEvent, setShowEventForm,
    partners, setPartners, selectedPartners, setSelectedPartners, handleBulkDeletePartners, handleDeletePartner, setShowPartnerForm,
    reports, setReports, selectedReports, setSelectedReports, handleBulkDeleteReports, handleDeleteReport, setShowReportForm,
    opportunities, setOpportunities, selectedOpportunities, setSelectedOpportunities, handleBulkDeleteOpportunities, handleDeleteOpportunity, setShowOpportunityForm,
    faqs, setFaqs, selectedFaqs, setSelectedFaqs, handleBulkDeleteFaqs, handleDeleteFaq, setShowFAQForm,
    resources, setResources, selectedResources, setSelectedResources, handleBulkDeleteResources, handleDeleteResource, setShowResourceForm,
    pages, setPages, selectedPages, setSelectedPages, handleBulkDeletePages, handleDeletePage, setShowPageForm,
    stats, setStats, analytics, setAnalytics,
    setEditingItem, setFormData, setViewingItem,
    activeTab, projectId, accessToken
  } = props;
  
  return (
    <React.Fragment>
${block}
    </React.Fragment>
  );
}
`;
    
    fs.writeFileSync(path.join(__dirname, 'src', 'components', 'admin', 'tabs', `${current.name}.tsx`), compContent);
    
    // Replace block in dashboard
    modifications.push({
      start: startIndex,
      end: endIndex,
      replacement: `            {/* ${current.title} Management */}\n            <${current.name} {...props} />\n\n`
    });
    
    importsToAdd.push(`import { ${current.name} } from './admin/tabs/${current.name}';`);
  }
}

// Apply modifications from bottom up to avoid index shifting
modifications.sort((a, b) => b.start - a.start);
for (const mod of modifications) {
  content = content.substring(0, mod.start) + mod.replacement + content.substring(mod.end);
}

// Inject imports at line 86
const importLines = importsToAdd.join('\\n');
const importIndex = content.indexOf('const supabase = createClient');
content = content.substring(0, importIndex) + importLines + '\\n\\n' + content.substring(importIndex);

// Add props object creation right before the return statement of EnhancedAdminDashboard
const propsObj = `
  const props = {
    news, setNews, selectedNews, setSelectedNews, handleBulkDeleteNews, handleDeleteNews, setShowNewsForm,
    gallery, setGallery, selectedGallery, setSelectedGallery, handleBulkDeleteGallery, handleDeleteGallery, setShowGalleryForm,
    team, setTeam, selectedTeam, setSelectedTeam, handleBulkDeleteTeam, handleDeleteTeam, setShowTeamForm,
    contacts, setContacts, selectedContacts, setSelectedContacts, handleBulkDeleteContacts, handleDeleteContact,
    volunteers, setVolunteers, selectedVolunteers, setSelectedVolunteers, handleBulkDeleteVolunteers, handleDeleteVolunteer,
    donations, setDonations, selectedDonations, setSelectedDonations, handleBulkDeleteDonations, handleDeleteDonation,
    subscribers, setSubscribers, selectedSubscribers, setSelectedSubscribers, handleBulkDeleteSubscribers, handleDeleteSubscriber,
    stories, setStories, selectedStories, setSelectedStories, handleBulkDeleteStories, handleDeleteStory, setShowStoryForm,
    events, setEvents, selectedEvents, setSelectedEvents, handleBulkDeleteEvents, handleDeleteEvent, setShowEventForm,
    partners, setPartners, selectedPartners, setSelectedPartners, handleBulkDeletePartners, handleDeletePartner, setShowPartnerForm,
    reports, setReports, selectedReports, setSelectedReports, handleBulkDeleteReports, handleDeleteReport, setShowReportForm,
    opportunities, setOpportunities, selectedOpportunities, setSelectedOpportunities, handleBulkDeleteOpportunities, handleDeleteOpportunity, setShowOpportunityForm,
    faqs, setFaqs, selectedFaqs, setSelectedFaqs, handleBulkDeleteFaqs, handleDeleteFaq, setShowFAQForm,
    resources, setResources, selectedResources, setSelectedResources, handleBulkDeleteResources, handleDeleteResource, setShowResourceForm,
    pages, setPages, selectedPages, setSelectedPages, handleBulkDeletePages, handleDeletePage, setShowPageForm,
    stats, setStats, analytics, setAnalytics,
    setEditingItem, setFormData, setViewingItem,
    activeTab, projectId, accessToken
  };
`;

const returnIndex = content.indexOf('  return (\\n    <div className="min-h-screen');
if (returnIndex !== -1) {
  content = content.substring(0, returnIndex) + propsObj + '\\n' + content.substring(returnIndex);
}

fs.writeFileSync(filePath, content);
console.log('Successfully modularized all tabs!');
