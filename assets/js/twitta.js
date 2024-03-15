// On client
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwtToken='))
  .split('=')[1];

alert(`Token = ${token}`); // Token = 123

axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

