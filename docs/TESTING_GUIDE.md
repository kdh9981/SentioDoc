# LinkLens Complete Testing Guide

> Last Updated: December 6, 2025
> Test Environment: localhost:3000

---

## 📋 Pre-Testing Checklist

Before starting, ensure:

- [ ] `npm run dev` is running on localhost:3000
- [ ] Supabase project is connected (.env.local configured)
- [ ] You have a test account created
- [ ] Browser DevTools console is open (for error tracking)

---

## 🔐 Section 1: Authentication

### Test 1.1: Sign Up Flow
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Go to `/auth/signup` | Sign up form displays | ☐ |
| 2 | Enter invalid email (no @) | Error message shows | ☐ |
| 3 | Enter password < 6 chars | Error message shows | ☐ |
| 4 | Enter valid email + password | Success, redirect to verify email | ☐ |
| 5 | Check email inbox | Verification email received | ☐ |

### Test 1.2: Sign In Flow
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Go to `/auth/signin` | Sign in form displays | ☐ |
| 2 | Enter wrong password | Error message shows | ☐ |
| 3 | Enter correct credentials | Redirect to dashboard | ☐ |
| 4 | Refresh page | Stay logged in | ☐ |

### Test 1.3: Password Reset
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Go to `/auth/forgot-password` | Form displays | ☐ |
| 2 | Enter registered email | Success message | ☐ |
| 3 | Check email | Reset link received | ☐ |
| 4 | Click link, set new password | Password updated | ☐ |

### Test 1.4: Sign Out
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click sign out button | Redirect to home/signin | ☐ |
| 2 | Try to access `/dashboard` | Redirect to signin | ☐ |

---

## 📤 Section 2: File Upload

### Test 2.1: Upload Different File Types
| File Type | Test File | Upload Success? | Preview Works? |
|-----------|-----------|-----------------|----------------|
| PDF | Any .pdf | ☐ | ☐ |
| Image (PNG) | Any .png | ☐ | ☐ |
| Image (JPG) | Any .jpg | ☐ | ☐ |
| Video (MP4) | Any .mp4 | ☐ | ☐ |
| Audio (MP3) | Any .mp3 | ☐ | ☐ |
| Text (.txt) | Any .txt | ☐ | ☐ |
| Word (.docx) | Any .docx | ☐ | ☐ |
| Excel (.xlsx) | Any .xlsx | ☐ | ☐ |
| PowerPoint (.pptx) | Any .pptx | ☐ | ☐ |
| RTF (.rtf) | Any .rtf | ☐ | ☐ |

### Test 2.2: Upload with Settings
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Upload file with custom title | Title saved correctly | ☐ |
| 2 | Upload with password protection | Password toggle works | ☐ |
| 3 | Enter password + confirm password | Passwords must match | ☐ |
| 4 | Upload with email gate | Email required on view | ☐ |
| 5 | Upload with expiration date | Date picker works | ☐ |
| 6 | Upload with download disabled | Download button hidden on viewer | ☐ |

### Test 2.3: Upload Error Handling
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Upload file > 50MB | Error message (file too large) | ☐ |
| 2 | Upload unsupported type | Error or warning | ☐ |
| 3 | Cancel upload mid-way | Upload stops cleanly | ☐ |

---

## 👁️ Section 3: File Viewers

### Test 3.1: PDF Viewer
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open PDF link | PDF renders correctly | ☐ |
| 2 | Navigate pages (next/prev) | Page changes | ☐ |
| 3 | Page counter shows correctly | "Page X of Y" accurate | ☐ |
| 4 | Zoom controls work | PDF zooms in/out | ☐ |
| 5 | Download button (if enabled) | PDF downloads | ☐ |
| 6 | Download button (if disabled) | Button not visible | ☐ |
| 7 | "Powered by LinkLens" visible | Branding shows | ☐ |

### Test 3.2: Image Viewer
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open image link | Image displays centered | ☐ |
| 2 | Image is responsive | Fits screen properly | ☐ |
| 3 | Download button works | Image downloads | ☐ |
| 4 | Branding visible | "Powered by LinkLens" shows | ☐ |

### Test 3.3: Video Player
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open video link | Video player loads | ☐ |
| 2 | Play/pause works | Video controls function | ☐ |
| 3 | Seek bar works | Can jump to position | ☐ |
| 4 | Volume control works | Sound adjusts | ☐ |
| 5 | Fullscreen works | Expands properly | ☐ |
| 6 | Native download hidden | No download in menu | ☐ |
| 7 | Download button (if enabled) | Custom button works | ☐ |

### Test 3.4: Audio Player
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open audio link | Audio player loads | ☐ |
| 2 | Play/pause works | Audio controls function | ☐ |
| 3 | Progress bar works | Shows playback position | ☐ |
| 4 | Download button works | Audio downloads | ☐ |

### Test 3.5: Text Viewer
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open text file link | Content displays | ☐ |
| 2 | Code highlighting (if code) | Syntax colored | ☐ |
| 3 | Line numbers visible | Numbers show | ☐ |

### Test 3.6: Office Documents
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open .docx link | Microsoft viewer loads OR download fallback | ☐ |
| 2 | Open .xlsx link | Microsoft viewer loads OR download fallback | ☐ |
| 3 | Open .pptx link | Microsoft viewer loads OR download fallback | ☐ |
| 4 | Open .rtf link | Microsoft viewer loads OR download fallback | ☐ |

---

## 🔒 Section 4: Access Control

### Test 4.1: Password Protection
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open password-protected link | Password prompt shows | ☐ |
| 2 | Enter wrong password | Error message | ☐ |
| 3 | Enter correct password | Content displays | ☐ |
| 4 | Refresh page | Password remembered (session) | ☐ |

### Test 4.2: Email Gate
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open email-gated link | Email form shows | ☐ |
| 2 | Enter invalid email | Validation error | ☐ |
| 3 | Enter valid email + name | Content displays | ☐ |
| 4 | Check access_logs | Email recorded | ☐ |

### Test 4.3: Expiration Date
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Set expiration to past date | Link shows expired page | ☐ |
| 2 | Set expiration to future | Link works normally | ☐ |
| 3 | Expired page styling | Shows "Link Expired" nicely | ☐ |

---

## 📊 Section 5: Analytics & Tracking

### Test 5.1: Basic View Tracking
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open a link (incognito) | View count increases | ☐ |
| 2 | Check dashboard | New view appears | ☐ |
| 3 | Device type captured | desktop/mobile/tablet | ☐ |
| 4 | Browser captured | Chrome/Safari/Firefox/etc | ☐ |
| 5 | Country captured | Geolocation works | ☐ |

### Test 5.2: Engagement Tracking (PDF)
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | View PDF, go to page 3 | max_page_reached = 3 | ☐ |
| 2 | Stay on page for 30s | Time tracked | ☐ |
| 3 | Close tab | Session ends, data saved | ☐ |
| 4 | Check pages_time_data | JSON has per-page times | ☐ |

### Test 5.3: Engagement Tracking (Video)
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Watch video 50% | watch_time_seconds tracked | ☐ |
| 2 | Watch to end | video_finished = true | ☐ |
| 3 | video_completion_percent | Shows correct % | ☐ |

### Test 5.4: Engagement Score Calculation
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | View content briefly | Low engagement score (0-30) | ☐ |
| 2 | View content fully | High engagement score (70+) | ☐ |
| 3 | Download content | +50 to action score | ☐ |
| 4 | Return visit | is_return_visit = true | ☐ |

### Test 5.5: Intent Signal
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Engagement < 40 | intent_signal = 'cold' | ☐ |
| 2 | Engagement 40-69 | intent_signal = 'warm' | ☐ |
| 3 | Engagement 70+ | intent_signal = 'hot' | ☐ |

### Test 5.6: UTM Tracking
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Add UTM params to link | `?utm_source=test&utm_medium=email` | ☐ |
| 2 | Open link with UTMs | Params captured in access_logs | ☐ |
| 3 | Check referrer_source | Correctly parsed | ☐ |

---

## ⭐ Section 6: Quick Win Features

### Test 6.1: Star/Favorite
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click star on file card | Star turns yellow (filled) | ☐ |
| 2 | Click star again | Star turns gray (unfilled) | ☐ |
| 3 | Check database | is_favorite toggled | ☐ |
| 4 | Filter by favorites | Only starred files show | ☐ |

### Test 6.2: Notes
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open file settings | Notes textarea visible | ☐ |
| 2 | Type notes | Auto-saves (debounced) | ☐ |
| 3 | "Saving..." appears | Loading indicator | ☐ |
| 4 | "Saved ✓" appears | Confirmation | ☐ |
| 5 | Refresh page | Notes persisted | ☐ |

### Test 6.3: Time Filter
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Select "7 days" | Analytics filter to 7 days | ☐ |
| 2 | Select "14 days" | Analytics filter to 14 days | ☐ |
| 3 | Select "30 days" | Analytics filter to 30 days | ☐ |
| 4 | Select "All time" | All data shows | ☐ |

### Test 6.4: Copy Link
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click "Copy" button | Link copied to clipboard | ☐ |
| 2 | Button changes | Shows "Copied!" with checkmark | ☐ |
| 3 | After 2 seconds | Reverts to original state | ☐ |

### Test 6.5: QR Code
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click QR code button | Modal opens with QR | ☐ |
| 2 | Click "Download QR" | PNG downloads | ☐ |
| 3 | Click "Copy QR" | Image copied to clipboard | ☐ |
| 4 | Scan QR with phone | Opens correct link | ☐ |

### Test 6.6: Delete Confirmation
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click delete button | Confirmation modal opens | ☐ |
| 2 | Modal shows filename | "Delete 'filename'?" | ☐ |
| 3 | Warning text visible | Red warning about data loss | ☐ |
| 4 | Click Cancel | Modal closes, nothing deleted | ☐ |
| 5 | Click Delete | File deleted, redirect | ☐ |

---

## 🏷️ Section 7: Medium Features

### Test 7.1: Tags
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Open file settings | Tag input visible | ☐ |
| 2 | Type tag + Enter | Tag added as pill | ☐ |
| 3 | Click X on tag | Tag removed | ☐ |
| 4 | Type comma | New tag created | ☐ |
| 5 | Tags persist | Saved to database | ☐ |

### Test 7.2: Contacts CRM
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Navigate to /dashboard (contacts section) | Contacts page loads | ☐ |
| 2 | View after email gate | Contact created | ☐ |
| 3 | Contact shows name/email | Data displays | ☐ |
| 4 | Company parsed from email | "acme" from "user@acme.com" | ☐ |
| 5 | Engagement score shows | 0-100 scale | ☐ |
| 6 | Hot lead badge | 🔥 for high engagement | ☐ |
| 7 | Filter by hot leads | Only hot leads show | ☐ |
| 8 | Search contacts | Filter by name/email/company | ☐ |

### Test 7.3: CSV Export (Basic)
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Click "Export CSV" | CSV downloads | ☐ |
| 2 | Open CSV | Columns: Name, Email, Time, etc. | ☐ |
| 3 | Data accurate | Matches dashboard | ☐ |

### Test 7.4: UTM Builder
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Find UTM builder | Component visible | ☐ |
| 2 | Enter source, medium, campaign | URL updates live | ☐ |
| 3 | Copy generated URL | Correct UTM params | ☐ |
| 4 | Save as preset | Preset saved | ☐ |
| 5 | Load preset | Fields populated | ☐ |

### Test 7.5: Custom Logo
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Go to settings | Logo upload visible | ☐ |
| 2 | Upload logo image | Preview shows | ☐ |
| 3 | View a link | Custom logo appears (if paid tier) | ☐ |
| 4 | Remove logo | "Powered by LinkLens" returns | ☐ |

---

## 🎯 Section 8: Pro Features

### Test 8.1: TierGate Component
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | As free user, view analytics | Some features blurred | ☐ |
| 2 | Blur overlay visible | Shows upgrade CTA | ☐ |
| 3 | Click upgrade button | Navigates to billing | ☐ |
| 4 | As paid user, view analytics | All features visible | ☐ |

### Test 8.2: Page Heatmap
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | View PDF with multiple pages | Analytics available | ☐ |
| 2 | Heatmap displays | Color-coded pages | ☐ |
| 3 | Hottest page marked | 🔥 indicator | ☐ |
| 4 | Hover shows avg time | Tooltip works | ☐ |

### Test 8.3: Drop-off Chart
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | View document with views | Chart displays | ☐ |
| 2 | Bars show drop-off % | Color coded (green/orange/red) | ☐ |
| 3 | Table shows details | Page, viewers, rate | ☐ |
| 4 | Insight message | Shows worst drop-off page | ☐ |

### Test 8.4: World Map / Geography
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Views from multiple countries | Data available | ☐ |
| 2 | Country list displays | Sorted by views | ☐ |
| 3 | Flag emojis show | 🇺🇸 🇬🇧 etc. | ☐ |
| 4 | Percentage calculated | Adds to 100% | ☐ |

### Test 8.5: Action Dashboard
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Have hot leads | Hot leads section shows | ☐ |
| 2 | Lead details visible | Name, file, score, time | ☐ |
| 3 | "View Details" button | Navigates to file | ☐ |
| 4 | Action items show | Recommendations list | ☐ |

### Test 8.6: CSV Export (Full - Pro)
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | As Pro user, export full | All columns included | ☐ |
| 2 | As free user, export full | Error or upgrade prompt | ☐ |

---

## 🎨 Section 9: UI Polish

### Test 9.1: Tooltips
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Hover over "?" icon | Tooltip appears | ☐ |
| 2 | Tooltip content accurate | Matches documentation | ☐ |
| 3 | Tooltip positioning | Doesn't overflow screen | ☐ |

### Test 9.2: Empty States
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | New account, no files | "No links yet" message | ☐ |
| 2 | File with no views | "No views yet" message | ☐ |
| 3 | Empty contacts | "No contacts yet" message | ☐ |
| 4 | Search with no results | "No results" message | ☐ |

### Test 9.3: Loading States
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Load dashboard | Skeleton placeholders show | ☐ |
| 2 | Load file detail | Skeleton stats/charts | ☐ |
| 3 | Load contacts | Skeleton table | ☐ |
| 4 | After load | Content replaces skeleton | ☐ |

### Test 9.4: Toast Notifications
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Copy link | Success toast shows | ☐ |
| 2 | Delete file | Success toast shows | ☐ |
| 3 | Error occurs | Error toast (red) shows | ☐ |
| 4 | Toast auto-dismisses | Gone after ~4 seconds | ☐ |

### Test 9.5: Branding Consistency
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Check logo everywhere | "Link" = dark slate #1e293b | ☐ |
| 2 | Check logo everywhere | "Lens" = purple #7c8ce0 | ☐ |
| 3 | Viewer branding | Consistent with dashboard | ☐ |
| 4 | Landing page | Same brand colors | ☐ |

---

## 📱 Section 10: Responsive Design

### Test 10.1: Mobile (< 768px)
| Page | Renders Correctly? | Usable? |
|------|-------------------|---------|
| Landing page | ☐ | ☐ |
| Sign in/up | ☐ | ☐ |
| Dashboard | ☐ | ☐ |
| File detail | ☐ | ☐ |
| PDF viewer | ☐ | ☐ |
| Video viewer | ☐ | ☐ |

### Test 10.2: Tablet (768px - 1024px)
| Page | Renders Correctly? | Usable? |
|------|-------------------|---------|
| Dashboard | ☐ | ☐ |
| File detail | ☐ | ☐ |
| Analytics | ☐ | ☐ |

---

## 🐛 Section 11: Error Handling

### Test 11.1: Network Errors
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Disconnect network, upload | Error message shows | ☐ |
| 2 | API timeout | Graceful error | ☐ |

### Test 11.2: Invalid URLs
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Go to `/view/invalid-id` | 404 or "not found" page | ☐ |
| 2 | Go to `/dashboard/files/invalid` | 404 or redirect | ☐ |

### Test 11.3: Console Errors
| Step | Action | Expected Result | Pass? |
|------|--------|-----------------|-------|
| 1 | Browse all pages | No red errors in console | ☐ |
| 2 | Upload files | No errors | ☐ |
| 3 | View analytics | No errors | ☐ |

---

## ✅ Final Checklist

Before considering testing complete:

- [ ] All sections above passed
- [ ] No console errors
- [ ] Mobile responsive works
- [ ] All file types work
- [ ] Analytics data captures correctly
- [ ] UI components render properly
- [ ] Branding is consistent

---

## 🐞 Bug Report Template

When you find a bug, document it like this:

```
### Bug #[number]

**Location:** [Page/Component]
**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** 
**Actual:** 

**Screenshot:** [if applicable]

**Console Error:** [if any]
```

---

## Notes

- Test in Chrome first, then Safari, Firefox
- Test both logged-in and logged-out states
- Test with fresh data and with existing data
- Check Supabase dashboard to verify data saves correctly

