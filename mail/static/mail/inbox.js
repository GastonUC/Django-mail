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

  // Send email
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault();
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(() => load_mailbox('sent'))
    .then(result => {
      // Print result
      console.log(result);
    });
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Display the emails in the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(email => {
      // Print emails
      console.log(email);
      console.log(email.length);

      for(let i = 0; i < email.length; i++) {
        const element = document.createElement('div');
        element.className = "email-box";
        document.querySelector('#emails-view').append(element);

        const p = document.createElement('p');
        const subject = document.createElement('p');
        const time = document.createElement('p');
        const button = document.createElement('button');

        p.innerHTML = email[i].sender;
        subject.innerHTML = email[i].subject;
        time.innerHTML = email[i].timestamp;
        // element.id = e.id; For now i don't need this
        // button.id = email[i].id;
        button.className = `View-${email[i].id}`;
        button.innerHTML = "View";
        button.value = email[i].id;
        element.appendChild(p);
        element.appendChild(subject);
        element.appendChild(time);
        element.appendChild(button);

        document.querySelector(`.View-${email[i].id}`).addEventListener('click', () => load_mail(email[i].id));
      }

      // ... do something else with emails ...
      // email.forEach(e => {
      //   const element = document.createElement('div');
      //   const body = document.createElement('p');
      //   const p = document.createElement('p');
      //   const time = document.createElement('p');
      //   const button = document.createElement('button');
      //   element.id = "email-box";
      //   body.innerHTML = e.subject;
      //   p.innerHTML = e.sender;
      //   time.innerHTML = e.timestamp;
      //   // element.id = e.id; For now i don't need this
      //   button.id = "show-email";
      //   button.innerHTML = "View";
      //   button.value = e.id;
      //   document.querySelector('#emails-view').append(element);
      //   document.querySelector('#email-box').appendChild(body);
      //   document.querySelector('#email-box').appendChild(p);
      //   document.querySelector('#email-box').appendChild(time);
      //   document.querySelector('#email-box').appendChild(button);

      //   document.querySelector('#show-email').addEventListener('click', () => load_mail(e.id));
      // });
  });
}

function load_mail(id) {

  // Create a new div to display the email
  bigDiv = document.createElement('div');
  bigDiv.id = "full-view";
  document.querySelector
  document.querySelector('#emails-view').replaceChildren(bigDiv);
  

  // Show the email and hide other views
  // document.querySelector('#emails-view').style.display = 'block';
  // document.querySelector('#compose-view').style.display = 'none';
  // document.querySelector('#full-view').style.display = 'block';

  // Display the email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    console.log(email);
    console.log(id);

    // ... do something else with email ...
    const element = document.createElement('div');
    element.id = "full-view";
    document.querySelector('#full-view').append(element);

    const from = document.createElement('p');
    const to = document.createElement('p');
    const body = document.createElement('p');
    const timestamp = document.createElement('p');

    element.innerHTML = `<h3>Subject: ${email.subject}</h3>`;
    from.innerHTML = `<strong>From:</strong> ${email.sender}`;
    to.innerHTML = `<strong>To:</strong> ${email.recipients}`;
    body.innerHTML = `<strong>Body:</strong> ${email.body}`;
    timestamp.innerHTML = `<strong>Timestamp:</strong> ${email.timestamp}`;
    
    element.appendChild(from);
    element.appendChild(to);
    element.appendChild(body);
    element.appendChild(timestamp);
  });
}