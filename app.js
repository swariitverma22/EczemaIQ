const fallbackWeather = { temperature: 94, feelsLike: 96, humidity: 35, uv: 9, pollen: "High", pollenMeta: "Grass dominant", aqi: 42, precipitation: 4, source: "Sample environmental conditions shown. Choose a location to fetch live data." };
const defaultProfile = {
  name: "", age: "", eczemaYears: "", email: "", medication: "None", triggers: []
};
const triggerNames = {
  grass: "Grass", sweat: "Sweat", fragrance: "Fragrance", dust: "Dust", heatHumidity: "Extreme heat / humidity",
  cold: "Cold weather", pets: "Pets", nuts: "Nuts", soy: "Soy", dairy: "Dairy", sugaryItems: "Sugary items", pollen: "Pollen",
  chlorine: "Chlorine / pool water", saltWater: "Salt water", sand: "Sand", detergents: "Detergents", hotShowers: "Hot showers",
  scentedBodyWash: "Scented body washes", wool: "Wool", polyester: "Polyester", stressAnxiety: "High stress / anxiety"
};
const dermatologyGuidance = {
  chlorine: { title: "Use a pool-day barrier routine", copy: "Before swimming, use the moisturizer or petroleum-jelly barrier that works for you. Rinse with lukewarm fresh water after swimming, pat dry, and moisturize promptly.", tag: "SWIM DAYS" },
  saltWater: { title: "Rinse after salt-water time", copy: "After sea or salt-water exposure, rinse with fresh lukewarm water, pat dry, and reapply your usual fragrance-free moisturizer.", tag: "WATER DAYS" },
  sand: { title: "Reduce sand and friction", copy: "Gently brush or rinse sand away instead of rubbing. Change out of sandy, damp clothing and moisturize after rinsing.", tag: "OUTDOORS" },
  fragrance: { title: "Keep your routine fragrance-free", copy: "Choose products labeled fragrance-free—not just unscented—around practice and bathing.", tag: "YOUR TRIGGERS" },
  detergents: { title: "Use a skin-friendly wash routine", copy: "Choose fragrance-free, dye-free detergent and wash new clothes before wearing them next to your skin.", tag: "YOUR TRIGGERS" },
  scentedBodyWash: { title: "Swap to a gentle cleanser", copy: "Use a mild, fragrance-free cleanser on areas that need it, then moisturize while skin is still slightly damp.", tag: "YOUR TRIGGERS" },
  wool: { title: "Choose a softer layer", copy: "If practical, wear a breathable cotton layer next to your skin and avoid wool contact on sensitive areas.", tag: "YOUR TRIGGERS" },
  polyester: { title: "Choose a softer layer", copy: "If practical, wear a breathable cotton layer next to your skin and change out of damp polyester promptly.", tag: "YOUR TRIGGERS" },
  dairy: { title: "Track food patterns safely", copy: "Record any repeat symptoms and discuss possible food allergies with a dermatologist or allergist—don’t eliminate dairy based only on this app.", tag: "YOUR PLAN" },
  sugaryItems: { title: "Track food patterns safely", copy: "Use your daily notes to track any repeat pattern, then discuss it with a clinician instead of making restrictive diet changes on your own.", tag: "YOUR PLAN" },
  nuts: { title: "Follow your personal food plan", copy: "Use the food plan you and your clinician have already agreed on; don’t make new food restrictions based only on an app.", tag: "YOUR PLAN" },
  soy: { title: "Follow your personal food plan", copy: "Use the food plan you and your clinician have already agreed on; don’t make new food restrictions based only on an app.", tag: "YOUR PLAN" }
};
let weather = { ...fallbackWeather };
let profile = { ...defaultProfile };
let savedLocation = null;
const $ = (id) => document.getElementById(id);

function getInputs() {
  return {
    sport: $("sport").value, practiceType: $("practiceType").value, duration: Number($("duration").value) || 0,
    surface: $("surface").value, setting: $("setting").value, sweat: $("sweat").value,
    intensity: Number($("intensity").value), sleep: Number($("sleep").value) || 0, stress: Number($("stress").value),
    showerType: $("showerType").value, showerDelay: Number($("showerDelay").value) || 0, water: Number($("water").value) || 0,
    sunExposure: Number($("sunExposure").value) || 0, clothing: $("clothing").value,
    moisturizerBefore: $("moisturizerBefore").checked, moisturizerAfter: $("moisturizerAfter").checked, sunscreen: $("sunscreen").checked
  };
}

function hasTrigger(trigger) { return profile.triggers.includes(trigger); }

function calculateRisk(data) {
  let score = 12;
  const factors = [];
  const add = (label, points, kind = "risk") => { score += points; factors.push({ label, points, kind }); };
  if (weather.temperature >= 90) add("Heat", 7); else if (weather.temperature >= 82) add("Warm weather", 4);
  if (weather.humidity < 40) add("Dry air", 8); else if (weather.humidity > 75) add("High humidity", 4);
  if (weather.uv >= 8) add("High UV", 7); else if (weather.uv >= 6) add("UV exposure", 4);
  if (weather.pollen === "High" || weather.pollen === "Very high") add("High pollen", weather.pollen === "Very high" ? 10 : 8);
  if (weather.aqi >= 101) add("Unhealthy air", 7); else if (weather.aqi >= 51) add("Moderate AQI", 3);
  if (data.duration >= 120) add("Long session", 6); else if (data.duration >= 90) add("90+ min session", 4);
  if (data.setting === "Outdoor") add("Outdoor exposure", 2);
  if (data.surface === "Grass") add("Grass contact", 9); else if (data.surface === "Turf") add("Turf friction", 3);
  if (data.intensity >= 8) add("High intensity", 6); else if (data.intensity >= 6) add("Moderate intensity", 3);
  if (data.sweat === "High") add("High sweat", 8); else if (data.sweat === "Medium") add("Sweat", 3);
  if (data.sleep < 6) add("Low sleep", 8); else if (data.sleep < 7) add("Less sleep", 5);
  if (data.stress >= 8) add("High stress", 8); else if (data.stress >= 6) add("Stress", 5);
  if (data.showerType === "Hot") add("Hot shower", 5);
  if (data.showerDelay > 30) add("Late shower", 7); else if (data.showerDelay > 15) add("Delayed shower", 3);
  if (data.water < 48) add("Low hydration", 6); else if (data.water < 64 && weather.temperature >= 82) add("Hydration gap", 3);
  if (data.sunExposure >= 2 && weather.uv >= 6) add("Sun exposure", 4);
  if (data.clothing === "Technical synthetic" || data.clothing === "Polyester blend") add("Synthetic fabric", 6);
  if (!data.moisturizerBefore && weather.humidity < 40) add("No pre-practice moisturizer", 4);
  if (!data.moisturizerAfter) add("No post-shower moisturizer", 6);
  if (!data.sunscreen && weather.uv >= 6) add("No sunscreen", 4);
  if (hasTrigger("heatHumidity") && (weather.temperature >= 82 || weather.humidity > 75)) add("Your heat / humidity trigger", 3);
  if (hasTrigger("cold") && weather.temperature <= 45) add("Your cold-weather trigger", 5);
  if (hasTrigger("pollen") && (weather.pollen === "High" || weather.pollen === "Very high")) add("Your pollen trigger", 3);
  if (hasTrigger("grass") && data.surface === "Grass") add("Your grass trigger", 3);
  if (hasTrigger("sweat") && data.sweat === "High") add("Your sweat trigger", 2);
  if (hasTrigger("hotShowers") && data.showerType === "Hot") add("Your hot-shower trigger", 2);
  if (hasTrigger("polyester") && (data.clothing === "Technical synthetic" || data.clothing === "Polyester blend")) add("Your polyester trigger", 3);
  if (hasTrigger("stressAnxiety") && data.stress >= 6) add("Your stress trigger", 2);
  if (hasTrigger("chlorine") && data.sport === "Swimming") add("Your pool-water trigger", 4);
  if (data.clothing === "Cotton / breathable") add("Breathable fabric", -2, "protective");
  if (data.showerDelay <= 15) add("Prompt shower", -5, "protective");
  if (data.moisturizerAfter) add("Post-shower moisture", -5, "protective");
  return { score: Math.max(8, Math.min(96, Math.round(score))), factors };
}

function riskInfo(score) {
  if (score >= 72) return { label: "ELEVATED", title: "Take a little extra care today.", message: "A few conditions may put more pressure on your skin barrier. Your routine can make a real difference.", color: "#ffc99e" };
  if (score >= 48) return { label: "MODERATE", title: "A balanced game plan is enough.", message: "There are some manageable triggers today. Stick with your recovery routine and check in with your skin.", color: "#ffcf6e" };
  return { label: "LOW", title: "Conditions look skin-friendly.", message: "Keep your familiar routine in place and enjoy your session with a little more confidence.", color: "#c9ed5b" };
}

function makeRecommendations(data) {
  const recs = [];
  const personalized = [];
  const hasTitle = (title) => [...personalized, ...recs].some((rec) => rec.title === title);
  const add = (title, copy, tag) => { if (!hasTitle(title)) recs.push({ title, copy, tag }); };
  const addPersonalized = (trigger) => {
    const guide = dermatologyGuidance[trigger];
    if (hasTrigger(trigger) && guide && !hasTitle(guide.title)) personalized.push(guide);
  };
  if (weather.humidity < 40 || !data.moisturizerBefore) add("Create a moisture buffer", "Apply a fragrance-free moisturizer about 20 minutes before practice, especially on exposed areas.", "BEFORE PRACTICE");
  if (data.sweat === "High" || data.intensity >= 7) add("Manage sweat gently", "Bring a soft towel and pat sweat away during breaks instead of rubbing your skin.", "DURING");
  if (weather.uv >= 6 && data.setting === "Outdoor") add("Protect from UV", data.sunscreen ? "Reapply your sensitive-skin sunscreen and look for shade during longer breaks." : "Use a broad-spectrum sunscreen designed for sensitive skin and look for shade during breaks.", "OUTDOORS");
  if (weather.temperature >= 82 || data.water < 64) add("Add a hydration break", "Bring water and sip regularly. Hot conditions make sweat and overheating harder on already-irritated skin.", "DURING");
  if (weather.pollen === "High" || weather.pollen === "Very high" || data.surface === "Grass") add("Rinse away outdoor triggers", "Change out of practice clothes and shower soon after your session to clear sweat, pollen, and surface residue.", "AFTER");
  if (data.showerDelay > 15 || data.showerType === "Hot") add("Keep your shower brief & mild", "Use lukewarm water, pat dry—don't scrub—and moisturize while your skin is still slightly damp.", "AFTER");
  if (!data.moisturizerAfter || data.showerDelay > 15) add("Seal in moisture right after", "Apply moisturizer immediately after patting your skin dry, while it is still slightly damp.", "AFTER SHOWER");
  if (data.sleep < 7 || data.stress >= 6) add("Give recovery a little room", "A calm, consistent wind-down tonight can support your skin and help you recharge for tomorrow.", "TONIGHT");
  ["fragrance", "detergents", "scentedBodyWash"].forEach(addPersonalized);
  if (data.clothing !== "Cotton / breathable") ["wool", "polyester"].forEach(addPersonalized);
  if (hasTrigger("pets")) add("Plan for pet contact", "After close pet contact, wash your hands and change before practice if dander is one of your known triggers.", "YOUR TRIGGERS");
  if (hasTrigger("cold") && weather.temperature <= 55) add("Buffer against cold air", "Cover exposed skin where practical and moisturize before going outside to support your skin barrier.", "OUTDOORS");
  if (data.sport === "Swimming") ["chlorine", "saltWater"].forEach(addPersonalized);
  if (data.setting === "Outdoor") addPersonalized("sand");
  ["nuts", "soy", "dairy", "sugaryItems"].forEach(addPersonalized);
  if (!recs.length) add("Keep your proven routine", "Your check-in looks well balanced today. Moisturize after bathing and change out of sweaty clothing promptly.", "ROUTINE");
  return [...personalized, ...recs].slice(0, 6);
}

function updateScore() {
  const data = getInputs();
  const result = calculateRisk(data);
  const info = riskInfo(result.score);
  $("riskNumber").textContent = result.score;
  $("riskPill").textContent = info.label;
  $("riskPill").style.background = info.color;
  $("riskTitle").textContent = info.title;
  $("riskMessage").textContent = info.message;
  $("riskRing").style.setProperty("--risk", `${result.score}%`);
  $("riskRing").style.background = `conic-gradient(${info.color} ${result.score}%, rgba(255,255,255,.17) 0)`;
  $("factorChips").innerHTML = result.factors.filter((factor) => factor.points !== 0).sort((a, b) => b.points - a.points).slice(0, 5).map((factor) => `<span class="factor-chip ${factor.kind === "protective" ? "protective" : ""}">${factor.label}<b>${factor.points > 0 ? "+" : ""}${factor.points}</b></span>`).join("");
  $("nextPractice").textContent = `${data.sport} ${data.practiceType.toLowerCase()}`;
  $("practiceMeta").textContent = `${data.setting} · ${data.surface} · ${data.duration} min`;
  const recs = makeRecommendations(data);
  $("nextTip").textContent = `${recs[0].title.replace(/[.]/g, "")}.`;
  $("recommendationList").innerHTML = recs.map((rec, index) => `<div class="recommendation"><input class="rec-check" type="checkbox" id="rec-${index}" aria-label="Mark ${rec.title} done"><label for="rec-${index}"><p class="rec-title">${rec.title}</p><p class="rec-copy">${rec.copy}</p></label><span class="rec-tag">${rec.tag}</span></div>`).join("");
  document.querySelectorAll(".rec-check").forEach((input) => input.addEventListener("change", (event) => event.target.closest(".recommendation").classList.toggle("is-done", event.target.checked)));
  $("scoreBreakdown").innerHTML = result.factors.sort((a, b) => b.points - a.points).map((factor) => `<div class="score-row ${factor.kind === "protective" ? "protective" : ""}"><span>${factor.label}</span><span>${factor.points > 0 ? "+" : ""}${factor.points} points</span></div>`).join("") || "<p>No notable risk factors logged.</p>";
  $("scoreUpdated").textContent = "Updates as your check-in changes";
  persist(data);
  renderAthlete();
}

function renderWeather() {
  $("temperatureValue").textContent = `${Math.round(weather.temperature)}°`;
  $("temperatureMeta").textContent = `Feels like ${Math.round(weather.feelsLike)}°`;
  $("humidityValue").textContent = `${Math.round(weather.humidity)}%`;
  $("humidityMeta").textContent = weather.humidity < 40 ? "Dry air" : weather.humidity > 75 ? "Humid" : "Comfortable";
  $("uvValue").textContent = Math.round(weather.uv);
  $("uvMeta").textContent = weather.uv >= 8 ? "Very high" : weather.uv >= 6 ? "High" : weather.uv >= 3 ? "Moderate" : "Low";
  $("pollenValue").textContent = weather.pollen;
  $("pollenMeta").textContent = weather.pollenMeta;
  $("aqiValue").textContent = weather.aqi;
  $("aqiMeta").textContent = weather.aqi <= 50 ? "Good" : weather.aqi <= 100 ? "Moderate" : "Use care";
  $("dataSource").textContent = weather.source;
  updateScore();
}

function setLocationButton(name) { $("locationButton").innerHTML = `${name} <span>⌄</span>`; }

async function fetchWeather(latitude, longitude, placeName, save = true) {
  $("refreshWeather").classList.add("spinning");
  $("dataSource").textContent = "Fetching current conditions…";
  try {
    const forecastURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&hourly=uv_index,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const airURL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi&hourly=grass_pollen,birch_pollen,ragweed_pollen,mugwort_pollen&timezone=auto`;
    const [forecastResponse, airResponse] = await Promise.all([fetch(forecastURL), fetch(airURL)]);
    if (!forecastResponse.ok) throw new Error("Weather unavailable");
    const forecast = await forecastResponse.json();
    const air = airResponse.ok ? await airResponse.json() : null;
    const timeIndex = forecast.hourly.time.findIndex((time) => time === forecast.current.time);
    const pollenValues = air?.hourly ? ["grass_pollen", "birch_pollen", "ragweed_pollen", "mugwort_pollen"].map((key) => Number(air.hourly[key]?.[timeIndex] ?? 0)) : [];
    const maxPollen = Math.max(0, ...pollenValues);
    const pollen = maxPollen >= 50 ? "Very high" : maxPollen >= 20 ? "High" : maxPollen >= 5 ? "Moderate" : "Low";
    const pollenNames = ["Grass", "Birch", "Ragweed", "Mugwort"];
    const maxIndex = pollenValues.indexOf(maxPollen);
    weather = { temperature: forecast.current.temperature_2m, feelsLike: forecast.current.apparent_temperature, humidity: forecast.current.relative_humidity_2m, uv: Number(forecast.hourly.uv_index?.[timeIndex] ?? 0), pollen, pollenMeta: maxPollen ? `${pollenNames[maxIndex]} dominant` : "Low activity", aqi: Math.round(air?.current?.us_aqi ?? 0), precipitation: Number(forecast.hourly.precipitation_probability?.[timeIndex] ?? 0), source: `Live conditions from Open-Meteo for ${placeName}. Updated just now.` };
    setLocationButton(placeName);
    if (save) { savedLocation = { latitude, longitude, name: placeName }; localStorage.setItem("flarewise-location", JSON.stringify(savedLocation)); }
    renderWeather();
    return true;
  } catch (_) {
    weather.source = "Live data couldn't load. Check your connection or try another location; sample conditions are still shown.";
    renderWeather();
    return false;
  } finally {
    $("refreshWeather").classList.remove("spinning");
  }
}

function openLocationDialog() {
  $("locationFeedback").textContent = "";
  $("locationDialog").showModal();
}

function requestLocation() {
  if (!navigator.geolocation) { $("locationFeedback").textContent = "Location isn't available in this browser. Search for a city or ZIP code instead."; return; }
  $("locationFeedback").classList.remove("success");
  $("locationFeedback").textContent = "Waiting for your browser's location permission…";
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const loaded = await fetchWeather(position.coords.latitude, position.coords.longitude, "your location");
      if (loaded) $("locationDialog").close();
      else $("locationFeedback").textContent = "We couldn't load conditions for that location. Try searching by city instead.";
    },
    () => { $("locationFeedback").textContent = "Location permission wasn't granted. You can still search for a city, state, or ZIP code below."; },
    { enableHighAccuracy: false, timeout: 9000, maximumAge: 3600000 }
  );
}

async function searchLocation(event) {
  event.preventDefault();
  const query = $("manualLocation").value.trim();
  if (!query) { $("locationFeedback").textContent = "Enter a city, state, ZIP code, or country first."; return; }
  $("locationFeedback").classList.remove("success");
  $("locationFeedback").textContent = "Finding that location…";
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
    const data = await response.json();
    const result = data.results?.[0];
    if (!result) throw new Error("No result");
    const placeName = [result.name, result.admin1 || result.country].filter(Boolean).join(", ");
    const loaded = await fetchWeather(result.latitude, result.longitude, placeName);
    if (loaded) $("locationDialog").close();
    else $("locationFeedback").textContent = "We found that location but couldn't get current conditions. Please try again.";
  } catch (_) { $("locationFeedback").textContent = "We couldn't find that location. Try a city and state, or a full ZIP code."; }
}

function persist(data) { localStorage.setItem("flarewise-checkin", JSON.stringify(data)); }
function loadSavedCheckIn() { try { const saved = JSON.parse(localStorage.getItem("flarewise-checkin")); if (!saved) return; Object.entries(saved).forEach(([key, value]) => { const element = $(key); if (!element) return; if (element.type === "checkbox") element.checked = value; else element.value = value; }); } catch (_) {} }

function loadProfile() {
  try { profile = { ...defaultProfile, ...JSON.parse(localStorage.getItem("flarewise-athlete-profile")) }; } catch (_) { profile = { ...defaultProfile }; }
  if (!Array.isArray(profile.triggers)) profile.triggers = [...defaultProfile.triggers];
  $("profileName").value = profile.name;
  $("profileAge").value = profile.age;
  $("eczemaYears").value = profile.eczemaYears;
  $("profileEmail").value = profile.email || "";
  $("medication").value = profile.medication;
  document.querySelectorAll("[data-trigger]").forEach((input) => { input.checked = profile.triggers.includes(input.dataset.trigger); });
  renderAthlete();
}

function renderAthlete() {
  const name = profile.name?.trim() || "Athlete";
  $("athleteName").textContent = name;
  $("avatarInitials").textContent = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  $("athleteProfileMeta").textContent = `${$("sport").value} · ${profile.age || "—"} yrs`;
}

function openProfileDialog(isFirstVisit = false) {
  $("profileKicker").textContent = isFirstVisit ? "WELCOME TO ECZEMAIQ" : "ATHLETE SETTINGS";
  $("profileTitle").textContent = isFirstVisit ? "Let’s make your plan personal." : "Your skin, your sport.";
  $("profileDescription").textContent = isFirstVisit ? "A few details help EczemaIQ tailor your first game plan. You can change any of this later in Settings." : "Tell EczemaIQ what matters to your routine. These details stay in this browser and make the game plan more relevant.";
  $("profileSetupNote").hidden = !isFirstVisit;
  $("profileSubmitText").textContent = isFirstVisit ? "Start my plan" : "Save settings";
  $("profileDialog").showModal();
}

function saveProfile(event) {
  event.preventDefault();
  profile = {
    name: $("profileName").value.trim() || "Athlete",
    age: Number($("profileAge").value) || "",
    eczemaYears: Number($("eczemaYears").value) || 0,
    email: $("profileEmail").value.trim(),
    medication: $("medication").value,
    triggers: [...document.querySelectorAll("[data-trigger]:checked")].map((input) => input.dataset.trigger)
  };
  localStorage.setItem("flarewise-athlete-profile", JSON.stringify(profile));
  renderAthlete();
  updateScore();
  $("profileDialog").close();
}

function localDateKey(date = new Date()) { const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return adjusted.toISOString().slice(0, 10); }
function getProgressEntries() { try { const entries = JSON.parse(localStorage.getItem("flarewise-daily-progress")); return Array.isArray(entries) ? entries : []; } catch (_) { return []; } }
function saveProgressEntries(entries) { localStorage.setItem("flarewise-daily-progress", JSON.stringify(entries.slice(-365))); }

function getStreak(entries) {
  const dates = new Set(entries.map((entry) => entry.date));
  let streak = 0;
  const cursor = new Date();
  while (dates.has(localDateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function getHighFlarePattern(entries) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 13);
  return entries.filter((entry) => entry.date >= localDateKey(cutoff) && Number(entry.flareLevel) >= 7);
}

function renderProgress() {
  const entries = getProgressEntries();
  const today = localDateKey();
  const byDate = new Map(entries.map((entry) => [entry.date, entry]));
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return date; });
  $("weekBars").innerHTML = days.map((day) => {
    const key = localDateKey(day);
    const entry = byDate.get(key);
    const level = entry ? Number(entry.flareLevel) : 0;
    const isToday = key === today;
    const barClass = entry ? (level <= 3 ? "good" : isToday ? "today-bar" : "") : "empty-bar";
    const height = entry ? Math.max(12, Math.max(1, level) * 9) : 4;
    const label = new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(day);
    return `<div title="${entry ? `Flare level ${level}/10` : "No check-in"}"><i class="${barClass}" style="height:${height}%"></i><span>${label}</span></div>`;
  }).join("");
  const streak = getStreak(entries);
  $("streakNumber").textContent = streak;
  $("streakLabel").innerHTML = `day<br />check-in streak`;
  const logged = entries.filter((entry) => entry.date >= localDateKey(days[0])).length;
  const followed = entries.filter((entry) => entry.date >= localDateKey(days[0]) && entry.followedPlan).length;
  if (!logged) $("trendCaption").innerHTML = "<span>●</span> End each day with a flare score to start your trend.";
  else $("trendCaption").innerHTML = `<span>●</span> ${logged} day${logged === 1 ? "" : "s"} logged this week · ${followed} plan followed.`;
  const highFlareEntries = getHighFlarePattern(entries);
  const shouldEscalateCare = highFlareEntries.length >= 3;
  $("careAlert").hidden = !shouldEscalateCare;
  if (shouldEscalateCare) $("careAlertText").textContent = ` You logged high flare levels on ${highFlareEntries.length} days in the past 14 days. Consider booking a dermatologist visit to review your history and discuss whether prescription treatment may be appropriate.`;
  $("endDayButton").innerHTML = byDate.has(today) ? "Update today’s check-in <span>→</span>" : "End-day check-in <span>→</span>";
}

function openDailyProgress() {
  const current = getProgressEntries().find((entry) => entry.date === localDateKey());
  $("flareLevel").value = current?.flareLevel ?? 3;
  $("flareLevelValue").textContent = `${$("flareLevel").value} / 10`;
  $("followedPlan").checked = Boolean(current?.followedPlan);
  $("dailyNote").value = current?.note ?? "";
  $("progressFeedback").textContent = current ? "You can update today's saved check-in." : "";
  $("progressFeedback").classList.toggle("success", Boolean(current));
  $("dailyProgressDialog").showModal();
}

function saveDailyProgress(event) {
  event.preventDefault();
  const date = localDateKey();
  const currentRisk = calculateRisk(getInputs()).score;
  const entry = { date, flareLevel: Number($("flareLevel").value), followedPlan: $("followedPlan").checked, note: $("dailyNote").value.trim(), risk: currentRisk, triggers: [...profile.triggers], location: savedLocation?.name || "" };
  const entries = getProgressEntries().filter((item) => item.date !== date);
  entries.push(entry);
  saveProgressEntries(entries.sort((a, b) => a.date.localeCompare(b.date)));
  $("dailyProgressDialog").close();
  renderProgress();
}

function setDate() { $("todayDate").textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase(); }

document.addEventListener("DOMContentLoaded", () => {
  setDate();
  loadSavedCheckIn();
  const hasExistingProfile = Boolean(localStorage.getItem("flarewise-athlete-profile"));
  loadProfile();
  try { savedLocation = JSON.parse(localStorage.getItem("flarewise-location")); } catch (_) { savedLocation = null; }
  $("intensityValue").textContent = `${$("intensity").value} / 10`;
  $("stressValue").textContent = `${$("stress").value} / 10`;
  if (savedLocation?.latitude != null && savedLocation?.longitude != null) fetchWeather(savedLocation.latitude, savedLocation.longitude, savedLocation.name, false);
  else renderWeather();
  renderProgress();

  $("checkInForm").addEventListener("input", (event) => { if (event.target.id === "intensity") $("intensityValue").textContent = `${event.target.value} / 10`; if (event.target.id === "stress") $("stressValue").textContent = `${event.target.value} / 10`; updateScore(); });
  $("checkInForm").addEventListener("change", updateScore);
  $("checkInForm").addEventListener("submit", (event) => { event.preventDefault(); updateScore(); $("scoreUpdated").textContent = "Game plan updated just now"; document.querySelector(".risk-card").scrollIntoView({ behavior: "smooth", block: "center" }); });
  $("locationButton").addEventListener("click", openLocationDialog);
  $("refreshWeather").addEventListener("click", () => savedLocation ? fetchWeather(savedLocation.latitude, savedLocation.longitude, savedLocation.name, false) : openLocationDialog());
  $("useCurrentLocation").addEventListener("click", requestLocation);
  $("locationForm").addEventListener("submit", searchLocation);
  $("profileButton").addEventListener("click", () => openProfileDialog(false));
  $("profileForm").addEventListener("submit", saveProfile);
  $("endDayButton").addEventListener("click", openDailyProgress);
  $("dailyProgressForm").addEventListener("submit", saveDailyProgress);
  $("flareLevel").addEventListener("input", (event) => { $("flareLevelValue").textContent = `${event.target.value} / 10`; });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => $(button.dataset.closeDialog).close()));
  $("conditionsButton").addEventListener("click", () => $("detailsDialog").showModal());
  $("whyThisPlan").addEventListener("click", () => $("detailsDialog").showModal());
  $("referencesButton").addEventListener("click", () => $("evidenceDialog").showModal());
  $("markDone").addEventListener("click", (event) => { const checks = document.querySelectorAll(".rec-check"); const allDone = [...checks].every((check) => check.checked); checks.forEach((check) => { check.checked = !allDone; check.closest(".recommendation").classList.toggle("is-done", !allDone); }); event.currentTarget.classList.toggle("complete", !allDone); event.currentTarget.textContent = allDone ? "Mark all done" : "All set ✓"; });
  if (!hasExistingProfile) openProfileDialog(true);
});
