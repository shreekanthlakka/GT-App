# Approval Workflow System - Product Design Requirements (PDR)

## Document Information
- **Version**: 1.0
- **Created**: December 2024
- **Product**: Textile Shop Accounting & Ecommerce Software
- **Component**: Approval Workflow Middleware

## Table of Contents
1. [Overview](#overview)
2. [Business Context](#business-context)
3. [System Architecture](#system-architecture)
4. [Technical Specifications](#technical-specifications)
5. [User Flows](#user-flows)
6. [API Design](#api-design)
7. [Database Schema](#database-schema)
8. [Implementation Guidelines](#implementation-guidelines)

## Overview

### Purpose
Design an approval workflow system as middleware for a single textile shop's accounting software to manage financial approvals across different user roles (OWNER, STAFF, MANAGER).

### Scope
- Approval middleware for financial transactions (payments, expenses)
- Role-based approval routing
- Integration with existing notification service
- Simple setup and configuration for single store operations

### Key Principles
- **Middleware Approach**: Intercept requests before processing
- **Role-Based Control**: OWNER approves all significant transactions
- **Event-Driven Notifications**: Integrate with existing Kafka-based notification service
- **Business Logic Location**: Approval logic resides in business services (accounts-service)

## Business Context

### Store Structure
- **Single Textile Shop** with multiple staff members
- **Three User Roles**:
  - OWNER: Final approver for all significant transactions
  - MANAGER: Can review and recommend, but OWNER still approves
  - STAFF: Creates transactions that need approval

### Business Rules
- Payments above ₹1,000 require OWNER approval
- Expenses above ₹5,000 require OWNER approval
- OWNER actions bypass approval workflow
- All approvals trigger notifications to relevant parties

### Workflow Scenarios
1. **Staff Payment Creation**: Staff → OWNER approval → Payment processing
2. **Manager Review**: Staff → Manager review → OWNER approval → Processing
3. **Owner Direct**: Owner creates payment → Direct processing (no approval)
4. **Rejection Flow**: Any approval can be rejected with reason

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend App   │    │ Accounts Service│    │Notification Svc │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Approval UI  │ │    │ │ Approval    │ │    │ │Email/SMS    │ │
│ └─────────────┘ │    │ │ Middleware  │ │    │ │Sender       │ │
└─────────────────┘    │ └─────────────┘ │    │ └─────────────┘ │
         │              │        │        │    └─────────────────┘
         │              │        ▼        │              ▲
         │              │ ┌─────────────┐ │              │
         └──────────────┼─│ Controllers │ │              │
                        │ └─────────────┘ │              │
                        │        │        │              │
                        │        ▼        │              │
                        │ ┌─────────────┐ │    ┌─────────┴─────────┐
                        │ │ Database    │ │    │     Kafka         │
                        │ └─────────────┘ │    │   (Events)        │
                        └─────────────────┘    └───────────────────┘
```

### Component Responsibilities

**Accounts Service**:
- Approval middleware logic
- Pending approval management
- Business rule evaluation
- Approved action processing

**Notification Service**:
- Email/SMS/WhatsApp delivery
- Template management
- Delivery tracking
- Unchanged from current design

**Frontend Application**:
- Approval request submission
- Approval dashboard for owners
- Status tracking for staff

## Technical Specifications

### Technology Stack
- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Messaging**: Kafka for event-driven notifications
- **Authentication**: JWT-based with role checking

### Integration Points
- **Middleware Integration**: Express.js middleware pattern
- **Notification Events**: Kafka events to notification service
- **Database**: Extends existing Prisma schema
- **API**: RESTful endpoints for approval management

### Performance Requirements
- Approval check: < 100ms
- Notification delivery: < 5 seconds
- Dashboard load: < 2 seconds
- 99.9% uptime for approval system

### Security Considerations
- Role-based access control
- Approval action audit trail
- Secure token generation for email approvals
- Input validation and sanitization

## User Flows

### 1. Staff Creates Payment (Requires Approval)
```
1. Staff logs in and navigates to Create Payment
2. Staff fills payment form (amount > ₹1,000)
3. Staff clicks "Submit Payment"
4. System checks approval rules
5. System creates PendingApproval record
6. System sends approval email to OWNER
7. Staff sees "Submitted for Approval" message
8. OWNER receives email notification
9. OWNER clicks approve/reject in email or dashboard
10. System processes payment if approved
11. System sends confirmation to all parties
```

### 2. Owner Creates Payment (No Approval)
```
1. Owner logs in and navigates to Create Payment
2. Owner fills payment form
3. Owner clicks "Submit Payment"
4. System checks user role (OWNER)
5. System bypasses approval workflow
6. System processes payment immediately
7. System sends payment confirmation
```

### 3. Approval Management Flow
```
1. Owner opens approval dashboard
2. System shows pending approvals list
3. Owner clicks on specific approval
4. Owner reviews payment details
5. Owner clicks Approve/Reject with optional comments
6. System processes business action if approved
7. System updates approval status
8. System sends notifications to submitter and relevant parties
```

## API Design

### Middleware Usage
```typescript
// Apply to any endpoint requiring approval
router.post('/payments', 
  authenticate, 
  requiresApproval(paymentApprovalConfig), 
  createPayment
);
```

### Core Endpoints
```
POST   /api/v1/approvals                    # Create approval request
GET    /api/v1/approvals/pending            # Get pending approvals
GET    /api/v1/approvals/:id                # Get approval details
POST   /api/v1/approvals/:id/approve        # Approve action
POST   /api/v1/approvals/:id/reject         # Reject action
GET    /api/v1/approvals/rules              # Get approval rules
POST   /api/v1/approvals/rules              # Create/update rules
```

### Request/Response Examples

#### Create Payment (Requiring Approval)
```json
// Request
POST /api/v1/payments
{
  "partyId": "party_123",
  "amount": 25000,
  "description": "Raw material purchase",
  "method": "BANK_TRANSFER"
}

// Response (Approval Required)
{
  "success": true,
  "message": "Payment submitted for approval",
  "data": {
    "pendingApprovalId": "approval_123",
    "status": "PENDING_APPROVAL",
    "description": "Payment to ABC Suppliers - ₹25,000",
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Approve Payment
```json
// Request
POST /api/v1/approvals/approval_123/approve
{
  "comments": "Approved for Q1 inventory purchase"
}

// Response
{
  "success": true,
  "message": "Payment approved and processed",
  "data": {
    "paymentId": "payment_456",
    "approvedAt": "2024-01-15T11:00:00Z",
    "processedAmount": 25000
  }
}
```

## Database Schema

### Core Tables
```sql
-- Approval Rules Configuration
CREATE TABLE approval_rules (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  conditions JSONB NOT NULL,
  approver_role VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  user_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pending Approvals
CREATE TABLE pending_approvals (
  id VARCHAR PRIMARY KEY,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  entity_data JSONB NOT NULL,
  submitted_by VARCHAR NOT NULL,
  submitter_name VARCHAR NOT NULL,
  approver_role VARCHAR NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR DEFAULT 'PENDING',
  approved_by VARCHAR,
  approved_at TIMESTAMP,
  rejected_by VARCHAR,
  rejected_at TIMESTAMP,
  comments TEXT,
  user_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pending_approvals_status_role ON pending_approvals(status, approver_role);
CREATE INDEX idx_pending_approvals_submitter ON pending_approvals(submitted_by);
```

### Sample Data
```sql
-- Default approval rules for textile shop
INSERT INTO approval_rules (id, name, entity_type, conditions, approver_role, user_id) VALUES
('rule_1', 'Payment Approval', 'PAYMENT', '{"amount": {"min": 1000}}', 'OWNER', 'shop_owner_id'),
('rule_2', 'Expense Approval', 'EXPENSE', '{"amount": {"min": 5000}}', 'OWNER', 'shop_owner_id');
```

## Implementation Guidelines

### Phase 1: Core Middleware
1. Implement approval middleware
2. Create basic approval rules
3. Add pending approval CRUD operations
4. Integrate with existing payment controller

### Phase 2: Notification Integration
1. Add Kafka event publishing
2. Create approval email templates
3. Implement notification flows
4. Test end-to-end approval workflow

### Phase 3: Advanced Features
1. Add approval dashboard
2. Implement bulk approval operations
3. Add approval analytics
4. Create mobile-friendly approval emails

### Development Checklist
- [ ] Database schema migration
- [ ] Approval middleware implementation
- [ ] Rule evaluation engine
- [ ] Pending approval management
- [ ] Kafka event integration
- [ ] Email template creation
- [ ] Frontend approval dashboard
- [ ] Unit test coverage
- [ ] Integration testing
- [ ] Performance testing

### Configuration Example
```typescript
// accounts-service/config/approval.ts
export const approvalConfig = {
  payment: {
    entityType: 'PAYMENT',
    getEntityData: (req) => req.body,
    getDescription: (data) => `Payment to ${data.partyName} - ₹${data.amount}`,
    getAmount: (data) => data.amount
  },
  expense: {
    entityType: 'EXPENSE',
    getEntityData: (req) => req.body,
    getDescription: (data) => `Expense: ${data.description} - ₹${data.amount}`,
    getAmount: (data) => data.amount
  }
};
```

### Error Handling
- Graceful degradation if approval service is down
- Retry mechanisms for notification failures
- Clear error messages for users
- Audit logging for all approval actions

### Monitoring & Analytics
- Track approval response times
- Monitor approval vs rejection rates
- Alert on pending approvals older than 24 hours
- Generate approval workflow reports

## Future Considerations

### Scalability
- Support for multiple stores (multi-tenant)
- Hierarchical approval workflows
- Integration with external accounting systems

### Enhanced Features
- Mobile app for quick approvals
- Approval delegation during owner absence
- Conditional approval rules based on time/amount
- Integration with bank APIs for payment verification

### Compliance
- Audit trail for financial regulations
- Digital signature support
- Approval workflow documentation
- SOX compliance features for larger operations

---

**Document Status**: Draft v1.0
**Next Review**: Post-implementation feedback
**Owner**: Development Team
**Stakeholders**: Store Owner, Technical Team