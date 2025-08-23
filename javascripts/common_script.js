/*
Software License Agreement (BSD)

@author    Salman Omar Sohail 
*/

// Dynamically load the navbar 
document.addEventListener("DOMContentLoaded", () => {
    fetch("navbar.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar").innerHTML = data;
        })
        .catch(error => console.error("Error loading navbar:", error));
});
