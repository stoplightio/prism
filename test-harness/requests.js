module.exports = [
  {
    path: '/pets',
    method: 'GET',
  },
  {
    path: '/pets?name=abc',
    method: 'GET',
  },
  {
    path: '/pets/findByStatus',
    method: 'GET',
  },
  {
    path: '/pets/findByStatus?status=pending',
    method: 'GET',
  },
];
