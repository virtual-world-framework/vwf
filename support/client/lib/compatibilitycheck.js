function compatibilityCheck ( compatibility ) {
    if(compatibility.errors["WGL"] || compatibility.errors["ES5"] || compatibility.errors["WS"]) {
        el = document.getElementById("incompatibleBrowser");
        el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";
    }
}

