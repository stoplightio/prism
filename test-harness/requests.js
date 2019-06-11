module.exports = [
  {
    path: '/no_auth/pets',
    method: 'GET',
  },
  {
    path: '/no_auth/pets?name=abc',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/findByStatus',
    method: 'GET',
  },
  {
    path: '/pets/findByStatus?status=pending',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/123',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/123',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "name=just_a_name"
  },
  {
    path: '/pets/123',
    method: 'PATCH',
    body: {
      name: 'a_new_name'
    }
  },
  {
    path: '/no_auth/pets/123?__code=404',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/123?__code=418',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/findByTags',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/findByStatus?status=available&status=sold',
    method: 'GET',
  },
  {
    path: '/user/username',
    method: 'GET',
  },
  {
    path: '/store/order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      body: {
        id: 1,
        petId: 2,
        quantity: 3,
        shipDate: '2002-10-02T10:00:00-05:00',
        status: 'placed',
        complete: true,
      }
    }
  },
  {
    path: '/no_auth/pets',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      id: 1,
      petId: 2,
      quantity: 3,
      shipDate: '2002-10-02T10:00:00-05:00',
      status: 'placed',
      complete: true,
    }
  },
  {
    path: '/no_auth/pets/123?__code=499',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/findByStatus?status=available&__code=499',
    method: 'GET',
  },
  {
    path: '/no_auth/pets/10',
    headers: {
      accept: 'application/idonotexist'
    },
    method: 'GET',
  },
  {
    path: '/pets/123',
    method: 'POST',
    headers: {
      'content-type': 'application/vnd.api+json'
    },
    body: JSON.stringify({
      hello: 'world'
    })
  }
];
