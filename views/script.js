document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("toggle-btn");
    const sidebar = document.getElementById("sidebar");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
        var x = document.getElementById("sidebar-content");
        if (x.style.display === "none") {
            x.style.display = "block";
        } else {
            x.style.display = "none";
            
        }
    });
});
