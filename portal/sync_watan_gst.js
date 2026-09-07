const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function syncGstDataForWatan() {
  const ids = [
    'f3d1e570-7d16-4c11-968c-144bf61b19d1',
    '848b0e4b-1721-4c74-a3c1-747bbe149d04'
  ];

  const gstLedger = {
    gstin: '07AAECI4589K1ZK',
    trade_name: 'WATAN SAMACHAR MEDIA',
    legal_name: 'WATAN SAMACHAR PVT LTD',
    taxpayer_type: 'Regular',
    status: 'Active',
    cash_ledger: {
      igst: { tax: 15400, interest: 0, penalty: 0, fee: 0, others: 0, total: 15400 },
      cgst: { tax: 22850, interest: 0, penalty: 0, fee: 0, others: 0, total: 22850 },
      sgst: { tax: 22850, interest: 0, penalty: 0, fee: 0, others: 0, total: 22850 },
      cess: { tax: 0, interest: 0, penalty: 0, fee: 0, others: 0, total: 0 },
      total_cash: 61100
    },
    credit_ledger: {
      igst: 48500,
      cgst: 72100,
      sgst: 72100,
      cess: 0,
      total_credit: 192700
    },
    liability_ledger: {
      igst: 0,
      cgst: 0,
      sgst: 0,
      cess: 0,
      total_liability: 0
    },
    updated_at: new Date().toISOString(),
    updated_by_name: 'Innovise CA Compliance Desk'
  };

  for (const id of ids) {
    const { data: p } = await supabase.from('profiles').select('bank_details').eq('id', id).single();
    const updatedBank = { ...(p?.bank_details || {}), gst_ledger: gstLedger };
    await supabase.from('profiles').update({ bank_details: updatedBank }).eq('id', id);
    console.log(`Updated GST ledger for client ${id}`);
  }
  console.log("All synced!");
}

syncGstDataForWatan().catch(console.error);
