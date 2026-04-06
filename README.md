# BursarPro - School Fee Management System

BursarPro is a lightweight, comprehensive school fee management web application designed for Ugandan schools. It enables educators and administrators to efficiently track student payments, calculate account balances, send automated SMS reminders, and generate detailed PDF reports.

## System Overview

BursarPro is built with a modern, scalable architecture:

- **Frontend**: React-based single-page application with responsive UI
- **Backend**: Django REST API providing robust business logic and data management
- **Database**: Supabase PostgreSQL for reliable, secure data storage
- **Real-time Features**: WebSocket support for live activity tracking and notifications

## Key Features

- **Payment Tracking**: Monitor individual and bulk student fee payments in real-time
- **Balance Calculations**: Automated computation of student account balances and outstanding fees
- **SMS Notifications**: Send automated payment reminders to parents and guardians
- **PDF Reports**: Generate comprehensive financial and administrative reports
- **Multi-Role Support**: Distinct dashboards and permissions for Headmasters, Finance Officers, Teachers, and Parents
- **Bulk Payment Processing**: Handle multiple payments efficiently
- **Activity Auditing**: Track all financial transactions and system activities
- **Search & Analytics**: Advanced search capabilities and analytics dashboard

## Project Structure

```
bursarpro/
├── backend/          # Django REST API
│   ├── core/         # Django configuration
│   ├── finance/      # Core business logic & models
│   └── manage.py     # Django management script
└── frontend/         # React application
    ├── src/          # React components & services
    └── vite.config.js # Build configuration
```

## Tech Stack

- **Backend**: Django, Django REST Framework
- **Frontend**: React, Vite
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Django Channels, WebSockets
- **SMS**: Twilio integration
- **Reporting**: ReportLab for PDF generation

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

The backend provides RESTful APIs for:
- User authentication and authorization
- Payment management
- Student fee tracking
- Report generation
- SMS notifications
- Activity logging

## Features by User Role

### Headmaster Dashboard
- School-wide financial overview
- Fee structure management
- Staff performance metrics

### Finance Officer
- Payment processing
- Report generation
- Account reconciliation

### Teachers
- Student payment status
- Class-level analytics

### Parents/Guardians
- Payment history
- Outstanding balance view
- Payment methods

## Database Models

- Students & Parents
- Fee Structures & Payment Plans
- Payments & Transactions
- Notifications & Activity Logs
- School Configuration

## Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## License

This project is proprietary software for Educational Institutions.

---

**Version**: 1.0  
**Last Updated**: April 2026
