const form = document.getElementById('addReviewForm');
const ratingRange = document.getElementById('ratingRange');
const ratingValue = document.getElementById('ratingValue');

// Находим поля, которые будем проверять
const albumTitleInput = document.getElementById('albumTitle');
const reviewTextInput = document.getElementById('reviewText');

// 1. Обновляем цифру при движении ползунка
ratingRange.addEventListener('input', () => {
    ratingValue.textContent = ratingRange.value;
});

// 2. Убираем красную рамку, как только пользователь начинает печатать
albumTitleInput.addEventListener('input', () => {
    albumTitleInput.classList.remove('input-error');
});
reviewTextInput.addEventListener('input', () => {
    reviewTextInput.classList.remove('input-error');
});


// 3. Обработка отправки формы
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Останавливаем перезагрузку страницы

    let isValid = true; // Флаг: true = всё хорошо, false = есть ошибки

    // Проверяем название альбома (trim() убирает пробелы по краям)
    if (albumTitleInput.value.trim() === '') {
        albumTitleInput.classList.add('input-error'); // Добавляем класс для красной рамки
        isValid = false;
    }

    // Проверяем текст обзора
    if (reviewTextInput.value.trim() === '') {
        reviewTextInput.classList.add('input-error');
        isValid = false;
    }

    // Если есть ошибки, останавливаем отправку
    if (!isValid) {
        return; 
    }

    // Если всё ок — собираем данные
    const albumTitle = albumTitleInput.value;
    const genre = document.getElementById('genre').value || "Неизвестен";
    const rating = ratingRange.value;
    const reviewText = reviewTextInput.value;
    const author = "Аноним"; // Пока без автора

    try {
        // ШАГ 1: Создаем новый альбом
        const albumResponse = await fetch('http://localhost:3001/albums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: albumTitle,
                artist: "Неизвестный исполнитель",
                release_year: 2026,
                genre: genre,
                cover_url: "https://example.com",
                rating_average: parseInt(rating)
            })
        });

        const newAlbum = await albumResponse.json(); // Получаем ID нового альбома

        // ШАГ 2: Создаем отзыв, привязанный к новому альбому
        const reviewResponse = await fetch('http://localhost:3001/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                album_id: newAlbum.id, // Берем ID, который выдал сервер
                author: author,
                rating: parseInt(rating),
                text: reviewText,
                created_at: new Date().toISOString().split('T')[0]
            })
        });

        if (reviewResponse.ok) {
            alert('Рецензия успешно опубликована!');
            window.location.href = 'index.html'; // Пока перекидываем на главную
        } else {
            alert('Ошибка при создании рецензии.');
        }

    } catch (error) {
        console.error('Ошибка:', error);
        alert('Сервер не отвечает. Запущен ли json-server?');
    }
});