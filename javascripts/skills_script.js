/* ---------- Skills Data (edit me) ---------- */
const SKILLS = [
    // --- Software ---
    { area: "Software", group: "Systems", title: "Linux Systems", level: 5, tags: ["Edge Computing", "CLI", "Services"] },
    { area: "Software", group: "Programming", title: "C++", level: 5, tags: ["ROS", "STL", "CMake"] },
    { area: "Software", group: "Programming", title: "Python", level: 5, tags: ["ROS", "NumPy", "Pandas", ] },
    { area: "Software", group: "Programming", title: "Java", level: 3, tags: ["API"] },
    { area: "Software", group: "Programming", title: "Bash Scripting", level: 4, tags: ["Automation"] },
    { area: "Software", group: "Tools", title: "GitHub", level: 4, tags: ["Software Packagees","Actions", "Issues"] },

    { area: "Software", group: "Robotics", title: "ROS 1/2 (All versions)", level: 5, tags: ["Nav2", "MoveIt2", "XACRO"] },
    { area: "Software", group: "Robotics", title: "Gazebo Classic/Ignition", level: 5, tags: ["SDF", "Sensors"] },
    { area: "Software", group: "Robotics", title: "Webots", level: 4, tags: ["Robot Drivers"] },
    { area: "Software", group: "Robotics", title: "NVIDIA Isaac Sim", level: 3, tags: ["Robot Drivers"] },

    { area: "Software", group: "Docs", title: "LaTeX", level: 4, tags: ["Research Papers","Manuals"] },
    { area: "Software", group: "Docs", title: "reStructuredText", level: 4, tags: ["Online Documentation"] },

    { area: "Software", group: "Design", title: "Engineering Design", level: 5, tags: ["3D Designing"] },
    { area: "Software", group: "Design", title: "3D Printing", level: 5, tags: ["FDM", "SLA"] },
    { area: "Software", group: "Design", title: "Fusion 360", level: 5, tags: ["3D Designing"] },
    { area: "Software", group: "Design", title: "CATIA V5", level: 4, tags: ["3D Designing"] },
    { area: "Software", group: "Design", title: "Blender", level: 3, tags: ["3D Designing"] },

    { area: "Software", group: "AI/ML", title: "Classic Machine Learning", level: 5, tags: ["Scikit-learn","Custom"] },
    { area: "Software", group: "AI/ML", title: "Deep Learning", level: 5, tags: ["PyTorch", "TensorFlow","Custom"] },
    { area: "Software", group: "AI/ML", title: "Reinforcement Learning", level: 3, tags: ["Policy-based","Custom"] },
    { area: "Software", group: "AI/ML", title: "Computer Vision", level: 5, tags: ["OpenCV","YOLO","Custom"] },
    { area: "Software", group: "AI/ML", title: "Natural Language Processing", level: 4, tags: ["Classical","Transformers", "N-Grams"] },
    { area: "Software", group: "AI/ML", title: "Stable Diffusion", level: 3, tags: ["GUI"] },

    { area: "Software", group: "Web", title: "HTML", level: 4, tags: ["Front-end"] },
    { area: "Software", group: "Web", title: "CSS", level: 4, tags: ["Front-end"] },
    { area: "Software", group: "Web", title: "JavaScript", level: 4, tags: ["Back-end"] },

    // --- Hardware ---
    { area: "Hardware", group: "Integration", title: "R. Software Integration", level: 5, tags: ["Drivers", "Middlewares"] },
    { area: "Hardware", group: "Integration", title: "R. Hardware Integration", level: 5, tags: ["Sensors", "Actuators"] },
    { area: "Hardware", group: "Integration", title: "R. Electrical Integration", level: 4, tags: ["Wiring", "Power"] },

    { area: "Hardware", group: "Additive Manufacturing", title: "3D Printing", level: 5, tags: ["Sensor Brackets", "Mounts"] },
    { area: "Hardware", group: "Subtractive Manufacturing", title: "Lathe Machine", level: 4, tags: ["Base Plates"] },
    { area: "Hardware", group: "Manufacturing", title: "Carpentry", level: 3, tags: ["Fixtures"] },
    { area: "Hardware", group: "Subtractive Manufacturing", title: "CNC Milling", level: 3, tags: ["Panels"] },
    { area: "Hardware", group: "Subtractive Manufacturing", title: "Drilling", level: 3, tags: ["Holes", "Bores"] },
    { area: "Hardware", group: "Subtractive Manufacturing", title: "Cutting", level: 3, tags: ["Sizing"] },
];

/* ---------- Render ---------- */
const grid = document.getElementById("skills-grid");
const tabs = document.querySelectorAll(".skills-tab");

function dotMeter(level = 0, max = 6) {
    return Array.from({ length: max }, (_, i) =>
        `<span class="dot ${i < level ? 'filled' : ''}" aria-hidden="true"></span>`
    ).join("");
}

function card({ area, group, title, level, tags }) {
    const cls = area.toLowerCase();
    return `
    <article class="skill-card ${cls}" data-area="${area}">
      <div class="skill-head">
        <div class="skill-title">${title}</div>
        <div class="skill-sub">${group}</div>
      </div>
      <div class="skill-meter" role="img" aria-label="${title} proficiency ${level} of 6">
        ${dotMeter(level, 6)}
      </div>
      ${tags?.length ? `<div class="skill-tags">${tags.map(t => `<span class="skill-tag">${t}</span>`).join("")}</div>` : ""}
      <div class="skill-tooltip">${area}</div>
    </article>
  `;
}

function render(filter = "all") {
    grid.innerHTML = SKILLS
        .filter(s => filter === "all" ? true : s.area === filter)
        // stable, readable grouping
        .sort((a, b) => (a.area + b.group + a.title).localeCompare(b.area + b.group + b.title))
        .map(card).join("");
}
render();

/* ---------- Filters ---------- */
tabs.forEach(btn => {
    btn.addEventListener("click", () => {
        tabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        render(btn.dataset.filter);
    });
});