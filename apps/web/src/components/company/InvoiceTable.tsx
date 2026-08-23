'use client';

import React from 'react';

const MOCK_INVOICES = [
  { id: 'inv-101', date: '2026-08-01', amount: '$49.00', status: 'Paid', plan: 'Growth Plan' },
  { id: 'inv-100', date: '2026-07-01', amount: '$49.00', status: 'Paid', plan: 'Growth Plan' },
];

export function InvoiceTable() {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-base-200">
        <h3 className="font-bold text-sm text-base-content">
          Billing Invoice History
        </h3>
      </div>

      <table className="table w-full text-left text-xs">
        <thead>
          <tr className="bg-base-200/50 text-base-content/60 uppercase">
            <th>Invoice Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-200">
          {MOCK_INVOICES.map((inv) => (
            <tr key={inv.id} className="hover:bg-base-200/40">
              <td className="font-mono text-base-content/60">{inv.date}</td>
              <td className="font-semibold text-base-content">{inv.plan}</td>
              <td className="font-mono font-bold text-base-content">{inv.amount}</td>
              <td>
                <span className="badge badge-xs badge-success uppercase">
                  {inv.status}
                </span>
              </td>
              <td>
                <button className="btn btn-xs btn-ghost text-primary font-semibold">
                  PDF Receipt ↘
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
