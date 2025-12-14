import React, { useEffect, useState } from "react";
import "../styles/scheduleStyle.css";

interface Team {
  teamID: number;
  name: string;
}

interface Client {
  clientName: string;
  phoneNumber: string;
  dayOfCleaning: string;
  timeOfCleaning: string;
  typeClean: string;
  paymentMethod: string;
  houseSize: string;
  cleaningValue: number;
  address: string;
  specialRequest: string;
}

interface ViewScheduleProps {
  selectedFile?: string | null;
}

export default function ViewSchedule({ selectedFile }: ViewScheduleProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const [hours, setHours] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [activeDay, setActiveDay] = useState("Monday");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function openClientModal(client: Client) {
    setSelectedClient(client);
    setShowModal(true);
  }

  function closeModal() {
    setSelectedClient(null);
    setShowModal(false);
  }

  async function fetchTeams() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/getTeams", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch teams");
      const data = await res.json();
      setTeams(data.teams);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  }

  function getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    return days[date.getDay()];
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  async function handleTeamChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const teamName = e.target.value;
    setSelectedTeam(teamName);
    if (!teamName) {
      setClients([]);
      setHours([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const team = teams.find((t) => t.name === teamName);
      if (!team) return;

      const res = await fetch("http://localhost:5000/getClients", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teamID: team.teamID }),
      });
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = await res.json();

      const mappedClients: Client[] = data.clients.map((c: any) => ({
        clientName: c.name,
        phoneNumber: c.phoneNumber,
        dayOfCleaning: c.dayOfCleaning,
        timeOfCleaning: c.timeOfCleaning,
        typeClean: c.typeClean,
        paymentMethod: c.paymentMethod,
        houseSize: c.houseSize,
        cleaningValue: c.cleaningValue,
        address: c.address,
        specialRequest: c.specialRequest,
      }));

      setClients(mappedClients);
      const uniqueTimes = Array.from(new Set(mappedClients.map((c) => c.timeOfCleaning))).sort();
      setHours(uniqueTimes);
    } catch (err) {
      console.error("Error fetching clients or schedule:", err);
    }
  }

  // Group clients by day
  const clientsByDay: Record<string, Client[]> = {};
  clients.forEach((c) => {
    const day = getDayOfWeek(c.dayOfCleaning);
    if (!clientsByDay[day]) clientsByDay[day] = [];
    clientsByDay[day].push(c);
  });

  return (
    <div className="schedule-page">
      {/* Schedule View */}
      <div className="schedule-view">
        <div className="team-selector">
          <label htmlFor="teamDropdown">Select Team:</label>
          <select id="teamDropdown" value={selectedTeam} onChange={handleTeamChange}>
            <option value="">-- Select Team --</option>
            {teams.map((team) => (
              <option key={team.teamID} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
          {selectedFile && <span style={{ marginLeft: "10px", fontStyle: "italic" }}>Selected File: {selectedFile}</span>}
        </div>

        <div className="weekly-schedule-container">
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
                  {days.map((day) => {
                    const clientsInSlot = clients.filter(c => getDayOfWeek(c.dayOfCleaning) === day && c.timeOfCleaning === hour);
                    return (
                      <td key={day} className="calendar-cell">
                        {clientsInSlot.map(c => (
                          <button
                            key={c.clientName + c.timeOfCleaning}
                            className="client-card"
                            onClick={() => openClientModal(c)}
                          >
                            {c.clientName}
                          </button>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Checklist with Tabs */}
      <div className="client-checklist">
        {/* Tabs */}
        <div className="tab-bar">
          {days.map(day => (
            <div
              key={day}
              className={`tab-button ${activeDay === day ? "active" : ""}`}
              onClick={() => setActiveDay(day)}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          <ul>
            {(clientsByDay[activeDay] || []).map(client => (
              <li key={client.clientName + client.timeOfCleaning}>
                <div className="client-info">
                  <span className="client-name">{client.clientName}</span>
                  <span className="client-phone">{client.phoneNumber}</span>
                </div>
              </li>
            ))}
          </ul>

          <button className="send-sms">Send SMS</button>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedClient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            <h2>{selectedClient.clientName}</h2>
            <p><strong>Phone:</strong> {selectedClient.phoneNumber}</p>
            <p><strong>Address:</strong> {selectedClient.address}</p>
            <p><strong>Cleaning Day:</strong> {getDayOfWeek(selectedClient.dayOfCleaning)}</p>
            <p><strong>Time:</strong> {selectedClient.timeOfCleaning}</p>
            <p><strong>Type of Cleaning:</strong> {selectedClient.typeClean === "0" ? "Standart Clean" : "Deep Clean"}</p>
            <p><strong>House Size:</strong> {selectedClient.houseSize} sq ft</p>
            <p><strong>Cleaning Value:</strong> ${selectedClient.cleaningValue}</p>
            <p><strong>Payment:</strong> {selectedClient.paymentMethod}</p>
            <p><strong>Special Request:</strong> {selectedClient.specialRequest}</p>
          </div>
        </div>
      )}
    </div>
  );
}
