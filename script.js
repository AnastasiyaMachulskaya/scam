/* ╔══════════════════════════════════════════════════════════════╗
   ║  ПОЗДРАВИТЕЛЬНЫЙ САЙТ — СКРИПТ                              ║
   ╚══════════════════════════════════════════════════════════════╝

   Структура:
   1. Ссылки на DOM-элементы
   2. Состояние приложения
   3. Модуль: Музыка
   4. Модуль: Плавающие CSS-котики (запасной фон)
   5. Модуль: Конфетти
   6. Модуль: Анимация конверта
   7. Инициализация
*/

'use strict';

/* ════════════════════════════════════════════════════
   1. DOM-ЭЛЕМЕНТЫ
════════════════════════════════════════════════════ */

const elAudio    = document.getElementById('audio');
const elHint     = document.getElementById('hint');
const elEnvelope = document.getElementById('envelope');
const elBanknote = document.getElementById('banknote');
const elBirthday = document.getElementById('birthday');

/* ════════════════════════════════════════════════════
   2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
════════════════════════════════════════════════════ */

const state = {
  envelopeOpen : false, // Открыт ли конверт (защита от повторного запуска)
  musicPlaying : false,
  musicStartInProgress : false,
  musicUnlockBound : false,
};

/* ════════════════════════════════════════════════════
   3. МОДУЛЬ: МУЗЫКА
   Стратегия: сначала пробуем autoplay при загрузке страницы.
   Если браузер заблокировал (что обычно и происходит) — запускаем
   музыку при первом взаимодействии со страницей без отдельной кнопки.
════════════════════════════════════════════════════ */

/**
 * События, которыми браузер обычно "разблокирует" воспроизведение звука.
 */
const MUSIC_UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'keydown'];

/**
 * Проверяет, есть ли у audio реальный источник для воспроизведения.
 */
function hasAudioSource() {
  if (!elAudio) return false;

  return Boolean(
    elAudio.currentSrc
    || elAudio.getAttribute('src')
    || elAudio.querySelector('source')
  );
}

/**
 * Снимает fallback-слушатели, когда музыка уже успешно пошла.
 */
function unbindMusicUnlockFallback() {
  if (!state.musicUnlockBound) return;

  for (const eventName of MUSIC_UNLOCK_EVENTS) {
    document.removeEventListener(eventName, handleFirstUserGesture, true);
  }

  state.musicUnlockBound = false;
}

/**
 * Запускает музыку.
 * silent=true используется для первичной autoplay-попытки без лишних предупреждений.
 */
async function playMusic({ silent = false } = {}) {
  if (!hasAudioSource()) return false;
  if (state.musicPlaying) return true;
  if (state.musicStartInProgress) return false;

  state.musicStartInProgress = true;

  try {
    await elAudio.play();
    state.musicPlaying = true;
    unbindMusicUnlockFallback();
    return true;
  } catch (err) {
    if (!silent) {
      console.warn('[🎵] Не удалось воспроизвести:', err.message);
    }

    return false;
  } finally {
    state.musicStartInProgress = false;
  }
}

/**
 * Пробует автозапуск при загрузке страницы.
 * Если браузер без жеста пользователя блокирует звук, подключаем fallback
 * и повторяем запуск на первом действии пользователя где угодно на странице.
 */
async function tryAutoplay() {
  const started = await playMusic({ silent: true });

  if (!started) {
    bindMusicUnlockFallback();
  }
}

/**
 * Ещё одна тихая попытка autoplay в моменты, когда браузер может уже разрешить старт.
 */
function retryAutoplaySilently() {
  void playMusic({ silent: true });
}

/**
 * Вешает одноразовый "разблокировщик" музыки на первое взаимодействие.
 */
function bindMusicUnlockFallback() {
  if (state.musicUnlockBound || state.musicPlaying) return;

  for (const eventName of MUSIC_UNLOCK_EVENTS) {
    document.addEventListener(eventName, handleFirstUserGesture, true);
  }

  state.musicUnlockBound = true;
}

/**
 * Первый пользовательский жест после заблокированного autoplay.
 */
function handleFirstUserGesture() {
  void playMusic();
}

/* ════════════════════════════════════════════════════
   4. МОДУЛЬ: ПЛАВАЮЩИЕ CSS-КОТИКИ
   Создаём котиков-эмодзи на фоне как запасной вариант —
   работают всегда, даже если GIF Giphy не загрузился.
════════════════════════════════════════════════════ */

/**
 * Создаёт и добавляет в фон заданное количество котиков-эмодзи
 * с разными позициями, размерами и скоростями анимации.
 */
function createFloatingCats() {
  const EMOJIS = ['🐱', '🐈', '😺', '😸', '🐾', '😻', '🐈‍⬛'];
  // Меньше котиков на мобильных — меньше нагрузка
  const COUNT  = window.innerWidth < 600 ? 8 : 14;
  const bgEl   = document.getElementById('bg');

  for (let i = 0; i < COUNT; i++) {
    const cat = document.createElement('span');
    cat.className   = 'cat-float';
    cat.textContent = EMOJIS[i % EMOJIS.length];
    cat.setAttribute('aria-hidden', 'true');

    // Случайные параметры для каждого котика
    const size  = 20 + Math.random() * 28;            // размер 20–48px
    const left  = (Math.random() * 96).toFixed(1);    // позиция по X
    const top   = (Math.random() * 90).toFixed(1);    // позиция по Y
    const dur   = (3.5 + Math.random() * 5).toFixed(2); // длительность 3.5–8.5s
    // Отрицательная задержка = котик уже в середине своего цикла при загрузке
    const delay = -(Math.random() * 6).toFixed(2);

    cat.style.cssText = [
      `left: ${left}%`,
      `top: ${top}%`,
      `font-size: ${size}px`,
      `animation-duration: ${dur}s`,
      `animation-delay: ${delay}s`,
    ].join('; ');

    bgEl.appendChild(cat);
  }
}

/* ════════════════════════════════════════════════════
   5. МОДУЛЬ: КОНФЕТТИ
════════════════════════════════════════════════════ */

/**
 * Запускает праздничное конфетти в три залпа:
 * слева, справа и из центра.
 *
 * На мобильных снижаем количество частиц для плавности.
 */
function launchConfetti() {
  // Проверяем, загружена ли библиотека
  if (typeof confetti !== 'function') {
    console.warn('[🎊] canvas-confetti не загружен. Конфетти пропускается.');
    return;
  }

  const isMobile  = window.innerWidth < 600;
  const baseCount = isMobile ? 65 : 150;

  // Праздничная палитра цветов
  const palette = [
    '#ff6b6b', '#ffd166', '#06d6a0',
    '#118ab2', '#9b5de5', '#f15bb5',
    '#ffffff', '#ffeb3b', '#ff9f43',
  ];

  // Общие параметры для всех залпов
  const shared = {
    colors  : palette,
    scalar  : isMobile ? 0.82 : 1.08,
    gravity : 0.75,
    ticks   : isMobile ? 140 : 240,
  };

  // Залп 1: из левого края
  confetti({
    ...shared,
    particleCount : baseCount,
    angle         : 60,
    spread        : 62,
    origin        : { x: 0.0, y: 0.55 },
    drift         : 0.5,
  });

  // Залп 2: из правого края (одновременно с первым)
  confetti({
    ...shared,
    particleCount : baseCount,
    angle         : 120,
    spread        : 62,
    origin        : { x: 1.0, y: 0.55 },
    drift         : -0.5,
  });

  // Залп 3: из центра, с задержкой 350ms
  setTimeout(() => {
    confetti({
      ...shared,
      particleCount : Math.round(baseCount * 0.65),
      spread        : 105,
      origin        : { x: 0.5, y: 0.60 },
      startVelocity : 28,
    });
  }, 350);
}

/* ════════════════════════════════════════════════════
   6. МОДУЛЬ: АНИМАЦИЯ КОНВЕРТА
════════════════════════════════════════════════════ */

/**
 * Анимирует вылет купюры из конверта вверх.
 */
function showBanknote() {
  elBanknote.setAttribute('aria-hidden', 'false');
  elBanknote.classList.add('is-rising');

  /*
    После завершения CSS-анимации фиксируем купюру в конечном положении.
    Это предотвращает "прыжок" купюры обратно в исходную позицию.
    { once: true } — слушатель автоматически удаляется после первого вызова.
  */
  elBanknote.addEventListener('animationend', (e) => {
    // Игнорируем события от других возможных анимаций
    if (e.animationName !== 'banknoteRise') return;
    elBanknote.classList.remove('is-rising');
    elBanknote.classList.add('is-risen');
  }, { once: true });
}

/**
 * Показывает поздравительный текст с анимацией появления.
 */
function showBirthdayText() {
  elBirthday.classList.add('is-visible');
}

/**
 * Главный обработчик нажатия на конверт.
 * Запускает цепочку: тряска → открытие → конфетти → купюра → текст.
 *
 * Защищён от повторного запуска флагом state.envelopeOpen.
 */
function handleEnvelopeClick() {
  // Защита: конверт открывается только один раз
  if (state.envelopeOpen) return;
  state.envelopeOpen = true;

  // Скрываем подсказку
  elHint.classList.add('is-hidden');

  // ШАГ 1: Встряхиваем конверт (анимация 0.4s)
  elEnvelope.classList.add('is-shaking');

  setTimeout(() => {
    // Убираем класс тряски (чтобы анимацию можно было запустить снова
    // если бы это требовалось — на случай рефакторинга)
    elEnvelope.classList.remove('is-shaking');

    // ШАГ 2: Открываем клапан (CSS-анимация 0.9s)
    elEnvelope.classList.add('is-opened');

    // ШАГ 3: Конфетти — через 650ms (пока клапан ещё открывается)
    setTimeout(launchConfetti, 650);

    // ШАГ 4: Купюра вылетает — через 800ms
    setTimeout(showBanknote, 800);

    // ШАГ 5: Поздравительный текст — через 1900ms
    setTimeout(showBirthdayText, 1900);

  }, 400); // 400ms = длительность анимации тряски
}

/* ════════════════════════════════════════════════════
   Обработчики событий конверта
════════════════════════════════════════════════════ */

// Клик мышью или тап пальцем
elEnvelope.addEventListener('click', handleEnvelopeClick);

// Активация с клавиатуры (Enter или Пробел — стандарт для role="button")
elEnvelope.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); // Предотвращаем прокрутку страницы на Пробел
    handleEnvelopeClick();
  }
});

/* ════════════════════════════════════════════════════
   7. ИНИЦИАЛИЗАЦИЯ
════════════════════════════════════════════════════ */

function init() {
  // Создаём CSS-котиков на фоне (работают даже если GIF не загрузился)
  createFloatingCats();

  // Явно просим браузер начать загрузку аудио как можно раньше
  elAudio.load();

  // Пробуем автоматически запустить музыку
  void tryAutoplay();

  // Несколько дополнительных ранних попыток для браузеров,
  // которые разрешают autoplay не сразу на первом тике.
  elAudio.addEventListener('loadeddata', retryAutoplaySilently, { once: true });
  elAudio.addEventListener('canplay', retryAutoplaySilently, { once: true });
  window.addEventListener('load', retryAutoplaySilently, { once: true });
  window.addEventListener('pageshow', retryAutoplaySilently, { once: true });
}

// Запускаем после полной загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM уже готов (скрипт подключён в конце body)
  init();
}
