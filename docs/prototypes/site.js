// CodedDevs prototype behaviour: mobile menu and inquiry form states only.
// Plain JavaScript, no dependencies. Mirrors the behaviour in docs/design.md.
(function () {
  'use strict';

  // ---------- Mobile menu ----------
  var root = document.querySelector('[data-menu-root]');
  if (root) {
    var toggle = root.querySelector('[data-menu-toggle]');
    var sheet = root.querySelector('[data-menu-sheet]');
    var label = toggle.querySelector('[data-menu-label]');
    var desktop = window.matchMedia('(min-width: 75rem)');

    var setOpen = function (open, returnFocus) {
      sheet.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Close' : 'Menu';
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = sheet.querySelector('a');
        if (first) first.focus();
      } else if (returnFocus) {
        toggle.focus();
      }
    };

    toggle.addEventListener('click', function () {
      setOpen(sheet.hidden, false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !sheet.hidden) {
        event.preventDefault();
        setOpen(false, true);
      }
    });
    // No focus trap: leaving the toggle and sheet closes the menu.
    root.addEventListener('focusout', function (event) {
      if (event.relatedTarget && !root.contains(event.relatedTarget)) {
        setOpen(false, false);
      }
    });
    sheet.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false, false);
    });
    desktop.addEventListener('change', function () {
      if (desktop.matches) setOpen(false, false);
    });
  }

  // ---------- Inquiry form ----------
  // Rules match POST /api/v1/public/inquiries (docs/inquiries-and-settings.md).
  var rules = {
    name: function (v) {
      var n = Array.from(v.trim()).length;
      if (n === 0) return 'Enter your name.';
      if (n < 2) return 'Name must be at least 2 characters.';
      if (n > 200) return 'Name must be 200 characters or fewer.';
      return '';
    },
    email: function (v) {
      var t = v.trim();
      if (t.length === 0) return 'Enter your email address.';
      if (t.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
        return 'Enter an email address like name@company.com.';
      }
      return '';
    },
    company: function (v) {
      return v.trim().length > 200
        ? 'Company must be 200 characters or fewer.'
        : '';
    },
    message: function (v) {
      var n = Array.from(v.trim()).length;
      if (n === 0) return 'Enter a message.';
      if (n < 20) return 'Message must be at least 20 characters.';
      if (n > 5000) return 'Message must be 5,000 characters or fewer.';
      return '';
    },
  };

  var forms = document.querySelectorAll('[data-inquiry-form]');
  Array.prototype.forEach.call(forms, function (form) {
    var wrap = form.closest('[data-inquiry]');
    var summary = wrap.querySelector('[data-form-summary]');
    var summaryList = summary.querySelector('ul');
    var summaryTitle = summary.querySelector('[data-summary-title]');
    var success = wrap.querySelector('[data-form-success]');
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit.textContent;

    var showFieldError = function (input, message) {
      var error = document.getElementById(input.id + '-error');
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      error.hidden = !message;
      error.querySelector('[data-error-text]').textContent = message;
    };

    var validate = function () {
      var problems = [];
      Object.keys(rules).forEach(function (name) {
        var input = form.elements[name];
        var message = rules[name](input.value);
        showFieldError(input, message);
        if (message) problems.push({ input: input, message: message });
      });
      return problems;
    };

    // Re-check a field once it has been marked invalid.
    form.addEventListener('input', function (event) {
      var input = event.target;
      if (rules[input.name] && input.getAttribute('aria-invalid') === 'true') {
        showFieldError(input, rules[input.name](input.value));
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (submit.getAttribute('aria-busy') === 'true') return;
      var problems = validate();
      if (problems.length > 0) {
        summaryTitle.textContent =
          problems.length === 1
            ? 'Check 1 field and send again.'
            : 'Check ' + problems.length + ' fields and send again.';
        summaryList.innerHTML = '';
        problems.forEach(function (problem) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + problem.input.id;
          a.className = 'link';
          a.textContent = problem.message;
          a.addEventListener('click', function (e) {
            e.preventDefault();
            problem.input.focus();
          });
          li.appendChild(a);
          summaryList.appendChild(li);
        });
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;

      // Prototype only: simulate the request.
      submit.setAttribute('aria-busy', 'true');
      submit.innerHTML =
        '<span class="spinner" aria-hidden="true"></span>Sending';
      window.setTimeout(function () {
        submit.removeAttribute('aria-busy');
        submit.textContent = submitLabel;
        form.hidden = true;
        success.hidden = false;
        success.querySelector('h3').focus();
      }, 1200);
    });

    var again = wrap.querySelector('[data-form-reset]');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        Object.keys(rules).forEach(function (name) {
          showFieldError(form.elements[name], '');
        });
        success.hidden = true;
        form.hidden = false;
        form.elements.name.focus();
      });
    }
  });
})();
