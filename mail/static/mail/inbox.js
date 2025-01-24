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

  // Clean up any existing event listeners to prevent duplication
  const newComposeForm = composeForm.cloneNode(true);
  composeForm.parentNode.replaceChild(newComposeForm, composeForm);

  newComposeForm.addEventListener('submit', function submithandler(event) {
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
      load_mailbox('sent');
    })
    .catch(error => {
      console.error('Error:', error);
    })
    .finally(() => {
      submitButton.disabled = false;
    });
  });
  // }
}

function load_mailbox(mailbox) {
  const emailsView = document.querySelector('#emails-view');

  // Show the mailbox and hide other views
  emailsView.style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear previous content in #emails-view
  emailsView.replaceChildren();
  
  // Show the mailbox name
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Display the emails in the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    const emailList = document.createElement('div');
    emailList.className = "email-box";

    emails.forEach(email => {
      const emailItem = document.createElement('div')
      emailItem.className = "list-group-item list-group-item-action";
      emailItem.style.backgroundColor = email.read ? '#dedede' : '#f9fafb';

      emailItem.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
          ${mailbox === 'sent'
            ? `<div class="col-3"><strong>${email.recipients}</strong></div>`
            : `<div class="col-3"><strong>${email.sender}</strong></div>`
          }
          <div class="col-6">${email.subject}</div>
          <small class="col-3 text-right text-muted">${email.timestamp}</small>
        </div>
      `;

      emailItem.addEventListener('click',() => load_email(email.id, mailbox));
      emailList.append(emailItem);
    });

    document.querySelector('#emails-view').append(emailList);
  });
}

function load_email(id, mailbox) {
  // Fetch the email details
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    const emailContainer = document.createElement('div');
    emailContainer.id = "full-view";
    document.querySelector('#emails-view').replaceChildren(emailContainer);

    const recipients = email.recipients.join(', ');

    let body = email.body;
    body = body.replace(/\n/g, "<br>");

    emailContainer.innerHTML = `
          <div class="email-full">
              <h2>${email.subject}</h2>
              <div class="email-metadata">
                  <p><strong>From:</strong> ${email.sender}</p>
                  <p><strong>To:</strong> ${recipients}</p>
                  <p><strong>Date:</strong> ${email.timestamp}</p>
              </div>
              <hr>
              <div class="email-body">
                  <p>${body}</p>
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
      // open compose view
      compose_email();

      // Pre-fill composition fields
      document.querySelector("#compose-recipients").value = email.sender;
      const subjectPrefix = 'Re: ';
      document.querySelector("#compose-subject").value = email.subject.startsWith(subjectPrefix) 
      ? email.subject 
      : `${subjectPrefix}${email.subject}`;

      // reply format body
      const body = email.body;
      const divider = "----------------------------------------";
      const dividerReg = /-{40,}/;
      const separatorReg = /(?<!\n)(?=\S)----------------------------------------/g;
      const header = `On ${email.timestamp} ${email.sender} wrote:\n`

      let lastReply;
      let remainingBody;

      // the condition is based on the test of the regex
      if (dividerReg.test(body)) {
        lastReply = body.slice(0, body.indexOf(divider)).trim();
        remainingBody = body.slice(body.indexOf(divider)).trim();
        if (separatorReg.test(remainingBody)) {
          remainingBody = remainingBody.replace(separatorReg, "\n----------------------------------------");
        }
        document.querySelector("#compose-body").value = `\n\n${divider}\n${header}${lastReply}${remainingBody}`;
      } else {
        document.querySelector("#compose-body").value = `\n\n${divider}\n${header}${body}`;
      }
  })
}