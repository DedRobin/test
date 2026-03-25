'use client';

import { useState } from 'react';
import { getName } from './actions';

// import { useEffect, useState } from 'react';

export default function Page() {
  // const response = await fetch('https://swapi.dev/api/planets/1/');
  // const data = await response.json();
  // const [data, setData] = useState(null);
  // useEffect(() => {
  //   fetch('https://swapi.dev/api/planets/1/')
  //     .then((res) => res.json())
  //     .then((data) => setData(data));
  //   // const data = await response.json();
  // }, []);
  // return <div>{data?.name || 'No data'}</div>;
  const [name, setName] = useState('No name');
  const onClick = () => {
    getName().then((name) => setName(name));
  };
  return (
    <button
      style={{ color: 'white' }}
      onClick={onClick}
    >
      {name}
    </button>
  );
}
