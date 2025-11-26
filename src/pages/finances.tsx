import React, { useEffect, useState } from "react";
import '../styles/financeStyle.css';

type TeamFinance = {
  teamID: number;
  teamName: string;
  revenue: number;
  payroll: number;
  expenses: number;
  profit: number;
};

type FinanceData = {
  teams: TeamFinance[];
  company: {
    totalRevenue: number;
    totalPayroll: number;
    totalExpenses: number;
    totalProfit: number;
  };
};

export default function Finances() {
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [selectedView, setSelectedView] = useState<string>("company"); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinances() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Token not found in localStorage");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/finance-report", {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch finances: ${res.statusText}`);
        }

        const data = await res.json();
        setFinanceData(data);
      } catch (error) {
        console.error("Failed fetching finances:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFinances();
  }, []);

  if (loading) return <p>Loading finances...</p>;
  if (!financeData) return <p>No financial data found.</p>;

  const { teams, company } = financeData;

  /** Decide what data to show based on dropdown */
  let displayedTeams: TeamFinance[] = [];
  let showCompanyTotals = false;

  if (selectedView === "company") {
    showCompanyTotals = true;
  } else if (selectedView === "all") {
    displayedTeams = teams;
    showCompanyTotals = true;
  } else {
    // Specific team selected
    const team = teams.find((t) => String(t.teamID) === selectedView);
    if (team) displayedTeams = [team];
  }

  return (
  <div className="finance-container">
    <h2>Finances</h2>

    {/* Dropdown */}
    <label>
      Select View:{" "}
      <select value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
        <option value="all">All</option>
        {teams.map((t) => (
          <option key={t.teamID} value={String(t.teamID)}>
            {t.teamName}
          </option>
        ))}
        <option value="company">Company</option>
      </select>
    </label>

    {/* Finance Table */}
    <table className="finance-table">
      <thead>
        <tr>
          <th>Team</th>
          <th>Revenue ($)</th>
          <th>Payroll ($)</th>
          <th>Expenses ($)</th>
          <th>Profit ($)</th>
        </tr>
      </thead>
      <tbody>
        {displayedTeams.map((team) => (
          <tr key={team.teamID}>
            <td>{team.teamName}</td>
            <td>{team.revenue.toFixed(2)}</td>
            <td>{team.payroll.toFixed(2)}</td>
            <td>{team.expenses.toFixed(2)}</td>
            <td>{team.profit.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
      {showCompanyTotals && (
        <tfoot>
          <tr>
            <td>Company Totals</td>
            <td>{company.totalRevenue.toFixed(2)}</td>
            <td>{company.totalPayroll.toFixed(2)}</td>
            <td>{company.totalExpenses.toFixed(2)}</td>
            <td>{company.totalProfit.toFixed(2)}</td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

}
