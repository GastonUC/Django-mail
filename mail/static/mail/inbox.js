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
  emailsView.innerHTML = `<h3 id="boxTitle" class="p-3 border-bottom mb-0 h5">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Display the emails in the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    const emailList = document.createElement('div');
    emailList.className = "email-box";

    emails.forEach(email => {
      const emailItem = document.createElement('div')
      emailItem.className = "list-group-item border-start-0 border-end-0";
      if (mailbox === 'sent') {
        emailItem.style.backgroundColor = 'rgba(222, 222, 222, 0.4)';
      } else {
        emailItem.style.backgroundColor = email.read ? 'rgba(222, 222, 222, 0.4)' : '#fcfeff';
      }

      emailItem.innerHTML = `
                    <div class="row align-items-center py-2">
                        <div class="col-3 text-truncate">
                          <span class="text-secondary">${mailbox === 'sent' ? email.recipients : email.sender}</span>
                        </div>
                        <div class="col-6 text-truncate">
                            <span class="fw-medium">${email.subject}</span>
                        </div>
                        <div class="col-3 text-end">
                            <small class="text-muted">${email.timestamp}</small>
                        </div>
                    </div>
                `;

      // emailItem.innerHTML = `
      //   <div class="d-flex w-100 justify-content-between align-items-center">
      //     ${mailbox === 'sent'
      //       ? `<div class="col-3"><strong>${email.recipients}</strong></div>`
      //       : `<div class="col-3"><strong>${email.sender}</strong></div>`
      //     }
      //     <div class="col-6">${email.subject}</div>
      //     <small class="col-3 text-right text-muted">${email.timestamp}</small>
      //   </div>
      // `;

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
    <div class="bg-white rounded-3 shadow-sm p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h4 mb-0">${email.subject}</h2>
            <div>
                <button class="btn btn-outline-primary btn-sm" onclick="reply_email(${email.id})">Reply</button>
                ${mailbox !== 'sent' ? `
                <button class="btn btn-outline-secondary btn-sm" id="archive-btn">
                    ${email.archived ? 'Unarchive' : 'Archive'}
                </button>
                ` : ''}
            </div>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <div>
                        <strong>From:</strong> ${email.sender}
                    </div>
                    <div class="text-muted">
                        ${email.timestamp}
                    </div>
                </div>
                <div class="mb-3">
                    <strong>To:</strong> ${recipients}
                </div>
            </div>
        </div>
        <div class="email-body mb-4">
            ${body}
        </div>
        <div class="text-end">
            <button class="btn btn-secondary">Back to Inbox</button>
        </div>
    </div>
  `;

    // emailContainer.innerHTML = `
    //       <div class="email-full">
    //           <h2>${email.subject}</h2>
    //           <div class="email-metadata">
    //               <p><strong>From:</strong> ${email.sender}</p>
    //               <p><strong>To:</strong> ${recipients}</p>
    //               <p><strong>Date:</strong> ${email.timestamp}</p>
    //           </div>
    //           <hr>
    //           <div class="email-body">
    //               <p>${body}</p>
    //           </div>
    //           <div class="email-actions mt-4">
    //               <button class="btn btn-primary" onclick="reply_email(${email.id})">Reply</button>
    //               ${mailbox !== 'sent' ? `
    //                 <button class="btn btn-secondary" id="archive-btn">${email.archived ? 'Unarchive' : 'Archive'}</button>
    //                 ` : ''}
    //               <button class="btn btn-outline-primary" onclick="load_mailbox('inbox')">Back to Inbox</button>
    //           </div>
    //       </div>
    //   `;

    // Add event listener to the back button
    document.querySelector('.btn-secondary').addEventListener('click', () => load_mailbox('inbox'));

    // Mark email as read
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    });

    // If mailbox isn't 'sent', then add event listener to the archive button
    if (mailbox !== 'sent') {
      document.querySelector("#archive-btn").addEventListener("click", () => {
        archive_email(email.id, !email.archived); // This will return the opposite state
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
  load_mailbox('inbox');
}

function reply_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // open compose view
      compose_email();

      const user_email = document.querySelector('h2').textcontent;

      // Pre-fill composition fields
      // recept = email.recipients;
      // let rest_recipients = recept.slice(recept.indexOf(user_email));
      // const recipients = email.sender + rest_recipients.join(', ');
      // const recipients = email.recipients.join(', ');
      // document.querySelector("#compose-recipients").value = recipients;
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