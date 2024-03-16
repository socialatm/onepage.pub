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

  const formData = new FormData(form);
  console.dir(...formData)

  // above here is working

  axios.post('https://localhost:65380/orderedcollection/oKIVOg6PQTPq76MTPDTG-', formData )
    .then(response => {
      // Handle the response
      console.log(JSON.stringify(response, null, 2));
    })
    .catch(error => {
      // Handle the error
      console.log(error);
    });
});
