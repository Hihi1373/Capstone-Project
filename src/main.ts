// src/main.ts
document.addEventListener("DOMContentLoaded", () => {
  // --------------------
  // REQUIRED UI ELEMENTS
  // --------------------
  const designScreen = document.getElementById("design-screen")!;
  const simScreen = document.getElementById("simulation-screen")!;
  const modeBtn = document.getElementById("mode-toggle") as HTMLButtonElement;
  const instruction = document.getElementById("instruction")!;

  // Design elements
  const robotDesign = document.getElementById("robot")!; // design robot (inside #map)
  const tray = document.getElementById("sensor-tray")!;  // sensor tray
  const resetDesignBtn = document.getElementById("reset-btn") as HTMLButtonElement;

  // Simulation elements
  const robotSim = document.getElementById("robot-sim")!;
  const mapSim = document.getElementById("map-sim")!;
  const resetSimBtn = document.getElementById("reset-sim") as HTMLButtonElement;

  // Sensors
  const sensors = Array.from(document.querySelectorAll<HTMLElement>(".sensor"));

  // Wheels
  const designWheels = robotDesign.querySelectorAll<HTMLElement>(".wheel");
  const simWheels = robotSim.querySelectorAll<HTMLElement>(".wheel");

  // --------------------
  // MODE STATE + SCREEN TOGGLE
  // --------------------
  let isSimulationMode = false;

  function setMode(sim: boolean) {
    isSimulationMode = sim;

    if (sim) {
      (designScreen as HTMLElement).style.display = "none";
      (simScreen as HTMLElement).style.display = "block";
      modeBtn.innerText = "Switch to Design Mode";
      (instruction as HTMLElement).innerText = "Simulation Mode: Use arrow keys to move the robot.";
      document.body.focus();
    } else {
      (designScreen as HTMLElement).style.display = "block";
      (simScreen as HTMLElement).style.display = "none";
      modeBtn.innerText = "Switch to Simulation Mode";
      (instruction as HTMLElement).innerText = "Design Mode: Drag sensors onto the robot.";
    }
  }

  modeBtn.addEventListener("click", () => setMode(!isSimulationMode));
  setMode(false); // start in design

  // --------------------
  // DESIGN: DRAG SENSORS (FIXED)
  // --------------------
  let draggingSensor: HTMLElement | null = null;
  let offsetX = 0;
  let offsetY = 0;

  function sensorMouseDown(evt: MouseEvent) {
    if (isSimulationMode) return;

    const el = evt.currentTarget as HTMLElement;
    draggingSensor = el;

    const rect = el.getBoundingClientRect();
    offsetX = evt.clientX - rect.left;
    offsetY = evt.clientY - rect.top;

    el.classList.add("dragging");
    el.style.position = "fixed";     // ✅ FIX: use fixed
    el.style.zIndex = "9999";        // ✅ FIX: above everything
    document.body.appendChild(el);

    instruction.innerText = `Dragging ${el.dataset.name ?? "sensor"}`;
  }

  sensors.forEach((s) => s.addEventListener("mousedown", sensorMouseDown));

  document.addEventListener("mousemove", (e) => {
    if (!draggingSensor) return;
    if (isSimulationMode) return;

    // ✅ FIX: clientX/clientY match position: fixed
    draggingSensor.style.left = `${e.clientX - offsetX}px`;
    draggingSensor.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", (e: MouseEvent) => {
    if (!draggingSensor) return;
    if (isSimulationMode) return;
  
    // What is under the mouse pointer right now?
    const underMouse = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
  
    // Are we dropping on the robot or anything inside the robot?
    const robotHit = underMouse?.closest("#robot");
  
    if (robotHit) {
      const robotRect = robotDesign.getBoundingClientRect();
  
      // Place relative to robot (centered)
      let relLeft = e.clientX - robotRect.left - draggingSensor.offsetWidth / 2;
      let relTop  = e.clientY - robotRect.top  - draggingSensor.offsetHeight / 2;
  
      // Clamp so it stays inside robot bounds
      relLeft = Math.max(0, Math.min(robotDesign.clientWidth - draggingSensor.offsetWidth, relLeft));
      relTop  = Math.max(0, Math.min(robotDesign.clientHeight - draggingSensor.offsetHeight, relTop));
  
      robotDesign.appendChild(draggingSensor);
      draggingSensor.style.position = "absolute";
      draggingSensor.style.left = `${relLeft}px`;
      draggingSensor.style.top = `${relTop}px`;
  
      draggingSensor.classList.remove("dragging");
      draggingSensor.classList.add("attached");
  
      instruction.innerText = `Placed ${draggingSensor.dataset.name ?? "sensor"} on the robot!`;
    } else {
      tray.appendChild(draggingSensor);
      draggingSensor.style.position = "relative";
      draggingSensor.style.left = "0";
      draggingSensor.style.top = "0";
      draggingSensor.classList.remove("dragging", "attached");
  
      instruction.innerText = "Design Mode: Drag sensors onto the robot.";
    }
  
    draggingSensor = null;
  });
  
  

  // --------------------
  // SIMULATION: MOVE robot-sim with arrow keys
  // --------------------
  let simX = robotSim.offsetLeft;
  let simY = robotSim.offsetTop;
  let simAngle = 0;
  let simWheelRot = 0;

  window.addEventListener("keydown", (e) => {
    if (!isSimulationMode) return;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault(); // stop page scroll
    }

    const speed = 5;
    const rad = (simAngle * Math.PI) / 180;
    let moved = false;

    if (e.key === "ArrowUp") {
      simX += Math.sin(rad) * speed;
      simY -= Math.cos(rad) * speed;
      moved = true;
    } else if (e.key === "ArrowLeft") {
      simAngle -= 5;
    } else if (e.key === "ArrowRight") {
      simAngle += 5;
    } else {
      return;
    }

    const maxX = mapSim.clientWidth - robotSim.offsetWidth;
    const maxY = mapSim.clientHeight - robotSim.offsetHeight;

    simX = Math.max(0, Math.min(maxX, simX));
    simY = Math.max(0, Math.min(maxY, simY));

    robotSim.style.left = `${simX}px`;
    robotSim.style.top = `${simY}px`;
    robotSim.style.transform = `rotate(${simAngle}deg)`;

    if (moved) {
      simWheelRot += 15;
      simWheels.forEach((w) => (w.style.transform = `rotate(${simWheelRot}deg)`));
    }
  });

  // --------------------
  // RESET (Design)
  // --------------------
  resetDesignBtn.addEventListener("click", () => {
    sensors.forEach((el) => {
      tray.appendChild(el);
      el.style.position = "relative";
      el.style.left = "0";
      el.style.top = "0";
      el.classList.remove("dragging", "attached");
    });

    designWheels.forEach((w) => (w.style.transform = "rotate(0deg)"));
    instruction.innerText = "Design Mode: Drag sensors onto the robot.";
  });

  // --------------------
  // RESET (Simulation)
  // --------------------
  resetSimBtn.addEventListener("click", () => {
    simX = 270;
    simY = 170;
    simAngle = 0;
    simWheelRot = 0;

    robotSim.style.left = `${simX}px`;
    robotSim.style.top = `${simY}px`;
    robotSim.style.transform = "rotate(0deg)";
    simWheels.forEach((w) => (w.style.transform = "rotate(0deg)"));

    instruction.innerText = "Simulation Mode: Use arrow keys to move the robot.";
  });

  console.log("✅ main.ts running (screens + dragging fixed)");
});
