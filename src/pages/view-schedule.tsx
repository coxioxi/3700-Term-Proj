import React from "react";
import '../styles/scheduleStyle.css';

export default function ViewSchedule() {
  return (
    <div className="schedule-page" style={{ display: "flex" }}>
      {/* Left Section: Schedule View (3/4 width) */}
      <div className="schedule-view" style={{ flex: 3 }}>
        {/* Team Dropdown */}
        <div className="team-selector">
          <label htmlFor="teamDropdown">Select Team:</label>
          <select id="teamDropdown">
            <option value="">-- Select Team --</option>
            {/* Options to be populated dynamically */}
          </select>
        </div>

        {/* Weekly Schedule Table */}
        <table className="weekly-schedule">
          <thead>
            <tr>
              <th>Time</th>
              <th>Sunday</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
              <th>Saturday</th>
            </tr>
          </thead>
          <tbody>
            {/* Rows for times of day */}
            <tr>
              <td>08:00</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>09:00</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            {/* Add more rows as needed */}
          </tbody>
        </table>
      </div>

      {/* Right Section: Client Checklist (1/4 width) */}
      <div className="client-checklist" style={{ flex: 1, marginLeft: "1rem" }}>
        <h3>Clients</h3>
        <ul>
          {/* Each client item */}
          <li>
            <div className="client-info">
              <span className="client-name">Client Name</span>
              <span className="client-phone">123-456-7890</span>
            </div>
          </li>
          {/* More clients dynamically */}
        </ul>

        {/* Send SMS Button */}
        <button type="button">Send SMS</button>
      </div>
    </div>
  );
}
