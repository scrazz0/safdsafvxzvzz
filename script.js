// script.js

// Интеграция с Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Данные (симуляция, в реальности fetch с бэкенда)
let listings = []; // Опубликованные объявления
let pendingListings = []; // Ожидающие
let currentUser = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'guest'; // ID пользователя из Telegram
let language = 'ru'; // По умолчанию русский
let theme = 'dark'; // По умолчанию тёмная

// Категории перевода
const translations = {
    ru: {
        welcome: 'Добро пожаловать в СКР БАРАХОЛКА',
        addListing: 'Добавить объявление',
        // Добавьте больше переводов
    },
    uk: {
        welcome: 'Ласкаво просимо до СКР БАРАХОЛКА',
        addListing: 'Додати оголошення',
        // Добавьте больше
    }
};

// Функция рендера объявлений
function renderListings(container, data) {
    container.innerHTML = '';
    data.forEach(listing => {
        const card = document.createElement('div');
        card.classList.add('listing-card');
        card.innerHTML = `
            <img src="${listing.images[0]}" alt="${listing.title}">
            <h3>${listing.title}</h3>
            <p>${listing.price} грн</p>
            <p class="green-text">${listing.city}</p>
        `;
        card.addEventListener('click', () => showListingModal(listing));
        container.appendChild(card);
    });
}

// Показ модального окна объявления
function showListingModal(listing) {
    document.getElementById('modal-title').textContent = listing.title;
    document.getElementById('modal-description').textContent = listing.description;
    document.getElementById('modal-price').textContent = `${listing.price} грн`;
    document.getElementById('modal-city').textContent = listing.city;
    const imagesDiv = document.getElementById('modal-images');
    imagesDiv.innerHTML = '';
    listing.images.forEach(img => {
        const image = document.createElement('img');
        image.src = img;
        imagesDiv.appendChild(image);
    });
    document.getElementById('listing-modal').style.display = 'block';

    // Кнопка контакта - отправка сообщения через Telegram Bot
    document.getElementById('contact-seller').onclick = () => {
        // Здесь вызов API бэкенда для отправки сообщения в Telegram продавцу
        fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerId: listing.userId, message: 'Интересуюсь вашим объявлением!', from: currentUser })
        });
        alert('Сообщение отправлено в Telegram!');
    };
}

// Закрытие модальных
document.querySelectorAll('.close').forEach(close => {
    close.addEventListener('click', () => {
        close.parentElement.parentElement.style.display = 'none';
    });
});

// Смена темы
document.getElementById('theme-toggle').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
});

// Смена языка
document.getElementById('language-select').addEventListener('change', (e) => {
    language = e.target.value;
    updateLanguage();
});

function updateLanguage() {
    document.querySelector('h1').textContent = translations[language].welcome;
    // Обновите другие тексты
}

// Навигация
document.getElementById('home-btn').addEventListener('click', () => switchPage('main-page'));
document.getElementById('categories-btn').addEventListener('click', () => switchPage('categories-page'));
document.getElementById('admin-btn').addEventListener('click', () => switchPage('admin-panel'));

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (pageId === 'main-page') document.getElementById('home-btn').classList.add('active');
    if (pageId === 'categories-page') document.getElementById('categories-btn').classList.add('active');
}

// Добавление объявления
document.getElementById('add-listing-btn').addEventListener('click', () => {
    document.getElementById('add-listing-modal').style.display = 'block';
});

document.getElementById('submit-listing').addEventListener('click', async () => {
    const title = document.getElementById('new-title').value;
    const category = document.getElementById('new-category').value;
    const price = document.getElementById('new-price').value;
    const description = document.getElementById('new-description').value;
    const city = document.getElementById('new-city').value;
    const images = document.getElementById('new-images').files;

    // Загрузка изображений (в реальности на сервер)
    const imageUrls = []; // Симуляция
    for (let file of images) {
        imageUrls.push(URL.createObjectURL(file)); // Для локального предпросмотра
    }

    // Отправка на бэкенд
    await fetch('/api/submit-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, price, description, city, images: imageUrls, userId: currentUser })
    });
    alert('Объявление отправлено на рассмотрение!');
    document.getElementById('add-listing-modal').style.display = 'none';
});

// Админ логин
const ADMIN_PASSWORD = '44335S';
document.getElementById('admin-login').addEventListener('click', () => {
    if (document.getElementById('admin-password').value === ADMIN_PASSWORD) {
        document.getElementById('pending-listings').style.display = 'block';
        loadPendingListings();
    } else {
        alert('Неверный пароль!');
    }
});

async function loadPendingListings() {
    const response = await fetch('/api/pending-listings');
    pendingListings = await response.json();
    renderListings(document.getElementById('pending-listings'), pendingListings);
    // Добавьте кнопки одобрения/отклонения для каждого
}

// Фильтры
document.getElementById('apply-filters').addEventListener('click', async () => {
    const search = document.getElementById('search-input').value;
    const city = document.getElementById('city-select').value;
    const minPrice = document.getElementById('price-min').value;
    const maxPrice = document.getElementById('price-max').value;

    const response = await fetch(`/api/listings?search=${search}&city=${city}&minPrice=${minPrice}&maxPrice=${maxPrice}`);
    listings = await response.json();
    renderListings(document.getElementById('listings'), listings);
});

// Категории
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const category = e.target.dataset.category;
        const response = await fetch(`/api/listings?category=${category}`);
        listings = await response.json();
        renderListings(document.getElementById('category-listings'), listings);
    });
});

// Инициализация
async function init() {
    const response = await fetch('/api/listings');
    listings = await response.json();
    renderListings(document.getElementById('listings'), listings);
}

init();