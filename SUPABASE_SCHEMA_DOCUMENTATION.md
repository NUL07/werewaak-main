/**
 * SUPABASE DATABASE SCHEMA ANALYSIS & DOCUMENTATION
 * 
 * This document outlines the data structure for Werewaak Capital.
 */

// ════════════════════════════════════════════════════════════
// 1. DATA ANALYSIS
// ════════════════════════════════════════════════════════════

/*
The Werewaak Capital app tracks two main entities:

A. TRANSFERS (Money transfers between parties)
   - Sender information (name, phone, location)
   - Receiver information (name, phone, location)
   - Amount sent (any currency)
   - Amount received (any currency)
   - Commission amount and percentage
   - Type: "Sent" or "Received"
   - Date/time of transaction
   - Who entered the record (user's email/username)

B. LOANS (Loans issued to borrowers)
   - Borrower information (name, ID/passport, phone, location)
   - Loan amount (any currency)
   - Interest rate (%)
   - Interest amount (calculated)
   - Total repayable (calculated)
   - Loan status: "Active" or "Repaid"
   - Date issued
   - Who entered the record (user's email/username)

USERS:
   - Managed via Supabase Auth (email, password)
   - Each user only sees their own transfers and loans
   - Admin users can see all records (this would require an additional users table)
*/

// ════════════════════════════════════════════════════════════
// 2. DATABASE TABLES & FIELDS
// ════════════════════════════════════════════════════════════

/*
TABLE: transfers
├─ id: UUID (auto-generated, primary key)
├─ user_id: UUID (foreign key to auth.users, enables RLS)
├─ type: TEXT ('Sent' or 'Received')
├─ sender_name: TEXT (required)
├─ sender_phone: TEXT (optional)
├─ sender_location: TEXT (optional)
├─ receiver_name: TEXT (required)
├─ receiver_phone: TEXT (optional)
├─ receiver_location: TEXT (optional)
├─ amount_sent: NUMERIC (required)
├─ currency_sent: TEXT (e.g., 'USD', 'SSP')
├─ amount_received: NUMERIC (required)
├─ currency_received: TEXT (e.g., 'USD', 'UGX')
├─ commission: NUMERIC (amount, default 0)
├─ commission_percent: NUMERIC (percentage, default 0)
├─ date_time: TIMESTAMP (ISO format)
├─ entered_by: TEXT (user's email for display)
├─ created_at: TIMESTAMP (auto)
└─ updated_at: TIMESTAMP (auto)

TABLE: loans
├─ id: UUID (auto-generated, primary key)
├─ user_id: UUID (foreign key to auth.users, enables RLS)
├─ borrower_name: TEXT (required)
├─ borrower_id_passport: TEXT (optional)
├─ borrower_phone: TEXT (optional)
├─ borrower_location: TEXT (optional)
├─ loan_amount: NUMERIC (required)
├─ currency: TEXT (e.g., 'USD', 'SSP')
├─ interest_rate: NUMERIC (percentage, e.g., 5.5)
├─ interest_amount: NUMERIC (calculated)
├─ total_repayable: NUMERIC (calculated)
├─ date_issued: DATE (YYYY-MM-DD format)
├─ status: TEXT ('Active' or 'Repaid')
├─ entered_by: TEXT (user's email for display)
├─ created_at: TIMESTAMP (auto)
└─ updated_at: TIMESTAMP (auto)
*/

// ════════════════════════════════════════════════════════════
// 3. ROW LEVEL SECURITY (RLS)
// ════════════════════════════════════════════════════════════

/*
Why RLS?
  - Each user can ONLY see/modify their own records
  - Automatically enforced at the database level
  - No need to filter in application code

Policies implemented:
  - SELECT: auth.uid() = user_id  (users can only view their own records)
  - INSERT: auth.uid() = user_id  (users can only insert records with their ID)
  - UPDATE: auth.uid() = user_id  (users can only update their own records)
  - DELETE: auth.uid() = user_id  (users can only delete their own records)

This means:
  - User A cannot see, modify, or delete User B's records
  - Enforced at database level, not application level
  - Perfect for multi-user SaaS applications
*/

// ════════════════════════════════════════════════════════════
// 4. STEP-BY-STEP IMPLEMENTATION
// ════════════════════════════════════════════════════════════

/*
Step 1: Run the SQL schema
  └─ See: supabase-schema.sql in the project root

Step 2: Add the Supabase service functions
  └─ See: src/lib/supabaseService.ts (already created)
  └─ Functions: fetchTransfers, createTransfer, updateTransfer, deleteTransfer
  └─ Functions: fetchLoans, createLoan, updateLoan, deleteLoan

Step 3: Update Index.tsx to use the service functions
  └─ See: SUPABASE_INTEGRATION_GUIDE.md for exact changes
  └─ Import the functions
  └─ Add useEffect to load data on mount
  └─ Replace setState calls with async service calls

Step 4: No UI changes needed!
  └─ All rendering logic stays the same
  └─ Only the data flow changes (local state → Supabase)
*/

// ════════════════════════════════════════════════════════════
// 5. BENEFITS OF THIS APPROACH
// ════════════════════════════════════════════════════════════

/*
✓ Data Persistence: All records saved permanently in the database
✓ Scalability: Handles unlimited records (not limited by browser memory)
✓ Security: RLS ensures users can't access other users' data
✓ Backup: Supabase automatically backups your data
✓ Real-time: Can add real-time subscriptions later if needed
✓ No UI changes: Existing design and components remain identical
✓ Easy to query: Generate reports from raw database data
✓ Easy to scale: Add more features without rearchitecting
*/

// ════════════════════════════════════════════════════════════
// 6. FUTURE ENHANCEMENTS
// ════════════════════════════════════════════════════════════

/*
With the database foundation in place, you can easily add:

1. Admin Dashboard
   - View all users' records (requires admin users table)
   - Generate aggregate reports
   - Export data to CSV/Excel

2. Real-time Updates
   - Use supabase.from("transfers").on("*").subscribe()
   - Refresh dashboards when data changes

3. Advanced Search & Filtering
   - Database-level filtering (faster than client-side)
   - Date range queries
   - Currency-based queries

4. Recurring Loans
   - Add reminders for repayment dates
   - Automatic calculations

5. Analytics
   - Total volume by currency
   - Monthly trends
   - Commission tracking

6. Multi-currency conversion
   - Store exchange rates in a separate table
   - Calculate actual transferred amounts
*/
