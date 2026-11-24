// ==========================================
// КОНФИГУРАЦИЯ API И ЗАГЛУШКА ОБЛОЖКИ
// ==========================================
const API_BASE = 'https://music-dairy-api-gormikmusic.msk1.amvera.tech/api';

const FALLBACK_COVER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
            '<rect width="120" height="120" fill="#2a2a2a"/>' +
            '<circle cx="60" cy="60" r="34" fill="#444"/>' +
            '<circle cx="60" cy="60" r="10" fill="#2a2a2a"/>' +
        '</svg>'
    );

function isValidImageUrl(rawUrl) {
    const value = String(rawUrl ?? '').trim();
    if (!value) return true;
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}


// ==========================================
// TOAST-УВЕДОМЛЕНИЯ
// ==========================================
function getToastContainer() {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

function showToast(message, type = 'success', duration = 3000) {
    const toastContainer = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✓' : '✕';

    const text = document.createElement('span');
    text.textContent = message;

    toast.append(icon, text);
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    const removeToast = () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    };

    toast.addEventListener('click', removeToast);
    setTimeout(removeToast, duration);
}


// ==========================================
// 1. ЗАГРУЗКА И ОТРИСОВКА КАРТОЧЕК
// ==========================================
const container = document.getElementById('reviews-container');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

let allAlbums = [];
let allReviews = [];

function createReviewCard({ id, albumTitle, coverUrl, rating, author, text }) {
    const card = document.createElement('article');
    card.className = 'review-card';

    const safeId = encodeURIComponent(id ?? '');
    const imgSrc = coverUrl && isValidImageUrl(coverUrl) ? escapeHtml(coverUrl) : FALLBACK_COVER;

    card.innerHTML = `
        <img src="${imgSrc}" alt="${escapeHtml(albumTitle)}" class="album-cover" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';">
        <div class="card-header">
            <h3 class="album-title">${escapeHtml(albumTitle)}</h3>
            <span class="rating">${escapeHtml(rating)}</span>
        </div>
        <p class="review-text"><strong>${escapeHtml(author)}:</strong> ${escapeHtml(text)}</p>
        <a href="review.html?id=${safeId}" class="btn-details">Подробнее</a>
    `;
    return card;
}

async function loadData() {
    if (!container) return;

    try {
        const [albumsRes, reviewsRes] = await Promise.all([
            fetch(`${API_BASE}/albums`),
            fetch(`${API_BASE}/reviews`)
        ]);

        if (!albumsRes.ok || !reviewsRes.ok) {
            throw new Error('Ошибка ответа сервера');
        }

        allAlbums = await albumsRes.json();
        allReviews = await reviewsRes.json();
        renderReviews();
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Ошибка загрузки. Сервер запущен?</p>';
    }
}

function renderReviews() {
    if (!container) return;

    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sortValue = sortSelect ? sortSelect.value : 'default';

    const filteredReviews = allReviews.filter(review => {
        const album = allAlbums.find(a => String(a.id) === String(review.album_id));
        const albumTitle = album && album.title ? album.title.toLowerCase() : '';
        const author = review.author ? review.author.toLowerCase() : '';
        const text = review.text ? review.text.toLowerCase() : '';
        return (
            albumTitle.includes(searchText) ||
            author.includes(searchText) ||
            text.includes(searchText)
        );
    });

    const sortedReviews = [...filteredReviews];

    if (sortValue === 'rating-high') {
        sortedReviews.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortValue === 'rating-low') {
        sortedReviews.sort((a, b) => Number(a.rating) - Number(b.rating));
    } else if (sortValue === 'date-new') {
        sortedReviews.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortValue === 'date-old') {
        sortedReviews.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortValue === 'title') {
        sortedReviews.sort((a, b) => {
            const albumA = allAlbums.find(alb => String(alb.id) === String(a.album_id));
            const albumB = allAlbums.find(alb => String(alb.id) === String(b.album_id));
            const titleA = albumA && albumA.title ? albumA.title : '';
            const titleB = albumB && albumB.title ? albumB.title : '';
            return titleA.localeCompare(titleB, 'ru');
        });
    }

    container.innerHTML = '';
    if (sortedReviews.length === 0) {
        container.innerHTML = '<p style="color: #aaa;">Ничего не найдено :(</p>';
        return;
    }

    sortedReviews.forEach(review => {
        const album = allAlbums.find(a => String(a.id) === String(review.album_id));
        const albumTitle = album && album.title ? album.title : 'Неизвестный альбом';
        const coverUrl = album ? album.cover_url : '';

        const card = createReviewCard({
            id: review.id,
            albumTitle,
            coverUrl,
            rating: review.rating,
            author: review.author || 'Аноним',
            text: review.text
        });
        container.appendChild(card);
    });
}

if (searchInput) searchInput.addEventListener('input', renderReviews);
if (sortSelect) sortSelect.addEventListener('change', renderReviews);
loadData();


// ==========================================
// 2. МОДАЛЬНОЕ ОКНО И ПРЕВЬЮ ОБЛОЖКИ
// ==========================================
const modalOverlay = document.getElementById('modalOverlay');
const btnAdd = document.getElementById('btnAdd');
const modalClose = document.getElementById('modalClose');
const btnCancel = document.getElementById('btnCancel');
const coverUrlInput = document.getElementById('coverUrl');
const coverPreview = document.getElementById('coverPreview');

function resetCoverPreview() {
    if (!coverPreview) return;
    coverPreview.style.display = 'none';
    coverPreview.removeAttribute('src');
}

function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('active');
}

if (btnAdd && modalOverlay) {
    btnAdd.addEventListener('click', () => modalOverlay.classList.add('active'));
}
if (modalClose) modalClose.addEventListener('click', closeModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);

if (coverUrlInput && coverPreview) {
    coverUrlInput.addEventListener('input', () => {
        const url = coverUrlInput.value.trim();
        coverUrlInput.classList.remove('input-error');

        if (!url || !isValidImageUrl(url)) {
            resetCoverPreview();
            return;
        }

        coverPreview.style.display = 'block';
        coverPreview.src = url;
        coverPreview.onerror = () => {
            coverPreview.src = FALLBACK_COVER;
        };
    });
}


// ==========================================
// 3. ОТПРАВКА ФОРМЫ
// ==========================================
const form = document.getElementById('addReviewForm');
const ratingRange = document.getElementById('ratingRange');
const ratingValue = document.getElementById('ratingValue');

if (ratingRange && ratingValue) {
    ratingRange.addEventListener('input', () => {
        ratingValue.textContent = ratingRange.value;
    });
}

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const albumTitle = document.getElementById('albumTitle');
        const genreInput = document.getElementById('genre');
        const reviewText = document.getElementById('reviewText');
        const coverUrl = document.getElementById('coverUrl');
        const authorInput = document.getElementById('authorName'); // Поле автора

        let isValid = true;

        if (!albumTitle.value.trim()) {
            albumTitle.classList.add('input-error');
            isValid = false;
        } else {
            albumTitle.classList.remove('input-error');
        }

        if (!reviewText.value.trim()) {
            reviewText.classList.add('input-error');
            isValid = false;
        } else {
            reviewText.classList.remove('input-error');
        }

        const coverRaw = coverUrl ? coverUrl.value.trim() : '';
        if (coverUrl && coverRaw !== '' && !isValidImageUrl(coverRaw)) {
            coverUrl.classList.add('input-error');
            isValid = false;
        } else if (coverUrl) {
            coverUrl.classList.remove('input-error');
        }

        if (!isValid) return;

        try {
            const ratingNum = parseInt(ratingRange.value, 10);
            const titleVal = albumTitle.value.trim();
            const textVal = reviewText.value.trim();
            const genreVal = genreInput && genreInput.value.trim() ? genreInput.value.trim() : 'Неизвестен';
            const coverVal = coverRaw || FALLBACK_COVER;
            // Берем имя из поля или ставим Аноним
            const authorVal = authorInput && authorInput.value.trim() ? authorInput.value.trim() : 'Аноним';

            const albumRes = await fetch(`${API_BASE}/albums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: titleVal,
                    artist: 'Неизвестный',
                    genre: genreVal,
                    cover_url: coverVal,
                    rating_average: ratingNum
                })
            });

            if (!albumRes.ok) throw new Error('Ошибка создания альбома');
            const newAlbum = await albumRes.json();

            const reviewRes = await fetch(`${API_BASE}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    album_id: newAlbum.id,
                    author: authorVal, // Отправляем имя
                    rating: ratingNum,
                    text: textVal,
                    created_at: new Date().toISOString().split('T')[0]
                })
            });

            if (!reviewRes.ok) throw new Error('Ошибка создания рецензии');
            const createdReview = await reviewRes.json();

            allAlbums.push(newAlbum);
            allReviews.unshift(createdReview);

            const card = createReviewCard({
                id: createdReview.id,
                albumTitle: titleVal,
                coverUrl: newAlbum.cover_url || coverVal,
                rating: ratingNum,
                author: authorVal, // Показываем имя
                text: textVal
            });
            container.prepend(card);

            form.reset();
            resetCoverPreview();
            if (ratingValue) ratingValue.textContent = '5';
            closeModal();
            showToast('Рецензия сохранена', 'success');
        } catch (e) {
            console.error(e); // Выводим ошибку в консоль для отладки
            showToast('Внутренняя ошибка', 'error');
        }
    });
}