(() => {
  const mobile = window.matchMedia("(max-width: 900px)");
  let loaded = false;

  const load = () => {
    if (!mobile.matches || loaded) return;
    loaded = true;
    const script = document.createElement("script");
    script.src = "/kernel-status.js";
    script.async = false;
    document.head.append(script);
  };

  if (typeof mobile.addEventListener === "function") mobile.addEventListener("change", load);
  else mobile.addListener(load);
  load();
})();
