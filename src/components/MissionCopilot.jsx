import { Bot, Send } from "lucide-react";
import { useState } from "react";

import { usePolaris } from "../context/PolarisContext";
import { stationProfiles } from "../data/stationProfiles";

/*
  Copilot design rule (spec 16): the assistant never invents telemetry or
  engineering numbers. Every figure below is read from an authorised twin
  "tool" - the same state the dashboard renders - and the reply only
  explains that verified result.
*/

function answer(question, ctx) {
  const q = question.toLowerCase();
  const { kpis, allKpis, station, incidents, stationKey } = ctx;
  const profile = stationProfiles[stationKey];

  const tool = (name, text) => ({ tool: name, text });

  if (q.includes("compare") || q.includes(" vs")) {
    return tool(
      "stations.compare()",
      `Maitri is at ${allKpis.maitri.health}% health with ${allKpis.maitri.fuelDays} days of fuel ` +
        `and ${allKpis.maitri.autonomy}% autonomy. Bharati is at ${allKpis.bharati.health}% health ` +
        `with ${allKpis.bharati.fuelDays} days of fuel and ${allKpis.bharati.autonomy}% autonomy. ` +
        `Fleet risk: Maitri ${allKpis.maitri.riskLevel}, Bharati ${allKpis.bharati.riskLevel}.`
    );
  }

  if (
    q.includes("weather") ||
    q.includes("forecast") ||
    q.includes("temperature") ||
    q.includes("wind")
  ) {
    return tool(
      "environment.current()",
      `${profile.name} is at ${station.env.temp} C with ${station.env.wind} km/h wind, ` +
        `${station.env.humidity}% humidity and ${station.env.pressure} hPa. ` +
        (station.env.wind > 45
          ? "Wind is high enough to restrict outdoor maintenance."
          : "Conditions are inside the routine working envelope.") +
        ` Published annual mean here is ${profile.climate[0].value}.`
    );
  }

  if (
    q.includes("fuel") ||
    q.includes("logistic") ||
    q.includes("supply") ||
    q.includes("autonomy")
  ) {
    return tool(
      "logistics.autonomy()",
      `Fuel reserve supports ${kpis.fuelDays} days at the current ${kpis.fuelRate} L/h burn. ` +
        `Water ${kpis.waterDays} days, food ${kpis.foodDays} days. ` +
        `Station autonomy is ${kpis.autonomy}%, limited by ${kpis.limitingResource.toLowerCase()}. ` +
        `Power backup is estimated at ${kpis.powerBackupDays} days.`
    );
  }

  if (
    q.includes("alert") ||
    q.includes("incident") ||
    q.includes("problem") ||
    q.includes("risk")
  ) {
    if (!incidents.length) {
      return tool(
        "incidents.list()",
        `No active incidents at ${profile.name}. All monitored assets are inside their configured envelope.`
      );
    }

    const top = incidents[0];

    return tool(
      "incidents.list()",
      `${incidents.length} active incident(s). Highest priority: ${top.assetName} - ${top.cause}. ` +
        `Health ${top.health}/100, failure probability ${top.failureProbability}% in 24 h. ` +
        `Affected: ${top.affected.slice(0, 3).join(", ") || "isolated"}. ` +
        `Recommended: ${top.recommendation}`
    );
  }

  if (
    q.includes("energy") ||
    q.includes("power") ||
    q.includes("generator") ||
    q.includes("chp")
  ) {
    return tool(
      "energy.status()",
      `Generation is ${kpis.generation} kW across the active prime movers, burning ${kpis.fuelRate} L/h. ` +
        `${kpis.degraded} asset(s) are below the normal band. ` +
        `Station health ${kpis.health}%, risk level ${kpis.riskLevel}.`
    );
  }

  if (q.includes("summar") || q.includes("status") || q.includes("today")) {
    return tool(
      "station.summary()",
      `${profile.name}: health ${kpis.health}%, risk ${kpis.riskLevel}, ` +
        `${kpis.sensorsOnline}/${kpis.totalSensors} sensors reporting. ` +
        `Generation ${kpis.generation} kW, outside ${station.env.temp} C. ` +
        `Autonomy ${kpis.autonomy}% with ${kpis.fuelDays} days of fuel. ` +
        `${incidents.length} active incident(s).`
    );
  }

  return tool(
    "station.summary()",
    `I answer from the live twin. Try asking about station status, energy, ` +
      `fuel and autonomy, active incidents, weather, or a Maitri vs Bharati comparison. ` +
      `Right now ${profile.name} is at ${kpis.health}% health with ${incidents.length} active incident(s).`
  );
}

export default function MissionCopilot() {
  const ctx = usePolaris();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim()) return;

    setReply(answer(message, ctx));
    ctx.logAction("Copilot query", message.slice(0, 80));
    setMessage("");
  }

  const suggestions = [
    "Summarize today's status",
    "Check weather forecast",
    "Plan supply logistics",
    "Compare Maitri vs Bharati",
  ];

  return (
    <section className="copilot-card">
      <div className="copilot-intro">
        <div className="bot-icon">
          <Bot size={34} />
        </div>

        <div>
          <h2>AI MISSION COPILOT</h2>

          <p>
            Your assistant for station operations,
            <br />
            data analysis and mission planning
          </p>
        </div>
      </div>

      <div className="copilot-chat">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about station status, weather, logistics..."
            aria-label="Ask AI Mission Copilot"
          />

          <button type="submit" aria-label="Send message">
            <Send size={19} />
          </button>
        </form>

        <div className="suggestion-buttons">
          {suggestions.map((text) => (
            <button
              key={text}
              onClick={() => {
                setReply(answer(text, ctx));
                ctx.logAction("Copilot query", text);
              }}
            >
              {text}
            </button>
          ))}
        </div>

        {reply && (
          <p className="copilot-reply">
            <span className="copilot-tool">{reply.tool}</span>
            {reply.text}
          </p>
        )}
      </div>
    </section>
  );
}
