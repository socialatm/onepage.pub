// On client
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwtToken='))
  .split('=')[1];

axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

const form = document.getElementById('createPostForm');
console.log(form);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData();
  formData.append('@context', document.getElementById('@context').value)
  formData.append('type', 'note')
  formData.append('attributedTo', document.getElementById('attributedTo').value)
  formData.append('content', document.getElementById('content').value)
  formData.append('to', document.getElementById('to').value)
  
  alert(formData.get('@context'))
  alert(formData.get('type'))
  alert(formData.get('attributedTo'))
  alert(formData.get('content'))
  alert(formData.get('to'))

  axios.post('https://localhost:65380/orderedcollection/oKIVOg6PQTPq76MTPDTG-', { FormData }, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .then(response => {
      // Handle the response
      console.log(JSON.stringify(response, null, 2));
    })
    .catch(error => {
      // Handle the error
      console.log(error);
    });
});
