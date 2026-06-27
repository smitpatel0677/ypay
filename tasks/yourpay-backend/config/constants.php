<?php
// YourPay Application Constants
define('APP_NAME', 'YourPay');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'https://yourpay.example.com');

// Session
define('SESSION_LIFETIME', 86400); // 24 hours

// Wallet
define('INITIAL_WALLET_BALANCE', 0.00);
define('MIN_TRANSFER_AMOUNT', 1.00);
define('MAX_TRANSFER_AMOUNT', 100000.00);
define('MAX_DAILY_TRANSFER', 200000.00);

// PIN
define('PIN_MAX_ATTEMPTS', 5);
define('PIN_LOCKOUT_MINUTES', 30);

// OTP
define('OTP_EXPIRY_MINUTES', 10);
define('OTP_MAX_RESEND', 3);

// Referral
define('REFERRAL_REWARD', 20.00);

// Card
define('CARD_REQUEST_EXPIRY_MINUTES', 15);

// Audit Actions
define('AUDIT_LOGIN_SUCCESS',    'LOGIN_SUCCESS');
define('AUDIT_LOGIN_FAILED',     'LOGIN_FAILED');
define('AUDIT_LOGOUT',           'LOGOUT');
define('AUDIT_PASSWORD_CHANGE',  'PASSWORD_CHANGE');
define('AUDIT_PIN_CHANGE',       'PIN_CHANGE');
define('AUDIT_MONEY_TRANSFER',   'MONEY_TRANSFER');
define('AUDIT_WALLET_CREDIT',    'WALLET_CREDIT');
define('AUDIT_WALLET_DEBIT',     'WALLET_DEBIT');
define('AUDIT_CARD_FREEZE',      'CARD_FREEZE');
define('AUDIT_CARD_UNFREEZE',    'CARD_UNFREEZE');
define('AUDIT_CARD_REPLACE',     'CARD_REPLACE');
define('AUDIT_PROFILE_UPDATE',   'PROFILE_UPDATE');
define('AUDIT_ADMIN_ACTION',     'ADMIN_ACTION');
define('AUDIT_ACCOUNT_FREEZE',   'ACCOUNT_FREEZE');
define('AUDIT_ACCOUNT_UNFREEZE', 'ACCOUNT_UNFREEZE');
define('AUDIT_ACCOUNT_DELETE',   'ACCOUNT_DELETE');
