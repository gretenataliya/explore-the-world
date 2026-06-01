import './style.css'

const API_BASE_URL = 'https://restcountries.com/v3.1'
const API_FIELDS = 'fields=name,flags,region,capital,languages,currencies,population,area,maps'

let countries = []
let currentCountries = []
let savedCountries = JSON.parse(localStorage.getItem('savedCountries')) || []

const app = document.querySelector('#app')

app.innerHTML = `
  <header class="hero">
    <button id="dreamBtn" class="dream-btn">
      <span>🌴</span>
      <span>Dream Destinations</span>
      <span id="dreamCount" class="dream-count">0</span>
    </button>

    <div class="hero-content">
      <p class="eyebrow">Interactive Travel Guide</p>
      <h1>Explore the World</h1>
      <p>Discover countries, cultures and save your dream destinations.</p>
    </div>
  </header>

  <main class="container">
    <section class="controls">
      <input type="text" id="searchInput" placeholder="Search for a country..." />
      <button id="searchBtn">Search</button>

      <select id="regionFilter">
        <option value="">All regions</option>
        <option value="Europe">Europe</option>
        <option value="Asia">Asia</option>
        <option value="Africa">Africa</option>
        <option value="Americas">Americas</option>
        <option value="Oceania">Oceania</option>
      </select>

      <select id="languageFilter">
        <option value="">All languages</option>
      </select>

      <select id="sortSelect">
        <option value="">Sort by</option>
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
        <option value="populationHigh">Highest population</option>
        <option value="populationLow">Lowest population</option>
      </select>

      <button id="resetBtn">Reset</button>
    </section>

    <p id="message"></p>
    <p id="countryCount"></p>

    <section>
      <h2>Countries</h2>
      <div id="countriesContainer" class="countries-grid"></div>
    </section>

    <div id="countryModal" class="modal hidden">
      <div class="modal-content">
        <button id="closeModalBtn" class="close-btn">×</button>
        <div id="modalCountryDetails"></div>
      </div>
    </div>

    <div id="dreamDrawer" class="dream-drawer hidden">
      <div class="drawer-header">
        <h2>🌴 Dream Destinations</h2>
        <button id="closeDrawerBtn" class="close-drawer-btn">×</button>
      </div>
      <div id="savedCountries" class="saved-countries"></div>
    </div>

    <div id="drawerOverlay" class="drawer-overlay hidden"></div>
    <div id="toast" class="toast hidden"></div>
  </main>
`

const countriesContainer = document.querySelector('#countriesContainer')
const savedCountriesContainer = document.querySelector('#savedCountries')
const modalCountryDetails = document.querySelector('#modalCountryDetails')
const countryModal = document.querySelector('#countryModal')
const closeModalBtn = document.querySelector('#closeModalBtn')
const message = document.querySelector('#message')
const countryCount = document.querySelector('#countryCount')
const searchInput = document.querySelector('#searchInput')
const searchBtn = document.querySelector('#searchBtn')
const regionFilter = document.querySelector('#regionFilter')
const languageFilter = document.querySelector('#languageFilter')
const sortSelect = document.querySelector('#sortSelect')
const resetBtn = document.querySelector('#resetBtn')
const dreamBtn = document.querySelector('#dreamBtn')
const dreamCount = document.querySelector('#dreamCount')
const dreamDrawer = document.querySelector('#dreamDrawer')
const closeDrawerBtn = document.querySelector('#closeDrawerBtn')
const drawerOverlay = document.querySelector('#drawerOverlay')
const toast = document.querySelector('#toast')

async function fetchCountries() {
  try {
    showMessage('Loading countries...')

    const response = await fetch(`${API_BASE_URL}/all?${API_FIELDS}`)

    if (!response.ok) {
      throw new Error('Could not fetch countries')
    }

    countries = await response.json()
    currentCountries = [...countries]

    populateLanguageFilter()
    displayCountries(currentCountries)
    displaySavedCountries()
    updateDreamCount()
    clearMessage()
  } catch (error) {
    showMessage('Something went wrong. Please try again.')
  }
}

function displayCountries(countryList) {
  countriesContainer.innerHTML = ''
  countryCount.textContent = `Showing ${countryList.length} countries`

  if (countryList.length === 0) {
    countriesContainer.innerHTML = '<p>No countries found.</p>'
    return
  }

  countryList.forEach((country) => {
    const countryCard = document.createElement('article')
    countryCard.classList.add('country-card')

    countryCard.innerHTML = `
      <img src="${country.flags.png}" alt="Flag of ${country.name.common}" />

      <div class="country-card-content">
        <h3>${country.name.common}</h3>
        <p>📍 ${country.capital ? country.capital[0] : 'No capital'}</p>
        <p>🌍 ${country.region}</p>
        <button class="view-more-btn">View more</button>
      </div>
    `

    const viewMoreButton = countryCard.querySelector('.view-more-btn')

    viewMoreButton.addEventListener('click', () => {
      openCountryModal(country)
    })

    countriesContainer.appendChild(countryCard)
  })
}

function openCountryModal(country) {
  const languages = getLanguages(country)
  const currencies = getCurrencies(country)

  modalCountryDetails.innerHTML = `
    <img src="${country.flags.png}" alt="Flag of ${country.name.common}" class="modal-flag" />

    <h3>${country.name.common}</h3>

    <div class="country-info">
      <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'No capital'}</p>
      <p><strong>Region:</strong> ${country.region}</p>
      <p><strong>Languages:</strong> ${languages}</p>
      <p><strong>Currency:</strong> ${currencies}</p>
      <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
      <p><strong>Area:</strong> ${country.area.toLocaleString()} km²</p>
    </div>

    <div class="modal-actions">
      <a href="${country.maps.googleMaps}" target="_blank">Open in Google Maps</a>
      <button id="saveCountryBtn">🌴 Add to Dream Destinations</button>
    </div>
  `

  countryModal.classList.remove('hidden')

  document.querySelector('#saveCountryBtn').addEventListener('click', () => {
    saveCountry(country)
  })
}

async function searchCountry() {
  const searchValue = searchInput.value.trim()

  if (searchValue === '') {
    showMessage('Please enter a country name.')
    return
  }

  try {
    showMessage('Searching country...')

    const response = await fetch(`${API_BASE_URL}/name/${searchValue}?${API_FIELDS}`)

    if (!response.ok) {
      throw new Error('Country not found')
    }

    currentCountries = await response.json()

    displayCountries(currentCountries)
    clearMessage()
    resetFilterValues()
  } catch (error) {
    countriesContainer.innerHTML = ''
    countryCount.textContent = 'Showing 0 countries'
    showMessage('No country found. Please try another search.')
  }
}

function applyFilters() {
  let filteredCountries = [...countries]

  if (regionFilter.value !== '') {
    filteredCountries = filteredCountries.filter((country) => {
      return country.region === regionFilter.value
    })
  }

  if (languageFilter.value !== '') {
    filteredCountries = filteredCountries.filter((country) => {
      return country.languages && Object.values(country.languages).includes(languageFilter.value)
    })
  }

  currentCountries = filteredCountries
  sortCountries()
}

function sortCountries() {
  const sortedCountries = [...currentCountries]

  if (sortSelect.value === 'az') {
    sortedCountries.sort((a, b) => a.name.common.localeCompare(b.name.common))
  }

  if (sortSelect.value === 'za') {
    sortedCountries.sort((a, b) => b.name.common.localeCompare(a.name.common))
  }

  if (sortSelect.value === 'populationHigh') {
    sortedCountries.sort((a, b) => b.population - a.population)
  }

  if (sortSelect.value === 'populationLow') {
    sortedCountries.sort((a, b) => a.population - b.population)
  }

  currentCountries = sortedCountries
  displayCountries(currentCountries)
}

function populateLanguageFilter() {
  languageFilter.innerHTML = '<option value="">All languages</option>'
  const languages = []

  countries.forEach((country) => {
    if (country.languages) {
      Object.values(country.languages).forEach((language) => {
        if (!languages.includes(language)) {
          languages.push(language)
        }
      })
    }
  })

  languages.sort()

  languages.forEach((language) => {
    const option = document.createElement('option')
    option.value = language
    option.textContent = language
    languageFilter.appendChild(option)
  })
}

function saveCountry(country) {
  const alreadySaved = savedCountries.some((savedCountry) => {
    return savedCountry.name.common === country.name.common
  })

  if (alreadySaved) {
    showToast(`🌴 ${country.name.common} is already in Dream Destinations`)
    return
  }

  savedCountries.push(country)
  updateLocalStorage()
  displaySavedCountries()
  updateDreamCount()
  showToast(`🌴 ${country.name.common} added to Dream Destinations`)
}

function displaySavedCountries() {
  savedCountriesContainer.innerHTML = ''

  if (savedCountries.length === 0) {
    savedCountriesContainer.innerHTML = '<p>No dream destinations yet.</p>'
    return
  }

  savedCountries.forEach((country) => {
    const savedCard = document.createElement('div')
    savedCard.classList.add('saved-country-card')

    savedCard.innerHTML = `
      <img src="${country.flags.png}" alt="Flag of ${country.name.common}" />
      <span>${country.name.common}</span>
      <button class="view-saved-btn">View</button>
      <button class="remove-btn">Remove</button>
    `

    savedCard.querySelector('.view-saved-btn').addEventListener('click', () => {
      closeDreamDrawer()
      openCountryModal(country)
    })

    savedCard.querySelector('.remove-btn').addEventListener('click', () => {
      removeSavedCountry(country.name.common)
    })

    savedCountriesContainer.appendChild(savedCard)
  })
}

function removeSavedCountry(countryName) {
  savedCountries = savedCountries.filter((country) => {
    return country.name.common !== countryName
  })

  updateLocalStorage()
  displaySavedCountries()
  updateDreamCount()
  showToast(`${countryName} removed from Dream Destinations`)
}

function updateLocalStorage() {
  localStorage.setItem('savedCountries', JSON.stringify(savedCountries))
}

function updateDreamCount() {
  dreamCount.textContent = savedCountries.length
}

function getLanguages(country) {
  return country.languages ? Object.values(country.languages).join(', ') : 'No information'
}

function getCurrencies(country) {
  if (!country.currencies) {
    return 'No information'
  }

  return Object.values(country.currencies)
    .map((currency) => currency.name)
    .join(', ')
}

function showMessage(text) {
  message.textContent = text
}

function clearMessage() {
  message.textContent = ''
}

function showToast(text) {
  toast.textContent = text
  toast.classList.remove('hidden')

  setTimeout(() => {
    toast.classList.add('hidden')
  }, 2500)
}

function openDreamDrawer() {
  dreamDrawer.classList.remove('hidden')
  drawerOverlay.classList.remove('hidden')
}

function closeDreamDrawer() {
  dreamDrawer.classList.add('hidden')
  drawerOverlay.classList.add('hidden')
}

function resetFilterValues() {
  regionFilter.value = ''
  languageFilter.value = ''
  sortSelect.value = ''
}

function resetApp() {
  searchInput.value = ''
  resetFilterValues()
  clearMessage()

  currentCountries = [...countries]
  displayCountries(currentCountries)
}

searchBtn.addEventListener('click', searchCountry)

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchCountry()
  }
})

regionFilter.addEventListener('change', applyFilters)
languageFilter.addEventListener('change', applyFilters)
sortSelect.addEventListener('change', sortCountries)
resetBtn.addEventListener('click', resetApp)

closeModalBtn.addEventListener('click', () => {
  countryModal.classList.add('hidden')
})

countryModal.addEventListener('click', (event) => {
  if (event.target === countryModal) {
    countryModal.classList.add('hidden')
  }
})

dreamBtn.addEventListener('click', openDreamDrawer)
closeDrawerBtn.addEventListener('click', closeDreamDrawer)
drawerOverlay.addEventListener('click', closeDreamDrawer)

fetchCountries()