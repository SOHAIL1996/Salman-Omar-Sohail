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

    { area: "Software", group: "Sensors", title: "LiDAR Integration", level: 5, tags: ["Livox", "Ouster", "Hokuyo", "Blickfeld"] },
    { area: "Software", group: "Sensors", title: "IMUs", level: 4, tags: ["UM7", "Phidgets", "Lord Microstrain"] },
    { area: "Software", group: "Sensors", title: "Sensor Integration", level: 5, tags: ["LiDAR", "Depth Cameras", "IMU", "GPS", "Routers"] },

    { area: "Software", group: "Protocols", title: "CAN Bus", level: 4, tags: ["SocketCAN", "DBC"] },
    { area: "Software", group: "Protocols", title: "Serial/Modbus", level: 4, tags: ["RS485", "USB"] },

    { area: "Software", group: "Docs", title: "Technical Documentation", level: 5, tags: ["Sphinx", "RST", "Markdown"] },
    { area: "Software", group: "Docs", title: "LaTeX", level: 4, tags: ["Papers", "Manuals"] },

    { area: "Software", group: "Design", title: "Fusion 360", level: 5, tags: ["CAD", "CAM"] },
    { area: "Software", group: "Design", title: "3D Printing", level: 5, tags: ["FDM", "SLA", "Bambu Studio", "PrusaSlicer", "Cura", "Mesh Repair"] },
    { area: "Software", group: "Design", title: "Blender", level: 3, tags: ["Mesh Export", "GLTF"] },

    { area: "Software", group: "AI/ML", title: "Computer Vision", level: 5, tags: ["OpenCV", "YOLO", "Depth"] },
    { area: "Software", group: "AI/ML", title: "Deep Learning", level: 5, tags: ["PyTorch", "TensorFlow"] },
    { area: "Software", group: "AI/ML", title: "Reinforcement Learning", level: 5, tags: ["Isaac Gym", "Locomotion"] },

    { area: "Software", group: "Web", title: "Flask", level: 4, tags: ["REST API", "WebSocket"] },
    { area: "Software", group: "Web", title: "JavaScript/Three.js", level: 4, tags: ["3D Viz", "GLTF"] },
    { area: "Software", group: "Web", title: "HTML/CSS", level: 4, tags: ["Responsive UI"] },

    // --- Hardware ---
    { area: "Hardware", group: "Platforms", title: "Tracked Robots", level: 4, tags: ["Mattro ROVO2", "Mattro ROVO3"] },
    { area: "Hardware", group: "Platforms", title: "Quadrupeds", level: 5, tags: ["Unitree A1", "Unitree A2", "Unitree Go2", "Unitree B1", "Unitree B2", "Unitree B2-W", "Boston Dynamics Spot"] },
    { area: "Hardware", group: "Platforms", title: "Humanoids/Bipeds", level: 4, tags: ["Unitree H1", "Unitree G1", "Unitree G1-D", "Unitree R1", "AgiBot A2", "AgiBot X2", "AgiBot G2", "LimX P1", "Ascento"] },
    { area: "Hardware", group: "Platforms", title: "Wheeled Robots", level: 5, tags: ["AgileX Hunter", "Segway E1", "Clearpath Husky", "Clearpath Jackal", "Clearpath Ridgeback", "Clearpath Dingo", "Clearpath Boxer", "Clearpath Warthog"] },

    { area: "Hardware", group: "Manipulators", title: "Robot Arms", level: 5, tags: ["Ufactory xARM5/6/7", "Ufactory UF850", "UR5/5e/10e/20", "Kinova Gen3", "Kinova Link 6", "Franka Panda", "AgileX PiPER", "Unitree Z1", "Unitree D1-T", "Robotis OM-X"] },
    { area: "Hardware", group: "Manipulators", title: "Grippers & Dexterous Hands", level: 5, tags: ["Robotiq 2F-85", "Robotiq 2F-140", "Inspire 6-DOF", "SEED", "Custom"] },

    { area: "Hardware", group: "Sensors", title: "Depth Cameras", level: 5, tags: ["ZEDX", "ZED2", "ZED2i", "RealSense D435/D435i", "RealSense D455", "RealSense D405"] },
    { area: "Hardware", group: "Sensors", title: "RTK-GPS Systems", level: 4, tags: ["Fixposition", "EMLID RS2", "EMLID M2", "Drotek"] },

    { area: "Hardware", group: "Integration", title: "Electrical Systems", level: 4, tags: ["Wiring", "Power", "Soldering", "Crimping", "Schematics", "PCB Assembly", "Multimeter Diagnostics"] },

    { area: "Hardware", group: "Manufacturing", title: "3D Printing", level: 5, tags: ["Brackets", "Mounts", "Enclosures", "Sensor Housings", "End-Effectors", "Jigs", "Prototypes"] },
    { area: "Hardware", group: "Manufacturing", title: "Machining", level: 3, tags: ["Lathe", "Drilling", "Milling", "CNC", "Grinding", "Welding", "Sheet Metal"] },
];

/* ---------- Render ---------- */
let grid = null;
let tabs = null;

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
    // Software first, Hardware last.
    // Within Hardware: Sensors first, then Platforms, Manufacturing, Integration, Manipulators (Robot Arms last).
    // Within each (area, group), preserve the order they appear in the SKILLS array above.
    const areaOrder = { Software: 0, Hardware: 1 };
    const groupOrder = {
        Sensors: 0,
        Platforms: 1,
        Manufacturing: 2,
        Integration: 3,
        Manipulators: 4,
    };
    grid.innerHTML = SKILLS
        .map((s, i) => ({ ...s, _idx: i }))
        .filter(s => filter === "all" ? true : s.area === filter)
        .sort((a, b) => {
            const ao = (areaOrder[a.area] ?? 99) - (areaOrder[b.area] ?? 99);
            if (ao !== 0) return ao;
            const go = (groupOrder[a.group] ?? 99) - (groupOrder[b.group] ?? 99);
            if (go !== 0) return go;
            return a._idx - b._idx;
        })
        .map(card).join("");
}

/* ---------- SPA-aware init / teardown ---------- */
let _skillsAbort = null;

function initSkills() {
    teardownSkills();
    grid = document.getElementById("skills-grid");
    tabs = document.querySelectorAll(".skills-tab");
    if (!grid) return;

    render();

    _skillsAbort = new AbortController();
    const signal = _skillsAbort.signal;
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            render(btn.dataset.filter);
        }, { signal });
    });
}

function teardownSkills() {
    if (_skillsAbort) { _skillsAbort.abort(); _skillsAbort = null; }
}

if (window.SPA && window.SPA.register) {
    window.SPA.register("skills.html", { init: initSkills, teardown: teardownSkills });
}
if (document.getElementById("skills-grid")) initSkills();