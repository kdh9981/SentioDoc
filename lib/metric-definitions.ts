/**
 * Metric Definitions for LinkLens
 * Complete definitions for ALL sections and pages
 *
 * NAMING CONVENTION (December 2024):
 * - "Engagement Score" = Viewer/Contact level (how interested a PERSON is)
 * - "Performance" = Link level (how well a LINK is doing)
 * - "Avg Performance" = Dashboard level (portfolio average)
 */

export const METRIC_DEFINITIONS: Record<string, string> = {
  // ==========================================
  // NAVIGATION
  // ==========================================
  dashboard: "Overview of all your links' performance including views, engagement, and top content.",
  uploadFile: "Upload documents (PDF, DOCX, PPTX) or media files to create trackable links.",
  trackSite: "Add tracking to external websites and URLs to monitor visitor clicks.",
  myLinks: "View and manage all your created links in one place.",
  favorites: "Quick access to your starred and frequently used links.",
  contacts: "All identified viewers across your links, organized by engagement level.",
  analytics: "Detailed analytics with charts, trends, and insights across all your content.",
  domains: "Manage custom domains for branded short links.",
  settings: "Account settings, preferences, integrations, and billing.",

  // ==========================================
  // DASHBOARD QUICK STATS (10 cards)
  // ==========================================
  totalViews: "Total number of times your content was viewed. Includes repeat views by the same person.",
  linkClicks: "Views from people clicking your shared link directly. Does not include QR code scans.",
  qrScans: "Views from people scanning your QR code.",
  uniqueViewers: "Number of different people who viewed your content. Each person is counted once, even if they viewed multiple files.",
  unique: "Number of different people who viewed your content. Each person is counted once, even if they viewed multiple files.",

  // DASHBOARD LEVEL - "Avg Performance" (portfolio average)
  avgPerformance: "Weighted average of all your links' Performance scores. Links with more views have more weight. Scale: 0-100.",
  engage: "Weighted average of all your links' Performance scores. Links with more views have more weight. Scale: 0-100.",

  hotLeads: "High-intent viewers who showed strong engagement with your content. These are your best prospects for follow-up.",
  completePercent: "Percentage of viewers who read through at least 90% of your uploaded files. Track Site clicks are not included.",
  avgViewTime: "Average time viewers spent engaging with your content. Only includes uploaded files with actual view time.",
  returnPercent: "Percentage of viewers who came back to view your content more than once. Shows how compelling your content is.",
  downloads: "Number of times viewers downloaded your files. Shows content value worth saving.",

  // ==========================================
  // FILE/LINK DETAIL QUICK STATS - "Performance" (link level)
  // ==========================================
  performanceFileLinkLevel: "How well this link is performing (0-100). Formula: Volume score (views) + Quality bonus (time spent, completion, downloads). More views with better quality = higher score.",
  performanceTrackSiteLinkLevel: "How well this track site is performing (0-100). Formula: Volume score (clicks) + Quality bonus (unique visitors, return rate, recency, velocity).",

  // Legacy keys (keep for backward compatibility)
  engageFileLinkLevel: "How well this link is performing (0-100). Formula: Volume score (views) + Quality bonus (time spent, completion, downloads). More views with better quality = higher score.",
  engageTrackSiteLinkLevel: "How well this track site is performing (0-100). Formula: Volume score (clicks) + Quality bonus (unique visitors, return rate, recency, velocity).",

  // ==========================================
  // DASHBOARD ANALYTICS CHARTS
  // ==========================================
  viewsOverTime: "Daily view count over your selected time period. Shows when your content receives the most attention.",
  engagementBreakdown: "Your viewers grouped by engagement level: Hot (highly engaged), Warm (moderately engaged), or Cold (low engagement). Each person is counted once based on their overall behavior.",
  performanceOverTime: "Daily average Performance score across your links. Shows trends in link performance over time.",
  bestTimeToShare: "The time window when your viewers are most active. Share content during these hours for maximum visibility.",
  topDays: "Which days of the week get the most views. Helps you plan when to share new content.",
  popularHours: "Hours of the day when most views happen. The green bar shows your peak hour.",
  returnVsNew: "How many viewers are returning vs seeing your content for the first time. High return rate means your content brings people back.",
  trafficSources: "Where your viewers came from: direct link, social media, email, search engines, or other websites.",
  accessMethod: "How viewers accessed your content: by clicking a link directly or by scanning a QR code.",
  utmCampaigns: "Performance breakdown by campaign tags you added to your links. Helps track which campaigns drive the most views.",
  devices: "What devices your viewers use: desktop computers, mobile phones, or tablets.",
  browsers: "Which web browsers your viewers use: Chrome, Safari, Firefox, Edge, etc.",
  operatingSystems: "Operating systems your viewers use: Windows, macOS, iOS, Android, etc.",
  languages: "Browser language settings of your viewers. Shows your audience's primary languages.",

  // ==========================================
  // GEOGRAPHIC DISTRIBUTION
  // ==========================================
  geographicDistribution: "Where your viewers are located around the world.",
  countries: "Countries where your viewers are located, ranked by view count.",
  cities: "Cities where your viewers are located.",
  regions: "States or provinces where your viewers are located.",
  worldMap: "Interactive map showing where your viewers are located. Darker colors indicate more views.",

  // ==========================================
  // ACTIONS TAKEN
  // ==========================================
  actionsTaken: "Key actions your viewers took while viewing your content.",
  downloadsAction: "How many viewers downloaded your file. Shows they found it valuable enough to save.",
  returnVisits: "How many viewers came back to view your content again.",
  uniqueViewersAction: "Number of different people who viewed your content.",
  uniqueRate: "What percentage of views came from unique viewers. Lower percentage means more repeat viewers.",

  // ==========================================
  // KEY INSIGHTS & ACTIONS
  // ==========================================
  keyInsights: "Smart observations about your content's performance and viewer behavior patterns.",
  recommendedActions: "Suggested next steps to improve engagement and convert more viewers.",

  // ==========================================
  // TOP PERFORMING & NEEDS ATTENTION
  // ==========================================
  topPerforming: "Your best performing content based on performance score. These links are resonating well with your audience.",
  needsAttention: "Content with low performance that may benefit from updates, better titles, or more promotion. Lowest scores shown first.",

  // ==========================================
  // DOCUMENT ANALYTICS
  // ==========================================
  quickSummary: "Key performance metrics for this document at a glance.",
  totalPages: "Total number of pages in your document.",
  avgCompletion: "Average percentage of the document that viewers read through.",
  mostPopular: "The page where viewers spend the most time reading.",
  completionFunnel: "Shows how far viewers progress through your document. See where people drop off.",
  topExitPages: "Pages where viewers most commonly stop reading. May indicate content that needs improvement.",
  pageAnalytics: "Detailed breakdown of time spent and exits for each page.",
  exitRate: "Percentage of viewers who stopped reading at this page.",

  // ==========================================
  // MEDIA ANALYTICS
  // ==========================================
  mediaAnalytics: "Watch time and completion metrics for your video or audio content.",
  avgWatchTime: "Average time viewers spent watching or listening.",
  watchCompletion: "Average percentage of media that viewers consumed.",

  // ==========================================
  // ENGAGEMENT LEVELS (VIEWER/CONTACT LEVEL - "Engagement Score")
  // ==========================================
  hotLead: "High-intent viewer who engaged deeply with your content. Priority for immediate follow-up.",
  warmLead: "Interested viewer who showed moderate engagement. Worth nurturing.",
  coldLead: "Low engagement viewer who may need different content or approach.",
  engagementScore: "Score from 0-100 measuring how deeply this viewer engaged with your content. Based on time spent, completion, downloads, and return visits.",
  intentSignal: "Lead quality indicator based on engagement: Hot (70+), Warm (40-69), or Cold (below 40).",

  // Viewer-level engagement scores (for file detail Viewers tab and contact pages)
  engageViewerFile: "This viewer's engagement score for uploaded files. Based on time spent, how much they read, whether they downloaded, and if they returned.",
  engageViewerTrackSite: "This viewer's engagement score for track sites. Based on whether they clicked multiple times and how frequently.",

  // ==========================================
  // CONTACT/VIEWER DETAILS
  // ==========================================
  contactScore: "Overall engagement score for this contact across all your content.",
  company: "Organization identified from the viewer's email domain.",
  filesViewed: "Number of different files this contact has viewed.",
  lastActive: "When this contact last viewed any of your content.",
  totalTimeSpent: "Total time this contact has spent viewing all your content.",
  viewHistory: "Timeline of all views from this contact.",

  // Individual Contact Page
  engageContact: "Average engagement score across all files this contact viewed.",
  totalViewsContact: "Total number of times this contact viewed your files, including repeat views.",
  filesViewedContact: "Number of unique files this contact has viewed.",
  totalTimeContact: "Total cumulative time this contact spent on your content.",
  firstSeenContact: "When this contact first viewed any of your content.",
  lastSeenContact: "When this contact most recently viewed your content.",
  activityHistory: "Detailed breakdown of this contact's engagement with each file.",
  fileEngageContact: "Engagement score for this specific file based on this contact's behavior.",

  // ==========================================
  // VIEWERS TAB (keeps "Engagement Score" - viewer level)
  // ==========================================
  viewers: "All people who viewed this content, sorted by engagement level.",
  viewerEmail: "Email address captured from the viewer (if email capture was enabled).",
  viewerLocation: "Geographic location based on the viewer's IP address.",
  viewerDevice: "Device type and browser used by the viewer.",
  viewerEngagement: "Engagement score for this specific viewer on this content.",
  viewerTimeSpent: "Total time this viewer spent on your content.",
  viewerCompletion: "How much of your content this viewer consumed.",
  viewerDownloaded: "Whether this viewer downloaded your file.",
  viewerReturnVisit: "Whether this viewer has viewed your content more than once.",

  // ==========================================
  // USAGE SECTION
  // ==========================================
  usage: "Your current plan usage and limits.",
  links: "Number of trackable links you've created.",
  views: "Total views tracked this month.",
  storage: "Storage space used for uploaded files.",

  // ==========================================
  // SETTINGS
  // ==========================================
  linkSettings: "Configure how this link behaves for viewers.",
  emailCapture: "Require viewers to enter their email before viewing.",
  passwordProtection: "Require a password to access your content.",
  linkExpiration: "Set when this link stops working.",
  downloadPermission: "Allow or prevent viewers from downloading.",
  customBranding: "Add your logo and customize appearance.",

  // ==========================================
  // FILE DETAIL SPECIFIC
  // ==========================================
  fileOverview: "Summary of this file's performance.",
  fileSettings: "Settings for this specific file.",
  shareLink: "The trackable URL to share with others.",
  qrCode: "Scannable QR code that links to your content.",
  embedCode: "HTML code to embed this content on your website.",

  // ==========================================
  // TRACK SITE
  // ==========================================
  trackUrl: "The external URL you're tracking.",
  redirectType: "How visitors are redirected after clicking.",
  trackingPixel: "Code snippet for advanced tracking on your website.",

  // ==========================================
  // PERIOD SELECTOR
  // ==========================================
  periodSelector: "Choose the time range for analytics. Your plan determines how far back you can view.",
  customRange: "Select specific start and end dates.",
};

/**
 * Get definition for a metric
 */
export function getMetricDefinition(key: string): string {
  return METRIC_DEFINITIONS[key] || `Information about ${key}.`;
}
