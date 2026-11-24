const API_URL = 'https://music-dairy-api-gormikmusic.msk1.amvera.tech/api';

const FALLBACK_COVER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">' +
            '<rect width="300" height="300" fill="#2a2a2a"/>' +
            '<circle cx="150" cy="150" r="85" fill="#444"/>' +
            '<circle cx="150" cy="150" r="25" fill="#2a2a2a"/>' +
        '</svg>'
    );

// Получаем контейнер для вывода
const detailsContainer = document.getElementById('review-details');

// Функция для получения ID из URL (например, ?id=101)
function getReviewIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadReviewDetails() {
    const reviewId = getReviewIdFromUrl();

    if (!reviewId) {
        detailsContainer.innerHTML = '<p style="color: red;">Ошибка: ID рецензии не найден в ссылке.</p>';
        return;
    }

    try {
        // 1. Запрашиваем отзыв по ID
        const reviewRes = await fetch(`${API_URL}/reviews/${encodeURIComponent(reviewId)}`);
        if (!reviewRes.ok) throw new Error('Рецензия не найдена');
        const review = await reviewRes.json();

        // 2. Запрашиваем альбом, к которому относится отзыв
        const albumId = review.album_id ?? review.albumId ?? review.album?.id;
        let album = review.album && typeof review.album === 'object' ? review.album : null;

        if (!album && albumId !== undefined && albumId !== null) {
            const albumRes = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}`);
            if (!albumRes.ok) throw new Error('Альбом не найден');
            album = await albumRes.json();
        }

        if (!album) {
            album = {
                title: review.albumTitle || 'Неизвестный альбом',
                artist: 'Неизвестен',
                genre: 'Не указан',
                cover_url: ''
            };
        }

        // 3. Отрисовываем страницу
        const coverUrl = album.cover_url || FALLBACK_COVER;

        detailsContainer.innerHTML = `
            <div class="detail-card">
                <img src="${coverUrl}" alt="${album.title}" class="detail-cover" onerror="this.onerror=null;this.src='${FALLBACK_COVER}';">
                <div class="detail-info">
                    <h1 class="detail-title">${album.title}</h1>
                    <p class="detail-artist">Исполнитель: ${album.artist || 'Неизвестен'}</p>
                    <p class="detail-genre">Жанр: ${album.genre || 'Не указан'}</p>
                    <div class="detail-rating">Оценка: <span>${review.rating}</span></div>
                    
                    <hr class="detail-divider">
                    
                    <p class="detail-author">Автор рецензии: <strong>${review.author}</strong></p>
                    <p class="detail-date">Дата: ${review.created_at}</p>
                    <p class="detail-text">${review.text}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        detailsContainer.innerHTML = '<p style="color: red;">Не удалось загрузить рецензию. Проверь, запущен ли сервер.</p>';
    }
}

loadReviewDetails();
