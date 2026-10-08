"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LeaveRequest } from "@/context/LeaveContext";

export default function DownloadReport({ data, title }: { data: LeaveRequest[], title: string }) {
  const download = () => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Employee", "Type", "Start", "End", "Status"]],
      body: data.map(l => [l.employee, l.type, l.startDate, l.endDate, l.status]),
    });
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  return <button onClick={download} className="btn">Download Report</button>;
}