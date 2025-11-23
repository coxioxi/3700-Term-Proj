import React, { useEffect, useState } from "react";
import '../styles/scheduleStyle.css';

interface Team {
  teamID: number;
  name: string;
}

interface Client {
  clientName: string;
  phoneNumber: string;
  dayOfCleaning: string;  // e.g., "Monday"
  timeOfCleaning: string; // e.g., "08:00"
}

export default function ViewSchedule() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const [schedule, setSchedule] = useState<Record<string, Record<string, string>>>({});

  // Fetch teams from the backend
  async function fetchTeams() {
    try {
      const token = localStorage.getItem("token"); // JWT

      const res = await fetch("http://localhost:5000/getTeams", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch teams");

      const data = await res.json();
      setTeams(data.teams); // update state for dropdown
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  async function handleTeamChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const teamName = e.target.value;
    setSelectedTeam(teamName);

    if (!teamName) {
      setClients([]);
      setSchedule({});
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Find teamID from name
      const team = teams.find((t) => t.name === teamName);
      if (!team) return;

      // Fetch clients for selected team
      const res = await fetch("http://localhost:5000/getClients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ teamID: team.teamID }),
      });

      if (!res.ok) throw new Error("Failed to fetch clients");

      const data = await res.json();

      // Map backend data to frontend interface
      const mappedClients: Client[] = data.clients.map((c: any) => ({
        clientName: c.clientName || c.name,
        phoneNumber: c.phoneNumber || c.phone,
        dayOfCleaning: c.dayOfCleaning,
        timeOfCleaning: c.timeOfCleaning,
      }));

      setClients(mappedClients);

      // Map schedule by time and day
      const newSchedule: Record<string, Record<string, string>> = {};
      mappedClients.forEach((client) => {
        const day = client.dayOfCleaning;
        const time = client.timeOfCleaning;

        if (!newSchedule[time]) newSchedule[time] = {};
        // Handle multiple clients at same time by joining names
        if (newSchedule[time][day]) {
          newSchedule[time][day] += `, ${client.clientName}`;
        } else {
          newSchedule[time][day] = client.clientName;
        }
      });

      setSchedule(newSchedule);
    } catch (err) {
      console.error("Error fetching clients or schedule:", err);
    }
  }

  // Generate table rows based on schedule
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="schedule-page" style={{ display: "flex" }}>
      {/* Left Section: Schedule View */}
      <div className="schedule-view" style={{ flex: 3 }}>
        <div className="team-selector">
          <label htmlFor="teamDropdown">Select Team:</label>
          <select id="teamDropdown" value={selectedTeam} onChange={handleTeamChange}>
            <option value="">-- Select Team --</option>
            {teams.map((team) => (
              <option key={team.teamID} value={team.name}>{team.name}</option>
            ))}
          </select>
        </div>

        <table className="weekly-schedule">
          <thead>
            <tr>
              <th>Time</th>
              {days.map((day) => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td>{hour}</td>
                {days.map((day) => (
                  <td key={day}>{schedule[hour]?.[day] || ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right Section: Client Checklist */}
      <div className="client-checklist" style={{ flex: 1, marginLeft: "1rem" }}>
        <h3>Clients</h3>
        <ul>
          {clients.map((client) => (
            <li key={client.clientName + client.timeOfCleaning}>
              <div className="client-info">
                <span className="client-name">{client.clientName}</span>
                <span className="client-phone">{client.phoneNumber}</span>
              </div>
            </li>
          ))}
        </ul>
        <button type="button">Send SMS</button>
      </div>
    </div>
  );
}
