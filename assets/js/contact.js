/* contact.js — client-side validation and AJAX submit for the Formspree form.

   The form still has a working action/method, so with JavaScript disabled it
   submits normally to Formspree and the visitor gets Formspree's own page.
   This module only upgrades the experience when JS is available. */

const MESSAGES = {
  'field-name': 'Please tell me your name.',
  'field-email': "That doesn't look like an email address.",
  'field-subject': "What's this about?",
  'field-message': "Don't leave it blank.",
};

function showError(input, show) {
  const err = document.getElementById(`err-${input.id.replace('field-', '')}`);
  if (err) err.hidden = !show;
  input.setAttribute('aria-invalid', String(show));
  input.classList.toggle('is-invalid', show);
}

function validate(input) {
  const ok = input.checkValidity();
  showError(input, !ok);
  return ok;
}

export function initContact() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = [...form.querySelectorAll('input, textarea')];
  const status = form.querySelector('.form__status');
  const button = form.querySelector('button[type="submit"]');
  const label = form.querySelector('.form__label');

  // validate on blur, and clear the error as soon as it is fixed
  fields.forEach(input => {
    input.addEventListener('blur', () => validate(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) validate(input);
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const bad = fields.filter(f => !validate(f));
    if (bad.length) {
      bad[0].focus();
      status.textContent = `${bad.length} field${bad.length > 1 ? 's need' : ' needs'} attention.`;
      form.dataset.state = 'error';
      return;
    }

    form.dataset.state = 'pending';
    button.disabled = true;
    label.textContent = 'Sending…';
    status.textContent = '';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.reset();
      fields.forEach(f => showError(f, false));
      form.dataset.state = 'success';
      label.textContent = 'Sent';
      status.textContent = 'Thanks — I’ll get back to you soon.';
    } catch {
      form.dataset.state = 'error';
      label.textContent = 'Send';
      status.textContent =
        'Something went wrong. Email me directly at kishanraj427@gmail.com.';
    } finally {
      button.disabled = false;
      // let "Sent" stand for a moment before returning to the idle label
      if (form.dataset.state === 'success') {
        setTimeout(() => { label.textContent = 'Send'; }, 4000);
      }
    }
  });
}
