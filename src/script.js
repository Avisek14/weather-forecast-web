// API Configuration
const API_KEY = '63e36d8c235d179ddb82f39ecd5d2e84';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const weatherResult = document.getElementById('weatherResult');
const forecastResult = document.getElementById('forecastResult');

// Temperature unit toggle
let isCelsius = true;

// Weather icon emoji mapping
function getWeatherEmoji(iconCode) {
  const emojiMap = {
    '01d': '☀️',  // clear sky day
    '01n': '🌙',  // clear sky night
    '02d': '⛅',  // few clouds day
    '02n': '☁️',  // few clouds night
    '03d': '☁️',  // scattered clouds
    '03n': '☁️',
    '04d': '☁️',  // broken clouds
    '04n': '☁️',
    '09d': '🌧️',  // shower rain
    '09n': '🌧️',
    '10d': '🌦️',  // rain day
    '10n': '🌧️',  // rain night
    '11d': '⛈️',  // thunderstorm
    '11n': '⛈️',
    '13d': '❄️',  // snow
    '13n': '❄️',
    '50d': '🌫️',  // mist
    '50n': '🌫️'
  };
  
  return emojiMap[iconCode] || '🌤️';
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadRecentCities();
  
  // Event listeners
  searchBtn.addEventListener('click', handleSearch);
  locationBtn.addEventListener('click', getCurrentLocationWeather);
  
  // Enter key for search
  cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
});

// Handle search button click
function handleSearch() {
  const city = cityInput.value.trim();
  
  if (!city) {
    showError('Please enter a city name');
    return;
  }
  
  searchWeatherByCity(city);
}

// Search weather by city name
async function searchWeatherByCity(city) {
  try {
    showLoading();
    
    // Current weather
    const weatherResponse = await fetch(
      `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('City not found');
    }
    
    const weatherData = await weatherResponse.json();
    
    // 5-day forecast
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    const forecastData = await forecastResponse.json();
    
    // Display results
    displayWeather(weatherData);
    display5DayForecast(forecastData);
    
    // Save to recent searches
    saveToLocalStorage(city);
    
    // Clear input
    cityInput.value = '';
    
  } catch (error) {
    showError(error.message || 'Failed to fetch weather data');
  }
}

// Get current location weather
function getCurrentLocationWeather() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }
  
  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Current weather
        const weatherResponse = await fetch(
          `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        const weatherData = await weatherResponse.json();
        
        // 5-day forecast
        const forecastResponse = await fetch(
          `${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();
        
        displayWeather(weatherData);
        display5DayForecast(forecastData);
        
        saveToLocalStorage(weatherData.name);
        
      } catch (error) {
        showError('Failed to fetch weather data');
      }
    },
    (error) => {
      showError('Unable to retrieve your location');
    }
  );
}

// Display current weather
function displayWeather(data) {
  const { name, main, weather, wind } = data;
  const temperature = Math.round(main.temp);
  const condition = weather[0].main;
  const description = weather[0].description;
  const icon = weather[0].icon;
  const emoji = getWeatherEmoji(icon);
  
  // Check for extreme temperature alert
  checkTemperatureAlert(temperature);
  
  // Update background based on weather
  updateBackground(condition);
  
  weatherResult.innerHTML = `
    <div class="text-center weather-card fade-up">
      <h2 class="text-3xl font-bold mb-2">${name}</h2>
      <div class="text-8xl my-4">${emoji}</div>
      <div class="flex items-center justify-center gap-4 my-4">
        <p class="text-6xl font-bold" id="tempDisplay">${temperature}°C</p>
        <button 
          onclick="toggleTemperature(${temperature})" 
          class="bg-white/30 hover:bg-white/40 px-4 py-2 rounded-lg transition"
        >
          °C / °F
        </button>
      </div>
      <p class="text-xl capitalize mb-6">${description}</p>
      
      <div class="grid grid-cols-3 gap-4 text-center">
        <div class="bg-white/20 p-3 rounded-lg">
          <p class="text-sm opacity-80">Feels Like</p>
          <p class="text-2xl font-bold">${Math.round(main.feels_like)}°C</p>
        </div>
        <div class="bg-white/20 p-3 rounded-lg">
          <p class="text-sm opacity-80">Humidity</p>
          <p class="text-2xl font-bold">${main.humidity}%</p>
        </div>
        <div class="bg-white/20 p-3 rounded-lg">
          <p class="text-sm opacity-80">Wind Speed</p>
          <p class="text-2xl font-bold">${wind.speed} m/s</p>
        </div>
      </div>
    </div>
  `;
  
  weatherResult.classList.remove('hidden');
}

// Display 5-day forecast (FIXED VERSION)
function display5DayForecast(data) {
  // Get one forecast per day (around 12:00 PM)
  const dailyForecasts = data.list.filter(item => 
    item.dt_txt.includes('12:00:00')
  ).slice(0, 5);
  
  const forecastHTML = dailyForecasts.map(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const temp = Math.round(day.main.temp);
    const icon = day.weather[0].icon;
    const description = day.weather[0].description;
    const emoji = getWeatherEmoji(icon);
    
    return `
      <div class="forecast-card fade-up bg-white/20 rounded-xl p-4 text-center">
        <p class="font-semibold mb-2">${dayName}</p>
        <div class="text-5xl my-3">${emoji}</div>
        <p class="text-2xl font-bold">${temp}°C</p>
        <p class="text-sm opacity-80 capitalize">${description}</p>
        <div class="mt-2 text-xs space-y-1">
          <p>💧 ${day.main.humidity}%</p>
          <p>💨 ${day.wind.speed} m/s</p>
        </div>
      </div>
    `;
  }).join('');
  
  forecastResult.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">5-Day Forecast</h2>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      ${forecastHTML}
    </div>
  `;
  
  forecastResult.classList.remove('hidden');
}

// Temperature unit toggle
function toggleTemperature(celsius) {
  const tempDisplay = document.getElementById('tempDisplay');
  
  if (isCelsius) {
    const fahrenheit = Math.round((celsius * 9/5) + 32);
    tempDisplay.textContent = `${fahrenheit}°F`;
  } else {
    tempDisplay.textContent = `${celsius}°C`;
  }
  
  isCelsius = !isCelsius;
}

// Check for extreme temperature alert
function checkTemperatureAlert(temp) {
  if (temp > 40) {
    showCustomAlert('⚠️ Extreme Heat Alert!', `Temperature is ${temp}°C. Stay hydrated and avoid direct sunlight.`);
  } else if (temp < 0) {
    showCustomAlert('❄️ Freezing Alert!', `Temperature is ${temp}°C. Dress warmly and be careful of icy conditions.`);
  }
}

// Update background based on weather condition
function updateBackground(condition) {
  const body = document.body;
  
  switch(condition.toLowerCase()) {
    case 'clear':
      body.className = 'min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 text-white';
      break;
    case 'clouds':
      body.className = 'min-h-screen bg-gradient-to-br from-gray-400 to-gray-600 text-white';
      break;
    case 'rain':
    case 'drizzle':
      body.className = 'min-h-screen bg-gradient-to-br from-slate-700 via-blue-800 to-slate-900 text-white';
      break;
    case 'snow':
      body.className = 'min-h-screen bg-gradient-to-br from-blue-200 to-blue-400 text-white';
      break;
    case 'thunderstorm':
      body.className = 'min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white';
      break;
    default:
      body.className = 'min-h-screen bg-gradient-to-br from-sky-400 to-blue-600 text-white';
  }
}

// LocalStorage - Save recent cities
function saveToLocalStorage(city) {
  let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  
  // Remove if already exists
  recentCities = recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
  
  // Add to beginning
  recentCities.unshift(city);
  
  // Keep only last 5
  recentCities = recentCities.slice(0, 5);
  
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
  
  loadRecentCities();
}

// Load recent cities dropdown
function loadRecentCities() {
  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  
  if (recentCities.length === 0) return;
  
  const dropdownHTML = `
    <div class="mt-3">
      <label class="text-sm opacity-90 mb-1 block">Recent Searches:</label>
      <select 
        id="recentCitiesDropdown" 
        class="w-full px-4 py-2 rounded-lg text-black outline-none"
      >
        <option value="">Select a city...</option>
        ${recentCities.map(city => `<option value="${city}">${city}</option>`).join('')}
      </select>
    </div>
  `;
  
  // Check if dropdown already exists
  const existingDropdown = document.getElementById('recentCitiesDropdown');
  if (!existingDropdown) {
    const searchSection = document.querySelector('section');
    searchSection.insertAdjacentHTML('beforeend', dropdownHTML);
    
    // Add event listener
    setTimeout(() => {
      document.getElementById('recentCitiesDropdown').addEventListener('change', (e) => {
        if (e.target.value) {
          searchWeatherByCity(e.target.value);
        }
      });
    }, 100);
  }
}

// Show loading state
function showLoading() {
  weatherResult.innerHTML = `
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto"></div>
      <p class="mt-4" aria-live="polite">Loading weather data...</p>
    </div>
  `;
  weatherResult.classList.remove('hidden');
  forecastResult.classList.add('hidden');
}

// Show error message (Custom popup - NO alert())
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-bounce';
  errorDiv.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-2xl">⚠️</span>
      <p class="font-semibold">${message}</p>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-xl hover:text-gray-200">×</button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
  
  weatherResult.classList.add('hidden');
  forecastResult.classList.add('hidden');
}

// Show custom alert for extreme temperatures
function showCustomAlert(title, message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md';
  alertDiv.innerHTML = `
    <div>
      <h3 class="text-xl font-bold mb-2">${title}</h3>
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()" class="mt-3 bg-white text-orange-500 px-4 py-2 rounded font-semibold hover:bg-gray-100">
        Got it!
      </button>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}
