import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// SVG Icon for calculator
const CalculatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <line x1="8" y1="6" x2="16" y2="6"></line>
    <line x1="16" y1="14" x2="8" y2="14"></line>
    <line x1="16" y1="18" x2="8" y2="18"></line>
    <line x1="10" y1="10" x2="14" y2="10"></line>
  </svg>
);

export default function App() {
  const [loanAmount, setLoanAmount] = useState(250000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [balloonPayment, setBalloonPayment] = useState(0);
  const [monthlyRepayment, setMonthlyRepayment] = useState(0);
  const [overrideRepayment, setOverrideRepayment] = useState(false);

  const { schedule, totalInterest, totalPayment, calculatedMthRepayment } = useMemo(() => {
    const principal = parseFloat(loanAmount);
    const rate = parseFloat(interestRate) / 100 / 12;
    const termInMonths = parseInt(loanTerm) * 12;
    const balloon = parseFloat(balloonPayment);

    if (isNaN(principal) || isNaN(rate) || isNaN(termInMonths) || principal <= 0 || rate <= 0 || termInMonths <= 0) {
      return { schedule: [], totalInterest: 0, totalPayment: 0, calculatedMthRepayment: 0 };
    }

    // Standard formula for monthly payment (PMT)
    let pmt = principal * (rate * Math.pow(1 + rate, termInMonths)) / (Math.pow(1 + rate, termInMonths) - 1);

    // Adjust PMT for balloon payment
    if (balloon > 0) {
      const balloonFactor = balloon / Math.pow(1 + rate, termInMonths);
      pmt = (principal - balloonFactor) * (rate / (1 - Math.pow(1 + rate, -termInMonths)));
    }

    const finalMonthlyRepayment = overrideRepayment && monthlyRepayment > 0 ? monthlyRepayment : pmt;

    let remainingBalance = principal;
    const newSchedule = [];
    let cumulativeInterest = 0;

    // Generate amortization schedule
    for (let i = 1; i <= termInMonths && remainingBalance > 0; i++) {
      const interestForMonth = remainingBalance * rate;

      let principalForMonth = finalMonthlyRepayment - interestForMonth;

      // Ensure the last payment doesn't overpay
      if (remainingBalance - principalForMonth < 0) {
        principalForMonth = remainingBalance;
      }

      remainingBalance -= principalForMonth;

      // Handle balloon payment at the end
      if (i === termInMonths && remainingBalance > balloon) {
        // This case is complex and might indicate the override payment is too low.
        // For simplicity, we assume the override is reasonable.
      } else if (i === termInMonths && balloon > 0) {
        remainingBalance -= balloon;
      }


      cumulativeInterest += interestForMonth;

      newSchedule.push({
        month: i,
        interest: interestForMonth.toFixed(2),
        principal: principalForMonth.toFixed(2),
        payment: (principalForMonth + interestForMonth).toFixed(2),
        remainingBalance: remainingBalance.toFixed(2),
      });

      if (remainingBalance <= 0) break; // Loan paid off early
    }

    const finalTotalPayment = principal + cumulativeInterest;

    return {
      schedule: newSchedule,
      totalInterest: cumulativeInterest,
      totalPayment: finalTotalPayment,
      calculatedMthRepayment: pmt,
    };
  }, [loanAmount, interestRate, loanTerm, balloonPayment, monthlyRepayment, overrideRepayment]);

  // Set initial monthly repayment when component mounts or calculation changes
  React.useEffect(() => {
    if (!overrideRepayment) {
      setMonthlyRepayment(calculatedMthRepayment);
    }
  }, [calculatedMthRepayment, overrideRepayment]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (schedule.length === 0) return [];
    // Group schedule by year for chart visualization
    const yearlyData = [];
    for (let i = 0; i < loanTerm; i++) {
      const year = i + 1;
      const yearStartMonth = i * 12;
      const yearEndMonth = yearStartMonth + 12;
      const yearSchedule = schedule.slice(yearStartMonth, yearEndMonth);

      if (yearSchedule.length === 0) break;

      const totalPrincipal = yearSchedule.reduce((acc, curr) => acc + parseFloat(curr.principal), 0);
      const totalInterest = yearSchedule.reduce((acc, curr) => acc + parseFloat(curr.interest), 0);

      yearlyData.push({
        name: `Year ${year}`,
        Principal: totalPrincipal,
        Interest: totalInterest,
      });
    }
    return yearlyData;
  }, [schedule, loanTerm]);


  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans antialiased text-gray-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 flex items-center justify-center">
            <CalculatorIcon />
            Loan Repayment Calculator
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Plan your finances with our flexible loan calculator.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form Section */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-4">Loan Details</h2>

            {/* Loan Amount */}
            <div className="mb-4">
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  id="loanAmount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div className="mb-4">
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">Interest Rate</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                <input
                  type="number"
                  id="interestRate"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full pr-8 pl-4 py-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
              </div>
            </div>

            {/* Loan Term */}
            <div className="mb-4">
              <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Years)</label>
              <input
                type="number"
                id="loanTerm"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              />
            </div>

            {/* Balloon Payment */}
            <div className="mb-6">
              <label htmlFor="balloonPayment" className="block text-sm font-medium text-gray-700 mb-1">Balloon Payment (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  id="balloonPayment"
                  value={balloonPayment}
                  onChange={(e) => setBalloonPayment(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                />
              </div>
            </div>

            {/* Monthly Repayment Override */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <label htmlFor="monthlyRepayment" className="block text-sm font-bold text-blue-800">Monthly Repayment</label>
                <div className="flex items-center">
                  <span className="text-xs font-medium mr-2 text-gray-600">Override</span>
                  <input type="checkbox" checked={overrideRepayment} onChange={() => setOverrideRepayment(!overrideRepayment)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                </div>
              </div>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                <input
                  type="number"
                  id="monthlyRepayment"
                  value={monthlyRepayment > 0 ? monthlyRepayment.toFixed(2) : '0.00'}
                  onChange={(e) => setMonthlyRepayment(parseFloat(e.target.value))}
                  disabled={!overrideRepayment}
                  className={`w-full pl-7 pr-4 py-2 rounded-lg border-gray-300 transition duration-150 ease-in-out ${!overrideRepayment ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>
              {!overrideRepayment && (
                <p className="text-xs text-gray-500 mt-2">Calculated repayment. Check 'Override' to enter a custom amount.</p>
              )}
            </div>
          </div>

          {/* Results and Chart Section */}
          <div className="lg:col-span-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-2xl shadow-lg text-center border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Monthly Repayment</h3>
                <p className="text-3xl font-bold text-blue-600 mt-1">{formatCurrency(monthlyRepayment)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg text-center border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Total Interest</h3>
                <p className="text-3xl font-bold text-red-500 mt-1">{formatCurrency(totalInterest)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg text-center border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Total Payment</h3>
                <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalPayment)}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4">Yearly Breakdown</h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Principal" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Interest" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Amortization Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-semibold p-6">Amortization Schedule</h2>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3">Month</th>
                      <th scope="col" className="px-6 py-3">Payment</th>
                      <th scope="col" className="px-6 py-3">Principal</th>
                      <th scope="col" className="px-6 py-3">Interest</th>
                      <th scope="col" className="px-6 py-3">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.month} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{row.month}</td>
                        <td className="px-6 py-4">{formatCurrency(row.payment)}</td>
                        <td className="px-6 py-4 text-green-600">{formatCurrency(row.principal)}</td>
                        <td className="px-6 py-4 text-red-600">{formatCurrency(row.interest)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(row.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {schedule.length === 0 && <p className="p-6 text-center text-gray-500">Enter valid loan details to see the schedule.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
