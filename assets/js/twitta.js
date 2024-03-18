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
  console.log(...formData)

  // above here is working

  axios.post('https://localhost:65380/orderedcollection/ncVI8nTvm0ZTXjxIrWkgL', {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'type': 'Note',
    'content': formData.get('content'),
    'attributedTo': formData.get('attributedTo'),
    'to': formData.get('to')
  }, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}).then(({data}) => console.log(data));

  // start from axios
/*
  axios({
    url: 'https://localhost:65380/orderedcollection/oKIVOg6PQTPq76MTPDTG-', 
    data: formData, 
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })
  */
  // end from axios
/*
  axios.post('https://localhost:65380/orderedcollection/oKIVOg6PQTPq76MTPDTG-', formData,
  { headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  */
 /*
    .then(response => {
      // Handle the response
      console.log(JSON.stringify(response, null, 2));
    })
    .catch(error => {
      // Handle the error
      console.log(error);
    });
    */
});
