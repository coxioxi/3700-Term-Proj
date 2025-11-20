import React, { useRef } from "react";
import { useState } from "react";

export default function ImportSchedule() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("No file chosen");

  function handleFileSelect() {
    // Programmatically click the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  setFileName(file.name); // show name in UI if you want

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:5000/upload-xlsx", {
      method: "POST",
      body: formData, // IMPORTANT — no headers, browser sets boundary
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error(err);
    alert("Upload failed!");
  }
}


  return (
    <div>
      <h2>Import Schedule</h2>
      <p>File Chosen: {fileName}</p>
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
