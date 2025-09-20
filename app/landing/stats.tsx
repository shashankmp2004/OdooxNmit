import React from "react";

const BoxWithLines = () => {
  const stats = [
    { value: "85%", label: "faster order processing", company: "SIEMENS" },
    { value: "40%", label: "reduction in downtime", company: "BOEING" },
    { value: "200%", label: "increase in efficiency", company: "TOYOTA" },
    { value: "3x", label: "faster to deploy", company: "FORD" },
  ];

  return (
    <div style={{ width: "100%", padding: "2rem 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          textAlign: "center",
        }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              padding: "2rem",
              borderLeft: idx !== 0 ? "4px solid #333" : "none", // increased thickness
            }}
          >
            <div style={{ fontSize: "1.875rem", fontWeight: "bold" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.875rem" }}>{stat.label}</div>
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
              }}
            >
              {stat.company}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoxWithLines;
