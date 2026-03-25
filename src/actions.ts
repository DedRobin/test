'use server';

async function getName() {
  const response = await fetch('https://swapi.dev/api/planets/1/');
  const data = await response.json();

  return data?.name || 'No data';
}

export { getName };
