// Applies the saved theme before the first paint, so a forced light or dark theme does not flash.
(function(){
  try{
    var t = JSON.parse(localStorage.getItem("kt-v2")).profile.theme;
    if(t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  }catch(e){}
})();
