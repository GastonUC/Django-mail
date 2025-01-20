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

  // Remove any previous evnet listener to prevent duplication
  // composeForm.removeEventListener('submit', submithandler);

  // Add submit event listener
  // composeForm.addEventListener('submit', submithandler);

  // submit handler function
  // function submithandler(event) {
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
  });
  // }
}

// TODO: Fix recipients display on setn mailbox
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
  .then(emails => {
    console.log(emails);

    const emailList = document.createElement('div');
    emailList.className = "email-box";

    emails.forEach(email => {
      const emailItem = document.createElement('div')
      emailItem.className = "list-group-item list-group-item-action";
      emailItem.style.cursor = "pointer";
      emailItem.steylebackgroundColor = email.read ? '#f0f0f0' : '#ffffff';
      emailItem.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
        ${mailbox === 'sent' ? `<div class="col-3"><strong>${email.recipients}</strong></div>` : `<div class="col-3"><strong>${email.sender}</strong></div>`}
          <div class="col-6">${email.subject}</div>
          <small class="col-3 text-right">${email.timestamp}</small>
        </div>
      `;
      emailItem.addEventListener('click',() => load_email(email.id, mailbox));
      emailList.append(emailItem);
    });

    document.querySelector('#emails-view').append(emailList);
  });
    // element.style.backgroundColor = email.read ? '#f0f0f0' : '#000000';
  //   element.innerHTML = `
  //       ${email.map(e => `
  //           <a href="#" class="list-group-item list-group-item-action" onclick="load_email(${e.id}, '${mailbox}')" style="background-color: ${e.read ? '#f0f0f0' : '#ffffff'}">
  //               <div class="d-flex w-100 justify-content-between align-items-center">
  //                   <div class="col-3"><strong>${e.sender}</strong></div>
  //                   <div class="col-6">${e.subject}</div>
  //                   <small class="col-3 text-right">${e.timestamp}</small>
  //               </div>
  //           </a>
  //       `).join('')}
  //   `;
  //   document.querySelector('#emails-view').append(element);
  // });
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

// TODO: Fix pre-fill format
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
      const replyBody = `
On ${email.timestamp} ${email.sender} wrote:
----------------------------------------
${email.body}
----------------------------------------
`;

      document.querySelector('#compose-body').value = replyBody.trim();
  })
}