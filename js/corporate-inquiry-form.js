(function () {
  var form = document.querySelector('.corporate-inquiry-form');

  if (!form) {
    return;
  }

  var submitButton = form.querySelector('button[type="submit"]');
  var validationMessage = form.querySelector('.corporate-inquiry-form__validation');
  var replyToInput = form.querySelector('input[name="_replyto"]');
  var emailInput = form.querySelector('input[name="email"]');
  var companyInput = form.querySelector('input[name="Įmonės pavadinimas"]');
  var subjectInput = form.querySelector('[data-subject-field]');
  var dateInput = form.querySelector('[data-date-field]');
  var dateSubmitInput = form.querySelector('[data-date-submit]');
  var lithuanianMonthsGenitive = [
    'sausio',
    'vasario',
    'kovo',
    'balandžio',
    'gegužės',
    'birželio',
    'liepos',
    'rugpjūčio',
    'rugsėjo',
    'spalio',
    'lapkričio',
    'gruodžio'
  ];

  function setMessage(message, type) {
    if (type === 'error') {
      validationMessage.innerHTML = message || '';
    } else {
      validationMessage.textContent = message || '';
    }
    validationMessage.classList.remove('is-success', 'is-error');

    if (type) {
      validationMessage.classList.add('is-' + type);
    }
  }

  function formatLithuanianDate(dateObject) {
    if (!dateObject) {
      return '';
    }

    return dateObject.year + ' m. ' + lithuanianMonthsGenitive[dateObject.month] + ' ' + dateObject.date + ' d.';
  }

  function setDateValue(dateObject) {
    var formattedDate = formatLithuanianDate(dateObject);

    if (dateInput) {
      dateInput.value = formattedDate;
      dateInput.setCustomValidity('');
    }

    if (dateSubmitInput) {
      dateSubmitInput.value = formattedDate;
    }
  }

  function validateDate() {
    var hasDate = dateSubmitInput && dateSubmitInput.value.trim().length > 0;

    if (dateInput) {
      dateInput.setCustomValidity(hasDate ? '' : 'Pasirinkite renginio datą.');
    }

    return hasDate;
  }

  function clearInvalidState(input) {
    if (input) {
      input.classList.remove('is-invalid');
    }
  }

  function markInvalid(input) {
    if (input) {
      input.classList.add('is-invalid');
    }
  }

  function validateFormFields() {
    var requiredFields = form.querySelectorAll('[required]');
    var firstInvalidField = null;

    requiredFields.forEach(function (field) {
      clearInvalidState(field);

      if (!field.checkValidity()) {
        markInvalid(field);

        if (!firstInvalidField) {
          firstInvalidField = field;
        }
      }
    });

    if (!validateDate() && dateInput) {
      markInvalid(dateInput);

      if (!firstInvalidField) {
        firstInvalidField = dateInput;
      }
    }

    if (firstInvalidField) {
      setMessage('Užpildykite trūkstamą informaciją.', 'error');
      firstInvalidField.focus();
      return false;
    }

    return true;
  }

  function initDatePicker() {
    if (!dateInput || !window.jQuery || !window.jQuery.fn.pickadate) {
      return;
    }

    var $dateInput = window.jQuery(dateInput);

    $dateInput.pickadate({
      monthsFull: [
        'Sausis',
        'Vasaris',
        'Kovas',
        'Balandis',
        'Gegužė',
        'Birželis',
        'Liepa',
        'Rugpjūtis',
        'Rugsėjis',
        'Spalis',
        'Lapkritis',
        'Gruodis'
      ],
      monthsShort: [
        'Sau',
        'Vas',
        'Kov',
        'Bal',
        'Geg',
        'Bir',
        'Lie',
        'Rgp',
        'Rgs',
        'Spa',
        'Lap',
        'Gru'
      ],
      weekdaysFull: [
        'Sekmadienis',
        'Pirmadienis',
        'Antradienis',
        'Trečiadienis',
        'Ketvirtadienis',
        'Penktadienis',
        'Šeštadienis'
      ],
      weekdaysShort: ['Sek', 'Pir', 'Ant', 'Tre', 'Ket', 'Pen', 'Šeš'],
      weekdaysLetter: ['S', 'P', 'A', 'T', 'K', 'P', 'Š'],
      today: 'Šiandien',
      clear: 'Išvalyti',
      close: 'Gerai',
      labelMonthNext: 'Kitas mėnuo',
      labelMonthPrev: 'Ankstesnis mėnuo',
      labelMonthSelect: 'Pasirinkite mėnesį',
      labelYearSelect: 'Pasirinkite metus',
      firstDay: 1,
      selectMonths: true,
      selectYears: 3,
      min: true,
      format: 'yyyy m. mmmm d d.',
      onSet: function (context) {
        if (context.clear) {
          setDateValue(null);
          return;
        }

        if (context.select) {
          setDateValue(this.get('select'));

          window.setTimeout(function () {
            var picker = $dateInput.pickadate('picker');

            if (picker) {
              picker.close();
            }
          }, 0);
        }
      }
    });
  }

  function setLoading(isLoading) {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Siunčiama...' : 'Gauti pasiūlymą';
  }

  function updateSubject() {
    if (!subjectInput) {
      return;
    }

    var company = companyInput && companyInput.value.trim() ? companyInput.value.trim() : 'be įmonės';
    var eventDate = dateSubmitInput && dateSubmitInput.value.trim() ? dateSubmitInput.value.trim() : 'be datos';

    subjectInput.value = 'Nauja įmonių renginio užklausa – ' + company + ' – ' + eventDate + ' – DOKI POKI';
  }

  function pushTrackingEvent() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'corporate_inquiry_form_submit'
    });
  }

  form.querySelectorAll('input, textarea').forEach(function (input) {
    input.addEventListener('input', function () {
      clearInvalidState(input);
    });
  });

  initDatePicker();

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    setMessage('', null);

    if (!validateFormFields()) {
      return;
    }

    if (replyToInput && emailInput) {
      replyToInput.value = emailInput.value.trim();
    }

    updateSubject();

    setLoading(true);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: {
        Accept: 'application/json'
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Form submission failed');
        }

        return response.json();
      })
      .then(function () {
        form.reset();
        setDateValue(null);
        pushTrackingEvent();
        setMessage(form.getAttribute('data-success-message'), 'success');
      })
      .catch(function () {
        setMessage(form.getAttribute('data-error-message'), 'error');
      })
      .finally(function () {
        setLoading(false);
      });
  });
}());
