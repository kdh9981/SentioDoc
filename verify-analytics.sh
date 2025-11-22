#!/bin/bash

# Base URL
BASE_URL="http://localhost:3000"

# 1. Upload a file
echo "Uploading file..."
# Create a dummy file
echo "dummy content" > dummy.txt
RESPONSE=$(curl -s -X POST -F "file=@dummy.txt" $BASE_URL/api/upload)
echo "Upload Response: $RESPONSE"

# Extract File ID (simple grep/sed, assuming JSON structure)
FILE_ID=$(echo $RESPONSE | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)
echo "File ID: $FILE_ID"

if [ -z "$FILE_ID" ]; then
  echo "Failed to get File ID"
  exit 1
fi

# 2. Simulate View (Track)
echo "Tracking view..."
TRACK_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"fileId\":\"$FILE_ID\", \"viewerName\":\"Test User\", \"viewerEmail\":\"test@example.com\"}" $BASE_URL/api/track)
echo "Track Response: $TRACK_RESPONSE"

# 3. Fetch Analytics
echo "Fetching analytics..."
ANALYTICS_RESPONSE=$(curl -s $BASE_URL/api/files/$FILE_ID/analytics)
echo "Analytics Response: $ANALYTICS_RESPONSE"

# Check for country
if [[ "$ANALYTICS_RESPONSE" == *"country"* ]]; then
  echo "SUCCESS: Country field found in analytics."
else
  echo "FAILURE: Country field NOT found in analytics."
  exit 1
fi
