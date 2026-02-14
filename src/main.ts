document.addEventListener("DOMContentLoaded", () => {
  // --------------------
  // Grab elements (nullable first)
  // --------------------
  const robotEl = document.getElementById("robot") as HTMLElement | null;
  const trayEl = document.getElementById("sensor-tray") as HTMLElement | null;
  const resetBtnEl = document.getElementById("reset-btn") as HTMLButtonElement | null;
  const instructionMaybe = document.getElementById("instruction") as HTMLElement | null;
  const modeToggleBtnEl = document.getElementById("mode-toggle") as HTMLButtonElement | null;
  const mapEl = document.getElementById("map") as HTMLElement | null;

  // --------------------
  // Hard stop if anything is missing
  // --------------------
  if (!robotEl || !trayEl || !resetBtnEl || !instructionMaybe || !modeToggleBtnEl || !mapEl) {
    console.error("Missing required elements:", {
      robotEl, trayEl, resetBtnEl, instructionMaybe, modeToggleBtnEl, mapEl
    });
    return;
  }

  // ✅ From here on, instructionEl is guaranteed not null
  const instructionEl = instructionMaybe;

  const wheels = robotEl.querySelectorAll<HTMLElement>(".wheel");
  const sensors = Array.from(document.querySelectorAll<HTMLElement>(".sensor"));

  // --------------------
  // Mode state
  // --------------------
  let isSimulationMode = false;

  // --------------------
  // Drag state
  // --------------------
  let draggingSensor: HTMLElement | null = null;
  let offsetX = 0;
  let offsetY = 0;

  // --------------------
  // Robot state
  // --------------------
  let robotX = robotEl.offsetLeft;
  let robotY = robotEl.offsetTop;
  let angle = 0;
  let wheelRotation = 0;

  // --------------------
  // SENSOR DRAG START (Design mode only)
  // --------------------
  function sensorMouseDown(evt: Event) {
    if (isSimulationMode) return;

    const e = evt as MouseEvent;
    const el = evt.currentTarget as HTMLElement | null;
    if (!el) return;

    draggingSensor = el;

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    el.classList.add("dragging");
    el.style.position = "absolute";
    el.style.zIndex = "1000";
    document.body.appendChild(el);

    instructionEl.innerText = `Dragging ${el.dataset.name ?? "sensor"}`;
  }

  // Attach once
  sensors.forEach((sensor) => {
    sensor.addEventListener("mousedown", sensorMouseDown);
  });

  // --------------------
  // DRAG MOVE (Design mode only)
  // --------------------
  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!draggingSensor) return;
    if (isSimulationMode) return;

    draggingSensor.style.left = `${e.pageX - offsetX}px`;
    draggingSensor.style.top = `${e.pageY - offsetY}px`;
  });

  // --------------------
  // DROP (Design mode only)
  // --------------------
  document.addEventListener("mouseup", () => {
    if (!draggingSensor) return;
    if (isSimulationMode) return;

    const robotRect = robotEl.getBoundingClientRect();
    const sensorRect = draggingSensor.getBoundingClientRect();

    const insideRobot =
      sensorRect.left >= robotRect.left &&
      sensorRect.right <= robotRect.right &&
      sensorRect.top >= robotRect.top &&
      sensorRect.bottom <= robotRect.bottom;

    if (insideRobot) {
      const relativeLeft = sensorRect.left - robotRect.left;
      const relativeTop = sensorRect.top - robotRect.top;

      robotEl.appendChild(draggingSensor);
      draggingSensor.style.position = "absolute";
      draggingSensor.style.left = `${relativeLeft}px`;
      draggingSensor.style.top = `${relativeTop}px`;

      draggingSensor.classList.add("attached");
      draggingSensor.classList.remove("dragging");

      instructionEl.innerText = `Placed ${draggingSensor.dataset.name ?? "sensor"} on the robot!`;
    } else {
      trayEl.appendChild(draggingSensor);
      draggingSensor.style.position = "relative";
      draggingSensor.style.left = "0";
      draggingSensor.style.top = "0";
      draggingSensor.classList.remove("dragging");
      draggingSensor.classList.remove("attached");

      instructionEl.innerText = "Design Mode: Drag sensors onto the robot.";
    }

    draggingSensor = null;
  });

  // --------------------
  // ROBOT MOVEMENT (Simulation mode only)
  // --------------------
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (!isSimulationMode) return;

    const speed = 5;
    const rad = (angle * Math.PI) / 180;

    let moved = false;

    if (e.key === "ArrowUp") {
      robotX += Math.sin(rad) * speed;
      robotY -= Math.cos(rad) * speed;
      moved = true;
    } else if (e.key === "ArrowLeft") {
      angle -= 5;
    } else if (e.key === "ArrowRight") {
      angle += 5;
    } else {
      return;
    }

    // Clamp within map bounds (use clientWidth/clientHeight)
    const maxX = mapEl.clientWidth - robotEl.offsetWidth;
    const maxY = mapEl.clientHeight - robotEl.offsetHeight;

    robotX = Math.max(0, Math.min(maxX, robotX));
    robotY = Math.max(0, Math.min(maxY, robotY));

    robotEl.style.left = `${robotX}px`;
    robotEl.style.top = `${robotY}px`;
    robotEl.style.transform = `rotate(${angle}deg)`;

    // wheel rotation
    if (moved) {
      wheelRotation += 15;
      wheels.forEach((w) => (w.style.transform = `rotate(${wheelRotation}deg)`));
    }
  });

  // --------------------
  // RESET
  // --------------------
  resetBtnEl.addEventListener("click", () => {
    robotX = 270;
    robotY = 170;
    angle = 0;
    wheelRotation = 0;

    robotEl.style.left = `${robotX}px`;
    robotEl.style.top = `${robotY}px`;
    robotEl.style.transform = "rotate(0deg)";
    wheels.forEach((w) => (w.style.transform = "rotate(0deg)"));

    sensors.forEach((el) => {
      trayEl.appendChild(el);
      el.style.position = "relative";
      el.style.left = "0";
      el.style.top = "0";
      el.classList.remove("dragging", "attached");
    });

    instructionEl.innerText = isSimulationMode
      ? "Simulation Mode: Use arrow keys to move the robot."
      : "Design Mode: Drag sensors onto the robot.";
  });

  // --------------------
  // MODE TOGGLE
  // --------------------
  modeToggleBtnEl.addEventListener("click", () => {
    isSimulationMode = !isSimulationMode;

    if (isSimulationMode) {
      modeToggleBtnEl.innerText = "Switch to Design Mode";
      instructionEl.innerText = "Simulation Mode: Use arrow keys to move the robot.";
    } else {
      modeToggleBtnEl.innerText = "Switch to Simulation Mode";
      instructionEl.innerText = "Design Mode: Drag sensors onto the robot.";
    }
  });

  // Boot message
  console.log("✅ main.ts running");
  instructionEl.innerText = "Design Mode: Drag sensors onto the robot.";
});
