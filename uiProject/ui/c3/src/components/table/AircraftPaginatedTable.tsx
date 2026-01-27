import React, { useEffect, useState } from 'react';

import LoadingAnimation from '@c3/app/ui/src/components/misc/LoadingAnimation';
import ErrorModal from '@c3/app/ui/src/components/misc/ErrorModal';
import PageButton from '@c3/app/ui/src/components/table/PageButton';
import { Aircraft } from '@c3/types';
import { fetchAircraftWithPagination } from '@c3/app/ui/src/components/CRUDMethods/AircraftCRUD';

interface AircraftPaginatedTableProps {
  baseId: string;
}

const AircraftPaginatedTable = ({ baseId }: AircraftPaginatedTableProps) => {
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [aircraftData, setAircraftData] = useState<Aircraft[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const tableHeaders = ['ID', 'Model', 'Registration Number', 'Status', 'Summary'];

  useEffect(() => {
    const loadPaginatedAircraft = async () => {
      setLoading(true);

      try {
        /*
          TODO 5.2.2: Call the fetchAircraftWithPagination function with the appropriate parameters
                to retrieve the paginated list of Aircraft Types for the specified baseId.
                Update the component state with the retrieved data.
        */
        const aircraftList = await fetchAircraftWithPagination(baseId, pageSize, page * pageSize);
        setAircraftData(aircraftList);
      } catch (error) {
        console.error('Error occurred fetching paginated data: ', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPaginatedAircraft();
  }, [page, pageSize]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorModal errorMessage={error} />;
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Inter, Helvetica Neue, Arial, Helvetica, sans-serif',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#fafafa' }}>
            {tableHeaders.map((header) => {
              return (
                <th
                  key={header}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#555',
                    borderBottom: '1px solid #e5e5e5',
                  }}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {aircraftData &&
            aircraftData.map((ac) => {
              return (
                <tr key={ac.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{ac.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{ac.model}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>
                    {ac.registrationNumber || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{ac.status}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>
                    {ac.model} • {ac.status} • {ac.lastInspectionDate ? new Date(ac.lastInspectionDate).toLocaleDateString() : 'No inspection date'}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderTop: '1px solid #e5e5e5',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: '#666' }}>Rows per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            style={{
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <PageButton updateCurrentPage={() => setPage((prev) => prev - 1)} disabled={page === 0} icon="‹" />
          <span style={{ fontSize: '13px', color: '#666' }}>{page + 1}</span>
          <PageButton
            updateCurrentPage={() => setPage((prev) => prev + 1)}
            disabled={!aircraftData || aircraftData.length < pageSize}
            icon="›"
          />
        </div>
      </div>
    </div>
  );
};

export default AircraftPaginatedTable;
