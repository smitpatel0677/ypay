# YourPay – PHP + MySQL Backend

Complete server-side source code for the YourPay digital payments platform.

---

## 📁 Directory Structure

```
yourpay-backend/
├── config/
│   ├── database.php      # PDO connection factory
│   ├── constants.php     # App-wide constants & audit action names
│   └── cors.php          # CORS headers for API responses
├── helpers/
│   └── helpers.php       # Shared utility functions
├── api/
│   ├── auth.php          # Register, login, logout, OTP
│   ├── users.php         # Profile, PIN/password change, wallet list, search
│   ├── transactions.php  # Send money, wallet transfer, history, receipt
│   ├── cards.php         # Virtual card CRUD, card payment request flow
│   ├── notifications.php # List, mark-read, delete notifications
│   ├── savings.php       # Savings goals CRUD & contributions
│   └── admin.php         # Full admin REST API
├── admin/
│   └── index.php         # Standalone admin panel (dark UI, PHP-rendered)
└── database/
    └── schema.sql        # Full MySQL schema with all tables & seed data
```

---

## 🚀 Setup Instructions

### 1. Database
```sql
-- Import the schema
mysql -u root -p < database/schema.sql
```

### 2. Configure
Edit `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'yourpay_db');
```

### 3. Deploy
Copy the entire `yourpay-backend/` folder to your web server root (e.g. `/var/www/html/yourpay/`).

### 4. Admin Panel
Visit `/admin/` in your browser.

Default credentials: `admin` / `admin11`

---

## 🔗 API Endpoints

All endpoints return `{ success, message, data }` JSON.

### Auth  `api/auth.php`
| Action | Method | Description |
|--------|--------|-------------|
| `?action=register` | POST | Create account + 3 wallets + virtual card |
| `?action=login` | POST | Email/password login, returns user object |
| `?action=logout` | POST | Destroy session |
| `?action=send_otp` | POST | Generate & send OTP to email |
| `?action=verify_otp` | POST | Verify OTP code |

### Users  `api/users.php` *(auth required)*
| Action | Method | Description |
|--------|--------|-------------|
| `?action=profile` | GET | Full profile + wallets + card |
| `?action=update_profile` | POST | Update name/avatar |
| `?action=change_pin` | POST | Change transaction PIN |
| `?action=change_password` | POST | Change login password |
| `?action=wallets` | GET | All wallet balances |
| `?action=search&q=` | GET | Search users by name/email/UPI |

### Transactions  `api/transactions.php` *(auth required)*
| Action | Method | Description |
|--------|--------|-------------|
| `?action=send` | POST | Send money (UPI / wallet / QR), PIN required |
| `?action=transfer` | POST | Transfer between own wallets |
| `?action=history` | GET | Transaction history with filters |
| `?action=receipt&txn_id=` | GET | Single transaction details |

### Cards  `api/cards.php` *(auth required)*
| Action | Method | Description |
|--------|--------|-------------|
| `?action=get` | GET | Get own virtual card details |
| `?action=freeze` | POST | Freeze card (PIN required) |
| `?action=unfreeze` | POST | Unfreeze card (PIN required) |
| `?action=replace` | POST | Replace card with new details (PIN required) |
| `?action=show_cvv` | POST | Verify PIN to access CVV |
| `?action=request` | POST | Initiate card payment request |
| `?action=respond` | POST | Accept/reject incoming card request |
| `?action=pending` | GET | List pending card requests for card owner |

### Notifications  `api/notifications.php` *(auth required)*
| Action | Method | Description |
|--------|--------|-------------|
| `?action=list` | GET | Notification list |
| `?action=unread` | GET | Unread count |
| `?action=mark_read` | POST | Mark single notification read |
| `?action=mark_all` | POST | Mark all read |
| `?action=delete` | POST | Delete notification |

### Savings  `api/savings.php` *(auth required)*
| Action | Method | Description |
|--------|--------|-------------|
| `?action=goals` | GET | List savings goals |
| `?action=add_goal` | POST | Create goal |
| `?action=delete_goal` | POST | Delete goal |
| `?action=contribute` | POST | Contribute to goal (PIN required) |

### Admin  `api/admin.php` *(admin session required)*
| Action | Description |
|--------|-------------|
| `login` | Admin login |
| `dashboard` | Platform statistics |
| `users` | List/search all users |
| `user_detail` | Full user info |
| `freeze_user` / `unfreeze_user` | Freeze control |
| `delete_user` | Remove user |
| `wallet_credit` / `wallet_debit` | Manual wallet operations |
| `transactions` | All transactions with filters |
| `refund` | Refund a successful transaction |
| `audit_logs` | Full audit trail |
| `send_notification` | Send to specific user |
| `broadcast` | Send to all active users |

---

## 🔒 Security Features

- **Password hashing**: `password_hash()` with bcrypt cost 12
- **PIN hashing**: Same as password — never stored in plain text
- **Prepared statements**: All queries use PDO prepared statements (SQL injection proof)
- **CSRF**: Session-based authentication with server-side state
- **Non-negative balances**: `CHECK (balance >= 0.00)` on wallets table
- **Atomic transactions**: All money moves use `BEGIN`/`COMMIT`/`ROLLBACK`
- **UNIQUE constraints**: `txn_id`, `reference_id`, `wallet_number`, `upi_id`, `card_number`
- **Audit logging**: Every sensitive action logged with user, IP, timestamp
- **Input sanitization**: `htmlspecialchars` + `strip_tags` on all user input

---

## 📝 Transaction Statuses

`pending` → `awaiting_approval` → `processing` → `success`
`pending` → `failed` | `cancelled` | `expired`
`success` → `refunded`

---

## 💡 Notes

- Virtual cards are **YourPay-ecosystem only** — they cannot be used on external gateways
- OTP is returned in the API response in dev mode. In production, configure EmailJS or SMTP in `handleSendOtp()`
- Card payment requests expire after 15 minutes (configurable via `CARD_REQUEST_EXPIRY_MINUTES`)
- Referral reward amount: ₹20 (configurable via `REFERRAL_REWARD`)
