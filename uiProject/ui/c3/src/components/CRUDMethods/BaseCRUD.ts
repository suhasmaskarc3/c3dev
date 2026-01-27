// Base CRUD Methods

export const fetchBaseById = async (baseId: string): Promise<any> => {
  /*
    TODO 3.2: Implement the fetchBaseById function to retrieve a Base by its ID.
          This function should send a POST request to the 'api/8/Base/fetch' endpoint
          with a filter for the specified baseId, and return the Base object.
  */

  const response = await fetch('api/8/Base/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: `id == "${baseId}"`,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return data.objs ? data.objs[0] : null;
};

export const fetchAllBases = async (): Promise<any[]> => {
  const response = await fetch('api/8/Base/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return data.objs || [];
};

export const getUniqueBaseIds = async (): Promise<string[]> => {
  const response = await fetch('api/8/Base/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: -1,
      include: 'id',
      order: 'ascending(id)',
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  const baseIds = data.objs ? data.objs.map((base: any) => base.id) : [];
  return Array.from(new Set(baseIds));
};
