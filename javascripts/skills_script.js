/* ---------- Skills Data (edit me) ---------- */
const SKILLS = [
    // --- Software ---
    { area: "Software", group: "Systems", title: "Linux Systems", level: 5, tags: ["Ubuntu", "Systemd", "Networking"] },
    { area: "Software", group: "Systems", title: "Edge Computing", level: 5, tags: ["Jetson", "RPi", "Steamdeck"] },
    { area: "Software", group: "Programming", title: "C++", level: 5, tags: ["ROS2", "STL", "CMake"] },
    { area: "Software", group: "Programming", title: "Python", level: 5, tags: ["ROS2", "Flask", "Cython"] },
    { area: "Software", group: "Programming", title: "Bash Scripting", level: 5, tags: ["Automation", "Udev"] },
    { area: "Software", group: "Tools", title: "Git/GitHub", level: 5, tags: ["CI/CD", "Actions", "Packages"] },
    { area: "Software", group: "Tools", title: "Docker", level: 4, tags: ["Containers", "Compose"] },

    { area: "Software", group: "Robotics", title: "ROS 1/2 (All versions)", level: 5, tags: ["Noetic", "Humble", "Jazzy"] },
    { area: "Software", group: "Robotics", title: "Nav2 Navigation", level: 5, tags: ["SLAM", "Localization", "Planning"] },
    { area: "Software", group: "Robotics", title: "MoveIt2", level: 5, tags: ["Motion Planning", "OMPL", "Kinematics"] },
    { area: "Software", group: "Robotics", title: "Gazebo Sim", level: 5, tags: ["Fortress", "Harmonic", "ros2_control"] },
    { area: "Software", group: "Robotics", title: "URDF/XACRO", level: 5, tags: ["Robot Modeling", "TF2"] },
    { area: "Software", group: "Robotics", title: "ros2_control", level: 4, tags: ["Controllers", "Hardware Interface"] },

    { area: "Software", group: "Sensors", title: "LiDAR Integration", level: 5, tags: ["Ouster", "Livox", "Hesai"] },
    { area: "Software", group: "Sensors", title: "Depth Cameras", level: 5, tags: ["RealSense", "ZED2i"] },
    { area: "Software", group: "Sensors", title: "RTK-GPS Systems", level: 4, tags: ["Fixposition", "Emlid"] },

    { area: "Software", group: "Protocols", title: "CAN Bus", level: 4, tags: ["SocketCAN", "DBC"] },
    { area: "Software", group: "Protocols", title: "Serial/Modbus", level: 4, tags: ["RS485", "USB"] },

    { area: "Software", group: "Docs", title: "Technical Documentation", level: 5, tags: ["Sphinx", "RST", "Markdown"] },
    { area: "Software", group: "Docs", title: "LaTeX", level: 4, tags: ["Papers", "Manuals"] },

    { area: "Software", group: "Design", title: "Fusion 360", level: 5, tags: ["CAD", "CAM"] },
    { area: "Software", group: "Design", title: "3D Printing", level: 5, tags: ["FDM", "SLA"] },
    { area: "Software", group: "Design", title: "Blender", level: 3, tags: ["Mesh Export", "GLTF"] },

    { area: "Software", group: "AI/ML", title: "Computer Vision", level: 5, tags: ["OpenCV", "YOLO", "Depth"] },
    { area: "Software", group: "AI/ML", title: "Deep Learning", level: 5, tags: ["PyTorch", "TensorFlow"] },
    { area: "Software", group: "AI/ML", title: "Reinforcement Learning", level: 3, tags: ["Isaac Gym", "Locomotion"] },

    { area: "Software", group: "Web", title: "Flask", level: 4, tags: ["REST API", "WebSocket"] },
    { area: "Software", group: "Web", title: "JavaScript/Three.js", level: 4, tags: ["3D Viz", "GLTF"] },
    { area: "Software", group: "Web", title: "HTML/CSS", level: 4, tags: ["Responsive UI"] },

    // --- Hardware ---
    { area: "Hardware", group: "Platforms", title: "Wheeled Robots", level: 5, tags: ["Husky", "Jackal", "Ridgeback"] },
    { area: "Hardware", group: "Platforms", title: "Quadrupeds", level: 5, tags: ["Unitree", "Boston Dynamics"] },
    { area: "Hardware", group: "Platforms", title: "Humanoids/Bipeds", level: 4, tags: ["H1", "G1", "Ascento"] },
    { area: "Hardware", group: "Platforms", title: "Tracked Robots", level: 4, tags: ["ROVO", "Custom"] },

    { area: "Hardware", group: "Manipulators", title: "Robot Arms", level: 5, tags: ["xARM", "UR", "Franka"] },
    { area: "Hardware", group: "Manipulators", title: "Grippers", level: 5, tags: ["Robotiq 2F", "Custom"] },
    { area: "Hardware", group: "Manipulators", title: "Dexterous Hands", level: 4, tags: ["Inspire", "SEED"] },

    { area: "Hardware", group: "Integration", title: "Sensor Integration", level: 5, tags: ["LiDAR", "Camera", "IMU"] },
    { area: "Hardware", group: "Integration", title: "Electrical Systems", level: 4, tags: ["Wiring", "Power"] },

    { area: "Hardware", group: "Manufacturing", title: "3D Printing", level: 5, tags: ["Brackets", "Mounts"] },
    { area: "Hardware", group: "Manufacturing", title: "Machining", level: 3, tags: ["Lathe", "Drilling"] },
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