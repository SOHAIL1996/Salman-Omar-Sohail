/*
Software License Agreement (BSD)

@author    Salman Omar Sohail 
*/

// Dynamically load the navbar 
const nav = document.querySelector('.navbar');
const navBarUrl = "navbar.html";
fetch(navBarUrl)
    .then(response => response.text())
    .then(data => {
        nav.innerHTML = data;
    });

// Dynamically load the footer
// const footer_ = document.querySelector('.footer_');
// const footerBarUrl = "../static/common/footer.html";
// fetch(footerBarUrl)
//     .then(response => response.text())
//     .then(data => {
//         footer_.innerHTML = data;
//     });

