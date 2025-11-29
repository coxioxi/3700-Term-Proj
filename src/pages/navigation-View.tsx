import React, { useEffect, useState, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import "../styles/navigation-View.css";

interface Team {
  teamID: number;
  name: string;
}

interface Client {
  clientName: string;
  address: string;
  timeOfCleaning: string;
}

export default function Navigation() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("Sunday");
  const [clients, setClients] = useState<Client[]>([]);
  const [totalTime, setTotalTime] = useState<string>("");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Load Google Maps using API
  async function loadGoogleMaps() {
  setOptions({
    key: import.meta.env.VITE_MAPS_API_KEY
  });

  const { Map } = await importLibrary("maps");
  const { DirectionsService, DirectionsRenderer } = await importLibrary("routes");

  return { Map, DirectionsService, DirectionsRenderer };
}

  // Fetch Teams
  async function fetchTeams() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/getTeams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setTeams(data.teams);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  }

  // load Google Maps and Teams
  useEffect(() => {
    async function init() {
      await loadGoogleMaps();

      const { Map, DirectionsService, DirectionsRenderer } = await loadGoogleMaps();

      if (mapRef.current) {
        map.current = new Map(mapRef.current, {
          zoom: 10,
          center: { lat: 40.0, lng: -82.9 },
        });

        directionsService.current = new DirectionsService();
        directionsRenderer.current = new DirectionsRenderer({ map: map.current });
      }

      fetchTeams();
    }

    init();
  }, []);

  // Fetch Clients when team/day change
  useEffect(() => {
    async function fetchClients() {
      if (!selectedTeam || !selectedDay) {
        setClients([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const team = teams.find((t) => t.name === selectedTeam);
        if (!team) return;

        const res = await fetch(
          `http://localhost:5000/getClientsByTeamAndDay?teamID=${team.teamID}&day=${selectedDay}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        const mappedClients: Client[] = data.clients.map((c: any) => ({
          clientName: c.name,
          address: c.address,
          timeOfCleaning: c.timeOfCleaning,
        }));

        setClients(mappedClients);
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    }

    fetchClients();
  }, [selectedTeam, selectedDay, teams]);

  // Update Route on Client List Change
  useEffect(() => {
    if (!map.current || !directionsService.current || !directionsRenderer.current) return;

    if (clients.length < 2) {
      directionsRenderer.current.setDirections(null as unknown as google.maps.DirectionsResult);
      setTotalTime("");
      return;
    }

    const sorted = [...clients].sort(
      (a, b) => Number(a.timeOfCleaning.replace(":", "")) - Number(b.timeOfCleaning.replace(":", ""))
    );

    const origin = sorted[0].address;
    const destination = sorted[sorted.length - 1].address;

    const waypoints =
      sorted.length > 2
        ? sorted.slice(1, -1).map((c) => ({ location: c.address, stopover: true }))
        : [];

    directionsService.current.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        waypoints,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.current!.setDirections(result);

          let total = 0;
          result.routes[0].legs.forEach((leg) => {
            total += leg.duration?.value || 0;
          });

          const minutes = Math.round(total / 60);
          setTotalTime(`${minutes} minutes`);
        }
      }
    );
  }, [clients]);

  return (
    <div className="navigation-view">
      {/* Team Selector */}
      <div className="selector">
        <label>
          Team:{" "}
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="">-- Select Team --</option>
            {teams.map((team) => (
              <option key={team.teamID} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        {/* Day Selector */}
        <label style={{ marginLeft: "1rem" }}>
          Day:{" "}
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Clients List */}
      <div className="clients-list" style={{ marginTop: "1rem" }}>
        <h3>
          Clients for {selectedTeam} on {selectedDay}
        </h3>

        {clients.length === 0 ? (
          <p>No clients scheduled.</p>
        ) : (
          <ul>
            {clients.map((client) => (
              <li key={client.clientName + client.timeOfCleaning}>
                {client.timeOfCleaning} - {client.clientName} ({client.address})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Total Time */}
      {totalTime && (
        <p style={{ marginBottom: "0.5 rem", fontWeight: "bold" }}>
          Total Estimated Travel Time: {totalTime}
        </p>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className="map-container"
        style={{
          marginTop: "1rem",
          height: "400px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
