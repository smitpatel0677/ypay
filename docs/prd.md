# Requirements Document

## 1. Application Overview

### 1.1 Application Name
YourPay

### 1.2 Application Description
A production-ready digital payment platform developed by SRP Digital Studios. YourPay provides comprehensive payment solutions including wallet management, virtual cards, UPI payments, QR code transactions, savings features, and merchant payment capabilities. The platform features a premium dark fintech UI design with glassmorphism effects and supports both web and PWA deployment.

**Virtual Card Scope**: YourPay Virtual Cards are valid ONLY inside the YourPay ecosystem and cannot be used on any external payment gateways or third-party platforms.

**Production Domain**: ypay.srpdigitalstudios.qzz.io

## 2. Users and Usage Scenarios

### 2.1 Target Users
- Individual users seeking digital payment solutions
- Users requiring virtual card services
- Users wanting to manage savings and rewards
- Merchants accepting digital payments
- Platform administrators managing the system

### 2.2 Core Usage Scenarios
- Send and receive money via multiple methods (UPI, Wallet, QR, Card)
- Manage multiple wallets (Main, Savings, Rewards)
- Use virtual cards for online payments within YourPay ecosystem
- Track transaction history and spending analytics
- Receive real-time payment notifications
- Manage savings goals and earn rewards

## 3. Page Structure and Functional Description

### 3.1 Page Structure

```
├── Landing Page
├── Registration Flow
│   ├── Email Input
│   ├── OTP Verification
│   ├── Password Setup
│   └── Profile Setup (with Profile Picture Upload)
├── Login
├── Dashboard
├── Wallets
│   ├── Main Wallet
│   ├── Savings Wallet
│   └── Rewards Wallet
├── Send Money
├── Receive Money
├── Virtual Card
├── Card Payment
├── Transaction History
├── Notifications
├── User Profile (with Profile Picture Change)
├── Settings
└── Admin Panel
    ├── Dashboard
    ├── User Management
    │   └── User Detail View (with Profile Picture Display)
    ├── Transaction Management
    ├── Wallet Management
    ├── Card Management
    ├── Notification Management
    ├── Analytics
    ├── Offers Management
    └── System Settings
```

### 3.2 Landing Page

**Purpose**: Introduce YourPay platform and guide users to registration

**Sections**:
- Hero Section: Display animated phone mockup showcasing app features
- Features Section: Present key features including Virtual Card, QR Payments, Savings Wallet, Merchant Payments, Security, with premium animations
- Testimonials: Show user testimonials
- FAQ: Answer common questions
- Pricing: Display pricing information
- Download App: Provide app download options
- Footer: Display company information and links

**Actions**:
- Get Started button: Navigate to registration
- Learn More button: Navigate to features section

**Design**: Dark premium theme with Deep Obsidian (#0A0A0C), Primary Blue, Accent Emerald (#00E676)

### 3.3 Registration Flow

**Step 1: Email Input**
- User enters email address
- System sends OTP via EmailJS (Service ID: service_9m2jhrm, Template ID: template_ng47mgy, Private Key: 911PaP_ohTEL--HIZs5gh)
- OTP sent to user's real email address

**Step 2: OTP Verification**
- User enters received OTP
- System verifies OTP correctness

**Step 3: Password Setup**
- User creates password
- System validates password strength

**Step 4: Profile Setup**
- Required fields: Full Name, Date of Birth, 4-Digit Transaction PIN
- Optional fields: Profile Picture (upload via Supabase Storage)
- System creates user account via Supabase Auth and initializes wallets in Supabase database

### 3.4 Login

**Login Methods**:
- Email + Password login (via Supabase Auth)
- Google Login (using OSS Google Login)
- Remember Me option

**Additional Features**:
- Forgot Password recovery (OTP sent via EmailJS)
- Login history tracking (stored in Supabase)

### 3.5 Dashboard

**Display Information**:
- Main Wallet balance and details (from Supabase)
- Savings Wallet balance (from Supabase)
- Rewards Wallet balance (from Supabase)
- Today's Spending summary
- Monthly Spending summary
- Recent Transactions list (from Supabase)
- Virtual Card preview
- Notifications preview (from Supabase)

**Quick Actions**:
- Send Money
- Receive Money
- Scan QR
- My QR
- Virtual Card
- Savings
- Transaction History
- Request Money
- Pay by Card
- Settings

**UI Requirements**:
- Skeleton loading placeholders during data fetch
- 60 FPS animations for transitions
- Responsive layout for mobile, tablet, desktop
- Real-time updates via Supabase Realtime

### 3.6 Wallets

**Wallet Types**:
Each user automatically receives three wallets upon registration:
- Main Wallet
- Savings Wallet
- Rewards Wallet

**Wallet Information** (stored in Supabase):
- Unique Wallet Number
- QR Code
- UPI ID
- Virtual Card details
- Current balance
- Transaction history

**Wallet Operations**:
- View balance
- Transfer between wallets
- View transaction history
- Generate QR code
- Share wallet details

### 3.7 UPI System

**UPI ID Generation**:
- Auto-generate format: username@ypay or mobilenumber@ypay
- Ensure uniqueness across platform (validated in Supabase)

**Search Functionality**:
- Search by: UPI ID, Email, Wallet Number, Name
- AJAX instant search with real-time results (query Supabase)
- Display results: Profile Photo (from Supabase Storage), Verified Badge, Name, UPI ID (Wallet Balance Hidden)
- Action buttons: Send Money, Request Money, View Profile

### 3.8 Send Money

**Payment Methods**:
- UPI ID
- Wallet Number
- QR Code scan
- Profile selection
- Card payment
- Transaction history selection

**Transaction Flow**:
1. Select recipient and payment method
2. Enter amount
3. Add optional payment note
4. Review transaction details on confirmation screen
5. Enter 4-digit Transaction PIN
6. Display processing animation
7. Show success animation upon completion
8. Generate and display receipt
9. Display toast notification confirming transaction
10. Transaction recorded in Supabase

**Receipt Information**:
- Transaction ID
- Reference ID
- Sender details
- Receiver details
- Amount
- Date and time
- Payment method
- Transaction status

### 3.9 Receive Money

**QR Code Generation**:
- Static QR: Fixed QR code for receiving payments
- Dynamic QR: Generate QR with pre-filled amount
- Share QR: Share via multiple channels
- Download QR: Save QR code image

**Display Information**:
- User's UPI ID
- Wallet Number
- QR Code
- Share options

### 3.10 Virtual Card

**Card Information** (Auto-generated per user, stored in Supabase):
- Unique Card Number
- Unique CVV
- Expiry Date
- Card Holder Name
- Card Design
- Card Theme

**Card Actions**:
- Hide/Show Card Number
- Copy Card Number
- Show CVV (requires PIN verification)
- Freeze/Unfreeze Card
- Replace Card (generates new card details in Supabase)

**Usage Scope**: Virtual Cards are valid ONLY within YourPay ecosystem and cannot be used on external payment gateways or third-party platforms.

### 3.11 Card Payment System

**Payment Flow**:
1. Payer enters: Card Number, Expiry Date, CVV, Card Holder Name
2. Payer enters payment amount
3. Payer clicks Continue
4. Card owner receives payment request notification via Supabase Realtime: \"Someone wants to charge ₹[amount] using your YourPay Card.\"
5. Card owner chooses Accept or Reject
6. If Accept:
   - Card owner verifies Transaction PIN
   - Money deducted from card owner's wallet (Supabase transaction)
   - Money credited to receiver's wallet (Supabase transaction)
   - Success animation displayed
   - Transaction history updated for both parties in Supabase
   - Toast notification displayed
7. If Reject:
   - Transaction cancelled
   - Payer receives cancellation notification

### 3.12 PIN Screen

**Design Features**:
- Premium numeric keypad layout (1-9, backspace, 0, confirm)
- Large rounded buttons
- Button animations and glow effects
- Ripple effect on press
- Button sound feedback
- Haptic feedback
- PIN dots display
- Shake animation on incorrect PIN
- 60 FPS animations

### 3.13 Success Animation

**Animation Elements**:
- Animated checkmark
- Coin animation
- Wallet animation
- Glow effects
- Confetti animation
- Card flip animation
- Money flying animation
- Professional success sound
- 60 FPS rendering

### 3.14 Sound Effects

**Sound Types**:
- Button Click
- PIN Click
- Money Sent
- Money Received
- Success
- Failure
- Notification
- Card Approved
- Card Declined

### 3.15 Savings Wallet

**Transfer Operations**:
- Transfer from Main Wallet to Savings Wallet
- Transfer from Savings Wallet to Main Wallet

**Features**:
- Set savings goals (stored in Supabase)
- Optional interest calculation
- Savings history tracking
- Analytics and insights

### 3.16 Transaction History

**Transaction Information** (from Supabase):
- Profile Photo (from Supabase Storage)
- Name
- Amount
- Status (Pending, Awaiting Approval, Processing, Success, Failed, Rejected, Refunded, Cancelled, Expired)
- Date
- Time
- Reference ID
- Transaction ID
- Payment Method (Wallet/UPI/Card)

**Actions**:
- Download Receipt
- Share Receipt
- Search transactions
- Filter by date, amount, status, payment method

**UI Requirements**:
- Skeleton loading during data fetch
- Toast notifications for filter actions

### 3.17 Notifications

**Notification Types** (stored in Supabase):
- Money Received
- Money Sent
- Card Payment Request
- Card Approved
- Card Declined
- Refund
- Admin Credit
- Admin Debit
- Offers
- Announcements
- Security Alerts
- Login Alert

**Features**:
- Real-time notification display via Supabase Realtime
- Push notifications via Firebase Cloud Messaging
- Notification history
- Mark as read/unread
- Delete notifications
- Toast notifications for all events

### 3.18 User Profile

**Display Information** (from Supabase):
- Profile Photo (from Supabase Storage)
- Full Name
- Email
- Date of Birth
- Wallet Number
- UPI ID
- Member Since date
- Total Transactions count
- Card details
- Savings balance

**Actions**:
- Upload/Change Profile Photo (via Supabase Storage)
- Edit profile information
- View settings
- Share profile

### 3.19 Admin Panel

**Default Credentials**:
- Username: admin
- Password: admin11

**Dashboard**:
- Total Users (from Supabase)
- Total Transactions (from Supabase)
- Total Wallet Balance (from Supabase)
- Today's Transactions
- Monthly Revenue
- Active Cards
- Pending Requests
- System Status
- Skeleton loading for all metrics
- Analytics charts: User growth chart, Transaction volume chart, Payment method distribution chart

**User Management**:
- Search users by name, email, wallet number, UPI ID (query Supabase)
- View user profile and details
- View user profile picture (from Supabase Storage)
- Freeze/Unfreeze user account
- Delete user account
- Reset user password
- Reset user PIN
- Add money to user wallet (select wallet type: Main/Savings/Rewards, enter amount and reason)
- Deduct money from user wallet (select wallet type, enter amount and reason)
- Credit rewards to user
- View user transaction history
- View user login history
- View user device history

**Transaction Management**:
- View all transactions (from Supabase)
- Search and filter transactions
- View full transaction detail modal (Transaction ID, Reference ID, Sender, Receiver, Amount, Status, Date, Time, Payment Method, Notes)
- Refund transactions
- Export transaction reports as CSV

**Wallet Management**:
- View all wallets (from Supabase)
- Monitor wallet balances
- View wallet transaction history
- Manage wallet settings

**Card Management**:
- View all virtual cards (from Supabase)
- View card details
- Replace user cards (generate new card details in Supabase)
- Freeze/Unfreeze cards
- Monitor card transactions

**Notification Management**:
- Send individual notification to any user (select user, enter message, send)
- Broadcast notification to all users (enter message, send to all)
- View notification history (from Supabase)
- Manage notification templates

**Analytics**:
- User growth analytics (chart)
- Transaction analytics (chart)
- Revenue analytics
- Payment method distribution (chart)
- Geographic distribution

**System Settings**:
- Platform settings
- Security settings
- Payment settings
- Notification settings
- Email settings (EmailJS configuration: Service ID, Template ID, Private Key)

**Logs**:
- Audit logs (from Supabase)
- Login history (from Supabase)
- Transaction logs (from Supabase)
- System logs
- Error logs

**Offers Management**:
- Create offers (store in Supabase)
- Edit offers
- Delete offers
- View offer analytics

**Reports**:
- Generate custom reports
- Export reports as CSV
- Schedule reports

### 3.20 Additional Features

**Favorite Contacts**:
- Add contacts to favorites (stored in Supabase)
- Quick access to favorite contacts
- Send money to favorites

**Recent Contacts**:
- Display recently transacted contacts (from Supabase)
- Quick repeat transactions

**Payment Notes**:
- Add notes to transactions
- View notes in transaction history

**Request Money**:
- Send payment request to other users
- Specify amount and reason
- Track request status (stored in Supabase)

**Payment Links**:
- Generate payment links
- Share links via multiple channels
- Track link usage

**Scheduled Payments**:
- Schedule future payments (stored in Supabase)
- Set recurring payments
- Manage scheduled payments

**Referral System**:
- Generate referral code
- Share referral link
- Track referrals (stored in Supabase)
- Earn rewards for successful referrals (20 digital money per referral)

**Rewards and Cashback**:
- Earn rewards on transactions
- Receive cashback offers
- View rewards history (from Supabase)
- Redeem rewards

**Coupons and Offers**:
- View available coupons (from Supabase)
- Apply coupons to transactions
- Track coupon usage

**Support Chat**:
- Contact support team
- View support tickets
- Track ticket status

**Theme Settings**:
- Dark Mode (default)
- Light Mode

**Language Settings**:
- Multi-language support
- Change interface language

**Search Functionality**:
- Global search across users, transactions, cards, notifications (query Supabase)
- Instant search results

**Profile Sharing**:
- Share profile via QR code
- Share profile link

### 3.21 UI/UX Requirements

**Performance**:
- 60 FPS animations where possible
- Smooth transitions and interactions

**Responsive Design**:
- Mobile layout (320px - 767px)
- Tablet layout (768px - 1023px)
- Desktop layout (1024px+)

**Loading States**:
- Skeleton loading placeholders for all data-loading states
- Loading spinners for actions

**Notifications**:
- Toast notifications for all user actions and system events
- Position: top-right corner
- Auto-dismiss after 3-5 seconds

**Theme**:
- Dark mode by default
- Premium dark fintech UI with glassmorphism effects
- Color scheme: Deep Obsidian (#0A0A0C), Primary Blue, Accent Emerald (#00E676)

**Accessibility**:
- WCAG AA compliant color contrast
- Keyboard navigation support
- Screen reader compatible
- Focus indicators on interactive elements

### 3.22 Bug Fixes

**TypeScript Errors**:
- Fix all TypeScript type errors
- Ensure proper type definitions for all components and functions

**Navigation Issues**:
- Fix broken navigation routes
- Ensure proper routing between pages

**QR Code Display**:
- Fix QR code rendering issues
- Ensure QR codes display correctly on all devices

**Card Payment Flow**:
- Fix card payment request flow
- Ensure proper state management for payment requests

**PIN Screen Animations**:
- Fix PIN screen animation glitches
- Ensure smooth 60 FPS animations

### 3.23 Source Code Delivery

**Deliverable**:
- Generate complete source-code.zip of entire project after all fixes and implementations
- Include all source files, configuration files, and documentation

## 4. Business Rules and Logic

### 4.1 Data Storage
- All application data stored in Supabase (PostgreSQL)
- User authentication via Supabase Auth
- Profile pictures stored in Supabase Storage
- No mock data or hardcoded data in frontend
- Real-time updates via Supabase Realtime for wallet balance and notifications

### 4.2 Image Upload
- Profile pictures uploaded to Supabase Storage
- Upload locations: Registration (Step 4), User Profile page, Admin User Detail view
- Supported formats: JPG, PNG, GIF
- Image URL stored in user profile record in Supabase

### 4.3 OTP Email Integration
- OTP sent via EmailJS during registration and password reset
- EmailJS configuration: Service ID (service_9m2jhrm), Template ID (template_ng47mgy), Private Key (911PaP_ohTEL--HIZs5gh)
- OTP sent to user's real email address
- OTP verification required before proceeding

### 4.4 Wallet Initialization
- Upon successful registration, system automatically creates three wallets for each user in Supabase: Main Wallet, Savings Wallet, Rewards Wallet
- Each wallet receives unique Wallet Number, QR Code, UPI ID, and Virtual Card

### 4.5 UPI ID Uniqueness
- UPI IDs must be unique across the platform
- Format: username@ypay or mobilenumber@ypay
- System validates uniqueness in Supabase before assignment

### 4.6 Transaction Processing
- All transactions require 4-digit Transaction PIN verification
- Sender's wallet balance must be sufficient for transaction amount
- Transaction creates records for both sender and receiver in Supabase
- Each transaction generates unique Transaction ID and Reference ID
- Transactions use Supabase Edge Functions for server-side logic

### 4.7 Transaction States
All transactions must have one of the following statuses:
- **Pending**: Transaction initiated but not yet processed
- **Awaiting Approval**: Waiting for card owner approval (card payment scenario)
- **Processing**: Transaction being processed by system
- **Success**: Transaction completed successfully
- **Failed**: Transaction failed due to system error or insufficient balance
- **Rejected**: Transaction rejected by card owner or system validation
- **Refunded**: Transaction amount returned to sender
- **Cancelled**: Transaction cancelled by user before completion
- **Expired**: Transaction request expired without action

### 4.8 Card Payment Authorization
- Card owner must explicitly accept payment request
- Payment request includes amount and requester information
- Card owner verifies PIN before payment completion
- Rejected requests notify the requester
- Payment requests delivered via Supabase Realtime

### 4.9 Virtual Card Management
- Each user receives one virtual card per wallet (stored in Supabase)
- Card details (Number, CVV, Expiry) are unique per user
- CVV display requires PIN verification
- Replacing card generates new card details in Supabase and invalidates old card
- Frozen cards cannot be used for payments
- Virtual Cards are valid ONLY within YourPay ecosystem

### 4.10 Wallet Transfers
- Users can transfer money between their own wallets (Main ↔ Savings)
- Transfers require PIN verification
- Transfer history is recorded in both wallets in Supabase

### 4.11 Real-Time Updates
- System uses Supabase Realtime for: Wallet Balance, Notifications, Transactions, Payment Requests
- Admin Dashboard data updates in real-time
- Updates display without page refresh

### 4.12 Notification Delivery
- Push notifications sent via Firebase Cloud Messaging
- In-app notifications displayed in real-time via Supabase Realtime
- Notification history maintained in Supabase
- Toast notifications for all user actions

### 4.13 Admin Actions
- Admin can add money to any user wallet (select wallet type, enter amount and reason, record in Supabase)
- Admin can deduct money from any user wallet (select wallet type, enter amount and reason, record in Supabase)
- Admin can reset user PIN (update in Supabase)
- Admin can reset user password (update in Supabase Auth)
- Admin can replace user virtual card (generate new card details in Supabase)
- Admin can freeze/unfreeze virtual card (update status in Supabase)
- Admin can send individual notification to any user (store in Supabase)
- Admin can broadcast notification to all users (store in Supabase)
- Admin can export transactions as CSV
- Admin can view user login history (from Supabase)
- Admin can view full transaction detail modal
- Admin actions are logged in audit logs in Supabase
- Admin can credit rewards to users
- Admin can freeze/unfreeze accounts and cards

### 4.14 Referral Rewards
- Successful referral credits 20 digital money to referrer's Rewards Wallet
- Referral tracked by unique referral code (stored in Supabase)

### 4.15 Security Rules
- Passwords stored using Supabase Auth secure hashing
- All database queries use Supabase RLS (Row Level Security) policies
- CSRF protection on all forms
- XSS protection on all inputs
- Session protection and validation via Supabase Auth
- Rate limiting on sensitive operations
- Login history and device history tracked in Supabase
- Audit logs maintained for all critical actions in Supabase

### 4.16 Audit Logging
Every sensitive action must be logged in Supabase with timestamp, user ID, action type, and details:
- **Login**: Successful and failed login attempts
- **Password Change**: Timestamp and user ID
- **PIN Change**: Timestamp and user ID
- **Money Transfer**: Sender, receiver, amount, transaction ID
- **Wallet Credit/Debit**: User ID, amount, reason, admin ID (if applicable)
- **Admin Actions**: All admin operations including user management, wallet operations, card management
- **Card Freeze/Unfreeze**: Card ID, user ID, action type
- **Profile Update**: Changed fields and values

### 4.17 Database Integrity Rules
- **Non-Negative Balance**: Wallet balances can never become negative (enforced with CHECK constraints at Supabase database level)
- **Atomic Transactions**: All money transfers use Supabase Edge Functions with transaction support to ensure atomicity
- **Balance Derivation**: Wallet balances are calculated from transaction records to ensure consistency
- **Unique Constraints**: Transaction IDs, Reference IDs, Wallet Numbers, UPI IDs, Card Numbers enforced with UNIQUE constraints in Supabase
- **Referential Integrity**: Foreign key constraints ensure data consistency across tables in Supabase

### 4.18 Unique Value Generation
- System ensures uniqueness for: Wallet Number, UPI ID, Card Number, Expiry, CVV, Transaction ID, Reference ID, Notification ID, QR Code
- No duplicate values allowed across platform (validated in Supabase)

### 4.19 Production Deployment
- Website domain: ypay.srpdigitalstudios.qzz.io
- Configure all environment variables for Supabase (URL, Anon Key, Service Role Key)
- Configure EmailJS environment variables (Service ID, Template ID, Private Key)
- Set up proper RLS (Row Level Security) policies in Supabase
- Ensure HTTPS enabled
- Configure CORS headers
- Configure security headers
- Run full production deploy checklist

## 5. Exception and Boundary Cases

| Scenario | Handling |
|----------|----------|
| Insufficient wallet balance | Display error message, prevent transaction, set status to Failed |
| Incorrect PIN entry | Shake animation, allow retry, lock after multiple failures, log attempt in Supabase |
| OTP verification failure | Allow resend OTP via EmailJS, limit resend attempts |
| Duplicate email registration | Display error, suggest login |
| Card payment request timeout | Auto-reject after timeout period, set status to Expired, notify both parties |
| Network failure during transaction | Rollback transaction in Supabase, set status to Failed, notify user to retry |
| Invalid card details entry | Display validation error, prevent submission |
| Frozen account login attempt | Display account frozen message, suggest contact support, log attempt in Supabase |
| Admin unauthorized access | Redirect to login, log attempt in audit logs in Supabase |
| QR code scan failure | Display error, suggest manual entry |
| Profile photo upload failure | Allow skip, enable upload later, display toast notification, log error |
| Search returns no results | Display \"No results found\" message |
| Notification delivery failure | Retry delivery, log failure in system logs in Supabase |
| Wallet transfer to same wallet | Prevent transaction, display error message |
| Expired session | Redirect to login via Supabase Auth, preserve user context |
| Negative balance attempt | Reject transaction at Supabase database level, display error |
| Duplicate transaction ID | Regenerate unique ID in Supabase, retry transaction |
| Transaction rollback failure | Log critical error in Supabase, alert admin, freeze affected accounts |
| Concurrent wallet updates | Use Supabase database locking mechanism, process sequentially |
| Image upload to Supabase Storage failure | Display error message, allow retry, log error in Supabase |
| EmailJS OTP send failure | Display error message, allow retry, log error |
| Supabase connection failure | Display error message, retry connection, log error |
| RLS policy violation | Block unauthorized access, log security event in Supabase |

## 6. Acceptance Criteria

1. User registers account by entering email, receiving OTP via EmailJS (Service ID: service_9m2jhrm, Template ID: template_ng47mgy, Private Key: 911PaP_ohTEL--HIZs5gh) to real email address, verifying OTP, creating password, completing profile setup with Full Name, Date of Birth, 4-Digit Transaction PIN, and optionally uploading profile picture to Supabase Storage
2. User logs in using email and password via Supabase Auth, system displays Dashboard with skeleton loading placeholders, then shows Main Wallet, Savings Wallet, Rewards Wallet balances from Supabase with real-time updates via Supabase Realtime, and Quick Actions with 60 FPS animations
3. User selects Send Money, enters recipient's UPI ID, enters amount, confirms transaction details, enters Transaction PIN, successfully sends money via Supabase Edge Function with success animation displayed and toast notification confirming transaction, transaction recorded in Supabase
4. Recipient receives real-time push notification via Firebase Cloud Messaging and toast notification of money received, sees updated wallet balance on Dashboard via Supabase Realtime, and transaction status shows as Success in Supabase
5. User views Virtual Card details from Supabase, copies Card Number, requests to show CVV by entering PIN, successfully views CVV, and understands card is valid only within YourPay ecosystem
6. User initiates card payment by entering card details and amount, card owner receives payment request notification via Supabase Realtime with status Awaiting Approval, accepts request, verifies PIN, payment completes successfully via Supabase Edge Function with status Success, and both parties receive toast notifications
7. Admin logs in to Admin Panel, views user list from Supabase, selects user, views user profile picture from Supabase Storage, adds money to user's Main Wallet by entering amount and reason, transaction recorded in Supabase, user receives notification, and action logged in audit logs
8. Admin sends individual notification to selected user, notification stored in Supabase, user receives real-time notification via Supabase Realtime and toast notification
9. Admin exports all transactions as CSV file, file generated from Supabase data and downloaded successfully
10. User changes profile picture on User Profile page, uploads new image to Supabase Storage, profile picture URL updated in Supabase, new picture displayed immediately

## 7. Out of Scope for Current Release

- Mobile number verification during registration
- Biometric authentication (fingerprint, face recognition)
- Multi-currency support
- International payments
- Bank account linking
- Direct bank transfers
- Credit/Debit card linking for top-up
- Merchant dashboard and analytics
- Invoice generation and management
- Subscription payment management
- Bill payment integration
- Mobile recharge integration
- Insurance and investment products
- Loan services
- Cryptocurrency support
- NFC payment support
- Wearable device integration
- Voice command payments
- AI-powered spending insights
- Automated savings rules
- Joint accounts
- Business accounts
- Tax reporting features
- Export to accounting software
- Third-party app integrations
- White-label solutions
- API for external developers
- Use of Virtual Cards on external payment gateways or third-party platforms