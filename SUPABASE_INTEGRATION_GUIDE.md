/**
 * INTEGRATION GUIDE: Replacing Local State with Supabase
 * 
 * This guide shows how to update src/pages/Index.tsx to use Supabase
 * instead of local state for transfers and loans.
 */

// ════════════════════════════════════════════════════════════
// STEP 1: Add imports at the top of Index.tsx
// ════════════════════════════════════════════════════════════

import {
  fetchTransfers,
  fetchLoans,
  createTransfer,
  createLoan,
  updateLoan,
  deleteLoan,
} from "@/lib/supabaseService";

// ════════════════════════════════════════════════════════════
// STEP 2: Replace initial state setup in the Index component
// ════════════════════════════════════════════════════════════

// BEFORE:
// const [transfers, setTransfers] = useState<Transfer[]>([]);
// const [loans, setLoans] = useState<Loan[]>([]);

// AFTER:
const [transfers, setTransfers] = useState<Transfer[]>([]);
const [loans, setLoans] = useState<Loan[]>([]);
const [loading, setLoading] = useState(true);

// ════════════════════════════════════════════════════════════
// STEP 3: Add useEffect to load data when component mounts
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
// STEP 4: Replace addTransfer function
// ════════════════════════════════════════════════════════════

// OLD CODE:
// const addTransfer = (t: Transfer) => setTransfers(prev => [...prev, t]);

// NEW CODE:
const addTransfer = async (t: Transfer) => {
  const newTransfer = await createTransfer(t);
  if (newTransfer) {
    setTransfers(prev => [...prev, newTransfer]);
  }
};

// ════════════════════════════════════════════════════════════
// STEP 5: Update LoanForm onAdd callback
// ════════════════════════════════════════════════════════════

// BEFORE:
// <LoanForm currentUser={currentUser.username} onAdd={l => setLoans(prev => [...prev, l])} />

// AFTER:
const addLoan = async (l: Loan) => {
  const newLoan = await createLoan(l);
  if (newLoan) {
    setLoans(prev => [...prev, newLoan]);
  }
};

// And in the JSX:
<LoanForm currentUser={currentUser.username} onAdd={addLoan} />

// ════════════════════════════════════════════════════════════
// STEP 6: Replace toggleLoanStatus function
// ════════════════════════════════════════════════════════════

// OLD CODE:
// const toggleLoanStatus = (id: string) => {
//   setLoans(prev => prev.map(l => l.id === id ? { ...l, status: l.status === "Active" ? "Repaid" : "Active" } : l));
// };

// NEW CODE:
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

// ════════════════════════════════════════════════════════════
// STEP 7: Show loading state in the UI (optional)
// ════════════════════════════════════════════════════════════

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// OPTIONAL: Add delete transfer function
// ════════════════════════════════════════════════════════════

import { deleteTransfer } from "@/lib/supabaseService";

const removeTransfer = async (id: string) => {
  const success = await deleteTransfer(id);
  if (success) {
    setTransfers(prev => prev.filter(t => t.id !== id));
  }
};

// ════════════════════════════════════════════════════════════
// STEP 8: The UI components DON'T NEED TO CHANGE
// ════════════════════════════════════════════════════════════

/*
The beautiful part: all the UI components that use transfers and loans
will continue to work exactly as they are now, because they just read
from the state. Only the functions that modify state (add/update/delete)
change. All the rendering logic stays identical.
*/
