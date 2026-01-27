// Operation CRUD Methods

export const getEarliestOperationDate = async (): Promise<string | null> => {
  const response = await fetch('api/8/Operation/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: 1,
      order: 'ascending(startDate)',
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  if (data.objs && data.objs.length > 0) {
    return data.objs[0].startDate;
  } else {
    return null;
  }
};

export const getLatestEndDate = async (): Promise<string | null> => {
  const response = await fetch('api/8/Operation/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: 1,
      order: 'descending(endDate)',
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  if (data.objs && data.objs.length > 0) {
    return data.objs[0].endDate;
  } else {
    return null;
  }
};

export const fetchOperationsWithPagination = async (filter: string, pageSize: number, offset: number): Promise<any> => {
  const response = await fetch('api/8/Operation/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: filter || undefined,
      limit: pageSize,
      offset: offset,
      order: 'ascending(startDate), ascending(endDate)',
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return data.objs || [];
};

export const fetchCountWithFilter = async (filter: string): Promise<number> => {
  const response = await fetch('api/8/Operation/fetchCount', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: filter || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return data || 0;
};
