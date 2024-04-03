//client side
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwtToken='))
  .split('=')[1];

axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

const form = document.getElementById('createPostForm')

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  
  axios.post(formData.get('outbox'), {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'type': 'Note',
    'content': formData.get('content'),
    'attributedTo': formData.get('attributedTo'),
    'to': formData.get('to')
  }, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  }).then(({data}) => {
    console.log(data)
    document.getElementById('content').value = ''
    document.getElementById('feed').insertAdjacentHTML('afterbegin', `${data.object.content}<br>`);
  }).catch(error => {
    console.log(error);
  });
});

/*  start submit replies  */

const replyForms = document.querySelectorAll(".reply-form");

replyForms.forEach(form => {
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    alert('reply form submitted')
  })
})
