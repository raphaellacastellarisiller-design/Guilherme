(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Config                                                              */
  /* ------------------------------------------------------------------ */
  var WHATSAPP_NUMBER = '5528999747063';
  var TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  var SERVICE_LABELS = {
    'lavagem-completa': 'Lavagem Completa',
    'higienizacao-interna': 'Higienização Interna',
    'polimento-tecnico': 'Polimento Técnico',
    'vitrificacao-2anos': 'Vitrificação 2 Anos',
    'vitrificacao-5anos': 'Vitrificação 5 Anos',
    'cristalizacao-pintura': 'Cristalização de Pintura',
    'cristalizacao-vidros': 'Cristalização dos Vidros',
    'restauracao-farois': 'Restauração dos Faróis'
  };

  var WEEKDAY_LABELS_FULL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var MONTH_LABELS_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var state = {
    service: null,       // service id
    calendarMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    selectedDate: null,  // Date object (midnight)
    selectedTime: null   // 'HH:00'
  };

  /* ------------------------------------------------------------------ */
  /* Service tiles (step 1)                                              */
  /* ------------------------------------------------------------------ */
  var serviceTilesEl = document.getElementById('serviceTiles');

  function selectService(serviceId) {
    state.service = serviceId;
    Array.prototype.forEach.call(serviceTilesEl.querySelectorAll('.service-tile'), function (tile) {
      var pressed = tile.getAttribute('data-service') === serviceId;
      tile.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
    updateSummary();
  }

  if (serviceTilesEl) {
    Array.prototype.forEach.call(serviceTilesEl.querySelectorAll('.service-tile'), function (tile) {
      tile.addEventListener('click', function () {
        selectService(tile.getAttribute('data-service'));
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.js-agendar-servico'), function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.service-card');
      var serviceId = card ? card.getAttribute('data-service') : null;
      if (serviceId) {
        // service tiles only include a subset; add the label even if there's no matching tile
        if (serviceTilesEl && serviceTilesEl.querySelector('[data-service="' + serviceId + '"]')) {
          selectService(serviceId);
        } else {
          state.service = serviceId;
          updateSummary();
        }
      }
      var target = document.getElementById('agendamento');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Calendar (step 2)                                                    */
  /* ------------------------------------------------------------------ */
  var calMonthLabel = document.getElementById('calMonthLabel');
  var calDaysEl = document.getElementById('calDays');
  var calPrevBtn = document.getElementById('calPrev');
  var calNextBtn = document.getElementById('calNext');

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function renderCalendar() {
    var year = state.calendarMonth.getFullYear();
    var month = state.calendarMonth.getMonth();

    calMonthLabel.textContent = MONTH_LABELS_FULL[month] + ' de ' + year;

    var firstOfMonth = new Date(year, month, 1);
    var startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    calDaysEl.innerHTML = '';

    for (var i = 0; i < startOffset; i++) {
      var empty = document.createElement('span');
      empty.className = 'calendar__day calendar__day--empty';
      calDaysEl.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(year, month, d);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar__day';
      btn.textContent = String(d);
      btn.setAttribute('role', 'gridcell');

      if (date < today) {
        btn.disabled = true;
      }
      if (isSameDay(date, today)) {
        btn.classList.add('calendar__day--today');
      }
      if (state.selectedDate && isSameDay(date, state.selectedDate)) {
        btn.setAttribute('aria-selected', 'true');
      }

      (function (d0) {
        btn.addEventListener('click', function () {
          selectDate(d0);
        });
      })(date);

      calDaysEl.appendChild(btn);
    }

    var isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    calPrevBtn.disabled = isCurrentMonth;
  }

  function selectDate(date) {
    state.selectedDate = date;
    state.selectedTime = null;
    renderCalendar();
    renderTimeSlots();
    updateSummary();
  }

  if (calPrevBtn) {
    calPrevBtn.addEventListener('click', function () {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
      renderCalendar();
    });
  }
  if (calNextBtn) {
    calNextBtn.addEventListener('click', function () {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Time slots (step 3)                                                  */
  /* ------------------------------------------------------------------ */
  var timeSlotsEl = document.getElementById('timeSlots');

  function renderTimeSlots() {
    if (!timeSlotsEl) return;
    timeSlotsEl.innerHTML = '';

    if (!state.selectedDate) {
      var msg = document.createElement('p');
      msg.className = 'booking__placeholder';
      msg.textContent = 'Selecione um dia para ver os horários.';
      timeSlotsEl.appendChild(msg);
      return;
    }

    var now = new Date();
    var isToday = isSameDay(state.selectedDate, today) && isSameDay(today, now);

    TIME_SLOTS.forEach(function (time) {
      var hour = parseInt(time.split(':')[0], 10);
      var isPast = isToday && hour <= now.getHours();

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time-slot';
      btn.textContent = time;
      btn.setAttribute('aria-selected', state.selectedTime === time ? 'true' : 'false');
      if (isPast) btn.disabled = true;

      btn.addEventListener('click', function () {
        selectTime(time);
      });

      timeSlotsEl.appendChild(btn);
    });
  }

  function selectTime(time) {
    state.selectedTime = time;
    Array.prototype.forEach.call(timeSlotsEl.querySelectorAll('.time-slot'), function (slot) {
      slot.setAttribute('aria-selected', slot.textContent === time ? 'true' : 'false');
    });
    updateSummary();
  }

  /* ------------------------------------------------------------------ */
  /* Summary + WhatsApp link                                             */
  /* ------------------------------------------------------------------ */
  var summaryEl = document.getElementById('bookingSummary');
  var whatsappSubmit = document.getElementById('whatsappSubmit');

  function formatDateLong(date) {
    return WEEKDAY_LABELS_FULL[date.getDay()] + ', ' + date.getDate() + ' de ' + MONTH_LABELS_FULL[date.getMonth()];
  }

  function buildWhatsappMessage() {
    var lines = ['Olá! Gostaria de agendar um horário na Prime Estética Automotiva.'];
    if (state.service && SERVICE_LABELS[state.service]) {
      lines.push('Serviço: ' + SERVICE_LABELS[state.service]);
    }
    if (state.selectedDate) {
      lines.push('Dia: ' + formatDateLong(state.selectedDate));
    }
    if (state.selectedTime) {
      lines.push('Horário: ' + state.selectedTime);
    }
    return lines.join('\n');
  }

  function updateSummary() {
    var hasAny = state.service || state.selectedDate || state.selectedTime;

    if (summaryEl) {
      if (!hasAny) {
        summaryEl.classList.remove('is-visible');
        summaryEl.innerHTML = '';
      } else {
        var parts = [];
        if (state.service && SERVICE_LABELS[state.service]) parts.push(SERVICE_LABELS[state.service]);
        if (state.selectedDate) parts.push(formatDateLong(state.selectedDate));
        if (state.selectedTime) parts.push(state.selectedTime);
        summaryEl.classList.add('is-visible');
        summaryEl.innerHTML = '<strong>Resumo:</strong> ' + parts.join(' · ');
      }
    }

    if (whatsappSubmit) {
      var text = buildWhatsappMessage();
      whatsappSubmit.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Mobile nav toggle                                                    */
  /* ------------------------------------------------------------------ */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });

    Array.prototype.forEach.call(mainNav.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Accordion (FAQ)                                                      */
  /* ------------------------------------------------------------------ */
  Array.prototype.forEach.call(document.querySelectorAll('.accordion__trigger'), function (trigger) {
    var panel = trigger.nextElementSibling;
    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.style.maxHeight = expanded ? '0px' : panel.scrollHeight + 'px';
    });
  });

  /* ------------------------------------------------------------------ */
  /* Floating WhatsApp button visibility                                 */
  /* ------------------------------------------------------------------ */
  var fab = document.getElementById('fabWhatsapp');
  var heroEl = document.querySelector('.hero');

  if (fab && heroEl && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        fab.classList.toggle('is-visible', !entry.isIntersecting && window.innerWidth <= 860);
      });
    }, { threshold: 0 });
    observer.observe(heroEl);
  }

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  var footerYearEl = document.getElementById('footerYear');
  if (footerYearEl) footerYearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ */
  /* Init                                                                 */
  /* ------------------------------------------------------------------ */
  renderCalendar();
  renderTimeSlots();
  updateSummary();
})();
