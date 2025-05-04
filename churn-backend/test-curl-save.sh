#!/bin/bash
curl -X POST http://localhost:3000/save \
  -H "Content-Type: application/json" \
  -d '[{"Account ID": "cust001", "Status": "Approved", "Comments": "Follow-up"}]'
