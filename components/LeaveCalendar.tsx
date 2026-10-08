"use client";
import { useLeaves, LeaveRequest } from "@/context/LeaveContext";
import { useState, useMemo } from "react";

export default function LeaveCalendar() {
  const { leaves } = useLeaves();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to get all days in the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Fill empty slots for previous month days
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    // Fill actual days
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    
    return days;
  }, [currentDate]);

  // Find who is on leave for a specific date
  const getLeavesForDate = (date: Date) => {
    return leaves.filter((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const check = new Date(date);
      // Normalize dates to ignore time
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      check.setHours(0,0,0,0);
      return check >= start && check <= end && l.status === "Approved";
    });
  };

  return (
    <div className="card" style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2>Leave Calendar</h2>
        <div>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="btn-danger" style={{padding: '2px 10px', marginRight: '5px'}}>-</button>
          <strong>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="btn-success" style={{padding: '2px 10px', marginLeft: '5px'}}>+</button>
        </div>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="calendar-header">{d}</div>)}
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="calendar-day empty"></div>;
          
          const leavesToday = getLeavesForDate(date);
          const hasLeaves = leavesToday.length > 0;

          return (
            <div key={i} className={`calendar-day ${hasLeaves ? "has-leave" : ""}`}>
              {date.getDate()}
              {hasLeaves && (
                <div className="calendar-tooltip">
                  <strong>On Leave:</strong>
                  {leavesToday.map(l => <div key={l.id}>• {l.employee} ({l.type})</div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}