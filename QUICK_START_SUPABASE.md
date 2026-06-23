/**
 * QUICK START: Apply Supabase Integration in 5 Minutes
 */

// ════════════════════════════════════════════════════════════
// STEP 1: Create Supabase Tables
// ════════════════════════════════════════════════════════════

/*
1. Go to: https://app.supabase.com › Your Project › SQL Editor
2. Click "New Query"
3. Copy entire contents of: supabase-schema.sql
4. Paste in SQL Editor
5. Click "Run" (play button)
6. Wait for confirmation: "Success"

This creates:
  ✓ transfers table with RLS
  ✓ loans table with RLS
  ✓ Indexes for performance
*/

// ════════════════════════════════════════════════════════════
// STEP 2: Verify Tables in Supabase
// ════════════════════════════════════════════════════════════

/*
1. In Supabase dashboard, go to: Table Editor
2. Left sidebar: you should see:
   - transfers (with 0 rows)
   - loans (with 0 rows)
3. Click each table to verify columns match the schema

If you don't see them:
  - Check the SQL Editor for error messages
  - Run the query again
*/

// ════════════════════════════════════════════════════════════
// STEP 3: Add supabaseService.ts to Your Project
// ════════════════════════════════════════════════════════════

/*
✓ File already created: src/lib/supabaseService.ts
  Contains all CRUD functions ready to use
*/

// ════════════════════════════════════════════════════════════
// STEP 4: Update src/pages/Index.tsx
// ════════════════════════════════════════════════════════════

/*
The minimal changes needed in src/pages/Index.tsx

At the TOP of the file, add the import:
───────────────────────────────────────────────────────────────

import {
  fetchTransfers,
  fetchLoans,
  createTransfer,
  createLoan,
  updateLoan,
  deleteLoan,
} from "@/lib/supabaseService";

───────────────────────────────────────────────────────────────

In the Index() component, FIND this section:

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

ADD after the loans line:

  const [loading, setLoading] = useState(true);

───────────────────────────────────────────────────────────────

Find the existing useEffect (that checks session):

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/signin";
      }
    };
    checkSession();
  }, []);

ADD another useEffect RIGHT AFTER it:

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [transfersData, loansData] = await Promise.all([
          fetchTransfers(),
          fetchLoans(),
        ]);
        setTransfers(transfersData);
        setLoans(loansData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

───────────────────────────────────────────────────────────────

FIND this function:

  const addTransfer = (t: Transfer) => setTransfers(prev => [...prev, t]);

REPLACE with:

  const addTransfer = async (t: Transfer) => {
    const newTransfer = await createTransfer(t);
    if (newTransfer) {
      setTransfers(prev => [...prev, newTransfer]);
    }
  };

───────────────────────────────────────────────────────────────

FIND this section:

  <LoanForm currentUser={currentUser.username} onAdd={l => setLoans(prev => [...prev, l])} />

Replace with:

  const addLoan = async (l: Loan) => {
    const newLoan = await createLoan(l);
    if (newLoan) {
      setLoans(prev => [...prev, newLoan]);
    }
  };

  // Then use it in the JSX:
  <LoanForm currentUser={currentUser.username} onAdd={addLoan} />

───────────────────────────────────────────────────────────────

FIND this function:

  const toggleLoanStatus = (id: string) => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, status: l.status === "Active" ? "Repaid" : "Active" } : l));
  };

REPLACE with:

  const toggleLoanStatus = async (id: string) => {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    const newStatus = loan.status === "Active" ? "Repaid" : "Active";
    const updated = await updateLoan(id, { status: newStatus });
    
    if (updated) {
      setLoans(prev =>
        prev.map(l =>
          l.id === id ? { ...l, status: newStatus } : l
        )
      );
    }
  };

───────────────────────────────────────────────────────────────

FIND the return statement for the component:

  if (!currentUser) return <LoginScreen onLogin={login} error={loginError} />;

ADD after it:

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

*/

// ════════════════════════════════════════════════════════════
// STEP 5: Test the Integration
// ════════════════════════════════════════════════════════════

/*
1. Start your dev server: npm run dev
2. Log in with your Supabase account (admin@werewaak.com / admin123)
3. Try creating a transfer:
   - Dashboard → Transfers → Send → Fill form → Save
   - Check Supabase dashboard: Table Editor → transfers
   - You should see the new record!

4. Try creating a loan:
   - Dashboard → Loans → Fill form → Save
   - Check Supabase dashboard: Table Editor → loans
   - You should see the new record!

5. Try updating a loan status:
   - Click "Mark Repaid" or "Reactivate" on any loan
   - Check it updated in Supabase

✓ If all three work, integration is successful!
✗ If something fails, check browser console for errors
*/

// ════════════════════════════════════════════════════════════
// EXPECTED RESULTS
// ════════════════════════════════════════════════════════════

/*
After successful integration:

✓ All data persists across page refreshes
✓ Logging out and back in shows your data
✓ Other users can't see your data (RLS protection)
✓ No error messages in browser console
✓ Dashboard loads quickly
✓ Transfers and loans update instantly in Supabase

That's it! Your app is now backed by a real database.
*/

// ════════════════════════════════════════════════════════════
// TROUBLESHOOTING
// ════════════════════════════════════════════════════════════

/*
Problem: "User not authenticated"
Solution: Make sure you're logged in. Check that the auth session exists.

Problem: "No data showing up"
Solution: 
  1. Check browser console (F12 → Console tab)
  2. Look for error messages
  3. Verify Supabase connection string in supabaseClient.js
  4. Verify RLS policies are enabled

Problem: "Can see other users' data"
Solution: RLS policies not properly applied. Run supabase-schema.sql again.

Problem: "Transfers/loans not saving"
Solution:
  1. Check browser Network tab (F12 → Network)
  2. Look for failed requests to supabase
  3. Check error messages in console
  4. Verify column names match exactly (check schema)
*/

// ════════════════════════════════════════════════════════════
// NEXT STEPS
// ════════════════════════════════════════════════════════════

/*
Once basic integration works, consider:

1. ✓ EASY: Add delete buttons (deleteTransfer, deleteLoan functions ready)
2. ✓ EASY: Add edit functionality (updateTransfer function ready)
3. MEDIUM: Add admin users table + real admin dashboard
4. MEDIUM: Add real-time updates with supabase subscriptions
5. HARD: Add reports that query the database directly
6. HARD: Add user management (create/delete accounts)
*/
