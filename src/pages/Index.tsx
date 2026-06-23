
import { useState, useMemo, useCallback, useEffect } from "react";
import werewaakLogo from "@/assets/werewaak-logo.png";
import { supabase } from "@/supabaseClient";
import { fetchTransfers, fetchLoans, createTransfer, createLoan, updateLoan } from "@/lib/supabaseService";





// Types
interface User {
  username: string;
  password: string;
  role: "admin" | "user";
  email?: string;
}

interface Transfer {
  id: string;
  type: "Sent" | "Received";
  senderName: string;
  senderPhone: string;
  senderLocation: string;
  receiverName: string;
  receiverPhone: string;
  receiverLocation: string;
  amountSent: number;
  currencySent: string;
  amountReceived: number;
  currencyReceived: string;
  commission: number;
  commissionPercent: number;
  dateTime: string;
  enteredBy: string;
}

interface Loan {
  id: string;
  borrowerName: string;
  borrowerIdPassport: string;
  borrowerPhone: string;
  borrowerLocation: string;
  loanAmount: number;
  currency: string;
  interestRate: number;
  interestAmount: number;
  totalRepayable: number;
  dateIssued: string;
  status: "Active" | "Repaid";
  enteredBy: string;
}

const CURRENCIES = [
  { code: "SSP", label: "🇸🇸 SSP", flag: "🇸🇸", name: "South Sudanese Pound" },
  { code: "UGX", label: "🇺🇬 UGX", flag: "🇺🇬", name: "Uganda Shillings" },
  { code: "KSH", label: "🇰🇪 KSH", flag: "🇰🇪", name: "Kenya Shillings" },
  { code: "USD", label: "🇺🇸 USD", flag: "🇺🇸", name: "US Dollar" },
];

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "transfers", label: "Transfers", icon: "💱" },
  { id: "loans", label: "Loans", icon: "🏦" },
  { id: "daily", label: "Daily Report", icon: "📋" },
  { id: "monthly", label: "Monthly Report", icon: "📅" },
  { id: "users", label: "User Management", icon: "👥", adminOnly: true },
];

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString().slice(0, 16);
const genId = () => Math.random().toString(36).slice(2, 10);
const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Login Screen ──
function LoginScreen({ onLogin, error }: { onLogin: (u: string, p: string) => Promise<void>; error: string }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="bg-card rounded-lg shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <img src={werewaakLogo} alt="Wërewaak Capital" className="w-24 h-24 mx-auto mb-3 rounded-full" />
          <h1 className="text-xl font-bold text-primary">Wërewaak Capital</h1>
          <p className="text-muted-foreground text-sm">Juba, South Sudan</p>
        </div>
        {error && <p className="text-destructive text-sm mb-3 text-center">{error}</p>}
        <input className="w-full border border-input rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Email" value={u} onChange={e => setU(e.target.value)} />
        <input className="w-full border border-input rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Password" type="password" value={p} onChange={e => setP(e.target.value)} onKeyDown={e => e.key === "Enter" && void onLogin(u, p)} />
        <button className="w-full bg-primary text-primary-foreground rounded py-2 font-semibold hover:opacity-90 transition" onClick={() => void onLogin(u, p)}>Login</button>
      </div>
    </div>
  );
}

// ── Summary Card ──
function SummaryCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <div className="rounded-lg p-4 shadow-sm border border-border bg-card">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Currency Select ──
function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="border border-input rounded px-2 py-2 text-sm bg-card focus:ring-2 focus:ring-ring" value={value} onChange={e => onChange(e.target.value)}>
      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
    </select>
  );
}

// ── Separate Send / Receive Forms ──
function SendMoneyForm({ currentUser, onAdd }: { currentUser: string; onAdd: (t: Transfer) => Promise<void> }) {
  const empty = {
    customerName: "", customerPhone: "", customerLocation: "",
    beneficiaryName: "", beneficiaryPhone: "", beneficiaryLocation: "",
    amountSent: "", currencySent: "USD", amountReceived: "", currencyReceived: "USD",
    commission: "", commissionPercent: "", dateTime: now(),
  };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!f.customerName || !f.beneficiaryName || !f.amountSent || !f.amountReceived) {
      setErr("Please fill all required fields"); return;
    }
    try {
      await onAdd({
        id: genId(), type: "Sent",
        senderName: f.customerName, senderPhone: f.customerPhone, senderLocation: f.customerLocation,
        receiverName: f.beneficiaryName, receiverPhone: f.beneficiaryPhone, receiverLocation: f.beneficiaryLocation,
        amountSent: +f.amountSent, currencySent: f.currencySent,
        amountReceived: +f.amountReceived, currencyReceived: f.currencyReceived,
        commission: +f.commission || 0, commissionPercent: +f.commissionPercent || 0,
        dateTime: f.dateTime, enteredBy: currentUser,
      });
      setSuccess("Transfer saved successfully!");
      setErr("");
      setF(empty);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setErr("Failed to save transfer. Please try again.");
      setSuccess("");
    }
  };

  const Label = ({ text }: { text: string }) => <label className="text-xs font-medium text-muted-foreground">{text}</label>;

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="font-semibold text-primary mb-1">📤 Send</h3>
      <p className="text-xs text-muted-foreground mb-4">Customer sending money through Wërewaak Capital</p>
      {err && <p className="text-destructive text-sm mb-2">{err}</p>}
      {success && <p className="text-success text-sm mb-2">✓ {success}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><Label text="Date & Time" /><input type="datetime-local" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.dateTime} onChange={e => set("dateTime", e.target.value)} /></div>
        <fieldset className="md:col-span-2 border border-border rounded-md p-4">
          <legend className="text-sm font-semibold text-foreground px-2">👤 Customer (Sender)</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label text="Full Name *" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.customerName} onChange={e => set("customerName", e.target.value)} /></div>
            <div><Label text="Phone" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.customerPhone} onChange={e => set("customerPhone", e.target.value)} /></div>
            <div><Label text="Location" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.customerLocation} onChange={e => set("customerLocation", e.target.value)} /></div>
          </div>
        </fieldset>
        <fieldset className="md:col-span-2 border border-border rounded-md p-4">
          <legend className="text-sm font-semibold text-foreground px-2">📬 Beneficiary (Receiver)</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label text="Full Name *" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.beneficiaryName} onChange={e => set("beneficiaryName", e.target.value)} /></div>
            <div><Label text="Phone" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.beneficiaryPhone} onChange={e => set("beneficiaryPhone", e.target.value)} /></div>
            <div><Label text="Location" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.beneficiaryLocation} onChange={e => set("beneficiaryLocation", e.target.value)} /></div>
          </div>
        </fieldset>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label text="Amount Sent *" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.amountSent} onChange={e => set("amountSent", e.target.value)} /></div>
          <CurrencySelect value={f.currencySent} onChange={v => set("currencySent", v)} />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label text="Amount Received *" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.amountReceived} onChange={e => set("amountReceived", e.target.value)} /></div>
          <CurrencySelect value={f.currencyReceived} onChange={v => set("currencyReceived", v)} />
        </div>
        <div><Label text="Commission Amount" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.commission} onChange={e => set("commission", e.target.value)} /></div>
        <div><Label text="Commission %" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.commissionPercent} onChange={e => set("commissionPercent", e.target.value)} /></div>
      </div>
      <button className="mt-4 bg-primary text-primary-foreground rounded px-6 py-2 text-sm font-semibold hover:opacity-90 transition" onClick={() => void submit()}>Save</button>
    </div>
  );
}

function ReceiveMoneyForm({ currentUser, onAdd }: { currentUser: string; onAdd: (t: Transfer) => Promise<void> }) {
  const empty = {
    senderName: "", senderPhone: "", senderLocation: "",
    customerName: "", customerPhone: "", customerLocation: "",
    amountSent: "", currencySent: "USD", amountReceived: "", currencyReceived: "USD",
    commission: "", commissionPercent: "", dateTime: now(),
  };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!f.senderName || !f.customerName || !f.amountSent || !f.amountReceived) {
      setErr("Please fill all required fields"); return;
    }
    try {
      await onAdd({
        id: genId(), type: "Received",
        senderName: f.senderName, senderPhone: f.senderPhone, senderLocation: f.senderLocation,
        receiverName: f.customerName, receiverPhone: f.customerPhone, receiverLocation: f.customerLocation,
        amountSent: +f.amountSent, currencySent: f.currencySent,
        amountReceived: +f.amountReceived, currencyReceived: f.currencyReceived,
        commission: +f.commission || 0, commissionPercent: +f.commissionPercent || 0,
        dateTime: f.dateTime, enteredBy: currentUser,
      });
      setSuccess("Transfer saved successfully!");
      setErr("");
      setF(empty);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setErr("Failed to save transfer. Please try again.");
      setSuccess("");
    }
  };

  const Label = ({ text }: { text: string }) => <label className="text-xs font-medium text-muted-foreground">{text}</label>;

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="font-semibold text-success mb-1">📥 Receive</h3>
      <p className="text-xs text-muted-foreground mb-4">Customer receiving money from Wërewaak Capital</p>
      {err && <p className="text-destructive text-sm mb-2">{err}</p>}
      {success && <p className="text-success text-sm mb-2">✓ {success}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><Label text="Date & Time" /><input type="datetime-local" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.dateTime} onChange={e => set("dateTime", e.target.value)} /></div>
        <fieldset className="md:col-span-2 border border-border rounded-md p-4">
          <legend className="text-sm font-semibold text-foreground px-2">📨 Sender (Origin)</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label text="Full Name *" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.senderName} onChange={e => set("senderName", e.target.value)} /></div>
            <div><Label text="Phone" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.senderPhone} onChange={e => set("senderPhone", e.target.value)} /></div>
            <div><Label text="Location" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.senderLocation} onChange={e => set("senderLocation", e.target.value)} /></div>
          </div>
        </fieldset>
        <fieldset className="md:col-span-2 border border-border rounded-md p-4">
          <legend className="text-sm font-semibold text-foreground px-2">👤 Customer (Receiver)</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label text="Full Name *" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.customerName} onChange={e => set("customerName", e.target.value)} /></div>
            <div><Label text="Phone" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.customerPhone} onChange={e => set("customerPhone", e.target.value)} /></div>
            <div><Label text="Location" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.customerLocation} onChange={e => set("customerLocation", e.target.value)} /></div>
          </div>
        </fieldset>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label text="Amount Sent *" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.amountSent} onChange={e => set("amountSent", e.target.value)} /></div>
          <CurrencySelect value={f.currencySent} onChange={v => set("currencySent", v)} />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label text="Amount Received *" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.amountReceived} onChange={e => set("amountReceived", e.target.value)} /></div>
          <CurrencySelect value={f.currencyReceived} onChange={v => set("currencyReceived", v)} />
        </div>
        <div><Label text="Commission Amount" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.commission} onChange={e => set("commission", e.target.value)} /></div>
        <div><Label text="Commission %" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.commissionPercent} onChange={e => set("commissionPercent", e.target.value)} /></div>
      </div>
      <button className="mt-4 bg-success text-success-foreground rounded px-6 py-2 text-sm font-semibold hover:opacity-90 transition" onClick={() => void submit()}>Save</button>
    </div>
  );
}

// ── Loan Form ──
function LoanForm({ currentUser, onAdd }: { currentUser: string; onAdd: (l: Loan) => Promise<void> }) {
  const empty = { borrowerName: "", borrowerIdPassport: "", borrowerPhone: "", borrowerLocation: "", loanAmount: "", currency: "USD", interestRate: "", dateIssued: today() };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const interestAmt = (+f.loanAmount || 0) * (+f.interestRate || 0) / 100;
  const totalRepayable = (+f.loanAmount || 0) + interestAmt;

  const submit = async () => {
    if (!f.borrowerName || !f.loanAmount || !f.interestRate) { setErr("Please fill required fields"); return; }
    try {
      await onAdd({
        id: genId(), borrowerName: f.borrowerName, borrowerIdPassport: f.borrowerIdPassport,
        borrowerPhone: f.borrowerPhone,
        borrowerLocation: f.borrowerLocation, loanAmount: +f.loanAmount, currency: f.currency,
        interestRate: +f.interestRate, interestAmount: interestAmt, totalRepayable,
        dateIssued: f.dateIssued, status: "Active", enteredBy: currentUser,
      });
      setSuccess("Loan saved successfully!");
      setErr("");
      setF(empty);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setErr("Failed to save loan. Please try again.");
      setSuccess("");
    }
  };

  const Label = ({ text }: { text: string }) => <label className="text-xs font-medium text-muted-foreground">{text}</label>;

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="font-semibold text-primary mb-4">New Loan</h3>
      {err && <p className="text-destructive text-sm mb-2">{err}</p>}
      {success && <p className="text-success text-sm mb-2">✓ {success}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label text="Borrower Name *" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.borrowerName} onChange={e => set("borrowerName", e.target.value)} /></div>
        <div><Label text="ID/Passport Number" /><input className="w-full border border-input rounded px-2 py-2 text-sm" placeholder="Enter ID or Passport number" value={f.borrowerIdPassport} onChange={e => set("borrowerIdPassport", e.target.value)} /></div>
        <div><Label text="Phone" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.borrowerPhone} onChange={e => set("borrowerPhone", e.target.value)} /></div>
        <div><Label text="Location" /><input className="w-full border border-input rounded px-2 py-2 text-sm" value={f.borrowerLocation} onChange={e => set("borrowerLocation", e.target.value)} /></div>
        <div><Label text="Date Issued" /><input type="date" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.dateIssued} onChange={e => set("dateIssued", e.target.value)} /></div>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label text="Loan Amount *" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.loanAmount} onChange={e => set("loanAmount", e.target.value)} /></div>
          <CurrencySelect value={f.currency} onChange={v => set("currency", v)} />
        </div>
        <div><Label text="Interest Rate (%) *" /><input type="number" className="w-full border border-input rounded px-2 py-2 text-sm" value={f.interestRate} onChange={e => set("interestRate", e.target.value)} /></div>
        <div className="bg-accent/50 rounded p-3 md:col-span-2 flex gap-6 text-sm">
          <span><strong>Interest:</strong> {fmt(interestAmt)} {f.currency}</span>
          <span><strong>Total Repayable:</strong> {fmt(totalRepayable)} {f.currency}</span>
        </div>
      </div>
      <button className="mt-4 bg-primary text-primary-foreground rounded px-6 py-2 text-sm font-semibold hover:opacity-90 transition" onClick={() => void submit()}>Save</button>
    </div>
  );
}

// ── Per-Currency Stats helper ──
function getCurrencyStats(transfers: Transfer[], loans: Loan[]) {
  return CURRENCIES.map(c => {
    const cur = c.code;
    const sentTx = transfers.filter(t => t.type === "Sent" && t.currencySent === cur);
    const receivedTx = transfers.filter(t => t.type === "Received" && t.currencyReceived === cur);
    const commTx = transfers.filter(t => t.currencySent === cur);
    const curLoans = loans.filter(l => l.currency === cur);
    return {
      ...c,
      totalSent: sentTx.reduce((s, t) => s + t.amountSent, 0),
      totalReceived: receivedTx.reduce((s, t) => s + t.amountReceived, 0),
      totalCommission: commTx.reduce((s, t) => s + t.commission, 0),
      totalLoans: curLoans.reduce((s, l) => s + l.loanAmount, 0),
      totalInterest: curLoans.reduce((s, l) => s + l.interestAmount, 0),
      transfers: transfers.filter(t => t.currencySent === cur || t.currencyReceived === cur),
      loans: curLoans,
    };
  });
}

// ── Print Transfer Report (per-currency) ──
function PrintTransferReport({ title, transfers, dateLabel }: { title: string; transfers: Transfer[]; dateLabel: string }) {
  const stats = getCurrencyStats(transfers, []);
  const handlePrint = () => window.print();

  return (
    <div>
      <button className="no-print mb-4 bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-semibold hover:opacity-90" onClick={handlePrint}>🖨️ Print {title}</button>
      <div className="print-container">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-primary">Wërewaak Capital</h2>
          <p className="text-muted-foreground text-sm">Sherikat, Juba – South Sudan</p>
          <p className="text-sm font-medium mt-1">{title} — Transfers — {dateLabel}</p>
        </div>

        {stats.map(cs => {
          if (cs.totalSent === 0 && cs.totalReceived === 0 && cs.totalCommission === 0) return null;
          return (
            <div key={cs.code} className="mb-6">
              <h3 className="font-bold text-sm text-primary mb-2">{cs.flag} {cs.code} — {cs.name}</h3>
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-accent/50 rounded p-2"><strong>Sent:</strong> {fmt(cs.totalSent)}</div>
                <div className="bg-accent/50 rounded p-2"><strong>Received:</strong> {fmt(cs.totalReceived)}</div>
                <div className="bg-accent/50 rounded p-2"><strong>Commission:</strong> {fmt(cs.totalCommission)}</div>
              </div>
              {cs.transfers.length > 0 && (
                <table className="w-full text-xs mb-3 border-collapse border border-border">
                  <thead><tr className="bg-muted">
                    <th className="border border-border px-2 py-1">Type</th><th className="border border-border px-2 py-1">Sender</th>
                    <th className="border border-border px-2 py-1">Receiver</th><th className="border border-border px-2 py-1">Sent</th>
                    <th className="border border-border px-2 py-1">Received</th><th className="border border-border px-2 py-1">Commission</th>
                    <th className="border border-border px-2 py-1">Date</th><th className="border border-border px-2 py-1">By</th>
                  </tr></thead>
                  <tbody>{cs.transfers.map(t => (
                    <tr key={t.id}>
                      <td className="border border-border px-2 py-1">{t.type}</td>
                      <td className="border border-border px-2 py-1">{t.senderName}</td>
                      <td className="border border-border px-2 py-1">{t.receiverName}</td>
                      <td className="border border-border px-2 py-1">{fmt(t.amountSent)} {t.currencySent}</td>
                      <td className="border border-border px-2 py-1">{fmt(t.amountReceived)} {t.currencyReceived}</td>
                      <td className="border border-border px-2 py-1">{fmt(t.commission)}</td>
                      <td className="border border-border px-2 py-1">{t.dateTime.replace("T", " ")}</td>
                      <td className="border border-border px-2 py-1">{t.enteredBy}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          );
        })}

        {transfers.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No transfer records for this period.</p>
        )}
      </div>
    </div>
  );
}

// ── Print Loan Report (per-currency) ──
function PrintLoanReport({ title, loans, dateLabel }: { title: string; loans: Loan[]; dateLabel: string }) {
  const stats = getCurrencyStats([], loans);
  const handlePrint = () => window.print();

  return (
    <div>
      <button className="no-print mb-4 bg-accent text-accent-foreground rounded px-4 py-2 text-sm font-semibold hover:opacity-90" onClick={handlePrint}>🖨️ Print {title} — Loans</button>
      <div className="print-container">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-primary">Wërewaak Capital</h2>
          <p className="text-muted-foreground text-sm">Sherikat, Juba – South Sudan</p>
          <p className="text-sm font-medium mt-1">{title} — Loans — {dateLabel}</p>
        </div>

        {stats.map(cs => {
          if (cs.totalLoans === 0) return null;
          return (
            <div key={cs.code} className="mb-6">
              <h3 className="font-bold text-sm text-primary mb-2">{cs.flag} {cs.code} — {cs.name}</h3>
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-accent/50 rounded p-2"><strong>Total Loans:</strong> {fmt(cs.totalLoans)}</div>
                <div className="bg-accent/50 rounded p-2"><strong>Total Interest:</strong> {fmt(cs.totalInterest)}</div>
                <div className="bg-accent/50 rounded p-2"><strong>Count:</strong> {cs.loans.length}</div>
              </div>
              <table className="w-full text-xs border-collapse border border-border">
                <thead><tr className="bg-muted">
                  <th className="border border-border px-2 py-1">Borrower</th>
                  <th className="border border-border px-2 py-1">ID/Passport</th>
                  <th className="border border-border px-2 py-1">Phone</th>
                  <th className="border border-border px-2 py-1">Amount</th>
                  <th className="border border-border px-2 py-1">Interest</th>
                  <th className="border border-border px-2 py-1">Rate</th>
                  <th className="border border-border px-2 py-1">Total Repayable</th>
                  <th className="border border-border px-2 py-1">Status</th>
                  <th className="border border-border px-2 py-1">Date</th>
                  <th className="border border-border px-2 py-1">By</th>
                </tr></thead>
                <tbody>{cs.loans.map(l => (
                  <tr key={l.id}>
                    <td className="border border-border px-2 py-1">{l.borrowerName}</td>
                    <td className="border border-border px-2 py-1">{l.borrowerIdPassport || "—"}</td>
                    <td className="border border-border px-2 py-1">{l.borrowerPhone}</td>
                    <td className="border border-border px-2 py-1">{fmt(l.loanAmount)} {l.currency}</td>
                    <td className="border border-border px-2 py-1">{fmt(l.interestAmount)} ({l.interestRate}%)</td>
                    <td className="border border-border px-2 py-1">{l.interestRate}%</td>
                    <td className="border border-border px-2 py-1">{fmt(l.totalRepayable)}</td>
                    <td className="border border-border px-2 py-1">{l.status}</td>
                    <td className="border border-border px-2 py-1">{l.dateIssued}</td>
                    <td className="border border-border px-2 py-1">{l.enteredBy}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          );
        })}

        {loans.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No loan records for this period.</p>
        )}
      </div>
    </div>
  );
}

// ── Main App ──
export default function Index() {
  const [users, setUsers] = useState<User[]>([
    { username: "admin@werewaak.com", password: "admin123", role: "admin", email: "admin@werewaak.com" },
    { username: "user@werewaak.com", password: "user123", role: "user", email: "user@werewaak.com" },
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/signin";
      }
    };
    checkSession();
  }, []);

  const getEmailForUsername = (username: string) => {
    const mappedUser = users.find(x => x.username === username);
    return mappedUser?.email || username;
  };
  const [section, setSection] = useState("dashboard");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [initialTransfers, initialLoans] = await Promise.all([fetchTransfers(), fetchLoans()]);
      setTransfers(initialTransfers);
      setLoans(initialLoans);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Transfer tab
  const [transferTab, setTransferTab] = useState<"list" | "sent" | "received">("list");
  const [transferFilter, setTransferFilter] = useState<"All" | "Sent" | "Received">("All");

  // User management
  const [newUser, setNewUser] = useState<{ username: string; password: string; role: "admin" | "user" }>({ username: "", password: "", role: "user" });
  const [userErr, setUserErr] = useState("");

  // Report filters
  const [reportDate, setReportDate] = useState(today());
  const [reportMonth, setReportMonth] = useState(today().slice(0, 7));

  // Sort
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const login = useCallback(async (u: string, p: string) => {
    setIsLoading(true);
    const Username = u.trim();
    const password = p;
    if (!Username || !password) {
      setLoginError("Please enter username and password");
      setIsLoading(false);
      return;
    }

    const supabaseEmail = getEmailForUsername(Username);
    const { data, error } = await supabase.auth.signInWithPassword({ email: supabaseEmail, password });
    
    if (error) {
      const localUser = users.find(x => x.username === Username && x.password === password);
      if (localUser) {
        setLoginError("");
        setCurrentUser({ username: localUser.username, password: "", role: localUser.role });
        setIsLoading(false);
        if (window.location.pathname !== "/") window.location.assign("/");
        return;
      }
      setLoginError(error.message);
      setIsLoading(false);
      return;
    }

    setLoginError("");
    const role = users.find(x => x.username === Username)?.role ?? "user";
    setCurrentUser({ username: Username, password: "", role });
    setIsLoading(false);
    if (window.location.pathname !== "/") window.location.assign("/");
  }, [users]);

  const isAdmin = currentUser?.role === "admin";

  const visibleTransfers = useMemo(() => {
    let list = isAdmin ? transfers : transfers.filter(t => t.enteredBy === currentUser?.username);
    return [...list].sort((a, b) => sortDir === "desc" ? b.dateTime.localeCompare(a.dateTime) : a.dateTime.localeCompare(b.dateTime));
  }, [transfers, isAdmin, currentUser, sortDir]);

  const visibleLoans = useMemo(() => {
    let list = isAdmin ? loans : loans.filter(l => l.enteredBy === currentUser?.username);
    return [...list].sort((a, b) => sortDir === "desc" ? b.dateIssued.localeCompare(a.dateIssued) : a.dateIssued.localeCompare(b.dateIssued));
  }, [loans, isAdmin, currentUser, sortDir]);

  const todayTransfers = useMemo(() => visibleTransfers.filter(t => t.dateTime.startsWith(today())), [visibleTransfers]);
  const todayLoans = useMemo(() => visibleLoans.filter(l => l.dateIssued === today()), [visibleLoans]);
  const monthTransfers = useMemo(() => visibleTransfers.filter(t => t.dateTime.startsWith(reportMonth)), [visibleTransfers, reportMonth]);
  const monthLoans = useMemo(() => visibleLoans.filter(l => l.dateIssued.startsWith(reportMonth)), [visibleLoans, reportMonth]);
  const dailyTransfers = useMemo(() => visibleTransfers.filter(t => t.dateTime.startsWith(reportDate)), [visibleTransfers, reportDate]);
  const dailyLoans = useMemo(() => visibleLoans.filter(l => l.dateIssued === reportDate), [visibleLoans, reportDate]);

  const todayStats = useMemo(() => getCurrencyStats(todayTransfers, todayLoans), [todayTransfers, todayLoans]);

  const filteredTransfers = useMemo(() => {
    if (transferFilter === "All") return visibleTransfers;
    return visibleTransfers.filter(t => t.type === transferFilter);
  }, [visibleTransfers, transferFilter]);

  const addTransfer = async (t: Transfer) => {
    const created = await createTransfer(t);
    if (created) {
      setTransfers(prev => [...prev, created]);
    } else {
      setTransfers(prev => [...prev, t]);
    }
  };

  const addLoan = async (loan: Loan) => {
    const created = await createLoan(loan);
    if (created) {
      setLoans(prev => [...prev, created]);
    } else {
      setLoans(prev => [...prev, loan]);
    }
  };

  const toggleLoanStatus = async (id: string) => {
    const existing = loans.find(l => l.id === id);
    if (!existing) return;
    const nextStatus = existing.status === "Active" ? "Repaid" : "Active";
    const updated = await updateLoan(id, { status: nextStatus });
    setLoans(prev => prev.map(l => l.id === id ? (updated ?? { ...l, status: nextStatus }) : l));
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.password) { setUserErr("Fill all fields"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.username)) { setUserErr("Enter a valid email"); return; }
    if (users.find(u => u.email === newUser.username)) { setUserErr("Email already exists"); return; }

    const email = newUser.username.trim();
    const password = newUser.password;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: newUser.role } },
    });
    if (error) {
      setUserErr(error.message);
      return;
    }

    setUsers(prev => [...prev, { username: email, password: newUser.password, role: newUser.role, email }]);
    setCurrentUser({ username: email, password: "", role: newUser.role });
    setNewUser({ username: "", password: "", role: "user" });
    setUserErr("");
    if (window.location.pathname !== "/") window.location.assign("/");
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="text-center text-primary-foreground">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    </div>
  );

  if (!currentUser) return <LoginScreen onLogin={login} error={loginError} />;

  const navItems = SECTIONS.filter(s => !s.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`no-print bg-sidebar text-sidebar-foreground transition-all duration-300 ${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} flex-shrink-0`}>
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <img src={werewaakLogo} alt="Wërewaak Capital" className="w-10 h-10 rounded-full" />
          <div>
            <h2 className="font-bold text-sm text-sidebar-primary-foreground">Wërewaak Capital</h2>
            <p className="text-xs text-sidebar-foreground/70">Juba, South Sudan</p>
          </div>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map(s => (
            <button key={s.id} onClick={() => { setSection(s.id); if (s.id === "transfers") setTransferTab("list"); }}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition ${section === s.id ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}`}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/70">Logged in as</p>
          <p className="text-sm font-medium">{currentUser.username} ({currentUser.role})</p>
          <button onClick={() => setCurrentUser(null)} className="mt-2 text-xs text-sidebar-primary hover:underline">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">☰</button>
          <img src={werewaakLogo} alt="Wërewaak Capital" className="w-8 h-8 rounded-full" />
          <h1 className="font-bold text-primary text-sm">Wërewaak Capital</h1>
          <span className="text-muted-foreground text-xs">Sherikat, Juba – South Sudan</span>
          <span className="ml-auto text-xs text-muted-foreground">{new Date().toLocaleDateString()}</span>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          {/* ── Dashboard ── */}
          {section === "dashboard" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Dashboard — Today's Summary</h2>
              {todayStats.map(cs => {
                const hasData = cs.totalSent > 0 || cs.totalReceived > 0 || cs.totalCommission > 0 || cs.totalLoans > 0;
                return (
                  <div key={cs.code} className="mb-6">
                    <h3 className="text-sm font-bold text-foreground mb-2">{cs.flag} {cs.code} — {cs.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <SummaryCard title="Sent" value={`${fmt(cs.totalSent)} ${cs.code}`} icon="📤" color="text-primary" />
                      <SummaryCard title="Received" value={`${fmt(cs.totalReceived)} ${cs.code}`} icon="📥" color="text-success" />
                      <SummaryCard title="Commission" value={`${fmt(cs.totalCommission)} ${cs.code}`} icon="💰" color="text-warning" />
                      <SummaryCard title="Loans" value={`${fmt(cs.totalLoans)} ${cs.code}`} icon="🏦" color="text-info" />
                    </div>
                    {!hasData && <p className="text-xs text-muted-foreground mt-1">No transactions today</p>}
                  </div>
                );
              })}
              <div className="mt-4">
                <div className="flex gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Recent Transfers</span>
                  <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")} className="text-xs text-primary hover:underline">Sort {sortDir === "desc" ? "↑" : "↓"}</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead><tr className="bg-muted">
                      {["Type","Sender","Receiver","Sent","Received","Commission","Date","By"].map(h => <th key={h} className="px-2 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
                    </tr></thead>
                    <tbody>{visibleTransfers.slice(0, 10).map(t => (
                      <tr key={t.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-2 py-2"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${t.type === "Sent" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>{t.type}</span></td>
                        <td className="px-2 py-2">{t.senderName}</td>
                        <td className="px-2 py-2">{t.receiverName}</td>
                        <td className="px-2 py-2">{fmt(t.amountSent)} {t.currencySent}</td>
                        <td className="px-2 py-2">{fmt(t.amountReceived)} {t.currencyReceived}</td>
                        <td className="px-2 py-2">{fmt(t.commission)}</td>
                        <td className="px-2 py-2">{t.dateTime.replace("T", " ")}</td>
                        <td className="px-2 py-2">{t.enteredBy}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Transfers ── */}
          {section === "transfers" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Money Transfers</h2>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setTransferTab("list")} className={`px-4 py-2 rounded text-sm font-medium transition ${transferTab === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>📋 All Transfers</button>
                <button onClick={() => setTransferTab("sent")} className={`px-4 py-2 rounded text-sm font-medium transition ${transferTab === "sent" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>📤 Send</button>
                <button onClick={() => setTransferTab("received")} className={`px-4 py-2 rounded text-sm font-medium transition ${transferTab === "received" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>📥 Receive</button>
              </div>

              {transferTab === "sent" && <SendMoneyForm currentUser={currentUser.username} onAdd={addTransfer} />}
              {transferTab === "received" && <ReceiveMoneyForm currentUser={currentUser.username} onAdd={addTransfer} />}

              {transferTab === "list" && (
                <div>
                  <div className="flex gap-2 mb-3 items-center">
                    <span className="text-sm font-medium">Filter:</span>
                    {(["All", "Sent", "Received"] as const).map(f => (
                      <button key={f} onClick={() => setTransferFilter(f)} className={`px-3 py-1 rounded text-xs font-medium transition ${transferFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>
                    ))}
                    <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")} className="text-xs text-primary hover:underline ml-2">Sort {sortDir === "desc" ? "↑" : "↓"}</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className="bg-muted">
                        {["Type","Customer","Sender","Receiver","Sent","Received","Commission","Date","By"].map(h => <th key={h} className="px-2 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
                      </tr></thead>
                      <tbody>{filteredTransfers.map(t => (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/30">
                          <td className="px-2 py-1"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${t.type === "Sent" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>{t.type}</span></td>
                          <td className="px-2 py-1 font-medium">{t.type === "Sent" ? t.senderName : t.receiverName}</td>
                          <td className="px-2 py-1">{t.senderName}</td>
                          <td className="px-2 py-1">{t.receiverName}</td>
                          <td className="px-2 py-1">{fmt(t.amountSent)} {t.currencySent}</td>
                          <td className="px-2 py-1">{fmt(t.amountReceived)} {t.currencyReceived}</td>
                          <td className="px-2 py-1">{fmt(t.commission)}</td>
                          <td className="px-2 py-1">{t.dateTime.replace("T", " ")}</td>
                          <td className="px-2 py-1">{t.enteredBy}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Loans ── */}
          {section === "loans" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Loan Management</h2>
              <LoanForm currentUser={currentUser.username} onAdd={addLoan} />
              <div className="mt-6">
                <span className="text-sm font-medium">All Loans</span>
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs border-collapse">
                    <thead><tr className="bg-muted">
                      {["Borrower","ID/Passport","Phone","Location","Amount","Interest","Rate","Total","Status","Date","By","Action"].map(h => <th key={h} className="px-2 py-2 text-left font-medium text-muted-foreground">{h}</th>)}
                    </tr></thead>
                    <tbody>{visibleLoans.map(l => (
                      <tr key={l.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-2 py-1">{l.borrowerName}</td>
                        <td className="px-2 py-1">{l.borrowerIdPassport || "—"}</td>
                        <td className="px-2 py-1">{l.borrowerPhone}</td>
                        <td className="px-2 py-1">{l.borrowerLocation}</td>
                        <td className="px-2 py-1">{fmt(l.loanAmount)} {l.currency}</td>
                        <td className="px-2 py-1">{fmt(l.interestAmount)} {l.currency}</td>
                        <td className="px-2 py-1">{l.interestRate}%</td>
                        <td className="px-2 py-1">{fmt(l.totalRepayable)} {l.currency}</td>
                        <td className="px-2 py-1"><span className={`px-2 py-0.5 rounded text-xs font-medium ${l.status === "Active" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>{l.status}</span></td>
                        <td className="px-2 py-1">{l.dateIssued}</td>
                        <td className="px-2 py-1">{l.enteredBy}</td>
                        <td className="px-2 py-1"><button onClick={() => toggleLoanStatus(l.id)} className="text-primary text-xs hover:underline">{l.status === "Active" ? "Mark Repaid" : "Reactivate"}</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Daily Report */}
          {section === "daily" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Daily Report</h2>
              <input type="date" className="no-print border border-input rounded px-3 py-2 text-sm mb-4" value={reportDate} onChange={e => setReportDate(e.target.value)} />
              <PrintTransferReport title="Daily Report" transfers={dailyTransfers} dateLabel={reportDate} />
              <PrintLoanReport title="Daily Report" loans={dailyLoans} dateLabel={reportDate} />
            </div>
          )}

          {/* Monthly Report */}
          {section === "monthly" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Monthly Report</h2>
              <input type="month" className="no-print border border-input rounded px-3 py-2 text-sm mb-4" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
              <PrintTransferReport title="Monthly Report" transfers={monthTransfers} dateLabel={reportMonth} />
              <PrintLoanReport title="Monthly Report" loans={monthLoans} dateLabel={reportMonth} />
            </div>
          )}

          {/* User Management */}
          {section === "users" && isAdmin && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">User Management</h2>
              <div className="bg-card rounded-lg border border-border p-5 mb-6 max-w-md">
                <h3 className="font-semibold text-primary mb-3">Add New User</h3>
                {userErr && <p className="text-destructive text-sm mb-2">{userErr}</p>}
                <input className="w-full border border-input rounded px-2 py-2 text-sm mb-2" placeholder="Email" type="email" value={newUser.username} onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))} />
                <input className="w-full border border-input rounded px-2 py-2 text-sm mb-2" placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))} />
                <select className="w-full border border-input rounded px-2 py-2 text-sm mb-3 bg-card" value={newUser.role} onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value as "admin" | "user" }))}>
                  <option value="user">User</option><option value="admin">Admin</option>
                </select>
                <button className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-semibold hover:opacity-90" onClick={addUser}>Add User</button>
              </div>
              <table className="w-full text-sm border-collapse max-w-md">
                <thead><tr className="bg-muted"><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2 text-left">Role</th></tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.email} className="border-b border-border"><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2 capitalize">{u.role}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
