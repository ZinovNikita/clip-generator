# Описание
Генерация видео клипа из коротких случайных сегментов.
Используется ffmpeg для разбиения видео на сегменты и объединения сегментов в случайном порядке.

# Команды
    npm run split <rootDir>
        вырезает видео на секундные сегменты, с шагом 10 секунд
    npm run merge <rootDir> <clipCount> <clipDuration>
        генерирует видео из мелких случайных сегментов, накладывает музыку и закадровый текст
# Структура rootDir
    $/input - Папка с видео, которые необходимо нарезать
    $/segments - Папка в которую будут сохранятся короткие видео
    $/audio - Папка с музыкой
    $/voice - Папка с закадровым текстом (в моем случае это было нужно)
    $/results - Готовое видео