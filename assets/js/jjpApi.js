window.JJP_API = (() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbzwXPmpn9eVV1NdyBBZNkeXgpD0jD2qJphG3x_akIlqv8Kw1d_ZqtXfTP4XFegK8Ws2jA/exec";
  const configured = /^https:\/\/script\.google\.com\//.test(API_URL);

  async function get(action, params = {}) {
    if (!configured) throw new Error("JJP Apps Script is not connected yet.");
    const url = new URL(API_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error(`JJP request failed (${response.status}).`);
    const payload = await response.json();
    if (payload && payload.ok === false) throw new Error(payload.error || "JJP request failed.");
    return payload;
  }

  async function post(action, data) {
    if (!configured) throw new Error("JJP Apps Script is not connected yet.");
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, data })
    });
    return true;
  }

  return { API_URL, configured, get, post };
})();
