import React, { useRef } from "react";

export default function ImportSchedule() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect() {
    // Programmatically click the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log("Selected file:", file.name);

    // You can add code here to parse the XLSX file later
  }

  return (
    <div>
      <h2>Import Schedule</h2>
      <p>This will eventually open a file explorer.</p>
      <button onClick={handleFileSelect}>Choose File</button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".xlsx"
        onChange={handleFileChange}
      />
    </div>
  );
}
