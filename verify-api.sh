#!/bin/bash

echo "1. Testing Upload..."
UPLOAD_RESPONSE=$(curl -s -X POST -F "file=@test-file.txt" http://localhost:3000/api/upload)
echo "Response: $UPLOAD_RESPONSE"

FILE_ID=$(echo $UPLOAD_RESPONSE | grep -o '"fileId":"[^"]*"' | cut -d'"' -f4)
echo "File ID: $FILE_ID"

if [ -z "$FILE_ID" ]; then
  echo "Upload failed"
  exit 1
fi

echo -e "\n2. Testing File List..."
curl -s http://localhost:3000/api/files | grep "$FILE_ID"
if [ $? -eq 0 ]; then
  echo "File found in list"
else
  echo "File not found in list"
  exit 1
fi

echo -e "\n3. Testing Tracking..."
TRACK_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"fileId\":\"$FILE_ID\",\"viewerName\":\"API Tester\",\"viewerEmail\":\"api@test.com\"}" http://localhost:3000/api/track)
echo "Response: $TRACK_RESPONSE"

echo -e "\n4. Testing File Download..."
curl -s -o downloaded-test.txt "http://localhost:3000/api/file/$FILE_ID"
if diff test-file.txt downloaded-test.txt > /dev/null; then
  echo "File downloaded correctly"
else
  echo "File download mismatch"
  exit 1
fi

echo -e "\n5. Checking View Count..."
curl -s http://localhost:3000/api/files | grep "\"views\":1"
if [ $? -eq 0 ]; then
  echo "View count incremented"
else
  echo "View count check failed"
fi

rm downloaded-test.txt
echo -e "\nVerification Complete!"
