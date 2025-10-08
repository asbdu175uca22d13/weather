
const OWM_API_KEY = "3e088a21fd273e45f5d5aadd160084c6";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const detectBtn = document.getElementById("detectBtn");

const localClockEl = document.getElementById("localClock");
const localDateEl = document.getElementById("localDate");

const cityClockEl = document.getElementById("cityClock");
const cityDateEl = document.getElementById("cityDate");

const weatherIcon = document.getElementById("weatherIcon");
const tempEl = document.getElementById("temp");
const descriptionEl = document.getElementById("description");
const detailsEl = document.getElementById("details");
const locationNameEl = document.getElementById("locationName");

let cityTimezoneOffset = null; 


function two(n){ return String(n).padStart(2,"0"); }


function updateLocalClock() {
  const now = new Date();
  localClockEl.textContent = `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`;
  localDateEl.textContent = now.toLocaleString();
}
setInterval(updateLocalClock, 1000);
updateLocalClock();

// Update city clock every second using cityTimezoneOffset (seconds)
function updateCityClock(){
  if (cityTimezoneOffset === null) {
    cityClockEl.textContent = "--:--:--";
    cityDateEl.textContent = "—";
    return;
  }
  // UTC ms:
  const utcMs = Date.now() + (new Date()).getTimezoneOffset() * 60000;
  const cityMs = utcMs + cityTimezoneOffset * 1000;
  const cityDate = new Date(cityMs);
  cityClockEl.textContent = `${two(cityDate.getHours())}:${two(cityDate.getMinutes())}:${two(cityDate.getSeconds())}`;
  cityDateEl.textContent = cityDate.toLocaleString();
}
setInterval(updateCityClock, 1000);
updateCityClock();

// Fetch weather for a city name
async function fetchWeatherForCity(city) {
  try {
    if (!OWM_API_KEY || OWM_API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
      alert("Please set your OpenWeatherMap API key in script.js.");
      return;
    }
    const q = encodeURIComponent(city);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${OWM_API_KEY}&units=metric`;
    const resp = await fetch(url);
    if (!resp.ok) {
      if (resp.status === 404) throw new Error("City not found. Try 'London' or 'New York,US'.");
      else throw new Error(`Weather API error ${resp.status}`);
    }
    const data = await resp.json();
    // timezone is seconds offset from UTC
    cityTimezoneOffset = data.timezone;

    // Update weather UI
    const temp = Math.round(data.main.temp);
    const desc = data.weather && data.weather[0] ? data.weather[0].description : "";
    const iconCode = data.weather && data.weather[0] ? data.weather[0].icon : null;
    const humidity = data.main.humidity;
    const wind = data.wind && data.wind.speed !== undefined ? `${data.wind.speed} m/s` : "—";

    tempEl.textContent = `${temp}°C`;
    descriptionEl.textContent = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : "—";
    detailsEl.textContent = `Humidity: ${humidity}% | Wind: ${wind}`;
    locationNameEl.textContent = `${data.name}${data.sys && data.sys.country ? ", " + data.sys.country : ""}`;

    if (iconCode) {
      // Use OpenWeatherMap icon. For production consider using your own assets.
      weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      weatherIcon.alt = desc;
      weatherIcon.style.display = "";
    } else {
      weatherIcon.style.display = "none";
    }

    updateCityClock();
  } catch (err) {
    alert("Error: " + err.message);
    cityTimezoneOffset = null;
    updateCityClock();
  }
}

// Attach controls
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    alert("Type a city name first.");
    return;
  }
  fetchWeatherForCity(city);
});

// Press enter to search
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// Detect approximate city from Intl API / browser locale (best-effort)
// Note: This is just a convenience — we then call OWM by city name.
detectBtn.addEventListener("click", () => {
  const locale = navigator.language || "en-US";
  // Can't reliably map locale -> city, so prompt user with a sensible fallback:
  const guess = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (guess) {
    // guess is IANA timezone like 'Asia/Kolkata', use the region part as a hint
    const parts = guess.split("/");
    const cityGuess = parts.length > 1 ? parts[1].replace("_", " ") : parts[0];
    if (confirm(`Detected timezone ${guess}. Search weather for "${cityGuess}"?`)) {
      cityInput.value = cityGuess;
      fetchWeatherForCity(cityGuess);
      return;
    }
  }
  const manual = prompt("Could not detect a reliable city. Type a city name (e.g., Tokyo):");
  if (manual) {
    cityInput.value = manual;
    fetchWeatherForCity(manual);
  }
});

// Optionally auto-search a default city on load
fetchWeatherForCity("London");
