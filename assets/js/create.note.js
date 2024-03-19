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
    document.getElementById('feed').innerHTML = data.object.content + '<br>' + document.getElementById('feed').innerHTML
  }).catch(error => {
    console.log(error);
  });
});
