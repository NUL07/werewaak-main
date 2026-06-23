import { supabase } from "@/supabaseClient";

// Transfer types matching the UI
export interface Transfer {
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

export interface Loan {
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

// ════════════════════════════════════════════════════════════
// TRANSFERS
// ════════════════════════════════════════════════════════════

export async function fetchTransfers(): Promise<Transfer[]> {
  try {
    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .order("date_time", { ascending: false });

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      type: row.type,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      senderLocation: row.sender_location,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      receiverLocation: row.receiver_location,
      amountSent: row.amount_sent,
      currencySent: row.currency_sent,
      amountReceived: row.amount_received,
      currencyReceived: row.currency_received,
      commission: row.commission,
      commissionPercent: row.commission_percent,
      dateTime: row.date_time,
      enteredBy: row.entered_by,
    }));
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return [];
  }
}

export async function createTransfer(transfer: Transfer): Promise<Transfer | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("transfers")
      .insert([
        {
          user_id: userId,
          type: transfer.type,
          sender_name: transfer.senderName,
          sender_phone: transfer.senderPhone,
          sender_location: transfer.senderLocation,
          receiver_name: transfer.receiverName,
          receiver_phone: transfer.receiverPhone,
          receiver_location: transfer.receiverLocation,
          amount_sent: transfer.amountSent,
          currency_sent: transfer.currencySent,
          amount_received: transfer.amountReceived,
          currency_received: transfer.currencyReceived,
          commission: transfer.commission,
          commission_percent: transfer.commissionPercent,
          date_time: transfer.dateTime,
          entered_by: transfer.enteredBy,
        },
      ])
      .select();

    if (error) throw error;

    const row = data?.[0];
    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      senderLocation: row.sender_location,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      receiverLocation: row.receiver_location,
      amountSent: row.amount_sent,
      currencySent: row.currency_sent,
      amountReceived: row.amount_received,
      currencyReceived: row.currency_received,
      commission: row.commission,
      commissionPercent: row.commission_percent,
      dateTime: row.date_time,
      enteredBy: row.entered_by,
    };
  } catch (error) {
    console.error("Error creating transfer:", error);
    return null;
  }
}

export async function updateTransfer(id: string, transfer: Partial<Transfer>): Promise<Transfer | null> {
  try {
    const updateData: Record<string, any> = {};
    if (transfer.type) updateData.type = transfer.type;
    if (transfer.senderName) updateData.sender_name = transfer.senderName;
    if (transfer.senderPhone) updateData.sender_phone = transfer.senderPhone;
    if (transfer.senderLocation) updateData.sender_location = transfer.senderLocation;
    if (transfer.receiverName) updateData.receiver_name = transfer.receiverName;
    if (transfer.receiverPhone) updateData.receiver_phone = transfer.receiverPhone;
    if (transfer.receiverLocation) updateData.receiver_location = transfer.receiverLocation;
    if (transfer.amountSent !== undefined) updateData.amount_sent = transfer.amountSent;
    if (transfer.currencySent) updateData.currency_sent = transfer.currencySent;
    if (transfer.amountReceived !== undefined) updateData.amount_received = transfer.amountReceived;
    if (transfer.currencyReceived) updateData.currency_received = transfer.currencyReceived;
    if (transfer.commission !== undefined) updateData.commission = transfer.commission;
    if (transfer.commissionPercent !== undefined) updateData.commission_percent = transfer.commissionPercent;

    const { data, error } = await supabase
      .from("transfers")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;

    const row = data?.[0];
    if (!row) return null;

    return {
      id: row.id,
      type: row.type,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      senderLocation: row.sender_location,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      receiverLocation: row.receiver_location,
      amountSent: row.amount_sent,
      currencySent: row.currency_sent,
      amountReceived: row.amount_received,
      currencyReceived: row.currency_received,
      commission: row.commission,
      commissionPercent: row.commission_percent,
      dateTime: row.date_time,
      enteredBy: row.entered_by,
    };
  } catch (error) {
    console.error("Error updating transfer:", error);
    return null;
  }
}

export async function deleteTransfer(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("transfers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting transfer:", error);
    return false;
  }
}

// ════════════════════════════════════════════════════════════
// LOANS
// ════════════════════════════════════════════════════════════

export async function fetchLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .order("date_issued", { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      borrowerName: row.borrower_name,
      borrowerIdPassport: row.borrower_id_passport,
      borrowerPhone: row.borrower_phone,
      borrowerLocation: row.borrower_location,
      loanAmount: row.loan_amount,
      currency: row.currency,
      interestRate: row.interest_rate,
      interestAmount: row.interest_amount,
      totalRepayable: row.total_repayable,
      dateIssued: row.date_issued,
      status: row.status,
      enteredBy: row.entered_by,
    }));
  } catch (error) {
    console.error("Error fetching loans:", error);
    return [];
  }
}

export async function createLoan(loan: Loan): Promise<Loan | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("loans")
      .insert([
        {
          user_id: userId,
          borrower_name: loan.borrowerName,
          borrower_id_passport: loan.borrowerIdPassport,
          borrower_phone: loan.borrowerPhone,
          borrower_location: loan.borrowerLocation,
          loan_amount: loan.loanAmount,
          currency: loan.currency,
          interest_rate: loan.interestRate,
          interest_amount: loan.interestAmount,
          total_repayable: loan.totalRepayable,
          date_issued: loan.dateIssued,
          status: loan.status,
          entered_by: loan.enteredBy,
        },
      ])
      .select();

    if (error) throw error;

    const row = data?.[0];
    if (!row) return null;

    return {
      id: row.id,
      borrowerName: row.borrower_name,
      borrowerIdPassport: row.borrower_id_passport,
      borrowerPhone: row.borrower_phone,
      borrowerLocation: row.borrower_location,
      loanAmount: row.loan_amount,
      currency: row.currency,
      interestRate: row.interest_rate,
      interestAmount: row.interest_amount,
      totalRepayable: row.total_repayable,
      dateIssued: row.date_issued,
      status: row.status,
      enteredBy: row.entered_by,
    };
  } catch (error) {
    console.error("Error creating loan:", error);
    return null;
  }
}

export async function updateLoan(id: string, loan: Partial<Loan>): Promise<Loan | null> {
  try {
    const updateData: Record<string, any> = {};
    if (loan.borrowerName) updateData.borrower_name = loan.borrowerName;
    if (loan.borrowerIdPassport) updateData.borrower_id_passport = loan.borrowerIdPassport;
    if (loan.borrowerPhone) updateData.borrower_phone = loan.borrowerPhone;
    if (loan.borrowerLocation) updateData.borrower_location = loan.borrowerLocation;
    if (loan.loanAmount !== undefined) updateData.loan_amount = loan.loanAmount;
    if (loan.currency) updateData.currency = loan.currency;
    if (loan.interestRate !== undefined) updateData.interest_rate = loan.interestRate;
    if (loan.interestAmount !== undefined) updateData.interest_amount = loan.interestAmount;
    if (loan.totalRepayable !== undefined) updateData.total_repayable = loan.totalRepayable;
    if (loan.status) updateData.status = loan.status;

    const { data, error } = await supabase
      .from("loans")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;

    const row = data?.[0];
    if (!row) return null;

    return {
      id: row.id,
      borrowerName: row.borrower_name,
      borrowerIdPassport: row.borrower_id_passport,
      borrowerPhone: row.borrower_phone,
      borrowerLocation: row.borrower_location,
      loanAmount: row.loan_amount,
      currency: row.currency,
      interestRate: row.interest_rate,
      interestAmount: row.interest_amount,
      totalRepayable: row.total_repayable,
      dateIssued: row.date_issued,
      status: row.status,
      enteredBy: row.entered_by,
    };
  } catch (error) {
    console.error("Error updating loan:", error);
    return null;
  }
}

export async function deleteLoan(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("loans")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting loan:", error);
    return false;
  }
}
