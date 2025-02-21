"use client";

import { useState } from "react";
import Papa from "papaparse";

export default function UIAutomation() {
  const [url, setUrl] = useState("");
  const [steps, setSteps] = useState<{ action: string; xpath: string; value?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [headless, setHeadless] = useState(true); // Default: Headless Mode ON
  const [screenshotResults, setScreenshotResults] = useState<string[]>([]);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  // Menambah Step Baru
  const addStep = () => {
    setSteps([...steps, { action: "click", xpath: "", value: "" }]);
  };

  // Mengupdate Step
  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps];
    (newSteps[index] as any)[field] = value;
    setSteps(newSteps);
  };

  // Menghapus Step
  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Upload CSV & Parse
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedSteps = result.data.map((row: any) => ({
          action: row.action.trim(),
          xpath: row.xpath.trim(),
          value: row.value ? row.value.trim() : undefined,
        }));
        setSteps(parsedSteps);
      },
    });
  };

  // Submit Automation
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/run-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, steps, headless }),
      });

      const result = await response.json();
      setScreenshotResults(result.stepResults.map((step: any) => step.screenshotUrl));
      setReportUrl(result.reportUrl);
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menjalankan automation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">UI Automation Input Form</h1>

      {/* Input URL */}
      <label className="block font-semibold">Website URL:</label>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-2 w-full mb-4"
        placeholder="Masukkan URL"
        required
      />

      {/* Upload CSV */}
      <label className="block font-semibold">Upload CSV Steps:</label>
      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />

      {/* Toggle Headless Mode */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          checked={headless}
          onChange={() => setHeadless(!headless)}
          className="mr-2"
        />
        <label className="font-semibold">Headless Mode ({headless ? "ON" : "OFF"})</label>
      </div>

      {/* Tombol Tambah Step */}
      <button onClick={addStep} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        Tambah Step
      </button>

      {/* List Steps */}
      {steps.map((step, index) => (
        <div key={index} className="border p-3 mb-3 rounded relative">
          <button
            onClick={() => removeStep(index)}
            className="absolute top-1 right-1 text-red-500 text-lg font-bold"
          >
            ❌
          </button>

          <label>Aksi:</label>
          <select
            value={step.action}
            onChange={(e) => updateStep(index, "action", e.target.value)}
            className="border p-2 w-full mb-2"
          >
            <option value="click">Klik</option>
            <option value="fill">Isi Form</option>
            <option value="wait">Tunggu Elemen</option>
            <option value="validate">Validasi Teks</option>
            <option value="assert-url">Validasi Url</option>
            <option value="select">select data</option>
            <option value="scroll">scroll</option>
          </select>

          <label>XPath:</label>
          <input
            type="text"
            value={step.xpath}
            onChange={(e) => updateStep(index, "xpath", e.target.value)}
            className="border p-2 w-full mb-2"
            placeholder="//button[@id='submit']"
          />

          <label>Value (Opsional):</label>
          <input
            type="text"
            value={step.value}
            onChange={(e) => updateStep(index, "value", e.target.value)}
            className="border p-2 w-full"
            placeholder="Isi jika perlu"
          />
        </div>
      ))}

      {/* Submit Automation */}
      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded w-full"
        disabled={loading}
      >
        {loading ? "Running..." : "Submit Automation"}
      </button>

      {/* Lihat Hasil */}
      {reportUrl && (
        <a href={reportUrl} target="_blank" className="block mt-4 text-blue-500">
          🔍 Lihat Hasil Automation
        </a>
      )}

      {/* Tampilkan Screenshot */}
      {screenshotResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Screenshot Hasil:</h2>
          <div className="grid grid-cols-2 gap-4">
            {screenshotResults.map((src, i) => (
              <img key={i} src={src} alt={`Step ${i + 1}`} className="border p-2" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
