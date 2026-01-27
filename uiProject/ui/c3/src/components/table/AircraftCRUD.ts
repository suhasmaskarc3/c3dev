// Aircraft CRUD methods

export const fetchAircraftCountWithFilter = async (baseId: string, filter: string): Promise<number> => {
  /*
    TODO 4.1: Implement the fetchAircraftCountWithFilter function to retrieve the count of Aircraft Types
          at a specific Base matching the provided filter.  This function should send a POST request to the
          'api/8/Aircraft/fetchCount' endpoint with a filter that combines the baseId and the provided filter,
          and return the count of matching Aircraft Types.
  */

  const combinedFilter = `location.id == "${baseId}" && (${filter})`;

  const response = await fetch('api/8/Aircraft/fetchCount', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: combinedFilter,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return typeof data === 'number' ? data : (data.count || 0);
};

export const fetchAircraftWithPagination = async (baseId: string, pageSize: number, offset: number): Promise<any> => {
  /*
    TODO 5.1: Implement the fetchAircraftWithPagination function to retrieve a paginated list of Aircraft Types
          at a specific Base. This function should send a POST request to the 'api/8/Aircraft/fetch' endpoint
          with a filter for the specified baseId, and return the list of Aircraft Types.
          It should use the limit and offset arguments for pagination.
  */

  const response = await fetch('api/8/Aircraft/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: `location.id == "${baseId}"`,
      limit: pageSize,
      offset: offset,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return data.objs || [];
};

export const fetchAircraftSummary = async (aircraftId: string): Promise<string> => {
  try {
    const response = await fetch(`api/8/Aircraft/search?query=${encodeURIComponent(aircraftId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch aircraft summary');
    }

    const data = await response.json();
    
    // Handle different possible response formats
    if (typeof data === 'string') {
      return data;
    }
    
    if (data && typeof data === 'object') {
      if (data.summary) {
        return data.summary;
      }
      if (data.description) {
        return data.description;
      }
      if (data.info) {
        return data.info;
      }
      // If we got an object but no summary field, return a formatted string
      return JSON.stringify(data).substring(0, 100);
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching aircraft summary:', error);
    return '';
  }
};
