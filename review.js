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
        const reviewRes = await fetch(`http://localhost:3001/reviews/${reviewId}`);
        if (!reviewRes.ok) throw new Error('Рецензия не найдена');
        const review = await reviewRes.json();

        // 2. Запрашиваем альбом, к которому относится отзыв
        const albumRes = await fetch(`http://localhost:3001/albums/${review.album_id}`);
        const album = await albumRes.json();

        // 3. Отрисовываем страницу
        // Используем заглушку, если нет картинки
        const coverUrl = album.cover_url || 'https://via.placeholder.com/300x300?text=No+Image';

        detailsContainer.innerHTML = `
            <div class="detail-card">
                <img src="${coverUrl}" alt="${album.title}" class="detail-cover">
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