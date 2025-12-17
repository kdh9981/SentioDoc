// All tooltip definitions for analytics metrics

export const TOOLTIPS = {
  // Engagement
  engagementScore: "A score from 0-100 measuring how engaged this viewer was, based on time spent, completion rate, and actions taken like downloading.",

  intentSignal: "Indicates lead quality based on engagement: 🔥 Hot (70+) = ready to convert, 🟡 Warm (40-69) = interested, ⚪ Cold (<40) = low interest.",

  hotLead: "High-intent viewer who engaged deeply (80+ score), downloaded content, or returned multiple times. Priority for follow-up.",

  // Content
  contentHealthScore: "Overall content effectiveness (0-100) combining average engagement, completion rate, return rate, and download rate.",

  completionRate: "Percentage of viewers who reached the last page of your document or watched your video to completion.",

  returnRate: "Percentage of viewers who came back to view your content more than once. High return rate indicates valuable content.",

  actionRate: "Percentage of viewers who took an action like downloading your file.",

  // Page Analytics
  pageHeatmap: "Visual representation of which pages get the most attention. Darker colors = more time spent. Use this to identify your most engaging content.",

  dropOffRate: "Percentage of viewers who left at each page. High drop-off (>20%) indicates content that may need revision or restructuring.",

  entryPage: "The first page a viewer saw when they opened your document.",

  exitPage: "The last page a viewer saw before leaving. Clustering here may indicate a problem area.",

  // Traffic
  trafficSource: "Where your viewers came from: direct link, social media (LinkedIn, Twitter, Facebook), email, search engines, or other referrers.",

  referrer: "The website or platform that linked to your content. Helps understand which channels drive the most views.",

  utmParameters: "Tracking codes you can add to links to identify specific campaigns, sources, and content variations.",

  accessMethod: "Whether the viewer accessed your content by scanning a QR code or clicking a direct link.",

  // Viewers
  uniqueViewers: "Number of distinct people who viewed your content, counted by unique email or IP address.",

  totalViews: "Total number of times your content was opened, including repeat views by the same person.",

  avgTimeSpent: "Average duration viewers spent engaging with your content across all sessions.",

  // Contacts
  contactScore: "Overall engagement ranking (0-100) based on total views, average engagement, recency, and number of files viewed.",

  company: "Organization identified from the viewer's email domain (e.g., john@acme.com → Acme).",

  filesViewed: "Number of different files this contact has viewed. Multiple file views indicate higher interest.",

  // Advanced
  viralityScore: "Measures internal sharing: higher score (>3 viewers per company) indicates your content is being shared within organizations.",

  bestTimeToShare: "Analysis of when your viewers are most active. Sharing during peak times may increase engagement.",

  domainHealthScore: "Overall performance of all your links combined, factoring in content health, activity, and growth trends.",

  // Video specific
  watchTime: "Total time spent watching the video across all viewers.",

  avgWatchPercentage: "Average percentage of the video watched by viewers.",

  replayRate: "Percentage of viewers who rewatched portions of the video.",

  // Downloads
  downloadCount: "Number of times the file was downloaded by viewers.",

  // QR Code
  qrScans: "Number of times the QR code was scanned to access this content.",
} as const;

export type TooltipKey = keyof typeof TOOLTIPS;
