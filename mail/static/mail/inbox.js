document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Get the form and the submit button
  const composeForm = document.querySelector('#compose-form');
  const submitButton = document.querySelector('#compose-form input[type="submit"]');

  // Remove any previous evnet listener to prevent duplication
  composeForm.removeEventListener('submit', submithandler);

  // Add submit event listener
  composeForm.addEventListener('submit', submithandler);

  // submit handler function
  function submithandler(event) {
    event.preventDefault();

    submitButton.disabled = true;
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result); // Only debugging
      load_mailbox('sent')
    })
    .catch(error => {
      console.error('Error:', error);
    })
    .finally(() => {
      submitButton.disabled = false;
    });
  }
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  const emailsView = document.querySelector('#emails-view');
  emailsView.style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear previous content in #emails-view
  emailsView.replaceChildren();
  
  // Show the mailbox name
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Display the emails in the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);

    //   const element = document.createElement('div');
    //   element.className = "email-box";
    //   document.querySelector('#emails-view').append(element);

    // First box view with elements not aligned horizontally
    //   element.innerHTML = email.map(e => `
    //     <div class="card mb-3 email-item" onclick="load_mail(${e.id})">
    //         <div class="card-body">
    //             <h6 class="card-subtitle mb-2 text-muted">From: ${e.sender}</h6>
    //             <h5 class="card-title">${e.subject}</h5>
    //             <p class="card-text text-muted">${e.timestamp}</p>
    //             <button class="btn btn-primary btn-sm me-2" onclick="replyToEmail(${e.id})">Reply</button>
    //         </div>
    //     </div>
    // `).join('');

    const element = document.createElement('div');
    element.className = "email-box";
    // element.style.backgroundColor = email.read ? '#f0f0f0' : '#000000';
    element.innerHTML = `
        ${email.map(e => `
            <a href="#" class="list-group-item list-group-item-action" onclick="load_email(${e.id}, '${mailbox}')" style="background-color: ${e.read ? '#f0f0f0' : '#ffffff'}">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="col-3"><strong>${e.sender}</strong></div>
                    <div class="col-6">${e.subject}</div>
                    <small class="col-3 text-right">${e.timestamp}</small>
                </div>
            </a>
        `).join('')}
    `;
    document.querySelector('#emails-view').append(element);
  });
}

function load_email(id, mailbox) {
  // Fetch the email details
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    // console.log(email);
    // console.log(id);

    const el = document.createElement('div');
    el.id = "full-view";
    document.querySelector('#emails-view').replaceChildren(el);

    const recipients = email.recipients.join(', ');

    el.innerHTML = `
          <div class="email-full">
              <h2>${email.subject}</h2>
              <div class="email-metadata">
                  <p><strong>From:</strong> ${email.sender}</p>
                  <p><strong>To:</strong> ${recipients}</p>
                  <p><strong>Date:</strong> ${email.timestamp}</p>
              </div>
              <hr>
              <div class="email-body">
                  <p>${email.body}</p>
              </div>
              <div class="email-actions mt-4">
                  <button class="btn btn-primary" onclick="reply_email(${email.id})">Reply</button>
                  ${mailbox !== 'sent' ? `
                    <button class="btn btn-secondary" id="archive-btn">${email.archived ? 'Unarchive' : 'Archive'}</button>
                    ` : ''}
                  <button class="btn btn-outline-primary" onclick="load_mailbox('inbox')">Back to Inbox</button>
              </div>
          </div>
      `;

      if (mailbox !== 'inbox') {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        });
      }

      if (mailbox !== 'sent') {
        document.querySelector("#archive-btn").addEventListener("click", () => {
          archive_email(email.id, !email.archived); // This will return the opposite state
          load_mailbox('inbox');
        });
      }
  });
}

function archive_email(id, archive_state) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archive_state
    })
  });
}

function reply_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      compose_email();
      document.querySelector("#compose-recipients").value = email.recipients;
      if (email.subject.slice(0, 4) === 'Re: ') {
        document.querySelector("#compose-subject").value = email.subject;
      } else {
        document.querySelector("#compose-subject").value = `Re: ${email.subject}`;
      }
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  })
}