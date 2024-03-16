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

  // start from axios

  axios({
    url: 'https://localhost:65380/orderedcollection/oKIVOg6PQTPq76MTPDTG-', 
    data: formData, 
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })
  // end from axios
/*
  axios.post('https://localhost:65380/orderedcollection/oKIVOg6PQTPq76MTPDTG-', formData,
  { headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  */
    .then(response => {
      // Handle the response
      console.log(JSON.stringify(response, null, 2));
    })
    .catch(error => {
      // Handle the error
      console.log(error);
    });
});
