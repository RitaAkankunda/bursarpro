#!/usr/bin/env python
import os

os.chdir('c:\\Users\\user\\OneDrive\\Desktop\\fees-tracker\\bursarpro')

# Read bulk payment viewset
with open('bulk_payment_viewset.py', 'r') as f:
    content = f.read()

# Extract only the class definition (skip the comment)
lines = content.split('\n')
class_start = None
for i, line in enumerate(lines):
    if 'class BulkPaymentViewSet' in line:
        class_start = i
        break

if class_start:
    class_content = '\n'.join(lines[class_start:])
    # Append to views.py
    with open('finance/views.py', 'a') as f:
        f.write('\n\n')
        f.write(class_content)
    print('BulkPaymentViewSet appended to views.py')
else:
    print('Class not found')
